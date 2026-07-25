using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

public static class FullscreenDetector
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("dwmapi.dll")]
    private static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out RECT pvAttribute, int cbAttribute);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    private static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);
    private const uint GA_ROOTOWNER = 3;



    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    private const int DWMWA_EXTENDED_FRAME_BOUNDS = 9;

    public static bool IsFullscreenOnDockMonitor(IntPtr dockHwnd)
    {
        try
        {
            IntPtr rawFg = GetForegroundWindow();
            if (rawFg == IntPtr.Zero) return false;

            IntPtr fgHwnd = GetAncestor(rawFg, GA_ROOTOWNER);
            if (fgHwnd == IntPtr.Zero) fgHwnd = rawFg;
            if (fgHwnd == dockHwnd) return false;

            StringBuilder sb = new StringBuilder(256);
            GetClassName(fgHwnd, sb, 256);
            string className = sb.ToString();

            if (className == "Progman" || className == "WorkerW" || className == "Shell_TrayWnd" || className == "ImmersiveLauncher" || className == "FolderView")
            {
                return false;
            }

            uint procId = 0;
            GetWindowThreadProcessId(fgHwnd, out procId);
            if (procId != 0)
            {
                try
                {
                    using (Process proc = Process.GetProcessById((int)procId))
                    {
                        if (string.Equals(proc.ProcessName, "windock", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(proc.ProcessName, "ripple", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(proc.ProcessName, "explorer", StringComparison.OrdinalIgnoreCase))
                        {
                            return false;
                        }
                    }
                }
                catch { }
            }

            Screen fgScreen = Screen.FromHandle(fgHwnd);
            Screen dockScreen = Screen.FromHandle(dockHwnd);

            if (!fgScreen.DeviceName.Equals(dockScreen.DeviceName, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }



            RECT rect;
            if (DwmGetWindowAttribute(fgHwnd, DWMWA_EXTENDED_FRAME_BOUNDS, out rect, Marshal.SizeOf(typeof(RECT))) != 0)
            {
                if (!GetWindowRect(fgHwnd, out rect)) return false;
            }

            int winWidth = rect.Right - rect.Left;
            int winHeight = rect.Bottom - rect.Top;
            int screenWidth = fgScreen.Bounds.Width;
            int screenHeight = fgScreen.Bounds.Height;

            bool matchesWidth = Math.Abs(winWidth - screenWidth) <= 8;
            bool matchesHeight = Math.Abs(winHeight - screenHeight) <= 8;
            bool matchesLeft = Math.Abs(rect.Left - fgScreen.Bounds.Left) <= 8;
            bool matchesTop = Math.Abs(rect.Top - fgScreen.Bounds.Top) <= 8;

            return matchesWidth && matchesHeight && matchesLeft && matchesTop;
        }
        catch
        {
            return false;
        }
    }
}
