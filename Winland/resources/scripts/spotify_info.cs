using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Media.Control;
using Windows.Storage.Streams;

namespace WinLandMedia {
    class Program {
        [STAThread]
        static void Main(string[] args) {
            try {
                Console.OutputEncoding = System.Text.Encoding.UTF8;
                var mgrTask = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AsTask();
                mgrTask.Wait(2500);
                var mgr = mgrTask.Result;
                if (mgr != null) {
                    var sessions = mgr.GetSessions();
                    GlobalSystemMediaTransportControlsSession session = null;

                    if (sessions != null) {
                        foreach (var s in sessions) {
                            try {
                                var tl = s.GetTimelineProperties();
                                var pb = s.GetPlaybackInfo();
                                if (tl != null) {
                                    var elapsed = DateTimeOffset.UtcNow - tl.LastUpdatedTime;
                                    if (elapsed.TotalSeconds < 4.0 && tl.EndTime.TotalMilliseconds > 0) {
                                        session = s;
                                        break;
                                    }
                                }
                                if (pb != null && pb.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing) {
                                    session = s;
                                    break;
                                }
                            } catch {}
                        }
                    }

                    if (session == null) {
                        session = mgr.GetCurrentSession();
                    }

                    if (session != null) {
                        var propTask = session.TryGetMediaPropertiesAsync().AsTask();
                        propTask.Wait(2500);
                        var props = propTask.Result;

                        var timeline = session.GetTimelineProperties();
                        var playback = session.GetPlaybackInfo();

                        string title = props != null && props.Title != null ? props.Title : "";
                        string artist = props != null && props.Artist != null ? props.Artist : "";
                        string appId = session.SourceAppUserModelId ?? "";

                        bool isPlaying = false;
                        if (timeline != null) {
                            var elapsed = DateTimeOffset.UtcNow - timeline.LastUpdatedTime;
                            if (elapsed.TotalSeconds < 3.5 && timeline.EndTime.TotalMilliseconds > 0) {
                                isPlaying = true;
                            }
                        }
                        if (playback != null && playback.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing) {
                            isPlaying = true;
                        }

                        long posMs = 0;
                        if (timeline != null) {
                            posMs = (long)timeline.Position.TotalMilliseconds;
                            if (isPlaying) {
                                var elapsed = DateTimeOffset.UtcNow - timeline.LastUpdatedTime;
                                if (elapsed.TotalMilliseconds > 0 && elapsed.TotalHours < 24) {
                                    posMs += (long)elapsed.TotalMilliseconds;
                                }
                            }
                        }

                        long endMs = timeline != null ? (long)(timeline.EndTime.TotalMilliseconds) : 0;

                        string coverPath = "";
                        bool isBrowser = appId.ToLower().Contains("chrome") || appId.ToLower().Contains("msedge") || appId.ToLower().Contains("firefox") || appId.ToLower().Contains("brave");

                        if (!isBrowser && props != null && props.Thumbnail != null) {
                            try {
                                var thumbTask = props.Thumbnail.OpenReadAsync().AsTask();
                                thumbTask.Wait(2500);
                                var stream = thumbTask.Result;
                                if (stream != null && stream.Size > 0) {
                                    string tempPath = Path.Combine(Path.GetTempPath(), "winland_cover.jpg");
                                    using (var netStream = stream.AsStreamForRead())
                                    using (var fileStream = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.ReadWrite)) {
                                        netStream.CopyTo(fileStream);
                                        fileStream.Flush(true);
                                    }
                                    coverPath = tempPath;
                                }
                            } catch {}
                        }

                        if (!string.IsNullOrEmpty(title)) {
                            title = title.Replace('|', '-').Replace('\r', ' ').Replace('\n', ' ').Trim();
                            artist = artist.Replace('|', '-').Replace('\r', ' ').Replace('\n', ' ').Trim();
                            Console.WriteLine(title + "|" + artist + "|" + posMs + "|" + endMs + "|" + (isPlaying ? "1" : "0") + "|" + coverPath + "|" + (isBrowser ? "browser" : "app"));
                            return;
                        }
                    }
                }
            } catch {}
            Console.WriteLine("");
        }
    }
}
