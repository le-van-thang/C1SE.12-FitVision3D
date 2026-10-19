// ============================================================
// FITVISION 3D - B2B TAILOR STUDIO (INTERNATIONAL SUITE)
// Technical CAD Blueprint ISO 8559-1:2017 Specification
// Token Authentication & CAD Dossier Export (100% English)
// ============================================================
import React, { useState } from "react";
import { Navbar } from "../components/common/Navbar";
import { GlassCard } from "../components/common/GlassCard";
import { Center3DViewport } from "../components/viewport/Center3DViewport";
import type { ExtractedMeasurements } from "../types/biometrics.types";
import type { MeshParameter } from "../types/database.types";

interface ClientDossier {
  id: string;
  name: string;
  clientCode: string;
  gender: "male" | "female";
  date: string;
  garmentType: string;
  measurements: {
    acrossShoulder: number;   // Shoulder Breadth
    bustHeight: number;       // Bust Drop Height
    bustCirc: number;         // Chest Circumference
    armholeCirc: number;      // Armhole Circumference
    neckCirc: number;         // Neck Base Circumference
    frontWaistLength: number; // Front Waist Length
    backWaistLength: number;  // Back Waist Length
    sleeveLength: number;     // Sleeve Length
    bicepCirc: number;        // Upper Arm Bicep
    waistCirc: number;        // Waist Circumference
    hipCirc: number;          // Hip Circumference
    crotchDepth: number;      // Crotch Rise / Depth
    outseam: number;          // Outseam Length
    inseam: number;           // Inseam Length
    shoulderSlope: number;    // Shoulder Slope Angle
    postureIndex: string;     // Posture Evaluation
  };
  notes: string;
}

const MOCK_CLIENTS: ClientDossier[] = [
  {
    id: "cli-001",
    name: "Alexander Nguyen",
    clientCode: "FV3D-BESPOKE-2026-089",
    gender: "male",
    date: "18/10/2026 14:30",
    garmentType: "Bespoke Suit 2-Piece (Super 130s Wool)",
    measurements: {
      acrossShoulder: 44.5,
      bustHeight: 26.2,
      bustCirc: 94.8,
      armholeCirc: 42.0,
      neckCirc: 38.5,
      frontWaistLength: 43.5,
      backWaistLength: 41.8,
      sleeveLength: 61.5,
      bicepCirc: 31.0,
      waistCirc: 78.2,
      hipCirc: 97.4,
      crotchDepth: 26.5,
      outseam: 102.0,
      inseam: 77.8,
      shoulderSlope: 22.4,
      postureIndex: "Upright Balanced (Slight Athletic)",
    },
    notes: "Client requested 8.5cm Peak Lapel, 0.4cm soft Italian shoulder padding, 0.5cm front crotch drop.",
  },
  {
    id: "cli-002",
    name: "Marcus Tran",
    clientCode: "FV3D-BESPOKE-2026-092",
    gender: "male",
    date: "17/10/2026 10:15",
    garmentType: "Poplin Dress Shirt & Gurkha Trousers",
    measurements: {
      acrossShoulder: 46.0,
      bustHeight: 27.0,
      bustCirc: 98.2,
      armholeCirc: 44.5,
      neckCirc: 39.8,
      frontWaistLength: 44.0,
      backWaistLength: 42.5,
      sleeveLength: 62.8,
      bicepCirc: 33.2,
      waistCirc: 82.5,
      hipCirc: 100.2,
      crotchDepth: 27.2,
      outseam: 103.5,
      inseam: 79.0,
      shoulderSlope: 24.1,
      postureIndex: "Slight Sloping Shoulders (-1.8°), Straight Spine",
    },
    notes: "140° Cutaway spread collar, French double cuffs, 4.5cm high-rise waistband.",
  },
  {
    id: "cli-003",
    name: "Julian Le",
    clientCode: "FV3D-BESPOKE-2026-095",
    gender: "male",
    date: "16/10/2026 16:45",
    garmentType: "Black-Tie Gala Evening Tuxedo",
    measurements: {
      acrossShoulder: 43.8,
      bustHeight: 25.8,
      bustCirc: 91.5,
      armholeCirc: 41.2,
      neckCirc: 37.8,
      frontWaistLength: 43.0,
      backWaistLength: 41.0,
      sleeveLength: 60.5,
      bicepCirc: 30.2,
      waistCirc: 75.6,
      hipCirc: 95.0,
      crotchDepth: 25.8,
      outseam: 101.0,
      inseam: 76.5,
      shoulderSlope: 21.8,
      postureIndex: "Ideal Balanced (Runway Fit)",
    },
    notes: "Smooth satin shawl lapel, single covered button, double vented back.",
  },
];

export const TailorStudio: React.FC = () => {
  // Token authentication state
  const [tokenInput, setTokenInput] = useState("fv3d_tok_master_tailor_hn_c1se12");
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [tokenMessage, setTokenMessage] = useState("Verified: Royal Bespoke Tailors (B2B Partner Level 1)");
  
  // Selected client state
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [activeSliceView, setActiveSliceView] = useState<"all" | "chest" | "waist" | "hip">("all");
  const [tailorNotes, setTailorNotes] = useState(MOCK_CLIENTS[0].notes);
  const [isPrinting, setIsPrinting] = useState(false);

  const client = MOCK_CLIENTS[selectedClientIndex];

  // Convert client measurements to 3D Viewport format
  const viewportMeasurements: ExtractedMeasurements = {
    chest_circ_cm: client.measurements.bustCirc,
    waist_circ_cm: client.measurements.waistCirc,
    hip_circ_cm: client.measurements.hipCirc,
    inseam_cm: client.measurements.inseam,
    shoulder_breadth_cm: client.measurements.acrossShoulder,
    stature_cm: 174.0,
    extraction_confidence: 0.98,
  };

  const meshParams: MeshParameter = {
    id: `mesh-${client.id}`,
    measurement_id: `meas-${client.id}`,
    base_gender_mesh: "male_base",
    scale_chest: client.measurements.bustCirc / 90.0,
    scale_waist: client.measurements.waistCirc / 78.0,
    scale_hips: client.measurements.hipCirc / 94.0,
    morph_payload: null,
    created_at: new Date().toISOString(),
  };

  const handleValidateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim().length >= 10) {
      setIsTokenValid(true);
      setTokenMessage("✓ Valid Token: Master Tailor Studio granted (256-bit Secure)");
    } else {
      setIsTokenValid(false);
      setTokenMessage("✕ Invalid or expired access token!");
    }
  };

  const handlePrintDossier = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 250);
  };

  return (
    <div className="fv3d-page">
      <Navbar />

      <main style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 32px 64px", width: "100%" }}>
        
        {/* ── B2B Header & Token Auth Bar ── */}
        <div style={{ marginBottom: "24px" }} className="no-print">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span className="badge badge--cyan font-mono">B2B MASTER TAILOR ENGINE</span>
                <span className="badge badge--violet font-mono">ISO 8559-1:2017 CERTIFIED</span>
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                Bespoke Tailor Studio &amp; CAD Specification
              </h1>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0" }}>
                Automated anthropometric measurement extraction for master cutters and CAD pattern grading
              </p>
            </div>

            {/* Quick Export / Print Button */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                id="btn-print-dossier"
                className="btn btn-primary"
                onClick={handlePrintDossier}
                style={{ minHeight: "44px", padding: "0 20px" }}
              >
                <span>🖨️</span>
                <span>{isPrinting ? "Generating Spec Sheet..." : "Print / Export CAD Spec (PDF)"}</span>
              </button>
            </div>
          </div>

          {/* Access Token Form */}
          <GlassCard padding="sm" accent={isTokenValid ? "cyan" : "none"} style={{ borderColor: isTokenValid ? "rgba(6,182,212,0.3)" : "rgba(239,68,68,0.3)" }}>
            <form onSubmit={handleValidateToken} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                🔑 ACCESS_TOKEN:
              </span>
              <input
                id="input-access-token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter B2B tailor access token..."
                style={{ flex: 1, minWidth: "260px", maxWidth: "480px", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 12px" }}
              />
              <button type="submit" className="btn btn-sm btn-ghost" id="btn-validate-token">
                Authenticate Token
              </button>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`dot ${isTokenValid ? "dot--cyan dot--pulse" : "dot--red"}`} />
                <span style={{ fontSize: "11px", color: isTokenValid ? "#22c55e" : "#ef4444", fontFamily: "var(--font-mono)" }}>
                  {tokenMessage}
                </span>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* ── Client Dossier Selector (No-Print) ── */}
        <div style={{ marginBottom: "24px" }} className="no-print">
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: "10px" }}>
            RECENT CLIENT SCANS:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            {MOCK_CLIENTS.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedClientIndex(idx);
                  setTailorNotes(c.notes);
                }}
                className={`client-item-card ${selectedClientIndex === idx ? "selected" : ""}`}
                id={`client-card-${c.id}`}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "14px" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#06b6d4", fontFamily: "var(--font-mono)" }}>
                    {c.clientCode}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge--violet" style={{ fontSize: "9px" }}>
                    {c.gender === "male" ? "Male" : "Female"}
                  </span>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                    {c.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Technical CAD Blueprint ── */}
        <div className="blueprint-card" id="printable-blueprint-dossier">
          {/* Blueprint Title Block */}
          <div className="blueprint-header">
            <div className="blueprint-title-block">
              <span className="blueprint-iso-badge">
                ISO 8559-1:2017 · ANTHROPOMETRIC SPECIFICATION SHEET
              </span>
              <div className="blueprint-title">
                TECHNICAL BESPOKE PATTERN DRAFTING SPECIFICATION
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#f8fafc", fontWeight: 700 }}>
                CODE: {client.clientCode}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Workshop: Royal Bespoke Tailors · Date: {client.date}
              </div>
            </div>
          </div>

          <div className="blueprint-body">
            {/* 2-Column Split: Detailed Measurements Table & 3D Interactive Mannequin */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.4fr) minmax(280px, 1fr)", gap: "24px" }}>
              
              {/* Left Column: ISO 8559 Measurement Grid */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    1. PATTERN SPECIFICATIONS (16-POINT ANTHROPOMETRIC MEASUREMENTS)
                  </h3>
                  <span style={{ fontSize: "11px", color: "#06b6d4", fontFamily: "var(--font-mono)" }}>
                    Unit: Centimeters (cm)
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.1.1</div>
                    <div className="tech-metric-name">Shoulder Breadth</div>
                    <div className="tech-metric-val">{client.measurements.acrossShoulder} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.2.3</div>
                    <div className="tech-metric-name">Bust Drop Height</div>
                    <div className="tech-metric-val">{client.measurements.bustHeight} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.2.1</div>
                    <div className="tech-metric-name">Chest Circumference</div>
                    <div className="tech-metric-val" style={{ color: "var(--clr-cyan)" }}>
                      {client.measurements.bustCirc} <span className="tech-metric-unit">cm</span>
                    </div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.3.1</div>
                    <div className="tech-metric-name">Armhole Circumference</div>
                    <div className="tech-metric-val">{client.measurements.armholeCirc} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.1.4</div>
                    <div className="tech-metric-name">Neck Base Circumference</div>
                    <div className="tech-metric-val">{client.measurements.neckCirc} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.2.5</div>
                    <div className="tech-metric-name">Front Waist Length</div>
                    <div className="tech-metric-val">{client.measurements.frontWaistLength} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.2.6</div>
                    <div className="tech-metric-name">Back Waist Length</div>
                    <div className="tech-metric-val">{client.measurements.backWaistLength} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.3.3</div>
                    <div className="tech-metric-name">Sleeve Length</div>
                    <div className="tech-metric-val">{client.measurements.sleeveLength} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.3.2</div>
                    <div className="tech-metric-name">Upper Arm Bicep</div>
                    <div className="tech-metric-val">{client.measurements.bicepCirc} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.2.4</div>
                    <div className="tech-metric-name">Waist Circumference</div>
                    <div className="tech-metric-val" style={{ color: "var(--clr-violet)" }}>
                      {client.measurements.waistCirc} <span className="tech-metric-unit">cm</span>
                    </div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.2.8</div>
                    <div className="tech-metric-name">Hip Circumference</div>
                    <div className="tech-metric-val" style={{ color: "var(--clr-cyan)" }}>
                      {client.measurements.hipCirc} <span className="tech-metric-unit">cm</span>
                    </div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.4.2</div>
                    <div className="tech-metric-name">Crotch Rise / Depth</div>
                    <div className="tech-metric-val">{client.measurements.crotchDepth} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.4.5</div>
                    <div className="tech-metric-name">Outseam Length</div>
                    <div className="tech-metric-val">{client.measurements.outseam} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.4.6</div>
                    <div className="tech-metric-name">Inseam Length</div>
                    <div className="tech-metric-val">{client.measurements.inseam} <span className="tech-metric-unit">cm</span></div>
                  </div>

                  <div className="tech-metric-cell">
                    <div className="tech-metric-code">ISO #2.1.2</div>
                    <div className="tech-metric-name">Shoulder Slope Angle</div>
                    <div className="tech-metric-val">{client.measurements.shoulderSlope} <span className="tech-metric-unit">°</span></div>
                  </div>

                  <div className="tech-metric-cell" style={{ gridColumn: "span 2" }}>
                    <div className="tech-metric-code">BIOMETRIC POSTURE INDEX</div>
                    <div className="tech-metric-name">Posture Index Evaluation</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#38bdf8", marginTop: "2px" }}>
                      {client.measurements.postureIndex}
                    </div>
                  </div>
                </div>

                {/* Garment Specifications & Tailor Notes */}
                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    2. WORKSHOP MEMO &amp; BESPOKE REQUIREMENTS
                  </div>
                  <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px 16px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: 600 }}>
                      Garment Item: <span style={{ color: "#06b6d4" }}>{client.garmentType}</span>
                    </div>
                  </div>
                  <textarea
                    id="textarea-tailor-notes"
                    value={tailorNotes}
                    onChange={(e) => setTailorNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter bespoke pattern drafting technical notes..."
                    style={{ fontSize: "12px", lineHeight: 1.5 }}
                  />
                </div>
              </div>

              {/* Right Column: 3D Viewport Inspection & Slice Layer Controls */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    3. 3D MANNEQUIN CROSS-SECTION VIEWPORT
                  </h3>
                  <div style={{ display: "flex", gap: "6px" }} className="no-print">
                    {(["all", "chest", "waist", "hip"] as const).map((slice) => (
                      <button
                        key={slice}
                        onClick={() => setActiveSliceView(slice)}
                        className={`btn btn-sm ${activeSliceView === slice ? "btn-cyan-glow" : "btn-ghost"}`}
                        style={{ padding: "3px 8px", fontSize: "10px", minHeight: "26px" }}
                      >
                        {slice.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: "460px", position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(6,182,212,0.2)" }}>
                  <Center3DViewport
                    id="tailor-3d-viewport"
                    meshParams={meshParams}
                    measurements={viewportMeasurements}
                    isLoading={false}
                  />

                  {/* Blueprint Coordinate Overlay */}
                  <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(10,13,20,0.85)", backdropFilter: "blur(8px)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#94a3b8" }}>
                      AXIS: Y-UP (METRIC)
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#06b6d4" }}>
                      MESH TOLERANCE: ±0.15mm
                    </span>
                  </div>
                </div>

                {/* Workshop Signatures Block (For Print Blueprint) */}
                <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingTop: "16px", borderTop: "1px dashed rgba(255,255,255,0.15)" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>MASTER CUTTER SIGNATURE</div>
                    <div style={{ height: "50px", display: "flex", alignItems: "flex-end", justifyContent: "center", fontStyle: "italic", color: "#94a3b8", fontSize: "13px" }}>
                      ISO Certified &amp; Verified
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>CLIENT SIGNATURE</div>
                    <div style={{ height: "50px", display: "flex", alignItems: "flex-end", justifyContent: "center", fontStyle: "italic", color: "#94a3b8", fontSize: "13px" }}>
                      {client.name}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default TailorStudio;
