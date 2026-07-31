import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

export default function IdleWidget({ weatherConfig }) {
  const [now, setNow] = useState(() => new Date());

  const unit = (weatherConfig?.weatherUnit === 'F' || weatherConfig?.weatherUnit === 'fahrenheit') ? 'F' : 'C';
  const rawC = weatherConfig?.temperatureC ?? weatherConfig?.temperature;
  const tempC = (rawC !== undefined && rawC !== null && !isNaN(rawC)) ? Number(rawC) : 22;
  const tempVal = unit === 'F' ? Math.round(tempC * 9 / 5 + 32) : Math.round(tempC);
  const tempStr = `${tempVal}°${unit}`;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        fontFamily: 'var(--mac-font), -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        userSelect: 'none',
        padding: '2px 0',
      }}
    >
      {/* Time in Middle — menu-bar-clock style: bold tabular digits, AM/PM demoted to a small tracked suffix */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 3,
          lineHeight: '17px',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'inherit',
            letterSpacing: '-0.2px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayHours}:{displayMinutes}
        </span>
        <span
          className="widget-subtitle"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {ampm}
        </span>
      </div>

      {/* Weather Under Time */}
      <div
        className="widget-subtitle"
        style={{
          fontSize: 10,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 3,
        }}
      >
        <Sun size={11} color="var(--accent-orange)" />
        <span>{tempStr} Sunny</span>
      </div>
    </div>
  );
}
