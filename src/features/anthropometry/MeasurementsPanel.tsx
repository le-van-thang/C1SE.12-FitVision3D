import React, { useEffect, useRef, useState } from "react";
import type { BiometricInput, Measurement } from "../../types/database.types";
import type { MetricKey } from "../avatar3d/MannequinViewer";
import { useI18n } from "../../i18n";

const useCountUp = (target: number | null | undefined, ms = 700) => {
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (target == null) {
      from.current = 0;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / ms, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = a + (target - a) * e;
      setVal(cur);
      from.current = cur;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return target == null ? 0 : val;
};

export const MetricRow: React.FC<{
  label: string;
  sublabel?: string;
  field: string;
  value: number | null | undefined;
  unit: string;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ label, sublabel, value, unit, isActive, onClick }) => {
  const shown = useCountUp(value);
  return (
    <div
      className={`zf-row ${isActive ? "active-row" : ""}`}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        padding: "10px 8px",
        borderRadius: "6px",
        transition: "background 0.15s",
        background: isActive ? "rgba(163, 230, 53, 0.08)" : "transparent",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ color: isActive ? "#A3E635" : undefined, fontWeight: isActive ? 600 : undefined }}>
          {label}
        </span>
        {sublabel ? (
          <span style={{ fontSize: "10px", color: "var(--muted, #94a3b8)", marginTop: "1px" }}>
            {sublabel}
          </span>
        ) : null}
      </div>
      {value == null ? (
        <b className="empty">—</b>
      ) : (
        <b style={{ color: isActive ? "#A3E635" : undefined }}>
          {shown.toFixed(1)}
          {unit && <em>{unit}</em>}
        </b>
      )}
    </div>
  );
};

export interface MeasurementsPanelProps {
  measurement: (Measurement & { arm_length_cm?: number | null }) | null;
  biometric: BiometricInput | null;
  activeMetric?: MetricKey | null;
  onSelectMetric?: (key: MetricKey) => void;
  id?: string;
  isLiveBackend?: boolean;
}

export const MeasurementsPanel: React.FC<MeasurementsPanelProps> = ({
  measurement,
  biometric,
  activeMetric,
  onSelectMetric,
  id = "measurements-panel",
  isLiveBackend = false,
}) => {
  const { t } = useI18n();
  const conf = measurement?.extraction_confidence;

  return (
    <section className="zf-card zf-card-pad" id={id} aria-label={t("meas.title")}>
      <div className="zf-section-head" style={{ marginBottom: 6 }}>
        <div>
          <h2 className="zf-eyebrow">{t("meas.title")}</h2>
          {measurement && (
            <div
              style={{
                fontSize: "11px",
                color: isLiveBackend ? "#34d399" : "#38bdf8",
                marginTop: "2px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 500,
              }}
            >
              <span>{isLiveBackend ? t("dashx.sourceModel") : t("dashx.sourceFormula")}</span>
            </div>
          )}
        </div>
        {conf != null && (
          <span
            className={`zf-pill mono ${conf >= 0.85 ? "zf-pill--lime" : "zf-pill--teal"}`}
          >
            {t("meas.confidence").replace("{p}", (conf * 100).toFixed(0))}
          </span>
        )}
      </div>
      <div className="zf-rows">
        <MetricRow
          label={t("meas.chest")}
          sublabel={t("meas.chestSub") || undefined}
          field="chest_circ_cm"
          value={measurement?.chest_circ_cm}
          unit="cm"
          isActive={activeMetric === "chest_circ_cm"}
          onClick={() => onSelectMetric?.("chest_circ_cm")}
        />
        <MetricRow
          label={t("meas.waist")}
          sublabel={t("meas.waistSub") || undefined}
          field="waist_circ_cm"
          value={measurement?.waist_circ_cm}
          unit="cm"
          isActive={activeMetric === "waist_circ_cm"}
          onClick={() => onSelectMetric?.("waist_circ_cm")}
        />
        <MetricRow
          label={t("meas.hips")}
          sublabel={t("meas.hipsSub") || undefined}
          field="hip_circ_cm"
          value={measurement?.hip_circ_cm}
          unit="cm"
          isActive={activeMetric === "hip_circ_cm"}
          onClick={() => onSelectMetric?.("hip_circ_cm")}
        />
        <MetricRow
          label={t("meas.shoulders")}
          sublabel={t("meas.shouldersSub") || undefined}
          field="shoulder_breadth_cm"
          value={measurement?.shoulder_breadth_cm}
          unit="cm"
          isActive={activeMetric === "shoulder_breadth_cm"}
          onClick={() => onSelectMetric?.("shoulder_breadth_cm")}
        />
        <MetricRow
          label={t("meas.inseam")}
          sublabel={t("meas.inseamSub") || undefined}
          field="inseam_cm"
          value={measurement?.inseam_cm}
          unit="cm"
          isActive={activeMetric === "inseam_cm"}
          onClick={() => onSelectMetric?.("inseam_cm")}
        />
        <MetricRow
          label={t("meas.armLength")}
          sublabel={t("meas.armLengthSub") || undefined}
          field="arm_length_cm"
          value={measurement?.arm_length_cm}
          unit="cm"
          isActive={activeMetric === "arm_length_cm"}
          onClick={() => onSelectMetric?.("arm_length_cm")}
        />
      </div>

      <h3 className="zf-eyebrow zf-group-label" style={{ marginTop: "14px" }}>
        {t("meas.bioTitle")}
      </h3>
      <div className="zf-rows">
        <MetricRow label={t("meas.stature")} field="stature_cm" value={biometric?.stature_cm} unit="cm" />
        <MetricRow label={t("meas.weight")} field="weight_kg" value={biometric?.weight_kg} unit="kg" />
        <MetricRow label={t("meas.bmi")} field="calculated_bmi" value={biometric?.calculated_bmi} unit="" />
      </div>
    </section>
  );
};

export default MeasurementsPanel;
