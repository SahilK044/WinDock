import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Timer as TimerIcon } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function TimerWidget({ isCompact, isSplit, onExpand }) {
  const [totalSeconds, setTotalSeconds] = useState(300); // 5 mins
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      soundEngine.playAlarm();
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const toggleRun = (e) => {
    e.stopPropagation();
    soundEngine.playClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = (e) => {
    e.stopPropagation();
    soundEngine.playClick();
    setSecondsLeft(totalSeconds);
    setIsRunning(false);
  };

  const addMinute = (e) => {
    e.stopPropagation();
    soundEngine.playClick();
    setSecondsLeft((prev) => prev + 60);
    setTotalSeconds((prev) => prev + 60);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  // 1. Split Mode (Left component of dynamic island when dual activities run)
  if (isSplit) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TimerIcon size={14} color="var(--warn)" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warn)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(secondsLeft)}
        </span>
      </div>
    );
  }

  // 2. Compact Mode
  if (isCompact) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 10px' }}
        onClick={onExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(255, 159, 10, 0.16)',
              border: '1px solid rgba(255, 159, 10, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TimerIcon size={12} color="var(--warn)" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--warn)', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(secondsLeft)}
          </span>
        </div>
        <div className="glass-btn" style={{ width: 22, height: 22 }} onClick={toggleRun}>
          {isRunning ? <Pause size={10} /> : <Play size={10} />}
        </div>
      </div>
    );
  }

  // 3. Expanded Full Interactive Timer Card
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ff9f0a, #ff9f0a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 15px rgba(255, 159, 10, 0.28)',
            }}
          >
            <TimerIcon size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Timer</div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>Focus Session</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div className="glass-btn" style={{ width: 30, height: 30 }} onClick={addMinute} title="Add 1 Min">
            <Plus size={14} />
          </div>
          <div className="glass-btn" style={{ width: 30, height: 30 }} onClick={resetTimer} title="Reset">
            <RotateCcw size={13} />
          </div>
        </div>
      </div>

      {/* Timer Countdown Big Display */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, margin: '8px 0' }}>
        <span
          style={{
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: -1,
            fontVariantNumeric: 'tabular-nums',
            color: isRunning ? 'var(--warn)' : '#ffffff',
            textShadow: isRunning ? '0 0 20px rgba(255, 159, 10, 0.35)' : 'none',
          }}
        >
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Progress Track */}
      <div className="progress-track" style={{ height: 5 }}>
        <div
          className="progress-fill"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #ff9f0a, #ff9f0a)',
          }}
        />
      </div>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
        <div
          className={`glass-btn ${isRunning ? 'btn-accent' : ''}`}
          style={{ width: '100%', borderRadius: 14, height: 34, gap: 6 }}
          onClick={toggleRun}
        >
          {isRunning ? (
            <>
              <Pause size={14} /> Pause
            </>
          ) : (
            <>
              <Play size={14} /> Resume
            </>
          )}
        </div>
      </div>
    </div>
  );
}
