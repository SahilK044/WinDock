/**
 * Settings window styling, kept as a single injected stylesheet.
 *
 * Inline styles cannot express :hover, :focus-visible or reduced-motion, and
 * those are what make the window feel finished — so the chrome lives here and
 * the JSX stays structural.
 *
 * Direction: dense graphite, not glass. An earlier pass leaned on heavy
 * translucency and a cyan accent; both cheapened it — the blur let desktop
 * clutter through the panel and the cyan read as gamer RGB rather than a system
 * preference pane. This is a solid, quiet instrument panel: near-black
 * surfaces, hairline separation, and selection expressed as light (a brighter
 * surface, white text) rather than colour. The only warmth is the studio light
 * over the preview stage, which is the one thing meant to draw the eye.
 */
export const SETTINGS_CSS = `
.wl-root {
  --base: #0f0f12;
  --panel-top: #17171b;
  --panel-bottom: #101013;
  --sidebar: rgba(255, 255, 255, 0.022);
  --surface: rgba(255, 255, 255, 0.052);
  --surface-hover: rgba(255, 255, 255, 0.088);
  --surface-active: rgba(255, 255, 255, 0.14);
  --stroke: rgba(255, 255, 255, 0.075);
  --stroke-strong: rgba(255, 255, 255, 0.14);
  --label: #f2f2f4;
  --label-2: rgba(235, 235, 240, 0.60);
  --label-3: rgba(235, 235, 240, 0.32);
  --focus: rgba(255, 255, 255, 0.85);
  --danger: #ff5f57;

  --font: "SF Pro Display", -apple-system, BlinkMacSystemFont,
          "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif;

  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--stroke-strong);
  background: linear-gradient(178deg, var(--panel-top) 0%, var(--panel-bottom) 100%);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.07);
  font-family: var(--font);
  color: var(--label);
  user-select: none;
  -webkit-font-smoothing: antialiased;
}

/* ── Title bar ─────────────────────────────────────────────────────────── */
.wl-titlebar {
  height: 44px;
  flex-shrink: 0;
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
}
.wl-title { display: flex; align-items: center; gap: 9px; }
.wl-title-mark {
  width: 22px; height: 22px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.13);
  color: var(--label);
}
.wl-title-text { font-size: 13px; font-weight: 590; letter-spacing: -0.01em; }
.wl-close {
  -webkit-app-region: no-drag;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: var(--label-2);
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.wl-close:hover { background: var(--danger); border-color: var(--danger); color: #fff; }
.wl-close:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

.wl-body { flex: 1; display: flex; min-height: 0; }

/* ── Sidebar ───────────────────────────────────────────────────────────── */
.wl-sidebar {
  width: 200px; flex-shrink: 0;
  padding: 10px 9px;
  background: var(--sidebar);
  border-right: 1px solid rgba(255, 255, 255, 0.055);
  display: flex; flex-direction: column; gap: 1px;
  overflow-y: auto;
}
.wl-sidebar::-webkit-scrollbar { width: 0; }
.wl-side-group {
  font-size: 9.5px; font-weight: 650; letter-spacing: 0.09em; text-transform: uppercase;
  color: var(--label-3);
  padding: 14px 10px 6px;
}
.wl-side-group:first-child { padding-top: 4px; }
.wl-tab {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 7px 10px;
  border: none; border-radius: 7px;
  background: transparent;
  color: var(--label-2);
  font-family: inherit; font-size: 12.5px; font-weight: 500; text-align: left;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.wl-tab:hover { background: rgba(255, 255, 255, 0.05); color: var(--label); }
.wl-tab:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }
.wl-tab[aria-current="true"] {
  background: var(--surface-active);
  color: var(--label);
  font-weight: 590;
}
.wl-tab-icon { display: flex; opacity: 0.8; }
.wl-tab[aria-current="true"] .wl-tab-icon { opacity: 1; }

/* ── Content ───────────────────────────────────────────────────────────── */
.wl-content { flex: 1; min-width: 0; overflow-y: auto; padding: 22px 26px 28px; }
.wl-content::-webkit-scrollbar { width: 9px; }
.wl-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.11); border-radius: 5px;
  border: 3px solid transparent; background-clip: content-box;
}
.wl-content::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); background-clip: content-box; }

.wl-head { margin-bottom: 18px; }
.wl-head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.wl-h1 { font-size: 19px; font-weight: 620; letter-spacing: -0.021em; }
.wl-sub { font-size: 12px; color: var(--label-2); margin-top: 3px; line-height: 1.45; }
.wl-count {
  flex-shrink: 0; font-size: 10.5px; font-weight: 560;
  color: var(--label-2); background: var(--surface);
  border: 1px solid var(--stroke); border-radius: 999px; padding: 4px 10px;
}

.wl-grid { display: grid; gap: 12px; }
.wl-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.wl-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

/* ── Device card ───────────────────────────────────────────────────────── */
.wl-card {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; padding: 12px 10px 11px;
  border-radius: 13px;
  background: var(--surface);
  border: 1px solid var(--stroke);
  cursor: pointer; text-align: center; font-family: inherit;
  transition: background 150ms ease, border-color 150ms ease;
}
.wl-card:hover { background: var(--surface-hover); }
.wl-card:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wl-card[aria-pressed="true"] {
  background: var(--surface-active);
  border-color: rgba(255, 255, 255, 0.30);
}
.wl-card-name {
  font-size: 12px; font-weight: 560; color: var(--label);
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wl-card-badge {
  font-size: 9px; font-weight: 620; letter-spacing: 0.055em; text-transform: uppercase;
  color: var(--label-3);
}
.wl-tick {
  position: absolute; top: 9px; right: 9px;
  width: 17px; height: 17px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #f2f2f4; color: #121215;
}

/* ── Segmented control ─────────────────────────────────────────────────── */
.wl-seg {
  display: inline-flex; gap: 2px; padding: 2px;
  background: rgba(0, 0, 0, 0.34);
  border: 1px solid var(--stroke);
  border-radius: 9px;
}
.wl-seg-item {
  border: none; background: transparent; cursor: pointer;
  font-family: inherit; font-size: 11.5px; font-weight: 520;
  color: var(--label-2); padding: 5px 12px; border-radius: 7px;
  transition: background 120ms ease, color 120ms ease;
}
.wl-seg-item:hover { color: var(--label); }
.wl-seg-item:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }
.wl-seg-item[aria-pressed="true"] {
  background: rgba(255, 255, 255, 0.13);
  color: var(--label); font-weight: 590;
}

/* ── Motion preview stage (the one lit element) ────────────────────────── */
.wl-stage {
  position: relative; overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--stroke);
  background:
    radial-gradient(120% 85% at 50% 0%, rgba(255, 252, 245, 0.10) 0%, transparent 60%),
    linear-gradient(180deg, #1b1b20 0%, #0c0c0f 100%);
}
.wl-stage-glow {
  position: absolute; left: 50%; top: 26%;
  width: 400px; height: 240px; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(255, 250, 240, 0.13), transparent 70%);
  filter: blur(34px);
  pointer-events: none;
}
.wl-stage-viewport {
  position: relative;
  height: 236px;
  display: flex; align-items: center; justify-content: center;
  padding-bottom: 16px;
  box-sizing: border-box;
}
/* Contact shadow where the device meets the stage; sits behind the canvas. */
.wl-stage-floor {
  position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%);
  z-index: 0;
  width: 230px; height: 30px;
  background:
    radial-gradient(closest-side, rgba(255, 250, 240, 0.16), transparent 72%),
    radial-gradient(closest-side, rgba(0, 0, 0, 0.62), transparent 66%);
  filter: blur(12px);
  pointer-events: none;
}
.wl-stage-viewport > div:not(.wl-stage-floor) { position: relative; z-index: 1; }
.wl-stage-empty { font-size: 12px; color: var(--label-3); }
.wl-stage-bar {
  position: relative;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.3);
}
.wl-stage-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wl-stage-device {
  font-size: 12.5px; font-weight: 590;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wl-stage-style {
  font-size: 11px; color: var(--label-2);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wl-replay {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid var(--stroke);
  color: var(--label); font-family: inherit; font-size: 11.5px; font-weight: 560;
  cursor: pointer;
  transition: background 130ms ease, border-color 130ms ease;
}
.wl-replay:hover:not(:disabled) { background: rgba(255, 255, 255, 0.16); border-color: var(--stroke-strong); }
.wl-replay:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wl-replay:disabled { opacity: 0.4; cursor: default; }

/* ── Motion style rows ─────────────────────────────────────────────────── */
.wl-style-list { display: flex; flex-direction: column; gap: 6px; }
.wl-style {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; padding: 11px 14px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--stroke);
  color: var(--label);
  font-family: inherit; font-size: 12.5px; font-weight: 500; text-align: left;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}
.wl-style:hover { background: var(--surface-hover); }
.wl-style:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wl-style[aria-pressed="true"] {
  background: var(--surface-active);
  border-color: rgba(255, 255, 255, 0.30);
  font-weight: 590;
}
.wl-style-desc { font-size: 11px; color: var(--label-2); margin-top: 2px; font-weight: 400; }
.wl-style-hint { font-size: 11px; color: var(--label-3); flex-shrink: 0; }

/* ── Rows / toggles ────────────────────────────────────────────────────── */
.wl-row {
  display: flex; align-items: center; justify-content: space-between; gap: 18px;
  padding: 15px 17px; border-radius: 12px;
  background: var(--surface); border: 1px solid var(--stroke);
}
.wl-row-title { font-size: 13px; font-weight: 560; }
.wl-row-sub { font-size: 11.5px; color: var(--label-2); margin-top: 3px; line-height: 1.45; }

.wl-switch {
  position: relative; flex-shrink: 0;
  width: 42px; height: 25px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  border: none; cursor: pointer; padding: 0;
  transition: background 180ms ease;
}
.wl-switch[aria-checked="true"] { background: #f2f2f4; }
.wl-switch:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wl-switch-knob {
  position: absolute; top: 2.5px; left: 2.5px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  transition: transform 180ms cubic-bezier(0.32, 0.9, 0.3, 1);
}
.wl-switch[aria-checked="true"] .wl-switch-knob { background: #121215; transform: translateX(17px); }

/* ── Finish swatches ───────────────────────────────────────────────────── */
.wl-swatch {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 13px; border-radius: 10px;
  background: var(--surface); border: 1px solid var(--stroke);
  color: var(--label); font-family: inherit; font-size: 12px; font-weight: 520;
  cursor: pointer; transition: background 140ms ease, border-color 140ms ease;
}
.wl-swatch:hover { background: var(--surface-hover); }
.wl-swatch:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wl-swatch[aria-pressed="true"] { background: var(--surface-active); border-color: rgba(255,255,255,0.30); font-weight: 590; }
.wl-swatch-dot {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

/* ── Variant pills (Xbox colourway) ────────────────────────────────────── */
.wl-pill {
  font-size: 10px; font-weight: 620;
  padding: 3px 10px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid var(--stroke);
  color: var(--label-2); cursor: pointer; font-family: inherit;
  transition: background 130ms ease, color 130ms ease;
}
.wl-pill:hover { background: rgba(255, 255, 255, 0.16); color: var(--label); }
.wl-pill:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wl-pill[aria-pressed="true"] { background: #f2f2f4; border-color: transparent; color: #121215; }

/* ── About ─────────────────────────────────────────────────────────────── */
.wl-about { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 26px; }
.wl-about-mark {
  width: 62px; height: 62px; border-radius: 17px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.14);
}
.wl-about-name { font-size: 21px; font-weight: 640; letter-spacing: -0.02em; margin-top: 16px; }
.wl-about-ver { font-size: 11.5px; color: var(--label-3); margin-top: 3px; }
.wl-about-copy { font-size: 12.5px; color: var(--label-2); line-height: 1.65; max-width: 400px; margin-top: 14px; }

@media (prefers-reduced-motion: reduce) {
  .wl-root *, .wl-root *::before, .wl-root *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
`;
