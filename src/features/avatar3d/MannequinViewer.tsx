import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ChevronDown } from "lucide-react";
import {
  loadRealHumanModel,
  createSkinnedZozofitMaterial,
  type HumanBodyParams,
  type AnatomicalLandmarks,
} from "./meshGenerator";
import type { MeshParameter, Measurement } from "../../types/database.types";

export { createSkinnedZozofitMaterial };

export type MetricKey =
  | "chest_circ_cm"
  | "waist_circ_cm"
  | "hip_circ_cm"
  | "shoulder_breadth_cm"
  | "inseam_cm"
  | "arm_length_cm"
  | "bicep_circ_cm"
  | "wrist_circ_cm"
  | "thigh_circ_cm"
  | "calf_circ_cm"
  | "ankle_circ_cm";

export type MannequinViewZone = "full_body" | "chest" | "waist" | "hips";

export interface GarmentOverlay3D {
  visible: boolean;
  category: "top" | "bottom" | "full";
  sizeLabel: string;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  bodyChestCm: number;
  bodyWaistCm: number;
  bodyHipCm: number;
  colorHex?: string;
}

export interface MannequinViewerProps {
  meshParams: MeshParameter | null;
  measurement: (Pick<
    Measurement,
    "chest_circ_cm" | "waist_circ_cm" | "hip_circ_cm" | "shoulder_breadth_cm" | "inseam_cm"
  > & {
    arm_length_cm?: number | null;
    bicep_circ_cm?: number | null;
    wrist_circ_cm?: number | null;
    thigh_circ_cm?: number | null;
    calf_circ_cm?: number | null;
    ankle_circ_cm?: number | null;
  }) | null;
  isLoading?: boolean;
  height?: number | string;
  id?: string;
  activeMetric?: MetricKey | null;
  onSelectMetric?: (metric: MetricKey) => void;
  zonePillAlign?: "center" | "left" | "right";
  variant?: "dark" | "studio";
  autoRotate?: boolean;
  hideCallouts?: boolean;
  hideZonePill?: boolean;
  hideDragHint?: boolean;
  externalZone?: MannequinViewZone;
  garmentOverlay?: GarmentOverlay3D | null;
}

type ViewZone = MannequinViewZone;
type ActiveZoneKey =
  | "chest"
  | "waist"
  | "hips"
  | "shoulders"
  | "inseam"
  | "arm_length"
  | "bicep"
  | "wrist"
  | "thigh"
  | "calf"
  | "ankle";

interface CameraPreset {
  target: THREE.Vector3;
  pos: THREE.Vector3;
}

const VIEW_PRESETS: Record<ViewZone, CameraPreset> = {
  full_body: {
    target: new THREE.Vector3(0, 0.0, 0),
    pos: new THREE.Vector3(0, 0.06, 3.05),
  },
  chest: {
    target: new THREE.Vector3(0, 0.42, 0),
    pos: new THREE.Vector3(0, 0.44, 1.35),
  },
  waist: {
    target: new THREE.Vector3(0, 0.25, 0),
    pos: new THREE.Vector3(0, 0.27, 1.25),
  },
  hips: {
    target: new THREE.Vector3(0, 0.02, 0),
    pos: new THREE.Vector3(0, 0.04, 1.35),
  },
};

const VIEW_LABELS: Record<ViewZone, string> = {
  full_body: "Full Body",
  chest: "Chest",
  waist: "Waist",
  hips: "Hips",
};

function metricToZone(metric: MetricKey): ActiveZoneKey {
  switch (metric) {
    case "chest_circ_cm":
      return "chest";
    case "waist_circ_cm":
      return "waist";
    case "hip_circ_cm":
      return "hips";
    case "shoulder_breadth_cm":
      return "shoulders";
    case "inseam_cm":
      return "inseam";
    case "arm_length_cm":
      return "arm_length";
    case "bicep_circ_cm":
      return "bicep";
    case "wrist_circ_cm":
      return "wrist";
    case "thigh_circ_cm":
      return "thigh";
    case "calf_circ_cm":
      return "calf";
    case "ankle_circ_cm":
      return "ankle";
  }
}

function computeLandmarks(params: HumanBodyParams): AnatomicalLandmarks {
  const sChest = params.scale_chest || 1.0;
  const sWaist = params.scale_waist || 1.0;
  const sHips = params.scale_hips || 1.0;
  const isFemale = params.gender === "female";

  return {
    chest: new THREE.Vector3((isFemale ? -0.145 : -0.145) * sChest, 0.42, isFemale ? 0.0 : 0.020),
    waist: new THREE.Vector3((isFemale ? -0.118 : -0.118) * sWaist, isFemale ? 0.26 : 0.25, isFemale ? 0.0 : 0.035),
    hips: new THREE.Vector3((isFemale ? 0.172 : 0.152) * sHips, 0.02, isFemale ? -0.04 : 0.038),
    shoulders: new THREE.Vector3(0.18 * sChest, isFemale ? 0.53 : 0.50, 0.0),
    inseam: new THREE.Vector3(-0.065 * sHips, -0.35, isFemale ? -0.04 : 0.0),
    arm_length: new THREE.Vector3(isFemale ? 0.535 : 0.54, isFemale ? 0.536 : 0.27, 0.0),
    bicep: new THREE.Vector3(isFemale ? -0.31 : -0.30, isFemale ? 0.54 : 0.42, 0.0),
    wrist: new THREE.Vector3(isFemale ? -0.585 : -0.62, isFemale ? 0.537 : 0.22, 0.02),
    thigh: new THREE.Vector3(0.105 * sHips, -0.18, isFemale ? -0.038 : 0.015),
    calf: new THREE.Vector3(0.10 * sHips, -0.50, isFemale ? -0.068 : -0.01),
    ankle: new THREE.Vector3(isFemale ? 0.084 : 0.125, isFemale ? -0.74 : -0.76, isFemale ? -0.049 : 0.0),
  };
}

interface CalloutDef {
  key: MetricKey;
  label: string;
  side: "left" | "right";
  get3DPoint: (lm: AnatomicalLandmarks) => THREE.Vector3;
}

const CALLOUTS: CalloutDef[] = [
  { key: "chest_circ_cm", label: "Chest", side: "left", get3DPoint: (lm) => lm.chest },
  { key: "bicep_circ_cm", label: "bicep", side: "left", get3DPoint: (lm) => lm.bicep },
  { key: "wrist_circ_cm", label: "wrist", side: "left", get3DPoint: (lm) => lm.wrist },
  { key: "waist_circ_cm", label: "Waist", side: "left", get3DPoint: (lm) => lm.waist },
  { key: "inseam_cm", label: "Inseam", side: "left", get3DPoint: (lm) => lm.inseam },
  { key: "shoulder_breadth_cm", label: "Shoulders", side: "right", get3DPoint: (lm) => lm.shoulders },
  { key: "arm_length_cm", label: "arm_length", side: "right", get3DPoint: (lm) => lm.arm_length },
  { key: "hip_circ_cm", label: "Hips", side: "right", get3DPoint: (lm) => lm.hips },
  { key: "thigh_circ_cm", label: "thigh", side: "right", get3DPoint: (lm) => lm.thigh },
  { key: "calf_circ_cm", label: "calf", side: "right", get3DPoint: (lm) => lm.calf },
  { key: "ankle_circ_cm", label: "ankle", side: "right", get3DPoint: (lm) => lm.ankle },
];

function buildLoftedEllipticalMesh(
  profileRings: { y: number; rx: number; rz: number; cx?: number; cz?: number }[],
  mat: THREE.Material,
  segs = 36
): THREE.Mesh {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < profileRings.length; r++) {
    const ring = profileRings[r];
    const cx = ring.cx ?? 0;
    const cz = ring.cz ?? 0;
    for (let s = 0; s <= segs; s++) {
      const theta = (s / segs) * Math.PI * 2;
      positions.push(
        cx + Math.cos(theta) * ring.rx,
        ring.y,
        cz + Math.sin(theta) * ring.rz
      );
    }
  }

  const stride = segs + 1;
  for (let r = 0; r < profileRings.length - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const a = r * stride + s;
      const b = a + stride;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, c, b, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

function fitColorForDelta(deltaCm: number): number {
  if (deltaCm < 1.5) return 0xfb7185; // Tight / snug alert (rose)
  if (deltaCm > 8.5) return 0x38bdf8; // Relaxed / loose (sky)
  return 0x34d399; // Ideal tailoring ease (emerald)
}

function disposeGroup(group: THREE.Object3D): void {
  group.traverse((obj) => {
    const m = obj as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) {
      if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
      else m.material.dispose();
    }
  });
}

function rebuildGarmentOverlayGroup(
  root: THREE.Group,
  overlay: GarmentOverlay3D | null | undefined,
  isFemale: boolean
): void {
  const existing = root.getObjectByName("garment_3d_shell");
  if (existing) {
    root.remove(existing);
    disposeGroup(existing);
  }
  if (!overlay || !overlay.visible) return;

  const shellGroup = new THREE.Group();
  shellGroup.name = "garment_3d_shell";

  const gChest = Math.max(0.75, Math.min(1.5, overlay.chestCm / 88));
  const gWaist = Math.max(0.7, Math.min(1.5, overlay.waistCm / 80));
  const gHips = Math.max(0.75, Math.min(1.5, overlay.hipCm / 94));
  const easePad = 0.006;

  const baseColor = new THREE.Color(overlay.colorHex || "#3B82F6");
  const fabricMat = new THREE.MeshBasicMaterial({
    color: baseColor,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: baseColor.clone().lerp(new THREE.Color("#FFFFFF"), 0.45),
    wireframe: true,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });

  const zChest = isFemale ? -0.036 : 0.02;
  const zWaist = isFemale ? -0.016 : 0.035;
  const zHips = isFemale ? -0.052 : 0.038;

  const addLoftedPiece = (rings: { y: number; rx: number; rz: number; cx?: number; cz?: number }[]) => {
    shellGroup.add(buildLoftedEllipticalMesh(rings, fabricMat));
    shellGroup.add(buildLoftedEllipticalMesh(rings, wireMat));
  };

  if (overlay.category === "top" || overlay.category === "full") {
    const chestRx = 0.148 * gChest + easePad;
    const chestRz = (isFemale ? 0.120 : 0.114) * gChest + easePad;
    const waistRx = (isFemale ? 0.122 : 0.120) * gWaist + easePad;
    const waistRz = (isFemale ? 0.088 : 0.092) * gWaist + easePad;
    const hemRx = (isFemale ? 0.165 : 0.144) * Math.max(gWaist, gHips * 0.96) + easePad;
    const hemRz = (isFemale ? 0.105 : 0.094) * Math.max(gWaist, gHips * 0.96) + easePad;

    const topProfile = [
      { y: 0.54, rx: 0.11 * gChest, rz: 0.078 * gChest, cz: zChest },
      { y: 0.49, rx: chestRx * 1.03, rz: chestRz * 0.96, cz: zChest },
      { y: 0.42, rx: chestRx, rz: chestRz, cz: zChest },
      { y: 0.26, rx: waistRx, rz: waistRz, cz: zWaist },
      { y: overlay.category === "full" ? 0.06 : 0.10, rx: hemRx, rz: hemRz, cz: zHips },
    ];
    addLoftedPiece(topProfile);

    // Sleeves aligned to Female T-Pose vs Male A-Pose
    const sleeveR = 0.056 * Math.sqrt(gChest);
    [-1, 1].forEach((dir) => {
      const sleeveGeo = new THREE.CylinderGeometry(sleeveR * 0.88, sleeveR * 1.02, 0.24, 24, 1, true);
      const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMat);
      const sleeveWire = new THREE.Mesh(sleeveGeo, wireMat);
      if (isFemale) {
        sleeveMesh.rotation.z = dir * (Math.PI / 2);
        sleeveMesh.position.set(dir * (0.27 * gChest), 0.54, 0.0);
      } else {
        sleeveMesh.rotation.z = dir * -0.96;
        sleeveMesh.position.set(dir * (0.26 * gChest), 0.42, 0.005);
      }
      sleeveWire.rotation.copy(sleeveMesh.rotation);
      sleeveWire.position.copy(sleeveMesh.position);
      shellGroup.add(sleeveMesh);
      shellGroup.add(sleeveWire);
    });
  }

  if (overlay.category === "bottom" || overlay.category === "full") {
    const waistRx = (isFemale ? 0.122 : 0.120) * gWaist + easePad;
    const waistRz = (isFemale ? 0.088 : 0.092) * gWaist + easePad;
    const hipRx = (isFemale ? 0.178 : 0.156) * gHips + easePad;
    const hipRz = (isFemale ? 0.110 : 0.090) * gHips + easePad;

    addLoftedPiece([
      { y: 0.24, rx: waistRx, rz: waistRz, cz: zWaist },
      { y: 0.12, rx: (waistRx + hipRx) / 2, rz: (waistRz + hipRz) / 2, cz: (zWaist + zHips) / 2 },
      { y: 0.02, rx: hipRx, rz: hipRz, cz: zHips },
      { y: -0.07, rx: hipRx * 0.94, rz: hipRz * 0.94, cz: zHips },
    ]);

    const legR = 0.078 * Math.sqrt(gHips) + easePad;
    const legCalfR = 0.058 * Math.sqrt(gHips) + easePad;
    [-1, 1].forEach((dir) => {
      const legCenterX = dir * (isFemale ? 0.088 : 0.098) * Math.max(0.92, gHips * 0.95);
      addLoftedPiece([
        { y: -0.07, cx: legCenterX, rx: legR, rz: legR * 0.95, cz: zHips * 0.6 },
        { y: -0.35, cx: legCenterX * 1.04, rx: legR * 0.85, rz: legR * 0.82, cz: 0 },
        { y: -0.72, cx: legCenterX * 1.08, rx: legCalfR, rz: legCalfR, cz: 0 },
      ]);
    });
  }

  // Highlight fit rings showing exact Ease gap (Emerald = Ideal, Rose = Tight, Sky = Relaxed)
  const fitRings: { show: boolean; y: number; rx: number; rz: number; cz: number; color: number }[] = [
    {
      show: overlay.category !== "bottom",
      y: 0.42,
      rx: 0.151 * gChest + easePad,
      rz: (isFemale ? 0.123 : 0.117) * gChest + easePad,
      cz: zChest,
      color: fitColorForDelta(overlay.chestCm - overlay.bodyChestCm),
    },
    {
      show: true,
      y: isFemale ? 0.26 : 0.25,
      rx: (isFemale ? 0.125 : 0.123) * gWaist + easePad,
      rz: (isFemale ? 0.091 : 0.095) * gWaist + easePad,
      cz: zWaist,
      color: fitColorForDelta(overlay.waistCm - overlay.bodyWaistCm),
    },
    {
      show: overlay.category !== "top",
      y: 0.02,
      rx: (isFemale ? 0.181 : 0.159) * gHips + easePad,
      rz: (isFemale ? 0.113 : 0.093) * gHips + easePad,
      cz: zHips,
      color: fitColorForDelta(overlay.hipCm - overlay.bodyHipCm),
    },
  ];

  fitRings.forEach((fr) => {
    if (!fr.show) return;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const th = (i / 48) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(th) * fr.rx, fr.y, Math.sin(th) * fr.rz + fr.cz));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.0055, 8, true);
    const tubeMat = new THREE.MeshBasicMaterial({ color: fr.color, transparent: true, opacity: 0.92 });
    shellGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
  });

  root.add(shellGroup);
}

import { useI18n } from "../../i18n";

export const MannequinViewer: React.FC<MannequinViewerProps> = ({
  meshParams,
  measurement,
  isLoading = false,
  height = 560,
  id = "zozofit-viewport",
  activeMetric: controlledMetric,
  onSelectMetric,
  zonePillAlign = "center",
  variant = "dark",
  autoRotate = false,
  hideCallouts = false,
  hideZonePill = false,
  hideDragHint = false,
  externalZone,
  garmentOverlay = null,
}) => {
  const { t } = useI18n();
  const mountRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const leftCalloutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightCalloutRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [internalMetric, setInternalMetric] = useState<MetricKey>("waist_circ_cm");
  const activeMetric = controlledMetric ?? internalMetric;
  const activeMetricRef = useRef<MetricKey>(activeMetric);

  const garmentOverlayRef = useRef<GarmentOverlay3D | null | undefined>(garmentOverlay);
  garmentOverlayRef.current = garmentOverlay;

  const [currentZone, setCurrentZone] = useState<ViewZone>("full_body");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    humanRoot: THREE.Group | null;
    landmarks: AnatomicalLandmarks;
    raf: number;
    targetCamPos: THREE.Vector3;
    targetControlsTarget: THREE.Vector3;
    isTransitioning: boolean;
  } | null>(null);

  const handleMetricSelect = useCallback(
    (key: MetricKey) => {
      setInternalMetric(key);
      onSelectMetric?.(key);
    },
    [onSelectMetric]
  );

  const handleZoneSelect = useCallback((zone: ViewZone) => {
    setCurrentZone(zone);
    setDropdownOpen(false);
    if (!threeRef.current) return;
    const preset = VIEW_PRESETS[zone];
    threeRef.current.targetCamPos.copy(preset.pos);
    threeRef.current.targetControlsTarget.copy(preset.target);
    threeRef.current.isTransitioning = true;
  }, []);

  // Sync external zone when driven by parent showcase
  useEffect(() => {
    if (!externalZone) return;
    handleZoneSelect(externalZone);
  }, [externalZone, handleZoneSelect]);

  // Update autoRotate dynamically when prop changes
  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.controls.autoRotate = Boolean(autoRotate);
    threeRef.current.controls.autoRotateSpeed = 1.4;
  }, [autoRotate]);

  // Update 3D garment shell whenever selected outfit / size / fit changes
  useEffect(() => {
    const root = threeRef.current?.humanRoot;
    if (!root) return;
    const isFemale = Boolean(meshParams?.base_gender_mesh?.includes("female"));
    rebuildGarmentOverlayGroup(root, garmentOverlay, isFemale);
  }, [garmentOverlay, meshParams]);

  // Update active ring color/opacity when activeMetric changes
  useEffect(() => {
    activeMetricRef.current = activeMetric;
    const root = threeRef.current?.humanRoot;
    if (!root) return;
    const activeZone = metricToZone(activeMetric);
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name.startsWith("ring_")) {
        const key = child.name.replace("ring_", "");
        const isActive = key === activeZone;
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.color.setHex(isActive ? 0xa3e635 : 0x38bdf8);
        mat.opacity = isActive ? 0.98 : 0.45;
      }
    });
  }, [activeMetric]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let w = el.clientWidth || 400;
    let h = el.clientHeight || 560;
    let disposed = false;

    const calcResponsiveFov = (vw: number, vh: number) => {
      const aspect = vw / Math.max(vh, 1);
      if (aspect >= 0.96) return 38;
      // Preserve horizontal span in portrait viewports so A-pose arms never touch side callouts
      const halfTan = Math.tan((38 * Math.PI) / 360) * (0.96 / Math.max(aspect, 0.54));
      return Math.min(54, (Math.atan(halfTan) * 360) / Math.PI);
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(calcResponsiveFov(w, h), w / h, 0.1, 50);
    const initialPreset = VIEW_PRESETS.full_body;
    camera.position.copy(initialPreset.pos);
    camera.lookAt(initialPreset.target);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = Boolean(autoRotate);
    controls.autoRotateSpeed = 1.4;
    controls.target.copy(initialPreset.target);
    controls.maxPolarAngle = Math.PI * 0.65;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.minDistance = 0.8;
    controls.maxDistance = 6.0;
    controls.enablePan = false;

    // Subtle radial ground platform under feet (y = -0.86)
    const discCanvas = document.createElement("canvas");
    discCanvas.width = 128;
    discCanvas.height = 128;
    const ctx = discCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.24)");
      grad.addColorStop(0.4, "rgba(12, 34, 43, 0.32)");
      grad.addColorStop(1, "rgba(10, 15, 18, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const discTex = new THREE.CanvasTexture(discCanvas);
    const discGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const discMat = new THREE.MeshBasicMaterial({
      map: discTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const groundDisc = new THREE.Mesh(discGeo, discMat);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = -0.86;
    scene.add(groundDisc);

    const params: HumanBodyParams = {
      gender: meshParams?.base_gender_mesh?.includes("female") ? "female" : "male",
      scale_chest: meshParams?.scale_chest ?? 1.0,
      scale_waist: meshParams?.scale_waist ?? 1.0,
      scale_hips: meshParams?.scale_hips ?? 1.0,
    };

    const activeZone = metricToZone(activeMetricRef.current);
    const landmarks = computeLandmarks(params);

    const state = {
      renderer,
      scene,
      camera,
      controls,
      humanRoot: null as THREE.Group | null,
      landmarks,
      raf: 0,
      targetCamPos: initialPreset.pos.clone(),
      targetControlsTarget: initialPreset.target.clone(),
      isTransitioning: false,
    };
    threeRef.current = state;
    setModelLoading(true);

    loadRealHumanModel(params, activeZone, (humanGroup) => {
      if (disposed) return;
      scene.add(humanGroup);
      state.humanRoot = humanGroup;
      if (humanGroup.userData?.landmarks) {
        state.landmarks = humanGroup.userData.landmarks as AnatomicalLandmarks;
      }
      rebuildGarmentOverlayGroup(humanGroup, garmentOverlayRef.current, params.gender === "female");
      setModelLoading(false);
    });

    const projVec = new THREE.Vector3();

    const animate = () => {
      state.raf = requestAnimationFrame(animate);

      // Keep renderer & FOV strictly synchronized with live container size during resize/flex stretch
      const curW = el.clientWidth;
      const curH = el.clientHeight;
      if (curW > 0 && curH > 0 && (curW !== w || curH !== h)) {
        w = curW;
        h = curH;
        camera.fov = calcResponsiveFov(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }

      if (state.isTransitioning) {
        camera.position.lerp(state.targetCamPos, 0.08);
        controls.target.lerp(state.targetControlsTarget, 0.08);
        if (
          camera.position.distanceTo(state.targetCamPos) < 0.005 &&
          controls.target.distanceTo(state.targetControlsTarget) < 0.005
        ) {
          camera.position.copy(state.targetCamPos);
          controls.target.copy(state.targetControlsTarget);
          state.isTransitioning = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      const svg = svgRef.current;
      if (svg && state.humanRoot) {
        const parentRect = el.getBoundingClientRect();
        const svgW = parentRect.width || svg.clientWidth || w;
        const svgH = parentRect.height || svg.clientHeight || h;

        CALLOUTS.forEach((callout) => {
          const p3 = callout.get3DPoint(state.landmarks);
          projVec.copy(p3).applyMatrix4(state.humanRoot!.matrixWorld).project(camera);

          const lx = (projVec.x * 0.5 + 0.5) * svgW;
          const ly = (-projVec.y * 0.5 + 0.5) * svgH;

          const cardEl =
            callout.side === "left"
              ? leftCalloutRefs.current[callout.key]
              : rightCalloutRefs.current[callout.key];

          const linePathEl = svg.querySelector(`#leader-${callout.key}`) as SVGPathElement | null;
          const circleEl = svg.querySelector(`#target-${callout.key}`) as SVGCircleElement | null;
          const anchorEl = svg.querySelector(`#anchor-${callout.key}`) as SVGCircleElement | null;

          if (cardEl && linePathEl && circleEl) {
            const cardRect = cardEl.getBoundingClientRect();

            const ax =
              callout.side === "left"
                ? cardRect.right - parentRect.left + 4
                : cardRect.left - parentRect.left - 4;
            const ay = cardRect.top + cardRect.height * 0.45 - parentRect.top;
            const elbowX = ax + (callout.side === "left" ? 10 : -10);

            if (projVec.z < 1.0) {
              linePathEl.setAttribute("d", `M ${ax} ${ay} L ${elbowX} ${ay} L ${lx} ${ly}`);
              circleEl.setAttribute("cx", `${lx}`);
              circleEl.setAttribute("cy", `${ly}`);
              if (anchorEl) {
                anchorEl.setAttribute("cx", `${ax}`);
                anchorEl.setAttribute("cy", `${ay}`);
              }

              const isFocus = callout.key === activeMetricRef.current;
              linePathEl.setAttribute(
                "stroke",
                isFocus ? "#A3E635" : "rgba(255, 255, 255, 0.35)"
              );
              linePathEl.setAttribute("stroke-width", isFocus ? "1.35" : "1");
              circleEl.setAttribute("fill", isFocus ? "#A3E635" : "rgba(255, 255, 255, 0.65)");
              circleEl.setAttribute("r", isFocus ? "3.2" : "2.1");
              if (anchorEl) {
                anchorEl.setAttribute("fill", isFocus ? "#A3E635" : "rgba(255, 255, 255, 0.45)");
                anchorEl.setAttribute("r", isFocus ? "2.2" : "1.5");
              }
            } else {
              linePathEl.setAttribute("d", "");
              circleEl.setAttribute("r", "0");
              if (anchorEl) anchorEl.setAttribute("r", "0");
            }
          }
        });
      }
    };

    state.raf = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      w = el.clientWidth;
      h = el.clientHeight;
      if (!w || !h) return;
      camera.fov = calcResponsiveFov(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      disposed = true;
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [meshParams]);

  const leftCallouts = CALLOUTS.filter((c) => c.side === "left");
  const rightCallouts = CALLOUTS.filter((c) => c.side === "right");
  const showLoading = isLoading || modelLoading;

  const isStudio = variant === "studio";

  return (
    <div
      id={id}
      className="zf-mesh"
      style={{
        position: "relative",
        width: "100%",
        height,
        background: isStudio
          ? "transparent"
          : "radial-gradient(ellipse 70% 50% at 50% 88%, rgba(56, 189, 248, 0.08) 0%, rgba(12, 34, 43, 0.22) 45%, #0A0F12 85%)",
        overflow: "hidden",
        borderRadius: isStudio ? "0px" : "12px",
        border: isStudio ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
        userSelect: "none",
      }}
    >
      {/* 1. Top Centered Viewport Zoom Pill Dropdown */}
      {!hideZonePill && (
      <div
        style={{
          position: "absolute",
          top: "14px",
          ...(zonePillAlign === "center"
            ? { left: "50%", transform: "translateX(-50%)" }
            : zonePillAlign === "left"
              ? { left: "14px" }
              : { right: "14px" }),
          zIndex: 30,
        }}
      >
        <div style={{ position: "relative" }}>
          <button
            type="button"
            id="btn-viewport-zoom-pill"
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "rgba(17, 25, 30, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              transition: "border-color 0.15s",
            }}
          >
            <span>{t(`viewer.zone.${currentZone}`)}</span>
            <ChevronDown size={14} strokeWidth={2} style={{ color: "#94A3B8" }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                ...(zonePillAlign === "center"
                  ? { left: "50%", transform: "translateX(-50%)" }
                  : zonePillAlign === "left"
                    ? { left: 0 }
                    : { right: 0 }),
                background: "#11191E",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "10px",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                minWidth: "120px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                zIndex: 35,
              }}
            >
              {(["full_body", "chest", "waist", "hips"] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => handleZoneSelect(z)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: currentZone === z ? "rgba(56, 189, 248, 0.14)" : "transparent",
                    color: currentZone === z ? "#38BDF8" : "#94A3B8",
                    fontSize: "12px",
                    fontWeight: currentZone === z ? 600 : 500,
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {t(`viewer.zone.${z}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* 2. Three.js Mount Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
        }}
      />

      {/* 3. Overlay SVG for 2D/3D Leader Lines */}
      {!hideCallouts && (
      <svg
        ref={svgRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {CALLOUTS.map((c) => (
          <g key={c.key}>
            <path
              id={`leader-${c.key}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1"
            />
            <circle
              id={`anchor-${c.key}`}
              r="1.5"
              fill="rgba(255, 255, 255, 0.45)"
            />
            <circle
              id={`target-${c.key}`}
              r="2"
              fill="rgba(255, 255, 255, 0.45)"
            />
          </g>
        ))}
      </svg>
      )}

      {/* 4. ZOZOFIT Left Floating Typography Callouts (Chest, Waist, Inseam) */}
      {!hideCallouts && (
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "14px",
          bottom: "48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-around",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {leftCallouts.map((c) => {
          const val = measurement?.[c.key];
          const isSelected = c.key === activeMetric;
          return (
            <div
              key={c.key}
              ref={(el) => {
                leftCalloutRefs.current[c.key] = el;
              }}
              onClick={() => handleMetricSelect(c.key)}
              onMouseEnter={() => handleMetricSelect(c.key)}
              style={{
                pointerEvents: "auto",
                cursor: "pointer",
                width: "fit-content",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: isSelected ? "#A3E635" : "#94A3B8",
                  transition: "color 0.2s",
                }}
              >
                {t(`viewer.${c.label.toLowerCase()}`)}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: isSelected ? "#A3E635" : "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.2s",
                }}
              >
                {val != null ? `${val.toFixed(1)}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      )}

      {/* 5. ZOZOFIT Right Floating Typography Callouts (Shoulders, Hips) */}
      {!hideCallouts && (
      <div
        style={{
          position: "absolute",
          top: "74px",
          right: "14px",
          bottom: "78px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "space-around",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {rightCallouts.map((c) => {
          const val = measurement?.[c.key];
          const isSelected = c.key === activeMetric;
          return (
            <div
              key={c.key}
              ref={(el) => {
                rightCalloutRefs.current[c.key] = el;
              }}
              onClick={() => handleMetricSelect(c.key)}
              onMouseEnter={() => handleMetricSelect(c.key)}
              style={{
                pointerEvents: "auto",
                cursor: "pointer",
                width: "fit-content",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "2px",
                textAlign: "right",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: isSelected ? "#A3E635" : "#94A3B8",
                  transition: "color 0.2s",
                }}
              >
                {t(`viewer.${c.label.toLowerCase()}`)}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: isSelected ? "#A3E635" : "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.2s",
                }}
              >
                {val != null ? `${val.toFixed(1)}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      )}

      {/* 6. Bottom Rotation Hint */}
      {!hideDragHint && (
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: isStudio ? "#475569" : "var(--muted)",
          pointerEvents: "none",
          letterSpacing: "0.04em",
          zIndex: 15,
        }}
      >
        {t("viewer.drag")}
      </div>
      )}

      {/* 7. Loading Overlay */}
      {showLoading && (
        <div
          className="zf-mesh-loading"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: isStudio ? "rgba(226, 228, 232, 0.85)" : "rgba(10, 15, 18, 0.88)",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: isStudio ? "2px solid rgba(37, 99, 235, 0.2)" : "2px solid rgba(56, 189, 248, 0.2)",
              borderTopColor: isStudio ? "#2563EB" : "#38BDF8",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: isStudio ? "#334155" : "#94A3B8", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            {t("viewer.loading")}
          </span>
        </div>
      )}
    </div>
  );
};

export default MannequinViewer;
