import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ChevronDown } from "lucide-react";
import {
  loadRealHumanModel,
  createSkinnedZozofitMaterial,
  type HumanBodyParams,
} from "./meshGenerator";
import type { MeshParameter, Measurement } from "../../types/database.types";

export { createSkinnedZozofitMaterial };

export type MetricKey =
  | "chest_circ_cm"
  | "waist_circ_cm"
  | "hip_circ_cm"
  | "shoulder_breadth_cm"
  | "inseam_cm";

export interface MannequinViewerProps {
  meshParams: MeshParameter | null;
  measurement: Pick<
    Measurement,
    "chest_circ_cm" | "waist_circ_cm" | "hip_circ_cm" | "shoulder_breadth_cm" | "inseam_cm"
  > | null;
  isLoading?: boolean;
  height?: number | string;
  id?: string;
  activeMetric?: MetricKey | null;
  onSelectMetric?: (metric: MetricKey) => void;
}

type ViewZone = "full_body" | "chest" | "waist" | "hips";
type ActiveZoneKey = "chest" | "waist" | "hips" | "shoulders" | "inseam";

interface CameraPreset {
  target: THREE.Vector3;
  pos: THREE.Vector3;
}

const VIEW_PRESETS: Record<ViewZone, CameraPreset> = {
  full_body: {
    target: new THREE.Vector3(0, 0.0, 0),
    pos: new THREE.Vector3(0, 0.05, 2.35),
  },
  chest: {
    target: new THREE.Vector3(0, 0.30, 0),
    pos: new THREE.Vector3(0, 0.32, 1.15),
  },
  waist: {
    target: new THREE.Vector3(0, 0.08, 0),
    pos: new THREE.Vector3(0, 0.10, 1.05),
  },
  hips: {
    target: new THREE.Vector3(0, -0.09, 0),
    pos: new THREE.Vector3(0, -0.07, 1.18),
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
  }
}

interface AnatomicalLandmarks {
  chest: THREE.Vector3;
  waist: THREE.Vector3;
  hips: THREE.Vector3;
  shoulders: THREE.Vector3;
  inseam: THREE.Vector3;
}

function computeLandmarks(params: HumanBodyParams): AnatomicalLandmarks {
  const sChest = params.scale_chest || 1.0;
  const sWaist = params.scale_waist || 1.0;
  const sHips = params.scale_hips || 1.0;

  return {
    chest: new THREE.Vector3(-0.165 * sChest, 0.30, 0.015),
    waist: new THREE.Vector3(-0.135 * sWaist, 0.08, 0.010),
    hips: new THREE.Vector3(0.178 * sHips, -0.09, -0.005),
    shoulders: new THREE.Vector3(0.195 * sChest, 0.43, 0.0),
    inseam: new THREE.Vector3(-0.085 * sHips, -0.35, 0.0),
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
  { key: "waist_circ_cm", label: "Waist", side: "left", get3DPoint: (lm) => lm.waist },
  { key: "inseam_cm", label: "Inseam", side: "left", get3DPoint: (lm) => lm.inseam },
  { key: "shoulder_breadth_cm", label: "Shoulders", side: "right", get3DPoint: (lm) => lm.shoulders },
  { key: "hip_circ_cm", label: "Hips", side: "right", get3DPoint: (lm) => lm.hips },
];

export const MannequinViewer: React.FC<MannequinViewerProps> = ({
  meshParams,
  measurement,
  isLoading = false,
  height = 560,
  id = "zozofit-viewport",
  activeMetric: controlledMetric,
  onSelectMetric,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const leftCalloutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightCalloutRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [internalMetric, setInternalMetric] = useState<MetricKey>("waist_circ_cm");
  const activeMetric = controlledMetric ?? internalMetric;
  const activeMetricRef = useRef<MetricKey>(activeMetric);

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
    const initialPreset = VIEW_PRESETS.full_body;
    camera.position.set(0, 0.05, 2.35);
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
    controls.target.copy(initialPreset.target);
    controls.maxPolarAngle = Math.PI * 0.65;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.minDistance = 0.8;
    controls.maxDistance = 5.0;
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
      setModelLoading(false);
    });

    const projVec = new THREE.Vector3();

    const animate = () => {
      state.raf = requestAnimationFrame(animate);

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
        const svgW = svg.clientWidth || w;
        const svgH = svg.clientHeight || h;

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

          if (cardEl && linePathEl && circleEl) {
            const cardRect = cardEl.getBoundingClientRect();
            const parentRect = el.getBoundingClientRect();

            const ax =
              callout.side === "left"
                ? cardRect.right - parentRect.left + 8
                : cardRect.left - parentRect.left - 8;
            const ay = cardRect.top + cardRect.height * 0.55 - parentRect.top;

            if (projVec.z < 1.0) {
              linePathEl.setAttribute("d", `M ${ax} ${ay} L ${lx} ${ly}`);
              circleEl.setAttribute("cx", `${lx}`);
              circleEl.setAttribute("cy", `${ly}`);

              const isFocus = callout.key === activeMetricRef.current;
              linePathEl.setAttribute(
                "stroke",
                isFocus ? "#A3E635" : "rgba(255, 255, 255, 0.35)"
              );
              linePathEl.setAttribute("stroke-width", "1");
              circleEl.setAttribute("fill", isFocus ? "#A3E635" : "rgba(255, 255, 255, 0.55)");
              circleEl.setAttribute("r", isFocus ? "3" : "2");
            } else {
              linePathEl.setAttribute("d", "");
              circleEl.setAttribute("r", "0");
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

  return (
    <div
      id={id}
      className="zf-mesh"
      style={{
        position: "relative",
        width: "100%",
        height,
        background:
          "radial-gradient(ellipse 70% 50% at 50% 88%, rgba(56, 189, 248, 0.08) 0%, rgba(12, 34, 43, 0.22) 45%, #0A0F12 85%)",
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        userSelect: "none",
      }}
    >
      {/* 1. Top Centered Viewport Zoom Pill Dropdown */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
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
            <span>{VIEW_LABELS[currentZone]}</span>
            <ChevronDown size={14} strokeWidth={2} style={{ color: "#94A3B8" }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: "50%",
                transform: "translateX(-50%)",
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
                  {VIEW_LABELS[z]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
              id={`target-${c.key}`}
              r="2"
              fill="rgba(255, 255, 255, 0.45)"
            />
          </g>
        ))}
      </svg>

      {/* 4. ZOZOFIT Left Floating Typography Callouts (Chest, Waist, Inseam) */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "20px",
          bottom: "40px",
          display: "flex",
          flexDirection: "column",
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
                display: "inline-flex",
                flexDirection: "column",
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
                {c.label}
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

      {/* 5. ZOZOFIT Right Floating Typography Callouts (Shoulders, Hips) */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          right: "20px",
          bottom: "100px",
          display: "flex",
          flexDirection: "column",
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
                display: "inline-flex",
                flexDirection: "column",
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
                {c.label}
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

      {/* 6. Bottom Rotation Hint */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          pointerEvents: "none",
          letterSpacing: "0.04em",
          zIndex: 15,
        }}
      >
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>

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
            background: "rgba(10, 15, 18, 0.88)",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid rgba(56, 189, 248, 0.2)",
              borderTopColor: "#38BDF8",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: "#94A3B8", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            LOADING ANATOMICAL HUMANOID...
          </span>
        </div>
      )}
    </div>
  );
};

export default MannequinViewer;
