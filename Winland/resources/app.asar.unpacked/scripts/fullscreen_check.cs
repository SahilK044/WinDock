using System;
using System.Diagnostics;
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
        static extern bool IsZoomed(IntPtr hWnd);

        [DllImport("user32.dll")]
        static extern int GetSystemMetrics(int nIndex);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        static void Main(string[] args) {
            try {
                IntPtr hwnd = GetForegroundWindow();
                if (hwnd != IntPtr.Zero) {
                    uint procId = 0;
                    GetWindowThreadProcessId(hwnd, out procId);
                    if (procId != 0) {
                        try {
                            using (var proc = Process.GetProcessById((int)procId)) {
                                string pname = (proc.ProcessName ?? "").ToLower();
                                // Ignore WinLand's own windows
                                if (pname.Contains("winland") || pname.Contains("windock")) {
                                    Console.WriteLine("NORMAL");
                                    return;
                                }
                            }
                        } catch {}
                    }

                    StringBuilder className = new StringBuilder(256);
                    GetClassName(hwnd, className, className.Capacity);
                    string cls = className.ToString();

                    // Ignore desktop background / taskbar / shell windows
                    if (cls != "Progman" && cls != "WorkerW" && cls != "Shell_TrayWnd" && cls != "ImmersiveLauncher" && cls != "FolderView") {
                        // 1. Check if foreground window is MAXIMIZED (IsZoomed)
                        if (IsZoomed(hwnd)) {
                            Console.WriteLine("FULLSCREEN");
                            return;
                        }

                        // 2. Check if foreground window is FULLSCREEN (covers screen bounds)
                        RECT rect;
                        if (GetWindowRect(hwnd, out rect)) {
                            int screenW = GetSystemMetrics(0); // SM_CXSCREEN
                            int screenH = GetSystemMetrics(1); // SM_CYSCREEN

                            int winW = rect.Right - rect.Left;
                            int winH = rect.Bottom - rect.Top;

                            if (rect.Left <= 5 && rect.Top <= 5 && winW >= (screenW - 10) && winH >= (screenH - 10)) {
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
