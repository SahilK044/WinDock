import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Video } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function CallWidget({ isExpanded, isCompact, onEndCall }) {
  const [callState, setCallState] = useState('incoming'); // 'incoming' | 'active'
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (callState === 'incoming') {
      soundEngine.playRingtone();
    }
  }, [callState]);

  useEffect(() => {
    let interval;
    if (callState === 'active') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const acceptCall = (e) => {
    e.stopPropagation();
    soundEngine.playClick();
    setCallState('active');
  };

  const endCallHandler = (e) => {
    e.stopPropagation();
    soundEngine.playClick();
    if (onEndCall) onEndCall();
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Compact bar state
  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pulse-dot" style={{ background: '#30d158', boxShadow: '0 0 10px #30d158' }} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>Sarah Connor</span>
        </div>
        <span style={{ fontSize: 11, color: '#30d158', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
          {formatDuration(duration)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Contact Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3a3a40, #232328)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          SC
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Sarah Connor</div>
          <div style={{ fontSize: 11, color: callState === 'active' ? '#30d158' : 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>
            {callState === 'incoming' ? 'FaceTime Audio...' : `FaceTime HD • ${formatDuration(duration)}`}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {callState === 'incoming' ? (
          <>
            <div className="glass-btn btn-danger" style={{ width: 40, height: 40 }} onClick={endCallHandler} title="Decline">
              <PhoneOff size={18} />
            </div>
            <div className="glass-btn" style={{ width: 40, height: 40, background: '#30d158' }} onClick={acceptCall} title="Accept">
              <PhoneCall size={18} />
            </div>
          </>
        ) : (
          <>
            <div
              className={`glass-btn ${isMuted ? 'btn-danger' : ''}`}
              style={{ width: 38, height: 38 }}
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playClick();
                setIsMuted(!isMuted);
              }}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </div>
            <div className="glass-btn btn-danger" style={{ width: 40, height: 40 }} onClick={endCallHandler} title="End Call">
              <PhoneOff size={18} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
