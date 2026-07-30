import React from 'react';
import { Sparkles, Mic } from 'lucide-react';

export default function SiriWidget() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #ec4899, #8b5cf6 50%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
            animation: 'auroraPulse 2s ease-in-out infinite alternate',
          }}
        >
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Tahoe Siri Intelligence</div>
          <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>
            "Listening for commands..."
          </div>
        </div>
      </div>

      <div className="pulse-dot" style={{ background: '#a855f7', boxShadow: '0 0 12px #a855f7' }} />
    </div>
  );
}
