import React from 'react';
import { MessageSquare, Mail, CreditCard, X } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export default function NotificationWidget({ notification, onClose }) {
  const getAppIcon = (app) => {
    switch (app) {
      case 'slack':
        return (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#4A154B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={16} color="#ECB22E" />
          </div>
        );
      case 'pay':
        return (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#000', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={16} color="#fff" />
          </div>
        );
      default:
        return (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={16} color="#fff" />
          </div>
        );
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {getAppIcon(notification.app)}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{notification.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>{notification.message}</div>
        </div>
      </div>

      <div
        className="glass-btn"
        style={{ width: 28, height: 28 }}
        onClick={(e) => {
          e.stopPropagation();
          soundEngine.playClick();
          if (onClose) onClose();
        }}
      >
        <X size={14} />
      </div>
    </div>
  );
}
