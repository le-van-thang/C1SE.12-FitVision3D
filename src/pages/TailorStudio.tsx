// ============================================================
// TAILOR STUDIO (B2B BESPOKE ATELIER)
// Client biometric dossiers, 3D body morphing & precision specs
// Integrated: Dossier Code · QR Code Exchange · E2EE Token Security
// ============================================================
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  FileDown,
  KeyRound,
  Search,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  Ticket,
  Sparkles,
  X,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { useI18n } from "../i18n";
import { MeshViewport } from "../features/anthropometry/MeshViewport";
import { DOSSIERS, bmi, type DossierRecord } from "../data/mockData";
import { commerceApi } from "../services/commerceApi";
import type { Order } from "../features/ecommerce/types";

const Spec: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="zf-row">
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

const cm = (n: number | null) => (n == null ? "—" : <>{n.toFixed(1)}<em>cm</em></>);
const fmtDate = (iso: string) =>
  new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";

/**
 * Deterministic SVG QR-Code Generator for a given string token
 * Draws a sharp 25x25 matrix with finder patterns and central brand badge
 */
const SvgQrCode: React.FC<{ text: string; size?: number }> = ({ text, size = 180 }) => {
  const matrix = useMemo(() => {
    const N = 25;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // Helper: mark 7x7 finder pattern
    const markFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };

    markFinder(0, 0);       // Top-Left
    markFinder(0, N - 7);   // Top-Right
    markFinder(N - 7, 0);   // Bottom-Left

    // Timing patterns
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Deterministic hash filling based on token
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const inTL = r < 8 && c < 8;
        const inTR = r < 8 && c >= N - 8;
        const inBL = r >= N - 8 && c < 8;
        const inCenter = r >= 10 && r <= 14 && c >= 10 && c <= 14;
        if (inTL || inTR || inBL || inCenter) continue;

        // Pseudo-random bit from hash and coordinates
        const bit = ((hash ^ (r * 31 + c * 17)) & 1) === 1;
        grid[r][c] = bit;
      }
    }
    return grid;
  }, [text]);

  const N = matrix.length;
  const cellSize = size / N;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", borderRadius: "10px", background: "#FFFFFF", padding: "10px" }}
    >
      {matrix.map((row, r) =>
        row.map((val, c) => {
          if (!val) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.15}
              height={cellSize + 0.15}
              fill="#0A0F12"
            />
          );
        })
      )}
      {/* Central Brand Badge */}
      <rect
        x={10 * cellSize}
        y={10 * cellSize}
        width={5 * cellSize}
        height={5 * cellSize}
        rx={cellSize * 0.8}
        fill="#0A0F12"
      />
      <text
        x={12.5 * cellSize}
        y={13.2 * cellSize}
        textAnchor="middle"
        fill="#38BDF8"
        fontSize={cellSize * 2.2}
        fontWeight="800"
        fontFamily="sans-serif"
      >
        3D
      </text>
    </svg>
  );
};

function orderToDossier(order: Order): DossierRecord | null {
  const s = order.measurement_snapshot;
  if (!s) return null;
  const gender: "male" | "female" | "other" =
    s.gender === "female" ? "female" : s.gender === "neutral" ? "other" : "male";
  const stature = Number(s.stature_cm || 170);
  const weight = Number(s.weight_kg || 65);
  const chest = Number(s.chest_circ_cm || 92);
  const waist = Number(s.waist_circ_cm || 78);
  const hips = Number(s.hip_circ_cm || 94);
  return {
    profile: {
      id: order.customer_id || `cust-${order.id}`,
      full_name: order.recipient?.full_name || order.customer_name || `Khách #${order.id}`,
      email: order.recipient?.phone
        ? `SĐT: ${order.recipient.phone}${order.recipient.note ? ` · ${order.recipient.note}` : ""}`
        : `Đơn hàng #${order.id}`,
      role: "customer",
      avatar_url: null,
      created_at: order.created_at,
      updated_at: order.created_at,
    },
    biometric: {
      id: `bio-${order.id}`,
      user_id: order.customer_id || `cust-${order.id}`,
      stature_cm: stature,
      weight_kg: weight,
      gender,
      calculated_bmi: s.calculated_bmi ?? bmi(weight, stature),
      created_at: s.captured_at || order.created_at,
    },
    measurement: {
      id: `mea-${order.id}`,
      user_id: order.customer_id || `cust-${order.id}`,
      input_id: `bio-${order.id}`,
      chest_circ_cm: chest,
      waist_circ_cm: waist,
      hip_circ_cm: hips,
      shoulder_breadth_cm: s.shoulder_breadth_cm ?? 43,
      arm_length_cm: s.arm_length_cm ?? 58,
      inseam_cm: s.inseam_cm ?? 77,
      bicep_circ_cm: s.bicep_circ_cm ?? null,
      wrist_circ_cm: s.wrist_circ_cm ?? null,
      thigh_circ_cm: s.thigh_circ_cm ?? null,
      calf_circ_cm: s.calf_circ_cm ?? null,
      ankle_circ_cm: s.ankle_circ_cm ?? null,
      extraction_confidence: 0.96,
      created_at: s.captured_at || order.created_at,
    },
    mesh: {
      id: `msh-${order.id}`,
      measurement_id: `mea-${order.id}`,
      base_gender_mesh: gender === "female" ? "female_base" : gender === "male" ? "male_base" : "neutral_base",
      scale_chest: Math.round((chest / 88) * 1000) / 1000,
      scale_waist: Math.round((waist / 80) * 1000) / 1000,
      scale_hips: Math.round((hips / 94) * 1000) / 1000,
      morph_payload: null,
      created_at: s.captured_at || order.created_at,
    },
    dossier: {
      id: `dos-${order.id}`,
      measurement_id: `mea-${order.id}`,
      tailor_id: "usr-tailor-live",
      access_token: `fv3d_order_${order.id.toLowerCase().replace(/[^a-z0-9]/g, "")}_live_token`,
      token_expires_at: "2027-12-31T23:59:59Z",
      pdf_export_url: null,
      created_at: order.created_at,
    },
    dossier_code: order.id,
  };
}

export const TailorStudio: React.FC = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const requestedOrderId = searchParams.get("orderId");

  const [dossiers, setDossiers] = useState<DossierRecord[]>(() => [...DOSSIERS]);
  const [idx, setIdx] = useState(0);
  const [inputVal, setInputVal] = useState(DOSSIERS[0].dossier_code);
  const [showFullToken, setShowFullToken] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<"code" | "token" | "link" | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const dashRes = await commerceApi.getShopDashboard();
      const rawOrders: Order[] =
        dashRes.success && dashRes.data?.orders
          ? dashRes.data.orders
          : await commerceApi.getOrders().then((r) => (r.success && Array.isArray(r.data) ? r.data : []));
      if (!active) return;

      const liveRecords = rawOrders
        .map(orderToDossier)
        .filter((d): d is DossierRecord => d !== null);

      if (liveRecords.length > 0) {
        const merged = [...liveRecords, ...DOSSIERS];
        setDossiers(merged);
        if (requestedOrderId) {
          const hitIdx = merged.findIndex(
            (d) => d.dossier_code.toLowerCase() === requestedOrderId.toLowerCase()
          );
          if (hitIdx >= 0) {
            setIdx(hitIdx);
            setInputVal(merged[hitIdx].dossier_code);
            setNotice({
              kind: "ok",
              text: `Đã nạp số đo thật từ đơn hàng ${merged[hitIdx].dossier_code} · ${merged[hitIdx].profile.full_name}`,
            });
            return;
          }
        }
        setIdx(0);
        setInputVal(merged[0].dossier_code);
      }
    })();
    return () => {
      active = false;
    };
  }, [requestedOrderId]);

  const rec = dossiers[idx] || DOSSIERS[0];
  const { profile, biometric: b, measurement: m, mesh, dossier, dossier_code } = rec;

  const copyToClipboard = (text: string, type: "code" | "token" | "link") => {
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const authenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim().toLowerCase();
    if (!query) return setNotice({ kind: "err", text: "Vui lòng nhập mã hồ sơ hoặc token." });

    // Match by dossier_code (e.g. FV-8492-AN or FV3D-12345) OR full access_token
    const hit = dossiers.findIndex(
      (d) =>
        d.dossier_code.toLowerCase() === query ||
        d.dossier_code.toLowerCase().includes(query) ||
        d.dossier.access_token.toLowerCase() === query ||
        d.profile.full_name.toLowerCase().includes(query)
    );

    if (hit < 0) {
      return setNotice({
        kind: "err",
        text: `Không tìm thấy hồ sơ với mã "${inputVal}". Vui lòng thử FV-8492-AN hoặc chọn từ danh sách.`,
      });
    }

    if (new Date(dossiers[hit].dossier.token_expires_at) < new Date()) {
      return setNotice({ kind: "err", text: "Mã hồ sơ này đã hết hạn hiệu lực." });
    }

    setIdx(hit);
    setInputVal(dossiers[hit].dossier_code);
    setNotice({
      kind: "ok",
      text: `Đã xác thực thành công hồ sơ ${dossiers[hit].dossier_code} · ${dossiers[hit].profile.full_name}`,
    });
  };

  const pick = (i: number) => {
    setIdx(i);
    setInputVal(dossiers[i].dossier_code);
    setNotice(null);
  };

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("FITVISION 3D - BESPOKE TECH PACK (ISO 8559-1)", 15, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Order / Dossier Code: ${dossier_code}`, 15, 32);
      doc.text(`Customer: ${profile.full_name}`, 15, 39);
      doc.text(`Contact / Notes: ${profile.email}`, 15, 46);
      doc.text(`Gender Base: ${mesh.base_gender_mesh} | Height: ${b.stature_cm} cm | Weight: ${b.weight_kg} kg | BMI: ${b.calculated_bmi ?? "-"}`, 15, 53);

      doc.setDrawColor(180);
      doc.line(15, 58, 195, 58);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("BODY MEASUREMENTS (CM)", 15, 68);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const rows: [string, number | null | undefined][] = [
        ["Chest Circumference", m.chest_circ_cm],
        ["Waist Circumference", m.waist_circ_cm],
        ["Hip Circumference", m.hip_circ_cm],
        ["Shoulder Breadth", m.shoulder_breadth_cm],
        ["Arm Length", m.arm_length_cm],
        ["Inseam", m.inseam_cm],
        ["Bicep Circumference", m.bicep_circ_cm],
        ["Wrist Circumference", m.wrist_circ_cm],
        ["Thigh Circumference", m.thigh_circ_cm],
        ["Calf Circumference", m.calf_circ_cm],
        ["Ankle Circumference", m.ankle_circ_cm],
      ];
      let y = 76;
      for (const [label, val] of rows) {
        doc.text(`${label}:`, 18, y);
        doc.text(val != null ? `${Number(val).toFixed(1)} cm` : "-", 95, y);
        y += 7;
      }

      doc.line(15, y + 4, 195, y + 4);
      doc.setFont("helvetica", "bold");
      doc.text("3D MESH MORPH SCALES", 15, y + 14);
      doc.setFont("helvetica", "normal");
      doc.text(`Chest Scale: ${mesh.scale_chest.toFixed(3)}   Waist Scale: ${mesh.scale_waist.toFixed(3)}   Hips Scale: ${mesh.scale_hips.toFixed(3)}`, 15, y + 22);
      doc.setFontSize(9);
      doc.text(`Generated by FitVision 3D Tailor Studio at ${new Date().toISOString()}`, 15, 280);
      doc.save(`TechPack-${dossier_code}.pdf`);
    } catch {
      dossier.pdf_export_url ? window.open(dossier.pdf_export_url, "_blank") : window.print();
    }
  };

  const maskedToken = `fv3d_tok_••••••••••••${dossier.access_token.slice(-6)}`;

  return (
    <div className="zf-app">
      <Navbar />

      <main className="zf-main zf-main--tailor" style={{ paddingTop: "36px" }}>
        {/* Top Header */}
        <div style={{ marginBottom: 20 }} className="no-print">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 className="zf-title">{t("tailor.title")}</h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#38BDF8",
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  <Sparkles size={12} /> {t("tailor.badge")}
                </span>
              </div>
              <p className="zf-sub">
                {t("tailor.subtitle")}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                {t("tailor.privacy")}
              </span>
              <span className="zf-pill mono">{t("tailor.iso")}</span>
            </div>
          </div>
        </div>

        {/* ── Modern Dossier Control Bar (Code · QR · E2EE Security) ── */}
        <div
          className="zf-card zf-card-pad no-print"
          style={{
            marginBottom: 24,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "linear-gradient(180deg, rgba(22, 34, 41, 0.7) 0%, rgba(17, 25, 30, 0.95) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              alignItems: "center",
            }}
          >
            {/* 1. Quick Dossier Identifier & QR Launcher */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                background: "rgba(10, 15, 18, 0.75)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.12)",
                  display: "grid",
                  placeItems: "center",
                  color: "#38BDF8",
                  flexShrink: 0,
                }}
              >
                <Ticket size={22} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--label)",
                    display: "block",
                  }}
                >
                  {t("tailor.dossierCode")}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: "0.02em",
                  }}
                >
                  {dossier_code}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  id="btn-copy-dossier-code"
                  onClick={() => copyToClipboard(dossier_code, "code")}
                  title={t("tailor.copyCodeTitle")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 11px",
                    borderRadius: "6px",
                    background: copiedType === "code" ? "rgba(163, 230, 53, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: copiedType === "code" ? "#A3E635" : "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {copiedType === "code" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedType === "code" ? t("tailor.copied") : t("tailor.copy")}</span>
                </button>

                <button
                  type="button"
                  id="btn-open-qr-modal"
                  onClick={() => setIsQrModalOpen(true)}
                  title={t("tailor.openQrTitle")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    borderRadius: "6px",
                    background: "rgba(56, 189, 248, 0.14)",
                    border: "1px solid rgba(56, 189, 248, 0.35)",
                    color: "#38BDF8",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <QrCode size={14} />
                  <span>{t("tailor.qrCode")}</span>
                </button>
              </div>
            </div>

            {/* 2. Smart Lookup & Authentication Input */}
            <form onSubmit={authenticate} style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <KeyRound
                  size={15}
                  strokeWidth={1.5}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                  }}
                />
                <input
                  id="input-access-token"
                  className="zf-input mono"
                  style={{
                    width: "100%",
                    height: 42,
                    paddingLeft: 36,
                    fontSize: 13,
                    background: "rgba(10, 15, 18, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                  }}
                  placeholder={t("tailor.codePlaceholder")}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                id="btn-authenticate"
                className="zf-btn zf-btn--secondary"
                style={{ height: 42, padding: "0 16px", whiteSpace: "nowrap" }}
              >
                {t("tailor.authenticate")}
              </button>
              <button
                type="button"
                id="btn-export-pdf"
                className="zf-btn zf-btn--primary"
                style={{ height: 42, padding: "0 18px", whiteSpace: "nowrap" }}
                onClick={exportPdf}
                title={dossier.pdf_export_url ?? t("tailor.printPdfTitle")}
              >
                <FileDown size={16} strokeWidth={1.75} />
                {t("tailor.exportPdf")}
              </button>
            </form>
          </div>

          {/* 3. E2EE Security Sub-bar (Backend Token Transparency) */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 12,
              color: "var(--label)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#94A3B8" }}>
                <Lock size={12} style={{ color: "#38BDF8" }} />
                <span>{t("tailor.e2ee")}</span>
              </span>
              <code
                className="mono"
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  color: showFullToken ? "#A3E635" : "#E2E8F0",
                  fontSize: 11,
                  wordBreak: "break-all",
                }}
              >
                {showFullToken ? dossier.access_token : maskedToken}
              </code>
              <button
                type="button"
                id="btn-toggle-token-visibility"
                onClick={() => setShowFullToken((v) => !v)}
                title={showFullToken ? t("tailor.hideToken") : t("tailor.showToken")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 2,
                }}
              >
                {showFullToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                id="btn-copy-raw-token"
                onClick={() => copyToClipboard(dossier.access_token, "token")}
                title={t("tailor.copyTokenTitle")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: copiedType === "token" ? "#A3E635" : "var(--muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {copiedType === "token" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedType === "token" ? t("tailor.tokenCopied") : t("tailor.copyToken")}</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>
                {t("tailor.validUntil")} <b className="mono" style={{ color: "var(--white)" }}>{fmtDate(dossier.token_expires_at)}</b>
              </span>
            </div>
          </div>

          {notice && (
            <div
              className={`zf-notice ${notice.kind}`}
              style={{ marginTop: 12, borderRadius: "6px" }}
            >
              {notice.text}
            </div>
          )}
        </div>

        {/* ── Main Studio Grid ── */}
        <div className="zf-tailor">
          {/* Client selector: profiles + biometric_inputs.gender */}
          <aside className="zf-card zf-card-pad no-print" aria-label={t("tailor.clients")}>
            <div className="zf-section-head" style={{ marginBottom: 12 }}>
              <div>
                <h2 className="zf-eyebrow">{t("tailor.clientDossiers")}</h2>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{t("tailor.activeSpecs")}</span>
              </div>
              <Search size={14} strokeWidth={1.5} color="var(--muted)" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dossiers.map((d, i) => (
                <button
                  key={d.profile.id}
                  id={`client-${i}`}
                  className={`zf-client ${i === idx ? "active" : ""}`}
                  onClick={() => pick(i)}
                  style={{
                    position: "relative",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div className="top" style={{ marginBottom: 4 }}>
                    <strong style={{ fontSize: 14, fontWeight: 600 }}>{d.profile.full_name}</strong>
                    <span className="zf-pill" style={{ textTransform: "capitalize" }}>
                      {t("tailor.gender." + d.biometric.gender)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <small style={{ color: "var(--label)", fontSize: 12 }}>{d.profile.email}</small>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: i === idx ? "#38BDF8" : "var(--muted)",
                        background: i === idx ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.04)",
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {d.dossier_code}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Center Mesh Preview */}
          <section className="zf-card zf-card-pad" aria-label={t("tailor.meshPreview")}>
            <div className="zf-section-head">
              <div>
                <h2 className="zf-eyebrow">{t("tailor.topology")}</h2>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {t("tailor.morphing").replace("{name}", profile.full_name)}
                </p>
              </div>
              <span className="zf-pill mono">{mesh.base_gender_mesh}</span>
            </div>
            <MeshViewport meshParams={mesh} measurement={m} height={520} />
          </section>

          {/* Right Dossier Specification */}
          <section className="zf-card zf-card-pad" aria-label={t("tailor.dossierSpec")}>
            <div className="zf-section-head" style={{ marginBottom: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600 }}>{profile.full_name}</h2>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#38BDF8",
                      background: "rgba(56, 189, 248, 0.12)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {dossier_code}
                  </span>
                </div>
                <p className="zf-sub" style={{ marginTop: 2 }}>{profile.email}</p>
              </div>
              <span
                className={`zf-pill mono ${m.extraction_confidence >= 0.85 ? "zf-pill--lime" : "zf-pill--teal"}`}
              >
                {(m.extraction_confidence * 100).toFixed(0)}% SLA
              </span>
            </div>

            <h3 className="zf-eyebrow zf-group-label">{t("tailor.bodyMeasures")}</h3>
            <div className="zf-rows">
              <Spec label={t("tailor.chest")} value={cm(m.chest_circ_cm)} />
              <Spec label={t("tailor.waist")} value={cm(m.waist_circ_cm)} />
              <Spec label={t("tailor.hips")} value={cm(m.hip_circ_cm)} />
              <Spec label={t("tailor.shoulders")} value={cm(m.shoulder_breadth_cm)} />
              <Spec label={t("tailor.inseam")} value={cm(m.inseam_cm)} />
              <Spec
                label={t("tailor.accuracy")}
                value={`${(m.extraction_confidence * 100).toFixed(0)}% (${m.extraction_confidence.toFixed(2)})`}
              />
            </div>

            <h3 className="zf-eyebrow zf-group-label">{t("tailor.biometric")}</h3>
            <div className="zf-rows">
              <Spec label={t("tailor.genderLabel")} value={<span style={{ textTransform: "capitalize" }}>{t("tailor.gender." + b.gender)}</span>} />
              <Spec label={t("tailor.height")} value={cm(b.stature_cm)} />
              <Spec label={t("tailor.weight")} value={<>{b.weight_kg.toFixed(1)}<em>kg</em></>} />
              <Spec label={t("tailor.bmi")} value={b.calculated_bmi?.toFixed(2) ?? "—"} />
            </div>

            <h3 className="zf-eyebrow zf-group-label">{t("tailor.meshParams")}</h3>
            <div className="zf-rows">
              <Spec label={t("tailor.anatomicalBase")} value={mesh.base_gender_mesh} />
              <Spec label={t("tailor.chestScale")} value={mesh.scale_chest.toFixed(3)} />
              <Spec label={t("tailor.waistScale")} value={mesh.scale_waist.toFixed(3)} />
              <Spec label={t("tailor.hipScale")} value={mesh.scale_hips.toFixed(3)} />
            </div>
          </section>
        </div>
      </main>

      {/* ── Interactive QR Code Modal ── */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#11191E",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
              position: "relative",
              color: "#FFFFFF",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#38BDF8",
                    fontWeight: 700,
                  }}
                >
                  {t("tailor.contactless")}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                  {t("tailor.qrModalTitle")}
                </h3>
              </div>
              <button
                type="button"
                id="btn-close-qr-modal"
                onClick={() => setIsQrModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "grid",
                  placeItems: "center",
                  color: "#94A3B8",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Card Center */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 16px",
                background: "rgba(10, 15, 18, 0.8)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: 16,
              }}
            >
              <SvgQrCode text={dossier.access_token} size={190} />
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#38BDF8",
                    letterSpacing: "0.04em",
                  }}
                >
                  {dossier_code}
                </span>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                  {profile.full_name} · {profile.email}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5, marginBottom: 18 }}>
              {t("tailor.qrModalDesc")}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                id="btn-simulate-scan"
                onClick={() => {
                  authenticate();
                  setIsQrModalOpen(false);
                }}
                className="zf-btn zf-btn--primary"
                style={{ flex: 1, height: 40 }}
              >
                <Check size={16} /> {t("tailor.qrSimulate")}
              </button>
              <button
                type="button"
                id="btn-dismiss-qr"
                onClick={() => setIsQrModalOpen(false)}
                className="zf-btn zf-btn--secondary"
                style={{ height: 40 }}
              >
                {t("tailor.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailorStudio;
