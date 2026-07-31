using System;
using System.Threading.Tasks;
using Windows.Media.Control;

namespace WinMedia {
    public class MediaHelper {
        public static string GetMediaInfo() {
            try {
                var task = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AsTask();
                if (!task.Wait(1000)) return "";
                var mgr = task.Result;
                var session = mgr?.GetCurrentSession();
                if (session != null) {
                    var propTask = session.TryGetMediaPropertiesAsync().AsTask();
                    if (!propTask.Wait(1000)) return "";
                    var props = propTask.Result;
                    var timeline = session.GetTimelineProperties();
                    int pos = (int)timeline.Position.TotalMilliseconds;
                    int end = (int)timeline.EndTime.TotalMilliseconds;
                    return $"{props.Title}|{props.Artist}|{pos}|{end}";
                }
            } catch {}
            return "";
        }
    }
}
