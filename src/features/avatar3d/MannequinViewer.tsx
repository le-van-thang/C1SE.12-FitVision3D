import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Eye, Grid3X3, Maximize2, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createMannequinMesh, createMeasurementRings } from './meshGenerator';
import type { BodyMeasurements } from '@/types';

interface MannequinViewerProps {
  measurements?: BodyMeasurements;
}

export const MannequinViewer: React.FC<MannequinViewerProps> = ({
  measurements = {
    height: 172.5,
    chestGirth: 94.0,
    waistGirth: 78.5,
    hipGirth: 96.0,
    shoulderBreadth: 43.5,
    armLength: 61.0,
    insideLegLength: 79.5,
    unit: 'cm',
    confidenceScore: 0.95,
  },
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showRings, setShowRings] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.1, 3.6);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(4, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 2.0);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 1.8);
    dirLight2.position.set(-3, 3, -2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x22d3ee, 2.5, 10);
    pointLight.position.set(0, 1.5, 2);
    scene.add(pointLight);

    // 6. Add Mannequin Mesh & Rings
    const mannequin = createMannequinMesh(measurements, wireframe);
    mannequinGroupRef.current = mannequin;
    scene.add(mannequin);

    const rings = createMeasurementRings(measurements);
    ringsGroupRef.current = rings;
    rings.visible = showRings;
    scene.add(rings);

    // 7. Mouse drag rotation interaction
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !mannequinGroupRef.current) return;
      const deltaX = e.clientX - prevMousePosRef.current.x;
      mannequinGroupRef.current.rotation.y += deltaX * 0.01;
      if (ringsGroupRef.current) {
        ringsGroupRef.current.rotation.y = mannequinGroupRef.current.rotation.y;
      }
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current && mannequinGroupRef.current) {
        mannequinGroupRef.current.rotation.y += 0.008;
        if (ringsGroupRef.current) {
          ringsGroupRef.current.rotation.y = mannequinGroupRef.current.rotation.y;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update mannequin when measurements or wireframe changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (mannequinGroupRef.current) {
      scene.remove(mannequinGroupRef.current);
    }
    if (ringsGroupRef.current) {
      scene.remove(ringsGroupRef.current);
    }

    const newMannequin = createMannequinMesh(measurements, wireframe);
    mannequinGroupRef.current = newMannequin;
    scene.add(newMannequin);

    const newRings = createMeasurementRings(measurements);
    ringsGroupRef.current = newRings;
    newRings.visible = showRings;
    scene.add(newRings);
  }, [measurements, wireframe, showRings]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl flex flex-col">
      {/* 3D Canvas Viewport Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" dot>
            Three.js WebGL Engine
          </Badge>
          <Badge variant="violet">
            Parametric Mannequin 3D
          </Badge>
        </div>

        {/* Floating status */}
        <span className="hidden sm:inline-flex text-[11px] font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-white/10">
          Height: {measurements.height}cm • Chest: {measurements.chestGirth}cm
        </span>
      </div>

      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-[460px] sm:h-[520px] cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#0b1120] to-[#080c14]"
      />

      {/* Floating Toolbar Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <Button
            variant={wireframe ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setWireframe(!wireframe)}
            icon={<Grid3X3 className="w-3.5 h-3.5" />}
          >
            {wireframe ? 'Mesh: Wireframe' : 'Mesh: Shaded'}
          </Button>

          <Button
            variant={showRings ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowRings(!showRings)}
            icon={<Layers className="w-3.5 h-3.5" />}
          >
            {showRings ? 'Vòng đo: Bật' : 'Vòng đo: Tắt'}
          </Button>

          <Button
            variant={autoRotate ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            icon={<RotateCw className="w-3.5 h-3.5" />}
          >
            {autoRotate ? 'Tự xoay' : 'Dừng xoay'}
          </Button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
          Kéo chuột để xoay 360° • Zoom bằng lăn chuột
        </div>
      </div>
    </div>
  );
};
