import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Headset3D Component - Sleek Pristine White PBR 3D Headphone Model
 * - Slower, ultra-smooth 5.6s disconnect motion sequence (1.2s hover -> 2.2s opposite spin -> 2.2s glide exit)
 * - High-DPI anti-aliased WebGL rendering with zero cropping & zero pixelation
 * - Smooth 60fps GPU rendering
 */
export default function Headset3D({ size = 44, isAnimated = true, isDisconnected = false }) {
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
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    rimLight.position.set(-4, -3, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-2, 3.5, 2.5);
    scene.add(fillLight);

    // ── 3. Premium Bold 3D White Headphone Model ────────────────────────────
    const headsetGroup = new THREE.Group();
    scene.add(headsetGroup);

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

    const darkAcousticMesh = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
    });

    // 3A. Headband Arc
    const headbandGeo = new THREE.TorusGeometry(0.50, 0.085, 24, 48, Math.PI);
    const headband = new THREE.Mesh(headbandGeo, ceramicWhite);
    headband.position.y = 0.10;
    headsetGroup.add(headband);

    const innerPadGeo = new THREE.TorusGeometry(0.44, 0.050, 16, 36, Math.PI * 0.74);
    const innerPad = new THREE.Mesh(innerPadGeo, cushionWhite);
    innerPad.position.y = 0.12;
    headsetGroup.add(innerPad);

    // 3B. Telescopic Chrome Metal Sliders
    const sliderGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 20);
    const leftSlider = new THREE.Mesh(sliderGeo, chromeSilver);
    leftSlider.position.set(-0.50, 0.01, 0);
    headsetGroup.add(leftSlider);

    const rightSlider = new THREE.Mesh(sliderGeo, chromeSilver);
    rightSlider.position.set(0.50, 0.01, 0);
    headsetGroup.add(rightSlider);

    // 3C. Left Earcup Assembly (Full-body Oval Capsule)
    const leftCupGroup = new THREE.Group();
    leftCupGroup.position.set(-0.50, -0.12, 0);

    const cupOuterGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 40);
    cupOuterGeo.rotateZ(Math.PI / 2);
    const leftCupOuter = new THREE.Mesh(cupOuterGeo, ceramicWhite);
    leftCupOuter.scale.set(0.85, 1.25, 0.92);
    leftCupGroup.add(leftCupOuter);

    const ringGeo = new THREE.TorusGeometry(0.29, 0.028, 16, 40);
    ringGeo.rotateY(Math.PI / 2);
    const leftRing = new THREE.Mesh(ringGeo, chromeSilver);
    leftRing.scale.set(1.0, 1.22, 0.9);
    leftCupGroup.add(leftRing);

    const cushionGeo = new THREE.TorusGeometry(0.25, 0.070, 20, 40);
    cushionGeo.rotateY(Math.PI / 2);
    const leftCushion = new THREE.Mesh(cushionGeo, cushionWhite);
    leftCushion.scale.set(1.0, 1.22, 0.9);
    leftCushion.position.x = 0.06;
    leftCupGroup.add(leftCushion);

    const innerGrilleGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.02, 32);
    innerGrilleGeo.rotateZ(Math.PI / 2);
    const leftGrille = new THREE.Mesh(innerGrilleGeo, darkAcousticMesh);
    leftGrille.scale.set(1.0, 1.22, 0.9);
    leftGrille.position.x = 0.08;
    leftCupGroup.add(leftGrille);

    headsetGroup.add(leftCupGroup);

    // 3D. Right Earcup Assembly (Mirror of Left)
    const rightCupGroup = new THREE.Group();
    rightCupGroup.position.set(0.50, -0.12, 0);

    const rightCupOuter = new THREE.Mesh(cupOuterGeo, ceramicWhite);
    rightCupOuter.scale.set(0.85, 1.25, 0.92);
    rightCupGroup.add(rightCupOuter);

    const rightRing = new THREE.Mesh(ringGeo, chromeSilver);
    rightRing.scale.set(1.0, 1.22, 0.9);
    rightCupGroup.add(rightRing);

    const rightCushion = new THREE.Mesh(cushionGeo, cushionWhite);
    rightCushion.scale.set(1.0, 1.22, 0.9);
    rightCushion.position.x = -0.06;
    rightCupGroup.add(rightCushion);

    const rightGrilleMesh = new THREE.Mesh(innerGrilleGeo, darkAcousticMesh);
    rightGrilleMesh.scale.set(1.0, 1.22, 0.9);
    rightGrilleMesh.position.x = -0.08;
    rightCupGroup.add(rightGrilleMesh);

    headsetGroup.add(rightCupGroup);

    // Proportional Scale calibrated for zero cropping during full 360° spin
    headsetGroup.scale.setScalar(1.10);

    // ── 4. Motion Engine (Slower Disconnect Sequence) ─────────────────────────
    let animId;
    let startTime = performance.now();

    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const renderLoop = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      if (isDisconnected) {
        // Slower, Relaxed Disconnect Sequence (Total 5.6s)
        // Stage 1 (0.0s - 1.2s): Levitation hover in place
        // Stage 2 (1.2s - 3.4s): Silky 2.2s opposite 360° spin
        // Stage 3 (3.4s - 5.6s): Gentle 2.2s pop / glide out of frame to bottom
        if (elapsed < 1.2) {
          headsetGroup.position.y = Math.sin(elapsed * 1.8) * 0.05;
          headsetGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.1;
          headsetGroup.scale.setScalar(1.10);
        } else if (elapsed < 3.4) {
          const t2 = (elapsed - 1.2) / 2.2;
          const spinProgress = easeInOutCubic(t2);

          headsetGroup.position.y = Math.sin(elapsed * 1.8) * 0.05;
          headsetGroup.rotation.y = -spinProgress * Math.PI * 2; // OPPOSITE DIRECTION SPIN
          headsetGroup.rotation.x = Math.sin(spinProgress * Math.PI) * -0.15;
          headsetGroup.scale.setScalar(1.10);
        } else {
          const t3 = Math.min(1.0, (elapsed - 3.4) / 2.2);
          const popProgress = easeOutQuint(t3);

          headsetGroup.rotation.y = -Math.PI * 2;
          headsetGroup.position.y = -popProgress * 2.8; // Glides smoothly down out of frame
          headsetGroup.scale.setScalar(1.10 * (1 - popProgress * 0.75));
        }
      } else {
        // Connection Entry Animation
        if (elapsed < 2.2) {
          const progress = elapsed / 2.2;
          const easeCurve = easeOutQuint(progress);

          headsetGroup.position.y = -2.8 * (1 - easeCurve);
          headsetGroup.rotation.y = easeCurve * Math.PI * 2; // Exactly 1 360° turn
          headsetGroup.rotation.x = Math.sin(easeCurve * Math.PI) * 0.14;
          headsetGroup.scale.setScalar(1.10 * Math.min(1, easeCurve * 1.06));
        } else {
          // Levitation Hover with Natural Physical Sway
          const hoverTime = elapsed - 2.2;
          headsetGroup.position.y = Math.sin(hoverTime * 1.6) * 0.05;
          headsetGroup.rotation.y = Math.PI * 2 + Math.sin(hoverTime * 1.1) * 0.12;
          headsetGroup.rotation.x = Math.cos(hoverTime * 1.3) * 0.06;
          headsetGroup.rotation.z = Math.sin(hoverTime * 0.9) * 0.04;
          headsetGroup.scale.setScalar(1.10);
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
