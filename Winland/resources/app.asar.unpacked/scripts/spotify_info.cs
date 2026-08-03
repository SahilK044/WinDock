using System;
using System.IO;
using System.Threading;
using Windows.Foundation;
using Windows.Media.Control;
using Windows.Storage.Streams;

namespace WinLandMedia {
    public static class WinRTExtensions {
        public static T AwaitWinRT<T>(this IAsyncOperation<T> op) {
            if (op == null) return default(T);
            int waited = 0;
            while (op.Status == AsyncStatus.Started && waited < 2500) {
                Thread.Sleep(10);
                waited += 10;
            }
            if (op.Status == AsyncStatus.Completed) {
                return op.GetResults();
            }
            return default(T);
        }

        public static void AwaitAction(this IAsyncAction op) {
            if (op == null) return;
            int waited = 0;
            while (op.Status == AsyncStatus.Started && waited < 2500) {
                Thread.Sleep(10);
                waited += 10;
            }
        }
    }

    class Program {
        [STAThread]
        static void Main(string[] args) {
            try {
                Console.OutputEncoding = System.Text.Encoding.UTF8;
                var mgr = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AwaitWinRT();
                if (mgr != null) {
                    var sessions = mgr.GetSessions();
                    GlobalSystemMediaTransportControlsSession session = null;

                    if (sessions != null) {
                        // Priority 1: Currently Playing Session (Spotify / Active Media)
                        foreach (var s in sessions) {
                            try {
                                var pb = s.GetPlaybackInfo();
                                if (pb != null && pb.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing) {
                                    session = s;
                                    break;
                                }
                            } catch {}
                        }

                        // Priority 2: Session with timeline bounds if nothing is playing
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
                        // Check if seeking requested
                        if (args != null && args.Length >= 2 && args[0] == "seek") {
                            long targetMs = 0;
                            if (long.TryParse(args[1], out targetMs)) {
                                session.TryChangePlaybackPositionAsync(targetMs * 10000).AwaitWinRT();
                            }
                            return;
                        }

                        var props = session.TryGetMediaPropertiesAsync().AwaitWinRT();
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

                            // Output raw LastUpdatedTime as Unix-ms so Node.js
                            // can do its own stateful wall-clock extrapolation.
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
                                var stream = props.Thumbnail.OpenReadAsync().AwaitWinRT();
                                if (stream != null && stream.Size > 0) {
                                    string tempPath = Path.Combine(Path.GetTempPath(), "winland_cover.jpg");
                                    var reader = new DataReader(stream.GetInputStreamAt(0));
                                    var bytes = new byte[stream.Size];
                                    reader.LoadAsync((uint)stream.Size).AwaitWinRT();
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
            } catch {}
            Console.WriteLine("");
        }
    }
}
