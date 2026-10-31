import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { createMannequinMesh, createMeasurementRings, RenderMode } from './meshGenerator';
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
  const [renderMode, setRenderMode] = useState<RenderMode>('shaded');
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

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Subtle Minimal Workshop Circular Grid Floor
    const gridHelper = new THREE.GridHelper(3, 12, 0xD8CBB1, 0xE8E1D3);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 5. Lighting: Natural Studio Ambient + Directional Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf1f5f9, 0.8);
    dirLight2.position.set(-2, 3, -2);
    scene.add(dirLight2);

    // 6. Add Mannequin Mesh & Rings
    const mannequin = createMannequinMesh(measurements, renderMode);
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
        mannequinGroupRef.current.rotation.y += 0.006;
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

  // Update mannequin when measurements, renderMode, or showRings changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (mannequinGroupRef.current) {
      scene.remove(mannequinGroupRef.current);
    }
    if (ringsGroupRef.current) {
      scene.remove(ringsGroupRef.current);
    }

    const newMannequin = createMannequinMesh(measurements, renderMode);
    mannequinGroupRef.current = newMannequin;
    scene.add(newMannequin);

    const newRings = createMeasurementRings(measurements);
    ringsGroupRef.current = newRings;
    newRings.visible = showRings;
    scene.add(newRings);
  }, [measurements, renderMode, showRings]);

  return (
    <div className="relative w-full rounded-card overflow-hidden border border-kraft/60 bg-paper-2 shadow-card flex flex-col">
      {/* 3D Canvas Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <Badge variant="indigo" dot>
            Three.js WebGL
          </Badge>
          <Badge variant="kraft">
            Đồ gá may đo (Atelier)
          </Badge>
        </div>

        <span className="font-mono text-xs text-ink-2 bg-paper/90 px-2.5 py-1 rounded-control border border-kraft/60 shadow-subtle">
          172.5 cm • 94.0 cm
        </span>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[440px] sm:h-[480px] cursor-grab active:cursor-grabbing bg-paper"
      />

      {/* Clean Floating Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-paper-2/95 backdrop-blur-sm px-4 py-2.5 rounded-card border border-kraft/60 shadow-subtle">
        <div className="flex items-center gap-2">
          {/* Shaded / Wireframe / Contour Segmented Control */}
          <SegmentedControl
            size="sm"
            options={[
              { value: 'shaded', label: 'Vải mộc (Shaded)' },
              { value: 'wireframe', label: 'Lưới (Wireframe)' },
              { value: 'contour', label: 'Đồng mức (Contour)' },
            ]}
            value={renderMode}
            onChange={(val) => setRenderMode(val as RenderMode)}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRings(!showRings)}
            icon={<Layers className="w-3.5 h-3.5" />}
          >
            {showRings ? 'Vòng đo: Bật' : 'Vòng đo: Tắt'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            icon={<RotateCw className="w-3.5 h-3.5" />}
          >
            {autoRotate ? 'Dừng' : 'Xoay'}
          </Button>
        </div>

        <span className="text-[11px] text-ink-2 hidden sm:block font-sans">
          Kéo chuột xoay 360°
        </span>
      </div>
    </div>
  );
};
export default MannequinViewer;
