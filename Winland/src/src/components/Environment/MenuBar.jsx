import React, { useState, useEffect } from 'react';
import {
  Apple,
  Wifi,
  BatteryCharging,
  Sliders,
  Sparkles,
  Mic,
  Video,
  Volume2,
  Search
} from 'lucide-react';

export default function MenuBar({ activeAppTitle = 'Tahoe Dynamic Island', activePrivacy = {} }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="mac-menu-bar">
      <div className="menu-left">
        <div className="menu-item" style={{ paddingLeft: 4 }}>
          <Apple size={15} color="#ffffff" />
        </div>
        <div className="menu-item active-app">{activeAppTitle}</div>
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Island</div>
        <div className="menu-item">Window</div>
        <div className="menu-item">Help</div>
      </div>

      <div className="menu-right">
        {/* Active Mic/Camera privacy indicators */}
        {activePrivacy.mic && (
          <div className="menu-item" title="Microphone Active">
            <span className="privacy-dot mic" />
          </div>
        )}
        {activePrivacy.cam && (
          <div className="menu-item" title="Camera Active">
            <span className="privacy-dot cam" />
          </div>
        )}

        <div className="menu-item" title="Battery 85% Charging">
          <BatteryCharging size={16} color="#22c55e" />
          <span style={{ fontSize: 11, fontWeight: 600 }}>85%</span>
        </div>

        <div className="menu-item">
          <Wifi size={15} />
        </div>

        <div className="menu-item">
          <Search size={14} />
        </div>

        <div className="menu-item">
          <Sliders size={14} />
        </div>

        <div className="menu-item" style={{ color: '#a855f7' }}>
          <Sparkles size={14} />
        </div>

        <div className="menu-item" style={{ fontSize: 12, fontWeight: 600, gap: 8 }}>
          <span>{date}</span>
          <span>{time}</span>
        </div>
      </div>
    </header>
  );
}
