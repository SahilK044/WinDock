using System;
using System.Runtime.InteropServices;

namespace WinDock.Shared
{
    public static class NativeBlur
    {
        [DllImport("dwmapi.dll")]
        public static extern int DwmEnableBlurBehindWindow(IntPtr hwnd, ref DWM_BLURBEHIND blurBehind);

        [StructLayout(LayoutKind.Sequential)]
        public struct DWM_BLURBEHIND
        {
            public uint dwFlags;
            public bool fEnable;
            public IntPtr hRgnBlur;
            public bool fTransitionOnMaximized;
        }

        public const uint DWM_BB_ENABLE = 0x00000001;
        public const uint DWM_BB_BLURREGION = 0x00000002;

        [DllImport("gdi32.dll")]
        public static extern IntPtr CreateRoundRectRgn(int x1, int y1, int x2, int y2, int cx, int cy);

        [DllImport("gdi32.dll")]
        public static extern bool DeleteObject(IntPtr hObject);

        public static void ApplyBlur(IntPtr hwnd, int left, int top, int right, int bottom, int cornerWidth, int cornerHeight)
        {
            try
            {
                IntPtr hRgn = CreateRoundRectRgn(left, top, right, bottom, cornerWidth, cornerHeight);
                DWM_BLURBEHIND bb = new DWM_BLURBEHIND
                {
                    dwFlags = DWM_BB_ENABLE | DWM_BB_BLURREGION,
                    fEnable = true,
                    hRgnBlur = hRgn
                };
                DwmEnableBlurBehindWindow(hwnd, ref bb);
                if (hRgn != IntPtr.Zero)
                {
                    DeleteObject(hRgn);
                }
            }
            catch { }
        }

        public static void DisableBlur(IntPtr hwnd)
        {
            try
            {
                DWM_BLURBEHIND bb = new DWM_BLURBEHIND
                {
                    dwFlags = DWM_BB_ENABLE,
                    fEnable = false
                };
                DwmEnableBlurBehindWindow(hwnd, ref bb);
            }
            catch { }
        }
    }
}
