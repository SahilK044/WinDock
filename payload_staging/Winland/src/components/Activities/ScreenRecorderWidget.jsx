import React, { useState, useEffect } from 'react';
import { Video, Square } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function ScreenRecorderWidget({ isCompact, onStop }) {
  const [seconds, setSeconds] = useState(72);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="pulse-dot" style={{ width: 10, height: 10 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Screen Recording</div>
          <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.65)' }}>Display 1 (4K) • 60 FPS</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#ef4444' }}>
          {formatTime(seconds)}
        </span>
        <div className="glass-btn btn-danger" style={{ width: 34, height: 34 }} onClick={onStop} title="Stop Screen Recording">
          <Square size={12} fill="#fff" />
        </div>
      </div>
    </div>
  );
}
