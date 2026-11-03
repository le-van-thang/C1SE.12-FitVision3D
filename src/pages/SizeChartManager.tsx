// ============================================================
// SIZE CHART MANAGER
// brand_size_charts + garment_categories (name, target_gender)
// ============================================================
import React, { useMemo, useState } from "react";
import { Save, RotateCcw, AlertTriangle } from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { useI18n } from "../i18n";
import { BRAND_NAMES, GARMENT_CATEGORIES, buildSizeRows, type SizeRow } from "../data/mockData";
import { type FitType } from "../types/fitting.types";
import type { GarmentCategory } from "../types/database.types";

type NumKey = Exclude<keyof SizeRow, "id" | "size_label">;

const COLUMNS: NumKey[] = ["min_chest", "max_chest", "min_waist", "max_waist", "min_hip", "max_hip"];
const GENDERS: GarmentCategory["target_gender"][] = ["male", "female", "unisex"];

const fitFromEase = (e: number): FitType => (e < 1.5 ? "slim" : e < 3 ? "regular" : e < 4.5 ? "relaxed" : "oversized");
const mid = (a: number | null, b: number | null) => (((a ?? 0) + (b ?? 0)) / 2);

export const SizeChartManager: React.FC = () => {
  const { t } = useI18n();
  const [brand, setBrand] = useState<string>(BRAND_NAMES[0]);
  const [gender, setGender] = useState<GarmentCategory["target_gender"]>("unisex");
  const [categoryId, setCategoryId] = useState<number>(GARMENT_CATEGORIES.find((c) => c.target_gender === "unisex")!.id);
  const [ease, setEase] = useState(2.5);
  const [rows, setRows] = useState<SizeRow[]>(() => buildSizeRows(BRAND_NAMES[0]));
  const [simChest, setSimChest] = useState(93.5);
  const [simWaist, setSimWaist] = useState(78);
  const [toast, setToast] = useState<string | null>(null);

  const categories = useMemo(() => GARMENT_CATEGORIES.filter((c) => c.target_gender === gender), [gender]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const changeBrand = (b: string) => { setBrand(b); setRows(buildSizeRows(b)); };
  const changeGender = (g: GarmentCategory["target_gender"]) => {
    setGender(g);
    setCategoryId(GARMENT_CATEGORIES.find((c) => c.target_gender === g)!.id);
  };

  const edit = (i: number, key: NumKey, v: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: parseFloat(v) || 0 } : row)));

  const overlaps = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i], n = rows[i + 1];
      if ((a.max_chest ?? 0) > (n.min_chest ?? 0)) out.push(t("sizes.overlapChest").replace("{a}", a.size_label).replace("{amax}", String(a.max_chest)).replace("{b}", n.size_label).replace("{bmin}", String(n.min_chest)));
      if ((a.max_waist ?? 0) > (n.min_waist ?? 0)) out.push(t("sizes.overlapWaist").replace("{a}", a.size_label).replace("{amax}", String(a.max_waist)).replace("{b}", n.size_label).replace("{bmin}", String(n.min_waist)));
    }
    return out;
  }, [rows, t]);

  // Simulator: effective measurement = body + ease_tolerance_cm
  const result = useMemo(() => {
    const eff = simChest + ease;
    const exact = rows.find((r) => eff >= (r.min_chest ?? 0) && eff <= (r.max_chest ?? 0));
    const best = exact ?? [...rows].sort((a, b) => Math.abs(mid(a.min_chest, a.max_chest) - eff) - Math.abs(mid(b.min_chest, b.max_chest) - eff))[0];
    return {
      recommended_size: best.size_label,
      fit_type: fitFromEase(ease),
      chest_delta_cm: eff - mid(best.min_chest, best.max_chest),
      waist_delta_cm: simWaist + ease - mid(best.min_waist, best.max_waist),
    };
  }, [rows, simChest, simWaist, ease]);

  const save = () => {
    const category = GARMENT_CATEGORIES.find((c) => c.id === categoryId)!;
    const payload = { brand_name: brand, category: category.name, target_gender: gender, ease_tolerance_cm: ease, sizes: rows };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    flash(t("sizes.saved"));
  };

  const reset = () => { setRows(buildSizeRows(brand)); setEase(2.5); flash(t("sizes.resetDone")); };
  const delta = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`;

  return (
    <div className="zf-app">
      <Navbar />

      <main className="zf-main" style={{ paddingTop: "36px" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <h1 className="zf-title">{t("sizes.title")}</h1>
            <p className="zf-sub">{t("sizes.subtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button id="btn-reset-size-chart" className="zf-btn zf-btn--ghost" onClick={reset}><RotateCcw size={16} strokeWidth={1.5} />{t("sizes.reset")}</button>
            <button id="btn-save-size-chart" className="zf-btn zf-btn--primary" onClick={save}><Save size={16} strokeWidth={1.5} />{t("sizes.save")}</button>
          </div>
        </div>

        {toast && <div className="zf-notice ok" style={{ marginBottom: 16 }}>{toast}</div>}
        {overlaps.length > 0 && (
          <div className="zf-notice err" style={{ marginBottom: 16, display: "flex", gap: 10 }}>
            <AlertTriangle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{overlaps.map((o) => <div key={o}>{o}</div>)}</div>
          </div>
        )}

        {/* Configuration bar */}
        <section className="zf-card zf-card-pad zf-config" style={{ marginBottom: 20 }}>
          <label className="zf-field">
            <span>{t("sizes.brand")}</span>
            <select id="select-brand" className="zf-select" value={brand} onChange={(e) => changeBrand(e.target.value)}>
              {BRAND_NAMES.map((b) => (
                <option key={b} value={b}>
                  {b === "Urban Atelier"
                    ? t("brand.urban")
                    : b === "Nordic Thread"
                    ? t("brand.nordic")
                    : b === "Atelier Hanoi"
                    ? t("brand.hanoi")
                    : b}
                </option>
              ))}
            </select>
          </label>
          <label className="zf-field">
            <span>{t("sizes.targetFit")}</span>
            <select id="select-target-gender" className="zf-select" value={gender} onChange={(e) => changeGender(e.target.value as GarmentCategory["target_gender"])}>
              {GENDERS.map((g) => <option key={g} value={g}>{t("sizes.gender." + g)}</option>)}
            </select>
          </label>
          <label className="zf-field">
            <span>{t("sizes.garmentType")}</span>
            <select id="select-category" className="zf-select" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t("garment." + c.id) || c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="zf-field">
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("sizes.easeAllowance")}</span>
              <b className="mono" style={{ color: "var(--white)", fontWeight: 500 }}>+{ease.toFixed(1)} cm</b>
            </span>
            <div style={{ height: 40, display: "flex", alignItems: "center" }}>
              <input id="slider-ease-tolerance" className="zf-slider" type="range" min="0.5" max="6" step="0.1"
                value={ease} onChange={(e) => setEase(parseFloat(e.target.value))} />
            </div>
          </div>
        </section>

        {/* Matrix */}
        <section className="zf-card" style={{ marginBottom: 20 }}>
          <div className="zf-table-wrap">
            <table className="zf-table" id="table-size-chart">
              <thead>
                <tr><th>{t("sizes.col.size")}</th>{COLUMNS.map((c) => <th key={c}>{t("sizes.col." + c)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td><span className="zf-size-label">{row.size_label}</span></td>
                    {COLUMNS.map((c) => (
                      <td key={c}>
                        <input type="number" step="0.5" className="zf-cell-input" value={row[c] ?? 0} onChange={(e) => edit(i, c, e.target.value)} aria-label={`${row.size_label} ${c}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fit simulator */}
        <section className="zf-card zf-card-pad">
          <div className="zf-section-head"><h2 className="zf-eyebrow">{t("sizes.simulator")}</h2></div>
          <div className="zf-sim">
            <label className="zf-field">
              <span>{t("sizes.sampleChest")}</span>
              <input id="sim-input-chest" className="zf-input mono" type="number" step="0.5" value={simChest} onChange={(e) => setSimChest(parseFloat(e.target.value) || 0)} />
            </label>
            <label className="zf-field">
              <span>{t("sizes.sampleWaist")}</span>
              <input id="sim-input-waist" className="zf-input mono" type="number" step="0.5" value={simWaist} onChange={(e) => setSimWaist(parseFloat(e.target.value) || 0)} />
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div className="zf-eyebrow">{t("sizes.recommended")}</div>
                <div className="zf-size" style={{ fontSize: 32 }}>{result.recommended_size}</div>
              </div>
              <div>
                <div className="zf-eyebrow">{t("sizes.fitStyle")}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{t("sizes.fitSuffix").replace("{fit}", t("sizes.fit." + result.fit_type))}</div>
              </div>
              {([[t("sizes.chestAllowance"), result.chest_delta_cm], [t("sizes.waistAllowance"), result.waist_delta_cm]] as const).map(([label, d]) => (
                <div key={label}>
                  <div className="zf-eyebrow">{label}</div>
                  <div className="mono" style={{ fontSize: 16, marginTop: 4, color: d > 0 ? "var(--lime)" : "var(--white)" }}>
                    {delta(d)} <span style={{ color: "var(--muted)", fontSize: 12 }}>cm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SizeChartManager;
