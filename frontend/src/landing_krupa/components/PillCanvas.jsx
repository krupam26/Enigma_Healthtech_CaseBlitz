import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function PillCanvas({ scrollProgress = 0, isInteractive = true, activeColor = 'emerald' }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scrollProgress: 0,
    mouse: { x: 0, y: 0, isDown: false, prevX: 0, prevY: 0 },
    manualRot: { x: 0, y: 0 },
    manualOpen: null, // null means use scrollProgress, boolean overrides
    xray: false,
    colorScheme: 'emerald'
  });

  const [xrayActive, setXrayActive] = useState(false);
  const [manualOpenState, setManualOpenState] = useState(false);
  const [colorMode, setColorMode] = useState(activeColor);

  // Sync prop changes
  useEffect(() => {
    stateRef.current.scrollProgress = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    stateRef.current.colorScheme = colorMode;
  }, [colorMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10e598, 2.0);
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 2.8, 15);
    pointLight.position.set(0, 0, 3.5);
    scene.add(pointLight);

    // 4. Create Texture with "MEDICHECK 500" for the top shell
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 512, 256);
    
    // Medical measurement lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 472, 216);

    // Brand and Dosage text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MEDICHECK 500', 256, 100);

    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10e598';
    ctx.fillText('EXTENDED RELEASE · PO BID', 256, 160);

    const labelTexture = new THREE.CanvasTexture(canvas);
    labelTexture.wrapS = THREE.RepeatWrapping;
    labelTexture.repeat.set(1, 1);

    // 5. Materials
    const colorMap = {
      emerald: { top: 0x059669, glow: 0x10e598, bottom: 0x0f2820 },
      cyan: { top: 0x0284c7, glow: 0x00f0ff, bottom: 0x0c2533 },
      amber: { top: 0xd97706, glow: 0xfbbf24, bottom: 0x2b1e0d },
      purple: { top: 0x7c3aed, glow: 0xa855f7, bottom: 0x221338 }
    };

    const curTheme = colorMap[stateRef.current.colorScheme] || colorMap.emerald;

    // Top Shell Material (Opaque Metallic Lacquer)
    const topMaterial = new THREE.MeshPhysicalMaterial({
      color: curTheme.top,
      emissive: curTheme.glow,
      emissiveIntensity: 0.15,
      metalness: 0.15,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      map: labelTexture
    });

    // Bottom Shell Material (Translucent Frosted Capsule)
    const bottomMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x99f6e4,
      transparent: true,
      opacity: 0.65,
      transmission: 0.85,
      roughness: 0.22,
      ior: 1.45,
      metalness: 0.05
    });

    // 6. Pill Geometry
    const pillGroup = new THREE.Group();
    scene.add(pillGroup);

    // Top Half Group
    const topHalf = new THREE.Group();
    pillGroup.add(topHalf);

    // Cylinder part of top half
    const topCylGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.4, 48, 1, true);
    const topCyl = new THREE.Mesh(topCylGeo, topMaterial);
    topCyl.position.y = 0.7;
    topHalf.add(topCyl);

    // Dome part of top half (Hemisphere)
    const topDomeGeo = new THREE.SphereGeometry(1.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const topDome = new THREE.Mesh(topDomeGeo, topMaterial);
    topDome.position.y = 1.4;
    topHalf.add(topDome);

    // Bottom Half Group
    const bottomHalf = new THREE.Group();
    pillGroup.add(bottomHalf);

    // Cylinder part of bottom half
    const btmCylGeo = new THREE.CylinderGeometry(1.19, 1.19, 1.4, 48, 1, true);
    const btmCyl = new THREE.Mesh(btmCylGeo, bottomMaterial);
    btmCyl.position.y = -0.7;
    bottomHalf.add(btmCyl);

    // Dome part of bottom half
    const btmDomeGeo = new THREE.SphereGeometry(1.19, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const btmDome = new THREE.Mesh(btmDomeGeo, bottomMaterial);
    btmDome.position.y = -1.4;
    bottomHalf.add(btmDome);

    // Metallic Locking Band at Joint
    const bandGeo = new THREE.TorusGeometry(1.21, 0.03, 16, 64);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    topHalf.add(band);

    // 7. Active Ingredient Micro-Pellets inside the capsule
    const pelletsGroup = new THREE.Group();
    pillGroup.add(pelletsGroup);

    const pelletCount = 42;
    const pelletGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pelletColors = [0x10e598, 0x00f0ff, 0xffffff, 0xfacc15, 0x38bdf8];
    const pellets = [];

    for (let i = 0; i < pelletCount; i++) {
      const pMat = new THREE.MeshStandardMaterial({
        color: pelletColors[i % pelletColors.length],
        emissive: pelletColors[i % pelletColors.length],
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(pelletGeo, pMat);
      
      // Initial clustered positions inside bottom half
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.9;
      const py = -0.3 - Math.random() * 1.5;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      mesh.position.set(px, py, pz);
      
      // Explosion vector when opened
      const burstVec = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 4.5
      );

      pellets.push({
        mesh,
        basePos: new THREE.Vector3(px, py, pz),
        burstVec,
        orbitSpeed: 0.5 + Math.random() * 1.5,
        orbitPhase: Math.random() * Math.PI * 2
      });

      pelletsGroup.add(mesh);
    }

    // 8. Holographic Energy Disc & Telemetry Ring
    const holoRingGeo = new THREE.RingGeometry(1.3, 1.45, 64);
    const holoRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const holoRing = new THREE.Mesh(holoRingGeo, holoRingMat);
    holoRing.rotation.x = Math.PI / 2;
    pillGroup.add(holoRing);

    // Particle Cloud (Floating Ambient Ions)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.6
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse Interaction
    let isMouseDown = false;
    let startX = 0;
    let startY = 0;

    const onMouseDown = (e) => {
      isMouseDown = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      const deltaX = (e.clientX - startX) * 0.005;
      const deltaY = (e.clientY - startY) * 0.005;
      stateRef.current.manualRot.y += deltaX;
      stateRef.current.manualRot.x += deltaY;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const progress = stateRef.current.scrollProgress;

      // Color scheme updates
      const targetColors = colorMap[stateRef.current.colorScheme] || colorMap.emerald;
      topMaterial.color.setHex(targetColors.top);
      topMaterial.emissive.setHex(targetColors.glow);
      bandMat.emissive.setHex(targetColors.glow);
      holoRingMat.color.setHex(targetColors.glow);

      // X-Ray Mode
      topMaterial.wireframe = stateRef.current.xray;
      bottomMaterial.wireframe = stateRef.current.xray;

      // Determine open progress:
      // Either driven by scroll (opens between 0.18 and 0.55), or by manual button override
      let openProgress = 0;
      if (stateRef.current.manualOpen !== null) {
        openProgress = stateRef.current.manualOpen ? 1.0 : 0.0;
      } else {
        if (progress > 0.12 && progress < 0.65) {
          openProgress = Math.min(1.0, Math.max(0.0, (progress - 0.12) / 0.35));
        } else if (progress >= 0.65) {
          openProgress = Math.max(0.0, 1.0 - (progress - 0.65) / 0.15);
        }
      }

      // 1. Separation / Open translation
      const sepDist = openProgress * 2.2;
      topHalf.position.y = sepDist;
      topHalf.rotation.z = openProgress * 0.25;
      bottomHalf.position.y = -sepDist;
      bottomHalf.rotation.z = -openProgress * 0.15;

      // 2. Pellet bursting when opened
      pellets.forEach((p, idx) => {
        if (openProgress > 0.05) {
          // Disperse outward in orbital cloud
          const orbitAngle = time * p.orbitSpeed + p.orbitPhase;
          const orbitRadius = openProgress * 1.8 + 0.3;
          p.mesh.position.x = THREE.MathUtils.lerp(p.basePos.x, p.basePos.x + Math.cos(orbitAngle) * orbitRadius + p.burstVec.x * 0.5, openProgress);
          p.mesh.position.y = THREE.MathUtils.lerp(p.basePos.y, p.basePos.y + Math.sin(time * 2 + idx) * 0.8 + p.burstVec.y * 0.5, openProgress);
          p.mesh.position.z = THREE.MathUtils.lerp(p.basePos.z, p.basePos.z + Math.sin(orbitAngle) * orbitRadius + p.burstVec.z * 0.5, openProgress);
          p.mesh.scale.setScalar(1 + openProgress * 0.4);
        } else {
          // Settled inside
          p.mesh.position.copy(p.basePos);
          p.mesh.scale.setScalar(1);
        }
      });

      // 3. Holo Ring energy pulse
      holoRingMat.opacity = openProgress * 0.75;
      holoRing.scale.setScalar(1 + openProgress * 1.8 + Math.sin(time * 4) * 0.08);
      holoRing.rotation.z = time * 0.6;

      // 4. Overall Pill Position & Rotation across scroll
      // Hero (progress 0 - 0.25): center vertical
      // Transition (progress 0.25 - 0.6): tilts and opens
      // Showcase (progress 0.6 - 1.0): moves to right side to accompany the feature cards!
      let targetX = 0;
      let targetY = Math.sin(time * 1.5) * 0.15; // gentle idle bobbing
      let targetRotX = 0.15 + stateRef.current.manualRot.x;
      let targetRotY = time * 0.3 + stateRef.current.manualRot.y;
      let targetRotZ = 0.08;

      if (progress > 0.25 && progress < 0.75) {
        // Tilted state to showcase opening
        targetRotX = 0.4 + Math.sin(time * 0.8) * 0.1 + stateRef.current.manualRot.x;
        targetRotZ = 1.35; // Tilts horizontally
      }

      if (progress >= 0.55) {
        // Accompany along the page on the right side on wide viewports
        const isMobile = window.innerWidth < 850;
        targetX = isMobile ? 0 : 2.5;
        targetRotZ = 0.4;
      }

      pillGroup.position.x = THREE.MathUtils.lerp(pillGroup.position.x, targetX, 0.06);
      pillGroup.position.y = THREE.MathUtils.lerp(pillGroup.position.y, targetY, 0.06);
      pillGroup.rotation.x = THREE.MathUtils.lerp(pillGroup.rotation.x, targetRotX, 0.06);
      pillGroup.rotation.y = THREE.MathUtils.lerp(pillGroup.rotation.y, targetRotY, 0.06);
      pillGroup.rotation.z = THREE.MathUtils.lerp(pillGroup.rotation.z, targetRotZ, 0.06);

      // Particle system gentle drift
      particleSystem.rotation.y = time * 0.03;
      particleSystem.rotation.x = time * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      if (w < 768) {
        camera.position.z = 11.5;
      } else {
        camera.position.z = 9.0;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleToggleOpen = () => {
    const nextState = !manualOpenState;
    setManualOpenState(nextState);
    stateRef.current.manualOpen = nextState;
  };

  const handleToggleXray = () => {
    const next = !xrayActive;
    setXrayActive(next);
    stateRef.current.xray = next;
  };

  const handleColorChange = (color) => {
    setColorMode(color);
    stateRef.current.colorScheme = color;
  };

  const handleReset = () => {
    stateRef.current.manualRot.x = 0;
    stateRef.current.manualRot.y = 0;
    stateRef.current.manualOpen = null;
    setManualOpenState(false);
  };

  return (
    <div className="pill-canvas-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      
      {/* 3D Capsule Quick Interactive Bar */}
      {isInteractive && (
        <div className="pill-controls-bar">
          <button 
            type="button" 
            className={`pill-btn ${manualOpenState ? 'active' : ''}`}
            onClick={handleToggleOpen}
            title="Open or seal capsule halves"
          >
            <span className="dot"></span>
            {manualOpenState ? 'Seal Capsule' : 'Split / Open 3D'}
          </button>

          <button 
            type="button" 
            className={`pill-btn ${xrayActive ? 'active' : ''}`}
            onClick={handleToggleXray}
            title="Inspect molecular internal structure"
          >
            {xrayActive ? 'Solid Coating' : 'X-Ray Structure'}
          </button>

          <div className="pill-color-picker">
            <span 
              className={`color-dot emerald ${colorMode === 'emerald' ? 'selected' : ''}`} 
              onClick={() => handleColorChange('emerald')} 
              title="Emerald Vitality (Metformin 500)"
            />
            <span 
              className={`color-dot cyan ${colorMode === 'cyan' ? 'selected' : ''}`} 
              onClick={() => handleColorChange('cyan')} 
              title="Bio-Electric Cyan (Cardio / Amlodipine)"
            />
            <span 
              className={`color-dot amber ${colorMode === 'amber' ? 'selected' : ''}`} 
              onClick={() => handleColorChange('amber')} 
              title="Alert / Warning State"
            />
          </div>

          <button 
            type="button" 
            className="pill-btn-small" 
            onClick={handleReset} 
            title="Reset rotation & alignment"
          >
            ↺ Reset
          </button>
        </div>
      )}
    </div>
  );
}
