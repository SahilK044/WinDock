import React from 'react';
import {
  Music,
  PhoneCall,
  Mic,
  Video,
  Timer,
  Share2,
  Folder,
  Compass,
  MessageSquare,
  Mail,
  Sliders,
  Sparkles,
  Trash2
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function Dock({ activeState, setActiveState }) {
  const dockApps = [
    {
      id: 'finder',
      name: 'Finder',
      icon: <Folder size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
      triggerState: 'idle',
    },
    {
      id: 'safari',
      name: 'Safari',
      icon: <Compass size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      triggerState: 'expanded-weather',
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: <MessageSquare size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #22c55e, #15803d)',
      triggerState: 'notification',
    },
    {
      id: 'music',
      name: 'Apple Music',
      icon: <Music size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
      triggerState: 'expanded-music',
      isActive: activeState.includes('music'),
    },
    {
      id: 'facetime',
      name: 'FaceTime',
      icon: <PhoneCall size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #10b981, #047857)',
      triggerState: 'expanded-call',
      isActive: activeState === 'expanded-call',
    },
    {
      id: 'voicememos',
      name: 'Voice Memos',
      icon: <Mic size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #f97316, #c2410c)',
      triggerState: 'expanded-recorder',
      isActive: activeState === 'expanded-recorder',
    },
    {
      id: 'clock',
      name: 'Clock',
      icon: <Timer size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
      triggerState: 'expanded-timer',
      isActive: activeState.includes('timer'),
    },
    {
      id: 'airdrop',
      name: 'AirDrop',
      icon: <Share2 size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      triggerState: 'expanded-airdrop',
      isActive: activeState === 'expanded-airdrop',
    },
    {
      id: 'siri',
      name: 'Voice Commands',
      icon: <Sparkles size={24} color="#fff" />,
      gradient: 'linear-gradient(135deg, #a855f7, #6b21a8)',
      triggerState: 'expanded-siri',
      isActive: activeState === 'expanded-siri',
    },
  ];

  return (
    <div className="mac-dock-container">
      {dockApps.map((app) => (
        <div
          key={app.id}
          className="dock-icon-wrapper"
          style={{ background: app.gradient }}
          title={app.name}
          onClick={() => {
            soundEngine.playClick();
            setActiveState(app.triggerState);
          }}
        >
          {app.icon}
          {app.isActive && <div className="dock-dot" />}
        </div>
      ))}
    </div>
  );
}
