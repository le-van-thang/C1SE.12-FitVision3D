import React, { useState, useEffect, useMemo } from "react";
import { Shirt, Scissors, Sparkles, CheckCircle2, ShieldCheck, Zap, Globe2, SlidersHorizontal, AlertCircle } from "lucide-react";
import type { AiMeasurementResponse } from "../../services/aiService";
import { useI18n } from "../../i18n";
import { recommendGarmentSizes, SizeSystem, FitPreference } from "../../utils/garmentSizeCalculator";

export interface AiGarmentCardProps {
  data: AiMeasurementResponse["garment_size_recommendations"];
  executionTime?: number;
  isLiveBackend?: boolean;
  measurements?: {
    chieu_cao_cm?: number | null;
    vong_nguc_cm: number;
    vong_eo_cm: number;
    vong_mong_cm?: number | null;
    rong_vai_cm?: number | null;
    dai_chan_inseam_cm?: number | null;
    can_nang_kg?: number | null;
  };
  gender?: "male" | "female" | "neutral";
}

const STORAGE_KEY_SYSTEM = "fv3d_preferred_size_system";
const STORAGE_KEY_FIT = "fv3d_preferred_fit";

const localizedBodyShape = (text: string, loc: string) => {
  if (!text) return "";
  if (loc === "vi") {
    const match = text.match(/\(([^)]+)\)/);
    if (match) return match[1];
    if (text.toLowerCase().includes("athletic")) return "Thể thao, ngực nở eo thon";
    if (text.toLowerCase().includes("balanced") || text.toLowerCase().includes("regular")) return "Cân đối tiêu chuẩn";
    if (text.toLowerCase().includes("comfort") || text.toLowerCase().includes("relaxed")) return "Dáng người đầy đặn";
    if (text.toLowerCase().includes("slim")) return "Dáng người thon gọn";
  } else {
    const match = text.match(/^([^(]+)/);
    if (match && text.includes("(")) return match[1].trim();
  }
  return text;
};

export const AiGarmentCard: React.FC<AiGarmentCardProps> = ({
  data,
  executionTime = 1.25,
  isLiveBackend = false,
  measurements,
  gender = "neutral",
}) => {
  const { t, locale } = useI18n();

  // 1. Quản lý trạng thái hệ size (Asia, US, EU, UK)
  const [activeSystem, setActiveSystem] = useState<SizeSystem>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYSTEM) as SizeSystem | null;
      if (saved && ["asia", "us", "eu", "uk"].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "asia";
  });

  // 2. Quản lý trạng thái form mặc (Slim, Regular, Relaxed)
  const [preferredFit, setPreferredFit] = useState<FitPreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FIT) as FitPreference | null;
      if (saved && ["slim", "regular", "relaxed"].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "regular";
  });

  const handleSystemChange = (sys: SizeSystem) => {
    setActiveSystem(sys);
    try {
      localStorage.setItem(STORAGE_KEY_SYSTEM, sys);
    } catch {
      // ignore
    }
  };

  const handleFitChange = (fit: FitPreference) => {
    setPreferredFit(fit);
    try {
      localStorage.setItem(STORAGE_KEY_FIT, fit);
    } catch {
      // ignore
    }
  };

  // 3. Tính toán lại tức thì khi người dùng thay đổi Hệ size hoặc Form mặc
  const computed = useMemo(() => {
    if (measurements && measurements.vong_nguc_cm > 0 && measurements.vong_eo_cm > 0) {
      return recommendGarmentSizes(
        {
          gender,
          height_cm: measurements.chieu_cao_cm ?? undefined,
          weight_kg: measurements.can_nang_kg ?? undefined,
          chest_cm: measurements.vong_nguc_cm,
          waist_cm: measurements.vong_eo_cm,
          hips_cm: measurements.vong_mong_cm ?? undefined,
          shoulder_cm: measurements.rong_vai_cm ?? undefined,
          inseam_cm: measurements.dai_chan_inseam_cm ?? undefined,
          preferred_fit: preferredFit,
        },
        activeSystem
      );
    }

    // Nếu không có measurements gốc, fallback dùng data truyền vào và filter theo activeSystem
    if (data?.topwear && data?.bottomwear) {
      const top = data.topwear;
      const subParts: string[] = [];
      if (activeSystem !== "asia") subParts.push(`Châu Á: ${top.asia}`);
      if (activeSystem !== "us") subParts.push(`US: ${top.us}`);
      if (activeSystem !== "eu") subParts.push(`EU: ${top.eu}`);
      if (activeSystem !== "uk") subParts.push(`UK: ${top.uk}`);

      const recLabel =
        activeSystem === "us"
          ? top.us
          : activeSystem === "eu"
          ? top.eu
          : activeSystem === "uk"
          ? top.uk
          : top.asia;

      return {
        topwear: {
          ...top,
          recommended_label: recLabel,
          sub_label: subParts.join(" | "),
        },
        bottomwear: data.bottomwear,
        body_shape_classification: data.body_shape_classification,
        ease_allowance_recommendation: data.ease_allowance_recommendation,
      };
    }

    return null;
  }, [measurements, gender, activeSystem, preferredFit, data]);

  if (!data) return null;

  const topwear = computed?.topwear || data.topwear;
  const bottomwear = computed?.bottomwear || data.bottomwear;
  const bodyShape = computed?.body_shape_classification || data.body_shape_classification;
  const easeAllowance = computed?.ease_allowance_recommendation || data.ease_allowance_recommendation;

  const systemName =
    activeSystem === "asia"
      ? t("meas.systemAsia")
      : activeSystem === "us"
      ? t("meas.systemUs")
      : activeSystem === "eu"
      ? t("meas.systemEu")
      : t("meas.systemUk");

  return (
    <section
      className="zf-card zf-card-pad"
      style={{
        marginTop: "16px",
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 26, 0.98) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.3)",
        borderRadius: "14px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(56, 189, 248, 0.3)",
            }}
          >
            <Shirt size={18} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
              {t("meas.cardTitle")}
            </h2>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              {t("meas.cardSub")}
            </span>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            padding: "3px 10px",
            borderRadius: "9999px",
            background: isLiveBackend ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.12)",
            border: isLiveBackend ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(56, 189, 248, 0.3)",
            color: isLiveBackend ? "#34d399" : "#38bdf8",
            fontWeight: 500,
          }}
        >
          {isLiveBackend ? (
            <>
              <CheckCircle2 size={12} /> FastAPI SMPLer-X
            </>
          ) : (
            <>
              <Zap size={12} /> ISO Biometrics Engine
            </>
          )}
        </span>
      </div>

      {/* Interactive Controls Bar: Hệ size & Form mặc */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "8px 12px",
          marginBottom: "14px",
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          flexWrap: "wrap",
        }}
      >
        {/* Dropdown Hệ size */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Globe2 size={13} style={{ color: "#38bdf8" }} />
            {t("meas.sizeSystem")}:
          </span>
          <select
            value={activeSystem}
            onChange={(e) => handleSystemChange(e.target.value as SizeSystem)}
            style={{
              background: "rgba(10, 15, 26, 0.9)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "6px",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="asia">{t("meas.systemAsia")}</option>
            <option value="us">{t("meas.systemUs")}</option>
            <option value="eu">{t("meas.systemEu")}</option>
            <option value="uk">{t("meas.systemUk")}</option>
          </select>
        </div>

        {/* Segmented Buttons Form mặc */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <SlidersHorizontal size={13} style={{ color: "#a3e635" }} />
            {t("meas.fitPreference")}:
          </span>
          <div
            style={{
              display: "inline-flex",
              background: "rgba(0, 0, 0, 0.4)",
              borderRadius: "6px",
              padding: "2px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {(["slim", "regular", "relaxed"] as FitPreference[]).map((fitKey) => {
              const isActive = preferredFit === fitKey;
              const label =
                fitKey === "slim"
                  ? t("meas.fitSlim")
                  : fitKey === "regular"
                  ? t("meas.fitRegular")
                  : t("meas.fitRelaxed");

              return (
                <button
                  key={fitKey}
                  type="button"
                  onClick={() => handleFitChange(fitKey)}
                  style={{
                    border: "none",
                    background: isActive ? "rgba(56, 189, 248, 0.25)" : "transparent",
                    color: isActive ? "#38bdf8" : "#94a3b8",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Garment Sizes Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        {/* Topwear (Áo) */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "10px",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              {t("meas.topwear")}
            </span>

            {/* Dòng kích cỡ lớn */}
            <div
              style={{
                fontSize: topwear?.boundary_text ? "16px" : "22px",
                fontWeight: 800,
                color: "#38bdf8",
                letterSpacing: "0.02em",
                margin: "4px 0",
                lineHeight: 1.3,
              }}
            >
              {topwear?.boundary_text
                ? topwear.boundary_text
                : `${t("meas.sizePrefix")} ${topwear?.recommended_label || data.topwear_shirt_size}`}
            </div>

            {/* Nhãn hệ size động */}
            <span style={{ fontSize: "11px", color: "#0ea5e9", display: "block", fontWeight: 500 }}>
              {t("meas.topwearStandard").replace("{system}", systemName)}
            </span>
          </div>

          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)" }}>
            {/* Dòng phụ: các hệ còn lại */}
            {topwear?.sub_label && (
              <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                {topwear.sub_label}
              </span>
            )}
            {/* Ghi chú lý do */}
            {topwear?.notes && (
              <span style={{ fontSize: "10px", color: "#64748b", display: "block", fontStyle: "italic" }}>
                {topwear.notes}
              </span>
            )}
          </div>
        </div>

        {/* Bottomwear (Quần) */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(163, 230, 53, 0.2)",
            borderRadius: "10px",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              {t("meas.bottomwear")}
            </span>

            {/* Dòng kích cỡ lớn */}
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#a3e635",
                margin: "4px 0",
                lineHeight: 1.3,
              }}
            >
              {bottomwear?.tag ||
                (data.bottomwear_trouser_size
                  ? data.bottomwear_trouser_size.replace(/^Size\s+/i, `${t("meas.sizePrefix")} `)
                  : "")}
            </div>

            {/* Dòng phụ US/UK */}
            <span style={{ fontSize: "11px", color: "#84cc16", display: "block", fontWeight: 500 }}>
              {bottomwear?.sub_label ||
                t("meas.bottomwearInches")
                  .replace("{w}", String(data.waist_inches))
                  .replace("{i}", String(data.inseam_inches))}
            </span>
          </div>

          {/* Ghi chú cảnh báo hông nếu có */}
          {bottomwear?.notes && (
            <div
              style={{
                marginTop: "8px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <span style={{ fontSize: "10px", color: "#fde68a", lineHeight: 1.3 }}>
                {bottomwear.notes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body Shape Classification */}
      <div
        style={{
          background: "rgba(56, 189, 248, 0.06)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          borderRadius: "8px",
          padding: "10px 12px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Sparkles size={18} style={{ color: "#38bdf8", flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>
            {t("meas.bodyFit")}
          </span>
          <strong style={{ fontSize: "13px", color: "#f8fafc" }}>
            {localizedBodyShape(bodyShape, locale)}
          </strong>
        </div>
      </div>

      {/* Ease Allowance Recommendations */}
      <div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "8px",
          }}
        >
          <Scissors size={13} style={{ color: "#a3e635" }} />
          {t("meas.easeAllowance")}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "6px",
              padding: "8px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>{t("meas.slimChest")}</span>
            <strong style={{ fontSize: "13px", color: "#38bdf8" }}>
              {easeAllowance.slim_fit_chest_cm} <small style={{ fontSize: "10px" }}>cm</small>
            </strong>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "6px",
              padding: "8px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>{t("meas.regularChest")}</span>
            <strong style={{ fontSize: "13px", color: "#38bdf8" }}>
              {easeAllowance.regular_fit_chest_cm} <small style={{ fontSize: "10px" }}>cm</small>
            </strong>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "6px",
              padding: "8px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>{t("meas.trouserWaist")}</span>
            <strong style={{ fontSize: "13px", color: "#a3e635" }}>
              {easeAllowance.trouser_waist_ease_cm} <small style={{ fontSize: "10px" }}>cm</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Brand Disclaimer Notice */}
      <div
        style={{
          marginTop: "12px",
          padding: "8px 10px",
          borderRadius: "6px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          fontSize: "11px",
          color: "#94a3b8",
          lineHeight: 1.4,
          textAlign: "center",
        }}
      >
        ℹ️ {t("meas.sizeNotice")}
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "#64748b",
        }}
      >
        <span>{t("meas.execTime").replace("{s}", executionTime.toFixed(2))}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <ShieldCheck size={12} style={{ color: "#a3e635" }} /> {t("meas.privacyGuaranteed")}
        </span>
      </div>
    </section>
  );
};

export default AiGarmentCard;
