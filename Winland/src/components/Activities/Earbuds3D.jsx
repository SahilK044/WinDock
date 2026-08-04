import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Earbuds3D Component - Perfect Geometry Proportions
 * - Compact earbud stem length (0.28) & docked slot depth (Y = -0.05)
 * - 0% geometry protruding through bottom of case
 * - 0% geometry protruding through top of closed lid
 * - Stutter-free 60fps levitation & docking engine
 */
export default function Earbuds3D({ size = 44, isAnimated = true, isDisconnected = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. High-DPI Anti-Aliased WebGL Scene Setup ────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(size, size);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    const canvas = renderer.domElement;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.display = 'block';

    container.appendChild(canvas);

    // ── 2. Studio Lighting Setup ────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(3.5, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.5);
    rimLight.position.set(-4, -3, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-2, 3.5, 2.5);
    scene.add(fillLight);

    // ── 3. High-Fidelity 3D Case & Earbuds Construction ─────────────────────
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Premium PBR Materials
    const ceramicWhite = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.10,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      ior: 1.5,
    });

    const cushionWhite = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
      metalness: 0.0,
    });

    const chromeSilver = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.02,
      metalness: 0.98,
    });

    const darkCavityMesh = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
    });

    // 3A. Charging Case Base (AirPods Pro Body)
    const caseGroup = new THREE.Group();
    caseGroup.position.set(0, -0.15, 0);

    const caseBaseGeo = new THREE.CylinderGeometry(0.44, 0.38, 0.36, 36);
    caseBaseGeo.scale(1.22, 1.0, 0.72);
    const caseBase = new THREE.Mesh(caseBaseGeo, ceramicWhite);
    caseBase.position.y = -0.18;
    caseGroup.add(caseBase);

    // Deep Inner Cavity
    const cavityGeo = new THREE.CylinderGeometry(0.40, 0.36, 0.04, 32);
    cavityGeo.scale(1.18, 1.0, 0.68);
    const cavity = new THREE.Mesh(cavityGeo, darkCavityMesh);
    cavity.position.y = -0.01;
    caseGroup.add(cavity);

    // Chrome seam accent ring
    const seamGeo = new THREE.TorusGeometry(0.44, 0.016, 16, 40);
    seamGeo.rotateX(Math.PI / 2);
    seamGeo.scale(1.22, 0.72, 1.0);
    const seamRing = new THREE.Mesh(seamGeo, chromeSilver);
    seamRing.position.y = 0.0;
    caseGroup.add(seamRing);

    // 3B. Case Lid (Upper Half-Sphere Dome pivoting BACKWARDS at z = -0.22)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.0, -0.22); // Hinge pivot at back edge (-Z)

    const lidGeo = new THREE.SphereGeometry(0.44, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    lidGeo.scale(1.22, 0.60, 0.72);
    const lidMesh = new THREE.Mesh(lidGeo, ceramicWhite);
    lidMesh.position.set(0, 0.0, 0.22); // Center lid over case base
    lidGroup.add(lidMesh);

    caseGroup.add(lidGroup);

    // 3C. Proportional Twin 3D Earbuds (Compact stem height so zero clipping top or bottom)
    const earbudsGroup = new THREE.Group();

    const createEarbudMesh = (isLeft = true) => {
      const budGroup = new THREE.Group();

      // Compact Stem (length 0.28)
      const stemGeo = new THREE.CylinderGeometry(0.048, 0.038, 0.28, 24);
      const stem = new THREE.Mesh(stemGeo, ceramicWhite);
      stem.position.y = -0.07;
      budGroup.add(stem);

      // Chrome contact cap
      const capGeo = new THREE.CylinderGeometry(0.039, 0.039, 0.025, 20);
      const cap = new THREE.Mesh(capGeo, chromeSilver);
      cap.position.y = -0.21;
      budGroup.add(cap);

      // Bulbous housing
      const bulbGeo = new THREE.SphereGeometry(0.13, 24, 24);
      const bulb = new THREE.Mesh(bulbGeo, ceramicWhite);
      bulb.position.set(0, 0.09, 0);
      budGroup.add(bulb);

      // Angled Silicone Tip
      const tipGeo = new THREE.ConeGeometry(0.11, 0.13, 24);
      tipGeo.rotateZ(isLeft ? -Math.PI / 4 : Math.PI / 4);
      const tip = new THREE.Mesh(tipGeo, cushionWhite);
      tip.position.set(isLeft ? 0.11 : -0.11, 0.11, 0.04);
      budGroup.add(tip);

      // Acoustic Mesh
      const grilleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16);
      grilleGeo.rotateZ(isLeft ? -Math.PI / 4 : Math.PI / 4);
      const grille = new THREE.Mesh(grilleGeo, darkCavityMesh);
      grille.position.set(isLeft ? 0.14 : -0.14, 0.13, 0.06);
      budGroup.add(grille);

      return budGroup;
    };

    const leftBud = createEarbudMesh(true);
    const rightBud = createEarbudMesh(false);

    earbudsGroup.add(leftBud);
    earbudsGroup.add(rightBud);
    caseGroup.add(earbudsGroup); // Parented inside caseGroup!

    masterGroup.add(caseGroup);
    masterGroup.scale.setScalar(1.25);

    // ── 4. Master Motion Engine (Zero Clipping Top or Bottom) ───────────────
    let animId;
    let startTime = performance.now();

    const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const lerp = (a, b, t) => a + (b - a) * t;

    const renderLoop = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      if (isDisconnected) {
        // Cinematic 4.0s Earbud Disconnection Sequence:
        // 0.0s - 1.2s: Earbuds lower down from floating height back into charging slots (-0.05)
        // 1.2s - 2.2s: Case lid rotates shut smoothly (lidAngle -> 0)
        // 2.2s - 4.0s: Closed case tilts & glides down through bottom of island (-2.8)

        // 1. Case Y position
        const tCaseDrop = easeOutCubic(clamp((elapsed - 2.2) / 1.5));
        const caseY = elapsed < 2.2 ? -0.15 : lerp(-0.15, -2.8, tCaseDrop);
        caseGroup.position.y = caseY;

        // 2. Case Lid Angle
        const tLidClose = easeOutCubic(clamp((elapsed - 1.2) / 1.0));
        const lidAngle = elapsed < 1.2 ? Math.PI * 0.65 : lerp(Math.PI * 0.65, 0, tLidClose);
        lidGroup.rotation.x = lidAngle;

        // 3. Earbud Docking (0.0s - 1.2s)
        if (elapsed < 1.2) {
          const tBudDock = easeOutCubic(clamp(elapsed / 1.2));
          const yPos = lerp(0.50, -0.05, tBudDock);
          const xPosLeft = lerp(-0.35, -0.20, tBudDock);
          const xPosRight = lerp(0.35, 0.20, tBudDock);
          leftBud.position.set(xPosLeft, yPos, 0);
          rightBud.position.set(xPosRight, yPos, 0);
          leftBud.rotation.set(0, 0, 0);
          rightBud.rotation.set(0, 0, 0);
        } else {
          leftBud.position.set(-0.20, -0.05, 0);
          rightBud.position.set(0.20, -0.05, 0);
          leftBud.rotation.set(0, 0, 0);
          rightBud.rotation.set(0, 0, 0);
        }

        const scaleT = easeOutCubic(clamp((elapsed - 2.2) / 1.5));
        masterGroup.scale.setScalar(lerp(1.25, 0.4, scaleT));
        masterGroup.visible = elapsed < 3.8;
      } else {
        // Continuous Connection Entry Sequence (Total 4.0s)
        // 0.0s - 0.6s: Case pops up from below
        // 0.6s - 1.2s: Lid flips BACKWARDS open (+115°)
        // 1.2s - 1.8s: Earbuds lift straight up out of slots into open air (-0.05 -> 0.50)
        // 1.8s - 3.2s: Earbuds perform 360° 3D Elliptical Orbit in open air (Y = 0.50)
        // 3.2s - 4.0s: Case lid snaps shut & Case glides down out of frame -> Earbuds smoothly lower to centered height Y = 0.02!
        // 4.0s+: Earbuds levitate alone perfectly centered in frame!

        // 1. Case Y position
        const tCaseUp = clamp(elapsed / 0.6);
        const tCaseDown = clamp((elapsed - 3.2) / 0.8);
        let caseY = -2.8;
        if (elapsed < 1.4) {
          caseY = lerp(-2.8, -0.15, easeOutQuint(tCaseUp));
        } else if (elapsed >= 1.4 && elapsed < 4.0) {
          caseY = lerp(-0.15, -2.8, easeOutQuint(tCaseDown));
        }
        caseGroup.position.y = caseY;

        // 2. Lid Rotation Angle (Flips BACKWARDS into distance: +Math.PI * 0.65)
        const tLidOpen = clamp((elapsed - 0.6) / 0.6);
        const tLidClose = clamp((elapsed - 3.2) / 0.8);
        let lidAngle = 0;
        if (elapsed >= 0.6 && elapsed < 3.2) {
          lidAngle = lerp(0, Math.PI * 0.65, easeOutQuint(tLidOpen));
        } else if (elapsed >= 3.2 && elapsed < 4.0) {
          lidAngle = lerp(Math.PI * 0.65, 0, easeOutQuint(tLidClose));
        }
        lidGroup.rotation.x = lidAngle;

        // 3. Earbud Position (Relative to caseGroup)
        if (elapsed < 1.2) {
          // Docked inside case slots
          leftBud.position.set(-0.20, -0.05, 0);
          rightBud.position.set(0.20, -0.05, 0);
          leftBud.rotation.set(0, 0, 0);
          rightBud.rotation.set(0, 0, 0);
        } else if (elapsed < 1.8) {
          // Lift STRAIGHT UP out of slots into open air (-0.05 -> 0.50)
          const tLift = clamp((elapsed - 1.2) / 0.6);
          const liftEase = easeOutQuint(tLift);
          const yPos = lerp(-0.05, 0.50, liftEase);
          const xPosLeft = lerp(-0.20, -0.35, liftEase);
          const xPosRight = lerp(0.20, 0.35, liftEase);

          leftBud.position.set(xPosLeft, yPos, 0);
          rightBud.position.set(xPosRight, yPos, 0);
          leftBud.rotation.set(0, 0, 0);
          rightBud.rotation.set(0, 0, 0);
        } else if (elapsed < 3.2) {
          // 360° 3D Orbit IN OPEN AIR high above case (relative y = 0.50)
          const tOrbit = clamp((elapsed - 1.8) / 1.4);
          const orbitEase = easeInOutCubic(tOrbit);
          const angle = orbitEase * Math.PI * 2;

          leftBud.position.set(-Math.cos(angle) * 0.35, 0.50, Math.sin(angle) * 0.28);
          rightBud.position.set(Math.cos(angle) * 0.35, 0.50, -Math.sin(angle) * 0.28);

          leftBud.rotation.y = angle;
          rightBud.rotation.y = angle;
          leftBud.rotation.x = 0;
          leftBud.rotation.z = 0;
          rightBud.rotation.x = 0;
          rightBud.rotation.z = 0;
        } else if (elapsed < 4.0) {
          // As case drops out of frame, earbuds smoothly lower down from 0.50 to centered height 0.02 (relative to caseGroup: 0.02 - caseY)
          const tCenter = clamp((elapsed - 3.2) / 0.8);
          const centerEase = easeOutQuint(tCenter);
          const targetWorldY = lerp(0.35, 0.02, centerEase);
          const relativeY = targetWorldY - caseY;

          leftBud.position.set(-0.35, relativeY, 0);
          rightBud.position.set(0.35, relativeY, 0);

          leftBud.rotation.set(0.1, 0.12, -0.06);
          rightBud.rotation.set(0.1, -0.12, 0.06);
        } else {
          // Levitation Hover: Earbuds float cleanly in 3D space, PERFECTLY CENTERED IN FRAME! (caseGroup.position.y = -2.8)
          const hoverTime = elapsed - 4.0;
          const relativeY = 0.02 - caseY; // caseY is -2.8, so relativeY is +2.82, making world Y = 0.02!

          leftBud.position.set(-0.35, relativeY + Math.sin(hoverTime * 1.6) * 0.04, 0);
          rightBud.position.set(0.35, relativeY + Math.sin(hoverTime * 1.6 + 0.5) * 0.04, 0);

          leftBud.rotation.set(0.1, 0.12 + Math.sin(hoverTime * 1.1) * 0.08, -0.06);
          rightBud.rotation.set(0.1, -0.12 - Math.sin(hoverTime * 1.1) * 0.08, 0.06);
        }

        masterGroup.scale.setScalar(1.25);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, isAnimated, isDisconnected]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    />
  );
}
