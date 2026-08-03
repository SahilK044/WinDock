import React from 'react';

/**
 * Ultra-Distinctive 3D Visual Device Graphic Preview Engine:
 * Render precise, model-specific graphics for:
 * 
 * HEADPHONES:
 * - razerbarracuda: Razer Barracuda X (Angular gaming earcup, Razer green/cyan accents)
 * - airpodsmax: AirPods Max (Oval aluminum earcups, mesh canopy headband, stainless arms)
 * - sonywh1000: Sony WH-1000XM5 (Seamless cylindrical headband sliders, gold accent rings)
 * 
 * EARBUDS:
 * - airpodspro: AirPods Pro 2 (MagSafe case with speaker holes, white stem earbuds)
 * - galaxybuds: Galaxy Buds 3 Pro (Transparent-top lid case, angular Blade Light stems)
 * 
 * SMARTPHONES:
 * - s24ultra / s25ultra: Galaxy S24/S25 Ultra (Boxy titanium frame, centered punch-hole)
 * - zfold6 / zfold5: Galaxy Z Fold 6/5 (Dual screen book fold, hinge line)
 * - zflip6 / zflip5: Galaxy Z Flip 6/5 (Clamshell flip, cover display + dual cameras)
 * - iphone16pro / iphone15pro: iPhone 16/15 Pro (Rounded titanium frame, 3-lens plateau, dynamic island)
 * - iphone16: iPhone 16 (Dynamic island, sleek dual vertical camera)
 * 
 * ANIMATIONS:
 * - Headphones: Smooth 360° slow spin on hover
 * - Earbuds: Lid flips open, twin earbuds pop out & float/spin on hover
 * - Dynamic color finish transition (Space Grey, Ceramic White, Onyx Black, etc.)
 */
export default function DeviceCard3D({ modelId, category = 'phone', formFactor, brand, colorHex = '#3a3a3c', isSelected, isHovered, isActivated = false }) {
  const isApple = brand === 'Apple' || (modelId && modelId.startsWith('iphone'));
  const isFold = formFactor === 'fold' || (modelId && modelId.includes('fold'));
  const isFlip = formFactor === 'flip' || (modelId && modelId.includes('flip'));
  const mainColor = category === 'earbud'
    ? (modelId === 'airpodspro' ? '#f5f5f7' : '#171a20')
    : (colorHex || '#3a3a3c');
  const isEarbudOpen = category === 'earbud' && isHovered && isActivated;
  const isLightColor = mainColor === '#f2f2f7' || mainColor === '#ffffff';
  const strokeColor = isSelected ? '#00f0ff' : 'rgba(255,255,255,0.25)';

  return (
    <div style={{
      width: 86,
      height: 104,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1000px',
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transform: isSelected ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1)',
    }}>
      {/* Soft Glow Ambient Floor Shadow */}
      <div style={{
        position: 'absolute',
        bottom: 2,
        width: 58,
        height: 12,
        borderRadius: '50%',
        background: isSelected ? 'rgba(0, 240, 255, 0.45)' : isHovered ? 'rgba(0, 240, 255, 0.28)' : 'rgba(0, 0, 0, 0.6)',
        filter: 'blur(9px)',
        transition: 'all 0.35s ease',
      }} />

      {/* ── 1. HEADPHONES CATEGORY ── */}
      {category === 'headphone' && (
        <div style={{
          width: 78,
          height: 78,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isHovered ? 'rotateY(180deg) rotateZ(4deg)' : 'rotateY(0deg)',
          transformStyle: 'preserve-3d',
        }}>
          {/* RAZER BARRACUDA X 2.4G */}
          {modelId === 'razerbarracuda' && (
            <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
              {/* Angular Gaming Headband */}
              <path d="M 14 42 C 14 14, 62 14, 62 42" stroke={mainColor} strokeWidth="7" strokeLinecap="square" style={{ transition: 'stroke 0.4s ease' }} />
              <path d="M 22 28 C 22 18, 54 18, 54 28" stroke="#00f0ff" strokeWidth="2" strokeDasharray="3 2" opacity="0.8" />
              {/* Angular Earcup Left */}
              <path d="M 8 32 L 24 30 L 24 54 L 8 52 Z" fill={mainColor} stroke={strokeColor} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <circle cx="16" cy="42" r="3" fill="#30d158" boxShadow="0 0 6px #30d158" />
              {/* Angular Earcup Right */}
              <path d="M 52 30 L 68 32 L 68 52 L 52 54 Z" fill={mainColor} stroke={strokeColor} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <circle cx="60" cy="42" r="3" fill="#30d158" />
              {/* Mic Boom Attachment */}
              <path d="M 12 50 Q 6 62 18 64" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="18" cy="64" r="2.5" fill="#00f0ff" />
            </svg>
          )}

          {/* AIRPODS MAX */}
          {modelId === 'airpodsmax' && (
            <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
              {/* Mesh Canopy Headband */}
              <path d="M 16 38 C 16 16, 60 16, 60 38" stroke={mainColor} strokeWidth="4" strokeLinecap="round" style={{ transition: 'stroke 0.4s ease' }} />
              <path d="M 20 26 C 20 18, 56 18, 56 26" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeDasharray="2 2" strokeLinecap="round" />
              {/* Stainless Steel Telescoping Stems */}
              <line x1="18" y1="28" x2="18" y2="38" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="58" y1="28" x2="58" y2="38" stroke="#cbd5e1" strokeWidth="3" />
              {/* Iconic Oval Aluminum Earcup Left */}
              <rect x="8" y="32" width="18" height="26" rx="9" fill={mainColor} stroke={strokeColor} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="11" y="35" width="12" height="20" rx="6" fill={isLightColor ? '#e2e8f0' : '#1e293b'} />
              {/* Iconic Oval Aluminum Earcup Right */}
              <rect x="50" y="32" width="18" height="26" rx="9" fill={mainColor} stroke={strokeColor} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="53" y="35" width="12" height="20" rx="6" fill={isLightColor ? '#e2e8f0' : '#1e293b'} />
              {/* Digital Crown Button */}
              <rect x="22" y="31" width="3" height="5" rx="1" fill="#94a3b8" />
            </svg>
          )}

          {/* SONY WH-1000XM5 */}
          {modelId === 'sonywh1000' && (
            <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
              {/* Seamless Cylindrical Slider Headband */}
              <path d="M 18 40 C 18 18, 58 18, 58 40" stroke={mainColor} strokeWidth="5" strokeLinecap="round" style={{ transition: 'stroke 0.4s ease' }} />
              <line x1="18" y1="32" x2="18" y2="40" stroke="#fbbf24" strokeWidth="1.5" />
              <line x1="58" y1="32" x2="58" y2="40" stroke="#fbbf24" strokeWidth="1.5" />
              {/* Smooth Matte Earcup Left */}
              <rect x="8" y="34" width="16" height="24" rx="8" fill={mainColor} stroke={strokeColor} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <circle cx="16" cy="38" r="2" fill="#fbbf24" opacity="0.9" />
              {/* Smooth Matte Earcup Right */}
              <rect x="52" y="34" width="16" height="24" rx="8" fill={mainColor} stroke={strokeColor} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <circle cx="60" cy="38" r="2" fill="#fbbf24" opacity="0.9" />
            </svg>
          )}
        </div>
      )}

      {/* ── 2. EARBUDS CATEGORY (Lid Open & Earbuds Pop-Out Animation) ── */}
      {category === 'earbud' && (
        <div style={{
          width: 78,
          height: 86,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        }}>
          {/* Floating Twin Earbuds (Pop Out & Float on Hover!) */}
          <div style={{
            position: 'absolute',
            top: isEarbudOpen ? 2 : 28,
            opacity: isEarbudOpen ? 1 : 0,
            display: 'flex',
            gap: 18,
            transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isEarbudOpen ? 'scale(1.1) rotate(-6deg)' : 'scale(0.5)',
            zIndex: 3,
          }}>
            {/* AIRPODS PRO 2 STEMS */}
            {modelId === 'airpodspro' ? (
              <>
                <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
                  <ellipse cx="9" cy="8" rx="7" ry="6" fill={mainColor} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <rect x="7" y="12" width="4" height="14" rx="2" fill={mainColor} />
                  <rect x="8" y="15" width="2" height="4" fill="#00f0ff" />
                </svg>
                <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
                  <ellipse cx="9" cy="8" rx="7" ry="6" fill={mainColor} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <rect x="7" y="12" width="4" height="14" rx="2" fill={mainColor} />
                  <rect x="8" y="15" width="2" height="4" fill="#00f0ff" />
                </svg>
              </>
            ) : (
              /* GALAXY BUDS 3 PRO BLADE STEMS WITH LED LIGHT STRIP */
              <>
                <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                  <path d="M 4 2 L 16 6 L 12 26 L 4 24 Z" fill={mainColor} stroke="#00f0ff" strokeWidth="1" />
                  <line x1="10" y1="6" x2="8" y2="24" stroke="#00f0ff" strokeWidth="2" boxShadow="0 0 8px #00f0ff" />
                </svg>
                <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                  <path d="M 4 2 L 16 6 L 12 26 L 4 24 Z" fill={mainColor} stroke="#00f0ff" strokeWidth="1" />
                  <line x1="10" y1="6" x2="8" y2="24" stroke="#00f0ff" strokeWidth="2" boxShadow="0 0 8px #00f0ff" />
                </svg>
              </>
            )}
          </div>

          {/* Charging Case Body */}
          <div style={{ position: 'relative', width: 52, height: 54, marginTop: 16 }}>
            {/* Lid (Flips open on hover!) */}
            <div style={{
              width: 52,
              height: 20,
              borderRadius: modelId === 'galaxybuds' ? '14px 14px 2px 2px' : '14px 14px 4px 4px',
              background: modelId === 'galaxybuds' ? 'rgba(255,255,255,0.25)' : mainColor,
              border: strokeColor ? `1.5px solid ${isSelected ? '#00f0ff' : 'rgba(255,255,255,0.3)'}` : 'none',
              backdropFilter: modelId === 'galaxybuds' ? 'blur(10px)' : 'none',
              transformOrigin: 'top center',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease',
              transform: isEarbudOpen ? 'translateY(-12px) rotateX(-65deg)' : 'rotateX(0deg)',
              zIndex: 2,
            }} />

            {/* Case Base */}
            <div style={{
              width: 52,
              height: 34,
              borderRadius: '2px 2px 16px 16px',
              background: mainColor,
              border: strokeColor ? `1.5px solid ${isSelected ? '#00f0ff' : 'rgba(255,255,255,0.3)'}` : 'none',
              boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.4s ease',
              zIndex: 1,
            }}>
              {/* MagSafe Lanyard Loop & Speaker Hole Details for AirPods Pro */}
              {modelId === 'airpodspro' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 4, height: 2, borderRadius: 1, background: '#475569' }} />
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }} />
                  <div style={{ width: 4, height: 2, borderRadius: 1, background: '#475569' }} />
                </div>
              )}

              {/* Blade Light Strip for Galaxy Buds */}
              {modelId === 'galaxybuds' && (
                <div style={{ width: 24, height: 3, borderRadius: 2, background: '#00f0ff', boxShadow: '0 0 8px #00f0ff' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. SMARTPHONES CATEGORY ── */}
      {category === 'phone' && (
        <svg width="72" height="96" viewBox="0 0 72 96" fill="none" style={{
          transition: 'transform 0.4s ease',
          transform: isHovered ? 'rotateY(16deg) rotateX(6deg)' : 'none',
        }}>
          <defs>
            <linearGradient id={`screen-grad-${modelId}`} x1="0" y1="0" x2="0" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#090d16" />
              <stop offset="50%" stopColor="#020617" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>

            <linearGradient id={`cyan-glow-${modelId}`} x1="0" y1="0" x2="72" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7000ff" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* ── Z-FOLD FORM FACTOR ── */}
          {isFold && (
            <g>
              <rect x="8" y="10" width="26" height="74" rx="3" fill={mainColor} stroke="rgba(255,255,255,0.2)" strokeWidth="1" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="10" y="12" width="22" height="70" rx="2" fill="#0b0f19" />
              <rect x="33" y="9" width="3" height="76" rx="1.5" fill="#334155" />
              <rect x="35" y="10" width="28" height="74" rx="3" fill={mainColor} stroke={isSelected ? '#00f0ff' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="37" y="12" width="24" height="70" rx="2" fill={`url(#screen-grad-${modelId})`} />
              <path d="M37 50 Q 48 25 59 55 T 37 70" fill={`url(#cyan-glow-${modelId})`} opacity="0.4" />
              <circle cx="49" cy="16" r="1" fill="#000" stroke="#1e293b" strokeWidth="0.5" />
            </g>
          )}

          {/* ── Z-FLIP FORM FACTOR ── */}
          {isFlip && (
            <g>
              <rect x="16" y="8" width="38" height="38" rx="6" fill={mainColor} stroke={isSelected ? '#00f0ff' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="18" y="10" width="34" height="22" rx="4" fill={`url(#screen-grad-${modelId})`} />
              <rect x="20" y="12" width="30" height="18" rx="3" fill={`url(#cyan-glow-${modelId})`} opacity="0.35" />
              <circle cx="23" cy="37" r="2.5" fill="#000" stroke="#475569" strokeWidth="0.8" />
              <circle cx="31" cy="37" r="2.5" fill="#000" stroke="#475569" strokeWidth="0.8" />
              <line x1="16" y1="48" x2="54" y2="48" stroke="#334155" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="16" y="50" width="38" height="38" rx="6" fill={mainColor} stroke="rgba(255,255,255,0.15)" strokeWidth="1" style={{ transition: 'fill 0.4s ease' }} />
            </g>
          )}

          {/* ── SAMSUNG S24/S25 ULTRA (5 Rear Lenses + Centered Punch-Hole) ── */}
          {!isFold && !isFlip && !isApple && (
            <g>
              <rect x="13" y="6" width="46" height="84" rx="3" fill={mainColor} stroke={isSelected ? '#00f0ff' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="15" y="8" width="42" height="80" rx="1.5" fill={`url(#screen-grad-${modelId})`} />
              <path d="M15 62 C 27 32, 47 72, 57 42 L 57 88 L 15 88 Z" fill={`url(#cyan-glow-${modelId})`} opacity="0.3" />
              <circle cx="36" cy="13" r="1.5" fill="#000" stroke="#334155" strokeWidth="0.5" />
            </g>
          )}

          {/* ── IPHONE 16 / 15 PRO (Dynamic Island + 3-Lens Plateau) ── */}
          {!isFold && !isFlip && isApple && (
            <g>
              <rect x="13" y="6" width="46" height="84" rx="11" fill={mainColor} stroke={isSelected ? '#00f0ff' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" style={{ transition: 'fill 0.4s ease' }} />
              <rect x="15" y="8" width="42" height="80" rx="9" fill={`url(#screen-grad-${modelId})`} />
              <rect x="28" y="11" width="16" height="4" rx="2" fill="#000" stroke="#1e293b" strokeWidth="0.5" />
              <path d="M15 58 C 29 38, 40 68, 57 48 L 57 84 C 57 88, 53 88, 49 88 L 23 88 C 17 88, 15 88, 15 84 Z" fill={`url(#cyan-glow-${modelId})`} opacity="0.35" />
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
