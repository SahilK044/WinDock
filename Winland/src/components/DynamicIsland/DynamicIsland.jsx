import React, { useState, useEffect, useRef, useCallback } from 'react';
import MusicWidget from '../Activities/MusicWidget';
import TimerWidget from '../Activities/TimerWidget';
import CallWidget from '../Activities/CallWidget';
import AirDropWidget from '../Activities/AirDropWidget';
import VoiceMemoWidget from '../Activities/VoiceMemoWidget';
import ScreenRecorderWidget from '../Activities/ScreenRecorderWidget';
import BatteryWidget from '../Activities/BatteryWidget';
import VolumeOSDWidget from '../Activities/VolumeOSDWidget';
import NotificationWidget from '../Activities/NotificationWidget';
import WeatherWidget from '../Activities/WeatherWidget';
import IdleWidget from '../Activities/IdleWidget';
import ShelfWidget from '../Activities/ShelfWidget';
import SystemMonitorWidget from '../Activities/SystemMonitorWidget';
import LauncherWidget from '../Activities/LauncherWidget';
import ScreenshotWidget from '../Activities/ScreenshotWidget';
import BluetoothWidget from '../Activities/BluetoothWidget';
import { soundEngine } from '../../utils/soundEngine';
import { fetchHDAlbumArt } from '../../utils/spotifyApi';

const IDLE_TRACK = {
  title: null, artist: null, album: null,
  coverUrl: null, isPlaying: false, progressMs: 0, durationMs: 0,
};

// Default accent = Spotify green
const DEFAULT_ACCENT = { r: 29, g: 185, b: 84 };

// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based dominant color extractor
// Samples downscaled artwork, selects a vibrant, elegant accent color.
// ─────────────────────────────────────────────────────────────────────────────
function extractVibrantColor(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve(DEFAULT_ACCENT);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const SIZE = 40;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        let bestR = DEFAULT_ACCENT.r;
        let bestG = DEFAULT_ACCENT.g;
        let bestB = DEFAULT_ACCENT.b;
        let bestScore = -1;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue; // skip transparent

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;

          const sat = max === 0 ? 0 : delta / max;
          const bright = max / 255;

          // Reject muddy darks or washed out whites
          if (bright < 0.20 || bright > 0.95) continue;
          if (sat < 0.25) continue;

          const score = sat * 0.7 + bright * 0.3;

          if (score > bestScore) {
            bestScore = score;
            bestR = r; bestG = g; bestB = b;
          }
        }

        resolve({ r: bestR, g: bestG, b: bestB });
      } catch {
        resolve(DEFAULT_ACCENT);
      }
    };

    img.onerror = () => resolve(DEFAULT_ACCENT);
    img.src = imageUrl;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Irrational-ratio oscillator bank — 60fps organic visualizer
// ─────────────────────────────────────────────────────────────────────────────
const EQ_FREQS   = [1.0000, 1.6180, 2.4142, 3.3166, 4.2361];
const EQ_PHASES  = [0.00,   1.10,   2.30,   0.70,   3.50 ];
const EQ_AMPS    = [42,     55,     38,     60,     46   ];
const EQ_OFFSETS = [30,     28,     32,     25,     34   ];

function computeBarHeightsWithGain(t, gain) {
  return EQ_FREQS.map((f, i) => {
    const animatedVal = EQ_OFFSETS[i]
      + EQ_AMPS[i] * (
          0.55 * Math.sin(t * f              + EQ_PHASES[i]         ) +
          0.30 * Math.cos(t * f * 1.7321     + EQ_PHASES[i] * 0.618 ) +
          0.15 * Math.sin(t * f * 2.2360     + EQ_PHASES[i] * 1.414 )
        );
    const val = 3 + (animatedVal - 3) * gain;
    return Math.max(3, Math.min(100, Math.round(val)));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 100% SOLID OPAQUE background gradient — ZERO text bleed-through!
// ─────────────────────────────────────────────────────────────────────────────
function buildPillBg(accent, expanded, isPlaying, isLight) {
  if (!expanded || !isPlaying || !accent) {
    return isLight ? 'rgba(255, 255, 255, 0.94)' : '#000000';
  }
  const { r, g, b } = accent;

  if (isLight) {
    const r1 = Math.min(255, Math.round(r * 0.45 + 180));
    const g1 = Math.min(255, Math.round(g * 0.45 + 180));
    const b1 = Math.min(255, Math.round(b * 0.45 + 180));
    return `linear-gradient(135deg, rgb(${r1},${g1},${b1}) 0%, rgba(255, 255, 255, 0.96) 65%, #FFFFFF 100%)`;
  }

  const r1 = Math.round(r * 0.32);
  const g1 = Math.round(g * 0.32);
  const b1 = Math.round(b * 0.32);

  const r2 = Math.round(r * 0.12);
  const g2 = Math.round(g * 0.12);
  const b2 = Math.round(b * 0.12);

  const r3 = Math.round(r * 0.03);
  const g3 = Math.round(g * 0.03);
  const b3 = Math.round(b * 0.03);

  return `linear-gradient(135deg, rgb(${r1},${g1},${b1}) 0%, rgb(${r2},${g2},${b2}) 30%, rgb(${r3},${g3},${b3}) 60%, #000000 100%)`;
}

export default function DynamicIsland({
  activeState,
  setActiveState,
  notification,
  onClearNotification,
}) {
  const [trackInfo, setTrackInfo] = useState(IDLE_TRACK);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [displayAccentColor, setDisplayAccentColor] = useState(DEFAULT_ACCENT);
  const [barHeights, setBarHeights] = useState([3, 3, 3, 3, 3]);
  const [battery, setBattery] = useState({ pct: 0, charging: false, minsLeft: -1 });
  const [volume, setVolume] = useState(50);
  const [shelvedItems, setShelvedItems] = useState([]);
  const [sysStats, setSysStats] = useState({ cpu: 22, ram: 54, gpu: 30 });
  const [screenshotData] = useState(null);
  const [isGhostIdle, setIsGhostIdle] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [weatherConfig, setWeatherConfig] = useState({ weatherUnit: 'C' });
  const [bluetoothData, setBluetoothData] = useState({
    deviceName: 'AirPods Pro',
    batteryPct: 88,
    isCharging: false,
    leftPct: null,
    rightPct: null,
  });

  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  const isLight = themeMode === 'light';

  useEffect(() => {
    if (!window.electronAPI?.onFullscreenState) return;
    const cleanFullscreen = window.electronAPI.onFullscreenState((isFS) => {
      setIsFullscreenActive(!!isFS);
    });
    return () => cleanFullscreen();
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onThemeUpdate) return;
    const cleanTheme = window.electronAPI.onThemeUpdate(({ theme }) => {
      setThemeMode(theme || 'dark');
    });
    return () => cleanTheme();
  }, []);

  // ── Config sync (weatherUnit, temperature, autoHide, hideInFullscreen) ──────
  useEffect(() => {
    if (window.electronAPI?.getInitialConfig) {
      window.electronAPI.getInitialConfig().then((data) => {
        if (data) setWeatherConfig(data);
      });
    }
    if (!window.electronAPI?.onConfigUpdate) return;
    const cleanConfig = window.electronAPI.onConfigUpdate((data) => {
      if (data) setWeatherConfig(data);
    });
    return () => cleanConfig();
  }, []);

  const userToggleLockRef     = useRef(0);
  const progressRef           = useRef(null);
  const lastFetchedTitleRef   = useRef('');
  const rafRef                = useRef(null);
  const tRef                  = useRef(0);
  const volumeDismiss         = useRef(null);
  const bluetoothDismiss      = useRef(null);
  // Remembers what the island was showing (e.g. expanded-lyrics) right before a
  // transient overlay (bluetooth / battery / volume) interrupted it, so we can
  // resume that view instead of always dropping back to the compact player -
  // this was why the lyrics tab kept appearing to "auto-close".
  const preOverlayStateRef    = useRef(null);
  const prevCoverRef          = useRef(null);
  const ghostTimerRef         = useRef(null);
  const trackInfoRef          = useRef(trackInfo);

  // Keep a ref mirror of trackInfo so the mount-once IPC listener effect below
  // (empty dep array) can read the *current* track instead of the value it
  // closed over at mount time.
  useEffect(() => {
    trackInfoRef.current = trackInfo;
  }, [trackInfo]);

  // ── Ghost-When-Idle Timer (8s idle -> 3% opacity fade) ────────────────────
  useEffect(() => {
    if (activeState === 'idle') {
      ghostTimerRef.current = setTimeout(() => setIsGhostIdle(true), 8000);
    } else {
      setIsGhostIdle(false);
      clearTimeout(ghostTimerRef.current);
    }
    return () => clearTimeout(ghostTimerRef.current);
  }, [activeState]);

  // ── Auto-collapse expanded-music after 8s idle (expanded-lyrics stays open) ──
  useEffect(() => {
    if (activeState === 'expanded-music') {
      const collapseTimer = setTimeout(() => {
        setActiveState(trackInfoRef.current.title ? 'compact-music' : 'idle');
      }, 8000);
      return () => clearTimeout(collapseTimer);
    }
  }, [activeState]);

  // ── Simulated telemetry tick for System Monitor ────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setSysStats({
        cpu: Math.floor(15 + Math.random() * 25),
        ram: Math.floor(50 + Math.random() * 12),
        gpu: Math.floor(20 + Math.random() * 30),
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // ── Gamepad Controller Connection Detector ──────────────────────────────────
  useEffect(() => {
    const handleGamepadConnected = (e) => {
      const gp = e.gamepad;
      const isPs = gp.id.toLowerCase().includes('dualsense') || gp.id.toLowerCase().includes('playstation') || gp.id.toLowerCase().includes('054c');
      const name = isPs ? 'DualSense Wireless Controller' : 'Xbox Wireless Controller';

      setNotification({
        title: `${name} Connected`,
        subtitle: `Gaming Gamepad • ${gp.buttons?.length || 16} Buttons • Ready`,
        icon: '🎮',
      });
      setActiveState('notification');
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    return () => window.removeEventListener('gamepadconnected', handleGamepadConnected);
  }, []);

  // ── Accent color extraction when album art changes ────────────────────────
  useEffect(() => {
    const url = trackInfo.coverUrl;
    if (!url || url === prevCoverRef.current) return;
    prevCoverRef.current = url;

    extractVibrantColor(url).then((color) => {
      setAccentColor(color);
    });
  }, [trackInfo.coverUrl]);

  // Reset accent when track goes idle
  useEffect(() => {
    if (!trackInfo.title) {
      setAccentColor(DEFAULT_ACCENT);
      prevCoverRef.current = null;
      lastFetchedTitleRef.current = '';
    }
  }, [trackInfo.title]);

  useEffect(() => {
    let rafId;
    let last = performance.now();
    const easeColor = () => {
      const now = performance.now();
      // Same time-normalization as the visualizer: the colour eases toward its
      // target at a fixed rate per second, not per frame, so it doesn't snap
      // twice as fast at 120Hz.
      const k = 1 - Math.pow(1 - 0.075, Math.min((now - last) / (1000 / 60), 4));
      last = now;
      setDisplayAccentColor((prev) => {
        const next = {
          r: prev.r + (accentColor.r - prev.r) * k,
          g: prev.g + (accentColor.g - prev.g) * k,
          b: prev.b + (accentColor.b - prev.b) * k,
        };

        if (
          Math.abs(next.r - accentColor.r) < 0.5 &&
          Math.abs(next.g - accentColor.g) < 0.5 &&
          Math.abs(next.b - accentColor.b) < 0.5
        ) {
          return accentColor;
        }

        rafId = requestAnimationFrame(easeColor);
        return next;
      });
    };

    rafId = requestAnimationFrame(easeColor);
    return () => cancelAnimationFrame(rafId);
  }, [accentColor]);

  // ── Automatic smooth state morphing when Spotify / media starts/stops ─────
  useEffect(() => {
    if (trackInfo.title && trackInfo.isPlaying) {
      if (activeState === 'idle') {
        setActiveState('compact-music');
      }
    } else if (!trackInfo.title) {
      if (activeState === 'compact-music' || activeState === 'expanded-music' || activeState === 'expanded-lyrics') {
        setActiveState('idle');
      }
    }
  }, [trackInfo.title, trackInfo.isPlaying, activeState]);

  // ── Monotonic Media Progress Tracker ─────────────────────────────────────

  // ── Accurate Media Metadata & Cover Artwork Resolver ─────────────
  const updateTrackData = useCallback(async (dataOrString) => {
    let titleString   = typeof dataOrString === 'string' ? dataOrString : dataOrString?.title;
    let initialPosMs  = typeof dataOrString === 'object' ? dataOrString?.posMs : undefined;
    let initialEndMs  = typeof dataOrString === 'object' ? dataOrString?.endMs : undefined;
    let isPlayingFlag = typeof dataOrString === 'object' ? Boolean(dataOrString?.isPlaying) : true;
    let nativeCoverUrl = typeof dataOrString === 'object' ? dataOrString?.coverUrl : null;

    if (!titleString || titleString === '__NO_MEDIA__') {
      lastFetchedTitleRef.current = '';
      setTrackInfo(IDLE_TRACK);
      return;
    }

    let parsedTitle  = typeof dataOrString === 'object' ? (dataOrString?.title || titleString) : titleString;
    let parsedArtist = typeof dataOrString === 'object' ? (dataOrString?.artist || '') : '';

    if (!parsedArtist && titleString && titleString.includes(' - ')) {
      const parts  = titleString.split(' - ');
      parsedTitle  = parts[0].trim();
      parsedArtist = parts.slice(1).join(' - ').trim();
    }

    const cleanTitle = parsedTitle || titleString;

    setTrackInfo((prev) => {
      const isUserLocked = (Date.now() - userToggleLockRef.current) < 1500;
      const targetIsPlaying = isUserLocked ? prev.isPlaying : isPlayingFlag;

      let updatedProgressMs = (initialPosMs !== undefined && initialPosMs >= 0) ? initialPosMs : prev.progressMs;
      let updatedDurationMs = (initialEndMs !== undefined && initialEndMs > 0) ? initialEndMs : prev.durationMs;

      const trackTitleChanged = prev.title !== cleanTitle;

      return {
        ...prev,
        title: cleanTitle,
        artist: parsedArtist || (trackTitleChanged ? '' : prev.artist),
        coverUrl: nativeCoverUrl ? nativeCoverUrl : (trackTitleChanged ? null : prev.coverUrl),
        isPlaying: targetIsPlaying,
        progressMs: updatedProgressMs,
        durationMs: updatedDurationMs,
      };
    });

    if (nativeCoverUrl) return;
    if (lastFetchedTitleRef.current === cleanTitle && trackInfoRef.current.coverUrl) return;
    lastFetchedTitleRef.current = cleanTitle;

    try {
      // 1. High-Definition Official iTunes Album Art & Duration Resolver (600x600 HD)
      const iTunesData = await fetchHDAlbumArt(cleanTitle, parsedArtist);
      if (iTunesData) {
        setTrackInfo((prev) => ({
          ...prev,
          coverUrl: iTunesData.hdUrl || prev.coverUrl,
          durationMs: (prev.durationMs && prev.durationMs > 0) ? prev.durationMs : (iTunesData.durationMs || prev.durationMs),
        }));
        return;
      }

      // 2. YouTube Video Thumbnail Resolver (Fallback if iTunes has no match)
      try {
        const ytRes = await fetch(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + ' ' + (parsedArtist || ''))}`
        );
        const html = await ytRes.text();
        const idx = html.indexOf('videoId');
        if (idx !== -1) {
          const rawId = html.substr(idx + 10, 11);
          if (rawId && rawId.length === 11 && !/[^a-zA-Z0-9_-]/.test(rawId)) {
            const ytCover = `https://img.youtube.com/vi/${rawId}/hqdefault.jpg`;
            setTrackInfo((prev) => ({
              ...prev,
              coverUrl: prev.coverUrl || ytCover,
            }));
          }
        }
      } catch (e) {}
    } catch (e) {}
  }, []);

  // ── IPC listeners (registered once) ──────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanSpotify = window.electronAPI.onSystemMediaUpdate(updateTrackData);

    // States that are transient "popovers" over whatever the island was already
    // showing. Used to remember/restore the underlying view (e.g. expanded-lyrics)
    // instead of always snapping back to the compact player when they dismiss.
    const isOverlayState = (s) => s === 'expanded-battery' || s === 'volume-osd' || s === 'expanded-bluetooth';
    const resumeFromOverlay = () => {
      // Return to the actual view that was showing before any overlay interrupted
      // it (e.g. expanded-lyrics, expanded-shelf, compact-music) instead of always
      // collapsing to the compact player. Falls back gracefully if nothing was
      // stored (e.g. on cold start). Guards against recursion by clearing first.
      const restored = preOverlayStateRef.current;
      preOverlayStateRef.current = null;
      return restored || (trackInfoRef.current.title ? 'compact-music' : 'idle');
    };

    const cleanBattery = window.electronAPI.onBatteryUpdate(({ pct, charging, minsLeft, changed }) => {
      setBattery({ pct, charging, minsLeft });
      if (changed && (pct <= 20 || charging)) {
        setActiveState((prev) => {
          if (!isOverlayState(prev)) preOverlayStateRef.current = prev;
          return 'expanded-battery';
        });
        setTimeout(() => setActiveState((prev) => prev === 'expanded-battery' ? resumeFromOverlay() : prev), 5000);
      }
    });

    const cleanVolume = window.electronAPI.onVolumeUpdate(({ vol }) => {
      setVolume(vol);
      setActiveState((prev) => {
        if (!isOverlayState(prev)) preOverlayStateRef.current = prev;
        return 'volume-osd';
      });
      clearTimeout(volumeDismiss.current);
      volumeDismiss.current = setTimeout(() => setActiveState((prev) => prev === 'volume-osd' ? resumeFromOverlay() : prev), 2000);
    });

    if (window.electronAPI?.getBluetoothState) {
      window.electronAPI.getBluetoothState().then((data) => {
        if (data && data.deviceName) {
          setBluetoothData(data);
        }
      }).catch(() => {});
    }

    const cleanBT = window.electronAPI.onBluetoothUpdate
      ? window.electronAPI.onBluetoothUpdate((data) => {
          setBluetoothData(data);
          if (data && data.deviceName && !data.isInitial) {
            soundEngine.playChime();
            setActiveState((prev) => {
              if (!isOverlayState(prev)) preOverlayStateRef.current = prev;
              return 'expanded-bluetooth';
            });
            clearTimeout(bluetoothDismiss.current);
            bluetoothDismiss.current = setTimeout(() => {
              setActiveState((prev) => prev === 'expanded-bluetooth' ? resumeFromOverlay() : prev);
            }, 6200);
          }
        })
      : () => {};

    return () => { cleanSpotify(); cleanBattery(); cleanVolume(); cleanBT(); clearTimeout(bluetoothDismiss.current); };
  }, []);

  const gainRef = useRef(0);

  // ── Equalizer rAF loop (Smooth Gain Decay/Spring) ─────────────────────────
  // Time-normalized: the oscillator phase and the gain spring advance by real
  // elapsed time, so the bars dance at the same speed whether the display runs
  // at 60, 120 or 144Hz — a faster refresh just makes the motion smoother. The
  // original per-frame steps (t += 0.04, gain *= 0.12) were tuned for exactly
  // 60fps and would have run twice as fast once background throttling was off
  // on a 120Hz panel.
  useEffect(() => {
    let last = performance.now();
    const loop = (now) => {
      // "frames" = how many 60fps ticks this frame represents; clamped so a
      // stall (tab occluded, GC) can't fast-forward the animation on resume.
      const frames = Math.min((now - last) / (1000 / 60), 4);
      last = now;

      const targetGain = trackInfo.isPlaying ? 1.0 : 0.0;
      gainRef.current += (targetGain - gainRef.current) * (1 - Math.pow(1 - 0.12, frames));

      if (gainRef.current < 0.01 && !trackInfo.isPlaying) {
        setBarHeights([3, 3, 3, 3, 3]);
      } else {
        tRef.current += 0.04 * frames;
        setBarHeights(computeBarHeightsWithGain(tRef.current, gainRef.current));
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trackInfo.isPlaying]);

  // ── Window resize IPC ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;
    const sizeMap = {
      'idle':              [250, 44],
      'compact-music':     [270, 54],
      'compact-timer':     [250, 54],
      'split':             [340, 54],
      'expanded-music':    [390, 172],
      'expanded-lyrics':   [390, 300],
      'expanded-timer':    [360, 210],
      'expanded-call':     [400, 120],
      'expanded-airdrop':  [380, 200],
      'expanded-recorder': [370, 205],
      'expanded-screenrec':[340, 100],
      'expanded-battery':  [340, 85],
      'volume-osd':        [360, 85],
      'notification':      [400, 110],
      'expanded-weather':  [370, 210],
      'expanded-shelf':    [380, 210],
      'expanded-sysmon':   [370, 150],
      'expanded-launcher': [360, 180],
      'expanded-screenshot':[360, 90],
      'expanded-bluetooth': [376, 61],
    };
    const [w, h] = sizeMap[activeState] || [250, 44];
    window.electronAPI.resizeWindow(w, h);
  }, [activeState]);

  // ── State class map ───────────────────────────────────────────────────────
  const getStateClass = () => {
    if (activeState === 'idle' && isGhostIdle) return 'state-ghost-idle';
    return {
      'idle':              'state-idle',
      'compact-music':     'state-compact-music',
      'compact-timer':     'state-compact-timer',
      'split':             'state-split',
      'expanded-music':    'state-expanded-music',
      'expanded-lyrics':   'state-expanded-lyrics',
      'expanded-timer':    'state-expanded-timer',
      'expanded-call':     'state-expanded-call',
      'expanded-airdrop':  'state-expanded-airdrop',
      'expanded-recorder': 'state-expanded-recorder',
      'expanded-screenrec':'state-expanded-screenrec',
      'expanded-battery':  'state-expanded-battery',
      'volume-osd':        'state-volume-osd',
      'notification':      'state-notification',
      'expanded-weather':  'state-expanded-weather',
      'expanded-shelf':    'state-expanded-shelf',
      'expanded-sysmon':   'state-expanded-sysmon',
      'expanded-launcher': 'state-expanded-launcher',
      'expanded-screenshot':'state-expanded-screenshot',
      'expanded-bluetooth':'state-expanded-bluetooth',
    }[activeState] || 'state-idle';
  };

  // ── Mouse Passthrough Management ──────────────────────────────────────────
  useEffect(() => {
    if (window.electronAPI?.setIgnoreMouseEvents) {
      const isExpanded = activeState.startsWith('expanded-') || activeState === 'volume-osd';
      window.electronAPI.setIgnoreMouseEvents(!isExpanded);
    }
  }, [activeState]);

  const handleMouseEnter = () => {
    setIsGhostIdle(false);
    if (window.electronAPI?.setIgnoreMouseEvents) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }
    if (trackInfo.title && activeState === 'compact-music') {
      setActiveState('expanded-music');
    }
  };

  const handleMouseLeave = () => {
    // DO NOT enable mouse passthrough while an expanded interactive widget is active!
    if (activeState.startsWith('expanded-') || activeState === 'volume-osd') return;

    if (window.electronAPI?.setIgnoreMouseEvents) {
      window.electronAPI.setIgnoreMouseEvents(true);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveState((prev) => prev === 'expanded-launcher' ? (trackInfo.title ? 'compact-music' : 'idle') : 'expanded-launcher');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeState !== 'expanded-shelf') {
      setActiveState('expanded-shelf');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files || []);
    const items = files.map((f) => ({ name: f.name, type: f.type, path: f.path }));
    const textData = e.dataTransfer?.getData('text');
    if (textData) {
      items.push({ name: textData.slice(0, 35), text: textData, type: 'text/plain' });
    }
    if (items.length > 0) {
      setShelvedItems((prev) => [...prev, ...items]);
    }
  };

  const handleLaunchApp = (cmd) => {
    if (cmd === 'settings') {
      if (window.electronAPI?.openSettingsWindow) {
        window.electronAPI.openSettingsWindow();
      }
      setActiveState(trackInfo.title ? 'compact-music' : 'idle');
      return;
    }
    if (window.electronAPI?.launchApp) {
      window.electronAPI.launchApp(cmd);
    }
    setActiveState(trackInfo.title ? 'compact-music' : 'idle');
  };

  const handleOpenItem = (item) => {
    if (item.path && window.electronAPI?.openPath) {
      window.electronAPI.openPath(item.path);
    }
  };

  const handleIslandClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('svg') || e.target.closest('.interactive-child'))) {
      return;
    }
    e.stopPropagation();
    if (activeState.startsWith('expanded-') || activeState === 'volume-osd') {
      setActiveState(trackInfo.title ? 'compact-music' : 'idle');
    } else {
      setActiveState('expanded-music');
    }
  };

  const handleTogglePlay = () => {
    userToggleLockRef.current = Date.now();
    if (window.electronAPI) window.electronAPI.sendMediaControl('toggle');
    setTrackInfo((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleNext = () => { if (window.electronAPI) window.electronAPI.sendMediaControl('next'); };
  const handlePrev = () => { if (window.electronAPI) window.electronAPI.sendMediaControl('previous'); };

  const handleSeek = (newProgressMs) => {
    userToggleLockRef.current = Date.now();
    setTrackInfo((prev) => ({ ...prev, progressMs: newProgressMs }));
    if (window.electronAPI) {
      window.electronAPI.sendMediaControl({ action: 'seek', posMs: newProgressMs });
    }
  };

  const isMusicState = activeState === 'compact-music' || activeState === 'expanded-music' || activeState === 'expanded-lyrics';

  // ── Eq bar color & glow ───────────────────────────────────────────────────
  const { r, g, b } = displayAccentColor;
  const smoothR = Math.round(r);
  const smoothG = Math.round(g);
  const smoothB = Math.round(b);
  const eqColor  = `rgb(${smoothR},${smoothG},${smoothB})`;
  const eqGlow   = `rgba(${smoothR},${smoothG},${smoothB},0.42)`;
  const progGrad = `linear-gradient(90deg, rgb(${smoothR},${smoothG},${smoothB}), rgba(${smoothR},${smoothG},${smoothB},0.75))`;

  const expandedGradient = buildPillBg(displayAccentColor, true, true, isLight);
  const showGradient = (activeState === 'expanded-music' || activeState === 'expanded-lyrics') && trackInfo.isPlaying && !!trackInfo.title;

  return (
    <div
      className="island-anchor"
      onMouseEnter={handleMouseEnter}
      style={{
        transform: isFullscreenActive ? 'translateY(-120px)' : 'none',
        opacity: isFullscreenActive ? 0 : (isGhostIdle ? 0.03 : 1),
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        pointerEvents: isFullscreenActive ? 'none' : 'auto',
      }}
    >
      <div
        className={`island-capsule ${getStateClass()} ${isLight ? 'theme-light' : 'theme-dark'}`}
        onClick={handleIslandClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Smooth background gradient layer: Fades in on Play, fades out on Pause */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 'inherit',
            background: expandedGradient,
            opacity: showGradient ? 1 : 0,
            transition: 'opacity 0.8s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div className="activity-fade-content" key={isMusicState ? 'music' : activeState}>

          {activeState === 'idle' && <IdleWidget weatherConfig={weatherConfig} />}

          {isMusicState && (
            <MusicWidget
              isCompact={activeState === 'compact-music'}
              isExpanded={activeState === 'expanded-music' || activeState === 'expanded-lyrics'}
              isLyricsView={activeState === 'expanded-lyrics'}
              onToggleLyrics={() => setActiveState((prev) => prev === 'expanded-lyrics' ? 'expanded-music' : 'expanded-lyrics')}
              trackInfo={trackInfo}
              barHeights={barHeights}
              eqColor={eqColor}
              eqGlow={eqGlow}
              progressGradient={progGrad}
              onExpand={() => setActiveState('expanded-music')}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrev={handlePrev}
              onSeek={handleSeek}
            />
          )}

          {activeState === 'compact-timer' && (
            <TimerWidget isCompact={true} onExpand={() => setActiveState('expanded-timer')} />
          )}
          {activeState === 'expanded-timer' && <TimerWidget isExpanded={true} />}

          {activeState === 'split' && (
            <>
              <MusicWidget isSplit={true} trackInfo={trackInfo} barHeights={barHeights}
                eqColor={eqColor} eqGlow={eqGlow} progressGradient={progGrad} />
              <TimerWidget isSplit={true} />
            </>
          )}

          {activeState === 'expanded-call' && (
            <CallWidget isExpanded={true} onEndCall={() => setActiveState('idle')} />
          )}
          {activeState === 'expanded-airdrop' && (
            <AirDropWidget onComplete={() => setActiveState('compact-music')} />
          )}
          {activeState === 'expanded-recorder' && (
            <VoiceMemoWidget onStop={() => setActiveState('idle')} />
          )}
          {activeState === 'expanded-screenrec' && (
            <ScreenRecorderWidget onStop={() => setActiveState('idle')} />
          )}
          {activeState === 'expanded-battery' && (
            <BatteryWidget pct={battery.pct} charging={battery.charging} minsLeft={battery.minsLeft} />
          )}
          {activeState === 'volume-osd' && <VolumeOSDWidget volume={volume} />}
          {activeState === 'notification' && notification && (
            <NotificationWidget notification={notification} onClose={onClearNotification} />
          )}
          {activeState === 'expanded-weather' && <WeatherWidget weatherConfig={weatherConfig} />}

          {/* New Filtered Implementation Plan Widgets */}
          {activeState === 'expanded-shelf' && (
            <ShelfWidget
              shelvedItems={shelvedItems}
              onRemoveItem={(idx) => setShelvedItems((prev) => prev.filter((_, i) => i !== idx))}
              onClearAll={() => setShelvedItems([])}
              onOpenItem={handleOpenItem}
            />
          )}
          {activeState === 'expanded-sysmon' && <SystemMonitorWidget stats={sysStats} />}
          {activeState === 'expanded-launcher' && (
            <LauncherWidget onLaunchApp={handleLaunchApp} onClose={() => setActiveState('idle')} />
          )}
          {activeState === 'expanded-screenshot' && (
            <ScreenshotWidget imageSrc={screenshotData} onDismiss={() => setActiveState('idle')} />
          )}
          {activeState === 'expanded-bluetooth' && (
            <BluetoothWidget
              deviceName={bluetoothData.deviceName}
              batteryPct={bluetoothData.batteryPct}
              isCharging={bluetoothData.isCharging}
              leftPct={bluetoothData.leftPct}
              rightPct={bluetoothData.rightPct}
              typeStr={bluetoothData.typeStr}
              connectionState={bluetoothData.connectionState || 'connected'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
