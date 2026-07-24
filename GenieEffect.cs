using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

public static class GenieEffect
{
    #region Win32 API Definitions

    private const uint EVENT_SYSTEM_MINIMIZESTART = 0x0016;
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

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool GetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT lpwndpl);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SystemParametersInfo(uint uiAction, uint uiParam, ref ANIMATIONINFO pvParam, uint fWinIni);

    [DllImport("user32.dll")]
    private static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);
    private const uint GA_ROOTOWNER = 3;

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

    [StructLayout(LayoutKind.Sequential)]
    private struct WINDOWPLACEMENT
    {
        public int length;
        public int flags;
        public int showCmd;
        public POINT ptMinPosition;
        public POINT ptMaxPosition;
        public RECT rcNormalPosition;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct ANIMATIONINFO
    {
        public uint cbSize;
        public int iMinAnimate;
    }

    private const uint SPI_GETANIMATION = 0x0048;
    private const uint SPI_SETANIMATION = 0x0049;
    private const uint SPIF_UPDATEINIFILE = 0x01;
    private const uint SPIF_SENDCHANGE = 0x02;

    private const uint DWM_TNS_RECTDESTINATION = 0x00000001;
    private const uint DWM_TNS_RECTSOURCE = 0x00000002;
    private const uint DWM_TNS_OPACITY = 0x00000004;
    private const uint DWM_TNS_VISIBLE = 0x00000008;

    #endregion

    private const int SLICE_COUNT = 8;

    private static IntPtr _hook;
    private static WinEventDelegate _winEventDelegate;
    private static Func<IntPtr, Rect?> _iconRectResolver;
    private static Window _mainDockWindow;
    private static Window _overlayWindow;
    private static readonly HashSet<IntPtr> _animatingHwnds = new HashSet<IntPtr>();
    private static readonly HashSet<IntPtr> _ignoreMinimizes = new HashSet<IntPtr>();
    private static bool _isEnabled = true;

    public static bool IsEnabled
    {
        get => _isEnabled;
        set => _isEnabled = value;
    }

    public static IntPtr GetRootHwnd(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return IntPtr.Zero;
        IntPtr root = GetAncestor(hwnd, GA_ROOTOWNER);
        return root != IntPtr.Zero ? root : hwnd;
    }

    public static void Initialize(Window animHostWindow, Func<IntPtr, Rect?> iconRectResolver)
    {
        _mainDockWindow = animHostWindow;
        _iconRectResolver = iconRectResolver;

        SuppressNativeAnimation(true);

        _winEventDelegate = new WinEventDelegate(WinEventCallback);
        _hook = SetWinEventHook(
            EVENT_SYSTEM_MINIMIZESTART,
            EVENT_SYSTEM_MINIMIZESTART,
            IntPtr.Zero,
            _winEventDelegate,
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS
        );
    }

    public static void Shutdown()
    {
        SuppressNativeAnimation(false);

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

    private static void SuppressNativeAnimation(bool suppress)
    {
        try
        {
            ANIMATIONINFO ai = new ANIMATIONINFO
            {
                cbSize = (uint)Marshal.SizeOf(typeof(ANIMATIONINFO)),
                iMinAnimate = suppress ? 0 : 1
            };
            SystemParametersInfo(SPI_SETANIMATION, 0, ref ai, SPIF_UPDATEINIFILE | SPIF_SENDCHANGE);
        }
        catch { }
    }

    private static bool GetRealWindowRect(IntPtr hWnd, out RECT rect)
    {
        rect = default;
        if (hWnd == IntPtr.Zero) return false;

        IntPtr realHwnd = GetRootHwnd(hWnd);

        if (IsIconic(realHwnd))
        {
            WINDOWPLACEMENT wp = default;
            wp.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT));
            if (GetWindowPlacement(realHwnd, ref wp))
            {
                rect = wp.rcNormalPosition;
                return (rect.Right - rect.Left > 20 && rect.Bottom - rect.Top > 20);
            }
        }

        if (GetWindowRect(realHwnd, out RECT r))
        {
            if (r.Left > -10000 && r.Right - r.Left > 20)
            {
                rect = r;
                return true;
            }
        }

        WINDOWPLACEMENT wpFallback = default;
        wpFallback.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT));
        if (GetWindowPlacement(realHwnd, ref wpFallback))
        {
            rect = wpFallback.rcNormalPosition;
            return (rect.Right - rect.Left > 20 && rect.Bottom - rect.Top > 20);
        }

        return false;
    }

    private static Window EnsureOverlayWindow()
    {
        if (_overlayWindow == null)
        {
            _overlayWindow = new Window
            {
                WindowStyle = WindowStyle.None,
                AllowsTransparency = true,
                Background = Brushes.Transparent,
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
        if (!_isEnabled || hwnd == IntPtr.Zero || _mainDockWindow == null) return;

        IntPtr rootHwnd = GetRootHwnd(hwnd);

        lock (_ignoreMinimizes)
        {
            if (_ignoreMinimizes.Contains(rootHwnd)) return;
        }

        lock (_animatingHwnds)
        {
            if (_animatingHwnds.Contains(rootHwnd)) return;
        }

        if (eventType == EVENT_SYSTEM_MINIMIZESTART)
        {
            _mainDockWindow.Dispatcher.BeginInvoke((Action)(() =>
            {
                PlayMinimizeAnimation(rootHwnd);
            }));
        }
    }

    public static void PlayMinimizeAnimation(IntPtr targetHwnd, Action onCompleted = null)
    {
        if (!_isEnabled || targetHwnd == IntPtr.Zero || _mainDockWindow == null)
        {
            if (targetHwnd != IntPtr.Zero) ShowWindow(targetHwnd, 6);
            onCompleted?.Invoke();
            return;
        }

        IntPtr rootHwnd = GetRootHwnd(targetHwnd);
        IntPtr dockHwnd = new WindowInteropHelper(_mainDockWindow).Handle;
        if (rootHwnd == dockHwnd) return;

        lock (_animatingHwnds)
        {
            if (_animatingHwnds.Contains(rootHwnd)) return;
            _animatingHwnds.Add(rootHwnd);
        }

        lock (_ignoreMinimizes)
        {
            _ignoreMinimizes.Add(rootHwnd);
        }

        void Finish()
        {
            ShowWindow(rootHwnd, 6); // SW_MINIMIZE

            DispatcherTimer delayTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(400) };
            delayTimer.Tick += (s, e) =>
            {
                delayTimer.Stop();
                lock (_animatingHwnds) { _animatingHwnds.Remove(rootHwnd); }
                lock (_ignoreMinimizes) { _ignoreMinimizes.Remove(rootHwnd); }
                onCompleted?.Invoke();
            };
            delayTimer.Start();
        }

        if (!GetRealWindowRect(rootHwnd, out RECT winRect))
        {
            Finish();
            return;
        }

        if (IsIconic(rootHwnd))
        {
            ShowWindow(rootHwnd, 4); // SW_SHOWNOACTIVATE
        }

        Rect? targetIconRect = _iconRectResolver?.Invoke(rootHwnd);
        Rect destIconRect = targetIconRect.HasValue
            ? targetIconRect.Value
            : new Rect(SystemParameters.PrimaryScreenWidth / 2.0 - 24, SystemParameters.PrimaryScreenHeight - 60, 48, 48);

        Window overlay = EnsureOverlayWindow();
        IntPtr overlayHwnd = new WindowInteropHelper(overlay).Handle;

        if (overlayHwnd == IntPtr.Zero)
        {
            Finish();
            return;
        }

        double winWidth = Math.Max(1.0, winRect.Right - winRect.Left);
        double winHeight = Math.Max(1.0, winRect.Bottom - winRect.Top);
        double origCenterX = winRect.Left + winWidth / 2.0;
        double targetCenterX = destIconRect.Left + destIconRect.Width / 2.0;
        double targetTop = destIconRect.Top;

        IntPtr[] thumbnails = new IntPtr[SLICE_COUNT];
        DWM_THUMBNAIL_PROPERTIES[] sliceProps = new DWM_THUMBNAIL_PROPERTIES[SLICE_COUNT];
        bool allOk = true;

        for (int i = 0; i < SLICE_COUNT; i++)
        {
            if (DwmRegisterThumbnail(overlayHwnd, rootHwnd, out thumbnails[i]) == 0)
            {
                int srcY1 = (int)(i * winHeight / SLICE_COUNT);
                int srcY2 = (int)((i + 1) * winHeight / SLICE_COUNT);

                sliceProps[i] = new DWM_THUMBNAIL_PROPERTIES
                {
                    dwFlags = DWM_TNS_RECTDESTINATION | DWM_TNS_RECTSOURCE | DWM_TNS_OPACITY | DWM_TNS_VISIBLE,
                    rcSource = new RECT { Left = 0, Top = srcY1, Right = (int)winWidth, Bottom = srcY2 },
                    rcDestination = new RECT { Left = winRect.Left, Top = winRect.Top + srcY1, Right = winRect.Right, Bottom = winRect.Top + srcY2 },
                    opacity = 255,
                    fVisible = true
                };
                DwmUpdateThumbnailProperties(thumbnails[i], ref sliceProps[i]);
            }
            else
            {
                allOk = false;
                break;
            }
        }

        if (!allOk)
        {
            for (int j = 0; j < SLICE_COUNT; j++)
            {
                if (thumbnails[j] != IntPtr.Zero) DwmUnregisterThumbnail(thumbnails[j]);
            }
            Finish();
            return;
        }

        DateTime startTime = DateTime.Now;
        const double durationMs = 230.0;

        EventHandler renderingHandler = null;
        renderingHandler = (s, e) =>
        {
            double elapsedMs = (DateTime.Now - startTime).TotalMilliseconds;
            double globalT = Math.Min(1.0, elapsedMs / durationMs);

            for (int i = 0; i < SLICE_COUNT; i++)
            {
                double sliceNormalized = (double)i / (SLICE_COUNT - 1.0);
                double lagDelay = (1.0 - sliceNormalized) * 0.24;
                double sliceT = Math.Min(1.0, Math.Max(0.0, (globalT - lagDelay) / (1.0 - lagDelay)));

                double easeY = sliceT * sliceT * (3.0 - 2.0 * sliceT);
                double easeX = sliceT * sliceT;

                double curWidth = winWidth + (destIconRect.Width - winWidth) * easeX;
                double curCenterX = origCenterX + (targetCenterX - origCenterX) * easeY;

                double origSliceTop = winRect.Top + i * (winHeight / SLICE_COUNT);
                double curTop = origSliceTop + (targetTop - origSliceTop) * easeY;
                double curSliceHeight = (winHeight / SLICE_COUNT) + (4.0 - (winHeight / SLICE_COUNT)) * easeY;

                sliceProps[i].rcDestination = new RECT
                {
                    Left = (int)(curCenterX - curWidth / 2.0),
                    Top = (int)curTop,
                    Right = (int)(curCenterX + curWidth / 2.0),
                    Bottom = (int)(curTop + curSliceHeight)
                };
                sliceProps[i].opacity = (byte)(255 * (1.0 - easeY * 0.3));
                DwmUpdateThumbnailProperties(thumbnails[i], ref sliceProps[i]);
            }

            if (globalT >= 1.0)
            {
                CompositionTarget.Rendering -= renderingHandler;
                for (int j = 0; j < SLICE_COUNT; j++)
                {
                    if (thumbnails[j] != IntPtr.Zero) DwmUnregisterThumbnail(thumbnails[j]);
                }
                overlay.Hide();
                Finish();
            }
        };

        CompositionTarget.Rendering += renderingHandler;
    }

    public static void PlayRestoreAnimation(IntPtr targetHwnd, Action onCompleted = null)
    {
        if (!_isEnabled || targetHwnd == IntPtr.Zero || _mainDockWindow == null)
        {
            if (targetHwnd != IntPtr.Zero)
            {
                ShowWindow(targetHwnd, 9);
                SetForegroundWindow(targetHwnd);
            }
            onCompleted?.Invoke();
            return;
        }

        IntPtr rootHwnd = GetRootHwnd(targetHwnd);
        IntPtr dockHwnd = new WindowInteropHelper(_mainDockWindow).Handle;
        if (rootHwnd == dockHwnd) return;

        lock (_animatingHwnds)
        {
            if (_animatingHwnds.Contains(rootHwnd)) return;
            _animatingHwnds.Add(rootHwnd);
        }

        lock (_ignoreMinimizes)
        {
            _ignoreMinimizes.Add(rootHwnd);
        }

        void Finish()
        {
            ShowWindow(rootHwnd, 9); // SW_RESTORE
            SetForegroundWindow(rootHwnd);

            DispatcherTimer delayTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(400) };
            delayTimer.Tick += (s, e) =>
            {
                delayTimer.Stop();
                lock (_animatingHwnds) { _animatingHwnds.Remove(rootHwnd); }
                lock (_ignoreMinimizes) { _ignoreMinimizes.Remove(rootHwnd); }
                onCompleted?.Invoke();
            };
            delayTimer.Start();
        }

        if (!GetRealWindowRect(rootHwnd, out RECT finalWinRect))
        {
            Finish();
            return;
        }

        Rect? targetIconRect = _iconRectResolver?.Invoke(rootHwnd);
        Rect startIconRect = targetIconRect.HasValue
            ? targetIconRect.Value
            : new Rect(SystemParameters.PrimaryScreenWidth / 2.0 - 24, SystemParameters.PrimaryScreenHeight - 60, 48, 48);

        ShowWindow(rootHwnd, 4); // SW_SHOWNOACTIVATE to render surface for DWM capture

        Window overlay = EnsureOverlayWindow();
        IntPtr overlayHwnd = new WindowInteropHelper(overlay).Handle;

        if (overlayHwnd == IntPtr.Zero)
        {
            Finish();
            return;
        }

        double winWidth = Math.Max(1.0, finalWinRect.Right - finalWinRect.Left);
        double winHeight = Math.Max(1.0, finalWinRect.Bottom - finalWinRect.Top);
        double targetCenterX = finalWinRect.Left + winWidth / 2.0;
        double startCenterX = startIconRect.Left + startIconRect.Width / 2.0;
        double startTop = startIconRect.Top;

        IntPtr[] thumbnails = new IntPtr[SLICE_COUNT];
        DWM_THUMBNAIL_PROPERTIES[] sliceProps = new DWM_THUMBNAIL_PROPERTIES[SLICE_COUNT];
        bool allOk = true;

        for (int i = 0; i < SLICE_COUNT; i++)
        {
            if (DwmRegisterThumbnail(overlayHwnd, rootHwnd, out thumbnails[i]) == 0)
            {
                int srcY1 = (int)(i * winHeight / SLICE_COUNT);
                int srcY2 = (int)((i + 1) * winHeight / SLICE_COUNT);

                sliceProps[i] = new DWM_THUMBNAIL_PROPERTIES
                {
                    dwFlags = DWM_TNS_RECTDESTINATION | DWM_TNS_RECTSOURCE | DWM_TNS_OPACITY | DWM_TNS_VISIBLE,
                    rcSource = new RECT { Left = 0, Top = srcY1, Right = (int)winWidth, Bottom = srcY2 },
                    rcDestination = new RECT { Left = (int)startIconRect.Left, Top = (int)startIconRect.Top, Right = (int)startIconRect.Right, Bottom = (int)startIconRect.Bottom },
                    opacity = 180,
                    fVisible = true
                };
                DwmUpdateThumbnailProperties(thumbnails[i], ref sliceProps[i]);
            }
            else
            {
                allOk = false;
                break;
            }
        }

        if (!allOk)
        {
            for (int j = 0; j < SLICE_COUNT; j++)
            {
                if (thumbnails[j] != IntPtr.Zero) DwmUnregisterThumbnail(thumbnails[j]);
            }
            Finish();
            return;
        }

        DateTime startTime = DateTime.Now;
        const double durationMs = 210.0;

        EventHandler renderingHandler = null;
        renderingHandler = (s, e) =>
        {
            double elapsedMs = (DateTime.Now - startTime).TotalMilliseconds;
            double globalT = Math.Min(1.0, elapsedMs / durationMs);

            for (int i = 0; i < SLICE_COUNT; i++)
            {
                double sliceNormalized = (double)i / (SLICE_COUNT - 1.0);
                double lagDelay = sliceNormalized * 0.22;
                double sliceT = Math.Min(1.0, Math.Max(0.0, (globalT - lagDelay) / (1.0 - lagDelay)));

                double ease = sliceT * sliceT * (3.0 - 2.0 * sliceT);

                double curWidth = startIconRect.Width + (winWidth - startIconRect.Width) * ease;
                double curCenterX = startCenterX + (targetCenterX - startCenterX) * ease;

                double finalSliceTop = finalWinRect.Top + i * (winHeight / SLICE_COUNT);
                double curTop = startTop + (finalSliceTop - startTop) * ease;
                double curSliceHeight = 4.0 + ((winHeight / SLICE_COUNT) - 4.0) * ease;

                sliceProps[i].rcDestination = new RECT
                {
                    Left = (int)(curCenterX - curWidth / 2.0),
                    Top = (int)curTop,
                    Right = (int)(curCenterX + curWidth / 2.0),
                    Bottom = (int)(curTop + curSliceHeight)
                };
                sliceProps[i].opacity = (byte)(180 + (255 - 180) * ease);
                DwmUpdateThumbnailProperties(thumbnails[i], ref sliceProps[i]);
            }

            if (globalT >= 1.0)
            {
                CompositionTarget.Rendering -= renderingHandler;
                for (int j = 0; j < SLICE_COUNT; j++)
                {
                    if (thumbnails[j] != IntPtr.Zero) DwmUnregisterThumbnail(thumbnails[j]);
                }
                overlay.Hide();
                Finish();
            }
        };

        CompositionTarget.Rendering += renderingHandler;
    }
}
