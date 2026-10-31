// ============================================================
// RECOMMENDATION CARD  (recommendations table only)
// recommended_size, fit_type, chest_delta_cm, waist_delta_cm,
// gemini_advisor_tip  (+ brand_name from brand_size_charts)
// ============================================================
import React from "react";
import type { Recommendation } from "../../types/database.types";
import { FIT_TYPE_LABELS } from "../../types/fitting.types";

const fmt = (d: number | null) => (d == null ? "—" : `${d > 0 ? "+" : ""}${d.toFixed(1)}`);

export interface RecommendationCardProps {
  recommendation: Pick<Recommendation, "recommended_size" | "fit_type" | "chest_delta_cm" | "waist_delta_cm" | "gemini_advisor_tip">;
  brand_name?: string;
  id?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation: r, brand_name, id = "recommendation-card" }) => (
  <section className="zf-card zf-card-pad" id={id} aria-label="Size recommendation">
    <div className="zf-section-head" style={{ marginBottom: 12 }}>
      <h2 className="zf-eyebrow">Recommended size</h2>
      {brand_name && <span className="zf-pill">{brand_name}</span>}
    </div>

    <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
      <span className="zf-size">{r.recommended_size}</span>
      <span className="zf-pill zf-pill--teal" style={{ marginBottom: 6 }}>
        {FIT_TYPE_LABELS[r.fit_type]} fit
      </span>
    </div>

    <div className="zf-deltas">
      {([["Chest Allowance", r.chest_delta_cm, "chest_allowance"], ["Waist Allowance", r.waist_delta_cm, "waist_allowance"]] as const).map(([label, d, key]) => (
        <div className="zf-delta" key={key}>
          <small>{label}</small>
          <b className={d != null && d > 0 ? "pos" : ""}>{fmt(d)} <span style={{ color: "var(--muted)", fontSize: 11 }}>cm</span></b>
        </div>
      ))}
    </div>

    {r.gemini_advisor_tip && (
      <p className="zf-tip">
        <small>Advisor note</small>
        {r.gemini_advisor_tip}
      </p>
    )}
  </section>
);

export default RecommendationCard;
