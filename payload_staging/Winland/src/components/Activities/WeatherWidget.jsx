import React from 'react';
import { Sun, CloudRain, Thermometer, Wind } from 'lucide-react';

export default function WeatherWidget({ isCompact }) {
  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sun size={13} color="#f59e0b" />
          <span style={{ fontSize: 12, fontWeight: 700 }}>Cupertino</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>72°</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Sun size={22} color="#fef08a" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Cupertino</div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>Mostly Sunny</div>
          </div>
        </div>

        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>72°</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.06)', padding: '8px 12px', borderRadius: 12, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Thermometer size={13} color="rgba(255,255,255,0.7)" /> H:78° L:54°
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wind size={13} color="rgba(255,255,255,0.7)" /> 6 mph NW
        </div>
        <div style={{ color: '#60a5fa', fontWeight: 700 }}>AQI 24 • Good</div>
      </div>
    </div>
  );
}
