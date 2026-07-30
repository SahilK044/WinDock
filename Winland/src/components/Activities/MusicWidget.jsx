import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, RefreshCw, X } from 'lucide-react';

const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

const StraightMicIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);

function fmt(ms) {
  if (!ms || isNaN(ms) || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2]);
      const timeMs = Math.round((min * 60 + sec) * 1000);
      const text = match[3].trim();
      if (text) {
        result.push({ timeMs, text });
      }
    }
  }

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

// Fluid Apple decelerating smooth scroll for active lyric tracking
function smoothScrollTo(container, targetTop, duration = 680) {
  const startTop = container.scrollTop;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 1) return;

  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    container.scrollTop = startTop + delta * ease;
    if (t < 1) {
      container.__lyricScrollRaf = requestAnimationFrame(step);
    }
  }

  if (container.__lyricScrollRaf) cancelAnimationFrame(container.__lyricScrollRaf);
  container.__lyricScrollRaf = requestAnimationFrame(step);
}


const SyncedLyricsView = ({ title, artist, coverUrl, progressMs, isPlaying = false, onSeek, onClose, eqColor, eqGlow }) => {
  const [lyrics, setLyrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plainLyrics, setPlainLyrics] = useState('');
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Sub-millisecond continuous timekeeper for 60 FPS real-time vocal tracking
  const [smoothMs, setSmoothMs] = useState(progressMs);
  const syncRef = useRef({ baseMs: progressMs, baseTime: performance.now() });

  useEffect(() => {
    const drift = Math.abs(progressMs - smoothMs);
    if (drift > 1200 || !isPlaying) {
      syncRef.current = { baseMs: progressMs, baseTime: performance.now() };
      setSmoothMs(progressMs);
    }
  }, [progressMs, isPlaying, title]);

  useEffect(() => {
    if (!isPlaying) return;
    let rafId;
    const updateLoop = () => {
      const delta = performance.now() - syncRef.current.baseTime;
      setSmoothMs(syncRef.current.baseMs + delta);
      rafId = requestAnimationFrame(updateLoop);
    };
    rafId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, title]);

  useEffect(() => {
    if (!title) return;
    setLoading(true);
    setLyrics([]);
    setPlainLyrics('');

    const cleanTitle = title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').split('-')[0].trim();
    const cleanArtist = artist ? artist.split(',')[0].trim() : '';

    const fetchDirect = async () => {
      try {
        const query = cleanArtist
          ? `track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`
          : `track_name=${encodeURIComponent(cleanTitle)}`;
        const res = await fetch(`https://lrclib.net/api/get?${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics) { setLyrics(parseLrc(data.syncedLyrics)); setLoading(false); return true; }
          if (data.plainLyrics) { setPlainLyrics(data.plainLyrics); setLoading(false); return true; }
        }
      } catch (e) {}
      return false;
    };

    const fetchSearch = async () => {
      try {
        const q = `${cleanTitle} ${cleanArtist}`.trim();
        const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results.length > 0) {
            const best = results.find((r) => r.syncedLyrics) || results[0];
            if (best.syncedLyrics) setLyrics(parseLrc(best.syncedLyrics));
            else if (best.plainLyrics) setPlainLyrics(best.plainLyrics);
          }
        }
      } catch (e) {}
      setLoading(false);
    };

    fetchDirect().then((ok) => { if (!ok) fetchSearch(); });
  }, [title, artist]);

  // Find active line index using sub-second smoothMs
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (smoothMs >= lyrics[i].timeMs) activeIndex = i;
    else break;
  }

  // Karaoke word-wipe progress within the active line (0–100)
  let activeFillPct = 0;
  if (activeIndex >= 0) {
    const lineStart = lyrics[activeIndex].timeMs;
    const lineEnd = lyrics[activeIndex + 1]?.timeMs ?? (lineStart + 4000);
    const span = Math.max(1, lineEnd - lineStart);
    activeFillPct = Math.max(0, Math.min(100, ((smoothMs - lineStart) / span) * 100));
  }

  // Snappy spring-eased smooth scroll to center the active lyric line
  useEffect(() => {
    if (!scrollRef.current || !activeRef.current) return;
    const container = scrollRef.current;
    const el = activeRef.current;
    const target = (el.offsetTop + el.offsetHeight / 2) - (container.clientHeight / 2);
    smoothScrollTo(container, target, 680);
  }, [activeIndex]);

  const glowColor = eqGlow || (eqColor ? `${eqColor}55` : 'rgba(255,255,255,0.16)');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px 10px',
        boxSizing: 'border-box',
        fontFamily: MAC_FONT,
        position: 'relative',
        zIndex: 5,
        borderRadius: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* Ambient accent glow — quiet, restrained, ties the lyric view back to the track's color */}
      <div className="lyric-ambient-glow" style={{ '--lyric-glow-color': glowColor }} />

      {/* Header: album art + song title + artist */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        {/* Mini album art */}
        <div className="album-art-spring" style={{
          width: 38, height: 38, minWidth: 38,
          borderRadius: 10,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 3px 12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset`,
        }}>
          {coverUrl ? (
            <img src={coverUrl} alt="art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Music size={16} color="rgba(255,255,255,0.4)" />
          )}
        </div>
        {/* Title + artist */}
        <div className="track-change-wrapper" key={title} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.1px' }}>
            {title}
          </div>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
            {artist}
          </div>
        </div>
      </div>

      {/* Clip wrapper: hard-clips the scroll layer inside the pill's rounded corners */}
      <div
        style={{
          flex: 1,
          borderRadius: 'inherit',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
        }}
      >
        {/* Lyrics scroll area — no native scrollbar */}
        <div
          ref={scrollRef}
          className="lyrics-scroll"
          style={{
            width: '100%',
            height: '100%',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, gap: 6 }}>
              <RefreshCw size={13} className="spin-loader" /> Fetching lyrics…
            </div>
          ) : lyrics.length > 0 ? (
            <div style={{ padding: '34px 4px' }}>
              {lyrics.map((item, idx) => {
                const isActive = idx === activeIndex;
                const isPast = idx < activeIndex;
                const rowClass = `lyric-row ${isActive ? 'is-active' : isPast ? 'is-past' : 'is-future'}`;
                return (
                  <div
                    key={idx}
                    ref={isActive ? activeRef : null}
                    className={rowClass}
                    onClick={(e) => { e.stopPropagation(); onSeek?.(item.timeMs); }}
                    style={{ '--lyric-glow-color': glowColor }}
                  >
                    <span
                      className="lyric-text"
                      style={isActive ? { '--lyric-fill': `${activeFillPct}%` } : undefined}
                    >
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : plainLyrics ? (
            <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 1.6, padding: '10px 4px' }}>
              {plainLyrics}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
              No lyrics found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 1:1 Apple Smooth Auto-Marquee Text Component
const MarqueeText = ({ children, style = {}, className = '' }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const cWidth = containerRef.current.offsetWidth;
      const tWidth = textRef.current.scrollWidth;
      if (tWidth > cWidth) {
        setShouldScroll(true);
        setScrollDistance(tWidth - cWidth + 16);
      } else {
        setShouldScroll(false);
      }
    }
  }, [children]);

  return (
    <div
      ref={containerRef}
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        position: 'relative',
        maskImage: shouldScroll ? 'linear-gradient(90deg, #000 85%, transparent 100%)' : 'none',
        WebkitMaskImage: shouldScroll ? 'linear-gradient(90deg, #000 85%, transparent 100%)' : 'none',
        ...style,
      }}
      className={className}
    >
      <div
        ref={textRef}
        className={shouldScroll ? 'apple-marquee-text' : ''}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          '--scroll-dist': `-${scrollDistance}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Dedicated Album Art Component (Defined outside parent to prevent React component teardown on re-renders)
const AlbumArt = ({ coverUrl, title, size = 28, r = 7 }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [coverUrl]);

  const isVideo = title && (
    title.toLowerCase().includes('youtube') ||
    title.toLowerCase().includes('f1') ||
    title.includes('|') ||
    title.toLowerCase().includes('video') ||
    title.toLowerCase().includes('prime')
  );

  return (
    <div
      key={coverUrl || title}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: r,
        overflow: 'hidden',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {(coverUrl && !imgError) ? (
        <img
          src={coverUrl}
          alt="Album Art"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : isVideo ? (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #ff0000 0%, #b30000 60%, #800000 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)',
        }}>
          <Play size={size * 0.45} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
        </div>
      ) : (
        <Music size={size * 0.45} color="rgba(255,255,255,0.5)" />
      )}
    </div>
  );
};

export default function MusicWidget({
  isCompact,
  isExpanded,
  isSplit,
  isLyricsView,
  onToggleLyrics,
  trackInfo = {},
  barHeights = [3, 3, 3, 3, 3],
  eqColor = '#34c759',
  eqGlow = 'rgba(52,199,89,0.35)',
  progressGradient = 'linear-gradient(90deg, #34c759, #30d158)',
  onExpand,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
}) {
  const { title, artist, album, coverUrl, isPlaying = false, progressMs = 0, durationMs = 0 } = trackInfo;

  /* ─── EXPANDED SYNCED LYRICS VIEW ─── */
  if (isLyricsView) {
    return (
      <SyncedLyricsView
        title={title}
        artist={artist}
        coverUrl={coverUrl}
        progressMs={progressMs}
        isPlaying={isPlaying}
        onSeek={onSeek}
        onClose={onToggleLyrics}
        eqColor={eqColor}
        eqGlow={eqGlow}
      />
    );
  }

  const [time, setTime] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgressMs, setDragProgressMs] = useState(0);
  const [dragPosX, setDragPosX] = useState(0);
  const scrubberRef = useRef(null);

  // ── 60 FPS Sub-millisecond Smooth Real-time Progress Tracking ─────────────
  const [realtimeMs, setRealtimeMs] = useState(progressMs);
  const syncRef = useRef({ baseMs: progressMs, baseTime: performance.now() });
  const lastTitleRef = useRef(title);
  const [visualizerOpacity, setVisualizerOpacity] = useState(1);

  useEffect(() => {
    if (lastTitleRef.current === title) return;
    lastTitleRef.current = title;
    setVisualizerOpacity(0.18);
    const fadeTimer = setTimeout(() => setVisualizerOpacity(1), 170);
    return () => clearTimeout(fadeTimer);
  }, [title]);

  useEffect(() => {
    const drift = Math.abs(progressMs - realtimeMs);
    if (drift > 1000 || !isPlaying) {
      syncRef.current = { baseMs: progressMs, baseTime: performance.now() };
      setRealtimeMs(progressMs);
    }
  }, [progressMs, isPlaying, title]);

  useEffect(() => {
    if (!isPlaying || durationMs <= 0) return;
    let rafId;
    const updateLoop = () => {
      const delta = performance.now() - syncRef.current.baseTime;
      const current = syncRef.current.baseMs + delta;
      setRealtimeMs(Math.min(current, durationMs));
      rafId = requestAnimationFrame(updateLoop);
    };
    rafId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, durationMs, title]);

  // Clock for empty expanded state fallback
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDisplayMs = isDragging ? dragProgressMs : realtimeMs;
  const pct = durationMs > 0 ? Math.min(100, Math.max(0, (activeDisplayMs / durationMs) * 100)) : 0;

  const calcMsFromEvent = (e) => {
    if (!scrubberRef.current || !durationMs) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    setDragPosX(clickX);
    return Math.round(ratio * durationMs);
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    const targetMs = calcMsFromEvent(e);
    setDragProgressMs(targetMs);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    const targetMs = calcMsFromEvent(e);
    setDragProgressMs(targetMs);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    const targetMs = calcMsFromEvent(e);
    onSeek?.(targetMs);
  };

  const handleScrubberClick = (e) => {
    e.stopPropagation();
    const targetMs = calcMsFromEvent(e);
    onSeek?.(targetMs);
  };

  const hours = time.getHours();
  const mins = time.getMinutes();
  const displayHours = hours % 12 || 12;
  const timeString = `${displayHours}:${mins < 10 ? '0' : ''}${mins}`;
  const dateString = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Common Equalizer Component (Smooth Liquid Spring Animation)
  const EqBars = ({ h = 14 }) => (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 2.5,
      height: h,
      flexShrink: 0,
      opacity: visualizerOpacity,
      transform: `scaleY(${0.92 + visualizerOpacity * 0.08})`,
      transformOrigin: 'bottom center',
      filter: visualizerOpacity < 1 ? 'blur(0.4px)' : 'none',
      transition: 'opacity 0.36s cubic-bezier(0.2, 0.9, 0.2, 1), transform 0.42s cubic-bezier(0.2, 0.9, 0.2, 1), filter 0.36s ease',
    }}>
      {barHeights.map((bh, i) => (
        <div
          key={i}
          style={{
            width: 2.5,
            height: `${Math.max(8, bh)}%`,
            background: `linear-gradient(180deg, rgba(255,255,255,0.94), ${eqColor} 38%, ${eqColor})`,
            borderRadius: 2,
            boxShadow: bh > 10 ? `0 0 7px ${eqGlow}, 0 0 14px ${eqGlow}` : `0 0 4px ${eqGlow}`,
            transition: 'height 0.05s linear, background 0.9s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.9s cubic-bezier(0.2, 0.9, 0.2, 1)',
          }}
        />
      ))}
    </div>
  );

  /* ─── SPLIT PILL (Secondary Left Component) ─── */
  if (isSplit) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px' }}>
        <AlbumArt coverUrl={coverUrl} title={title} size={26} r={6} />
        <EqBars h={14} />
      </div>
    );
  }

  /* ─── COMPACT PILL (Single Active Island State) ─── */
  if (isCompact) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px', cursor: 'pointer', fontFamily: MAC_FONT,
        }}
      >
        <div className="track-change-wrapper" key={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, paddingRight: 8 }}>
          <AlbumArt coverUrl={coverUrl} title={title} size={28} r={7} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '14px' }}>
              {title || 'Music Player'}
            </div>
            {artist && (
              <div style={{ fontSize: 9.5, fontWeight: 500, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '13px' }}>
                {artist}
              </div>
            )}
          </div>
        </div>
        <EqBars h={14} />
      </div>
    );
  }

  /* ─── EXPANDED PILL (1:1 macOS / iOS Layout) ─── */
  if (!title) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '10px 0', fontFamily: MAC_FONT,
      }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', lineHeight: '36px' }}>
          {timeString}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>
          {dateString}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 18px', boxSizing: 'border-box', fontFamily: MAC_FONT }}>

      {/* ── Top Row: Album Art | Track Info | Equalizer ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlbumArt coverUrl={coverUrl} title={title} size={52} r={12} />

        <div className="track-change-wrapper" key={title} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <MarqueeText style={{ fontSize: 14, fontWeight: 700, color: 'inherit', lineHeight: '18px', letterSpacing: '-0.2px' }}>
            {title}
          </MarqueeText>
          {artist && (
            <MarqueeText className="widget-subtitle" style={{ fontSize: 12, fontWeight: 500, marginTop: 2, lineHeight: '16px' }}>
              {artist}
            </MarqueeText>
          )}
          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3, color: eqColor, transition: 'color 0.8s ease' }}>
            {isPlaying ? 'Media • Active' : 'Media • Paused'}
          </div>
        </div>

        <EqBars h={20} />
      </div>

      {/* ── Middle Row: Scrubber / Progress Bar & Timers ── */}
      <div style={{ marginTop: 6, marginBottom: 2, position: 'relative' }}>
        {/* Floating Apple Scrubber Tooltip */}
        {isDragging && (
          <div
            style={{
              position: 'absolute',
              top: -24,
              left: dragPosX,
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#000000',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            {fmt(dragProgressMs)}
          </div>
        )}

        <div
          ref={scrubberRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
          onClick={handleScrubberClick}
          style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.14)', borderRadius: 4, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div
            className="progress-shimmer-bar"
            style={{
              width: `${pct}%`,
              height: '100%',
              background: progressGradient,
              borderRadius: 4,
              boxShadow: `0 0 8px ${eqGlow}`,
              transition: isDragging ? 'none' : 'background 0.9s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.9s cubic-bezier(0.2, 0.9, 0.2, 1), opacity 0.36s ease',
              opacity: visualizerOpacity,
              willChange: 'width',
            }}
          >
            {/* Animated Shimmer Light Wave */}
            <div
              className="progress-shimmer-overlay"
              style={{
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            />
          </div>
        </div>
        <div className="widget-subtitle" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4, fontWeight: 600 }}>
          <span>{fmt(activeDisplayMs)}</span>
          <span>{durationMs > 0 ? fmt(durationMs) : '--:--'}</span>
        </div>
      </div>

      {/* ── Bottom Row: Apple Transport Controls (Smooth Spring Morphing) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 4 }}>
        <button
          className="icon-only"
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer', padding: 6, color: 'inherit', display: 'flex', alignItems: 'center', transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <SkipBack size={22} fill="currentColor" color="currentColor" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onTogglePlay?.(); }}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: eqColor,
            boxShadow: `0 0 18px ${eqGlow}`,
            transition: 'background 0.8s ease, box-shadow 0.8s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Pause Icon Wrapper */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out, visibility 0.22s ease-out',
              opacity: isPlaying ? 1 : 0,
              visibility: isPlaying ? 'visible' : 'hidden',
              transform: isPlaying ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-45deg)',
              pointerEvents: 'none',
            }}
          >
            <Pause size={20} fill="#ffffff" color="#ffffff" />
          </div>

          {/* Play Icon Wrapper */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out, visibility 0.22s ease-out',
              opacity: isPlaying ? 0 : 1,
              visibility: isPlaying ? 'hidden' : 'visible',
              transform: isPlaying ? 'scale(0.6) rotate(45deg)' : 'scale(1) rotate(0deg)',
              pointerEvents: 'none',
            }}
          >
            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
          </div>
        </button>

        <button
          className="icon-only"
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer', padding: 6, color: 'inherit', display: 'flex', alignItems: 'center', transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <SkipForward size={22} fill="currentColor" color="currentColor" />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleLyrics?.();
          }}
          title="Synced Lyrics"
          style={{
            position: 'absolute',
            right: 22,
            background: isLyricsView ? 'rgba(255, 255, 255, 0.15)' : 'none',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            padding: 6,
            color: isLyricsView ? eqColor : 'rgba(255, 255, 255, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            filter: isLyricsView ? `drop-shadow(0 0 6px ${eqGlow})` : 'none',
          }}
        >
          <StraightMicIcon size={18} color={isLyricsView ? eqColor : 'rgba(255, 255, 255, 0.85)'} />
        </button>
      </div>

    </div>
  );
}
