import React from 'react';
import {
  Music,
  Timer,
  PhoneCall,
  Share2,
  Mic,
  Video,
  Zap,
  Bell,
  Sun,
  Volume2,
  VolumeX,
  Palette,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function ControlPanel({
  activeState,
  setActiveState,
  theme,
  setTheme,
  soundEnabled,
  setSoundEnabled,
  placementMode,
  setPlacementMode,
  onTriggerNotification,
}) {
  const wallpapers = [
    { id: 'tahoe-aurora', label: 'Tahoe Aurora' },
    { id: 'sonoma-dusk', label: 'Sonoma Dusk' },
    { id: 'ventura-ocean', label: 'Ventura Ocean' },
    { id: 'cyber-neon', label: 'Cyber Neon' },
    { id: 'minimal-dark', label: 'Minimal Dark' },
  ];

  const handleStateTrigger = (newState) => {
    soundEngine.playPop();
    setActiveState(newState);
  };

  const toggleSound = () => {
    soundEngine.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) soundEngine.playClick();
  };

  return (
    <div className="control-dock">
      {/* Dynamic Activity Trigger Chips */}
      <div
        className={`dock-chip ${activeState === 'expanded-music' || activeState === 'compact-music' ? 'active' : ''}`}
        onClick={() => handleStateTrigger(activeState === 'expanded-music' ? 'compact-music' : 'expanded-music')}
      >
        <Music size={14} /> Music Player
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-timer' || activeState === 'compact-timer' ? 'active' : ''}`}
        onClick={() => handleStateTrigger(activeState === 'expanded-timer' ? 'compact-timer' : 'expanded-timer')}
      >
        <Timer size={14} /> Timer
      </div>

      <div
        className={`dock-chip ${activeState === 'split' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('split')}
      >
        <Maximize2 size={13} /> Split Mode
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-call' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('expanded-call')}
      >
        <PhoneCall size={14} color="#22c55e" /> FaceTime Call
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-airdrop' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('expanded-airdrop')}
      >
        <Share2 size={14} color="#3b82f6" /> AirDrop
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-recorder' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('expanded-recorder')}
      >
        <Mic size={14} color="#f97316" /> Voice Memo
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-screenrec' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('expanded-screenrec')}
      >
        <Video size={14} color="#ef4444" /> Screen Rec
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-battery' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('expanded-battery')}
      >
        <Zap size={14} color="#22c55e" /> Charging
      </div>

      <div
        className={`dock-chip ${activeState === 'notification' ? 'active' : ''}`}
        onClick={onTriggerNotification}
      >
        <Bell size={14} color="#ec4899" /> Notification
      </div>

      <div
        className={`dock-chip ${activeState === 'expanded-weather' ? 'active' : ''}`}
        onClick={() => handleStateTrigger('expanded-weather')}
      >
        <Sun size={14} color="#f59e0b" /> Weather
      </div>

      <div className="dock-divider" />

      {/* Notch Placement Switcher */}
      <div
        className="dock-chip"
        onClick={() => {
          soundEngine.playClick();
          setPlacementMode(placementMode === 'floating' ? 'menubar' : 'floating');
        }}
        title="Toggle Placement"
      >
        {placementMode === 'floating' ? 'Floating Pill' : 'Notch Embedded'}
      </div>

      {/* Sound Toggle */}
      <div className="dock-chip" onClick={toggleSound} title="Sound FX">
        {soundEnabled ? <Volume2 size={14} color="#22c55e" /> : <VolumeX size={14} color="#ef4444" />}
      </div>

      {/* Wallpaper Switcher dropdown/toggle */}
      <div
        className="dock-chip"
        onClick={() => {
          soundEngine.playClick();
          const currentIndex = wallpapers.findIndex((w) => w.id === theme);
          const nextTheme = wallpapers[(currentIndex + 1) % wallpapers.length].id;
          setTheme(nextTheme);
        }}
      >
        <Palette size={14} /> Wallpaper
      </div>

      <div
        className="dock-chip"
        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
        onClick={() => handleStateTrigger('idle')}
      >
        <Minimize2 size={13} /> Reset Idle
      </div>
    </div>
  );
}
