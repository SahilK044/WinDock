import React from 'react';
import { Folder, Music, Terminal, Globe, Settings, AppWindow, Power } from 'lucide-react';

// App glyphs keep their identity colours (they're content, not chrome);
// everything structural stays graphite.
const PINNED_APPS = [
  { name: 'Browser', icon: <Globe size={18} color="#0a84ff" />, cmd: 'browser' },
  { name: 'Spotify', icon: <Music size={18} color="#30d158" />, cmd: 'spotify' },
  { name: 'Files', icon: <Folder size={18} color="#ffd60a" />, cmd: 'explorer' },
  { name: 'Terminal', icon: <Terminal size={18} color="#e5e5ea" />, cmd: 'terminal' },
  { name: 'Settings', icon: <Settings size={18} color="#98989d" />, cmd: 'settings' },
  { name: 'Exit', icon: <Power size={18} color="#ff453a" />, cmd: 'exit' },
];

export default function LauncherWidget({ onLaunchApp }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AppWindow size={14} color="var(--text-1)" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Launcher</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1 }}>
        {PINNED_APPS.map((app) => (
          <button
            key={app.cmd}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onLaunchApp?.(app.cmd);
            }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--stroke)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '8px 4px',
              transition: 'background 0.18s ease, border-color 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
          >
            {app.icon}
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-1)' }}>{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
