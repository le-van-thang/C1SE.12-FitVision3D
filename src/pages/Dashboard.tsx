// ============================================================
// DASHBOARD STUDIO (FitVision 3D - Biometrics & AI-Tailor)
// Col 1: Photo Upload & Biometrics Input (Replaces Webcam)
// Col 2: 3D Humanoid Wireframe Topology Viewport (ZOZOFIT)
// Col 3: ISO 8559 Anthropometric Table & Quan's AI Garment Card
// ============================================================
import React, { useState, useCallback } from "react";
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
  Lock,
} from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { LoginRequiredDialog } from "../components/common/LoginRequiredDialog";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { PhotoUploadCapture } from "../features/capture/PhotoUploadCapture";
import { MannequinViewer, type MetricKey } from "../features/avatar3d/MannequinViewer";
import { MeasurementsPanel } from "../features/anthropometry/MeasurementsPanel";
import { AiGarmentCard } from "../features/anthropometry/AiGarmentCard";
import { runAiMeasurement, type AiMeasurementResponse } from "../services/aiService";
import { recommendGarmentSizes } from "../utils/garmentSizeCalculator";
import { DEMO_BIOMETRIC, DEMO_MEASUREMENT, DEMO_MESH, bmi } from "../data/mockData";
import type { BiometricInput, Measurement, MeshParameter, SystemAuditLog } from "../types/database.types";

type Tab = "capture" | "mesh" | "metrics";

/** Biometric inputs cached from landing page */
const loadInitialBiometric = (): { height?: number; weight?: number; gender: "male" | "female" | "neutral" } => {
  try {
    const raw = sessionStorage.getItem("fv3d_estimator");
    if (!raw) return { height: undefined, weight: undefined, gender: "male" };
    const e = JSON.parse(raw);
    return {
      height: e.stature_cm ? Number(e.stature_cm) : undefined,
      weight: e.weight_kg ? Number(e.weight_kg) : undefined,
      gender: (e.gender === "female" ? "female" : "male") as "male" | "female",
    };
  } catch {
    return { height: undefined, weight: undefined, gender: "male" };
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openSignIn } = useAuth();
  const { t } = useI18n();
  // Guests may scan + view the 3D model only. Measurements / size charts stay locked and are never stored.
  const locked = !isAuthenticated;
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const initBio = loadInitialBiometric();

  const [measurement, setMeasurement] = useState<Measurement | null>(null);
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

  // Handle Photo Scan from Phone / Disk (Single Front A-Pose Image)
  const handleScan = useCallback(
    async (params: {
      frontFile: File | Blob;
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
        let h = params.height_cm || meas.chieu_cao_cm || 172;
        if (h > 0 && h < 3.0) h = Math.round(h * 100.0 * 10) / 10;
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

        const extMeas = meas as typeof meas & {
          vong_bap_tay_cm?: number;
          vong_co_tay_cm?: number;
          vong_dui_cm?: number;
          vong_bap_chan_cm?: number;
          vong_co_chan_cm?: number;
        };

        const newMeasurement: Measurement = {
          id: `meas-${Date.now()}`,
          user_id: "usr-current",
          input_id: `inp-${Date.now()}`,
          chest_circ_cm: meas.vong_nguc_cm,
          waist_circ_cm: meas.vong_eo_cm,
          hip_circ_cm: meas.vong_mong_cm,
          shoulder_breadth_cm: meas.rong_vai_cm,
          inseam_cm: dai_chan_inseam_cm_fallback(meas.dai_chan_inseam_cm, h),
          arm_length_cm: meas.dai_tay_cm,
          bicep_circ_cm: meas.vong_bap_tay_cm ?? extMeas.vong_bap_tay_cm ?? null,
          wrist_circ_cm: meas.vong_co_tay_cm ?? extMeas.vong_co_tay_cm ?? null,
          thigh_circ_cm: meas.vong_dui_cm ?? extMeas.vong_dui_cm ?? null,
          calf_circ_cm: meas.vong_bap_chan_cm ?? extMeas.vong_bap_chan_cm ?? null,
          ankle_circ_cm: meas.vong_co_chan_cm ?? extMeas.vong_co_chan_cm ?? null,
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

  function dai_chan_inseam_cm_fallback(val: number | undefined, h: number): number {
    return val && val > 30 ? val : Math.round(h * 0.46 * 10) / 10;
  }

  // Load Demo Data for fast preview
  const handleLoadDemo = useCallback(() => {
    setDemo(true);
    setBiometric(DEMO_BIOMETRIC);
    setMeasurement({
      ...DEMO_MEASUREMENT,
      arm_length_cm: 58.5,
    });
    setMesh(DEMO_MESH);

    const demoSizing = recommendGarmentSizes({
      gender: "male",
      height_cm: DEMO_BIOMETRIC.stature_cm,
      weight_kg: DEMO_BIOMETRIC.weight_kg,
      chest_cm: DEMO_MEASUREMENT.chest_circ_cm,
      waist_cm: DEMO_MEASUREMENT.waist_circ_cm,
      hips_cm: DEMO_MEASUREMENT.hip_circ_cm,
      shoulder_cm: DEMO_MEASUREMENT.shoulder_breadth_cm ?? undefined,
      inseam_cm: DEMO_MEASUREMENT.inseam_cm ?? undefined,
    });

    setGarmentRec({
      topwear_shirt_size: demoSizing.topwear.recommended_label,
      bottomwear_trouser_size: demoSizing.bottomwear.tag,
      waist_inches: demoSizing.bottomwear.waist_inches,
      inseam_inches: demoSizing.bottomwear.inseam_inches,
      body_shape_classification: demoSizing.body_shape_classification,
      ease_allowance_recommendation: demoSizing.ease_allowance_recommendation,
      topwear: demoSizing.topwear,
      bottomwear: demoSizing.bottomwear,
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
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <h1 className="zf-title" style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              {t("app.dash.title")}
            </h1>
            <p className="zf-sub" style={{ fontSize: "13px", marginTop: "4px", color: "#94A3B8" }}>
              {t("app.dash.sub")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#4ADE80",
                background: "rgba(74, 222, 128, 0.12)",
                border: "1.5px solid rgba(74, 222, 128, 0.4)",
                padding: "5px 12px",
                borderRadius: "9999px",
                boxShadow: "0 0 12px rgba(74, 222, 128, 0.2)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ShieldCheck size={14} strokeWidth={2.4} />
              {t("app.dash.zeroBadge")}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: isLiveBackend ? "#34d399" : "#38bdf8",
                background: isLiveBackend ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)",
                border: isLiveBackend ? "1.5px solid rgba(16, 185, 129, 0.45)" : "1.5px solid rgba(56, 189, 248, 0.4)",
                padding: "5px 12px",
                borderRadius: "9999px",
                boxShadow: "0 0 12px rgba(56, 189, 248, 0.2)",
              }}
            >
              <Cpu size={14} strokeWidth={2.2} />
              {isLiveBackend ? t("dashx.live") : t("dashx.engine")}
            </span>

            {measurement && (
              <button
                type="button"
                onClick={resetAll}
                className="zf-btn"
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  height: "32px",
                  fontWeight: 700,
                  color: "#FB7185",
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1.5px solid rgba(244, 63, 94, 0.4)",
                  borderRadius: "8px",
                }}
              >
                <RotateCcw size={13} strokeWidth={2.2} /> {t("app.dash.retake")}
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
                <h2 className="zf-eyebrow">{t("app.dash.uploadTitle")}</h2>
                <span className="zf-pill zf-pill--teal">{t("app.dash.uploadPill")}</span>
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
                <h2 className="zf-eyebrow">{t("app.dash.meshTitle")}</h2>
                <span className="zf-pill mono">
                  {mesh
                    ? t("app.dash.meshScales")
                        .replace("{c}", mesh.scale_chest.toFixed(2))
                        .replace("{w}", mesh.scale_waist.toFixed(2))
                        .replace("{h}", mesh.scale_hips.toFixed(2))
                    : t("app.dash.standby")}
                </span>
              </div>

              <MannequinViewer
                meshParams={mesh}
                measurement={locked ? null : measurement}
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
            {locked ? (
              <>
                {/* Locked state for guests: no measurements, no size recommendation */}
                <div
                  role="button"
                  tabIndex={0}
                  id="locked-measurements"
                  onClick={() => setLockedFeature(t("app.dash.featMeasure"))}
                  onKeyDown={(e) => e.key === "Enter" && setLockedFeature(t("app.dash.featMeasure"))}
                  style={{ position: "relative", cursor: "pointer" }}
                >
                  <div style={{ filter: "blur(3px)", opacity: 0.45, pointerEvents: "none", userSelect: "none" }}>
                    <MeasurementsPanel
                      measurement={null}
                      biometric={null}
                      activeMetric={activeMetric}
                      onSelectMetric={() => undefined}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      textAlign: "center",
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(10, 15, 18, 0.55)",
                    }}
                  >
                    <Lock size={26} style={{ color: "#4FD1C5" }} />
                    <strong style={{ fontSize: 14 }}>{t("app.dash.lockedTitle")}</strong>
                    <span style={{ fontSize: 12, color: "#94A3B8", maxWidth: 240 }}>
                      {t("app.dash.lockedDesc")}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                  <button
                    id="btn-export-dossier"
                    className="zf-btn zf-btn--secondary"
                    style={{
                      flex: 1,
                      border: "1.5px solid rgba(56, 189, 248, 0.45)",
                      background: "rgba(56, 189, 248, 0.1)",
                      color: "#38BDF8",
                      fontWeight: 700,
                      boxShadow: "0 0 14px rgba(56, 189, 248, 0.2)",
                    }}
                    onClick={() => setLockedFeature(t("app.dash.featDossier"))}
                  >
                    <Lock size={15} strokeWidth={2} /> {t("app.dash.featDossier")}
                  </button>
                  <button
                    id="btn-size-charts"
                    className="zf-btn"
                    style={{
                      border: "1.5px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#FFFFFF",
                      fontWeight: 700,
                    }}
                    onClick={() => setLockedFeature(t("app.dash.featSize"))}
                  >
                    <Lock size={15} strokeWidth={2} /> {t("app.dash.featSize")}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ISO 8559 Anthropometric Table */}
                <MeasurementsPanel
                  measurement={measurement}
                  biometric={biometric}
                  activeMetric={activeMetric}
                  onSelectMetric={setActiveMetric}
                  isLiveBackend={isLiveBackend}
                />

                {/* Quan's AI Garment Recommendation Card */}
                {garmentRec ? (
                  <AiGarmentCard
                    data={garmentRec}
                    executionTime={executionTime}
                    isLiveBackend={isLiveBackend}
                    measurements={
                      measurement
                        ? {
                            chieu_cao_cm: biometric?.stature_cm || 172,
                            vong_nguc_cm: measurement.chest_circ_cm,
                            vong_eo_cm: measurement.waist_circ_cm,
                            vong_mong_cm: measurement.hip_circ_cm,
                            rong_vai_cm: measurement.shoulder_breadth_cm,
                            dai_chan_inseam_cm: measurement.inseam_cm,
                            can_nang_kg: biometric?.weight_kg || 70,
                          }
                        : undefined
                    }
                    gender={
                      biometric?.gender === "female"
                        ? "female"
                        : biometric?.gender === "male"
                        ? "male"
                        : "neutral"
                    }
                  />
                ) : (
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "12px",
                      border: "1.5px dashed rgba(56, 189, 248, 0.3)",
                      background: "rgba(56, 189, 248, 0.04)",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "12.5px",
                      marginTop: "12px",
                    }}
                  >
                    <Sparkles size={22} style={{ color: "#38bdf8", margin: "0 auto 8px" }} />
                    {t("app.dash.emptyRec")}
                  </div>
                )}

                {/* Quick Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                  <button
                    id="btn-export-dossier"
                    className="zf-btn zf-btn--primary"
                    style={{ flex: 1 }}
                    onClick={() => navigate("/tailor")}
                  >
                    <FileText size={16} strokeWidth={2} /> {t("app.dash.featDossier")}
                  </button>
                  <button
                    id="btn-size-charts"
                    className="zf-btn zf-btn--secondary"
                    onClick={() => navigate("/size-charts")}
                  >
                    <Table2 size={16} strokeWidth={2} /> {t("app.dash.featSize")}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <LoginRequiredDialog
        open={lockedFeature !== null}
        feature={lockedFeature ?? undefined}
        onBack={() => setLockedFeature(null)}
        onSignIn={() => {
          setLockedFeature(null);
          openSignIn();
        }}
      />

      {/* Mobile Bottom Tab Navigation */}
      <nav className="zf-tabs no-print" aria-label="View selector">
        {(
          [
            ["capture", t("app.dash.tabUpload"), ScanLine],
            ["mesh", t("app.dash.tabMesh"), Box],
            ["metrics", t("app.dash.tabMetrics"), ListChecks],
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
