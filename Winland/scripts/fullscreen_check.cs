using System;
using System.Runtime.InteropServices;
using System.Text;

namespace WinLandFullScreen {
    class Program {
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        static extern int GetSystemMetrics(int nIndex);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        static void Main(string[] args) {
            try {
                IntPtr hwnd = GetForegroundWindow();
                if (hwnd != IntPtr.Zero) {
                    StringBuilder className = new StringBuilder(256);
                    GetClassName(hwnd, className, className.Capacity);
                    string cls = className.ToString();

                    // Ignore desktop background / taskbar / shell windows
                    if (cls != "Progman" && cls != "WorkerW" && cls != "Shell_TrayWnd") {
                        RECT rect;
                        if (GetWindowRect(hwnd, out rect)) {
                            int screenW = GetSystemMetrics(0); // SM_CXSCREEN
                            int screenH = GetSystemMetrics(1); // SM_CYSCREEN
                            
                            int winW = rect.Right - rect.Left;
                            int winH = rect.Bottom - rect.Top;

                            if (winW >= screenW && winH >= screenH && rect.Left <= 0 && rect.Top <= 0) {
                                Console.WriteLine("FULLSCREEN");
                                return;
                            }
                        }
                    }
                }
            } catch {}
            Console.WriteLine("NORMAL");
        }
    }
}
