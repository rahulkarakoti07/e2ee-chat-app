import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HoloShield3DProps {
  size?: number;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'emerald';
}

export const HoloShield3D: React.FC<HoloShield3DProps> = ({
  size = 220,
  className = '',
  glowColor = 'cyan',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const primaryHex =
      glowColor === 'purple' ? 0x9945ff : glowColor === 'emerald' ? 0x10b981 : 0x00f0ff;
    const secondaryHex =
      glowColor === 'purple' ? 0x00f0ff : glowColor === 'emerald' ? 0x00f0ff : 0x9945ff;

    // Group to hold all rotating elements
    const holoGroup = new THREE.Group();
    scene.add(holoGroup);

    // 1. Central Icosahedron Wireframe Core
    const icoGeometry = new THREE.IcosahedronGeometry(1.4, 0);
    const icoWireframe = new THREE.WireframeGeometry(icoGeometry);
    const icoMaterial = new THREE.LineBasicMaterial({
      color: primaryHex,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const icosahedron = new THREE.LineSegments(icoWireframe, icoMaterial);
    holoGroup.add(icosahedron);

    // 2. Inner Glowing Core Sphere
    const sphereGeometry = new THREE.SphereGeometry(0.55, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: secondaryHex,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const innerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    holoGroup.add(innerSphere);

    // 3. Orbit Ring 1
    const ring1Geometry = new THREE.TorusGeometry(2.1, 0.02, 16, 64);
    const ring1Material = new THREE.MeshBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1.rotation.x = Math.PI / 3;
    holoGroup.add(ring1);

    // 4. Orbit Ring 2
    const ring2Geometry = new THREE.TorusGeometry(2.4, 0.015, 16, 64);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: secondaryHex,
      transparent: true,
      opacity: 0.55,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.y = Math.PI / 4;
    holoGroup.add(ring2);

    // Mouse Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      holoGroup.rotation.y += deltaX * 0.01;
      holoGroup.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging) {
        holoGroup.rotation.y += 0.008;
        holoGroup.rotation.x += 0.004;
      }

      ring1.rotation.z += 0.015;
      ring2.rotation.z -= 0.012;
      innerSphere.rotation.y -= 0.01;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      icoGeometry.dispose();
      icoWireframe.dispose();
      icoMaterial.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      ring1Geometry.dispose();
      ring1Material.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      renderer.dispose();
    };
  }, [size, glowColor]);

  return (
    <div
      ref={containerRef}
      className={`relative cursor-grab active:cursor-grabbing flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
