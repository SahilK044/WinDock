import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Speaker3D Component - Concept A: Sonic Equalizer Wave Sweep (Final Edition)
 * Built using frontend design & 3D animation skills (Sonos Arc / Bang & Olufsen Soundbar):
 * - Space Gray Anodized Aluminum Soundbar with Chrome Trims, Side End-Caps, & Acoustic Grille
 * - Connection: 3D Forward Tilt Entry -> Equalizer LED Lightstrip Sweep -> Stereo Aura Ripple -> Acoustic Hover
 * - Disconnect: Red LED Lightstrip Blink -> 3D Backward Tilt Exit -> Glides down out of frame -> Red LED turns off
 */
export default function Speaker3D({ size = 44, isAnimated = true, isDisconnected = false }) {
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(3.5, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf5f5f7, 3.0);
    rimLight.position.set(-4, -3, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 2.0);
    fillLight.position.set(-2, 3.5, 2.5);
    scene.add(fillLight);

    // ── 3. High-Fidelity 3D Soundbar Construction ──────────────────────────
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Premium PBR Materials
    const spaceGrayAluminum = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.18,
      metalness: 0.40,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      ior: 1.5,
    });

    const acousticGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
    });

    const chromeSilverMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.02,
      metalness: 0.98,
    });

    const ledCyanGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf5f5f7,
      transparent: true,
      opacity: 0.0,
    });

    const ledRedGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff453a,
      transparent: true,
      opacity: 0.0,
    });

    const soundbarGroup = new THREE.Group();

    // 3A. Main Soundbar Body (Elongated rounded box geometry)
    const barGeo = new THREE.BoxGeometry(1.22, 0.22, 0.28);
    const soundbarMain = new THREE.Mesh(barGeo, spaceGrayAluminum);
    soundbarGroup.add(soundbarMain);

    // 3B. Front Perforated Speaker Grille Panel
    const grilleGeo = new THREE.BoxGeometry(1.18, 0.18, 0.02);
    const grille = new THREE.Mesh(grilleGeo, acousticGrilleMat);
    grille.position.z = 0.14;
    soundbarGroup.add(grille);

    // 3C. Chrome Metallic Top & Bottom Trim Strips
    const trimGeo = new THREE.BoxGeometry(1.24, 0.015, 0.29);
    const topTrim = new THREE.Mesh(trimGeo, chromeSilverMat);
    topTrim.position.y = 0.11;
    soundbarGroup.add(topTrim);

    const bottomTrim = new THREE.Mesh(trimGeo, chromeSilverMat);
    bottomTrim.position.y = -0.11;
    soundbarGroup.add(bottomTrim);

    // Metallic End-Cap Edges
    const endCapGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 24);
    endCapGeo.scale(1.0, 1.0, 1.25);

    const leftCap = new THREE.Mesh(endCapGeo, chromeSilverMat);
    leftCap.position.x = -0.61;
    soundbarGroup.add(leftCap);

    const rightCap = new THREE.Mesh(endCapGeo, chromeSilverMat);
    rightCap.position.x = 0.61;
    soundbarGroup.add(rightCap);

    // 3D. Front Center LED Equalizer Lightstrip
    const ledStripGeo = new THREE.BoxGeometry(0.48, 0.025, 0.01);
    const ledCyanStrip = new THREE.Mesh(ledStripGeo, ledCyanGlowMat);
    ledCyanStrip.position.set(0, 0, 0.152);
    soundbarGroup.add(ledCyanStrip);

    const ledRedStrip = new THREE.Mesh(ledStripGeo, ledRedGlowMat);
    ledRedStrip.position.set(0, 0, 0.152);
    soundbarGroup.add(ledRedStrip);

    // 3E. Stereo Soundwave Aura Rings (Left & Right drivers)
    const waveRingGeo = new THREE.TorusGeometry(0.18, 0.012, 16, 32);

    const leftWave = new THREE.Mesh(waveRingGeo, ledCyanGlowMat.clone());
    leftWave.position.set(-0.35, 0, 0.16);
    soundbarGroup.add(leftWave);

    const rightWave = new THREE.Mesh(waveRingGeo, ledCyanGlowMat.clone());
    rightWave.position.set(0.35, 0, 0.16);
    soundbarGroup.add(rightWave);

    masterGroup.add(soundbarGroup);
    masterGroup.scale.setScalar(1.25);

    // ── 4. Motion Engine (Concept A: Sonic Equalizer Wave Sweep) ─────────────
    let animId;
    let startTime = performance.now();

    const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const renderLoop = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      if (isDisconnected) {
        // Disconnect Sequence: Red LED Blink -> 3D Backward Tilt Exit -> Glides down out of frame
        // Stage 1 (0.0s - 1.0s): Red LED Lightstrip blinks 3 times in levitation hover
        // Stage 2 (1.0s - 2.2s): 3D Backward Tilt (15°)
        // Stage 3 (2.2s - 4.0s): Glides smoothly down out of frame to bottom
        if (elapsed < 1.0) {
          const blink = Math.sin(elapsed * Math.PI * 5) > 0 ? 0.9 : 0.2;
          ledRedStrip.material.opacity = blink;
          ledCyanStrip.material.opacity = 0;

          masterGroup.position.y = Math.sin(elapsed * 1.6) * 0.04;
          masterGroup.rotation.x = Math.sin(elapsed * 1.2) * 0.04;
          masterGroup.scale.setScalar(1.25);
        } else if (elapsed < 2.2) {
          const tTilt = clamp((elapsed - 1.0) / 1.2);
          const tiltEase = easeOutQuint(tTilt);

          ledRedStrip.material.opacity = (1 - tiltEase) * 0.9;
          ledCyanStrip.material.opacity = 0;

          masterGroup.rotation.x = -tiltEase * 0.26; // Tilts backward 15°
          masterGroup.position.y = Math.sin(elapsed * 1.6) * 0.04;
          masterGroup.scale.setScalar(1.25);
        } else {
          const tExit = clamp((elapsed - 2.2) / 1.8);
          const exitProgress = easeOutQuint(tExit);

          ledRedStrip.material.opacity = 0;
          ledCyanStrip.material.opacity = 0;

          masterGroup.position.y = -exitProgress * 2.8; // Glides down out of frame
          masterGroup.scale.setScalar(1.25 * (1 - exitProgress * 0.75));
        }
      } else {
        // Connection Entry Sequence: 3D Forward Tilt Entry -> LED Lightstrip Sweep -> Stereo Aura Ripple -> Levitation Hover
        if (elapsed < 2.2) {
          const progress = elapsed / 2.2;
          const easeCurve = easeOutQuint(progress);

          // 3D Soundbar glides up from below with 15° forward tilt
          masterGroup.position.y = -2.8 * (1 - easeCurve);
          masterGroup.rotation.x = (1 - easeCurve) * 0.26; // Tilts forward during entry

          // Center LED Equalizer Lightstrip Sweep & Stereo Aura Ripple (0.6s - 1.8s)
          if (elapsed > 0.6) {
            const sweepT = clamp((elapsed - 0.6) / 1.2);
            const sweepEase = easeInOutCubic(sweepT);

            ledCyanStrip.material.opacity = sweepEase * 0.95;
            ledRedStrip.material.opacity = 0;

            // Stereo Aura Rings Ripple Outward
            const rippleT = clamp((elapsed - 0.8) / 1.0);
            const rippleEase = easeOutQuint(rippleT);

            leftWave.scale.setScalar(1.0 + rippleEase * 1.5);
            leftWave.material.opacity = (1.0 - rippleEase) * 0.75;

            rightWave.scale.setScalar(1.0 + rippleEase * 1.5);
            rightWave.material.opacity = (1.0 - rippleEase) * 0.75;
          } else {
            ledCyanStrip.material.opacity = 0;
            ledRedStrip.material.opacity = 0;
            leftWave.material.opacity = 0;
            rightWave.material.opacity = 0;
          }

          masterGroup.scale.setScalar(1.25 * Math.min(1, easeCurve * 1.06));
        } else {
          // Acoustic Levitation Hover: Soundbar floats smoothly with active glowing cyan LED Equalizer lightstrip!
          const hoverTime = elapsed - 2.2;

          masterGroup.position.y = Math.sin(hoverTime * 1.6) * 0.04;
          masterGroup.rotation.y = Math.sin(hoverTime * 1.1) * 0.08;
          masterGroup.rotation.x = Math.cos(hoverTime * 1.3) * 0.04;

          ledCyanStrip.material.opacity = 0.95 + Math.sin(hoverTime * 3.0) * 0.05; // Pulse glow
          ledRedStrip.material.opacity = 0;

          leftWave.material.opacity = 0;
          rightWave.material.opacity = 0;

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
