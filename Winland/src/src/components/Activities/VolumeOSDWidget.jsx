import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

export default function VolumeOSDWidget({ volume = 50 }) {
  const isMuted = volume === 0;
  const Icon = isMuted ? VolumeX : volume < 40 ? Volume1 : Volume2;

  // Color: muted = red, low = white, high = white (spotify green tint at max)
  const barColor = isMuted
    ? '#FF3B30'
    : volume > 80
    ? '#1DB954'
    : '#ffffff';

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center',
      padding: '0 18px',
      gap: 14,
    }}>
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: isMuted ? 'rgba(255,59,48,0.2)' : 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${isMuted ? 'rgba(255,59,48,0.35)' : 'rgba(255,255,255,0.15)'}`,
      }}>
        <Icon size={16} color={isMuted ? '#FF3B30' : 'rgba(255,255,255,0.9)'} />
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {isMuted ? 'Muted' : `Volume ${volume}%`}
        </div>

        {/* Track */}
        <div style={{
          width: '100%', height: 5,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 5, overflow: 'hidden',
        }}>
          <div style={{
            width: `${volume}%`,
            height: '100%',
            background: barColor,
            borderRadius: 5,
            transition: 'width 0.15s ease, background 0.2s ease',
          }} />
        </div>
      </div>

      {/* Percentage */}
      <div style={{
        fontSize: 13, fontWeight: 800,
        color: isMuted ? '#FF3B30' : volume > 80 ? '#1DB954' : 'rgba(255,255,255,0.8)',
        minWidth: 32, textAlign: 'right', flexShrink: 0,
      }}>
        {volume}
      </div>
    </div>
  );
}
