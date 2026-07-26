(function () {
  "use strict";

  // ─── CONFIG ───
  const MAX_RINGS = 8;
  const RING_SPAWN_INTERVAL = 220; // ms between new rings
  const RING_LIFETIME = 2200; // ms before ring fully fades
  const RING_MAX_RADIUS = 180; // px from center
  const RING_START_RADIUS = 28; // starting radius (pill half-height)
  const BASE_LINE_WIDTH = 2.5;
  const IDLE_PULSE_SPEED = 0.0018;

  // ─── STATE ───
  let canvas = null;
  let ctx = null;
  let rings = [];
  let lastSpawn = 0;
  let accentH = 145; // default green hue
  let accentS = 80;
  let accentL = 55;
  let targetH = 145, targetS = 80, targetL = 55;
  let isPlaying = false;
  let animId = null;
  let lastArtUrl = "";
  let idlePhase = 0;

  // ─── COLOR EXTRACTION ───
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function extractDominantColor(imgSrc) {
    if (!imgSrc || imgSrc === lastArtUrl) return;
    lastArtUrl = imgSrc;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      const c = document.createElement("canvas");
      c.width = 32; c.height = 32;
      const cx = c.getContext("2d");
      cx.drawImage(img, 0, 0, 32, 32);
      try {
        const data = cx.getImageData(0, 0, 32, 32).data;
        let bestR = 30, bestG = 215, bestB = 96, bestSat = -1;
        for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const sat = mx > 0 ? (mx - mn) / mx : 0;
          const lum = (mx + mn) / 510;
          if (lum > 0.12 && lum < 0.88 && sat > 0.15 && sat > bestSat) {
            bestSat = sat;
            bestR = r; bestG = g; bestB = b;
          }
        }
        const [h, s, l] = rgbToHsl(bestR, bestG, bestB);
        targetH = h;
        targetS = Math.max(50, s);
        targetL = Math.min(65, Math.max(40, l));
      } catch (e) { /* CORS or other error — keep current color */ }
    };
    img.src = imgSrc;
  }

  // ─── CANVAS SETUP ───
  function createCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.id = "ripple-visualizer";
    canvas.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:1;";
    // Insert before the Island so it renders behind it
    const root = document.getElementById("root") || document.body;
    root.insertBefore(canvas, root.firstChild);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // ─── RING MANAGEMENT ───
  function spawnRing(intensity) {
    const now = performance.now();
    if (now - lastSpawn < RING_SPAWN_INTERVAL) return;
    if (rings.length >= MAX_RINGS) return;
    lastSpawn = now;
    rings.push({
      born: now,
      intensity: Math.min(1, Math.max(0.3, intensity)),
      phase: Math.random() * Math.PI * 2
    });
  }

  // ─── ANIMATION LOOP ───
  function animate(now) {
    animId = requestAnimationFrame(animate);
    if (!ctx || !canvas) return;

    // Smooth color transition
    accentH += (targetH - accentH) * 0.04;
    accentS += (targetS - accentS) * 0.04;
    accentL += (targetL - accentL) * 0.04;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center = top-center where the Dynamic Island sits
    const cx = canvas.width / 2;
    const cy = 19; // pill center Y

    if (isPlaying) {
      // Spawn rings periodically
      spawnRing(0.6 + Math.sin(now * 0.003) * 0.3);

      // Draw rings
      const expired = [];
      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        const age = now - ring.born;
        if (age > RING_LIFETIME) { expired.push(i); continue; }

        const progress = age / RING_LIFETIME; // 0 → 1
        const eased = 1 - Math.pow(1 - progress, 2.5); // ease-out
        const radius = RING_START_RADIUS + (RING_MAX_RADIUS - RING_START_RADIUS) * eased;
        const alpha = (1 - progress) * 0.55 * ring.intensity;

        // Organic wobble
        const wobble = 1 + Math.sin(now * 0.004 + ring.phase) * 0.06;
        const rx = radius * wobble;
        const ry = radius * (2 - wobble) * 0.45; // flatten vertically

        const lineW = BASE_LINE_WIDTH * (1 - progress * 0.6);
        const hue = (accentH + progress * 15) % 360;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, ${Math.round(accentS)}%, ${Math.round(accentL)}%, ${alpha})`;
        ctx.lineWidth = lineW;
        ctx.stroke();

        // Inner glow ring
        if (alpha > 0.15) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, ${Math.round(accentS + 10)}%, ${Math.round(accentL + 15)}%, ${alpha * 0.4})`;
          ctx.lineWidth = lineW * 0.6;
          ctx.stroke();
        }
      }
      // Remove expired rings (iterate backwards)
      for (let i = expired.length - 1; i >= 0; i--) {
        rings.splice(expired[i], 1);
      }
    } else {
      // Idle: gentle ambient pulse
      rings = [];
      idlePhase += IDLE_PULSE_SPEED;
      const pulse = 0.5 + 0.5 * Math.sin(idlePhase);
      const alpha = 0.08 + pulse * 0.07;
      const radius = RING_START_RADIUS + pulse * 18;

      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${Math.round(accentH)}, ${Math.round(accentS)}%, ${Math.round(accentL)}%, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // ─── MEDIA STATE POLLING ───
  function pollMedia() {
    if (!window.electronAPI) {
      setTimeout(pollMedia, 500);
      return;
    }
    window.electronAPI.getSystemMedia().then(function (media) {
      if (media && media.state === "playing") {
        isPlaying = true;
        // Extract color from album art if available
        if (media.artwork_url) {
          extractDominantColor(media.artwork_url);
        }
      } else {
        isPlaying = false;
      }
    }).catch(function () {
      isPlaying = false;
    });
    setTimeout(pollMedia, 400); // poll every 400ms
  }

  // ─── INIT ───
  function init() {
    // Wait for DOM
    if (!document.body) {
      setTimeout(init, 50);
      return;
    }
    createCanvas();
    animId = requestAnimationFrame(animate);
    pollMedia();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
