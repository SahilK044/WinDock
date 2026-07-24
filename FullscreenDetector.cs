using System;
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
            IntPtr fgHwnd = GetForegroundWindow();
            if (fgHwnd == IntPtr.Zero || fgHwnd == dockHwnd) return false;

            // Exclude system desktop/shell windows
            StringBuilder sb = new StringBuilder(256);
            GetClassName(fgHwnd, sb, 256);
            string className = sb.ToString();

            if (className == "Progman" || className == "WorkerW" || className == "Shell_TrayWnd" || className == "ImmersiveLauncher")
            {
                return false;
            }

            // Check window bounds vs screen bounds
            RECT rect;
            if (DwmGetWindowAttribute(fgHwnd, DWMWA_EXTENDED_FRAME_BOUNDS, out rect, Marshal.SizeOf(typeof(RECT))) != 0)
            {
                if (!GetWindowRect(fgHwnd, out rect)) return false;
            }

            Screen fgScreen = Screen.FromHandle(fgHwnd);
            Screen dockScreen = Screen.FromHandle(dockHwnd);

            // Only check if active app is on the same monitor as the dock
            if (!fgScreen.DeviceName.Equals(dockScreen.DeviceName, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            int winWidth = rect.Right - rect.Left;
            int winHeight = rect.Bottom - rect.Top;
            int screenWidth = fgScreen.Bounds.Width;
            int screenHeight = fgScreen.Bounds.Height;

            // Match width & height within 2px tolerance
            bool matchesWidth = Math.Abs(winWidth - screenWidth) <= 2;
            bool matchesHeight = Math.Abs(winHeight - screenHeight) <= 2;
            bool matchesLeft = Math.Abs(rect.Left - fgScreen.Bounds.Left) <= 2;
            bool matchesTop = Math.Abs(rect.Top - fgScreen.Bounds.Top) <= 2;

            return matchesWidth && matchesHeight && matchesLeft && matchesTop;
        }
        catch
        {
            return false;
        }
    }
}
