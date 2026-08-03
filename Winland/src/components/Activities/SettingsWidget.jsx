import React, { useState, useEffect } from 'react';
import { Settings, Check, X, Smartphone, Palette } from 'lucide-react';
import { DEVICE_CATALOG, DEVICE_COLOR_VARIANTS, ANIMATION_STYLES } from '../../data/deviceCatalog';

const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif';

const PULSE_PRESETS = ['#00f0ff', '#30d158', '#bf5af2', '#ff9f0a', '#ff453a', '#ffffff'];

export default function SettingsWidget({ onClose }) {
  const [selectedPhone, setSelectedPhone] = useState(() => localStorage.getItem('winland_phone_id') || 's24ultra');
  const [selectedColor, setSelectedColor] = useState(() => localStorage.getItem('winland_color_variant') || 'space-grey');
  const [animStyle, setAnimStyle] = useState(() => localStorage.getItem('winland_anim_style') || 'amoled');
  const [pulseColor, setPulseColor] = useState(() => localStorage.getItem('winland_pulse_color') || '#00f0ff');
  const [autoHide, setAutoHide] = useState(() => localStorage.getItem('winland_autohide_enabled') === 'true'); // Default to FALSE to prevent accidental hiding!
  const [activeTab, setActiveTab] = useState('devices');

  useEffect(() => {
    localStorage.setItem('winland_phone_id', selectedPhone);
    localStorage.setItem('winland_color_variant', selectedColor);
    localStorage.setItem('winland_anim_style', animStyle);
    localStorage.setItem('winland_pulse_color', pulseColor);
    localStorage.setItem('winland_autohide_enabled', autoHide ? 'true' : 'false');

    window.dispatchEvent(new CustomEvent('winland-settings-changed', {
      detail: { selectedPhone, selectedColor, animStyle, pulseColor, autoHide }
    }));
  }, [selectedPhone, selectedColor, animStyle, pulseColor, autoHide]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '14px 18px',
      boxSizing: 'border-box',
      fontFamily: MAC_FONT,
      color: '#fff',
      userSelect: 'none',
    }}>
      {/* ── Top Header Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={16} color="#00f0ff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>WinLand Settings</div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>Liquid Glass Preferences</div>
          </div>
        </div>

        {/* Tab Switcher & Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(0, 0, 0, 0.5)', padding: 3, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setActiveTab('devices')}
              style={{
                background: activeTab === 'devices' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 800,
                color: activeTab === 'devices' ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Devices
            </button>
            <button
              onClick={() => setActiveTab('style')}
              style={{
                background: activeTab === 'style' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 800,
                color: activeTab === 'style' ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Style & Glow
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Tab Content Container ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {activeTab === 'devices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Phone Model Picker */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255, 255, 255, 0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Smartphone Model & Form Factor
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {DEVICE_CATALOG.phones.map((phone) => {
                  const isSel = selectedPhone === phone.id;
                  return (
                    <button
                      key={phone.id}
                      onClick={() => setSelectedPhone(phone.id)}
                      style={{
                        background: isSel ? 'rgba(0, 240, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSel ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.09)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isSel ? '#00f0ff' : '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {phone.name}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 4,
                          width: 'fit-content',
                          background: phone.formFactor === 'fold' ? 'rgba(168, 85, 247, 0.3)' : phone.formFactor === 'flip' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                          color: phone.formFactor === 'fold' ? '#d8b4fe' : phone.formFactor === 'flip' ? '#fbcfe8' : 'rgba(255, 255, 255, 0.65)',
                        }}>
                          {phone.formFactor.toUpperCase()}
                        </span>
                      </div>
                      {isSel && <Check size={14} color="#00f0ff" style={{ flexShrink: 0, marginLeft: 6 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hardware Finish Swatches */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255, 255, 255, 0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Hardware Finish & Color Variant
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.keys(DEVICE_COLOR_VARIANTS).map((colorKey) => {
                  const variant = DEVICE_COLOR_VARIANTS[colorKey];
                  const isSel = selectedColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      onClick={() => setSelectedColor(colorKey)}
                      style={{
                        flex: 1,
                        background: isSel ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSel ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.09)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: variant.hex, border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: isSel ? '#00f0ff' : '#ffffff' }}>{variant.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Phone Connect Motion Selector */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255, 255, 255, 0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Connection Motion Preset
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {ANIMATION_STYLES.phone.map((anim) => {
                  const isSel = animStyle === anim.id;
                  return (
                    <button
                      key={anim.id}
                      onClick={() => setAnimStyle(anim.id)}
                      style={{
                        background: isSel ? 'rgba(0, 240, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSel ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.09)',
                        borderRadius: 9,
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: isSel ? '#00f0ff' : '#ffffff' }}>{anim.name}</span>
                      {isSel && <Check size={14} color="#00f0ff" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pulse Glow Color Picker */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255, 255, 255, 0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Pulse Ring Halo Color
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {PULSE_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setPulseColor(hex)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: hex,
                      border: pulseColor === hex ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      boxShadow: pulseColor === hex ? `0 0 12px ${hex}` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
                <input
                  type="text"
                  value={pulseColor}
                  onChange={(e) => setPulseColor(e.target.value)}
                  style={{
                    width: 65,
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 7,
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 6px',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>

            {/* Auto-Hide Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.09)' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff' }}>Auto-Hide in Fullscreen Games</div>
                <div style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>Only hides during exclusive 3D fullscreen games</div>
              </div>
              <input
                type="checkbox"
                checked={autoHide}
                onChange={(e) => setAutoHide(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#00f0ff' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
