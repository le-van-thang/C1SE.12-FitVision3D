// ============================================================
// LANDING PAGE - EDITORIAL FASHION-TECH SHOWCASE
// ISO 8559-1 Anthropometric Sizing · Frameless ZOZOFIT 3D Viewport
// ============================================================
import React, { useState } from "react";
import { Box, Scissors, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { MeshViewport } from "../features/anthropometry/MeshViewport";
import { DEMO_MEASUREMENT, DEMO_MESH, GARMENT_CATEGORIES, bmi } from "../data/mockData";
import { FIT_TYPE_LABELS } from "../types/fitting.types";
import type { BiometricInput } from "../types/database.types";
import "./Landing.css";

const APP_URL = "/dashboard";

const EDITORIAL_PILLARS = [
  {
    num: "01",
    tag: "Dual Camera Extraction",
    title: "Dual-Perspective Biometric Scan",
    desc: "Anatomical landmark detection paired with Ramanujan ellipse calculus computes true cross-sectional circumference from just one front and one profile photo.",
  },
  {
    num: "02",
    tag: "Dynamic 3D Geometry",
    title: "Real-Time Humanoid Topology",
    desc: "Direct bone morphing and ZOZOFIT dual-layer wireframe render an accurate anatomical representation of your torso, waist, and hips in real time.",
  },
  {
    num: "03",
    tag: "ISO 8559-1 Certified",
    title: "Zero-Retention Ephemeral Privacy",
    desc: "Scan frames are processed entirely in ephemeral RAM and immediately discarded. No camera footage or biometric photos ever touch disk storage.",
  },
  {
    num: "04",
    tag: "B2B Atelier Bridge",
    title: "Bespoke Tailor Specification Dossiers",
    desc: "Instantly generate encrypted client measurement dossiers accessible via expiring token and export complete sizing breakdowns to PDF.",
  },
];

const STEPS = [
  { n: "01", title: "Calibrate", desc: "Hold any standard A4 sheet or card for sub-millimeter pixel scaling." },
  { n: "02", title: "Capture", desc: "Align your posture in the viewfinder for a front and a profile photo." },
  { n: "03", title: "Synthesize", desc: "Local algorithms compute chest, waist, hips, and inseam circumferences." },
  { n: "04", title: "Recommend", desc: "Match ease allowances against real brand garment sizing matrixes." },
];

const SAMPLES = [
  {
    brand_name: "Urban Atelier",
    recommended_size: "M",
    fit_type: "regular" as const,
    chest_allowance: 0.4,
    waist_allowance: -0.8,
  },
  {
    brand_name: "Nordic Thread",
    recommended_size: "L",
    fit_type: "slim" as const,
    chest_allowance: 1.2,
    waist_allowance: 0.3,
  },
];

const formatAllowance = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`;

export const Landing: React.FC = () => {
  const [stature, setStature] = useState("172");
  const [weight, setWeight] = useState("70");
  const [gender, setGender] = useState<BiometricInput["gender"]>("male");
  const [category, setCategory] = useState(GARMENT_CATEGORIES[0].name);

  const h = parseFloat(stature);
  const w = parseFloat(weight);
  const computedBmi = h > 0 && w > 0 ? bmi(w, h) : null;

  const start = () => {
    if (h > 0 && w > 0) {
      sessionStorage.setItem(
        "fv3d_estimator",
        JSON.stringify({ stature_cm: h, weight_kg: w, gender, category })
      );
    }
    window.location.assign(APP_URL);
  };

  return (
    <div className="lp">
      {/* ── Top Navigation ── */}
      <header className="lp-nav" id="lp-nav">
        <div className="lp-container" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" className="lp-brand" id="lp-brand">
            <span className="lp-mark"><Box size={16} strokeWidth={1.5} /></span>
            <span>FitVision <b>3D</b></span>
          </a>

          <nav className="lp-links" aria-label="Landing navigation">
            <a href="#features">Architecture</a>
            <a href="#how">Methodology</a>
            <a href="#results">Garment Matching</a>
            <a href="/tailor">Tailor Studio</a>
          </nav>

          <a href={APP_URL} className="lp-btn lp-btn--primary lp-btn--sm" id="lp-nav-start">
            Start Body Scan
          </a>
        </div>
      </header>

      <main>
        {/* ── Editorial Hero Section (55% / 45%) ── */}
        <section className="lp-hero-wrap" id="lp-hero">
          <div className="lp-container">
            <div className="lp-hero">
              {/* Left Column (55%): Kicker, Headline, Subtitle, CTA, Inline Estimator & Facts */}
              <div className="lp-hero-copy">
                <div className="lp-kicker">
                  <span className="lp-kicker-dot" />
                  ISO 8559-1 Biometric Sizing
                </div>

                <h1 className="lp-hero-title">
                  Find Your <br />
                  <span>Perfect Fit</span>
                </h1>

                <p className="lp-hero-sub">
                  Clinical-grade anthropometric extraction from two standard photos. Instant 3D humanoid topology and real-world brand size matching with zero photo retention.
                </p>

                <div className="lp-cta">
                  <a href={APP_URL} className="lp-btn lp-btn--primary" id="lp-cta-scan">
                    Start body scan <ArrowRight size={16} strokeWidth={2} />
                  </a>
                  <a href="/tailor" className="lp-btn lp-btn--secondary" id="lp-cta-tailor">
                    <Scissors size={15} strokeWidth={1.5} /> Tailor Studio
                  </a>
                </div>

                {/* Inline Quick Size Estimator */}
                <div className="lp-estimator-inline" id="lp-estimator" aria-label="Quick size estimator">
                  <div className="lp-estimator-header">
                    <span className="lp-estimator-title">Quick Size Estimator</span>
                    <span className="lp-estimator-badge">Instant Calibration</span>
                  </div>

                  <div className="lp-estimator-grid">
                    <label className="lp-field">
                      <span>Height (cm)</span>
                      <input
                        id="lp-stature"
                        type="number"
                        className="mono"
                        value={stature}
                        onChange={(e) => setStature(e.target.value)}
                      />
                    </label>

                    <label className="lp-field">
                      <span>Weight (kg)</span>
                      <input
                        id="lp-weight"
                        type="number"
                        className="mono"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </label>

                    <label className="lp-field">
                      <span>Gender</span>
                      <select
                        id="lp-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as BiometricInput["gender"])}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    <label className="lp-field">
                      <span>Garment Type</span>
                      <select
                        id="lp-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {GARMENT_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="lp-estimator-footer">
                    <div className="lp-estimator-bmi">
                      <span>BMI Index</span>
                      <b className="mono">{computedBmi ? computedBmi.toFixed(1) : "—"}</b>
                    </div>
                    <button className="lp-btn lp-btn--primary lp-btn--sm" id="lp-estimate" onClick={start}>
                      <Sparkles size={14} strokeWidth={1.5} /> Estimate Size
                    </button>
                  </div>
                </div>

                {/* Clinical Telemetry Facts */}
                <div className="lp-hero-facts">
                  <div>
                    <span className="lp-fact-label">Scan Speed</span>
                    <span className="lp-fact-val mono">2.4s</span>
                  </div>
                  <div className="lp-fact-divider" />
                  <div>
                    <span className="lp-fact-label">Privacy Mode</span>
                    <span className="lp-fact-val" style={{ color: "var(--lime)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <ShieldCheck size={14} strokeWidth={2} /> Zero-Retention Active
                    </span>
                  </div>
                  <div className="lp-fact-divider" />
                  <div>
                    <span className="lp-fact-label">Biometric Standard</span>
                    <span className="lp-fact-val mono">ISO 8559-1</span>
                  </div>
                </div>
              </div>

              {/* Right Column (45%): Frameless ZOZOFIT 3D Human Viewport */}
              <div className="lp-hero-visual">
                <MeshViewport
                  meshParams={DEMO_MESH}
                  measurement={DEMO_MEASUREMENT}
                  height={580}
                  id="lp-mesh"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Asymmetric Bento Architecture Grid (replaces 4 identical boxes) ── */}
        <section className="lp-container" id="features" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="lp-section-header">
            <div className="lp-section-kicker">Engineered For Precision</div>
            <h2 className="lp-section-title">Anatomical extraction without compromise</h2>
            <p className="lp-section-sub">
              Engineered to replace subjective measuring tapes with certified computer vision and parametric deformers.
            </p>
          </div>

          <div className="lp-bento-grid">
            {EDITORIAL_PILLARS.map((p) => (
              <div className="lp-bento-item" key={p.num}>
                <div className="lp-bento-top">
                  <span className="lp-bento-num">{p.num}</span>
                  <span className="lp-bento-tag">{p.tag}</span>
                </div>
                <h3 className="lp-bento-title">{p.title}</h3>
                <p className="lp-bento-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Methodology / Steps ── */}
        <section className="lp-container" id="how" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="lp-section-header">
            <div className="lp-section-kicker">Methodology</div>
            <h2 className="lp-section-title">How precision sizing works</h2>
            <p className="lp-section-sub">
              A streamlined 4-step biometric extraction pipeline executed strictly within your browser.
            </p>
          </div>

          <div className="lp-steps-grid">
            {STEPS.map((s) => (
              <div className="lp-step-item" key={s.n}>
                <span className="lp-step-num">{s.n}</span>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample Garment Sizing Recommendations ── */}
        <section className="lp-container" id="results" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="lp-section-header">
            <div className="lp-section-kicker">Garment Matching</div>
            <h2 className="lp-section-title">Real-world brand size calibration</h2>
            <p className="lp-section-sub">
              Individual brand charts are compared against your exact cross-sections with tailor ease allowances.
            </p>
          </div>

          <div className="lp-rec-grid">
            {SAMPLES.map((s) => (
              <article className="lp-rec-card" key={s.brand_name}>
                <div className="lp-rec-head">
                  <strong style={{ fontSize: 15, color: "var(--white)", fontWeight: 600 }}>{s.brand_name}</strong>
                  <span className="lp-pill">{FIT_TYPE_LABELS[s.fit_type]} fit</span>
                </div>
                <div className="lp-rec-size mono">{s.recommended_size}</div>
                <div className="lp-rec-deltas">
                  <div>
                    <small>Chest Allowance</small>
                    <b className="mono" style={{ color: s.chest_allowance > 0 ? "var(--lime)" : "var(--white)" }}>
                      {formatAllowance(s.chest_allowance)} <span style={{ color: "var(--muted)", fontSize: 11 }}>cm</span>
                    </b>
                  </div>
                  <div>
                    <small>Waist Allowance</small>
                    <b className="mono" style={{ color: s.waist_allowance > 0 ? "var(--lime)" : "var(--white)" }}>
                      {formatAllowance(s.waist_allowance)} <span style={{ color: "var(--muted)", fontSize: 11 }}>cm</span>
                    </b>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Ephemeral Zero-Retention Band ── */}
        <section className="lp-container" id="privacy">
          <div className="lp-band">
            <div>
              <h2>Your photos never leave your device</h2>
              <p>
                Image frames are processed exclusively in volatile browser RAM and permanently discarded upon calculation. Only anonymized numerical measurements are retained.
              </p>
            </div>
            <a href={APP_URL} className="lp-btn lp-btn--primary" id="lp-band-cta" style={{ flexShrink: 0 }}>
              Start Scan
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-container">
        <div className="lp-footer">
          <span>© 2026 FitVision 3D · Team C1SE.12 · ISO 8559-1 Biometrics</span>
          <span>Advisor: Dr. Le Minh Thai</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
