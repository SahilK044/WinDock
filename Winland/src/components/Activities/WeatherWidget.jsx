import React from 'react';
import { conditionIcon, weatherTempString } from './IdleWidget';

export default function WeatherWidget({ isCompact, weatherConfig }) {
  const tempDisplay = weatherTempString(weatherConfig);
  const condition = weatherConfig?.weatherCondition || 'Clear';
  const ConditionGlyph = conditionIcon(condition);

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ConditionGlyph size={13} color="var(--text-2)" />
          <span style={{ fontSize: 12, fontWeight: 700 }}>Weather</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{tempDisplay}</span>
      </div>
    );
  }

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0a84ff, #64d2ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(10, 132, 255, 0.35)',
            }}
          >
            <ConditionGlyph size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Weather</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{condition}</div>
          </div>
        </div>

        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{tempDisplay}</div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--stroke)',
        padding: '8px 12px', borderRadius: 12, fontSize: 11,
        color: 'var(--text-2)', fontWeight: 600,
      }}>
        <span>{dateStr}</span>
        <span>{condition}</span>
      </div>
    </div>
  );
}
