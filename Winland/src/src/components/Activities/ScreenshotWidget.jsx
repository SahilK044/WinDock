import React from 'react';
import { Camera, Copy, Check } from 'lucide-react';

export default function ScreenshotWidget({ isCompact, imageSrc, onDismiss }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera size={14} color="#10b981" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Screenshot Captured</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Screenshot"
            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={20} color="#10b981" />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Screenshot Saved</div>
          <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.55)', marginTop: 2 }}>Copied to Clipboard</div>
        </div>
      </div>

      <button
        onClick={handleCopy}
        style={{
          background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
          border: 'none',
          borderRadius: 8,
          padding: '6px 12px',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
