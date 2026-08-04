import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Gauge } from 'lucide-react';

export default function SystemMonitorWidget({ isCompact, stats = { cpu: 24, ram: 58, gpu: 32 } }) {
  const [history, setHistory] = useState(Array(24).fill(25));

  useEffect(() => {
    setHistory((prev) => [...prev.slice(1), stats.cpu]);
  }, [stats.cpu]);

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={14} color="var(--text-2)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>CPU {stats.cpu}%</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>RAM {stats.ram}%</span>
      </div>
    );
  }

  // SVG Sparkline calculation
  const points = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * 140;
      const y = 35 - (val / 100) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  const metrics = [
    { label: 'CPU', value: stats.cpu, Icon: Cpu },
    { label: 'RAM', value: stats.ram, Icon: Gauge },
    { label: 'GPU', value: stats.gpu, Icon: Activity },
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      {/* Top Row: Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={15} color="var(--text-1)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>System</div>
            <div style={{ fontSize: 10, color: 'var(--text-2)' }}>Live telemetry</div>
          </div>
        </div>

        {/* Mini Sparkline Graph */}
        <div style={{ width: 140, height: 35, position: 'relative' }}>
          <svg width="140" height="35" style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
        {metrics.map(({ label, value, Icon }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--stroke)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>
              <Icon size={12} color="var(--text-2)" /> {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
