import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GlassCard } from "../common/GlassCard";
import type { MeshParameter } from "../../types/database.types";
import type { ExtractedMeasurements } from "../../types/biometrics.types";

export interface Center3DViewportProps {
  meshParams: MeshParameter | null;
  measurements: ExtractedMeasurements | null;
  isLoading?: boolean;
  id?: string;
}

const RINGS = [
  { label: "CHEST", yPos: 1.95, color: 0x06b6d4, r: 0.44 },
  { label: "WAIST", yPos: 1.52, color: 0x8b5cf6, r: 0.34 },
  { label: "HIP",   yPos: 1.15, color: 0x06b6d4, r: 0.42 },
];

export const Center3DViewport: React.FC<Center3DViewportProps> = ({
  meshParams,
  isLoading = false,
  id = "center-3d-viewport",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mannequin: THREE.Group;
    rings: THREE.Mesh[];
    raf: number;
    rotY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, rotY: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth || 360;
    const h = el.clientHeight || 400;

    // ── Scene ──
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(42, w / h, 0.1, 80);
    camera.position.set(0, 1.55, 3.8);
    camera.lookAt(0, 1.55, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    el.appendChild(renderer.domElement);

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0x0d1b2e, 3));
    const key = new THREE.DirectionalLight(0xc7dff7, 2.2);
    key.position.set(2.5, 5, 3);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x1e1b4b, 0.8);
    fill.position.set(-3, 2, -2);
    scene.add(fill);
    const cyanPt = new THREE.PointLight(0x06b6d4, 3.5, 6);
    cyanPt.position.set(-1.8, 2.2, -0.5);
    scene.add(cyanPt);
    const violetPt = new THREE.PointLight(0x8b5cf6, 2.5, 6);
    violetPt.position.set(1.8, 1.5, -0.5);
    scene.add(violetPt);
    const rimBack = new THREE.DirectionalLight(0x818cf8, 0.6);
    rimBack.position.set(0, 3, -4);
    scene.add(rimBack);

    // ── Mannequin geometry ──
    const mannequin = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a2744,
      metalness: 0.45,
      roughness: 0.55,
      envMapIntensity: 1.2,
    });
    const addMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, 0, rz);
      m.castShadow = true;
      mannequin.add(m);
      return m;
    };

    // Head
    addMesh(new THREE.SphereGeometry(0.195, 32, 28), bodyMat, 0, 2.78, 0);
    // Neck
    addMesh(new THREE.CylinderGeometry(0.085, 0.105, 0.2, 20), bodyMat, 0, 2.565, 0);
    // Upper chest
    addMesh(new THREE.CylinderGeometry(0.38, 0.36, 0.62, 32), bodyMat, 0, 2.10, 0);
    // Mid torso (waist)
    addMesh(new THREE.CylinderGeometry(0.29, 0.34, 0.44, 32), bodyMat, 0, 1.64, 0);
    // Hips
    addMesh(new THREE.CylinderGeometry(0.38, 0.36, 0.48, 32), bodyMat, 0, 1.16, 0);
    // Thighs
    addMesh(new THREE.CylinderGeometry(0.135, 0.115, 0.58, 20), bodyMat, -0.175, 0.71, 0);
    addMesh(new THREE.CylinderGeometry(0.135, 0.115, 0.58, 20), bodyMat,  0.175, 0.71, 0);
    // Shins
    addMesh(new THREE.CylinderGeometry(0.095, 0.075, 0.62, 16), bodyMat, -0.175, 0.12, 0);
    addMesh(new THREE.CylinderGeometry(0.095, 0.075, 0.62, 16), bodyMat,  0.175, 0.12, 0);
    // Upper arms
    addMesh(new THREE.CylinderGeometry(0.095, 0.078, 0.55, 16), bodyMat, -0.52, 2.02, 0, 0,  0.18);
    addMesh(new THREE.CylinderGeometry(0.095, 0.078, 0.55, 16), bodyMat,  0.52, 2.02, 0, 0, -0.18);
    // Forearms
    addMesh(new THREE.CylinderGeometry(0.072, 0.058, 0.50, 14), bodyMat, -0.60, 1.52, 0, 0, 0.12);
    addMesh(new THREE.CylinderGeometry(0.072, 0.058, 0.50, 14), bodyMat,  0.60, 1.52, 0, 0,-0.12);

    scene.add(mannequin);

    // ── Laser Rings ──
    const sx = meshParams?.scale_chest ?? 1;
    const sw = meshParams?.scale_waist ?? 1;
    const sh = meshParams?.scale_hips  ?? 1;
    const scales = [sx, sw, sh];

    const rings: THREE.Mesh[] = RINGS.map((r, i) => {
      const geo = new THREE.TorusGeometry(r.r * scales[i], 0.008, 16, 128);
      const mat = new THREE.MeshStandardMaterial({
        color: r.color,
        emissive: r.color,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.88,
        metalness: 0.1,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = r.yPos;
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      return mesh;
    });

    // ── Grid ──
    const grid = new THREE.GridHelper(4.5, 22, 0x06b6d4, 0x0f172a);
    (grid.material as THREE.Material & { opacity: number; transparent: boolean }).opacity = 0.18;
    (grid.material as THREE.Material & { opacity: number; transparent: boolean }).transparent = true;
    grid.position.y = -0.28;
    scene.add(grid);

    // ── Animate ──
    let rotY = 0;
    const animate = () => {
      const raf = requestAnimationFrame(animate);
      if (stateRef.current) stateRef.current.raf = raf;
      if (!isDragging) rotY += 0.007;
      mannequin.rotation.y = rotY;
      rings.forEach((ring, i) => {
        const m = ring.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 2.0 + Math.sin(Date.now() * 0.0025 + i * 1.4) * 0.8;
      });
      renderer.render(scene, camera);
    };
    const rafId = requestAnimationFrame(animate);

    stateRef.current = { renderer, scene, camera, mannequin, rings, raf: rafId, rotY };

    // ── Resize ──
    const onResize = () => {
      if (!el) return;
      const W = el.clientWidth, H = el.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [meshParams]);

  // Drag-to-rotate
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragRef.current = { x: e.clientX, rotY: stateRef.current?.rotY ?? 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !stateRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    stateRef.current.rotY   = dragRef.current.rotY + dx * 0.012;
    stateRef.current.mannequin.rotation.y = stateRef.current.rotY;
  };
  const onPointerUp = () => setIsDragging(false);

  return (
    <GlassCard accent="cyan" padding="sm" id={id}>
      {/* Header */}
      <div className="card-header" style={{ padding: "0 4px 0", marginBottom: "var(--sp-3)" }}>
        <div className="card-title">
          <span className="dot dot--cyan dot--pulse" />
          3D BIOMETRIC VIEWPORT
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--clr-cyan)", opacity: 0.7 }}>
          {isDragging ? "DRAG ↔" : "AUTO-ROTATE"}
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={mountRef}
        id="threejs-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width: "100%",
          height: 400,
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
          background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(6,182,212,0.04) 0%, rgba(10,13,20,0.95) 100%)",
        }}
      >
        {isLoading && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: "rgba(10,13,20,0.85)",
            borderRadius: "var(--r-lg)",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{
              width: 44,
              height: 44,
              border: "2px solid rgba(6,182,212,0.15)",
              borderTop: "2px solid var(--clr-cyan)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "var(--clr-text-3)", fontSize: 12 }}>Synthesizing 3D Biometric Mannequin...</p>
          </div>
        )}
      </div>

      {/* Ring legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-6)", marginTop: "var(--sp-3)", flexWrap: "wrap" }}>
        {RINGS.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 2, background: `#${r.color.toString(16).padStart(6, "0")}`, borderRadius: 1, boxShadow: `0 0 6px #${r.color.toString(16).padStart(6, "0")}80` }} />
            <span style={{ color: "var(--clr-text-3)", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Drag hint */}
      <p style={{ textAlign: "center", color: "var(--clr-text-4)", fontSize: 10, marginTop: "var(--sp-2)", fontFamily: "var(--font-mono)" }}>
        ← DRAG TO ROTATE MANNEQUIN →
      </p>
    </GlassCard>
  );
};

export default Center3DViewport;
