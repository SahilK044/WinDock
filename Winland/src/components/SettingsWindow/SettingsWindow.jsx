import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Smartphone, Headphones, Disc, Palette, Monitor, Info,
  Check, X, Sparkles, Gamepad, Speaker,
} from 'lucide-react';
import { DEVICE_CATALOG, DEVICE_COLOR_VARIANTS, ANIMATION_STYLES } from '../../data/deviceCatalog';
import { STYLE_KEYS, DEFAULT_STYLES, readDevicePrefs } from '../../data/devicePrefs';
import Canvas3DCard from './Canvas3DCard';
import MotionPreviewStage from './MotionPreviewStage';
import { SETTINGS_CSS } from './settingsTheme';

// Sidebar grouping: device pickers first, then everything about presentation.
const SIDEBAR_GROUPS = [
  {
    label: 'Devices',
    tabs: [
      { id: 'phones',      label: 'Smartphones',        icon: Smartphone },
      { id: 'headphones',  label: 'Headphones',         icon: Headphones },
      { id: 'earbuds',     label: 'Earbuds & Audio',    icon: Disc },
      { id: 'controllers', label: 'Gaming Controllers', icon: Gamepad },
      { id: 'speakers',    label: 'Speakers & Sound',   icon: Speaker },
    ],
  },
  {
    label: 'WinLand',
    tabs: [
      { id: 'style',  label: 'Style & Motion', icon: Palette },
      { id: 'system', label: 'System & Gaming', icon: Monitor },
      { id: 'about',  label: 'About',          icon: Info },
    ],
  },
];

// Each motion category, the catalog it draws from, and which selection it
// previews. `cat` matches the devicePrefs keys.
const MOTION_CATEGORIES = [
  { cat: 'phone',      label: 'Phone',      styleKey: 'phone' },
  { cat: 'headphones', label: 'Headphones', styleKey: 'headphones' },
  { cat: 'earbuds',    label: 'Earbuds',    styleKey: 'earbuds' },
  { cat: 'controller', label: 'Controller', styleKey: 'controller' },
  { cat: 'speaker',    label: 'Speaker',    styleKey: 'speaker' },
];

/**
 * Header and DeviceCard MUST stay at module scope.
 *
 * Declaring them inside SettingsWindow gives them a new function identity on
 * every render, so React treats them as a different component type and
 * remounts their whole subtree. Hovering a card sets state, which re-rendered
 * the window, which tore down and rebuilt every card's WebGL context — the
 * models visibly blinked out and back on every hover.
 */
function Header({ title, sub, count }) {
  return (
    <header className="wl-head">
      <div className="wl-head-row">
        <div>
          <h1 className="wl-h1">{title}</h1>
          {sub && <p className="wl-sub">{sub}</p>}
        </div>
        {count != null && <span className="wl-count">{count} models</span>}
      </div>
    </header>
  );
}

const DeviceCard = React.memo(function DeviceCard({
  id, modelId, name, badge, category, selected, colorHex,
  isHovered, isActivated, onSelect, onHover, onLeave,
}) {
  return (
    <button
      type="button"
      className="wl-card"
      aria-pressed={selected}
      onClick={() => onSelect(id, category)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onLeave(category)}
    >
      {selected && <span className="wl-tick"><Check size={11} strokeWidth={3.2} /></span>}
      <Canvas3DCard
        modelId={modelId}
        category={category}
        colorHex={colorHex}
        isSelected={selected}
        isHovered={isHovered}
        isActivated={isActivated}
      />
      <span className="wl-card-name">{name}</span>
      {badge && <span className="wl-card-badge">{badge}</span>}
    </button>
  );
});

export default function SettingsWindow() {
  const [activeTab, setActiveTab]                   = useState('phones');
  const [selectedPhone, setSelectedPhone]           = useState(() => localStorage.getItem('winland_phone_id')      || 's24ultra');
  const [selectedHeadphones, setSelectedHeadphones] = useState(() => localStorage.getItem('winland_headphones_id') || 'razerbarracuda');
  const [selectedEarbuds, setSelectedEarbuds]       = useState(() => localStorage.getItem('winland_earbuds_id')    || 'airpodspro');
  const [selectedController, setSelectedController] = useState(() => localStorage.getItem('winland_controller_id') || 'ps5_controller');
  const [selectedSpeaker, setSelectedSpeaker]       = useState(() => localStorage.getItem('winland_speaker_id')    || 'soundbar');
  const [selectedColor, setSelectedColor]           = useState(() => localStorage.getItem('winland_color_variant') || 'space-grey');

  // One motion style per device category — the island plays the style matching
  // whichever kind of device connected, so they are stored separately.
  const [animStyles, setAnimStyles] = useState(() => {
    const initial = {};
    for (const cat of Object.keys(STYLE_KEYS)) {
      initial[cat] = localStorage.getItem(STYLE_KEYS[cat]) || DEFAULT_STYLES[cat];
    }
    return initial;
  });
  const animStyle = animStyles.phone; // legacy single-value consumers

  const [autoHide, setAutoHide]             = useState(() => localStorage.getItem('winland_autohide_enabled') === 'true');
  const [hoveredCardId, setHoveredCardId]   = useState(null);
  // Selection chooses the device; activation is a separate, temporary click
  // state used only by the earbud showcase while the pointer stays on its card.
  const [activeEarbudId, setActiveEarbudId] = useState(null);
  const [motionCat, setMotionCat]           = useState('phone');

  const [xboxVariant, setXboxVariant] = useState(() => localStorage.getItem('winland_xbox_variant') || 'xbox_white');
  const [xboxFading, setXboxFading]   = useState(false);

  const currentColorHex = DEVICE_COLOR_VARIANTS[selectedColor]?.hex || '#3a3a3c';

  useEffect(() => {
    localStorage.setItem('winland_phone_id',        selectedPhone);
    localStorage.setItem('winland_headphones_id',   selectedHeadphones);
    localStorage.setItem('winland_earbuds_id',      selectedEarbuds);
    localStorage.setItem('winland_controller_id',   selectedController);
    localStorage.setItem('winland_speaker_id',      selectedSpeaker);
    localStorage.setItem('winland_color_variant',   selectedColor);
    localStorage.setItem('winland_anim_style',      animStyle);
    localStorage.setItem('winland_autohide_enabled', autoHide ? 'true' : 'false');
    localStorage.setItem('winland_xbox_variant',    xboxVariant);
    for (const cat of Object.keys(STYLE_KEYS)) {
      localStorage.setItem(STYLE_KEYS[cat], animStyles[cat]);
    }

    window.dispatchEvent(new CustomEvent('winland-settings-changed', {
      detail: { selectedPhone, selectedHeadphones, selectedEarbuds, selectedController, selectedSpeaker, xboxVariant, selectedColor, animStyle, autoHide },
    }));

    // The island is a separate renderer and cannot see the event above, so
    // relay the chosen devices/styles to it through the main process.
    window.electronAPI?.sendDevicePrefs?.(readDevicePrefs());
  }, [selectedPhone, selectedHeadphones, selectedEarbuds, selectedController,
      selectedSpeaker, xboxVariant, selectedColor, animStyle, animStyles, autoHide]);

  const handleClose = () => window.electronAPI?.closeSettingsWindow?.();

  const switchXboxVariant = (next) => {
    if (next === xboxVariant) return;
    setXboxFading(true);
    setTimeout(() => { setXboxVariant(next); setXboxFading(false); }, 260);
  };

  // Stable identities so React.memo on DeviceCard actually holds.
  const handleHover = useCallback((id) => setHoveredCardId(id), []);
  const handleLeave = useCallback((category) => {
    setHoveredCardId(null);
    if (category === 'earbud') setActiveEarbudId(null);
  }, []);

  // Which device and style the motion tab is previewing.
  const motionDeviceId = {
    phone: selectedPhone,
    headphones: selectedHeadphones,
    earbuds: selectedEarbuds,
    controller: selectedController === 'xbox_controller' ? xboxVariant : selectedController,
    speaker: selectedSpeaker,
  }[motionCat];

  const motionCatMeta = MOTION_CATEGORIES.find((m) => m.cat === motionCat);
  const motionStyleList = ANIMATION_STYLES[motionCatMeta?.styleKey] || [];
  const activeStyleId = animStyles[motionCat];
  const activeStyleName = motionStyleList.find((s) => s.id === activeStyleId)?.name;

  const catalogNameFor = (id) => {
    for (const list of Object.values(DEVICE_CATALOG)) {
      const hit = list.find((d) => d.id === id);
      if (hit) return hit.name;
    }
    if (id === 'xbox_white') return 'Xbox Wireless Controller — White';
    if (id === 'xbox_black') return 'Xbox Wireless Controller — Black';
    return id;
  };

  return (
    <div className="wl-root">
      <style>{SETTINGS_CSS}</style>

      <div className="wl-titlebar">
        <div className="wl-title">
          <span className="wl-title-mark"><Settings size={13} color="#6fe5f6" /></span>
          <span className="wl-title-text">WinLand Preferences</span>
        </div>
        <button type="button" className="wl-close" onClick={handleClose} aria-label="Close preferences">
          <X size={13} strokeWidth={2.4} />
        </button>
      </div>

      <div className="wl-body">
        <nav className="wl-sidebar" aria-label="Preferences sections">
          {SIDEBAR_GROUPS.map((group) => (
            <React.Fragment key={group.label}>
              <div className="wl-side-group">{group.label}</div>
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="wl-tab"
                    aria-current={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="wl-tab-icon"><Icon size={15} /></span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <main className="wl-content">
          {activeTab === 'phones' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Header
                  title="Smartphone"
                  sub="Shown when a phone connects. Hover a card to spin it."
                  count={DEVICE_CATALOG.phones.length}
                />
                <button
                  onClick={() => window.electronAPI?.triggerPhoneNotification && window.electronAPI.triggerPhoneNotification()}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.09)',
                    border: '1px solid rgba(255, 255, 255, 0.12)', color: '#f2f2f4', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '600', transition: 'background 0.15s ease'
                  }}
                >
                  Test connection popup
                </button>
              </div>
              <div className="wl-grid wl-grid-3">
                {DEVICE_CATALOG.phones.map((p) => (
                  <DeviceCard
                    key={p.id} id={p.id} modelId={p.id}
                    name={p.name} badge={`${p.brand} · ${p.formFactor}`} category="phone"
                    selected={selectedPhone === p.id} colorHex={currentColorHex}
                    isHovered={hoveredCardId === p.id}
                    isActivated={false}
                    onSelect={() => setSelectedPhone(p.id)}
                    onHover={handleHover} onLeave={handleLeave}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'headphones' && (
            <>
              <Header
                title="Headphones"
                sub="Shown when an over-ear headset connects."
                count={DEVICE_CATALOG.headphones.length}
              />
              <div className="wl-grid wl-grid-3">
                {DEVICE_CATALOG.headphones.map((h) => (
                  <DeviceCard
                    key={h.id} id={h.id} modelId={h.id}
                    name={h.name} badge={`${h.brand} · over-ear`} category="headphone"
                    selected={selectedHeadphones === h.id} colorHex={currentColorHex}
                    isHovered={hoveredCardId === h.id}
                    isActivated={false}
                    onSelect={() => setSelectedHeadphones(h.id)}
                    onHover={handleHover} onLeave={handleLeave}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'earbuds' && (
            <>
              <Header
                title="Earbuds"
                sub="Hover to lift the closed case, then click to open it and reveal both earbuds."
                count={DEVICE_CATALOG.earbuds.length}
              />
              <div className="wl-grid wl-grid-2">
                {DEVICE_CATALOG.earbuds.map((e) => (
                  <DeviceCard
                    key={e.id} id={e.id} modelId={e.id}
                    name={e.name} badge={`${e.brand} · in-ear`} category="earbud"
                    selected={selectedEarbuds === e.id} colorHex={currentColorHex}
                    isHovered={hoveredCardId === e.id}
                    isActivated={activeEarbudId === e.id}
                    // Selecting an earbud also "activates" it, which is what
                    // opens the case and lifts the buds. Without this the card
                    // stays shut no matter how often it is clicked.
                    onSelect={() => { setSelectedEarbuds(e.id); setActiveEarbudId(e.id); }}
                    onHover={handleHover} onLeave={handleLeave}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'controllers' && (
            <>
              <Header
                title="Controller"
                sub="Shown when a gamepad connects."
                count={2}
              />
              <div className="wl-grid wl-grid-2">
                <DeviceCard
                  id="ps5_controller" modelId="ps5_controller"
                  name="PlayStation 5 DualSense" badge="Sony · gamepad" category="controller"
                  selected={selectedController === 'ps5_controller'}
                  colorHex={currentColorHex}
                  isHovered={hoveredCardId === 'ps5_controller'}
                  isActivated={false}
                  onSelect={() => setSelectedController('ps5_controller')}
                  onHover={handleHover} onLeave={handleLeave}
                />

                {/* Xbox shares one card across two colourways. */}
                <div
                  className="wl-card"
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedController === 'xbox_controller'}
                  onClick={() => setSelectedController('xbox_controller')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedController('xbox_controller'); }
                  }}
                  onMouseEnter={() => setHoveredCardId('xbox_controller')}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  {selectedController === 'xbox_controller' && (
                    <span className="wl-tick"><Check size={11} strokeWidth={3.2} /></span>
                  )}
                  <div style={{ opacity: xboxFading ? 0 : 1, transition: 'opacity 240ms ease' }}>
                    <Canvas3DCard
                      modelId={xboxVariant}
                      category="controller"
                      colorHex={currentColorHex}
                      isSelected={selectedController === 'xbox_controller'}
                      isHovered={hoveredCardId === 'xbox_controller'}
                    />
                  </div>
                  <span className="wl-card-name">Xbox Wireless Controller</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ key: 'xbox_white', label: 'White' }, { key: 'xbox_black', label: 'Black' }].map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        className="wl-pill"
                        aria-pressed={xboxVariant === v.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedController('xbox_controller');
                          switchXboxVariant(v.key);
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'speakers' && (
            <>
              <Header
                title="Speakers"
                sub="Shown when a speaker or soundbar connects."
                count={DEVICE_CATALOG.speakers.length}
              />
              <div className="wl-grid wl-grid-2">
                {DEVICE_CATALOG.speakers.map((s) => (
                  <DeviceCard
                    key={s.id} id={s.id} modelId={s.id}
                    name={s.name} badge={`${s.brand} · sound system`} category="speaker"
                    selected={selectedSpeaker === s.id} colorHex={currentColorHex}
                    isHovered={hoveredCardId === s.id}
                    isActivated={false}
                    onSelect={() => setSelectedSpeaker(s.id)}
                    onHover={handleHover} onLeave={handleLeave}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'style' && (
            <>
              <Header
                title="Style & Motion"
                sub="How each kind of device moves when it connects or disconnects. Pick a motion to play it here."
              />

              <div style={{ marginBottom: 14 }}>
                <div className="wl-seg" role="group" aria-label="Device category">
                  {MOTION_CATEGORIES.map((m) => (
                    <button
                      key={m.cat}
                      type="button"
                      className="wl-seg-item"
                      aria-pressed={motionCat === m.cat}
                      onClick={() => setMotionCat(m.cat)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <MotionPreviewStage
                modelId={motionDeviceId}
                prefCategory={motionCat}
                animStyle={activeStyleId}
                deviceName={catalogNameFor(motionDeviceId)}
                styleName={activeStyleName}
              />

              <div className="wl-style-list" style={{ marginTop: 16 }}>
                {motionStyleList.map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    className="wl-style"
                    aria-pressed={activeStyleId === anim.id}
                    onClick={() => setAnimStyles((prev) => ({ ...prev, [motionCat]: anim.id }))}
                  >
                    <span>{anim.name}</span>
                    {activeStyleId === anim.id
                      ? <Check size={15} strokeWidth={3} />
                      : <span className="wl-style-hint">Preview</span>}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 26 }}>
                <h2 className="wl-h1" style={{ fontSize: 15 }}>Hardware finish</h2>
                <p className="wl-sub" style={{ marginBottom: 12 }}>
                  Tints phone bodies. Earbud cases and AirPods Max keep their own finish.
                </p>
                <div className="wl-grid wl-grid-3">
                  {Object.keys(DEVICE_COLOR_VARIANTS).map((key) => {
                    const variant = DEVICE_COLOR_VARIANTS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        className="wl-swatch"
                        aria-pressed={selectedColor === key}
                        onClick={() => setSelectedColor(key)}
                      >
                        <span className="wl-swatch-dot" style={{ background: variant.hex }} />
                        {variant.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <>
              <Header title="System & Gaming" sub="How WinLand behaves alongside other apps." />
              <div className="wl-row">
                <div>
                  <div className="wl-row-title">Hide during fullscreen games</div>
                  <div className="wl-row-sub">
                    Keeps the island out of the way while an exclusive fullscreen game is running.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoHide}
                  aria-label="Hide during fullscreen games"
                  className="wl-switch"
                  onClick={() => setAutoHide((v) => !v)}
                >
                  <span className="wl-switch-knob" />
                </button>
              </div>
            </>
          )}

          {activeTab === 'about' && (
            <div className="wl-about">
              <div className="wl-about-mark"><Sparkles size={30} color="#6fe5f6" /></div>
              <div className="wl-about-name">WinLand</div>
              <div className="wl-about-ver">Version 1.0.0</div>
              <p className="wl-about-copy">
                A Dynamic Island for Windows. Shows what is playing, what just connected,
                and how much battery it has left — with your own hardware rendered in 3D.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
