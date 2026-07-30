$ref = @(
  "System.Runtime.WindowsRuntime",
  "$env:windir\System32\WinMetadata\Windows.Media.Control.winmd"
)

$code = @"
using System;
using System.Threading.Tasks;
using Windows.Media.Control;

namespace WinMedia {
    public class MediaHelper {
        public static string GetMediaInfo() {
            try {
                var task = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AsTask();
                task.Wait(1200);
                var mgr = task.Result;
                var session = mgr?.GetCurrentSession();
                if (session != null) {
                    var propTask = session.TryGetMediaPropertiesAsync().AsTask();
                    propTask.Wait(1200);
                    var props = propTask.Result;
                    var timeline = session.GetTimelineProperties();
                    int pos = (int)timeline.Position.TotalMilliseconds;
                    int end = (int)timeline.EndTime.TotalMilliseconds;
                    return props.Title + "|" + props.Artist + "|" + pos + "|" + end;
                }
            } catch (Exception ex) {
                return "ERR:" + ex.Message;
            }
            return "";
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies $ref -IgnoreWarnings
[WinMedia.MediaHelper]::GetMediaInfo()
