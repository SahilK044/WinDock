import React from 'react';
import { Zap, Battery, BatteryLow, BatteryWarning } from 'lucide-react';

export default function BatteryWidget({ pct = 0, charging = false, minsLeft = -1 }) {
  const isLow = pct <= 20 && !charging;
  const isCritical = pct <= 10 && !charging;

  const barColor = isCritical
    ? 'var(--danger)'
    : isLow
    ? 'var(--warn)'
    : 'var(--ok)';

  const label = charging
    ? pct >= 100
      ? 'Fully Charged'
      : minsLeft > 0
      ? `~${minsLeft}m until full`
      : 'Charging…'
    : minsLeft > 60
    ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m remaining`
    : minsLeft > 0
    ? `${minsLeft}m remaining`
    : 'Calculating…';

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center',
      padding: '0 18px', gap: 14,
    }}>
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: isCritical
          ? 'rgba(255,69,58,0.16)'
          : isLow
          ? 'rgba(255,159,10,0.16)'
          : 'rgba(48,209,88,0.14)',
        border: `1px solid ${barColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {charging
          ? <Zap size={18} color={barColor} />
          : isCritical
          ? <BatteryWarning size={18} color={barColor} />
          : isLow
          ? <BatteryLow size={18} color={barColor} />
          : <Battery size={18} color={barColor} />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {charging ? 'Charging' : isLow ? 'Low Battery' : 'Battery'}
        </div>

        {/* Bar */}
        <div style={{
          width: '100%', height: 5,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 5, overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            background: barColor,
            borderRadius: 5,
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
      </div>

      {/* Percentage */}
      <div style={{ fontSize: 18, fontWeight: 800, color: barColor, flexShrink: 0, minWidth: 38, textAlign: 'right' }}>
        {pct}%
      </div>
    </div>
  );
}
