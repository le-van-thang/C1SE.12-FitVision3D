// ============================================================
// LANDING PAGE - EDITORIAL FASHION-TECH SHOWCASE
// ISO 8559-1 Anthropometric Sizing · Frameless ZOZOFIT 3D Viewport
// ============================================================
import React, { useState } from "react";
import {
  Box,
  Scissors,
  ArrowRight,
  LogIn,
  Store as StoreIcon,
  Clock,
  Shield,
  AlertTriangle,
  Table2,
  ScanLine,
} from "lucide-react";
import { MeshViewport } from "../features/anthropometry/MeshViewport";
import { DEMO_MEASUREMENT, DEMO_MESH, GARMENT_CATEGORIES, bmi } from "../data/mockData";
import type { BiometricInput } from "../types/database.types";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { UserProfileDropdown } from "@/components/common/UserProfileDropdown";
import { AuthModal } from "@/components/auth/AuthModal";
import { MerchantOnboardingModal } from "@/components/store/MerchantOnboardingModal";
import { StoreStatusModal } from "@/components/store/StoreStatusModal";
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
  const {
    currentStore,
    isAuthenticated,
    userRole,
    stores,
    openSignIn,
    openOnboarding,
    openStatusModal,
  } = useAuth();
  const { t } = useI18n();

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

  const isUser = userRole === 'user' || userRole === 'customer';
  const isStore = userRole === 'store' || userRole === 'tailor' || userRole === 'retailer';
  const isAdmin = userRole === 'admin';
  const pendingCount = stores.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="lp">
      {/* ── Top Navigation ── */}
      <header className="lp-nav" id="lp-nav">
        <div className="lp-container" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" className="lp-brand" id="lp-brand">
              <span className="lp-mark"><Box size={16} strokeWidth={1.5} /></span>
              <span>FitVision <b>3D</b></span>
            </a>
          
          </div>

          {/* Center Dynamic Links based on Role */}
          <nav className="lp-links" aria-label="Landing navigation">
            {/* Guest or Regular User Navigation */}
            {(!isAuthenticated || isUser) && (
              <>
                <a href="#features">{t("lp.nav.architecture")}</a>
                <a href="#how">{t("lp.nav.methodology")}</a>
                <a href="#results">{t("lp.nav.matching")}</a>
                <a href="/dashboard">{t("app.nav.dashboard")}</a>
              </>
            )}

            {/* Approved Store Partner Navigation */}
            {isAuthenticated && isStore && (
              <>
                <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ScanLine size={14} /> {t("app.nav.dashboard")}
                </a>
                <a href="/tailor" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Scissors size={14} /> {t("app.nav.tailor")}
                </a>
                <a href="/size-charts" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Table2 size={14} /> {t("app.nav.sizeCharts")}
                </a>
              </>
            )}

            {/* System Admin Navigation */}
            {isAuthenticated && isAdmin && (
              <>
                <a
                  href="/admin"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#A5B4FC",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(165, 180, 252, 0.3)",
                    padding: "4px 10px",
                    borderRadius: 8,
                  }}
                >
                  <Shield size={14} /> {t("app.nav.adminShort")}
                  {pendingCount > 0 && (
                    <span
                      style={{
                        background: "#F59E0B",
                        color: "#000",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 8,
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </a>
                <a href="/dashboard">{t("app.nav.dashboard")}</a>
              </>
            )}
          </nav>

          {/* Right Top Header CTA: Sleek Sign In Button OR User Profile Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <UserProfileDropdown />
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className="lp-btn lp-btn--secondary lp-btn--sm"
                id="lp-nav-signin"
                style={{
                  color: "#4FD1C5",
                  borderColor: "rgba(79, 209, 197, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <LogIn size={14} strokeWidth={2} />
                <span>{t("app.nav.signIn")}</span>
              </button>
            )}
          </div>
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
                  {t("lp.hero.kicker")}
                </div>

                <h1 className="lp-hero-title">
                  {t("lp.hero.titleA")} <br />
                  <span>{t("lp.hero.titleB")}</span>
                </h1>

                <p className="lp-hero-sub">
                  {t("lp.hero.sub")}
                </p>

                {/* Central Hero CTA - UNTOUCHED per specification */}
                <div className="lp-cta">
                  <a href={APP_URL} className="lp-btn lp-btn--primary" id="lp-cta-scan">
                    {t("lp.hero.cta")} <ArrowRight size={16} strokeWidth={2} />
                  </a>
                  <a href="/tailor" className="lp-btn lp-btn--secondary" id="lp-cta-tailor">
                    <Scissors size={15} strokeWidth={1.5} /> {t("app.nav.tailor")}
                  </a>
                </div>

                {/* Inline Quick Size Estimator */}
                <div className="lp-estimator-inline" id="lp-estimator" aria-label="Quick size estimator">
                  <div className="lp-estimator-header">
                    <span className="lp-estimator-title">{t("lp.est.title")}</span>
                    <span className="lp-estimator-badge">{t("lp.est.badge")}</span>
                  </div>

                  <div className="lp-estimator-grid">
                    <div className="lp-field">
                      <label htmlFor="stature-input">{t("lp.est.stature")}</label>
                      <input
                        id="stature-input"
                        type="number"
                        min="120"
                        max="230"
                        value={stature}
                        onChange={(e) => setStature(e.target.value.replace(/^0+(?=\d)/, ''))}
                        placeholder="172"
                      />
                    </div>

                    <div className="lp-field">
                      <label htmlFor="weight-input">{t("lp.est.weight")}</label>
                      <input
                        id="weight-input"
                        type="number"
                        min="35"
                        max="200"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value.replace(/^0+(?=\d)/, ''))}
                        placeholder="70"
                      />
                    </div>

                    <div className="lp-field">
                      <label htmlFor="gender-select">{t("lp.est.gender")}</label>
                      <select
                        id="gender-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as BiometricInput["gender"])}
                      >
                        <option value="male">{t("lp.est.male")}</option>
                        <option value="female">{t("lp.est.female")}</option>
                        <option value="other">{t("lp.est.other")}</option>
                      </select>
                    </div>

                    <div className="lp-field">
                      <label htmlFor="category-select">{t("lp.est.garment")}</label>
                      <select
                        id="category-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {GARMENT_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {t(`garment.${c.id}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="lp-estimator-footer">
                    <div className="lp-estimator-bmi">
                      <span>{t("lp.est.bmi")}</span>
                      <strong className="mono">{computedBmi ?? "—"}</strong>
                      <span className="lp-estimator-bmi-label">
                        {computedBmi ? (computedBmi < 18.5 ? t("lp.est.under") : computedBmi < 25 ? t("lp.est.normal") : t("lp.est.over")) : ""}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="lp-btn lp-btn--secondary lp-btn--sm"
                      onClick={start}
                      id="lp-estimator-apply"
                    >
                      {t("lp.est.preload")}
                    </button>
                  </div>
                </div>

                <div className="lp-hero-facts">
                  <div>
                    <span className="lp-fact-val mono">ISO 8559-1</span>
                    <span className="lp-fact-label">{t("lp.facts.f1")}</span>
                  </div>
                  <div className="lp-fact-divider" />
                  <div>
                    <span className="lp-fact-val mono">&lt; 1.5s</span>
                    <span className="lp-fact-label">{t("lp.facts.f2")}</span>
                  </div>
                  <div className="lp-fact-divider" />
                  <div>
                    <span className="lp-fact-val mono">0-byte</span>
                    <span className="lp-fact-label">{t("lp.facts.f3")}</span>
                  </div>
                </div>
              </div>

              {/* Right Column (45%): Frameless Three.js ZOZOFIT Mesh Viewport */}
              <div className="lp-hero-viewport" id="lp-hero-mesh">
                <div className="lp-viewport-frame">
                  <MeshViewport
                    meshParams={DEMO_MESH}
                    measurement={DEMO_MEASUREMENT}
                    height={520}
                  />
                  <div className="lp-viewport-tag">
                    <span className="lp-viewport-dot" />
                    {t("lp.hero.viewportTag")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pillars: Asymmetric Bento Grid ── */}
        <section className="lp-container" id="features" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="lp-section-header">
            <div className="lp-section-kicker">{t("lp.features.kicker")}</div>
            <h2 className="lp-section-title">{t("lp.features.title")}</h2>
            <p className="lp-section-sub">
              {t("lp.features.sub")}
            </p>
          </div>

          <div className="lp-bento-grid">
            {EDITORIAL_PILLARS.map((p, i) => (
              <article
                key={p.num}
                className={`lp-bento-card ${i === 0 ? "lp-bento-card--lg" : ""}`}
              >
                <div className="lp-bento-num mono">{p.num}</div>
                <div className="lp-bento-tag">{t(`lp.pillars.p${i + 1}.tag`)}</div>
                <h3 className="lp-bento-title">{t(`lp.pillars.p${i + 1}.title`)}</h3>
                <p className="lp-bento-desc">{t(`lp.pillars.p${i + 1}.desc`)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Methodology / Process Steps ── */}
        <section className="lp-container" id="how" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <div className="lp-section-header">
            <div className="lp-section-kicker">{t("lp.how.kicker")}</div>
            <h2 className="lp-section-title">{t("lp.how.title")}</h2>
            <p className="lp-section-sub">
              {t("lp.how.sub")}
            </p>
          </div>

          <div className="lp-steps-grid">
            {STEPS.map((s, i) => (
              <div className="lp-step-card" key={s.n}>
                <span className="lp-step-num">{s.n}</span>
                <h3 className="lp-step-title">{t(`lp.steps.s${i + 1}.title`)}</h3>
                <p className="lp-step-desc">{t(`lp.steps.s${i + 1}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample Garment Sizing Recommendations ── */}
        <section className="lp-container" id="results" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="lp-section-header">
            <div className="lp-section-kicker">{t("lp.results.kicker")}</div>
            <h2 className="lp-section-title">{t("lp.results.title")}</h2>
            <p className="lp-section-sub">
              {t("lp.results.sub")}
            </p>
          </div>

          <div className="lp-rec-grid">
            {SAMPLES.map((s) => (
              <article className="lp-rec-card" key={s.brand_name}>
                <div className="lp-rec-head">
                  <strong style={{ fontSize: 15, color: "var(--white)", fontWeight: 600 }}>
                    {s.brand_name === "Urban Atelier"
                      ? t("brand.urban")
                      : s.brand_name === "Nordic Thread"
                      ? t("brand.nordic")
                      : s.brand_name === "Atelier Hanoi"
                      ? t("brand.hanoi")
                      : s.brand_name}
                  </strong>
                  <span className="lp-pill">{t(`fitlbl.${s.fit_type}`)}</span>
                </div>
                <div className="lp-rec-size mono">{t("meas.sizePrefix")} {s.recommended_size}</div>
                <div className="lp-rec-deltas">
                  <div>
                    <small>{t("lp.results.chest")}</small>
                    <b className="mono" style={{ color: s.chest_allowance > 0 ? "var(--lime)" : "var(--white)" }}>
                      {formatAllowance(s.chest_allowance)} <span style={{ color: "var(--muted)", fontSize: 11 }}>cm</span>
                    </b>
                  </div>
                  <div>
                    <small>{t("lp.results.waist")}</small>
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
              <h2>{t("lp.privacy.title")}</h2>
              <p>
                {t("lp.privacy.desc")}
              </p>
            </div>
            <a href={APP_URL} className="lp-btn lp-btn--primary" id="lp-band-cta" style={{ flexShrink: 0 }}>
              {t("lp.privacy.cta")}
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-container">
        <div className="lp-footer">
          <span>© 2026 FitVision 3D</span>
        </div>
      </footer>

      {/* Global Auth & Merchant Modals */}
      <AuthModal />
      <MerchantOnboardingModal />
      <StoreStatusModal />
    </div>
  );
};

export default Landing;
