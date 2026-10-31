// ============================================================
// DASHBOARD STUDIO
// Left: capture Â· Center: mesh Â· Right: measurements + recommendation
// ============================================================
import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Ruler, RotateCcw, FileText, Table2, ScanLine, Box, ListChecks, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { CameraViewfinder } from "../features/capture/CameraViewfinder";
import { MannequinViewer, type MetricKey } from "../features/avatar3d/MannequinViewer";
import { MeasurementsPanel } from "../features/anthropometry/MeasurementsPanel";
import { RecommendationCard } from "../features/anthropometry/RecommendationCard";
import {
  DEMO_BIOMETRIC, DEMO_MEASUREMENT, DEMO_MESH, DEMO_RECOMMENDATION, bmi,
} from "../data/mockData";
import type { CameraState, PoseQuality } from "../types/biometrics.types";
import type { BiometricInput, Measurement, MeshParameter, SystemAuditLog } from "../types/database.types";

type Tab = "capture" | "mesh" | "metrics";

/** Body inputs entered on the landing page estimator (biometric_inputs). */
const loadBiometric = (): BiometricInput => {
  try {
    const raw = sessionStorage.getItem("fv3d_estimator");
    if (!raw) return DEMO_BIOMETRIC;
    const e = JSON.parse(raw) as Pick<BiometricInput, "stature_cm" | "weight_kg" | "gender">;
    if (!e.stature_cm || !e.weight_kg) return DEMO_BIOMETRIC;
    return { ...DEMO_BIOMETRIC, ...e, calculated_bmi: bmi(e.weight_kg, e.stature_cm) };
  } catch {
    return DEMO_BIOMETRIC;
  }
};

const POSE_OK: PoseQuality = { is_upright: true, is_full_body_visible: true, confidence_score: 0.94, hud_color: "green" };

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [poseQuality, setPoseQuality] = useState<PoseQuality | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [mesh, setMesh] = useState<MeshParameter | null>(null);
  const [biometric, setBiometric] = useState<BiometricInput | null>(null);
  const [audit, setAudit] = useState<SystemAuditLog | null>(null);
  const [processing, setProcessing] = useState(false);
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState<Tab>("capture");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("chest_circ_cm");
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraState("calibrating");
      setPoseQuality({ ...POSE_OK, is_full_body_visible: false, confidence_score: 0.82, hud_color: "orange" });
    } catch {
      // No camera available: continue with a simulated feed
      setCameraState("calibrating");
      setTimeout(() => { setCameraState("front_capture"); setPoseQuality(POSE_OK); }, 1200);
    }
  }, []);

  const finishScan = useCallback((delay: number, isDemo = false) => {
    const t0 = performance.now();
    setProcessing(true);
    setCameraState("processing");
    setTimeout(() => {
      const bio = loadBiometric();
      setBiometric(bio);
      setMeasurement(DEMO_MEASUREMENT);
      setMesh(DEMO_MESH);
      setAudit({
        id: Date.now(), user_id: bio.user_id, action_type: "body_scan",
        execution_time_ms: Math.round(performance.now() - t0),
        zero_retention_flag: true, ip_address_hash: "local", created_at: new Date().toISOString(),
      });
      setCameraState("complete");
      setPoseQuality(POSE_OK);
      setProcessing(false);
      setDemo(isDemo);
      setTab("mesh");
    }, delay);
  }, []);

  const reset = () => {
    setCameraState("idle"); setPoseQuality(null); setMeasurement(null);
    setMesh(null); setBiometric(null); setAudit(null); setDemo(false); setTab("capture");
  };

  const action = (() => {
    switch (cameraState) {
      case "idle":
        return <button id="btn-start-camera" className="zf-btn zf-btn--primary zf-btn--full" onClick={startCamera}><Camera size={16} strokeWidth={1.5} />Start scan</button>;
      case "calibrating":
        return <button className="zf-btn zf-btn--primary zf-btn--full" onClick={() => { setCameraState("front_capture"); setPoseQuality(POSE_OK); }}><Ruler size={16} strokeWidth={1.5} />Confirm calibration</button>;
      case "front_capture":
        return <button id="btn-capture-front" className="zf-btn zf-btn--primary zf-btn--full" onClick={() => setCameraState("side_capture")}><Camera size={16} strokeWidth={1.5} />Capture front</button>;
      case "side_capture":
        return <button id="btn-capture-side" className="zf-btn zf-btn--primary zf-btn--full" onClick={() => finishScan(1200)}><Camera size={16} strokeWidth={1.5} />Capture side</button>;
      case "complete":
        return <button className="zf-btn zf-btn--secondary zf-btn--full" onClick={reset}><RotateCcw size={16} strokeWidth={1.5} />Rescan</button>;
      default:
        return null;
    }
  })();

  return (
    <div className="zf-app">
      <Navbar onDemoMode={() => finishScan(900, true)} isDemoMode={demo} />

      <main className="zf-main" id="dashboard-main">
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h1 className="zf-title" style={{ fontSize: "20px" }}>Biometric Studio</h1>
            <p className="zf-sub" style={{ fontSize: "12px", marginTop: "2px" }}>
              Dual-perspective anatomical extraction with real-time 3D humanoid topology.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#A3E635",
                background: "rgba(163, 230, 53, 0.08)",
                border: "1px solid rgba(163, 230, 53, 0.25)",
                padding: "4px 10px",
                borderRadius: "9999px",
              }}
            >
              <ShieldCheck size={14} strokeWidth={2} />
              Privacy Mode: Zero-Retention Active
            </span>
            <span
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--label)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "4px 10px",
                borderRadius: "9999px",
              }}
            >
              Scan Speed: {audit ? `${(audit.execution_time_ms / 1000).toFixed(1)}s` : "2.4s"}
            </span>
          </div>
        </div>

        <div className="zf-dash">
          {/* Capture */}
          <section className={`zf-col ${tab === "capture" ? "tab-active" : ""}`} aria-label="Capture">
            <div className="zf-card zf-card-pad">
              <div className="zf-section-head"><h2 className="zf-eyebrow">Capture</h2></div>
              <CameraViewfinder cameraState={cameraState} poseQuality={poseQuality} videoRef={videoRef} />
              <div style={{ marginTop: 16 }}>{action}</div>
            </div>
          </section>

          {/* Mesh */}
          <section className={`zf-col ${tab === "mesh" ? "tab-active" : ""}`} aria-label="Mesh preview">
            <div className="zf-card zf-card-pad">
              <div className="zf-section-head">
                <h2 className="zf-eyebrow">Mesh preview</h2>
                <span className="zf-pill mono">{mesh ? mesh.base_gender_mesh : "no mesh"}</span>
              </div>
              <MannequinViewer
                meshParams={mesh}
                measurement={measurement}
                isLoading={processing}
                height={560}
                activeMetric={activeMetric}
                onSelectMetric={setActiveMetric}
              />
            </div>
          </section>

          {/* Measurements + recommendation */}
          <section className={`zf-col ${tab === "metrics" ? "tab-active" : ""}`} aria-label="Measurements and recommendation">
            <MeasurementsPanel
              measurement={measurement}
              biometric={biometric}
              activeMetric={activeMetric}
              onSelectMetric={setActiveMetric}
            />
            {measurement && <RecommendationCard recommendation={DEMO_RECOMMENDATION} brand_name={DEMO_RECOMMENDATION.brand_name} />}
            <div style={{ display: "flex", gap: 10 }}>
              <button id="btn-export-dossier" className="zf-btn zf-btn--secondary" style={{ flex: 1 }} onClick={() => navigate("/tailor")}>
                <FileText size={16} strokeWidth={1.5} />Tailor dossier
              </button>
              <button id="btn-size-charts" className="zf-btn zf-btn--ghost" onClick={() => navigate("/size-charts")}>
                <Table2 size={16} strokeWidth={1.5} />Size charts
              </button>
            </div>
          </section>
        </div>
      </main>

      <nav className="zf-tabs no-print" aria-label="View selector">
        {([["capture", "Capture", ScanLine], ["mesh", "Mesh", Box], ["metrics", "Results", ListChecks]] as const).map(([k, label, Icon]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)} id={`tab-${k}`}>
            <Icon size={18} strokeWidth={1.5} />{label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;

