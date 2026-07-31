import React from 'react';
import { Bluetooth, Zap, Check, AlertTriangle } from 'lucide-react';
import Headset3D from './Headset3D';
import Earbuds3D from './Earbuds3D';
import Speaker3D from './Speaker3D';
import Phone3D from './Phone3D';

const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ── Keyframe Animations ──────────────────────────────────────────────────────
const ANIMATION_STYLES = `
@keyframes caseLidOpen {
  0% { transform: rotateX(0deg) translateY(0); opacity: 1; }
  20% { transform: rotateX(-115deg) translateY(-3.5px) scaleY(0.75); opacity: 0.9; }
  100% { transform: rotateX(-115deg) translateY(-3.5px) scaleY(0.75); opacity: 0.9; }
}

@keyframes leftPopOut {
  0% { transform: translateY(7px) scale(0.45); opacity: 0; }
  22% { transform: translateY(-4px) translateX(-2.5px) rotate(-14deg) scale(1.08); opacity: 1; }
  48% { transform: translateY(-0.8px) translateX(-1.2px) rotate(-4deg) scale(1); opacity: 1; }
  75% { transform: translateY(-2.5px) translateX(-1.8px) rotate(-8deg) scale(1); opacity: 1; }
  100% { transform: translateY(0px) translateX(-0.8px) rotate(-3deg) scale(1); opacity: 1; }
}

@keyframes rightPopOut {
  0% { transform: translateY(7px) scale(0.45); opacity: 0; }
  22% { transform: translateY(-4px) translateX(2.5px) rotate(14deg) scale(1.08); opacity: 1; }
  48% { transform: translateY(-0.8px) translateX(1.2px) rotate(4deg) scale(1); opacity: 1; }
  75% { transform: translateY(-2.5px) translateX(1.8px) rotate(8deg) scale(1); opacity: 1; }
  100% { transform: translateY(0px) translateX(0.8px) rotate(3deg) scale(1); opacity: 1; }
}

@keyframes headphonesConnectAnim {
  0% {
    transform: translateY(38px) scale(0.15) rotateY(-180deg) rotateX(20deg);
    opacity: 0;
    filter: blur(5px);
  }
  32% {
    transform: translateY(-4px) scale(1.08) rotateY(180deg) rotateX(8deg);
    opacity: 1;
    filter: blur(0px);
  }
  50% {
    transform: translateY(0px) scale(1) rotateY(360deg) rotateX(0deg);
    opacity: 1;
    filter: blur(0px);
  }
  75% {
    transform: translateY(-3.5px) scale(1.02) rotateY(366deg) rotateX(-4deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0px) scale(1) rotateY(360deg) rotateX(0deg);
    opacity: 1;
  }
}

@keyframes headphonesDisconnectAnim {
  0% {
    transform: translateY(0px) scale(1) rotateY(360deg) rotateX(0deg);
    opacity: 1;
    filter: blur(0px);
  }
  45% {
    transform: translateY(-4px) scale(1.08) rotateY(180deg) rotateX(-10deg);
    opacity: 0.9;
    filter: blur(0px);
  }
  100% {
    transform: translateY(38px) scale(0.15) rotateY(0deg) rotateX(-20deg);
    opacity: 0;
    filter: blur(5px);
  }
}

@keyframes phoneTilt {
  0% { transform: translateY(0px) rotate(-1deg); }
  50% { transform: translateY(-2px) rotate(3deg); }
  100% { transform: translateY(0px) rotate(-1deg); }
}

@keyframes speakerPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes deviceHover {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0px); }
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

@keyframes dotBlinkFadeOff {
  0% {
    opacity: 1;
    transform: translateX(-50%) scale(1.3);
    box-shadow: 0 0 6px #ff453a, 0 0 12px #ff453a, 0 0 18px rgba(255, 69, 58, 0.9);
    background: #ff453a;
  }
  16% {
    opacity: 0.25;
    transform: translateX(-50%) scale(1.0);
    box-shadow: 0 0 2px #ff453a;
    background: #ff453a;
  }
  32% {
    opacity: 1;
    transform: translateX(-50%) scale(1.5);
    box-shadow: 0 0 8px #ff453a, 0 0 16px #ff453a, 0 0 24px rgba(255, 69, 58, 1);
    background: #ff453a;
  }
  48% {
    opacity: 0.25;
    transform: translateX(-50%) scale(1.0);
    box-shadow: 0 0 2px #ff453a;
    background: #ff453a;
  }
  64% {
    opacity: 1;
    transform: translateX(-50%) scale(1.6);
    box-shadow: 0 0 8px #ff453a, 0 0 16px #ff453a, 0 0 24px rgba(255, 69, 58, 1);
    background: #ff453a;
  }
  80% {
    opacity: 0.7;
    transform: translateX(-50%) scale(1.1);
    box-shadow: 0 0 5px #ff453a, 0 0 10px #ff453a;
    background: #ff453a;
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) scale(0.1);
    box-shadow: 0 0 0px #ff453a;
    background: #ff453a;
  }
}
`;

// ── 3D Device Vector Graphics ───────────────────────────────────────────────

// 1. Pristine 3D Wireless Earbuds Charging Case & Floating Buds
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

      <rect x="5.5" y="11.5" width="17" height="13" rx="4.5" fill="url(#caseGrad)" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.8" />
      <rect x="7" y="12.5" width="14" height="3.5" rx="1.75" fill="rgba(0, 0, 0, 0.3)" />
      
      <circle cx="14" cy="18.5" r="0.85" fill={color === '#ff453a' ? '#ff453a' : '#30d158'} />

      <g style={isAnimated ? {
        animation: 'caseLidOpen 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate',
        transformOrigin: '14px 11.5px',
      } : { transform: 'rotateX(-115deg) translateY(-3.5px)', transformOrigin: '14px 11.5px' }}>
        <path d="M5.5 11.5C5.5 8.5 8.5 6.5 14 6.5C19.5 6.5 22.5 8.5 22.5 11.5H5.5Z" fill="url(#caseGrad)" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.8" />
      </g>

      <g style={isAnimated ? {
        animation: 'leftPopOut 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate',
        transformOrigin: '9.5px 8px',
      } : {}}>
        <path d="M9.8 4C8.2 4 6.8 5.4 6.8 7C6.8 8.6 7.9 9.8 9.4 10.2V9.4C9.4 8.4 10.2 7.6 11.2 7.6H11.6V6.6C11.6 5.2 10.8 4 9.8 4Z" fill="url(#earbudGrad)" />
        <path d="M6.2 6.6C5.7 7 5.7 7.6 6.2 8L7.4 7.3L6.2 6.6Z" fill="#ffffff" opacity="0.95" />
        <rect x="9.4" y="9.4" width="2.2" height="7.2" rx="1.1" fill="url(#earbudGrad)" />
        <rect x="9.4" y="15.4" width="2.2" height="1.2" rx="0.6" fill="#ffffff" />
      </g>

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

// 2. 3D Over-Ear Headphones Vector Graphic
function HeadphonesIcon({ size = 28, color = '#ffffff', isAnimated = true, isDisconnected = false }) {
  const animStyle = isDisconnected ? {
    animation: 'headphonesDisconnectAnim 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    transformStyle: 'preserve-3d',
    perspective: '500px',
  } : isAnimated ? {
    animation: 'headphonesConnectAnim 5.2s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate',
    transformStyle: 'preserve-3d',
    perspective: '500px',
  } : {};

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={animStyle}>
      <defs>
        <linearGradient id="headbandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
        <linearGradient id="cupGradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      <path d="M5 14C5 9.02745 9.02745 5 14 5C18.9725 5 23 9.02745 23 14" stroke="url(#headbandGrad)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 13.5C7 9.63401 10.134 6.5 14 6.5C17.866 6.5 21 9.63401 21 13.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9" strokeLinecap="round" />

      {/* Left Earcup - Pure White Metallic */}
      <rect x="3.5" y="12.5" width="4.8" height="9.5" rx="2.4" fill="url(#cupGradWhite)" stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
      <rect x="6.8" y="14" width="1.2" height="6.5" rx="0.6" fill="rgba(0,0,0,0.35)" />
      <circle cx="5.9" cy="17.25" r="0.8" fill="#ffffff" />

      {/* Right Earcup - Pure White Metallic */}
      <rect x="19.7" y="12.5" width="4.8" height="9.5" rx="2.4" fill="url(#cupGradWhite)" stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
      <rect x="20" y="14" width="1.2" height="6.5" rx="0.6" fill="rgba(0,0,0,0.35)" />
      <circle cx="22.1" cy="17.25" r="0.8" fill="#ffffff" />
    </svg>
  );
}

// 3. 3D Glass Smartphone Vector Graphic
function PhoneIcon({ size = 26, color = '#00f0ff', isAnimated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={isAnimated ? { animation: 'phoneTilt 3s infinite ease-in-out' } : {}}
    >
      <defs>
        <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.12)" />
        </linearGradient>
        <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(10,10,15,0.85)" />
          <stop offset="100%" stopColor={color} stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <rect x="7.5" y="3.5" width="13" height="21" rx="3" fill="url(#phoneBody)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.9" />
      <rect x="8.8" y="5" width="10.4" height="18" rx="1.8" fill="url(#phoneScreen)" />
      <rect x="12" y="6.2" width="4" height="1.2" rx="0.6" fill="#000000" />
      <line x1="11.5" y1="21.5" x2="16.5" y2="21.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 4. 3D Soundbar / Speaker Vector Graphic
function SpeakerIcon({ size = 26, color = '#00f0ff', isAnimated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={isAnimated ? { animation: 'speakerPulse 2.2s infinite ease-in-out' } : {}}
    >
      <defs>
        <linearGradient id="speakerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.12)" />
        </linearGradient>
      </defs>

      <rect x="3.5" y="7.5" width="21" height="13" rx="3.5" fill="url(#speakerGrad)" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="0.9" />
      <circle cx="9" cy="14" r="3.5" fill="rgba(0,0,0,0.5)" stroke={color} strokeWidth="0.8" />
      <circle cx="9" cy="14" r="1.5" fill={color} />
      <circle cx="19" cy="14" r="3.5" fill="rgba(0,0,0,0.5)" stroke={color} strokeWidth="0.8" />
      <circle cx="19" cy="14" r="1.5" fill={color} />
    </svg>
  );
}

// 5. 3D Mouse Graphic
function MouseIcon({ size = 26, color = '#00f0ff', isAnimated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={isAnimated ? { animation: 'deviceHover 2.4s infinite ease-in-out' } : {}}
    >
      <rect x="8.5" y="4.5" width="11" height="19" rx="5.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
      <line x1="14" y1="5" x2="14" y2="10" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <rect x="13" y="7" width="2" height="3.5" rx="1" fill={color} />
    </svg>
  );
}

// 6. 3D Keyboard Graphic
function KeyboardIcon({ size = 26, color = '#00f0ff', isAnimated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={isAnimated ? { animation: 'deviceHover 2.4s infinite ease-in-out' } : {}}
    >
      <rect x="3.5" y="8.5" width="21" height="11" rx="2.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
      <rect x="5.5" y="10.5" width="3" height="2" rx="0.5" fill="rgba(255,255,255,0.5)" />
      <rect x="9.5" y="10.5" width="3" height="2" rx="0.5" fill="rgba(255,255,255,0.5)" />
      <rect x="13.5" y="10.5" width="3" height="2" rx="0.5" fill="rgba(255,255,255,0.5)" />
      <rect x="17.5" y="10.5" width="5" height="2" rx="0.5" fill={color} />
      <rect x="7.5" y="14.5" width="13" height="2" rx="0.5" fill={color} />
    </svg>
  );
}

// 7. 3D Controller Graphic
function ControllerIcon({ size = 26, color = '#00f0ff', isAnimated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={isAnimated ? { animation: 'deviceHover 2.4s infinite ease-in-out' } : {}}
    >
      <path d="M6 10C4.3 10 3 11.3 3 13L4.5 20C4.8 21.4 6 22 7.2 21.3L10 19.5H18L20.8 21.3C22 22 23.2 21.4 23.5 20L25 13C25 11.3 23.7 10 22 10H6Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
      <circle cx="8.5" cy="14.5" r="1.2" fill={color} />
      <circle cx="19.5" cy="14.5" r="1" fill="#ffffff" />
      <circle cx="17.5" cy="16.5" r="1" fill={color} />
    </svg>
  );
}

// 1:1 macOS Tahoe Vector Battery Shell
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

// Auto-detect device category for 3D animation morphing
function getDeviceCategory(deviceName = '', typeStr = '') {
  const str = (deviceName + ' ' + typeStr).toLowerCase();

  // 1. Check explicit headphone keywords first!
  if (str.includes('barracuda') ||
      str.includes('headphone') ||
      str.includes('headset') ||
      str.includes('kraken') ||
      str.includes('blackshark') ||
      str.includes('tune7') ||
      str.includes('tune6') ||
      str.includes('wh-') ||
      str.includes('quietcomfort') ||
      str.includes('over-ear') ||
      str.includes('overear') ||
      str.includes('monitors')) {
    return 'headphones';
  }

  // 2. Check Earbuds / AirPods / In-Ear TWS
  if (str.includes('buds') ||
      str.includes('airpod') ||
      str.includes('freebuds') ||
      str.includes('smokin') ||
      str.includes('in-ear') ||
      str.includes('inear') ||
      str.includes('tws') ||
      str.includes('earbud')) {
    return 'earbuds';
  }

  // 3. Mouse
  if (str.includes('mouse') || str.includes('mx master') || str.includes('trackball')) {
    return 'mouse';
  }

  // 4. Keyboard
  if (str.includes('keyboard') || str.includes('keychron') || str.includes('typing')) {
    return 'keyboard';
  }

  // 5. Controller
  if (str.includes('controller') || str.includes('xbox') || str.includes('dualsense') || str.includes('dual sense') || str.includes('gamepad')) {
    return 'controller';
  }

  // 6. Phone
  if (str.includes('phone') ||
      str.includes('s24') ||
      str.includes('s23') ||
      str.includes('s22') ||
      str.includes('galaxy') ||
      str.includes('iphone') ||
      str.includes('pixel') ||
      str.includes('android') ||
      str.includes('mobile')) {
    return 'phone';
  }

  // 7. Speakers & Soundbars (Check soundbar / speaker / sound bar explicitly)
  if (str.includes('soundbar') ||
      str.includes('sound bar') ||
      str.includes('speaker') ||
      str.includes('boombox') ||
      str.includes('jbl flip') ||
      str.includes('jbl charge') ||
      str.includes('jbl xtreme') ||
      str.includes('aavante')) {
    return 'speaker';
  }

  // Default for audio accessories is headphones
  return 'headphones';
}

export default function BluetoothWidget({
  deviceName = 'Bluetooth Device',
  batteryPct = null,
  isCharging = false,
  leftPct = null,
  rightPct = null,
  typeStr = 'Bluetooth Device',
  isCompact = false,
  connectionState = 'connected', // 'connected' | 'disconnected' | 'low-battery'
}) {
  const isDisconnected = connectionState === 'disconnected';
  const hasValidBat = batteryPct !== null && batteryPct !== undefined && batteryPct >= 0 && batteryPct <= 100;
  const isLowPower = connectionState === 'low-battery' || (hasValidBat && batteryPct <= 20 && !isCharging && !isDisconnected);

  const category = getDeviceCategory(deviceName, typeStr);

  let statusColor = '#30d158';
  let accentColor = '#00f0ff';
  let statusText = 'Connected';
  let subText = typeStr || 'Bluetooth Device';

  if (isDisconnected) {
    statusColor = '#ff453a';
    accentColor = '#ff453a';
    statusText = 'Disconnected';
    subText = 'Device Offline';
  } else if (isLowPower) {
    statusColor = '#ff9f0a';
    accentColor = '#ff9f0a';
    statusText = 'Low Battery';
    subText = 'Please Charge Device';
  }

  const render3DIcon = (iconSize = 24) => {
    switch (category) {
      case 'mouse':
        return <MouseIcon size={iconSize} color={accentColor} isAnimated={!isDisconnected} />;
      case 'keyboard':
        return <KeyboardIcon size={iconSize} color={accentColor} isAnimated={!isDisconnected} />;
      case 'controller':
        return <ControllerIcon size={iconSize} color={accentColor} isAnimated={!isDisconnected} />;
      case 'phone':
        return <Phone3D size={44} isAnimated={true} isDisconnected={isDisconnected} deviceName={deviceName} />;
      case 'speaker':
        return <Speaker3D size={44} isAnimated={true} isDisconnected={isDisconnected} />;
      case 'earbuds':
        return <Earbuds3D size={44} isAnimated={true} isDisconnected={isDisconnected} />;
      case 'headphones':
      default:
        return <Headset3D size={32} isAnimated={true} isDisconnected={isDisconnected} />;
    }
  };

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
            {render3DIcon(15)}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#ffffff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: MAC_FONT,
          }}>
            {deviceName}
          </span>
        </div>
        {hasValidBat && !isDisconnected && (
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

      {/* Left: Dynamic 3D Device Vector Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {render3DIcon(44)}
          
          {/* Pulsing Glowing Status LED Ball (Glows Red then turns off smoothly on disconnect) */}
          <div style={{
            position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
            width: 3, height: 3, borderRadius: '50%',
            background: isDisconnected ? '#ff453a' : accentColor,
            animation: isDisconnected ? 'dotBlinkFadeOff 5.6s ease-out forwards' : 'superPulse 0.85s infinite ease-in-out',
            '--pulse-color': accentColor,
            '--pulse-glow': `${accentColor}aa`,
          }} />
        </div>

        {/* Middle Text: Device Name + Status */}
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

      {/* Right: macOS Clean Battery / Disconnect Status (No background boxes) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 1, flexShrink: 0,
      }}>
        {isDisconnected ? (
          <span style={{
            color: '#ff453a', fontSize: 12, fontWeight: 600,
            letterSpacing: '-0.2px', fontFamily: MAC_FONT,
          }}>
            Offline
          </span>
        ) : isLowPower ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MAC_FONT }}>
            <AlertTriangle size={13} color="#ff9f0a" />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ff9f0a', letterSpacing: '-0.2px' }}>
              {hasValidBat ? `${batteryPct}%` : 'Low'}
            </span>
          </div>
        ) : leftPct !== null && rightPct !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MAC_FONT }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, letterSpacing: '-0.2px' }}>L {leftPct}%</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, letterSpacing: '-0.2px' }}>R {rightPct}%</span>
          </div>
        ) : hasValidBat ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MAC_FONT }}>
            {isCharging ? (
              <Zap size={13} color="#30d158" />
            ) : (
              <MacBatteryIcon batteryPct={batteryPct} color={statusColor} />
            )}
            <span style={{
              fontSize: 12.5, fontWeight: 600, color: statusColor,
              letterSpacing: '-0.3px', lineHeight: '14px',
            }}>
              {batteryPct}%
            </span>
          </div>
        ) : (
          <span style={{
            color: '#30d158', fontSize: 12, fontWeight: 600,
            letterSpacing: '-0.2px', fontFamily: MAC_FONT,
          }}>
            Connected
          </span>
        )}
      </div>
    </div>
  );
}
