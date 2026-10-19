// ============================================================
// FITVISION 3D - SIZE ADVISOR CARD COMPONENT
// Smart Sizing Recommendation & AI Advisor Insights
// Size Conversion: US, EU, UK, Asian, TCVN
// ============================================================
import React, { useState } from "react";
import { GlassCard } from "../common/GlassCard";
import type { SizeAdvisorCardProps, SizeSystem, FitType } from "../../types/fitting.types";

const SIZE_SYSTEMS: SizeSystem[] = ["US", "EU", "UK", "ASIAN", "TCVN"];

const FIT_TYPE_LABELS_EN: Record<FitType, string> = {
  slim: "Slim Fit",
  regular: "Regular Fit",
  relaxed: "Relaxed Fit",
  oversized: "Oversized Fit",
};

// Size conversion table across international standards
const SIZE_CONVERSION: Record<string, Record<SizeSystem, string>> = {
  XS:  { US: "XS",  EU: "32", UK: "6",  ASIAN: "155/80A", TCVN: "XS" },
  S:   { US: "S",   EU: "34", UK: "8",  ASIAN: "160/84A", TCVN: "S" },
  M:   { US: "M",   EU: "36", UK: "10", ASIAN: "165/88A", TCVN: "M" },
  L:   { US: "L",   EU: "38", UK: "12", ASIAN: "170/92A", TCVN: "L" },
  XL:  { US: "XL",  EU: "40", UK: "14", ASIAN: "175/96A", TCVN: "XL" },
  XXL: { US: "XXL", EU: "42", UK: "16", ASIAN: "180/100A", TCVN: "XXL" },
};

const FIT_COLOR: Record<FitType, string> = {
  slim:     "#06b6d4",
  regular:  "#22c55e",
  relaxed:  "#f59e0b",
  oversized:"#8b5cf6",
};

const DELTA_STATUS = (delta: number | null): { color: string; icon: string; text: string } => {
  if (delta === null) return { color: "#64748b", icon: "—", text: "N/A" };
  if (Math.abs(delta) <= 1) return { color: "#22c55e", icon: "✓", text: `±${Math.abs(delta).toFixed(1)} cm` };
  if (delta > 1) return { color: "#f97316", icon: "↑", text: `+${delta.toFixed(1)} cm` };
  return { color: "#06b6d4", icon: "↓", text: `${delta.toFixed(1)} cm` };
};

export const SizeAdvisorCard: React.FC<SizeAdvisorCardProps & { id?: string }> = ({
  brand_name,
  size_label,
  fit_type,
  chest_delta_cm,
  waist_delta_cm,
  gemini_advisor_tip,
  match_score,
  size_system = "US",
  id = "size-advisor-card",
}) => {
  const [activeSystem, setActiveSystem] = useState<SizeSystem>(size_system ?? "US");

  const convertedSize = SIZE_CONVERSION[size_label]?.[activeSystem] ?? size_label;
  const matchPct = Math.round(match_score * 100);
  const matchColor = matchPct >= 90 ? "#22c55e" : matchPct >= 75 ? "#f59e0b" : "#ef4444";
  const fitColor = FIT_COLOR[fit_type] ?? "#8b5cf6";
  const chestStatus = DELTA_STATUS(chest_delta_cm);
  const waistStatus = DELTA_STATUS(waist_delta_cm);

  return (
    <GlassCard accent="cyan" padding="md" id={id} className="fv3d-size-advisor">
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {brand_name}
          </p>
          {/* Main size display */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{
              fontSize: "52px", fontWeight: 800, fontFamily: "monospace",
              color: "#06b6d4",
              textShadow: "0 0 24px rgba(6,182,212,0.6)",
              lineHeight: 1,
            }}>
              {convertedSize}
            </span>
            <div style={{
              padding: "4px 10px",
              background: `${fitColor}20`,
              border: `1px solid ${fitColor}40`,
              borderRadius: "20px",
            }}>
              <span style={{ color: fitColor, fontSize: "11px", fontWeight: 600 }}>
                {FIT_TYPE_LABELS_EN[fit_type] ?? "Regular Fit"}
              </span>
            </div>
          </div>
        </div>

        {/* Match score ring */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "56px", height: "56px",
            borderRadius: "50%",
            background: `conic-gradient(${matchColor} ${matchPct}%, rgba(51,65,85,0.3) 0%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: "42px", height: "42px",
              borderRadius: "50%",
              background: "#0f172a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: matchColor, fontSize: "13px", fontWeight: 700, fontFamily: "monospace" }}>
                {matchPct}%
              </span>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: "10px", margin: "4px 0 0", textTransform: "uppercase" }}>Match Score</p>
        </div>
      </div>

      {/* Size system selector */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {SIZE_SYSTEMS.map(sys => (
          <button
            key={sys}
            id={`size-system-${sys}`}
            onClick={() => setActiveSystem(sys)}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeSystem === sys ? "#06b6d4" : "rgba(51,65,85,0.5)",
              background: activeSystem === sys ? "rgba(6,182,212,0.15)" : "transparent",
              color: activeSystem === sys ? "#06b6d4" : "#64748b",
              fontSize: "11px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {sys}
          </button>
        ))}
      </div>

      {/* Delta measurements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div style={{ padding: "10px 12px", borderRadius: "8px", background: `${chestStatus.color}10`, border: `1px solid ${chestStatus.color}30` }}>
          <p style={{ color: "#64748b", fontSize: "10px", margin: "0 0 4px", textTransform: "uppercase" }}>Chest Delta</p>
          <p style={{ color: chestStatus.color, fontSize: "14px", fontFamily: "monospace", fontWeight: 700, margin: 0 }}>
            {chestStatus.icon} {chestStatus.text}
          </p>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: "8px", background: `${waistStatus.color}10`, border: `1px solid ${waistStatus.color}30` }}>
          <p style={{ color: "#64748b", fontSize: "10px", margin: "0 0 4px", textTransform: "uppercase" }}>Waist Delta</p>
          <p style={{ color: waistStatus.color, fontSize: "14px", fontFamily: "monospace", fontWeight: 700, margin: 0 }}>
            {waistStatus.icon} {waistStatus.text}
          </p>
        </div>
      </div>

      {/* Gemini Advisor Tip */}
      {gemini_advisor_tip && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>✨</span>
            <div>
              <p style={{ color: "#8b5cf6", fontSize: "10px", fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                AI Biometric Size Advisor
              </p>
              <p style={{ color: "#cbd5e1", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>
                {gemini_advisor_tip}
              </p>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default SizeAdvisorCard;
