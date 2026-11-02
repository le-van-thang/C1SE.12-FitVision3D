// ============================================================
// DASHBOARD STUDIO (FitVision 3D - Biometrics & AI-Tailor)
// Col 1: Photo Upload & Biometrics Input (Replaces Webcam)
// Col 2: 3D Humanoid Wireframe Topology Viewport (ZOZOFIT)
// Col 3: ISO 8559 Anthropometric Table & Quan's AI Garment Card
// ============================================================
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Table2,
  ScanLine,
  Box,
  ListChecks,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { PhotoUploadCapture } from "../features/capture/PhotoUploadCapture";
import { MannequinViewer, type MetricKey } from "../features/avatar3d/MannequinViewer";
import { MeasurementsPanel } from "../features/anthropometry/MeasurementsPanel";
import { AiGarmentCard } from "../features/anthropometry/AiGarmentCard";
import { runAiMeasurement, type AiMeasurementResponse } from "../services/aiService";
import { DEMO_BIOMETRIC, DEMO_MEASUREMENT, DEMO_MESH, bmi } from "../data/mockData";
import type { BiometricInput, Measurement, MeshParameter, SystemAuditLog } from "../types/database.types";

type Tab = "capture" | "mesh" | "metrics";

/** Biometric inputs cached from landing page */
const loadInitialBiometric = (): { height: number; weight: number; gender: "male" | "female" | "neutral" } => {
  try {
    const raw = sessionStorage.getItem("fv3d_estimator");
    if (!raw) return { height: 172, weight: 70, gender: "male" };
    const e = JSON.parse(raw);
    return {
      height: Number(e.stature_cm) || 172,
      weight: Number(e.weight_kg) || 70,
      gender: (e.gender === "female" ? "female" : "male") as "male" | "female",
    };
  } catch {
    return { height: 172, weight: 70, gender: "male" };
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const initBio = loadInitialBiometric();

  const [measurement, setMeasurement] = useState<(Measurement & { arm_length_cm?: number | null }) | null>(null);
  const [mesh, setMesh] = useState<MeshParameter | null>(null);
  const [biometric, setBiometric] = useState<BiometricInput | null>(null);
  const [garmentRec, setGarmentRec] = useState<AiMeasurementResponse["garment_size_recommendations"] | null>(null);
  const [audit, setAudit] = useState<SystemAuditLog | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [executionTime, setExecutionTime] = useState(1.25);
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState<Tab>("capture");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("chest_circ_cm");

  // Handle Photo Scan from Phone / Disk
  const handleScan = useCallback(
    async (params: {
      frontFile: File | Blob;
      sideFile?: File | Blob | null;
      height_cm: number;
      weight_kg: number;
      gender: "male" | "female" | "neutral";
    }) => {
      const t0 = performance.now();
      setProcessing(true);

      try {
        const res = await runAiMeasurement(params);
        const elapsed = (performance.now() - t0) / 1000;

        const meas = res.iso_8559_measurements;
        const h = params.height_cm || meas.chieu_cao_cm || 172;
        const w = params.weight_kg || meas.can_nang_kg || 70;
        const calcBmi = bmi(w, h);

        // Anthropometric scaling for 3D Mannequin
        // Base reference: chest 88cm, waist 80cm, hips 94cm
        const scale_chest = Math.round((meas.vong_nguc_cm / 88.0) * 1000) / 1000;
        const scale_waist = Math.round((meas.vong_eo_cm / 80.0) * 1000) / 1000;
        const scale_hips = Math.round((meas.vong_mong_cm / 94.0) * 1000) / 1000;

        const newMesh: MeshParameter = {
          id: `mesh-${Date.now()}`,
          measurement_id: `meas-${Date.now()}`,
          base_gender_mesh:
            params.gender === "female"
              ? "female_base"
              : params.gender === "male"
              ? "male_base"
              : "neutral_base",
          scale_chest,
          scale_waist,
          scale_hips,
          morph_payload: {
            scale_chest,
            scale_waist,
            scale_hips,
          },
          created_at: new Date().toISOString(),
        };

        const newMeasurement: Measurement & { arm_length_cm: number } = {
          id: `meas-${Date.now()}`,
          user_id: "usr-current",
          input_id: `inp-${Date.now()}`,
          chest_circ_cm: meas.vong_nguc_cm,
          waist_circ_cm: meas.vong_eo_cm,
          hip_circ_cm: meas.vong_mong_cm,
          shoulder_breadth_cm: meas.rong_vai_cm,
          inseam_cm: meas.dai_chan_inseam_cm,
          arm_length_cm: meas.dai_tay_cm,
          extraction_confidence: res.is_live_backend ? 0.98 : 0.94,
          created_at: new Date().toISOString(),
        };

        const newBiometric: BiometricInput = {
          id: `bio-${Date.now()}`,
          user_id: "usr-current",
          stature_cm: h,
          weight_kg: w,
          gender: params.gender === "male" ? "male" : params.gender === "female" ? "female" : "other",
          calculated_bmi: calcBmi,
          created_at: new Date().toISOString(),
        };

        setMesh(newMesh);
        setMeasurement(newMeasurement);
        setBiometric(newBiometric);
        setGarmentRec(res.garment_size_recommendations);
        setIsLiveBackend(Boolean(res.is_live_backend));
        setExecutionTime(res.execution_time_seconds || elapsed);

        setAudit({
          id: Date.now(),
          user_id: "usr-current",
          action_type: "body_scan",
          execution_time_ms: Math.round(elapsed * 1000),
          zero_retention_flag: true,
          ip_address_hash: "local",
          created_at: new Date().toISOString(),
        });

        // Switch to mesh view on smaller screens
        setTab("mesh");
      } catch (err) {
        console.error("Lỗi trích xuất đo đạc:", err);
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  // Load Demo Data for fast preview
  const handleLoadDemo = useCallback(() => {
    setDemo(true);
    setBiometric(DEMO_BIOMETRIC);
    setMeasurement({
      ...DEMO_MEASUREMENT,
      arm_length_cm: 58.5,
    });
    setMesh(DEMO_MESH);
    setGarmentRec({
      topwear_shirt_size: "M",
      bottomwear_trouser_size: "Size 31 (31W x 31L)",
      waist_inches: 31,
      inseam_inches: 31,
      body_shape_classification: "V-Shape / Athletic (Thể thao, ngực nở eo thon)",
      ease_allowance_recommendation: {
        slim_fit_chest_cm: 97.4,
        regular_fit_chest_cm: 100.4,
        trouser_waist_ease_cm: 80.8,
      },
    });
    setIsLiveBackend(false);
    setExecutionTime(0.85);
  }, []);

  const resetAll = () => {
    setMeasurement(null);
    setMesh(null);
    setBiometric(null);
    setGarmentRec(null);
    setAudit(null);
    setDemo(false);
    setTab("capture");
  };

  return (
    <div className="zf-app">
      <Navbar onDemoMode={handleLoadDemo} isDemoMode={demo} />

      <main className="zf-main" id="dashboard-main">
        {/* Top Header & Audit Badges */}
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
            <h1 className="zf-title" style={{ fontSize: "20px" }}>
              Studio Nhân Trắc Học 3D (AI-Tailor Studio)
            </h1>
            <p className="zf-sub" style={{ fontSize: "12px", marginTop: "2px" }}>
              Trích xuất số đo may mặc tự động từ ảnh chụp di động theo chuẩn quốc tế ISO 8559-1:2017.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
              Zero-Retention: Ảnh không lưu máy chủ
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: isLiveBackend ? "#34d399" : "#38bdf8",
                background: isLiveBackend ? "rgba(16, 185, 129, 0.1)" : "rgba(56, 189, 248, 0.1)",
                border: isLiveBackend ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(56, 189, 248, 0.25)",
                padding: "4px 10px",
                borderRadius: "9999px",
              }}
            >
              <Cpu size={14} />
              {isLiveBackend ? "FastAPI SMPLer-X: Online" : "AI Engine: ISO 8559"}
            </span>

            {measurement && (
              <button
                type="button"
                onClick={resetAll}
                className="zf-btn zf-btn--ghost"
                style={{ padding: "4px 10px", fontSize: "12px", height: "auto" }}
              >
                <RotateCcw size={13} /> Chụp lại / Đo lại
              </button>
            )}
          </div>
        </div>

        {/* 3-Column Studio Grid */}
        <div className="zf-dash">
          {/* COLUMN 1: Photo Upload & Biometrics Studio */}
          <section className={`zf-col ${tab === "capture" ? "tab-active" : ""}`} aria-label="Photo Studio">
            <div className="zf-card zf-card-pad">
              <div className="zf-section-head" style={{ marginBottom: "12px" }}>
                <h2 className="zf-eyebrow">Tải ảnh chụp từ điện thoại</h2>
                <span className="zf-pill zf-pill--teal">A-Pose 2.5m - 3m</span>
              </div>

              <PhotoUploadCapture
                onScan={handleScan}
                isProcessing={processing}
                initialHeight={initBio.height}
                initialWeight={initBio.weight}
                initialGender={initBio.gender}
              />
            </div>
          </section>

          {/* COLUMN 2: 3D Humanoid Wireframe Topology Viewport */}
          <section className={`zf-col ${tab === "mesh" ? "tab-active" : ""}`} aria-label="3D Mesh preview">
            <div className="zf-card zf-card-pad" style={{ position: "relative" }}>
              <div className="zf-section-head">
                <h2 className="zf-eyebrow">Hình Thể 3D ZOZOFIT</h2>
                <span className="zf-pill mono">
                  {mesh
                    ? `Chest x${mesh.scale_chest.toFixed(2)} · Waist x${mesh.scale_waist.toFixed(2)} · Hips x${mesh.scale_hips.toFixed(2)}`
                    : "A-Pose Standby"}
                </span>
              </div>

              <MannequinViewer
                meshParams={mesh}
                measurement={measurement}
                isLoading={processing}
                height={580}
                activeMetric={activeMetric}
                onSelectMetric={setActiveMetric}
              />
            </div>
          </section>

          {/* COLUMN 3: ISO 8559 Measurements & Quan's Garment Recommendation */}
          <section
            className={`zf-col ${tab === "metrics" ? "tab-active" : ""}`}
            aria-label="Measurements and recommendations"
          >
            {/* ISO 8559 Anthropometric Table */}
            <MeasurementsPanel
              measurement={measurement}
              biometric={biometric}
              activeMetric={activeMetric}
              onSelectMetric={setActiveMetric}
            />

            {/* Quan's AI Garment Recommendation Card */}
            {garmentRec ? (
              <AiGarmentCard
                data={garmentRec}
                executionTime={executionTime}
                isLiveBackend={isLiveBackend}
              />
            ) : (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px dashed rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.02)",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              >
                <Sparkles size={20} style={{ color: "#38bdf8", margin: "0 auto 8px" }} />
                Tải ảnh và nhấn "Phân tích &amp; Dựng hình thể 3D" để nhận tư vấn size quần áo và số đo may mặc tự động.
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                id="btn-export-dossier"
                className="zf-btn zf-btn--secondary"
                style={{ flex: 1 }}
                onClick={() => navigate("/tailor")}
              >
                <FileText size={16} strokeWidth={1.5} /> Hồ sơ may đo
              </button>
              <button
                id="btn-size-charts"
                className="zf-btn zf-btn--ghost"
                onClick={() => navigate("/size-charts")}
              >
                <Table2 size={16} strokeWidth={1.5} /> Bảng size
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="zf-tabs no-print" aria-label="View selector">
        {(
          [
            ["capture", "Chụp / Tải ảnh", ScanLine],
            ["mesh", "Mô hình 3D", Box],
            ["metrics", "Kết quả số đo", ListChecks],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
            id={`tab-${k}`}
          >
            <Icon size={18} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
