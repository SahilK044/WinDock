import React from 'react';
import { Folder, Music, Terminal, Globe, Settings, AppWindow, Power } from 'lucide-react';

// Files and Explorer both opened Explorer, so the duplicate is dropped and the
// slot reused for Exit — a direct way to quit WinLand without Task Manager.
const PINNED_APPS = [
  { name: 'Browser', icon: <Globe size={18} color="#3b82f6" />, cmd: 'browser' },
  { name: 'Spotify', icon: <Music size={18} color="#10b981" />, cmd: 'spotify' },
  { name: 'Files', icon: <Folder size={18} color="#f59e0b" />, cmd: 'explorer' },
  { name: 'Terminal', icon: <Terminal size={18} color="#8b5cf6" />, cmd: 'terminal' },
  { name: 'Settings', icon: <Settings size={18} color="#64748b" />, cmd: 'settings' },
  { name: 'Exit', icon: <Power size={18} color="#ef4444" />, cmd: 'exit' },
];

export default function LauncherWidget({ onLaunchApp, onClose }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppWindow size={14} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Quick Launcher</div>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>Click to Launch</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1 }}>
        {PINNED_APPS.map((app, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onLaunchApp?.(app.cmd);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '8px 4px',
              transition: 'all 0.2s ease',
            }}
          >
            {app.icon}
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
