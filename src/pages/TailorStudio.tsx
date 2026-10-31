// ============================================================
// TAILOR STUDIO (B2B)
// Strictly: profiles · biometric_inputs · measurements ·
// mesh_parameters · tailor_dossiers
// ============================================================
import React, { useState } from "react";
import { FileDown, KeyRound, Search, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { MeshViewport } from "../features/anthropometry/MeshViewport";
import { DOSSIERS } from "../data/mockData";

const Spec: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="zf-row">
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

const cm = (n: number | null) => (n == null ? "—" : <>{n.toFixed(1)}<em>cm</em></>);
const fmtDate = (iso: string) =>
  new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";

export const TailorStudio: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [token, setToken] = useState(DOSSIERS[0].dossier.access_token);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const rec = DOSSIERS[idx];
  const { profile, biometric: b, measurement: m, mesh, dossier } = rec;

  const authenticate = (e: React.FormEvent) => {
    e.preventDefault();
    const hit = DOSSIERS.findIndex((d) => d.dossier.access_token === token.trim());
    if (hit < 0) return setNotice({ kind: "err", text: "Invalid dossier access token." });
    if (new Date(DOSSIERS[hit].dossier.token_expires_at) < new Date())
      return setNotice({ kind: "err", text: "This dossier access token has expired." });
    setIdx(hit);
    setNotice({ kind: "ok", text: `Authenticated · ${DOSSIERS[hit].profile.full_name}` });
  };

  const pick = (i: number) => {
    setIdx(i);
    setToken(DOSSIERS[i].dossier.access_token);
    setNotice(null);
  };

  const exportPdf = () => (dossier.pdf_export_url ? window.open(dossier.pdf_export_url, "_blank") : window.print());

  return (
    <div className="zf-app">
      <Navbar />

      <main className="zf-main zf-main--tailor" style={{ paddingTop: "36px" }}>
        <div style={{ marginBottom: 24 }} className="no-print">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="zf-title">Tailor Studio</h1>
              <p className="zf-sub">Client biometric dossiers and precision specifications shared via encrypted token.</p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#A3E635",
                background: "rgba(163, 230, 53, 0.08)",
                border: "1px solid rgba(163, 230, 53, 0.25)",
                padding: "4px 10px",
                borderRadius: "9999px",
              }}
            >
              <ShieldCheck size={14} strokeWidth={2} />
              Privacy Mode: Zero-Retention Active
            </span>
          </div>
        </div>

        {/* Header bar: tailor_dossiers */}
        <form
          className="zf-card zf-card-pad no-print"
          onSubmit={authenticate}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            gap: 20,
            alignItems: "end",
            marginBottom: 24,
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <label className="zf-field">
            <span>Dossier Share Token</span>
            <div style={{ position: "relative" }}>
              <KeyRound size={15} strokeWidth={1.5} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
              <input
                id="input-access-token"
                className="zf-input mono"
                style={{ paddingLeft: 36 }}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                spellCheck={false}
              />
            </div>
          </label>
          <div className="zf-field">
            <span>Valid Until</span>
            <div className="mono" style={{ height: 40, display: "flex", alignItems: "center", fontSize: 13, color: "var(--label)" }}>
              {fmtDate(dossier.token_expires_at)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" id="btn-authenticate" className="zf-btn zf-btn--secondary">
              Authenticate
            </button>
            <button
              type="button"
              id="btn-export-pdf"
              className="zf-btn zf-btn--primary"
              onClick={exportPdf}
              title={dossier.pdf_export_url ?? "Print or save this tailor dossier as PDF"}
            >
              <FileDown size={16} strokeWidth={1.5} />
              Export PDF
            </button>
          </div>
          {notice && <div className={`zf-notice ${notice.kind}`} style={{ gridColumn: "1 / -1" }}>{notice.text}</div>}
        </form>

        <div className="zf-tailor">
          {/* Client selector: profiles + biometric_inputs.gender */}
          <aside className="zf-card zf-card-pad no-print" aria-label="Clients">
            <div className="zf-section-head" style={{ marginBottom: 12 }}>
              <h2 className="zf-eyebrow">Client Dossiers</h2>
              <Search size={14} strokeWidth={1.5} color="var(--muted)" />
            </div>
            {DOSSIERS.map((d, i) => (
              <button
                key={d.profile.id}
                id={`client-${i}`}
                className={`zf-client ${i === idx ? "active" : ""}`}
                onClick={() => pick(i)}
              >
                <div className="top">
                  <strong style={{ fontSize: 14, fontWeight: 600 }}>{d.profile.full_name}</strong>
                  <span className="zf-pill" style={{ textTransform: "capitalize" }}>{d.biometric.gender}</span>
                </div>
                <small>{d.profile.email}</small>
              </button>
            ))}
          </aside>

          {/* Mesh preview */}
          <section className="zf-card zf-card-pad" aria-label="Mesh preview">
            <div className="zf-section-head">
              <h2 className="zf-eyebrow">Anatomical Topology</h2>
              <span className="zf-pill mono">{mesh.base_gender_mesh}</span>
            </div>
            <MeshViewport meshParams={mesh} measurement={m} height={520} />
          </section>

          {/* Dossier specification */}
          <section className="zf-card zf-card-pad" aria-label="Dossier specification">
            <div className="zf-section-head" style={{ marginBottom: 6 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>{profile.full_name}</h2>
                <p className="zf-sub" style={{ marginTop: 2 }}>{profile.email}</p>
              </div>
              <span className={`zf-pill mono ${m.extraction_confidence >= 0.85 ? "zf-pill--lime" : "zf-pill--teal"}`}>
                {(m.extraction_confidence * 100).toFixed(0)}% SLA
              </span>
            </div>

            <h3 className="zf-eyebrow zf-group-label">Body Measurements</h3>
            <div className="zf-rows">
              <Spec label="Chest" value={cm(m.chest_circ_cm)} />
              <Spec label="Waist" value={cm(m.waist_circ_cm)} />
              <Spec label="Hips" value={cm(m.hip_circ_cm)} />
              <Spec label="Shoulders" value={cm(m.shoulder_breadth_cm)} />
              <Spec label="Inseam" value={cm(m.inseam_cm)} />
              <Spec label="Measurement Accuracy" value={`${(m.extraction_confidence * 100).toFixed(0)}% (${m.extraction_confidence.toFixed(2)})`} />
            </div>

            <h3 className="zf-eyebrow zf-group-label">Biometric Inputs</h3>
            <div className="zf-rows">
              <Spec label="Gender" value={<span style={{ textTransform: "capitalize" }}>{b.gender}</span>} />
              <Spec label="Height" value={cm(b.stature_cm)} />
              <Spec label="Weight" value={<>{b.weight_kg.toFixed(1)}<em>kg</em></>} />
              <Spec label="BMI Index" value={b.calculated_bmi?.toFixed(2) ?? "—"} />
            </div>

            <h3 className="zf-eyebrow zf-group-label">Mesh Deformation Parameters</h3>
            <div className="zf-rows">
              <Spec label="Anatomical Base" value={mesh.base_gender_mesh} />
              <Spec label="Chest Scale Factor" value={mesh.scale_chest.toFixed(3)} />
              <Spec label="Waist Scale Factor" value={mesh.scale_waist.toFixed(3)} />
              <Spec label="Hip Scale Factor" value={mesh.scale_hips.toFixed(3)} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TailorStudio;
