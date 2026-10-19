// ============================================================
// FITVISION 3D - BIOMETRIC METRICS COMPONENT
// Zone 3: Biometric Metrics Display - Mechanical Odometer Flip
// ============================================================
import React, { useEffect, useState, useRef } from "react";
import { GlassCard } from "../common/GlassCard";
import type { ExtractedMeasurements } from "../../types/biometrics.types";

interface BiometricMetricsProps {
  measurements: ExtractedMeasurements | null;
  weightKg?: number;
  bmi?: number;
  id?: string;
}

// Odometer Digit Component - mechanical number flip effect
const OdometerDigit: React.FC<{ digit: string; accentColor: string }> = ({ digit, accentColor }) => {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsFlipping(true);
      setTimeout(() => {
        setPrevDigit(digit);
        setIsFlipping(false);
      }, 300);
    }
  }, [digit, prevDigit]);

  return (
    <div style={{
      display: "inline-block",
      width: "22px",
      height: "32px",
      background: "rgba(15,23,42,0.8)",
      border: `1px solid ${accentColor}40`,
      borderRadius: "4px",
      overflow: "hidden",
      position: "relative",
      margin: "0 1px",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: accentColor,
        fontFamily: "monospace",
        fontSize: "18px",
        fontWeight: 700,
        transform: isFlipping ? "translateY(-100%)" : "translateY(0)",
        transition: isFlipping ? "transform 0.15s ease-in" : "none",
      }}>
        {prevDigit}
      </div>
      {isFlipping && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          fontFamily: "monospace",
          fontSize: "18px",
          fontWeight: 700,
          transform: "translateY(100%)",
          transition: "transform 0.15s ease-out",
          transitionDelay: "0.15s",
          animation: "slideUp 0.15s ease-out 0.15s forwards",
        }}>
          {digit}
        </div>
      )}
    </div>
  );
};

// Metric Row Component - 1 measurement line
const MetricRow: React.FC<{
  label: string;
  value: number | null;
  unit: string;
  accentColor: string;
  icon: string;
  trend?: "up" | "down" | "normal";
}> = ({ label, value, unit, accentColor, icon, trend }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number>();

  useEffect(() => {
    if (value === null) return;
    const start = displayValue;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(start + (end - start) * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value]);

  const valueStr = displayValue.toFixed(1);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(51,65,85,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>{label}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {value !== null ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            {valueStr.split("").map((char, i) => (
              char === "." ? (
                <span key={i} style={{ color: accentColor, fontSize: "18px", fontWeight: 700, margin: "0 1px" }}>.</span>
              ) : (
                <OdometerDigit key={i} digit={char} accentColor={accentColor} />
              )
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "2px" }}>
            {["—", "—", ".", "—"].map((c, i) => (
              <span key={i} style={{ color: "#334155", fontFamily: "monospace", fontSize: "18px" }}>{c}</span>
            ))}
          </div>
        )}
        <span style={{ color: "#64748b", fontSize: "12px", minWidth: "24px" }}>{unit}</span>
        {trend && (
          <span style={{ fontSize: "12px", color: trend === "normal" ? "#22c55e" : trend === "up" ? "#f97316" : "#06b6d4" }}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "✓"}
          </span>
        )}
      </div>
    </div>
  );
};

export const BiometricMetrics: React.FC<BiometricMetricsProps> = ({
  measurements,
  weightKg,
  bmi,
  id = "biometric-metrics",
}) => {
  const bmiCategory = bmi
    ? bmi < 18.5 ? { label: "Underweight", color: "#06b6d4" }
    : bmi < 25   ? { label: "Normal Weight", color: "#22c55e" }
    : bmi < 30   ? { label: "Overweight", color: "#f97316" }
    : { label: "Obese", color: "#ef4444" }
    : null;

  const confColor = measurements
    ? measurements.extraction_confidence >= 0.85 ? "#22c55e"
    : measurements.extraction_confidence >= 0.65 ? "#f97316"
    : "#ef4444"
    : "#334155";

  return (
    <GlassCard accent="violet" padding="md" id={id} className="fv3d-metrics">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 8px #8b5cf6" }} />
          <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600, letterSpacing: "0.05em" }}>
            BIOMETRIC METRICS
          </span>
        </div>
        {measurements && (
          <div style={{
            padding: "4px 10px",
            borderRadius: "20px",
            background: `${confColor}20`,
            border: `1px solid ${confColor}40`,
          }}>
            <span style={{ color: confColor, fontSize: "11px", fontFamily: "monospace" }}>
              {(measurements.extraction_confidence * 100).toFixed(0)}% CONF
            </span>
          </div>
        )}
      </div>

      {/* Measurement rows */}
      <div>
        <MetricRow
          label="Chest Circumference" unit="cm" icon="👕" accentColor="#06b6d4"
          value={measurements?.chest_circ_cm ?? null} trend="normal"
        />
        <MetricRow
          label="Waist Circumference" unit="cm" icon="📏" accentColor="#8b5cf6"
          value={measurements?.waist_circ_cm ?? null} trend="normal"
        />
        <MetricRow
          label="Hip Circumference" unit="cm" icon="📐" accentColor="#06b6d4"
          value={measurements?.hip_circ_cm ?? null} trend="normal"
        />
        <MetricRow
          label="Shoulder Breadth" unit="cm" icon="🔱" accentColor="#8b5cf6"
          value={measurements?.shoulder_breadth_cm ?? null}
        />
        <MetricRow
          label="Stature Height" unit="cm" icon="📏" accentColor="#06b6d4"
          value={measurements?.stature_cm ?? null}
        />
        <MetricRow
          label="Body Weight" unit="kg" icon="⚖️" accentColor="#8b5cf6"
          value={weightKg ?? null}
        />
      </div>

      {/* BMI Block */}
      {bmi && bmiCategory && (
        <div style={{
          marginTop: "16px",
          padding: "14px 16px",
          borderRadius: "12px",
          background: `${bmiCategory.color}10`,
          border: `1px solid ${bmiCategory.color}30`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <p style={{ color: "#64748b", fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Body Mass Index
            </p>
            <p style={{ color: bmiCategory.color, fontSize: "13px", margin: 0, fontWeight: 600 }}>
              {bmiCategory.label}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              color: bmiCategory.color, fontSize: "28px", fontWeight: 700,
              fontFamily: "monospace",
              textShadow: `0 0 12px ${bmiCategory.color}`,
            }}>
              {bmi.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default BiometricMetrics;
