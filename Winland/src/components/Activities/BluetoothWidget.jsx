import React from 'react';
import { AlertTriangle, Bluetooth, Check, Headphones, Zap } from 'lucide-react';

const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

const ANIMATION_STYLES = `
@keyframes lidFloat {
  0%, 100% { transform: translateY(0) rotateX(64deg); }
  50% { transform: translateY(-1.4px) rotateX(70deg); }
}
@keyframes leftBudFloat {
  0%, 100% { transform: translate(-1px, 0) rotate(-5deg); }
  50% { transform: translate(-1.8px, -2px) rotate(-8deg); }
}
@keyframes rightBudFloat {
  0%, 100% { transform: translate(1px, 0) rotate(5deg); }
  50% { transform: translate(1.8px, -2px) rotate(8deg); }
}
@keyframes disconnectDrop {
  0% { transform: translateY(-3px) scale(1); opacity: 1; filter: blur(0); }
  100% { transform: translateY(5px) scale(0.84); opacity: 0.45; filter: blur(0.3px); }
}
@keyframes signalGlow {
  0%, 100% {
    transform: translateX(-50%) scale(0.78);
    opacity: 0.74;
    box-shadow: 0 0 4px var(--pulse-color), 0 0 8px var(--pulse-glow);
  }
  50% {
    transform: translateX(-50%) scale(1.18);
    opacity: 1;
    box-shadow: 0 0 6px var(--pulse-color), 0 0 13px var(--pulse-glow), 0 0 18px var(--pulse-glow);
  }
}
@keyframes bluetoothContentIn {
  0% { opacity: 0; transform: translateY(7px) scale(0.97); filter: blur(3px); }
  60% { opacity: 1; transform: translateY(-1px) scale(1.01); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes bluetoothIconBloom {
  0% { transform: scale(0.72); opacity: 0; filter: blur(4px); }
  58% { transform: scale(1.08); opacity: 1; filter: blur(0); }
  100% { transform: scale(1); opacity: 1; filter: blur(0); }
}
`;

function EarphoneIcon({ size = 26, color = '#30d158', isAnimated = true, isDisconnected = false }) {
  const motion = isDisconnected
    ? { animation: 'disconnectDrop 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }
    : {};

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="budShell" x1="6" y1="3" x2="22" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.52" stopColor="#eef3f8" />
          <stop offset="1" stopColor={color} stopOpacity="0.86" />
        </linearGradient>
        <linearGradient id="caseShell" x1="5" y1="8" x2="23" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.34)" />
          <stop offset="0.48" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
        </linearGradient>
        <filter id="softShadow" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.42" />
        </filter>
      </defs>

      <g filter="url(#softShadow)">
        <ellipse cx="14" cy="21.5" rx="8.8" ry="2.2" fill="rgba(0,0,0,0.28)" />
        <rect x="5.2" y="11.4" width="17.6" height="12.2" rx="4.8" fill="url(#caseShell)" stroke="rgba(255,255,255,0.34)" strokeWidth="0.75" />
        <path d="M7.3 15.2C9.2 16 18.8 16 20.7 15.2" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="14" cy="19.1" r="0.85" fill={isDisconnected ? '#ff453a' : '#30d158'} />

        <g style={{ animation: isAnimated && !isDisconnected ? 'lidFloat 2s cubic-bezier(0.45, 0, 0.2, 1) infinite' : undefined, transformOrigin: '14px 11px' }}>
          <path d="M5.5 11.5C6 8 9 6.2 14 6.2C19 6.2 22 8 22.5 11.5H5.5Z" fill="url(#caseShell)" stroke="rgba(255,255,255,0.34)" strokeWidth="0.75" />
        </g>

        <g style={{ ...motion, animation: isDisconnected ? motion.animation : isAnimated ? 'leftBudFloat 2s cubic-bezier(0.45, 0, 0.2, 1) infinite' : undefined, transformOrigin: '10px 9px' }}>
          <path d="M9.9 3.8C8.1 3.8 6.8 5.2 6.8 7C6.8 8.7 8 10 9.6 10.4V9.1C9.6 8.2 10.3 7.5 11.2 7.5H11.7V6.3C11.7 4.9 10.9 3.8 9.9 3.8Z" fill="url(#budShell)" />
          <path d="M6.1 6.5C5.7 6.9 5.7 7.7 6.1 8.1L7.4 7.3L6.1 6.5Z" fill="#fff" opacity="0.95" />
          <rect x="9.55" y="9.25" width="2.15" height="7.7" rx="1.08" fill="url(#budShell)" />
          <rect x="9.55" y="15.6" width="2.15" height="1.15" rx="0.58" fill="#ffffff" opacity="0.96" />
        </g>

        <g style={{ ...motion, animation: isDisconnected ? motion.animation : isAnimated ? 'rightBudFloat 2s cubic-bezier(0.45, 0, 0.2, 1) infinite' : undefined, transformOrigin: '18px 9px' }}>
          <path d="M18.1 3.8C19.9 3.8 21.2 5.2 21.2 7C21.2 8.7 20 10 18.4 10.4V9.1C18.4 8.2 17.7 7.5 16.8 7.5H16.3V6.3C16.3 4.9 17.1 3.8 18.1 3.8Z" fill="url(#budShell)" />
          <path d="M21.9 6.5C22.3 6.9 22.3 7.7 21.9 8.1L20.6 7.3L21.9 6.5Z" fill="#fff" opacity="0.95" />
          <rect x="16.3" y="9.25" width="2.15" height="7.7" rx="1.08" fill="url(#budShell)" />
          <rect x="16.3" y="15.6" width="2.15" height="1.15" rx="0.58" fill="#ffffff" opacity="0.96" />
        </g>
      </g>
    </svg>
  );
}

function MacBatteryIcon({ batteryPct = 100, color = '#30d158' }) {
  const fillWidth = Math.max(1.5, 14 * (Math.max(5, Math.min(100, batteryPct)) / 100));

  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="0.75" width="17.5" height="10.5" rx="3.25" stroke={color} strokeWidth="1.5" />
      <rect x="2.5" y="2.5" width={fillWidth} height="7" rx="1.75" fill={color} />
      <path d="M20 4.25C20.7 4.25 21.25 4.8 21.25 5.5V6.5C21.25 7.2 20.7 7.75 20 7.75V4.25Z" fill={color} />
    </svg>
  );
}

export default function BluetoothWidget({
  deviceName = 'Earphones',
  batteryPct = 100,
  isCharging = false,
  leftPct = null,
  rightPct = null,
  typeStr = 'Bluetooth Audio',
  isCompact = false,
  connectionState = 'connected',
}) {
  const isDisconnected = connectionState === 'disconnected';
  const isLowPower = connectionState === 'low-battery' || (batteryPct !== null && batteryPct <= 20 && !isCharging && !isDisconnected);

  const status = isDisconnected
    ? { color: '#ff453a', accent: '#ff453a', label: 'Disconnected', detail: 'Bluetooth Audio Off' }
    : isLowPower
      ? { color: '#ff9f0a', accent: '#ff9f0a', label: 'Low Battery', detail: 'Please Charge Device' }
      : { color: '#30d158', accent: '#34d399', label: 'Connected', detail: typeStr || 'Bluetooth Audio' };

  const nameLower = (deviceName || '').toLowerCase();
  const isEarbud = ['buds', 'ear', 'airpods', 'smokin', 'in-ear', 'tws'].some((term) => nameLower.includes(term));

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', padding: '0 12px', fontFamily: MAC_FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: `1px solid ${status.accent}34`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isEarbud ? <EarphoneIcon size={16} color={status.accent} isAnimated={!isDisconnected} isDisconnected={isDisconnected} /> : <Headphones size={12} color={status.accent} />}
          </div>
          <span style={{ fontSize: 11, fontWeight: 650, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deviceName}</span>
        </div>
        {batteryPct !== null && !isDisconnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <MacBatteryIcon batteryPct={batteryPct} color={status.color} />
            <span style={{ fontSize: 10, fontWeight: 750, color: status.color }}>{batteryPct}%</span>
          </div>
        )}
      </div>
    );
  }

  const rightPillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 10px',
    borderRadius: 11,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.07))',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.32)',
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 17px 0 18px',
      boxSizing: 'border-box',
      fontFamily: MAC_FONT,
      position: 'relative',
      overflow: 'hidden',
      '--pulse-color': status.accent,
      '--pulse-glow': `${status.accent}90`,
    }}>
      <style>{ANIMATION_STYLES}</style>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 11% 50%, ${status.accent}18 0%, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 42%)`,
        opacity: 0.9,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 13, zIndex: 1, minWidth: 0, flex: 1, animation: 'bluetoothContentIn 0.58s cubic-bezier(0.2, 0.9, 0.2, 1) both' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          flexShrink: 0,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.155), rgba(255,255,255,0.045) 58%, rgba(255,255,255,0.025))',
          border: `1px solid ${status.accent}45`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -1px 0 rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.42), 0 0 16px ${status.accent}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: 'bluetoothIconBloom 0.56s cubic-bezier(0.2, 0.9, 0.2, 1) both',
        }}>
          {isEarbud ? <EarphoneIcon size={25} color={status.accent} isAnimated={!isDisconnected} isDisconnected={isDisconnected} /> : <Headphones size={18} color={status.accent} />}
          <div style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: isDisconnected ? '#ff453a' : '#ffffff',
            animation: 'signalGlow 0.95s infinite cubic-bezier(0.37, 0, 0.63, 1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#111114',
            border: `1px solid ${status.accent}4d`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bluetooth size={8} color={status.accent} />
          </div>
        </div>

        <div style={{ minWidth: 0, flex: 1, transform: 'translateY(-0.5px)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '15px' }}>
            {deviceName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 10.2, fontWeight: 600, color: 'rgba(255,255,255,0.58)', lineHeight: '12px' }}>
            <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}aa`, flexShrink: 0 }} />
            <span style={{ color: status.color, fontWeight: 700 }}>{status.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.34)', margin: '0 1px' }}>•</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.58)', fontWeight: 600 }}>{status.detail}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1, flexShrink: 0, animation: 'bluetoothContentIn 0.62s cubic-bezier(0.2, 0.9, 0.2, 1) 0.04s both' }}>
        {isDisconnected ? (
          <div style={{ ...rightPillStyle, background: 'linear-gradient(180deg, rgba(255,69,58,0.18), rgba(255,69,58,0.09))', border: '1px solid rgba(255,69,58,0.34)', color: '#ff453a', fontSize: 10.5, fontWeight: 700 }}>Offline</div>
        ) : isLowPower ? (
          <div style={{ ...rightPillStyle, background: 'linear-gradient(180deg, rgba(255,159,10,0.18), rgba(255,159,10,0.09))', border: '1px solid rgba(255,159,10,0.35)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 10px rgba(255,159,10,0.16)' }}>
            <AlertTriangle size={13} color="#ff9f0a" />
            <span style={{ fontSize: 11.5, fontWeight: 750, color: '#ff9f0a' }}>{batteryPct}%</span>
          </div>
        ) : leftPct !== null && rightPct !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {['L', 'R'].map((side, index) => (
              <div key={side} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 8px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{side}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>{index === 0 ? leftPct : rightPct}%</span>
              </div>
            ))}
          </div>
        ) : batteryPct !== null ? (
          <div style={rightPillStyle}>
            {isCharging ? <Zap size={13} color="#30d158" /> : <MacBatteryIcon batteryPct={batteryPct} color={status.color} />}
            <span style={{ fontSize: 11.5, fontWeight: 750, color: status.color, lineHeight: '14px' }}>{batteryPct}%</span>
          </div>
        ) : (
          <div style={{ ...rightPillStyle, color: '#30d158', fontSize: 11, fontWeight: 700 }}>
            <Check size={13} color="#30d158" />
            <span>Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}
