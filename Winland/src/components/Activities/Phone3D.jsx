import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Phone3D Component - Dynamic Device Model Adaptation
 * Dynamically builds 3D phone geometry based on deviceName:
 * 1. Samsung Galaxy S24 / S23 / Ultra (`samsung_ultra`):
 *    - Sharp boxy titanium frame body
 *    - Centered Infinity-O front camera punch-hole dot
 *    - 5 separate floating metallic camera lens rings on rear glass (zero square bump)
 * 2. iPhone 15 Pro / 16 Pro / 17 Pro / Pro Max (`iphone_pro`):
 *    - Curved titanium frame body
 *    - Top center Dynamic Island pill cutout with glowing cyan/red halo
 *    - Triangular 3-lens layout on raised camera plateau
 * 3. iPhone 15 / 16 / 17 (`iphone_base`):
 *    - Curved aluminum frame body
 *    - Top center Dynamic Island pill cutout
 *    - Vertical 2-lens camera island
 */
export default function Phone3D({ size = 44, isAnimated = true, isDisconnected = false, deviceName = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Detect Phone Archetype from deviceName ─────────────────────────
    const nameLower = (deviceName || '').toLowerCase();

    let phoneType = 'iphone_pro'; // Default flagship archetype
    if (
      nameLower.includes('s24') ||
      nameLower.includes('s23') ||
      nameLower.includes('s25') ||
      nameLower.includes('ultra') ||
      nameLower.includes('galaxy') ||
      nameLower.includes('samsung')
    ) {
      phoneType = 'samsung_ultra';
    } else if (
      nameLower.includes('iphone') &&
      (nameLower.includes('pro') || nameLower.includes('max'))
    ) {
      phoneType = 'iphone_pro';
    } else if (nameLower.includes('iphone')) {
      phoneType = 'iphone_base';
    }

    // ── 2. High-DPI Anti-Aliased WebGL Scene Setup ────────────────────────
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

    // ── 3. Studio Lighting Setup ────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.8);
    keyLight.position.set(3.5, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 3.2);
    rimLight.position.set(-4, -3, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 2.2);
    fillLight.position.set(-2, 3.5, 2.5);
    scene.add(fillLight);

    // ── 4. Dynamic 3D Smartphone Model Construction ───────────────────────
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // PBR Materials tailored per archetype
    const titaniumFrameMat = new THREE.MeshPhysicalMaterial({
      color: phoneType === 'samsung_ultra' ? 0x94a3b8 : 0xcbd5e1, // Darker Titanium for Ultra, Silver for iPhone
      roughness: 0.04,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      ior: 1.5,
    });

    const rearGlassMat = new THREE.MeshPhysicalMaterial({
      color: phoneType === 'samsung_ultra' ? 0x0f172a : 0x1e293b,
      roughness: 0.15,
      metalness: 0.20,
      clearcoat: 0.9,
    });

    const screenGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x090d16,
      roughness: 0.05,
      clearcoat: 1.0,
    });

    const pillBorderMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2,
    });

    const pillBodyMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const cyanGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0,
    });

    const redGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff453a,
      transparent: true,
      opacity: 0.0,
    });

    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x020617,
      roughness: 0.02,
      metalness: 0.90,
      clearcoat: 1.0,
    });

    const phoneGroup = new THREE.Group();

    // 4A. Main Frame Geometry (Boxy for S24 Ultra, Sleek for iPhone)
    const frameW = phoneType === 'samsung_ultra' ? 0.64 : 0.62;
    const frameH = phoneType === 'samsung_ultra' ? 1.28 : 1.25;

    const bodyGeo = new THREE.BoxGeometry(frameW, frameH, 0.07);
    const bodyFrame = new THREE.Mesh(bodyGeo, titaniumFrameMat);
    phoneGroup.add(bodyFrame);

    // Rear Glass Panel
    const rearGeo = new THREE.BoxGeometry(frameW - 0.02, frameH - 0.02, 0.01);
    const rearGlass = new THREE.Mesh(rearGeo, rearGlassMat);
    rearGlass.position.z = -0.036;
    phoneGroup.add(rearGlass);

    // Front Display Screen Glass
    const screenGeo = new THREE.BoxGeometry(frameW - 0.05, frameH - 0.05, 0.01);
    const displayScreen = new THREE.Mesh(screenGeo, screenGlassMat);
    displayScreen.position.z = 0.036;
    phoneGroup.add(displayScreen);

    // Ambient Display Glow Flares
    const glowPlaneGeo = new THREE.PlaneGeometry(frameW - 0.09, frameH - 0.11);

    const cyanScreenGlow = new THREE.Mesh(glowPlaneGeo, cyanGlowMat);
    cyanScreenGlow.position.z = 0.042;
    phoneGroup.add(cyanScreenGlow);

    const redScreenGlow = new THREE.Mesh(glowPlaneGeo, redGlowMat);
    redScreenGlow.position.z = 0.042;
    phoneGroup.add(redScreenGlow);

    // 4B. Front Camera Assembly (Dynamic Island for iPhone, Punch-Hole for S24 Ultra)
    let pillGroup = new THREE.Group();

    if (phoneType === 'samsung_ultra') {
      // Samsung Infinity-O Centered Punch-Hole Camera Dot
      pillGroup.position.set(0, 0.52, 0.055);

      const punchHoleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.014, 20);
      punchHoleGeo.rotateX(Math.PI / 2);

      const punchHoleRim = new THREE.Mesh(punchHoleGeo, pillBorderMat);
      pillGroup.add(punchHoleRim);

      const punchHoleGlass = new THREE.Mesh(punchHoleGeo, pillBodyMat);
      punchHoleGlass.position.z = 0.002;
      pillGroup.add(punchHoleGlass);

      const cyanPunchRing = new THREE.Mesh(punchHoleGeo, cyanGlowMat);
      cyanPunchRing.scale.set(1.4, 1.4, 1.1);
      cyanPunchRing.position.z = 0.003;
      pillGroup.add(cyanPunchRing);

      const redPunchRing = new THREE.Mesh(punchHoleGeo, redGlowMat);
      redPunchRing.scale.set(1.4, 1.4, 1.1);
      redPunchRing.position.z = 0.003;
      pillGroup.add(redPunchRing);
    } else {
      // iPhone Dynamic Island Pill Cutout Assembly
      pillGroup.position.set(0, 0.44, 0.055);

      const pillBorderGeo = new THREE.BoxGeometry(0.18, 0.052, 0.01);
      const pillBorder = new THREE.Mesh(pillBorderGeo, pillBorderMat);
      pillGroup.add(pillBorder);

      const pillCoreGeo = new THREE.BoxGeometry(0.16, 0.042, 0.012);
      const pillCore = new THREE.Mesh(pillCoreGeo, pillBodyMat);
      pillGroup.add(pillCore);

      // Lens Dot inside Pill
      const lensDotGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.014, 16);
      lensDotGeo.rotateX(Math.PI / 2);
      const lensDot = new THREE.Mesh(lensDotGeo, lensGlassMat);
      lensDot.position.set(-0.045, 0, 0.002);
      pillGroup.add(lensDot);

      const cyanPillRing = new THREE.Mesh(pillBorderGeo, cyanGlowMat);
      cyanPillRing.scale.set(1.18, 1.40, 1.1);
      cyanPillRing.position.z = 0.003;
      pillGroup.add(cyanPillRing);

      const redPillRing = new THREE.Mesh(pillBorderGeo, redGlowMat);
      redPillRing.scale.set(1.18, 1.40, 1.1);
      redPillRing.position.z = 0.003;
      pillGroup.add(redPillRing);
    }

    phoneGroup.add(pillGroup);

    // 4C. Rear Camera Assembly (Floating 5 rings for S24 Ultra, Plateau for iPhone)
    const createLensRing = (x, y, radius = 0.042) => {
      const lensGroup = new THREE.Group();
      lensGroup.position.set(x, y, -0.045);

      const ringGeo = new THREE.TorusGeometry(radius, 0.008, 16, 24);
      const ring = new THREE.Mesh(ringGeo, titaniumFrameMat);
      lensGroup.add(ring);

      const glassGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.01, 20);
      glassGeo.rotateX(Math.PI / 2);
      const glass = new THREE.Mesh(glassGeo, lensGlassMat);
      lensGroup.add(glass);

      return lensGroup;
    };

    if (phoneType === 'samsung_ultra') {
      // Samsung Galaxy S24 Ultra Rear Floating Camera System (5 Separate Chrome Rings directly on rear glass)
      const ultraLens1 = createLensRing(-0.17, 0.46, 0.048); // Main 200MP
      const ultraLens2 = createLensRing(-0.17, 0.32, 0.048); // Periscope Tele
      const ultraLens3 = createLensRing(-0.17, 0.18, 0.048); // Ultra-Wide
      const ultraLens4 = createLensRing(0.01, 0.46, 0.032);  // Laser AF Sensor
      const ultraLens5 = createLensRing(0.01, 0.32, 0.032);  // 3x Tele / Flash

      phoneGroup.add(ultraLens1);
      phoneGroup.add(ultraLens2);
      phoneGroup.add(ultraLens3);
      phoneGroup.add(ultraLens4);
      phoneGroup.add(ultraLens5);
    } else {
      // iPhone Rear Camera Bump Island Plateau
      const cameraIslandGeo = new THREE.BoxGeometry(0.24, 0.28, 0.025);
      const cameraIsland = new THREE.Mesh(cameraIslandGeo, titaniumFrameMat);
      cameraIsland.position.set(-0.14, 0.42, -0.048);
      phoneGroup.add(cameraIsland);

      if (phoneType === 'iphone_pro') {
        // Triangular 3-Lens Pro layout
        const lens1 = createLensRing(-0.18, 0.48);
        const lens2 = createLensRing(-0.18, 0.36);
        const lens3 = createLensRing(-0.09, 0.42);

        phoneGroup.add(lens1);
        phoneGroup.add(lens2);
        phoneGroup.add(lens3);
      } else {
        // Vertical 2-Lens Base layout
        const lens1 = createLensRing(-0.14, 0.48);
        const lens2 = createLensRing(-0.14, 0.36);

        phoneGroup.add(lens1);
        phoneGroup.add(lens2);
      }
    }

    masterGroup.add(phoneGroup);
    masterGroup.scale.setScalar(1.25);

    // ── 5. Motion Engine (Dynamic Island / Punch-Hole Expansion) ───────────
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
        // Disconnect Sequence: Camera Cutout Flashes Red -> 3D Backward Tilt -> Drop Exit
        if (elapsed < 1.2) {
          const blink = Math.sin(elapsed * Math.PI * 5) > 0 ? 0.95 : 0.25;

          // Animate red glow on camera cutout & display screen
          redGlowMat.opacity = blink;
          redScreenGlow.material.opacity = blink * 0.5;
          cyanGlowMat.opacity = 0;
          cyanScreenGlow.material.opacity = 0;

          const pulse = 1.0 + blink * 0.35;
          pillGroup.scale.set(pulse, pulse, 1.0);

          masterGroup.position.y = Math.sin(elapsed * 1.6) * 0.04;
          masterGroup.rotation.set(0, 0, 0);
          masterGroup.scale.setScalar(1.25);
        } else if (elapsed < 2.4) {
          const tTilt = clamp((elapsed - 1.2) / 1.2);
          const tiltEase = easeOutQuint(tTilt);

          redGlowMat.opacity = (1 - tiltEase) * 0.95;
          redScreenGlow.material.opacity = (1 - tiltEase) * 0.5;

          pillGroup.scale.set(1.0, 1.0, 1.0);
          masterGroup.rotation.x = -tiltEase * 0.35; // Backward tilt
          masterGroup.position.y = Math.sin(elapsed * 1.6) * 0.04;
          masterGroup.scale.setScalar(1.25);
        } else {
          const tExit = clamp((elapsed - 2.4) / 1.8);
          const exitProgress = easeOutQuint(tExit);

          redGlowMat.opacity = 0;
          redScreenGlow.material.opacity = 0;

          masterGroup.position.y = -exitProgress * 2.8; // Glides down out of frame
          masterGroup.scale.setScalar(1.25 * (1 - exitProgress * 0.75));
        }
      } else {
        // Connection Entry Sequence: Magnetic Entry -> Camera Cutout Expansion -> 3D Depth Tilt -> Levitation Hover
        if (elapsed < 2.4) {
          const progress = elapsed / 2.4;
          const easeCurve = easeOutQuint(progress);

          // 3D Phone glides up from below
          masterGroup.position.y = -2.8 * (1 - easeCurve);

          // Front Camera Cutout Expansion & 3D Depth Tilt (0.6s - 1.8s)
          if (elapsed > 0.6) {
            const pillT = clamp((elapsed - 0.6) / 1.2);
            const pillEase = easeInOutCubic(pillT);

            const pillScaleX = lerp(1.0, 1.75, Math.sin(pillEase * Math.PI));
            const pillScaleY = lerp(1.0, 1.45, Math.sin(pillEase * Math.PI));
            pillGroup.scale.set(pillScaleX, pillScaleY, 1.0);

            cyanGlowMat.opacity = pillEase * 0.95;
            cyanScreenGlow.material.opacity = pillEase * 0.60;

            // 3D Depth Tilt Showcase
            const tiltY = Math.sin(pillEase * Math.PI) * -0.28;
            const tiltX = Math.sin(pillEase * Math.PI) * 0.18;
            masterGroup.rotation.y = tiltY;
            masterGroup.rotation.x = tiltX;
          } else {
            pillGroup.scale.set(1.0, 1.0, 1.0);
            cyanGlowMat.opacity = 0;
            cyanScreenGlow.material.opacity = 0;
            masterGroup.rotation.set(0, 0, 0);
          }

          masterGroup.scale.setScalar(1.25 * Math.min(1, easeCurve * 1.06));
        } else {
          // Levitation Hover: Phone floats smoothly with active camera cutout glow & gentle physical sway!
          const hoverTime = elapsed - 2.4;

          pillGroup.scale.set(1.0, 1.0, 1.0);
          masterGroup.position.y = Math.sin(hoverTime * 1.6) * 0.04;
          masterGroup.rotation.y = Math.sin(hoverTime * 1.1) * 0.08;
          masterGroup.rotation.x = Math.cos(hoverTime * 1.3) * 0.04;

          cyanGlowMat.opacity = 0.95 + Math.sin(hoverTime * 3.0) * 0.05;
          cyanScreenGlow.material.opacity = 0.60 + Math.sin(hoverTime * 3.0) * 0.05;

          masterGroup.scale.setScalar(1.25);
        }
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
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, isAnimated, isDisconnected, deviceName]);

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
