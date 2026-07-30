import React, { useState, useEffect } from 'react';
import { Share2, CheckCircle2, X } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function AirDropWidget({ isCompact, onComplete }) {
  const [progress, setProgress] = useState(15);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDone(true);
          soundEngine.playChime();
          return 100;
        }
        return prev + 12;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={13} color="#3b82f6" />
          <span style={{ fontSize: 12, fontWeight: 700 }}>AirDrop</span>
        </div>
        <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>{progress}%</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Share2 size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>AirDrop Transfer</div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>
              {isDone ? 'Sent to Alex’s MacBook Pro' : 'Sending 4 RAW Photos...'}
            </div>
          </div>
        </div>

        {isDone ? (
          <CheckCircle2 size={22} color="#22c55e" />
        ) : (
          <div className="glass-btn" style={{ width: 28, height: 28 }} onClick={onComplete}>
            <X size={14} />
          </div>
        )}
      </div>

      <div style={{ margin: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
          <span>{isDone ? 'Complete' : 'Transferring 48.2 MB'}</span>
          <span style={{ color: '#3b82f6' }}>{progress}%</span>
        </div>
        <div className="progress-track" style={{ height: 6 }}>
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: isDone ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'right', fontWeight: 600 }}>
        {isDone ? 'AirDrop chime sent' : '1.2 GB/s • Nearby Device'}
      </div>
    </div>
  );
}
