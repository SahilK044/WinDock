import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  GLB_MODEL_MAP, loadSharedModel, prepareDeviceModel, addStudioLights,
} from '../../three/deviceModelEngine';

/**
 * Renders the user's chosen real 3D device inside the Dynamic Island's
 * connect / disconnect notification.
 *
 * The motion is driven by the animation style picked in Settings, so those
 * options actually change what is shown rather than only being stored. Each
 * style defines an entry path (or exit, when disconnecting) plus an idle
 * behaviour; `MOTION` below is the whole vocabulary in one place.
 */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/**
 * Each style gets (state, t, elapsed) and mutates `state` — a plain pose the
 * caller applies to the model. `t` is 0..1 entry progress, `elapsed` is seconds
 * since mount, so styles can settle into a continuous idle once t hits 1.
 */
const MOTION = {
  // ── Phones ──────────────────────────────────────────────────────────────
  amoled: (s, t, e, loop) => {
    if (loop) {
      const cyc = e % 3.0;
      const k = easeOutCubic(clamp01(cyc / 0.8));
      s.y = -1.15 + 1.15 * k + Math.sin(e * 2.2) * 0.08;
      s.scale = 0.55 + 0.45 * k;
      s.rotY = Math.sin(e * 1.5) * 0.45;
      s.rotX = Math.sin(e * 1.8) * 0.22;
    } else {
      const k = easeOutCubic(t);
      s.y = -1.15 + 1.15 * k;
      s.scale = 0.55 + 0.45 * k;
      s.rotY = Math.sin(e * 1.15) * 0.42 * t;
      s.rotX = 0.22 * (1 - k) + Math.sin(e * 0.85) * 0.09 * t;
    }
  },

  magsafe: (s, t, e, loop) => {
    if (loop) {
      const cyc = e % 2.5;
      const snap = easeOutBack(clamp01(cyc / 0.7));
      s.z = -2.2 + 2.0 * snap + Math.sin(e * 3.0) * 0.1;
      s.scale = 0.38 + 0.56 * snap;
      s.rotZ = (1 - snap) * -0.45 + Math.sin(e * 28) * 0.02;
      s.rotY = (1 - snap) * 0.6 + Math.sin(e * 1.5) * 0.15;
    } else {
      const snap = easeOutBack(clamp01(t * 1.15));
      s.z = -2.0 + 1.8 * snap;
      s.scale = 0.38 + 0.56 * snap;
      s.rotZ = (1 - snap) * -0.45 + (t >= 1 ? Math.sin(e * 30) * 0.014 : 0);
      s.rotY = (1 - snap) * 0.6;
    }
  },

  showcase: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    s.scale = 0.5 + 0.5 * k;
    s.rotY = e * 2.2;
    s.y = Math.sin(e * 1.5) * 0.12;
    s.rotX = Math.sin(e * 1.0) * 0.10;
  },

  depth: (s, t, e, loop) => {
    if (loop) {
      s.z = -1.2 + Math.sin(e * 1.8) * 1.2;
      s.scale = 0.65 + Math.sin(e * 1.8) * 0.25;
      s.y = Math.sin(e * 1.4) * 0.18;
      s.rotY = Math.sin(e * 1.2) * 0.55;
    } else {
      const k = easeOutCubic(t);
      s.z = -3.4 + 3.4 * k + Math.sin(e * 0.75) * 0.5 * t;
      s.scale = 0.32 + 0.68 * k;
      s.y = Math.sin(e * 0.95) * 0.10 * t;
      s.rotY = Math.sin(e * 0.6) * 0.5 * t;
    }
  },

  hinge: (s, t, e, loop) => {
    if (loop) {
      const open = 0.5 + 0.5 * Math.sin(e * 1.8);
      s.rotY = -Math.PI * (1 - open) * 0.5 + Math.sin(e * 1.2) * 0.35;
      s.scale = 0.75 + 0.25 * open;
      s.y = Math.sin(e * 1.5) * 0.12;
      s.rotX = Math.sin(e * 1.0) * 0.15;
    } else {
      const open = easeOutCubic(t);
      s.rotY = -Math.PI * (1 - open) + Math.sin(e * 1.05) * 0.38 * t;
      s.scale = 0.55 + 0.45 * open;
      s.y = Math.sin(e * 0.9) * 0.06 * t;
    }
  },

  // ── Controllers ─────────────────────────────────────────────────────────
  levitate: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    s.y = (loop ? 0 : -0.95 + 0.95 * k) + Math.sin(e * 1.8) * 0.15;
    s.scale = 0.5 + 0.5 * k;
    s.rotY = Math.sin(e * 1.2) * 0.55;
    s.rotZ = Math.sin(e * 24) * 0.015;
  },

  'flip-trigger': (s, t, e, loop) => {
    if (loop) {
      s.scale = 0.85;
      s.rotX = e * 3.0;
      s.y = Math.sin(e * 1.8) * 0.12;
      s.rotY = Math.sin(e * 1.2) * 0.4;
    } else {
      const k = easeOutCubic(clamp01(t * 1.05));
      s.scale = 0.45 + 0.55 * easeOutCubic(t);
      s.rotX = Math.PI * 2 * k;
      s.y = Math.sin(e * 1.4) * 0.09 * t;
      s.rotY = Math.sin(e * 0.85) * 0.35 * t;
    }
  },

  // ── Speakers ────────────────────────────────────────────────────────────
  wave: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    s.scale = 0.5 + 0.5 * k;
    s.x = Math.sin(e * 2.2) * 0.35;
    s.rotY = Math.sin(e * 2.2) * 0.45;
    s.y = (loop ? 0 : -0.7 + 0.7 * k) + Math.sin(e * 1.5) * 0.08;
  },

  panoramic: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    s.scale = 0.5 + 0.5 * k;
    s.rotY = e * 2.2;
    s.y = (loop ? 0 : -0.7 + 0.7 * k) + Math.sin(e * 1.2) * 0.06;
  },

  bass: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    const thump = Math.pow(Math.abs(Math.sin(e * 3.2)), 4);
    s.scale = (0.5 + 0.5 * k) * (1 + thump * 0.25);
    s.y = (loop ? 0 : -0.7 + 0.7 * k) - thump * 0.08;
    s.rotY = Math.sin(e * 0.8) * 0.35;
  },

  // ── Headphones ──────────────────────────────────────────────────────────
  spin: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    s.y = (loop ? 0 : -0.95 + 0.95 * k) + Math.sin(e * 1.6) * 0.10;
    s.scale = 0.45 + 0.55 * k;
    s.rotY = e * 2.4;
  },

  expand: (s, t, e, loop) => {
    const k = loop ? 1 : easeOutCubic(t);
    const breathe = 1 + Math.sin(e * 2.2) * 0.16;
    s.scale = (0.45 + 0.55 * k) * breathe;
    s.rotY = Math.sin(e * 1.2) * 0.65;
    s.y = (loop ? 0 : -0.8 + 0.8 * k) + Math.sin(e * 1.5) * 0.08;
  },

  // ── Earbuds ─────────────────────────────────────────────────────────────
  'case-dock': (s, t, e, loop) => {
    if (loop) {
      s.scale = 0.85;
      s.rotY = Math.sin(e * 1.2) * 0.35;
      s.y = Math.sin(e * 1.5) * 0.08;
    } else {
      const k = easeOutCubic(t);
      s.y = -0.85 + 0.85 * k;
      s.scale = 0.55 + 0.45 * k;
      s.rotY = Math.sin(e * 0.75) * 0.30 * t;
    }
  },

  float: (s, t, e, loop) => {
    if (loop) {
      s.scale = 0.85;
      s.y = Math.sin(e * 0.9) * 0.03; // calm, subtle breathing hover for case
      s.rotY = Math.sin(e * 0.3) * 0.02; // almost still (no case spinning)
      s.rotX = 0.06; // subtle forward tilt to display interior
    } else {
      const k = easeOutCubic(t);
      s.y = -0.85 + 0.85 * k + Math.sin(e * 0.9) * 0.03 * t;
      s.scale = 0.55 + 0.45 * k;
      s.rotY = Math.sin(e * 0.3) * 0.02 * t;
      s.rotX = 0.06 * k;
    }
  },
};

// Which styles want the case open with the buds out, and how fast.
const EARBUD_OPEN = { 'case-dock': 1, float: 1 };

export const DEFAULT_STYLE_BY_CATEGORY = {
  phone: 'amoled',
  controller: 'levitate',
  speaker: 'wave',
  headphones: 'spin',
  earbuds: 'case-dock',
};

export default function DeviceModel3D({
  modelId,
  category = 'phone',          // engine category: phone | earbud | headphone | controller | speaker
  styleCategory = 'phone',     // key into ANIMATION_STYLES / DEFAULT_STYLE_BY_CATEGORY
  animStyle,
  size = 44,
  isDisconnected = false,
  // Preview use: replay the entry on a cycle instead of settling into idle
  // forever, and pull the model in so wide motions stay inside the frame.
  loop = false,
  fit = 1,
}) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !GLB_MODEL_MAP[modelId]) { setFailed(true); return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4.1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true, powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;

    const canvas = renderer.domElement;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const disposeEnv = addStudioLights(scene, renderer);
    const master = new THREE.Group();
    scene.add(master);

    let disposed = false;
    let rig = null;
    let animId;
    const clock = new THREE.Clock();
    let elapsed = 0;
    let openProgress = isDisconnected ? 1 : 0;

    const styleKey =
      (animStyle && MOTION[animStyle] && animStyle) ||
      DEFAULT_STYLE_BY_CATEGORY[styleCategory] ||
      'amoled';
    const motion = MOTION[styleKey] || MOTION.amoled;

    loadSharedModel(modelId).then(
      (gltf) => {
        if (disposed) return;
        rig = prepareDeviceModel(gltf, { modelId, category });
        if (isDisconnected && category === 'earbud' && rig.lidNode) {
          rig.lidNode.rotation.x = rig.lidAuthoredOpen ? 0 : rig.lidOpenSign * rig.lidOpenAngle;
        }
        master.add(rig.root);
        clock.start();
        elapsed = 0;
        openProgress = isDisconnected ? 1 : 0;
      },
      (err) => { console.warn('island model failed:', modelId, err); setFailed(true); }
    );

    const ENTRY_SECONDS = 0.85;
    const HOLD_SECONDS = 2.6;   // time to admire the settled pose before replay
    const CYCLE = ENTRY_SECONDS + HOLD_SECONDS;

    const animateLoop = () => {
      animId = requestAnimationFrame(animateLoop);
      const dt = Math.min(clock.getDelta(), 0.05); // ignore frame-hitch spikes
      elapsed += dt;
      // Only loop previews if explicit loop prop is passed (e.g. settings card hover)
      if (loop && !isDisconnected && elapsed > CYCLE) {
        elapsed = 0;
        openProgress = 0;
      }

      if (rig) {
        if (isDisconnected) {
          // Cinematic 4.0s Earbud & Device Disconnection Sequence:
          // 0.0s - 1.2s: Earbuds float down & dock into case slots
          // 1.2s - 2.2s: Case lid rotates shut smoothly
          // 2.2s - 4.0s: Closed case tilts, showcases profile, and glides down into depth

          const pose = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 };

          // Phase 3: Showcase Tilt & Withdrawal (2.2s - 4.0s)
          if (elapsed >= 2.2) {
            const dropT = easeOutCubic(clamp01((elapsed - 2.2) / 1.5));
            pose.y = -1.8 * dropT;
            pose.rotX = -0.32 * dropT;
            pose.rotY = 0.45 * dropT;
            pose.scale = 1 - 0.5 * dropT;
          } else {
            pose.y = 0;
            pose.scale = 1;
          }

          master.position.set(pose.x, rig.initialYPos + pose.y, pose.z);
          master.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
          master.scale.setScalar(Math.max(0.01, pose.scale) * fit);
          master.visible = elapsed < 3.8;

          if (category === 'earbud' && rig.lidNode) {
            let targetProgress = 1;
            if (elapsed < 1.2) {
              // Phase 1: Earbuds dock down (1 -> 0.5 openProgress)
              const budT = easeOutCubic(clamp01(elapsed / 1.2));
              targetProgress = 1 - 0.5 * budT;
            } else if (elapsed < 2.2) {
              // Phase 2: Lid closes smoothly (0.5 -> 0.0 openProgress)
              const lidT = easeOutCubic(clamp01((elapsed - 1.2) / 1.0));
              targetProgress = 0.5 * (1 - lidT);
            } else {
              targetProgress = 0;
            }

            openProgress += (targetProgress - openProgress) * Math.min(dt * 4.0, 1);

            rig.lidNode.rotation.x = rig.lidAuthoredOpen
              ? THREE.MathUtils.lerp(rig.lidClosedAngle, 0, openProgress)
              : rig.lidOpenSign * rig.lidOpenAngle * openProgress;

            const cfg = rig.config;
            const riseKey = cfg.riseAxis || 'y';
            const secKey = cfg.secondaryAxis || 'z';
            const secSign = cfg.secondarySign ?? 1;
            const bt = clamp01((openProgress - 0.22) / 0.78);
            const budEase = bt < 0.5 ? 4 * bt * bt * bt : 1 - Math.pow(-2 * bt + 2, 3) / 2;
            const budPop = cfg.budsAuthoredOut ? budEase - 1 : budEase;

            for (const [node, iy, iz, tilt] of [
              [rig.budLeftNode, rig.budLeftInitialY, rig.budLeftInitialZ, 0.12],
              [rig.budRightNode, rig.budRightInitialY, rig.budRightInitialZ, -0.12],
            ]) {
              if (!node) continue;
              node.visible = openProgress > 0.035;
              node.position[riseKey] = (riseKey === 'y' ? iy : iz) + budPop * rig.budRise;
              node.position[secKey] =
                (secKey === 'y' ? iy : iz) + budPop * rig.budRise * 0.25 * secSign;
              node.rotation.z = tilt * openProgress;
            }
          }
        } else {
          // Standard Connection Motion
          const raw = clamp01(elapsed / ENTRY_SECONDS);
          const t = raw;

          const pose = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 };
          motion(pose, t, elapsed, loop);

          const openDrop = category === 'earbud' ? openProgress * rig.openNudgeY : 0;
          master.position.set(pose.x, rig.initialYPos + pose.y - openDrop, pose.z);
          master.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
          master.scale.setScalar(Math.max(0.01, pose.scale) * fit);
          master.visible = true;

          // Earbud cases additionally open their lid and lift the buds.
          if (category === 'earbud' && rig.lidNode) {
            let targetOpen = 1;
            let budWaveY = 0;
            let budWaveZ = 0;

            let leftSpin = 0;
            let rightSpin = 0;
            let floatProgress = 0;

            if (styleKey === 'case-dock') {
              if (loop && !isDisconnected) {
                // Lid Flip & Earbud Docking Sequence (3.2s cycle)
                // 0.0s - 0.8s: Lid flips open, earbuds remain seated in docking slots
                // 0.8s - 1.8s: Case tilts to showcase docked earbuds inside
                // 1.8s - 2.6s: Earbuds click into slots and lid flips shut
                // 2.6s - 3.2s: Closed case rests before replaying
                const cycleTime = elapsed % 3.2;
                if (cycleTime < 0.8) {
                  targetOpen = easeOutCubic(cycleTime / 0.8);
                } else if (cycleTime < 1.8) {
                  targetOpen = 1.0;
                  budWaveY = Math.sin((cycleTime - 0.8) * 3.5) * 0.015;
                } else if (cycleTime < 2.6) {
                  targetOpen = 1.0 - easeOutCubic((cycleTime - 1.8) / 0.8);
                } else {
                  targetOpen = 0.0;
                }
              } else {
                targetOpen = clamp01(t * 1.2);
              }
            } else if (styleKey === 'float') {
              if (loop && !isDisconnected) {
                // 4.6s Full Cycle:
                // 0.0s - 1.2s: Smooth rise out of case slots (Lid opens 0->1, Earbuds float up 0->1)
                // 1.2s - 3.2s: Mid-air levitation & slow 3D Y-axis spins (Lid open=1, Earbuds float=1)
                // 3.2s - 4.4s: Smooth glide back into case slots & lid closes shut (Lid 1->0, Earbuds 1->0)
                // 4.4s - 4.6s: Rest closed before next cycle
                const cycleTime = elapsed % 4.6;
                if (cycleTime < 1.2) {
                  const progress = easeInOutCubic(cycleTime / 1.2);
                  targetOpen = progress;
                  floatProgress = progress;
                  leftSpin = progress * 0.3;
                  rightSpin = -progress * 0.3;
                } else if (cycleTime < 3.2) {
                  targetOpen = 1.0;
                  floatProgress = 1.0;
                  const spinT = cycleTime - 1.2;
                  leftSpin = 0.3 + spinT * 0.75;
                  rightSpin = -(0.3 + spinT * 0.75);
                  budWaveY = Math.sin(spinT * 1.2) * 0.04;
                  budWaveZ = Math.cos(spinT * 1.0) * 0.02;
                } else if (cycleTime < 4.4) {
                  const returnT = easeInOutCubic((cycleTime - 3.2) / 1.2);
                  targetOpen = 1.0 - returnT;
                  floatProgress = 1.0 - returnT;
                  leftSpin = (1.0 - returnT) * (0.3 + 2.0 * 0.75);
                  rightSpin = -(1.0 - returnT) * (0.3 + 2.0 * 0.75);
                } else {
                  targetOpen = 0.0;
                  floatProgress = 0.0;
                  leftSpin = 0.0;
                  rightSpin = 0.0;
                }
              } else {
                targetOpen = clamp01(t * 1.2);
                floatProgress = clamp01(t * 1.2);
                if (t >= 1) {
                  leftSpin = elapsed * 0.75;
                  rightSpin = -elapsed * 0.75;
                  budWaveY = Math.sin(elapsed * 1.2) * 0.04;
                }
              }
            }

            openProgress += (targetOpen - openProgress) * Math.min(dt * 12.0, 1);

            rig.lidNode.rotation.x = rig.lidAuthoredOpen
              ? THREE.MathUtils.lerp(rig.lidClosedAngle, 0, openProgress)
              : rig.lidOpenSign * rig.lidOpenAngle * openProgress;

            const cfg = rig.config;
            const riseKey = cfg.riseAxis || 'y';
            const secKey = cfg.secondaryAxis || 'z';
            const secSign = cfg.secondarySign ?? 1;
            const bt = clamp01((openProgress - 0.22) / 0.78);
            const budEase = bt < 0.5 ? 4 * bt * bt * bt : 1 - Math.pow(-2 * bt + 2, 3) / 2;
            const budPop = cfg.budsAuthoredOut ? budEase - 1 : budEase;

            const isFloatStyle = styleKey === 'float';
            const floatMult = isFloatStyle ? (loop ? floatProgress * 2.2 : 2.2) : 0.12;

            const leftWaveY = budWaveY;
            const rightWaveY = isFloatStyle ? -budWaveY : budWaveY * 0.5;

            for (const [node, iy, iz, tilt, waveY, spinAngle] of [
              [rig.budLeftNode, rig.budLeftInitialY, rig.budLeftInitialZ, 0.12, leftWaveY, leftSpin],
              [rig.budRightNode, rig.budRightInitialY, rig.budRightInitialZ, -0.12, rightWaveY, rightSpin],
            ]) {
              if (!node) continue;
              node.visible = isFloatStyle ? floatProgress > 0.001 : openProgress > 0.035;
              const earbudRise = isFloatStyle ? floatMult * rig.budRise : budPop * rig.budRise * floatMult;
              node.position[riseKey] = (riseKey === 'y' ? iy : iz) + earbudRise + waveY;
              node.position[secKey] =
                (secKey === 'y' ? iy : iz) + earbudRise * 0.15 * secSign + budWaveZ;
              node.rotation.z = tilt * (isFloatStyle ? floatProgress : openProgress) + (isFloatStyle ? Math.sin(elapsed * 1.5) * 0.08 : 0);
              if (isFloatStyle) {
                node.rotation.y = spinAngle;
              }
            }
          }
        }
      }
      renderer.render(scene, camera);
    };
    animateLoop();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      scene.traverse((child) => {
        if (child.isMesh && child.material && child.material.__isCloned) {
          child.material.dispose();
        }
      });
      disposeEnv();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [modelId, category, styleCategory, animStyle, size, isDisconnected, loop, fit]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      style={{
        width: size, height: size, display: 'flex',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}
    />
  );
}
