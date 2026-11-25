// ============================================================
// SIZE CHART MANAGER
// brand_size_charts + garment_categories (name, target_gender)
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Save, RotateCcw, AlertTriangle, ArrowLeft } from "lucide-react";
import { Navbar } from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { BRAND_NAMES, GARMENT_CATEGORIES, buildSizeRows, type SizeRow } from "../data/mockData";
import { type FitType } from "../types/fitting.types";
import type { GarmentCategory } from "../types/database.types";

type NumKey = Exclude<keyof SizeRow, "id" | "size_label">;

const COLUMNS: NumKey[] = ["min_chest", "max_chest", "min_waist", "max_waist", "min_hip", "max_hip"];
const GENDERS: GarmentCategory["target_gender"][] = ["male", "female", "unisex"];

const fitFromEase = (e: number): FitType => (e < 1.5 ? "slim" : e < 3 ? "regular" : e < 4.5 ? "relaxed" : "oversized");
const mid = (a: number | null, b: number | null) => (((a ?? 0) + (b ?? 0)) / 2);
const getSizeChartStorageKey = (brand: string, gender: string, categoryId: number) =>
  `fv3d_size_chart_v1_${brand}_${gender}_${categoryId}`;

function loadSavedSizeChart(brand: string, gender: string, categoryId: number): { rows: SizeRow[]; ease: number } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(getSizeChartStorageKey(brand, gender, categoryId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.rows) || parsed.rows.length === 0) return null;
    return {
      rows: parsed.rows,
      ease: Number.isFinite(Number(parsed.ease)) ? Number(parsed.ease) : 2.5,
    };
  } catch {
    return null;
  }
}

export const SizeChartManager: React.FC = () => {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const [brand, setBrand] = useState<string>(BRAND_NAMES[0]);
  const [gender, setGender] = useState<GarmentCategory["target_gender"]>("unisex");
  const initialCategoryId = GARMENT_CATEGORIES.find((c) => c.target_gender === "unisex")!.id;
  const [categoryId, setCategoryId] = useState<number>(initialCategoryId);
  const initialSaved = loadSavedSizeChart(BRAND_NAMES[0], "unisex", initialCategoryId);
  const [ease, setEase] = useState<number>(() => initialSaved?.ease ?? 2.5);
  const [rows, setRows] = useState<SizeRow[]>(() => initialSaved?.rows ?? buildSizeRows(BRAND_NAMES[0]));
  const [simChest, setSimChest] = useState(93.5);
  const [simWaist, setSimWaist] = useState(78);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadSavedSizeChart(brand, gender, categoryId);
    if (saved) {
      setRows(saved.rows);
      setEase(saved.ease);
    } else {
      setRows(buildSizeRows(brand));
      setEase(2.5);
    }
  }, [brand, gender, categoryId]);

  const categories = useMemo(() => GARMENT_CATEGORIES.filter((c) => c.target_gender === gender), [gender]);
  const selectedCategory = useMemo(
    () => GARMENT_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  );
  const isBottomCategory = useMemo(
    () => /quần|váy|pant|trouser|jean|skirt|short|bottom/i.test(selectedCategory?.name || ""),
    [selectedCategory?.name]
  );

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const changeBrand = (b: string) => { setBrand(b); };
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

  // Simulator: match waist range for bottoms (pants/skirts), chest range for tops
  const result = useMemo(() => {
    const effChest = simChest + ease;
    const effWaist = simWaist + ease;
    const best = isBottomCategory
      ? rows.find((r) => effWaist >= (r.min_waist ?? 0) && effWaist <= (r.max_waist ?? 0)) ??
        [...rows].sort((a, b) => Math.abs(mid(a.min_waist, a.max_waist) - effWaist) - Math.abs(mid(b.min_waist, b.max_waist) - effWaist))[0]
      : rows.find((r) => effChest >= (r.min_chest ?? 0) && effChest <= (r.max_chest ?? 0)) ??
        [...rows].sort((a, b) => Math.abs(mid(a.min_chest, a.max_chest) - effChest) - Math.abs(mid(b.min_chest, b.max_chest) - effChest))[0];
    return {
      recommended_size: best.size_label,
      fit_type: fitFromEase(ease),
      chest_delta_cm: effChest - mid(best.min_chest, best.max_chest),
      waist_delta_cm: effWaist - mid(best.min_waist, best.max_waist),
    };
  }, [rows, simChest, simWaist, ease, isBottomCategory]);

  const save = () => {
    const category = selectedCategory || GARMENT_CATEGORIES.find((c) => c.id === categoryId)!;
    const payload = { brand_name: brand, category: category.name, target_gender: gender, ease_tolerance_cm: ease, sizes: rows };
    try {
      localStorage.setItem(getSizeChartStorageKey(brand, gender, categoryId), JSON.stringify({ ease, rows }));
    } catch {
      // Ignore storage quota errors
    }
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    flash(t("sizes.saved"));
  };

  const reset = () => {
    try {
      localStorage.removeItem(getSizeChartStorageKey(brand, gender, categoryId));
    } catch {
      // Ignore storage errors
    }
    setRows(buildSizeRows(brand));
    setEase(2.5);
    flash(t("sizes.resetDone"));
  };
  const delta = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
  const backRoute = userRole === "admin" ? "/admin" : userRole === "store" ? "/shop" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Header */}
        <div className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b-2 border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#14161A] tracking-tight leading-tight">
              {t("sizes.title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {t("sizes.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to={backRoute}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs transition-all"
            >
              <ArrowLeft size={14} />
              <span>{t("app.nav.dashboard", "Phòng Đo 3D")}</span>
            </Link>
            <button
              id="btn-reset-size-chart"
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw size={15} strokeWidth={2} />
              <span>{t("sizes.reset")}</span>
            </button>
            <button
              id="btn-save-size-chart"
              type="button"
              onClick={save}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Save size={15} strokeWidth={2} />
              <span>{t("sizes.save")}</span>
            </button>
          </div>
        </div>

        {toast && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
            {toast}
          </div>
        )}
        {overlaps.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle size={16} strokeWidth={2} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">{overlaps.map((o) => <div key={o}>{o}</div>)}</div>
          </div>
        )}

        {/* Configuration bar */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
              {t("sizes.brand")}
            </span>
            <select
              id="select-brand"
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#14171C] focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 outline-none cursor-pointer transition-all"
              value={brand}
              onChange={(e) => changeBrand(e.target.value)}
            >
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

          <label className="block space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
              {t("sizes.targetFit")}
            </span>
            <select
              id="select-target-gender"
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#14171C] focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 outline-none cursor-pointer transition-all"
              value={gender}
              onChange={(e) => changeGender(e.target.value as GarmentCategory["target_gender"])}
            >
              {GENDERS.map((g) => <option key={g} value={g}>{t("sizes.gender." + g)}</option>)}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
              {t("sizes.garmentType")}
            </span>
            <select
              id="select-category"
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#14171C] focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 outline-none cursor-pointer transition-all"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t("garment." + c.id) || c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                {t("sizes.easeAllowance")}
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-[#F5EBD8] text-[#14171C] border border-[#E5D3B3]">
                +{ease.toFixed(1)} cm
              </span>
            </div>
            <div className="h-9 flex items-center px-1">
              <input
                id="slider-ease-tolerance"
                className="w-full accent-[#14171C] cursor-pointer"
                type="range"
                min="0.5"
                max="6"
                step="0.1"
                value={ease}
                onChange={(e) => setEase(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Matrix */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="table-size-chart">
              <thead>
                <tr className="bg-[#14171C] text-white">
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider">
                    {t("sizes.col.size")}
                  </th>
                  {COLUMNS.map((c) => (
                    <th key={c} className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider">
                      {t("sizes.col." + c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={row.id} className="hover:bg-[#F5EBD8]/25 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-lg bg-[#14171C] text-[#F5EBD8] font-mono text-xs font-black">
                        {row.size_label}
                      </span>
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c} className="px-4 py-2.5">
                        <input
                          type="number"
                          step="0.5"
                          className="w-24 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-2.5 py-1.5 font-mono text-xs sm:text-sm font-bold text-slate-900 text-center outline-none transition-all"
                          value={row[c] ?? 0}
                          onChange={(e) => edit(i, c, e.target.value)}
                          aria-label={`${row.size_label} ${c}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fit simulator */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b-2 border-slate-100 pb-2.5">
            {t("sizes.simulator")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">{t("sizes.sampleChest")}</span>
                <input
                  id="sim-input-chest"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#14171C] focus:bg-white rounded-xl px-3 py-2 font-mono text-sm font-black text-slate-900 outline-none transition-all"
                  type="number"
                  step="0.5"
                  value={simChest}
                  onChange={(e) => setSimChest(parseFloat(e.target.value) || 0)}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">{t("sizes.sampleWaist")}</span>
                <input
                  id="sim-input-waist"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#14171C] focus:bg-white rounded-xl px-3 py-2 font-mono text-sm font-black text-slate-900 outline-none transition-all"
                  type="number"
                  step="0.5"
                  value={simWaist}
                  onChange={(e) => setSimWaist(parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>

            <div className="lg:col-span-7 rounded-2xl bg-[#F5EBD8]/70 border border-[#E5D3B3] p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  {t("sizes.recommended")}
                </span>
                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-[#14171C] text-[#F5EBD8] font-mono text-2xl font-black shadow-xs">
                  {result.recommended_size}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  {t("sizes.fitStyle")}
                </span>
                <span className="text-sm font-black text-[#14171C]">
                  {t("sizes.fitSuffix").replace("{fit}", t("sizes.fit." + result.fit_type))}
                </span>
              </div>

              {([[t("sizes.chestAllowance"), result.chest_delta_cm], [t("sizes.waistAllowance"), result.waist_delta_cm]] as const).map(([label, d]) => (
                <div key={label}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    {label}
                  </span>
                  <div className={`font-mono text-base font-black ${d >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {delta(d)} <span className="text-xs font-bold text-slate-600">cm</span>
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
