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
          <Cpu size={14} color="#06b6d4" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>CPU {stats.cpu}%</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4' }}>RAM {stats.ram}%</span>
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

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      {/* Top Row: Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={15} color="#06b6d4" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>System Status</div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.55)' }}>Live Hardware Telemetry</div>
          </div>
        </div>

        {/* Mini Sparkline Graph */}
        <div style={{ width: 140, height: 35, position: 'relative' }}>
          <svg width="140" height="35" style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
            <Cpu size={12} color="#06b6d4" /> CPU
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{stats.cpu}%</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
            <Gauge size={12} color="#3b82f6" /> RAM
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{stats.ram}%</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
            <Activity size={12} color="#10b981" /> GPU
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{stats.gpu}%</div>
        </div>
      </div>
    </div>
  );
}
