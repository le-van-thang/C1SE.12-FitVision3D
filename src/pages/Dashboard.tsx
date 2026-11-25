// ============================================================
// DASHBOARD STUDIO (FitVision 3D - Biometrics & AI-Tailor)
// Col 1: Photo Upload & Biometrics Input (Replaces Webcam)
// Col 2: 3D Humanoid Wireframe Topology Viewport (ZOZOFIT)
// Col 3: ISO 8559 Anthropometric Table & Quan's AI Garment Card
// ============================================================
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Table2,
  ScanLine,
  Box,
  ListChecks,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Lock,
  Sparkles,
  ArrowLeft,
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
import {
  saveFullScanSnapshot,
  loadFullScanSnapshot,
  hydrateBodyProfileFromBackend,
  clearFullScanSnapshot,
} from "../utils/bodyProfileStorage";
import { bmi } from "../data/mockData";
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
  const [searchParams] = useSearchParams();
  const cameFromStudio = searchParams.get("from") === "studio";
  const { isAuthenticated, currentUser, userRole, openSignIn } = useAuth();
  const { t } = useI18n();
  // Guests may scan + view the 3D model only. Measurements / size charts stay locked and are never stored.
  const locked = !isAuthenticated;
  const canOpenTailor = userRole === "store" || userRole === "tailor" || userRole === "admin";
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
  const [tab, setTab] = useState<Tab>("capture");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("chest_circ_cm");

  // Restore last saved scan snapshot for this authenticated account, and wipe state on logout or switch
  useEffect(() => {
    const resetScanState = () => {
      setMeasurement(null);
      setBiometric(null);
      setMesh(null);
      setGarmentRec(null);
      setAudit(null);
      setIsLiveBackend(false);
      setExecutionTime(0);
    };

    if (!isAuthenticated || !currentUser?.id) {
      resetScanState();
      return;
    }

    const applySnapshot = (saved: ReturnType<typeof loadFullScanSnapshot>) => {
      if (!saved) {
        resetScanState();
        return;
      }
      setMeasurement(saved.measurement);
      setBiometric(saved.biometric);
      setMesh(saved.mesh);
      setGarmentRec(saved.garmentRec);
      setIsLiveBackend(saved.isLiveBackend);
      setExecutionTime(saved.executionTime);
    };

    applySnapshot(loadFullScanSnapshot(currentUser.id));
    let active = true;
    void hydrateBodyProfileFromBackend(currentUser.id).then((remote) => {
      if (active && remote) applySnapshot(remote);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, currentUser?.id]);

  // Handle Photo Scan from Phone / Disk (Single Front A-Pose Image)
  const handleScan = useCallback(
    async (params: {
      frontFile: File | Blob;
      height_cm: number;
      weight_kg: number;
      gender: "male" | "female" | "neutral";
    }) => {
      if (!isAuthenticated || !currentUser?.id) {
        setLockedFeature(t("app.dash.featMeasure", "Đo 3D với Model AI SMPLer-X"));
        return;
      }
      let normalizedHeight = Number(params.height_cm) || 172;
      if (normalizedHeight > 0 && normalizedHeight < 3.0) {
        normalizedHeight = Math.round(normalizedHeight * 100.0 * 10) / 10;
      }
      const normalizedWeight = Number(params.weight_kg) || 70;
      const sanitizedParams = {
        ...params,
        height_cm: Math.min(250, Math.max(100, normalizedHeight)),
        weight_kg: Math.min(250, Math.max(30, normalizedWeight)),
      };

      const t0 = performance.now();
      setProcessing(true);

      try {
        const res = await runAiMeasurement(sanitizedParams);
        const elapsed = (performance.now() - t0) / 1000;

        const meas = res.iso_8559_measurements;
        let h = sanitizedParams.height_cm || meas.chieu_cao_cm || 172;
        if (h > 0 && h < 3.0) h = Math.round(h * 100.0 * 10) / 10;
        const w = sanitizedParams.weight_kg || meas.can_nang_kg || 70;
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
          user_id: currentUser.id,
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
          user_id: currentUser.id,
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

        // Sync scanned anthropometric profile immediately to Storefront (Homepage recommendations)
        if (currentUser?.id) {
          saveFullScanSnapshot(
            currentUser.id,
            {
              measurement: newMeasurement,
              biometric: newBiometric,
              mesh: newMesh,
              garmentRec: res.garment_size_recommendations,
              isLiveBackend: Boolean(res.is_live_backend),
              executionTime: res.execution_time_seconds || elapsed,
            },
            "scan"
          );
        }

        setAudit({
          id: Date.now(),
          user_id: currentUser?.id || "usr-current",
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
        alert(
          err instanceof Error
            ? err.message
            : "Không thể kết nối tới Model AI (Port 8000). Vui lòng kiểm tra AI Server!"
        );
      } finally {
        setProcessing(false);
      }
    },
    [currentUser?.id, isAuthenticated, t]
  );

  function dai_chan_inseam_cm_fallback(val: number | undefined, h: number): number {
    return val && val > 30 ? val : Math.round(h * 0.46 * 10) / 10;
  }

  const resetAll = () => {
    clearFullScanSnapshot(currentUser?.id);
    setMeasurement(null);
    setMesh(null);
    setBiometric(null);
    setGarmentRec(null);
    setAudit(null);
    setTab("capture");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="dashboard-main">
        {/* Top Header & Audit Badges (Sáng sủa, thời thượng, tương phản cao) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b-2 border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {t("app.dash.title", "Phòng Đo Nhân Trắc Học 3D")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {t("app.dash.sub", "Trích xuất số đo may mặc 3D tự động từ 1 ảnh chụp di động theo chuẩn quốc tế ISO 8559-1:2017.")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border-2 border-emerald-300 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ShieldCheck size={14} className="text-emerald-700" strokeWidth={2.4} />
              <span>{t("app.dash.zeroBadge", "Không lưu ảnh: Tự xóa ngay sau khi đo")}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 border-2 border-blue-300 shadow-2xs">
              <Cpu size={14} className="text-blue-700" strokeWidth={2.2} />
              <span>{isLiveBackend ? t("dashx.live", "Mô hình AI Trực Tiếp") : t("dashx.engine", "Công thức giải tích: ISO 8559")}</span>
            </span>

            {cameFromStudio && (
              <button
                type="button"
                onClick={() => navigate("/?openStudio=1&studioMode=photo")}
                className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white shadow-sm transition-all cursor-pointer"
              >
                <ArrowLeft size={13} strokeWidth={2.4} />
                <span>{t("app.dash.backToStudio", "Quay lại Phòng Thử Đồ 3D")}</span>
              </button>
            )}

            {measurement && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 shadow-2xs transition-all cursor-pointer"
              >
                <RotateCcw size={13} strokeWidth={2.2} />
                <span>{t("app.dash.retake", "Chụp lại")}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Column Studio Grid (3 cột bằng nhau 1/3 - 1/3 - 1/3 & cao đều nhau) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* COLUMN 1: Photo Upload & Biometrics Studio */}
          <section className={`lg:col-span-4 min-w-0 flex flex-col ${tab === "capture" ? "tab-active" : ""}`} aria-label="Photo Studio">
            <div className="h-full rounded-3xl border-2 border-slate-300 bg-white p-5 shadow-sm space-y-4 hover:border-slate-400 transition-all flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  {t("app.dash.uploadTitle", "TẢI ẢNH CHỤP TỪ ĐIỆN THOẠI")}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  {t("app.dash.uploadPill", "1 Ảnh A-Pose Chuẩn")}
                </span>
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
          <section className={`lg:col-span-4 min-w-0 flex flex-col relative z-0 isolate ${tab === "mesh" ? "tab-active" : ""}`} aria-label="3D Mesh preview">
            <div className="h-full rounded-3xl border-2 border-slate-300 bg-white p-5 shadow-sm space-y-3 hover:border-slate-400 transition-all relative z-0 isolate flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  {t("app.dash.meshTitle", "MÔ HÌNH 3D VÓC DÁNG")}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  {mesh
                    ? t("app.dash.meshScales", "Tỷ lệ: {c} / {w} / {h}")
                        .replace("{c}", mesh.scale_chest.toFixed(2))
                        .replace("{w}", mesh.scale_waist.toFixed(2))
                        .replace("{h}", mesh.scale_hips.toFixed(2))
                    : t("app.dash.standby", "Chế độ chờ A-Pose")}
                </span>
              </div>

              <div className="flex-1 min-h-[560px] rounded-2xl overflow-hidden relative z-0 isolate border-2 border-slate-900 bg-slate-950 shadow-inner">
                <MannequinViewer
                  meshParams={mesh}
                  measurement={locked ? null : measurement}
                  isLoading={processing}
                  height="100%"
                  activeMetric={activeMetric}
                  onSelectMetric={setActiveMetric}
                />
              </div>
            </div>
          </section>

          {/* COLUMN 3: ISO 8559 Measurements (Compact 1-column list + Quick Actions) */}
          <section
            className={`lg:col-span-4 min-w-0 flex flex-col ${tab === "metrics" ? "tab-active" : ""}`}
            aria-label="Measurements and recommendations"
          >
            {locked ? (
              <div className="h-full rounded-3xl border-2 border-slate-300 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
                {/* Locked state for guests: no measurements, no size recommendation */}
                <div
                  role="button"
                  tabIndex={0}
                  id="locked-measurements"
                  onClick={() => setLockedFeature(t("app.dash.featMeasure"))}
                  onKeyDown={(e) => e.key === "Enter" && setLockedFeature(t("app.dash.featMeasure"))}
                  className="relative cursor-pointer rounded-2xl overflow-hidden"
                >
                  <div className="filter blur-[3px] opacity-40 pointer-events-none select-none">
                    <MeasurementsPanel
                      measurement={null}
                      biometric={null}
                      activeMetric={activeMetric}
                      onSelectMetric={() => undefined}
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xs text-white">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Lock size={24} className="text-white" />
                    </div>
                    <strong className="text-sm font-black">{t("app.dash.lockedTitle", "Đăng nhập để xem số đo chi tiết")}</strong>
                    <span className="text-xs text-slate-200 max-w-xs font-medium">
                      {t("app.dash.lockedDesc", "Bảo vệ dữ liệu nhân trắc học cá nhân theo tiêu chuẩn ISO 8559.")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    id="btn-export-dossier"
                    type="button"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    onClick={() => setLockedFeature(t("app.dash.featDossier"))}
                  >
                    <Lock size={14} />
                    <span>{t("app.dash.featDossier", "Hồ sơ may đo")}</span>
                  </button>
                  <button
                    id="btn-size-charts"
                    type="button"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    onClick={() => setLockedFeature(t("app.dash.featSize"))}
                  >
                    <Lock size={14} />
                    <span>{t("app.dash.featSize", "Bảng size")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-3xl border-2 border-slate-300 bg-white p-5 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between gap-3">
                <MeasurementsPanel
                  measurement={measurement}
                  biometric={biometric}
                  activeMetric={activeMetric}
                  onSelectMetric={setActiveMetric}
                  isLiveBackend={isLiveBackend}
                />

                {/* Quick Actions */}
                <div className="flex gap-2.5 pt-2.5 border-t-2 border-slate-100">
                  {canOpenTailor && (
                    <button
                      id="btn-export-dossier"
                      type="button"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      onClick={() => navigate("/tailor")}
                    >
                      <FileText size={15} strokeWidth={2} />
                      <span>{t("app.dash.featDossier", "Hồ sơ may đo")}</span>
                    </button>
                  )}
                  <button
                    id="btn-size-charts"
                    type="button"
                    className={`${canOpenTailor ? "" : "flex-1 "}py-2.5 px-4 rounded-xl bg-[#14171C] hover:bg-blue-600 active:scale-95 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer`}
                    onClick={() => navigate("/size-charts")}
                  >
                    <Table2 size={15} strokeWidth={2} />
                    <span>{t("app.dash.featSize", "Bảng kích cỡ")}</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ROW 2: Full-width Horizontal AI Size Advisor Card (when scanned) */}
        {!locked && garmentRec && (
          <div className="mt-5 space-y-3">
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

            <div className="rounded-2xl bg-[#F5EBD8]/80 border border-[#E5D3B3] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs font-bold text-[#14171C]">
                {t(
                  "app.dash.syncedToStore",
                  "Số đo 3D của bạn đã được lưu & đồng bộ sang Sàn Thời Trang và Phòng Thử Đồ 3D."
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    navigate(cameFromStudio ? "/?openStudio=1&studioMode=photo" : "/?openStudio=1")
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Sparkles size={13} />
                  <span>
                    {cameFromStudio
                      ? t("app.dash.returnStudioWithMeasures", "Quay lại Phòng Thử Đồ 3D →")
                      : t("app.dash.openStudioNow", "Thử đồ 3D với số đo mới →")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-3.5 py-2 rounded-xl bg-[#14171C] hover:bg-slate-800 text-white text-xs font-black transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t("app.dash.browseMatches", "Xem đồ hợp dáng trên Sàn →")}
                </button>
              </div>
            </div>
          </div>
        )}
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
