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
import { soundEngine } from '../../utils/soundEngine';

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
function buildPillBg(accent, expanded, isPlaying) {
  if (!expanded || !isPlaying || !accent) return '#000000';
  const { r, g, b } = accent;

  // Solid RGB color mixing for 100% opacity (NO alpha channel transparency)
  // Rich, vibrant top-left color tint (32% intensity)
  const r1 = Math.round(r * 0.32);
  const g1 = Math.round(g * 0.32);
  const b1 = Math.round(b * 0.32);

  // Smooth mid-tone color tint (12% intensity)
  const r2 = Math.round(r * 0.12);
  const g2 = Math.round(g * 0.12);
  const b2 = Math.round(b * 0.12);

  // Soft deep falloff (3% intensity)
  const r3 = Math.round(r * 0.03);
  const g3 = Math.round(g * 0.03);
  const b3 = Math.round(b * 0.03);

  // 100% SOLID OPAQUE linear gradient — Rich, vibrant, smooth, ZERO transparency!
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
  const [barHeights, setBarHeights] = useState([3, 3, 3, 3, 3]);
  const [battery, setBattery] = useState({ pct: 0, charging: false, minsLeft: -1 });
  const [volume, setVolume] = useState(50);
  const [shelvedItems, setShelvedItems] = useState([]);
  const [sysStats, setSysStats] = useState({ cpu: 22, ram: 54, gpu: 30 });
  const [screenshotData, setScreenshotData] = useState(null);
  const [isGhostIdle, setIsGhostIdle] = useState(false);

  const userToggleLockRef     = useRef(0);
  const progressRef           = useRef(null);
  const lastFetchedTitleRef   = useRef('');
  const rafRef                = useRef(null);
  const tRef                  = useRef(0);
  const volumeDismiss         = useRef(null);
  const prevCoverRef          = useRef(null);
  const ghostTimerRef         = useRef(null);

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

  // ── Automatic smooth state morphing when Spotify starts/stops ─────────────
  useEffect(() => {
    if (trackInfo.title) {
      if (activeState === 'idle') {
        setActiveState('compact-music');
      }
    } else if (!trackInfo.title) {
      if (activeState === 'compact-music' || activeState === 'expanded-music') {
        setActiveState('idle');
      }
    }
  }, [trackInfo.title]);

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

      return {
        ...prev,
        title: cleanTitle,
        artist: parsedArtist || prev.artist,
        coverUrl: nativeCoverUrl || prev.coverUrl,
        isPlaying: targetIsPlaying,
        progressMs: updatedProgressMs,
        durationMs: updatedDurationMs,
      };
    });

    if (nativeCoverUrl) return;
    if (lastFetchedTitleRef.current === cleanTitle) return;
    lastFetchedTitleRef.current = cleanTitle;

    try {
      // 1. YouTube Video Thumbnail Resolver
      try {
        const ytRes = await fetch(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle)}`
        );
        const html = await ytRes.text();
        const idx = html.indexOf('videoId');
        if (idx !== -1) {
          const rawId = html.substr(idx + 10, 11);
          if (rawId && rawId.length === 11 && !/[^a-zA-Z0-9_-]/.test(rawId)) {
            const ytCover = `https://img.youtube.com/vi/${rawId}/hqdefault.jpg`;
            setTrackInfo((prev) => ({
              ...prev,
              coverUrl: ytCover,
            }));
            return;
          }
        }
      } catch (e) {}

      // 2. iTunes Music Artwork Resolver Fallback
      const query = parsedArtist ? `${cleanTitle} ${parsedArtist}` : cleanTitle;
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`
      );
      const data = await res.json();
      const results = data.results || [];

      if (results.length > 0) {
        const item = results[0];
        const highResCover = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : null;

        setTrackInfo((prev) => ({
          ...prev,
          coverUrl: prev.coverUrl || highResCover,
          durationMs: prev.durationMs || item.trackTimeMillis,
        }));
      }
    } catch (e) {}
  }, []);

  const [autoHidden, setAutoHidden] = useState(false);

  // ── IPC listeners (registered once) ──────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanFS = window.electronAPI.onFullscreenState
      ? window.electronAPI.onFullscreenState((isFS) => setAutoHidden(isFS))
      : () => {};

    const cleanSpotify = window.electronAPI.onSystemMediaUpdate(updateTrackData);

    const cleanBattery = window.electronAPI.onBatteryUpdate(({ pct, charging, minsLeft, changed }) => {
      setBattery({ pct, charging, minsLeft });
      if (changed && (pct <= 20 || charging)) {
        setActiveState('expanded-battery');
        setTimeout(() => setActiveState('compact-music'), 5000);
      }
    });

    const cleanVolume = window.electronAPI.onVolumeUpdate(({ vol }) => {
      setVolume(vol);
      setActiveState('volume-osd');
      clearTimeout(volumeDismiss.current);
      volumeDismiss.current = setTimeout(() => setActiveState('compact-music'), 2000);
    });

    return () => { cleanFS(); cleanSpotify(); cleanBattery(); cleanVolume(); };
  }, []);

  const gainRef = useRef(0);

  // ── 60fps Equalizer rAF loop (Smooth Gain Decay/Spring) ───────────────────
  useEffect(() => {
    const loop = () => {
      const targetGain = trackInfo.isPlaying ? 1.0 : 0.0;
      gainRef.current += (targetGain - gainRef.current) * 0.12;

      if (gainRef.current < 0.01 && !trackInfo.isPlaying) {
        setBarHeights([3, 3, 3, 3, 3]);
      } else {
        tRef.current += 0.04;
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
    }[activeState] || 'state-idle';
  };

  // 100% Solid Opaque background gradient (strictly #000000 when idle)
  const pillBg = buildPillBg(accentColor, activeState === 'expanded-music', !!trackInfo.title);

  // ── Mouse Passthrough Management ──────────────────────────────────────────
  useEffect(() => {
    if (window.electronAPI?.setIgnoreMouseEvents) {
      window.electronAPI.setIgnoreMouseEvents(true);
    }
  }, []);

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
    } else if (trackInfo.title) {
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
    setTrackInfo((prev) => ({ ...prev, progressMs: newProgressMs }));
  };

  const isMusicState = activeState === 'compact-music' || activeState === 'expanded-music' || activeState === 'expanded-lyrics';

  // ── Eq bar color & glow ───────────────────────────────────────────────────
  const { r, g, b } = accentColor;
  const eqColor  = `rgb(${r},${g},${b})`;
  const eqGlow   = `rgba(${r},${g},${b},0.35)`;
  const progGrad = `linear-gradient(90deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.75))`;

  const expandedGradient = buildPillBg(accentColor, true, true);
  const showGradient = (activeState === 'expanded-music' || activeState === 'expanded-lyrics') && trackInfo.isPlaying && !!trackInfo.title;

  return (
    <div className="island-anchor" onMouseEnter={handleMouseEnter}>
      <div
        className={`island-capsule ${getStateClass()} ${autoHidden ? 'auto-hidden' : ''}`}
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

          {activeState === 'idle' && <IdleWidget />}

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
          {activeState === 'expanded-weather' && <WeatherWidget />}

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
        </div>
      </div>
    </div>
  );
}
