import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

export default function IdleWidget() {
  const [timeStr, setTimeStr] = useState('');
  const [weatherInfo, setWeatherInfo] = useState({ temp: '72°F', condition: 'Sunny' });

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
          color: '#ffffff',
          letterSpacing: '0.4px',
          lineHeight: '16px',
        }}
      >
        {timeStr}
      </div>

      {/* Weather Under Time */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.72)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 2,
        }}
      >
        <Sun size={11} color="#f59e0b" />
        <span>{weatherInfo.temp} {weatherInfo.condition}</span>
      </div>
    </div>
  );
}
