import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

export default function IdleWidget({ weatherConfig }) {
  const [timeStr, setTimeStr] = useState('');

  // Always display in Celsius
  const tempC = weatherConfig?.temperatureC ?? weatherConfig?.temperature ?? 22;
  const tempVal = Math.round(Number(tempC) || 22);
  const tempStr = `${tempVal}°C`;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setTimeStr(`${formattedHours}:${formattedMinutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Time in Middle (macOS Tahoe font) */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: 'inherit',
          letterSpacing: '0.4px',
          lineHeight: '16px',
        }}
      >
        {timeStr}
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
          marginTop: 2,
        }}
      >
        <Sun size={11} color="#f59e0b" />
        <span>{tempStr} Sunny</span>
      </div>
    </div>
  );
}
