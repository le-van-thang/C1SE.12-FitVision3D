import React from "react";
import { Shirt, Scissors, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import type { AiMeasurementResponse } from "../../services/aiService";
import { useI18n } from "../../i18n";

export interface AiGarmentCardProps {
  data: AiMeasurementResponse["garment_size_recommendations"];
  executionTime?: number;
  isLiveBackend?: boolean;
}

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
}) => {
  const { t, locale } = useI18n();
  if (!data) return null;

  return (
    <section
      className="zf-card zf-card-pad"
      style={{
        marginTop: "16px",
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 15, 26, 0.95) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shirt size={16} />
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
            gap: "4px",
            fontSize: "11px",
            padding: "3px 8px",
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

      {/* Recommended Garment Sizes Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {/* Topwear */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
            {t("meas.topwear")}
          </span>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#38bdf8",
              letterSpacing: "0.05em",
            }}
          >
            {t("meas.sizePrefix")} {data.topwear_shirt_size}
          </div>
          <span style={{ fontSize: "10px", color: "#64748b" }}>{t("meas.topwearStandard")}</span>
        </div>

        {/* Bottomwear */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
            {t("meas.bottomwear")}
          </span>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#a3e635",
              marginTop: "4px",
              marginBottom: "2px",
            }}
          >
            {data.bottomwear_trouser_size ? data.bottomwear_trouser_size.replace(/^Size\s+/i, `${t("meas.sizePrefix")} `) : ""}
          </div>
          <span style={{ fontSize: "10px", color: "#64748b" }}>
            {t("meas.bottomwearInches")
              .replace("{w}", String(data.waist_inches))
              .replace("{i}", String(data.inseam_inches))}
          </span>
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
            {localizedBodyShape(data.body_shape_classification, locale)}
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
              {data.ease_allowance_recommendation.slim_fit_chest_cm} <small style={{ fontSize: "10px" }}>cm</small>
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
              {data.ease_allowance_recommendation.regular_fit_chest_cm} <small style={{ fontSize: "10px" }}>cm</small>
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
              {data.ease_allowance_recommendation.trouser_waist_ease_cm} <small style={{ fontSize: "10px" }}>cm</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "12px",
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
