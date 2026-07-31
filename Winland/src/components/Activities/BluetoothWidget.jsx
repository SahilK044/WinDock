import React from 'react';
import { Headphones, Bluetooth, Zap, Check, AlertTriangle } from 'lucide-react';

const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

// Keyframes for Ultra-Clean 1:1 Apple AirPods 3D Case Opening & Snappy Pulse
const ANIMATION_STYLES = `
@keyframes caseLidOpen {
  0% {
    transform: rotateX(0deg) translateY(0);
    opacity: 1;
  }
  20% {
    transform: rotateX(-115deg) translateY(-3.5px) scaleY(0.75);
    opacity: 0.9;
  }
  100% {
    transform: rotateX(-115deg) translateY(-3.5px) scaleY(0.75);
    opacity: 0.9;
  }
}

@keyframes leftPopOut {
  0% {
    transform: translateY(7px) scale(0.45);
    opacity: 0;
  }
  22% {
    transform: translateY(-4px) translateX(-2.5px) rotate(-14deg) scale(1.08);
    opacity: 1;
  }
  48% {
    transform: translateY(-0.8px) translateX(-1.2px) rotate(-4deg) scale(1);
    opacity: 1;
  }
  75% {
    transform: translateY(-2.5px) translateX(-1.8px) rotate(-8deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(0px) translateX(-0.8px) rotate(-3deg) scale(1);
    opacity: 1;
  }
}

@keyframes rightPopOut {
  0% {
    transform: translateY(7px) scale(0.45);
    opacity: 0;
  }
  22% {
    transform: translateY(-4px) translateX(2.5px) rotate(14deg) scale(1.08);
    opacity: 1;
  }
  48% {
    transform: translateY(-0.8px) translateX(1.2px) rotate(4deg) scale(1);
    opacity: 1;
  }
  75% {
    transform: translateY(-2.5px) translateX(1.8px) rotate(8deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(0px) translateX(0.8px) rotate(3deg) scale(1);
    opacity: 1;
  }
}

@keyframes superPulse {
  0% {
    transform: translateX(-50%) scale(1);
    opacity: 0.9;
    box-shadow: 0 0 3px var(--pulse-color, #00f0ff), 0 0 8px var(--pulse-color, #00f0ff), 0 0 12px var(--pulse-glow, rgba(0, 240, 255, 0.9));
  }
  50% {
    transform: translateX(-50%) scale(1.5);
    opacity: 0.5;
    box-shadow: 0 0 6px var(--pulse-color, #00f0ff), 0 0 14px var(--pulse-color, #00f0ff), 0 0 20px var(--pulse-glow, rgba(0, 240, 255, 1));
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.9;
    box-shadow: 0 0 3px var(--pulse-color, #00f0ff), 0 0 8px var(--pulse-color, #00f0ff), 0 0 12px var(--pulse-glow, rgba(0, 240, 255, 0.9));
  }
}
`;

// Pristine Animated Apple 1:1 3D Wireless AirPods Case Vector Graphic
function EarphoneIcon({ size = 26, color = '#00f0ff', isAnimated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="earbudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id="caseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.09)" />
        </linearGradient>
      </defs>

      {/* 3D Glass Charging Case Body */}
      <rect x="5.5" y="11.5" width="17" height="13" rx="4.5" fill="url(#caseGrad)" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.8" />
      <rect x="7" y="12.5" width="14" height="3.5" rx="1.75" fill="rgba(0, 0, 0, 0.3)" />
      
      {/* Front LED Charging Status Dot */}
      <circle cx="14" cy="18.5" r="0.85" fill={color === '#ff453a' ? '#ff453a' : '#30d158'} />

      {/* Case Open Hinge Lid */}
      <g style={isAnimated ? {
        animation: 'caseLidOpen 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate',
        transformOrigin: '14px 11.5px',
      } : { transform: 'rotateX(-115deg) translateY(-3.5px)', transformOrigin: '14px 11.5px' }}>
        <path d="M5.5 11.5C5.5 8.5 8.5 6.5 14 6.5C19.5 6.5 22.5 8.5 22.5 11.5H5.5Z" fill="url(#caseGrad)" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.8" />
      </g>

      {/* Left Earbud Pop-Out Levitation */}
      <g style={isAnimated ? {
        animation: 'leftPopOut 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate',
        transformOrigin: '9.5px 8px',
      } : {}}>
        <path d="M9.8 4C8.2 4 6.8 5.4 6.8 7C6.8 8.6 7.9 9.8 9.4 10.2V9.4C9.4 8.4 10.2 7.6 11.2 7.6H11.6V6.6C11.6 5.2 10.8 4 9.8 4Z" fill="url(#earbudGrad)" />
        <path d="M6.2 6.6C5.7 7 5.7 7.6 6.2 8L7.4 7.3L6.2 6.6Z" fill="#ffffff" opacity="0.95" />
        <rect x="9.4" y="9.4" width="2.2" height="7.2" rx="1.1" fill="url(#earbudGrad)" />
        <rect x="9.4" y="15.4" width="2.2" height="1.2" rx="0.6" fill="#ffffff" />
      </g>

      {/* Right Earbud Pop-Out Levitation */}
      <g style={isAnimated ? {
        animation: 'rightPopOut 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate',
        transformOrigin: '17.5px 8px',
      } : {}}>
        <path d="M17.4 4C19 4 20.4 5.4 20.4 7C20.4 8.6 19.3 9.8 17.8 10.2V9.4C17.8 8.4 17 7.6 16 7.6H15.6V6.6C15.6 5.2 16.4 4 17.4 4Z" fill="url(#earbudGrad)" />
        <path d="M21 6.6C21.5 7 21.5 7.6 21 8L19.8 7.3L21 6.6Z" fill="#ffffff" opacity="0.95" />
        <rect x="15.6" y="9.4" width="2.2" height="7.2" rx="1.1" fill="url(#earbudGrad)" />
        <rect x="15.6" y="15.4" width="2.2" height="1.2" rx="0.6" fill="#ffffff" />
      </g>
    </svg>
  );
}

// 1:1 macOS Tahoe Vector Battery Shell
function MacBatteryIcon({ batteryPct = 100, color = '#30d158' }) {
  const fillWidth = Math.max(1.5, 14 * (Math.max(5, Math.min(100, batteryPct)) / 100));
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Shell */}
      <rect x="0.75" y="0.75" width="17.5" height="10.5" rx="3.25" stroke={color} strokeWidth="1.5" />
      {/* Inner Level */}
      <rect x="2.5" y="2.5" width={fillWidth} height="7" rx="1.75" fill={color} />
      {/* Terminal Cap */}
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
  connectionState = 'connected', // 'connected' | 'disconnected' | 'low-battery'
}) {
  const isDisconnected = connectionState === 'disconnected';
  const isLowPower = connectionState === 'low-battery' || (batteryPct !== null && batteryPct <= 20 && !isCharging && !isDisconnected);

  // Status colors: Green = Normal, Amber = Low, Red = Disconnected
  let statusColor = '#30d158';
  let accentColor = '#00f0ff';
  let statusText = 'Connected';
  let subText = typeStr || 'Bluetooth Audio';

  if (isDisconnected) {
    statusColor = '#ff453a';
    accentColor = '#ff453a';
    statusText = 'Disconnected';
    subText = 'Bluetooth Audio Off';
  } else if (isLowPower) {
    statusColor = '#ff9f0a';
    accentColor = '#ff9f0a';
    statusText = 'Low Battery';
    subText = 'Please Charge Device';
  }

  const nameLower = (deviceName || '').toLowerCase();
  const isEarbud = nameLower.includes('buds') ||
                   nameLower.includes('ear') ||
                   nameLower.includes('airpods') ||
                   nameLower.includes('smokin') ||
                   nameLower.includes('in-ear') ||
                   nameLower.includes('tws');

  if (isCompact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', height: '100%', padding: '0 12px', fontFamily: MAC_FONT,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isEarbud ? <EarphoneIcon size={16} color={accentColor} isAnimated={!isDisconnected} /> : <Headphones size={12} color={accentColor} />}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#ffffff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: MAC_FONT,
          }}>
            {deviceName}
          </span>
        </div>
        {batteryPct !== null && !isDisconnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <MacBatteryIcon batteryPct={batteryPct} color={statusColor} />
            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{batteryPct}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 18px', boxSizing: 'border-box', fontFamily: MAC_FONT,
      position: 'relative', overflow: 'hidden',
      '--pulse-color': accentColor,
      '--pulse-glow': `${accentColor}aa`,
    }}>
      <style>{ANIMATION_STYLES}</style>

      {/* Left: Earphones / Headphones Glyph with 3D AirPods Case Open & Pop-Out Animation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${accentColor}55`,
          boxShadow: `0 4px 14px rgba(0,0,0,0.3), 0 0 10px ${accentColor}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {isEarbud ? (
            <EarphoneIcon size={24} color={accentColor} isAnimated={!isDisconnected} />
          ) : (
            <Headphones size={18} color={accentColor} />
          )}
          
          {/* Smaller, Faster Pulsing Glowing Ball (2.5px, 0.85s ease-in-out) */}
          <div style={{
            position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
            width: 2.5, height: 2.5, borderRadius: '50%',
            background: isDisconnected ? '#ff453a' : '#ffffff',
            boxShadow: `0 0 3px ${accentColor}, 0 0 8px ${accentColor}, 0 0 12px ${accentColor}`,
            animation: 'superPulse 0.85s infinite ease-in-out',
          }} />

          {/* Bluetooth Badge */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2, width: 13, height: 13, borderRadius: '50%',
            background: '#121212', border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bluetooth size={8} color={accentColor} />
          </div>
        </div>

        {/* Middle Text: Official macOS Tahoe Typography */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#ffffff',
            letterSpacing: '-0.25px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: '16px', fontFamily: MAC_FONT,
          }}>
            {deviceName}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
            fontSize: 10.5, fontWeight: 500, color: 'rgba(255, 255, 255, 0.65)',
            fontFamily: MAC_FONT,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: statusColor,
              boxShadow: `0 0 6px ${statusColor}aa`, flexShrink: 0,
            }} />
            <span style={{ color: statusColor, fontWeight: 600, letterSpacing: '-0.1px' }}>{statusText}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', margin: '0 1px' }}>•</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255, 255, 255, 0.65)' }}>
              {subText}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Authentic 1:1 macOS Tahoe Glass Battery / Disconnect Badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 1, flexShrink: 0,
      }}>
        {isDisconnected ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 10,
            background: 'rgba(255, 69, 58, 0.15)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            color: '#ff453a', fontSize: 11, fontWeight: 700,
          }}>
            <span>Offline</span>
          </div>
        ) : isLowPower ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 9px', borderRadius: 10,
            background: 'rgba(255, 159, 10, 0.15)',
            border: '1px solid rgba(255, 159, 10, 0.35)',
            boxShadow: '0 0 10px rgba(255, 159, 10, 0.2)',
          }}>
            <AlertTriangle size={13} color="#ff9f0a" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ff9f0a' }}>
              {batteryPct}%
            </span>
          </div>
        ) : leftPct !== null && rightPct !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 8px', borderRadius: 9, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>L</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{leftPct}%</span>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 8px', borderRadius: 9, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>R</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{rightPct}%</span>
            </div>
          </div>
        ) : batteryPct !== null ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 9px', borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.09)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {isCharging ? (
              <Zap size={13} color="#30d158" />
            ) : (
              <MacBatteryIcon batteryPct={batteryPct} color={statusColor} />
            )}
            <span style={{
              fontSize: 12, fontWeight: 700, color: statusColor,
              letterSpacing: '-0.3px', lineHeight: '14px',
            }}>
              {batteryPct}%
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 10,
            background: 'rgba(48, 209, 88, 0.15)',
            border: '1px solid rgba(48, 209, 88, 0.3)',
            color: '#30d158', fontSize: 11, fontWeight: 700,
          }}>
            <Check size={13} color="#30d158" />
            <span>Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}
