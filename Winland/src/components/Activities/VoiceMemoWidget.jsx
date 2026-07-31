import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Pause, Play, Sparkles } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function VoiceMemoWidget({ isCompact, onStop }) {
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Audio Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;

      for (let x = 0; x < width; x += 4) {
        const amplitude = isRecording ? Math.sin(x * 0.08 + phase) * 12 * Math.random() + 4 : 2;
        ctx.moveTo(x, mid - amplitude);
        ctx.lineTo(x, mid + amplitude);
      }
      ctx.stroke();

      phase += 0.15;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pulse-dot" style={{ background: '#f97316', boxShadow: '0 0 10px #f97316' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>Recording</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(seconds)}</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
            }}
          >
            <Mic size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Voice Memo</div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>MacBook Pro Mic</div>
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: '#f97316' }}>
          {formatTime(seconds)}
        </div>
      </div>

      <div style={{ height: 36, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, overflow: 'hidden', padding: '0 8px' }}>
        <canvas ref={canvasRef} width={300} height={36} style={{ width: '100%', height: '100%' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>48kHz 24-bit HD Noise Reduction</span>
        <div className="glass-btn btn-danger" style={{ width: 34, height: 34 }} onClick={onStop} title="Stop & Save">
          <Square size={14} fill="#fff" />
        </div>
      </div>
    </div>
  );
}
