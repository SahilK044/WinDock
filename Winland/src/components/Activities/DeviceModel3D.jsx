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
  // Each phone style has to be told apart at a glance, so they differ in the
  // direction they arrive from AND in what they keep doing afterwards — an
  // earlier pass gave them near-identical idles and they all looked the same.

  // Rises from below and settles, screen catching the light as it tilts.
  amoled: (s, t, e) => {
    const k = easeOutCubic(t);
    s.y = -1.15 + 1.15 * k;
    s.scale = 0.55 + 0.45 * k;
    s.rotY = Math.sin(e * 1.15) * 0.42 * t;
    s.rotX = 0.22 * (1 - k) + Math.sin(e * 0.85) * 0.09 * t;
  },
  // Flies in and snaps flat, then holds a tight magnetic quiver. It stops
  // short of the camera on purpose — driving z to 0 with an overshooting ease
  // pushed the phone through the near plane and it filled the whole frame.
  magsafe: (s, t, e) => {
    const snap = easeOutBack(clamp01(t * 1.15));
    s.z = -2.0 + 1.8 * snap;
    s.scale = 0.38 + 0.56 * snap;
    s.rotZ = (1 - snap) * -0.45 + (t >= 1 ? Math.sin(e * 30) * 0.014 : 0);
    s.rotY = (1 - snap) * 0.6;
  },
  // Never stops turning: a full vertical showcase rotation.
  showcase: (s, t, e) => {
    const k = easeOutCubic(t);
    s.scale = 0.5 + 0.5 * k;
    s.rotY = e * 2.0;
    s.y = Math.sin(e * 1.1) * 0.05 * t;
  },
  // Comes from far away and keeps drifting through depth.
  depth: (s, t, e) => {
    const k = easeOutCubic(t);
    s.z = -3.4 + 3.4 * k;
    s.scale = 0.32 + 0.68 * k;
    s.z += Math.sin(e * 0.75) * 0.5 * t;
    s.y = Math.sin(e * 0.95) * 0.10 * t;
    s.rotY = Math.sin(e * 0.6) * 0.5 * t;
  },
  // Unfolds through a half turn like a hinge, then rocks around it.
  hinge: (s, t, e) => {
    const open = easeOutCubic(t);
    s.rotY = -Math.PI * (1 - open) + Math.sin(e * 1.05) * 0.38 * t;
    s.scale = 0.55 + 0.45 * open;
    s.y = Math.sin(e * 0.9) * 0.06 * t;
  },

  // ── Controllers ─────────────────────────────────────────────────────────
  levitate: (s, t, e) => {
    const k = easeOutCubic(t);
    s.y = -0.95 + 0.95 * k + Math.sin(e * 1.6) * 0.11 * t;
    s.scale = 0.5 + 0.5 * k;
    s.rotY = Math.sin(e * 0.95) * 0.5 * t;
    s.rotZ = Math.sin(e * 24) * 0.012 * t; // haptic rumble
  },
  'flip-trigger': (s, t, e) => {
    const k = easeOutCubic(clamp01(t * 1.05));
    s.scale = 0.45 + 0.55 * easeOutCubic(t);
    s.rotX = Math.PI * 2 * k;
    s.y = Math.sin(e * 1.4) * 0.09 * t;
    s.rotY = Math.sin(e * 0.85) * 0.35 * t;
  },

  // ── Speakers ────────────────────────────────────────────────────────────
  wave: (s, t, e) => {
    const k = easeOutCubic(t);
    s.scale = 0.5 + 0.5 * k;
    s.x = Math.sin(e * 1.7) * 0.30 * t;
    s.rotY = Math.sin(e * 1.7) * 0.42 * t;
    s.y = -0.7 + 0.7 * k;
  },
  panoramic: (s, t, e) => {
    const k = easeOutCubic(t);
    s.scale = 0.5 + 0.5 * k;
    s.rotY = e * 1.7;
    s.y = -0.7 + 0.7 * k;
  },
  bass: (s, t, e) => {
    const k = easeOutCubic(t);
    const thump = Math.pow(Math.abs(Math.sin(e * 2.6)), 4);
    s.scale = (0.5 + 0.5 * k) * (1 + thump * 0.20 * t);
    s.y = -0.7 + 0.7 * k - thump * 0.06 * t;
    s.rotY = Math.sin(e * 0.5) * 0.28 * t;
  },

  // ── Headphones ──────────────────────────────────────────────────────────
  spin: (s, t, e) => {
    const k = easeOutCubic(t);
    s.y = -0.95 + 0.95 * k + Math.sin(e * 1.25) * 0.07 * t;
    s.scale = 0.45 + 0.55 * k;
    s.rotY = e * 1.9;
  },
  expand: (s, t, e) => {
    const k = easeOutCubic(t);
    const breathe = 1 + Math.sin(e * 1.9) * 0.13 * t;
    s.scale = (0.45 + 0.55 * k) * breathe;
    s.rotY = Math.sin(e * 0.95) * 0.62 * t;
    s.y = -0.8 + 0.8 * k;
  },

  // ── Earbuds ─────────────────────────────────────────────────────────────
  // Both also drive the case rig; see EARBUD_OPEN below.
  'case-dock': (s, t, e) => {
    const k = easeOutCubic(t);
    s.y = -0.85 + 0.85 * k;
    s.scale = 0.55 + 0.45 * k;
    s.rotY = Math.sin(e * 0.75) * 0.30 * t;
  },
  float: (s, t, e) => {
    const k = easeOutCubic(t);
    s.y = -0.85 + 0.85 * k + Math.sin(e * 1.45) * 0.10 * t;
    s.scale = 0.55 + 0.45 * k;
    s.rotY = Math.sin(e * 0.9) * 0.45 * t;
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
      if (loop && !isDisconnected && elapsed > CYCLE) elapsed = 0;

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
          motion(pose, t, elapsed);

          const openDrop = category === 'earbud' ? openProgress * rig.openNudgeY : 0;
          master.position.set(pose.x, rig.initialYPos + pose.y - openDrop, pose.z);
          master.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
          master.scale.setScalar(Math.max(0.01, pose.scale) * fit);
          master.visible = true;

          // Earbud cases additionally open their lid and lift the buds.
          if (category === 'earbud' && rig.lidNode) {
            const target = (EARBUD_OPEN[styleKey] ?? 1) * clamp01(t * 1.2);
            openProgress += (target - openProgress) * Math.min(dt * 3.0, 1);
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
        }
      }
      renderer.render(scene, camera);
    };
    animateLoop();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      // Geometry/materials belong to the shared cache — see deviceModelEngine.
      disposeEnv();
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(canvas)) container.removeChild(canvas);
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
