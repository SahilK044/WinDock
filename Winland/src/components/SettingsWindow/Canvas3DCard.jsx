import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  GLB_MODEL_MAP, MODEL_CONFIGS, SPIN_MODELS,
  loadSharedModel, prepareDeviceModel, addStudioLights,
} from '../../three/deviceModelEngine';

// Re-exported for existing importers; the registry itself lives in the engine.
export { GLB_MODEL_MAP };

/**
 * High-DPI Three.js 3D WebGL Renderer for WinLand Cards
 */
export default function Canvas3DCard({
  modelId,
  category = 'phone',
  formFactor,
  brand,
  colorHex = '#3a3a3c',
  isSelected,
  isHovered,
  isActivated = false,
}) {
  const containerRef = useRef(null);
  const hoverRef     = useRef(isHovered);
  const selectRef    = useRef(isSelected);
  const activateRef  = useRef(isActivated);
  const invalidateRef = useRef(null);
  hoverRef.current   = isHovered;
  selectRef.current  = isSelected;
  activateRef.current = isActivated;

  useEffect(() => {
    invalidateRef.current?.();
  }, [isHovered, isSelected, isActivated]);

  // Don't build a WebGL scene or fetch an asset until the card is actually on
  // screen. A tab like Smartphones holds a dozen cards, and eagerly starting
  // all of them meant a dozen contexts and a dozen model decodes competing the
  // instant Settings opened â€” the stall when the window appeared.
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setIsVisible(true); return; }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect(); // once shown, keep it alive for the tab's lifetime
        }
      },
      { root: null, rootMargin: '200px' } // warm up just before scrolling into view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isVisible) return;

    // â”€â”€ 1. WebGL Scene & Camera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(220, 240, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;

    const canvas = renderer.domElement;
    canvas.style.width   = '110px';
    canvas.style.height  = '120px';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    // â”€â”€ 2. Natural Studio Lighting Rig â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const disposeEnv = addStudioLights(scene, renderer);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const config = MODEL_CONFIGS[modelId] || { baseRotY: 0, baseRotX: 0, scaleFactor: 1.6 };
    let isDisposed = false;
    const isSpin = SPIN_MODELS.has(modelId);

    // Spin offset applied to masterGroup â€” starts at 0 because loadedModel
    // already holds baseRotY (see the delta-only note in the render loop).
    let spinY = 0;
    const glbUrl = GLB_MODEL_MAP[modelId];

    let loadedModel = null;
    let loadFailed = false;
    let initialYPos = 0;

    // Sub-node references for GLB earbud animations
    let lidNode = null;
    let budLeftNode = null;
    let budRightNode = null;
    let budLeftInitialX = 0;
    let budLeftInitialY = 0;
    let budLeftInitialZ = 0;
    let budRightInitialX = 0;
    let budRightInitialY = 0;
    let budRightInitialZ = 0;
    let budRise = 1;        // proportional bud emergence (set after auto-fit)
    let openNudgeY = 0;     // per-model framing offset for the open pose
    let lidClosedAngle = 0; // solved hinge angle that shuts an authored-open case
    // The lid is hinged at its back-bottom edge, so a NEGATIVE rotation lifts
    // the front edge up and swings it backwards â€” the direction a real case
    // opens. (A positive one drives the front edge down through the base, which
    // reads as the whole cap flipping under the case.)
    //
    // How FAR it swings is per-model, because it has to clear the earbuds as
    // they rise: 70Â° leaves the Galaxy lid standing upright directly in front
    // of its buds, so that case opens past vertical to lean back out of the way.
    const lidOpenSign = config.lidOpenSign ?? -1;
    const lidOpenAngle = config.lidOpenAngle ?? 1.22;
    const lidAuthoredOpen = !!config.lidAuthoredOpen;

    // Earbud cases (AirPods Pro & Galaxy Buds) are loaded as single real GLBs
    // whose named lid/bud nodes are animated directly â€” see the loader callback
    // below (no procedural/placeholder geometry is used).

    if (glbUrl) {
      loadSharedModel(modelId).then(
        (gltf) => {
          if (isDisposed) return;
          // Only phones take the finish: the earbud cases and AirPods Max
          // carry deliberate fixed finishes that a tint would overwrite.
          const rig = prepareDeviceModel(gltf, {
            modelId, category,
            tintHex: category === 'phone' ? colorHex : undefined,
          });
          loadedModel   = rig.root;
          initialYPos   = rig.initialYPos;
          budRise       = rig.budRise;
          openNudgeY    = rig.openNudgeY;
          lidClosedAngle = rig.lidClosedAngle;
          lidNode       = rig.lidNode;
          budLeftNode   = rig.budLeftNode;
          budRightNode  = rig.budRightNode;
          budLeftInitialX  = rig.budLeftInitialX;
          budLeftInitialY  = rig.budLeftInitialY;
          budLeftInitialZ  = rig.budLeftInitialZ;
          budRightInitialX = rig.budRightInitialX;
          budRightInitialY = rig.budRightInitialY;
          budRightInitialZ = rig.budRightInitialZ;
          masterGroup.add(loadedModel);
        },
        (err) => {
          loadFailed = true;
          console.warn('GLB load failed:', modelId, err);
        }
      );
    }

    // â”€â”€ 3. Smooth Continuous Physics Loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let animId = null;
    const clock = new THREE.Clock();
    let hoverProgress = 0;
    let openProgress = 0;
    let hasRenderedLoadedModel = false;

    const needsMoreFrames = () => {
      if (!loadedModel) return !loadFailed;
      if (!hasRenderedLoadedModel) return true;
      if (hoverRef.current || activateRef.current) return true;
      if (Math.abs(hoverProgress) > 0.002 || Math.abs(openProgress) > 0.002) return true;
      if (Math.abs(masterGroup.position.y) > 0.002) return true;
      if (Math.abs(masterGroup.rotation.x) > 0.002 || Math.abs(masterGroup.rotation.y) > 0.002) return true;
      return false;
    };

    const requestRender = () => {
      if (animId == null) animId = requestAnimationFrame(renderLoop);
    };

    const renderLoop = () => {
      animId = null;
      const dt = clock.getDelta();
      const isHov = hoverRef.current;
      const isActive = activateRef.current;
      // NOTE: masterGroup is the PARENT of loadedModel, and loadedModel already
      // carries this model's base rotation (baseRotX/baseRotY, applied once
      // after auto-fit). Anything set on masterGroup STACKS on top of that, so
      // every branch below must contribute only the animated *delta* â€” never
      // baseX/baseY again, which would double the base rotation.
      if (isSpin) {
        if (isHov) {
          spinY += dt * 0.65;
        }
        masterGroup.rotation.y = spinY;
        masterGroup.rotation.x = THREE.MathUtils.lerp(
          masterGroup.rotation.x,
          isHov ? Math.sin(spinY * 0.5) * 0.08 : 0,
          0.06
        );
      } else if (category === 'earbud') {
        // â”€â”€ State Machine: â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 1. Hover only: the closed case levitates.
        // 2. Click while hovered: the lid opens and both earbuds rise together.
        // 3. Pointer leaves: the buds dock and the case closes, ready for the next hover.
        const targetHover = isHov ? 1.0 : 0.0;
        const targetOpen = isHov && isActive ? 1.0 : 0.0;

        // Clamp the smoothing factor to [0,1]. dt is unbounded â€” a dropped
        // frame, GC pause, or a backgrounded/offscreen window makes dt*5 exceed
        // 1, and lerp() with t > 1 EXTRAPOLATES instead of easing, so a single
        // slow frame sent these progress values far past 1 (measured ~44) and
        // launched the whole case out of view.
        const ease = Math.min(dt * 5.0, 1);
        hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, ease);
        // The buds trail the lid rather than racing it: opening eases in at
        // roughly half speed so the lid is already swinging up before they
        // start to climb, which reads as a pop-out instead of everything
        // snapping at once. Closing stays quick so the case tucks away.
        openProgress = THREE.MathUtils.lerp(
          openProgress,
          targetOpen,
          targetOpen > openProgress ? Math.min(dt * 2.6, 1) : ease
        );

        // Sub-Node Animations (Lid Opens & Earphones Emerge Together ONLY when Selected)
        if (lidNode) {
          // lidNode is a hinge-pivot group placed at the lid's back-bottom edge,
          // so this rotation swings the lid open upward & backward smoothly.
          // A case authored open swings from its solved shut angle back to
          // the pose the artist left it in; everything else swings from shut
          // to the configured open angle.
          lidNode.rotation.x = lidAuthoredOpen
            ? THREE.MathUtils.lerp(lidClosedAngle, 0, openProgress)
            : lidOpenSign * lidOpenAngle * openProgress;
        }

        // The buds wait for the lid to crack open, then climb out over the rest
        // of the animation on a smooth accelerate/decelerate curve. Spreading
        // the travel across the whole range is the point: an ease-OUT curve
        // here put the buds ~55% of the way out by 15% progress, so they read
        // as teleporting to the top the instant the case was clicked.
        const budT = THREE.MathUtils.clamp((openProgress - 0.22) / 0.78, 0, 1);
        const budEase = budT < 0.5
          ? 4 * budT * budT * budT
          : 1 - Math.pow(-2 * budT + 2, 3) / 2;
        // Offset applied to the buds' authored position: models posed with the
        // buds already out travel from -budRise (tucked inside) up to 0, the
        // rest from 0 up to +budRise. Either way they end where they belong and
        // are never simply switched on at their final spot.
        const budPop = config.budsAuthoredOut ? budEase - 1 : budEase;
        // Which local axis is "up" (rise) vs the small forward/back nudge
        // differs per GLB's own authoring convention â€” see MODEL_CONFIGS.
        const riseAxisKey = config.riseAxis || 'y';
        const secondaryAxisKey = config.secondaryAxis || 'z';
        const secondarySign = config.secondarySign ?? 1;

        if (budLeftNode) {
          budLeftNode.visible = openProgress > 0.035;
          budLeftNode.position.x = budLeftInitialX;
          const leftRiseBase = riseAxisKey === 'y' ? budLeftInitialY : budLeftInitialZ;
          const leftSecondaryBase = secondaryAxisKey === 'y' ? budLeftInitialY : budLeftInitialZ;
          budLeftNode.position[riseAxisKey] = leftRiseBase + budPop * budRise;
          budLeftNode.position[secondaryAxisKey] = leftSecondaryBase + budPop * budRise * 0.25 * secondarySign;
          budLeftNode.rotation.set(0, 0, THREE.MathUtils.lerp(0, 0.12, openProgress));
          if (config.splitBuds) {
            budLeftNode.position.x = budLeftInitialX - openProgress * 3;
            budLeftNode.position.y = budLeftInitialY + openProgress * 4;
            budLeftNode.position.z = budLeftInitialZ + openProgress * 18;
            budLeftNode.rotation.set(openProgress * THREE.MathUtils.degToRad(25), -openProgress * THREE.MathUtils.degToRad(15), 0);
          }
        }
        if (budRightNode) {
          budRightNode.visible = openProgress > 0.035;
          budRightNode.position.x = budRightInitialX;
          const rightRiseBase = riseAxisKey === 'y' ? budRightInitialY : budRightInitialZ;
          const rightSecondaryBase = secondaryAxisKey === 'y' ? budRightInitialY : budRightInitialZ;
          budRightNode.position[riseAxisKey] = rightRiseBase + budPop * budRise;
          budRightNode.position[secondaryAxisKey] = rightSecondaryBase + budPop * budRise * 0.25 * secondarySign;
          budRightNode.rotation.set(0, 0, THREE.MathUtils.lerp(0, -0.12, openProgress));
          if (config.splitBuds) {
            budRightNode.position.x = budRightInitialX + openProgress * 3;
            budRightNode.position.y = budRightInitialY + openProgress * 4;
            budRightNode.position.z = budRightInitialZ + openProgress * 18;
            budRightNode.rotation.set(openProgress * THREE.MathUtils.degToRad(25), openProgress * THREE.MathUtils.degToRad(15), 0);
          }
        }

        // Whole 3D Model Floating Motion (Floats on Hover, Perspective Tilt on Select)
        // NOTE: loadedModel already carries the model's base rotation (baseRotX/
        // baseRotY, set once after auto-fit). masterGroup is its PARENT, so any
        // rotation put here STACKS on top of that base. It must therefore hold
        // only the animated *delta* (hover wobble + select tilt) â€” never baseX/
        // baseY again. Re-adding the base here double-rotated the model: for
        // AirPods (baseRotX 0) that was invisibly harmless, but for the Z-up
        // Galaxy Buds (baseRotX â‰ˆ -90Â°) it flipped the whole case ~180Â°, so the
        // lid hinged downward out of frame and the buds "rose" downward instead
        // of popping up.
        if (loadedModel) {
          const targetY = initialYPos + hoverProgress * 0.12;
          const targetRotX = -openProgress * 0.20;
          const targetRotY = isHov ? Math.sin(clock.elapsedTime * 2.2) * 0.28 : 0;

          loadedModel.position.y = THREE.MathUtils.lerp(loadedModel.position.y, targetY, 0.08);
          // Sink the case as it opens, so the taller open silhouette stays
          // centred instead of riding high. Applied to the outer group rather
          // than the model: the model sits inside a rotated, scaled parent, so
          // the same offset there only moved the drawn result by a fraction of
          // itself. The group is a direct scene child, so this lands 1:1.
          masterGroup.position.y = THREE.MathUtils.lerp(
            masterGroup.position.y, -openProgress * openNudgeY, 0.10);
          masterGroup.rotation.x = THREE.MathUtils.lerp(masterGroup.rotation.x, targetRotX, 0.08);
          masterGroup.rotation.y = THREE.MathUtils.lerp(masterGroup.rotation.y, targetRotY, 0.08);
        }
      } else {
        // Gamepads, Headphones, Speakers â€” delta-only (see note above).
        if (isHov) {
          masterGroup.rotation.y = THREE.MathUtils.lerp(masterGroup.rotation.y, Math.sin(clock.elapsedTime * 1.6) * 0.25, 0.08);
          masterGroup.rotation.x = THREE.MathUtils.lerp(masterGroup.rotation.x, Math.cos(clock.elapsedTime * 1.2) * 0.10, 0.08);
        } else {
          masterGroup.rotation.y = THREE.MathUtils.lerp(masterGroup.rotation.y, 0, 0.08);
          masterGroup.rotation.x = THREE.MathUtils.lerp(masterGroup.rotation.x, 0, 0.08);
        }
      }

      renderer.render(scene, camera);
      if (loadedModel) hasRenderedLoadedModel = true;
      if (needsMoreFrames()) requestRender();
    };

    invalidateRef.current = requestRender;
    requestRender();

    return () => {
      isDisposed = true;
      invalidateRef.current = null;
      if (animId != null) cancelAnimationFrame(animId);
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
  }, [modelId, category, formFactor, brand, colorHex, isVisible]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 110,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    />
  );
}


