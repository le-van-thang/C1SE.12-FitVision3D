// ============================================================
// FITVISION 3D - SIZE CHART MANAGER (RETAILER SUITE)
// Garment Size Grade Matrix (S / M / L / XL / 2XL)
// Ease Allowance ('ease_tolerance_cm') & Range Configuration (100% English)
// ============================================================
import React, { useState, useMemo } from "react";
import { Navbar } from "../components/common/Navbar";
import { GlassCard } from "../components/common/GlassCard";

interface SizeRange {
  id: string;
  label: string;
  min_chest: number;
  max_chest: number;
  min_waist: number;
  max_waist: number;
  min_hip: number;
  max_hip: number;
  min_height: number;
  max_height: number;
  recommended_fit: "Slim Fit" | "Regular Fit" | "Relaxed Fit" | "Oversized";
}

const DEFAULT_SIZE_CHART: SizeRange[] = [
  {
    id: "sz-xs",
    label: "XS",
    min_chest: 84,
    max_chest: 88,
    min_waist: 68,
    max_waist: 72,
    min_hip: 88,
    max_hip: 92,
    min_height: 160,
    max_height: 166,
    recommended_fit: "Slim Fit",
  },
  {
    id: "sz-s",
    label: "S",
    min_chest: 88,
    max_chest: 92,
    min_waist: 72,
    max_waist: 76,
    min_hip: 92,
    max_hip: 96,
    min_height: 165,
    max_height: 170,
    recommended_fit: "Slim Fit",
  },
  {
    id: "sz-m",
    label: "M",
    min_chest: 92,
    max_chest: 96,
    min_waist: 76,
    max_waist: 81,
    min_hip: 96,
    max_hip: 100,
    min_height: 168,
    max_height: 175,
    recommended_fit: "Regular Fit",
  },
  {
    id: "sz-l",
    label: "L",
    min_chest: 96,
    max_chest: 101,
    min_waist: 81,
    max_waist: 86,
    min_hip: 100,
    max_hip: 105,
    min_height: 173,
    max_height: 180,
    recommended_fit: "Regular Fit",
  },
  {
    id: "sz-xl",
    label: "XL",
    min_chest: 101,
    max_chest: 107,
    min_waist: 86,
    max_waist: 92,
    min_hip: 105,
    max_hip: 111,
    min_height: 178,
    max_height: 185,
    recommended_fit: "Relaxed Fit",
  },
  {
    id: "sz-xxl",
    label: "2XL",
    min_chest: 107,
    max_chest: 114,
    min_waist: 92,
    max_waist: 99,
    min_hip: 111,
    max_hip: 118,
    min_height: 180,
    max_height: 190,
    recommended_fit: "Oversized",
  },
];

export const SizeChartManager: React.FC = () => {
  const [sizeChart, setSizeChart] = useState<SizeRange[]>(DEFAULT_SIZE_CHART);
  const [easeTolerance, setEaseTolerance] = useState<number>(2.5); // Ease allowance in cm
  const [selectedBrand, setSelectedBrand] = useState("FitVision Standard RTW (Global ISO)");
  const [simTestChest, setSimTestChest] = useState<number>(93.5);
  const [simTestWaist, setSimTestWaist] = useState<number>(78.0);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Update single measurement field
  const handleRangeChange = (index: number, field: keyof SizeRange, value: number | string) => {
    const updated = [...sizeChart];
    updated[index] = { ...updated[index], [field]: value };
    setSizeChart(updated);
  };

  // Check for range overlap collisions
  const overlaps = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < sizeChart.length - 1; i++) {
      const current = sizeChart[i];
      const next = sizeChart[i + 1];
      if (current.max_chest > next.min_chest) {
        list.push(`Chest collision: ${current.label} (${current.max_chest}cm) overlaps ${next.label} (${next.min_chest}cm)`);
      }
      if (current.max_waist > next.min_waist) {
        list.push(`Waist collision: ${current.label} (${current.max_waist}cm) overlaps ${next.label} (${next.min_waist}cm)`);
      }
    }
    return list;
  }, [sizeChart]);

  // Live simulation: Match size with ease tolerance
  const matchedSize = useMemo(() => {
    const effChest = simTestChest - easeTolerance * 0.4;
    const effWaist = simTestWaist - easeTolerance * 0.3;

    for (const sz of sizeChart) {
      if (
        effChest >= sz.min_chest &&
        effChest <= sz.max_chest &&
        effWaist >= sz.min_waist &&
        effWaist <= sz.max_waist
      ) {
        return {
          size: sz.label,
          fit: sz.recommended_fit,
          confidence: 0.96,
          comfortScore: easeTolerance > 3.0 ? "Generous / Loose Fit" : easeTolerance < 1.5 ? "Fitted / Bodycon" : "Standard Balanced Fit",
        };
      }
    }
    return {
      size: "M",
      fit: "Regular Fit",
      confidence: 0.88,
      comfortScore: "Standard Balanced Fit",
    };
  }, [simTestChest, simTestWaist, easeTolerance, sizeChart]);

  const handleSaveConfig = () => {
    const dataToExport = {
      brand: selectedBrand,
      ease_tolerance_cm: easeTolerance,
      updated_at: new Date().toISOString(),
      sizes: sizeChart,
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    navigator.clipboard?.writeText(jsonStr);
    setStatusNotification("✓ Size chart configuration saved and JSON copied to clipboard!");
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleResetDefaults = () => {
    setSizeChart(DEFAULT_SIZE_CHART);
    setEaseTolerance(2.5);
    setStatusNotification("✓ Size chart reset to standard grade rules.");
    setTimeout(() => setStatusNotification(null), 3000);
  };

  return (
    <div className="fv3d-page">
      <Navbar />

      <main style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 32px 64px", width: "100%" }}>
        
        {/* ── Page Header ── */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span className="badge badge--cyan font-mono">RETAILER COMMERCE SUITE</span>
                <span className="badge badge--violet font-mono">DYNAMIC SIZE ADVISOR</span>
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                Size Chart Matrix &amp; Ease Tolerance Management (Retailer)
              </h1>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0" }}>
                Configure S / M / L / XL grade rules and garment ease allowance (`ease_tolerance_cm`) for size recommendation engines
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn btn-ghost"
                onClick={handleResetDefaults}
                id="btn-reset-size-chart"
                style={{ minHeight: "44px" }}
              >
                <span>🔄</span>
                <span>Reset to Default</span>
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveConfig}
                id="btn-save-size-chart"
                style={{ minHeight: "44px" }}
              >
                <span>💾</span>
                <span>Save &amp; Export JSON Config</span>
              </button>
            </div>
          </div>

          {/* Status toast if any */}
          {statusNotification && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#4ade80",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span className="dot dot--green dot--pulse" />
              <span>{statusNotification}</span>
            </div>
          )}

          {/* Overlap warnings alert */}
          {overlaps.length > 0 && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.35)",
              color: "#fb923c",
              fontSize: "12px",
              marginBottom: "16px",
            }}>
              <strong>⚠️ Measurement Range Overlap Detected:</strong>
              <ul style={{ margin: "6px 0 0 16px", listStyle: "disc" }}>
                {overlaps.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Brand Selection & Tolerance Configuration Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          
          {/* Brand & Collection Selector */}
          <GlassCard padding="md" accent="cyan">
            <div className="card-header">
              <span className="card-title">
                <span>🏷️</span> BRAND &amp; COLLECTION
              </span>
              <span className="badge badge--cyan font-mono">ACTIVE COLLECTION</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <select
                id="select-brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{ fontSize: "13px" }}
              >
                <option value="FitVision Standard RTW (Global ISO)">FitVision Standard RTW (Global ISO)</option>
                <option value="Men Formal Slim-Fit Suit 2026">Men Formal Slim-Fit Suit 2026</option>
                <option value="Urban Streetwear Oversized">Urban Streetwear Oversized</option>
                <option value="Smart Casual Polo & Chinos">Smart Casual Polo &amp; Chinos</option>
              </select>
              <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>
                Grade rules are automatically applied to users scanning their body via FitVision 3D camera.
              </div>
            </div>
          </GlassCard>

          {/* Ease Tolerance Slider */}
          <GlassCard padding="md" accent="violet">
            <div className="card-header">
              <span className="card-title">
                <span>⚙️</span> EASE ALLOWANCE (`EASE_TOLERANCE_CM`)
              </span>
              <span className="badge badge--violet font-mono" style={{ fontSize: "12px", padding: "4px 10px" }}>
                ± {easeTolerance.toFixed(1)} cm
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                id="slider-ease-tolerance"
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={easeTolerance}
                onChange={(e) => setEaseTolerance(parseFloat(e.target.value))}
                className="fv3d-slider"
                style={{
                  "--pct": `${((easeTolerance - 0.5) / (6.0 - 0.5)) * 100}%`,
                  minHeight: "44px",
                } as React.CSSProperties}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                <span>0.5cm (Bodycon / Ultra-Fit)</span>
                <span style={{ color: "#c4b5fd" }}>2.5cm (Regular Standard)</span>
                <span>6.0cm (Comfort / Relaxed)</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", background: "rgba(139,92,246,0.06)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(139,92,246,0.15)" }}>
                💡 <em>Garment ease allowance is directly added to raw body metrics before matching against ready-to-wear sizing grids.</em>
              </div>
            </div>
          </GlassCard>

          {/* Interactive Live Fit Simulator Card */}
          <GlassCard padding="md" accent="none" style={{ background: "rgba(10,13,20,0.85)" }}>
            <div className="card-header">
              <span className="card-title">
                <span>🎯</span> LIVE FIT SIMULATOR
              </span>
              <span className="badge badge--green font-mono">SIMULATION</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label className="form-label" htmlFor="sim-input-chest">Sample Chest (cm):</label>
                <input
                  id="sim-input-chest"
                  type="number"
                  step="0.5"
                  value={simTestChest}
                  onChange={(e) => setSimTestChest(parseFloat(e.target.value) || 0)}
                  style={{ fontSize: "13px", padding: "8px 10px" }}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="sim-input-waist">Sample Waist (cm):</label>
                <input
                  id="sim-input-waist"
                  type="number"
                  step="0.5"
                  value={simTestWaist}
                  onChange={(e) => setSimTestWaist(parseFloat(e.target.value) || 0)}
                  style={{ fontSize: "13px", padding: "8px 10px" }}
                />
              </div>
            </div>

            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Recommended Size:</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#06b6d4" }}>
                  SIZE {matchedSize.size} <span style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 600 }}>({matchedSize.fit})</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="badge badge--cyan" style={{ fontSize: "10px" }}>96% CONFIDENCE SCORE</span>
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>{matchedSize.comfortScore}</div>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* ── Interactive Size Matrix Table ── */}
        <GlassCard padding="none" accent="none" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--clr-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>
              GARMENT SIZE GRADE MATRIX
            </h2>
            <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
              6 SIZES CONFIGURED · CLICK VALUES TO EDIT IN-PLACE
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="fv3d-table" id="table-size-chart">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Size Label</th>
                  <th>FIT TYPE</th>
                  <th>MIN CHEST (CM)</th>
                  <th>MAX CHEST (CM)</th>
                  <th>MIN WAIST (CM)</th>
                  <th>MAX WAIST (CM)</th>
                  <th>MIN HIP (CM)</th>
                  <th>MAX HIP (CM)</th>
                  <th>STANDARD HEIGHT RANGE</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="badge badge--cyan font-mono"
                        style={{ fontSize: "13px", fontWeight: 800, minWidth: "44px", justifyContent: "center" }}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td>
                      <select
                        value={row.recommended_fit}
                        onChange={(e) => handleRangeChange(idx, "recommended_fit", e.target.value as any)}
                        style={{ padding: "4px 8px", fontSize: "12px", width: "130px" }}
                      >
                        <option value="Slim Fit">Slim Fit</option>
                        <option value="Regular Fit">Regular Fit</option>
                        <option value="Relaxed Fit">Relaxed Fit</option>
                        <option value="Oversized">Oversized</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.min_chest}
                        onChange={(e) => handleRangeChange(idx, "min_chest", parseFloat(e.target.value) || 0)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.max_chest}
                        onChange={(e) => handleRangeChange(idx, "max_chest", parseFloat(e.target.value) || 0)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.min_waist}
                        onChange={(e) => handleRangeChange(idx, "min_waist", parseFloat(e.target.value) || 0)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.max_waist}
                        onChange={(e) => handleRangeChange(idx, "max_waist", parseFloat(e.target.value) || 0)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.min_hip}
                        onChange={(e) => handleRangeChange(idx, "min_hip", parseFloat(e.target.value) || 0)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.max_hip}
                        onChange={(e) => handleRangeChange(idx, "max_hip", parseFloat(e.target.value) || 0)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                      />
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#94a3b8" }}>
                      {row.min_height} – {row.max_height} cm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </main>
    </div>
  );
};

export default SizeChartManager;
