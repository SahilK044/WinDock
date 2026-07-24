using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;

public static class GenieEffect
{
    #region Win32 API Definitions

    private const uint EVENT_SYSTEM_MINIMIZESTART = 0x0016;
    private const uint EVENT_SYSTEM_MINIMIZEEND = 0x0017;
    private const uint WINEVENT_OUTOFCONTEXT = 0x0000;
    private const uint WINEVENT_SKIPOWNPROCESS = 0x0002;

    private delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

    [DllImport("user32.dll")]
    private static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

    [DllImport("user32.dll")]
    private static extern bool UnhookWinEvent(IntPtr hWinEventHook);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("dwmapi.dll")]
    private static extern int DwmRegisterThumbnail(IntPtr hwndDestination, IntPtr hwndSource, out IntPtr phThumbnailId);

    [DllImport("dwmapi.dll")]
    private static extern int DwmUnregisterThumbnail(IntPtr hThumbnailId);

    [DllImport("dwmapi.dll")]
    private static extern int DwmUpdateThumbnailProperties(IntPtr hThumbnailId, ref DWM_THUMBNAIL_PROPERTIES ptnProperties);

    [StructLayout(LayoutKind.Sequential)]
    private struct DWM_THUMBNAIL_PROPERTIES
    {
        public uint dwFlags;
        public RECT rcDestination;
        public RECT rcSource;
        public byte opacity;
        public bool fVisible;
        public bool fSourceClientAreaOnly;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    private const uint DWM_TNS_RECTDESTINATION = 0x00000001;
    private const uint DWM_TNS_OPACITY = 0x00000004;
    private const uint DWM_TNS_VISIBLE = 0x00000008;

    #endregion

    private static IntPtr _hook;
    private static WinEventDelegate _winEventDelegate;
    private static Func<IntPtr, Rect?> _iconRectResolver;
    private static Window _mainDockWindow;
    private static Window _overlayWindow;
    private static readonly HashSet<IntPtr> _animatingHwnds = new HashSet<IntPtr>();

    public static void Initialize(Window animHostWindow, Func<IntPtr, Rect?> iconRectResolver)
    {
        _mainDockWindow = animHostWindow;
        _iconRectResolver = iconRectResolver;

        _winEventDelegate = new WinEventDelegate(WinEventCallback);
        _hook = SetWinEventHook(
            EVENT_SYSTEM_MINIMIZESTART,
            EVENT_SYSTEM_MINIMIZEEND,
            IntPtr.Zero,
            _winEventDelegate,
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS
        );
    }

    public static void Shutdown()
    {
        if (_hook != IntPtr.Zero)
        {
            UnhookWinEvent(_hook);
            _hook = IntPtr.Zero;
        }
        if (_overlayWindow != null)
        {
            try { _overlayWindow.Close(); } catch { }
            _overlayWindow = null;
        }
    }

    private static Window EnsureOverlayWindow()
    {
        if (_overlayWindow == null)
        {
            _overlayWindow = new Window
            {
                WindowStyle = WindowStyle.None,
                AllowsTransparency = true,
                Background = System.Windows.Media.Brushes.Transparent,
                ShowInTaskbar = false,
                Topmost = true,
                Left = SystemParameters.VirtualScreenLeft,
                Top = SystemParameters.VirtualScreenTop,
                Width = SystemParameters.VirtualScreenWidth,
                Height = SystemParameters.VirtualScreenHeight
            };
            new WindowInteropHelper(_overlayWindow).EnsureHandle();
        }
        if (!_overlayWindow.IsVisible)
        {
            _overlayWindow.Show();
        }
        return _overlayWindow;
    }

    private static void WinEventCallback(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
    {
        if (hwnd == IntPtr.Zero || _mainDockWindow == null) return;

        if (eventType == EVENT_SYSTEM_MINIMIZESTART)
        {
            _mainDockWindow.Dispatcher.BeginInvoke((Action)(() =>
            {
                PlayMinimizeAnimation(hwnd);
            }));
        }
    }

    public static void PlayMinimizeAnimation(IntPtr targetHwnd, Action onCompleted = null)
    {
        if (targetHwnd == IntPtr.Zero || _mainDockWindow == null)
        {
            onCompleted?.Invoke();
            return;
        }

        IntPtr dockHwnd = new WindowInteropHelper(_mainDockWindow).Handle;
        if (targetHwnd == dockHwnd) return;

        lock (_animatingHwnds)
        {
            if (_animatingHwnds.Contains(targetHwnd)) return;
            _animatingHwnds.Add(targetHwnd);
        }

        void Finish()
        {
            lock (_animatingHwnds) { _animatingHwnds.Remove(targetHwnd); }
            onCompleted?.Invoke();
        }

        if (!GetWindowRect(targetHwnd, out RECT winRect) || (winRect.Right - winRect.Left < 10))
        {
            ShowWindow(targetHwnd, 6); // SW_MINIMIZE
            Finish();
            return;
        }

        Rect? targetIconRect = _iconRectResolver?.Invoke(targetHwnd);
        Rect destIconRect = targetIconRect.HasValue
            ? targetIconRect.Value
            : new Rect(SystemParameters.PrimaryScreenWidth / 2.0 - 24, SystemParameters.PrimaryScreenHeight - 60, 48, 48);

        Window overlay = EnsureOverlayWindow();
        IntPtr overlayHwnd = new WindowInteropHelper(overlay).Handle;

        if (overlayHwnd != IntPtr.Zero && DwmRegisterThumbnail(overlayHwnd, targetHwnd, out IntPtr hThumbnail) == 0)
        {
            DWM_THUMBNAIL_PROPERTIES props = new DWM_THUMBNAIL_PROPERTIES
            {
                dwFlags = DWM_TNS_RECTDESTINATION | DWM_TNS_OPACITY | DWM_TNS_VISIBLE,
                rcDestination = winRect,
                opacity = 255,
                fVisible = true
            };
            DwmUpdateThumbnailProperties(hThumbnail, ref props);

            int elapsedMs = 0;
            int durationMs = 240;
            DispatcherTimer timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(16) };

            timer.Tick += (s, e) =>
            {
                elapsedMs += 16;
                double t = Math.Min(1.0, (double)elapsedMs / durationMs);

                // Authentic macOS Genie curve equation (quadratic X, cubic Y for suction effect)
                double easeY = t * t * t;
                double easeX = t * t;

                int curLeft = (int)(winRect.Left + (destIconRect.Left - winRect.Left) * easeX);
                int curTop = (int)(winRect.Top + (destIconRect.Top - winRect.Top) * easeY);
                int curRight = (int)(winRect.Right + (destIconRect.Right - winRect.Right) * easeX);
                int curBottom = (int)(winRect.Bottom + (destIconRect.Bottom - winRect.Bottom) * easeY);

                props.rcDestination = new RECT { Left = curLeft, Top = curTop, Right = curRight, Bottom = curBottom };
                props.opacity = (byte)(255 * (1.0 - t * 0.25));
                DwmUpdateThumbnailProperties(hThumbnail, ref props);

                if (t >= 1.0)
                {
                    timer.Stop();
                    DwmUnregisterThumbnail(hThumbnail);
                    ShowWindow(targetHwnd, 6); // SW_MINIMIZE
                    overlay.Hide();
                    Finish();
                }
            };
            timer.Start();
        }
        else
        {
            ShowWindow(targetHwnd, 6); // SW_MINIMIZE
            Finish();
        }
    }

    public static void PlayRestoreAnimation(IntPtr targetHwnd, Action onCompleted = null)
    {
        if (targetHwnd == IntPtr.Zero || _mainDockWindow == null)
        {
            onCompleted?.Invoke();
            return;
        }

        IntPtr dockHwnd = new WindowInteropHelper(_mainDockWindow).Handle;
        if (targetHwnd == dockHwnd) return;

        lock (_animatingHwnds)
        {
            if (_animatingHwnds.Contains(targetHwnd)) return;
            _animatingHwnds.Add(targetHwnd);
        }

        void Finish()
        {
            lock (_animatingHwnds) { _animatingHwnds.Remove(targetHwnd); }
            onCompleted?.Invoke();
        }

        Rect? targetIconRect = _iconRectResolver?.Invoke(targetHwnd);
        Rect startIconRect = targetIconRect.HasValue
            ? targetIconRect.Value
            : new Rect(SystemParameters.PrimaryScreenWidth / 2.0 - 24, SystemParameters.PrimaryScreenHeight - 60, 48, 48);

        ShowWindow(targetHwnd, 4); // SW_SHOWNOACTIVATE to unhide for DWM capture

        if (!GetWindowRect(targetHwnd, out RECT finalWinRect))
        {
            ShowWindow(targetHwnd, 9); // SW_RESTORE
            SetForegroundWindow(targetHwnd);
            Finish();
            return;
        }

        Window overlay = EnsureOverlayWindow();
        IntPtr overlayHwnd = new WindowInteropHelper(overlay).Handle;

        if (overlayHwnd != IntPtr.Zero && DwmRegisterThumbnail(overlayHwnd, targetHwnd, out IntPtr hThumbnail) == 0)
        {
            DWM_THUMBNAIL_PROPERTIES props = new DWM_THUMBNAIL_PROPERTIES
            {
                dwFlags = DWM_TNS_RECTDESTINATION | DWM_TNS_OPACITY | DWM_TNS_VISIBLE,
                rcDestination = new RECT { Left = (int)startIconRect.Left, Top = (int)startIconRect.Top, Right = (int)startIconRect.Right, Bottom = (int)startIconRect.Bottom },
                opacity = 180,
                fVisible = true
            };
            DwmUpdateThumbnailProperties(hThumbnail, ref props);

            int elapsedMs = 0;
            int durationMs = 240;
            DispatcherTimer timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(16) };

            timer.Tick += (s, e) =>
            {
                elapsedMs += 16;
                double t = Math.Min(1.0, (double)elapsedMs / durationMs);

                // Inverse ease out for restore expansion
                double ease = 1.0 - Math.Pow(1.0 - t, 3);

                int curLeft = (int)(startIconRect.Left + (finalWinRect.Left - startIconRect.Left) * ease);
                int curTop = (int)(startIconRect.Top + (finalWinRect.Top - startIconRect.Top) * ease);
                int curRight = (int)(startIconRect.Right + (finalWinRect.Right - startIconRect.Right) * ease);
                int curBottom = (int)(startIconRect.Bottom + (finalWinRect.Bottom - startIconRect.Bottom) * ease);

                props.rcDestination = new RECT { Left = curLeft, Top = curTop, Right = curRight, Bottom = curBottom };
                props.opacity = (byte)(180 + (255 - 180) * ease);
                DwmUpdateThumbnailProperties(hThumbnail, ref props);

                if (t >= 1.0)
                {
                    timer.Stop();
                    DwmUnregisterThumbnail(hThumbnail);
                    ShowWindow(targetHwnd, 9); // SW_RESTORE
                    SetForegroundWindow(targetHwnd);
                    overlay.Hide();
                    Finish();
                }
            };
            timer.Start();
        }
        else
        {
            ShowWindow(targetHwnd, 9); // SW_RESTORE
            SetForegroundWindow(targetHwnd);
            Finish();
        }
    }
}
