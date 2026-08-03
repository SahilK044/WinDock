using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Media.Control;
using Windows.Storage.Streams;

namespace WinLandMedia {
    public static class WinRTExtensions {
        public static T AwaitWinRT<T>(this IAsyncOperation<T> op, int timeoutMs = 1200) {
            if (op == null) return default(T);
            try {
                var task = System.WindowsRuntimeSystemExtensions.AsTask(op);
                if (task.Wait(timeoutMs)) {
                    return task.Result;
                }
            } catch {}
            return default(T);
        }

        public static void AwaitAction(this IAsyncAction op, int timeoutMs = 1200) {
            if (op == null) return;
            try {
                var task = System.WindowsRuntimeSystemExtensions.AsTask(op);
                task.Wait(timeoutMs);
            } catch {}
        }
    }

    class Program {
        [STAThread]
        static void Main(string[] args) {
            try {
                Console.OutputEncoding = System.Text.Encoding.UTF8;

                // Check if seeking requested
                if (args != null && args.Length >= 2 && args[0] == "seek") {
                    long targetMs = 0;
                    if (long.TryParse(args[1], out targetMs)) {
                        var m = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AwaitWinRT(1000);
                        if (m != null) {
                            var s = m.GetCurrentSession();
                            if (s != null) {
                                s.TryChangePlaybackPositionAsync(targetMs * 10000).AwaitWinRT(1000);
                            }
                        }
                    }
                    return;
                }

                // 1. Fast WinRT GSMTC session fetch (1200ms max timeout using .NET Task Wait)
                var mgr = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AwaitWinRT(1200);
                if (mgr != null) {
                    var sessions = mgr.GetSessions();
                    GlobalSystemMediaTransportControlsSession session = null;

                    if (sessions != null) {
                        // Priority 1: Active/Playing Spotify Session
                        foreach (var s in sessions) {
                            try {
                                string appId = (s.SourceAppUserModelId ?? "").ToLower();
                                if (appId.Contains("spotify")) {
                                    var pb = s.GetPlaybackInfo();
                                    if (pb != null && pb.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing) {
                                        session = s;
                                        break;
                                    }
                                }
                            } catch {}
                        }

                        // Priority 2: Any Playing Session
                        if (session == null) {
                            foreach (var s in sessions) {
                                try {
                                    var pb = s.GetPlaybackInfo();
                                    if (pb != null && pb.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing) {
                                        session = s;
                                        break;
                                    }
                                } catch {}
                            }
                        }

                        // Priority 3: Spotify Session (even if paused or updating)
                        if (session == null) {
                            foreach (var s in sessions) {
                                try {
                                    string appId = (s.SourceAppUserModelId ?? "").ToLower();
                                    if (appId.Contains("spotify")) {
                                        session = s;
                                        break;
                                    }
                                } catch {}
                            }
                        }

                        // Priority 4: Session with timeline bounds if nothing is playing
                        if (session == null) {
                            foreach (var s in sessions) {
                                try {
                                    var tl = s.GetTimelineProperties();
                                    if (tl != null && tl.EndTime.TotalMilliseconds > 0) {
                                        session = s;
                                        break;
                                    }
                                } catch {}
                            }
                        }
                    }

                    if (session == null) {
                        session = mgr.GetCurrentSession();
                    }

                    if (session != null) {
                        var props = session.TryGetMediaPropertiesAsync().AwaitWinRT(800);
                        var timeline = session.GetTimelineProperties();
                        var playback = session.GetPlaybackInfo();

                        string title = props != null && props.Title != null ? props.Title : "";
                        string artist = props != null && props.Artist != null ? props.Artist : "";
                        string appId = session.SourceAppUserModelId ?? "";

                        bool isPlaying = false;
                        if (playback != null) {
                            isPlaying = (playback.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing);
                        }

                        long posMs = 0;
                        long endMs = 0;
                        long lastUpdMs = 0;

                        if (timeline != null) {
                            posMs = (long)timeline.Position.TotalMilliseconds;
                            endMs = (long)timeline.EndTime.TotalMilliseconds;

                            try {
                                lastUpdMs = timeline.LastUpdatedTime.ToUniversalTime().ToUnixTimeMilliseconds();
                            } catch {}

                            if (endMs > 0 && posMs > endMs) {
                                posMs = endMs;
                            }
                        }

                        string coverPath = "";
                        bool isBrowser = appId.ToLower().Contains("chrome") || appId.ToLower().Contains("msedge") || appId.ToLower().Contains("firefox") || appId.ToLower().Contains("brave");

                        // Extract native thumbnail for ALL media sessions if available
                        if (props != null && props.Thumbnail != null) {
                            try {
                                var stream = props.Thumbnail.OpenReadAsync().AwaitWinRT(800);
                                if (stream != null && stream.Size > 0) {
                                    string tempPath = Path.Combine(Path.GetTempPath(), "winland_cover.jpg");
                                    var reader = new DataReader(stream.GetInputStreamAt(0));
                                    var bytes = new byte[stream.Size];
                                    reader.LoadAsync((uint)stream.Size).AwaitWinRT(800);
                                    reader.ReadBytes(bytes);
                                    
                                    bool needWrite = true;
                                    if (File.Exists(tempPath)) {
                                        try {
                                            var existing = File.ReadAllBytes(tempPath);
                                            if (existing.Length == bytes.Length) {
                                                bool same = true;
                                                int step = Math.Max(1, bytes.Length / 64);
                                                for (int i = 0; i < bytes.Length; i += step) {
                                                    if (existing[i] != bytes[i]) { same = false; break; }
                                                }
                                                if (same) needWrite = false;
                                            }
                                        } catch {}
                                    }
                                    if (needWrite) {
                                        File.WriteAllBytes(tempPath, bytes);
                                    }
                                    coverPath = tempPath;
                                }
                            } catch {}
                        }

                        if (!string.IsNullOrEmpty(title)) {
                            title = title.Replace('|', '-').Replace('\r', ' ').Replace('\n', ' ').Trim();
                            artist = artist.Replace('|', '-').Replace('\r', ' ').Replace('\n', ' ').Trim();
                            Console.WriteLine(title + "|" + artist + "|" + posMs + "|" + endMs + "|" + (isPlaying ? "1" : "0") + "|" + coverPath + "|" + (isBrowser ? "browser" : "app") + "|" + lastUpdMs);
                            return;
                        }
                    }
                }

                // 2. Fast Win32 Process Window Title Fallback (Instant 0ms query for Spotify)
                try {
                    var procs = Process.GetProcessesByName("Spotify");
                    foreach (var p in procs) {
                        try {
                            string wTitle = p.MainWindowTitle;
                            if (!string.IsNullOrEmpty(wTitle) && wTitle != "Spotify" && wTitle != "Spotify Free" && wTitle != "Spotify Premium") {
                                string[] parts = wTitle.Split(new string[] { " - " }, StringSplitOptions.None);
                                string artist = parts.Length > 1 ? parts[0].Trim() : "";
                                string title = parts.Length > 1 ? string.Join(" - ", parts, 1, parts.Length - 1).Trim() : parts[0].Trim();
                                Console.WriteLine(title + "|" + artist + "|0|0|1||app|0");
                                return;
                            }
                        } catch {}
                    }
                } catch {}
            } catch {}
            Console.WriteLine("");
        }
    }
}
