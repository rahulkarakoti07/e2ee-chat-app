import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface CyberBackgroundProps {
  particleCount?: number;
  interactive?: boolean;
}

export const CyberBackground3D: React.FC<CyberBackgroundProps> = ({
  particleCount = 700,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    camera.position.z = 450;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Particle Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const cyanColor = new THREE.Color(0x00f0ff);
    const purpleColor = new THREE.Color(0x9945ff);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 850;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      // Color variation between neon cyan and purple
      const mixedColor = cyanColor.clone().lerp(purpleColor, Math.random() * 0.7);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.3,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture Generation (Soft Glowing Circle)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.8)');
    grad.addColorStop(0.7, 'rgba(153, 69, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 5.5,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Dynamic Connections Line Segment
    const maxConnections = particleCount * 2;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.25;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.25;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Reactive Shockwave Pulse Event
    let pulseRadius = 0;
    let pulseActive = false;
    let pulseColor = new THREE.Color(0x00f0ff);

    const onShockwave = (e: CustomEvent) => {
      pulseActive = true;
      pulseRadius = 10;
      if (e.detail?.color === 'purple') {
        pulseColor.setHex(0x9945ff);
      } else if (e.detail?.color === 'emerald') {
        pulseColor.setHex(0x10b981);
      } else {
        pulseColor.setHex(0x00f0ff);
      }
    };
    window.addEventListener('aegis:cyber-pulse' as any, onShockwave as any);

    // Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera lerp towards mouse
      targetX += (mouseX - targetX) * 0.04;
      targetY += (-mouseY - targetY) * 0.04;
      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      // Rotate particle cloud gently
      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0003;

      // Update particle positions
      const pos = geometry.attributes.position.array as Float32Array;
      const col = geometry.attributes.color.array as Float32Array;

      if (pulseActive) {
        pulseRadius += delta * 600;
        if (pulseRadius > 900) {
          pulseActive = false;
        }
      }

      let lineIndex = 0;
      const linePos = lineGeometry.attributes.position.array as Float32Array;
      const lineCol = lineGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        // Move
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        // Bounce at boundaries
        if (pos[i * 3] < -550 || pos[i * 3] > 550) velocities[i].x = -velocities[i].x;
        if (pos[i * 3 + 1] < -425 || pos[i * 3 + 1] > 425) velocities[i].y = -velocities[i].y;
        if (pos[i * 3 + 2] < -400 || pos[i * 3 + 2] > 400) velocities[i].z = -velocities[i].z;

        // Shockwave reaction
        if (pulseActive) {
          const dist = Math.sqrt(
            pos[i * 3] * pos[i * 3] +
            pos[i * 3 + 1] * pos[i * 3 + 1] +
            pos[i * 3 + 2] * pos[i * 3 + 2]
          );
          if (Math.abs(dist - pulseRadius) < 50) {
            pos[i * 3] += velocities[i].x * 3;
            pos[i * 3 + 1] += velocities[i].y * 3;
          }
        }

        // Draw connections for nearby particles (sample subset for high FPS)
        if (i % 2 === 0 && lineIndex < maxConnections) {
          for (let j = i + 1; j < Math.min(i + 8, particleCount); j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 85 && lineIndex < maxConnections) {
              const pIdx = lineIndex * 6;
              linePos[pIdx] = pos[i * 3];
              linePos[pIdx + 1] = pos[i * 3 + 1];
              linePos[pIdx + 2] = pos[i * 3 + 2];
              linePos[pIdx + 3] = pos[j * 3];
              linePos[pIdx + 4] = pos[j * 3 + 1];
              linePos[pIdx + 5] = pos[j * 3 + 2];

              lineCol[pIdx] = col[i * 3];
              lineCol[pIdx + 1] = col[i * 3 + 1];
              lineCol[pIdx + 2] = col[i * 3 + 2];
              lineCol[pIdx + 3] = col[j * 3];
              lineCol[pIdx + 4] = col[j * 3 + 1];
              lineCol[pIdx + 5] = col[j * 3 + 2];

              lineIndex++;
            }
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('aegis:cyber-pulse' as any, onShockwave as any);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [particleCount]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
};

// Helper function to dispatch a cyber pulse across the 3D scene from anywhere in the app
export const triggerCyberPulse = (color: 'cyan' | 'purple' | 'emerald' = 'cyan') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aegis:cyber-pulse', { detail: { color } }));
  }
};
