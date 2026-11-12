import React, { useState, useEffect, useMemo } from "react";
import { Shirt, Scissors, Sparkles, CheckCircle2, ShieldCheck, Zap, Globe2, SlidersHorizontal, AlertCircle } from "lucide-react";
import type { AiMeasurementResponse } from "../../services/aiService";
import { useI18n } from "../../i18n";
import { recommendGarmentSizes, SizeSystem, FitPreference } from "../../utils/garmentSizeCalculator";

export interface AiGarmentCardProps {
  data: AiMeasurementResponse["garment_size_recommendations"];
  executionTime?: number;
  isLiveBackend?: boolean;
  measurements?: {
    chieu_cao_cm?: number | null;
    vong_nguc_cm: number;
    vong_eo_cm: number;
    vong_mong_cm?: number | null;
    rong_vai_cm?: number | null;
    dai_chan_inseam_cm?: number | null;
    can_nang_kg?: number | null;
  };
  gender?: "male" | "female" | "neutral";
}

const STORAGE_KEY_SYSTEM = "fv3d_preferred_size_system";
const STORAGE_KEY_FIT = "fv3d_preferred_fit";

const localizedBodyShape = (text: string, loc: string) => {
  if (!text) return "";
  const lower = text.toLowerCase();
  if (loc === "vi") {
    const match = text.match(/\(([^)]+)\)/);
    if (match) return match[1].trim();
    if (lower.includes("athletic") || lower.includes("v-shape")) return "Thể thao, ngực nở eo thon";
    if (lower.includes("balanced") || lower.includes("regular")) return "Cân đối tiêu chuẩn";
    if (lower.includes("comfort") || lower.includes("relaxed")) return "Dáng người đầy đặn";
    if (lower.includes("slim")) return "Dáng người thon gọn";
    if (lower.includes("hourglass")) return "Dáng đồng hồ cát";
    if (lower.includes("rectangle")) return "Dáng chữ nhật";
  } else {
    const match = text.match(/^([^(]+)/);
    if (match && text.includes("(")) return match[1].trim();
    if (lower.includes("thể thao") || lower.includes("ngực nở")) return "V-Shape / Athletic";
    if (lower.includes("cân đối")) return "Regular / Balanced";
    if (lower.includes("đầy đặn") || lower.includes("bụng")) return "Comfort / Relaxed Fit";
  }
  return text;
};

export const AiGarmentCard: React.FC<AiGarmentCardProps> = ({
  data,
  executionTime = 1.25,
  isLiveBackend = false,
  measurements,
  gender = "neutral",
}) => {
  const { t, locale } = useI18n();

  // 1. Quản lý trạng thái hệ size (Asia, US, EU, UK)
  const [activeSystem, setActiveSystem] = useState<SizeSystem>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYSTEM) as SizeSystem | null;
      if (saved && ["asia", "us", "eu", "uk"].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "asia";
  });

  // 2. Quản lý trạng thái form mặc (Slim, Regular, Relaxed)
  const [preferredFit, setPreferredFit] = useState<FitPreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FIT) as FitPreference | null;
      if (saved && ["slim", "regular", "relaxed"].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "regular";
  });

  const handleSystemChange = (sys: SizeSystem) => {
    setActiveSystem(sys);
    try {
      localStorage.setItem(STORAGE_KEY_SYSTEM, sys);
    } catch {
      // ignore
    }
  };

  const handleFitChange = (fit: FitPreference) => {
    setPreferredFit(fit);
    try {
      localStorage.setItem(STORAGE_KEY_FIT, fit);
    } catch {
      // ignore
    }
  };

  // 3. Tính toán lại tức thì khi người dùng thay đổi Hệ size hoặc Form mặc
  const computed = useMemo(() => {
    if (measurements && measurements.vong_nguc_cm > 0 && measurements.vong_eo_cm > 0) {
      return recommendGarmentSizes(
        {
          gender,
          height_cm: measurements.chieu_cao_cm ?? undefined,
          weight_kg: measurements.can_nang_kg ?? undefined,
          chest_cm: measurements.vong_nguc_cm,
          waist_cm: measurements.vong_eo_cm,
          hips_cm: measurements.vong_mong_cm ?? undefined,
          shoulder_cm: measurements.rong_vai_cm ?? undefined,
          inseam_cm: measurements.dai_chan_inseam_cm ?? undefined,
          preferred_fit: preferredFit,
        },
        activeSystem
      );
    }

    // Nếu không có measurements gốc, fallback dùng data truyền vào và filter theo activeSystem
    if (data?.topwear && data?.bottomwear) {
      const top = data.topwear;
      const subParts: string[] = [];
      if (activeSystem !== "asia") subParts.push(`Châu Á: ${top.asia}`);
      if (activeSystem !== "us") subParts.push(`US: ${top.us}`);
      if (activeSystem !== "eu") subParts.push(`EU: ${top.eu}`);
      if (activeSystem !== "uk") subParts.push(`UK: ${top.uk}`);

      const recLabel =
        activeSystem === "us"
          ? top.us
          : activeSystem === "eu"
          ? top.eu
          : activeSystem === "uk"
          ? top.uk
          : top.asia;

      return {
        topwear: {
          ...top,
          recommended_label: recLabel,
          sub_label: subParts.join(" | "),
        },
        bottomwear: data.bottomwear,
        body_shape_classification: data.body_shape_classification,
        ease_allowance_recommendation: data.ease_allowance_recommendation,
      };
    }

    return null;
  }, [measurements, gender, activeSystem, preferredFit, data]);

  if (!data) return null;

  const topwear = computed?.topwear || data.topwear;
  const bottomwear = computed?.bottomwear || data.bottomwear;
  const bodyShape = computed?.body_shape_classification || data.body_shape_classification;
  const easeAllowance = computed?.ease_allowance_recommendation || data.ease_allowance_recommendation;

  const systemName =
    activeSystem === "asia"
      ? t("meas.systemAsia")
      : activeSystem === "us"
      ? t("meas.systemUs")
      : activeSystem === "eu"
      ? t("meas.systemEu")
      : t("meas.systemUk");

  // Format hiển thị kích cỡ áo thích ứng 100% theo ngôn ngữ hiện tại
  const topwearSizeText = useMemo(() => {
    if (!topwear) return `${t("meas.sizePrefix")} ${data.topwear_shirt_size}`;
    if (topwear.is_boundary && preferredFit === "regular") {
      if (topwear.boundary_sizes && topwear.boundary_sizes.length === 2) {
        return t("meas.boundaryNote")
          .replace("{s1}", topwear.boundary_sizes[0])
          .replace("{s2}", topwear.boundary_sizes[1]);
      }
      if (topwear.boundary_text) {
        const parts = topwear.boundary_text.split(/\s+(?:hoặc|or)\s+/i);
        if (parts.length === 2) {
          const s1 = parts[0].replace(/\s*\([^)]*\)/g, "").trim();
          const s2 = parts[1].replace(/\s*\([^)]*\)/g, "").trim();
          return t("meas.boundaryNote").replace("{s1}", s1).replace("{s2}", s2);
        }
      }
    }
    return `${t("meas.sizePrefix")} ${topwear.recommended_label || data.topwear_shirt_size}`;
  }, [topwear, preferredFit, data.topwear_shirt_size, t]);

  // Format sub-label các hệ khác theo ngôn ngữ hiện tại
  const topwearSubLabelText = useMemo(() => {
    if (!topwear) return "";
    const parts: string[] = [];
    if (activeSystem !== "asia") parts.push(`${t("meas.systemAsiaShort")}: ${topwear.asia}`);
    if (activeSystem !== "us") parts.push(`US: ${topwear.us}`);
    if (activeSystem !== "eu") parts.push(`EU: ${topwear.eu}`);
    if (activeSystem !== "uk") parts.push(`UK: ${topwear.uk}`);
    return parts.join(" | ");
  }, [topwear, activeSystem, t]);

  // Format ghi chú lý do áo thích ứng 100% theo ngôn ngữ hiện tại
  const topwearNotesText = useMemo(() => {
    if (!topwear) return "";
    if (topwear.notes_key === "shoulderUpgrade" && topwear.notes_params) {
      return t("meas.shoulderUpgrade")
        .replace("{size}", topwear.notes_params.size)
        .replace("{shoulder}", String(topwear.notes_params.shoulder));
    }
    if (topwear.notes_key === "basedOnChestShoulder" && topwear.notes_params) {
      return t("meas.basedOnChestShoulder")
        .replace("{chest}", String(topwear.notes_params.chest))
        .replace("{shoulder}", String(topwear.notes_params.shoulder));
    }
    if (topwear.notes_key === "basedOnChest" && topwear.notes_params) {
      return t("meas.basedOnChest")
        .replace("{chest}", String(topwear.notes_params.chest));
    }
    if (topwear.notes) {
      const m = topwear.notes.match(/ngực\s+([\d.]+)cm(?:,\s*vai\s+([\d.]+)cm)?/i);
      if (m) {
        return m[2]
          ? t("meas.basedOnChestShoulder").replace("{chest}", m[1]).replace("{shoulder}", m[2])
          : t("meas.basedOnChest").replace("{chest}", m[1]);
      }
      return topwear.notes;
    }
    return "";
  }, [topwear, t]);

  // Format tag quần thích ứng 100% theo ngôn ngữ hiện tại
  const trouserTagText = useMemo(() => {
    if (!bottomwear) {
      return data.bottomwear_trouser_size
        ? data.bottomwear_trouser_size.replace(/^Size\s+/i, `${t("meas.sizePrefix")} `)
        : "";
    }
    const w = bottomwear.waist_inches;
    const i = bottomwear.inseam_inches;
    const asia = bottomwear.asia;
    return t("meas.trouserTagFormat")
      .replace(/\{prefix\}/g, t("meas.sizePrefix"))
      .replace(/\{w\}/g, String(w))
      .replace(/\{i\}/g, String(i))
      .replace(/\{asia\}/g, asia);
  }, [bottomwear, data.bottomwear_trouser_size, t]);

  const hasHipAlert = Boolean(bottomwear?.has_hip_alert || bottomwear?.notes);

  return (
    <section className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm space-y-4 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
            <Shirt size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              {t("meas.cardTitle", "ĐỀ XUẤT SIZE MAY ĐO THÔNG MINH")}
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">
              {t("meas.cardSub", "Thuật toán so khớp độ cử động Ease Allowance")}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
          {isLiveBackend ? (
            <>
              <CheckCircle2 size={11} className="text-blue-600" />
              <span>{t("dashx.sourceModel", "Mô hình SMPLer-X")}</span>
            </>
          ) : (
            <>
              <Zap size={11} className="text-amber-500" />
              <span>{t("dashx.sourceFormula", "Giải tích ISO 8559")}</span>
            </>
          )}
        </span>
      </div>

      {/* Interactive Controls Bar: Hệ size & Form mặc */}
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-100 border border-slate-200 flex-wrap text-xs">
        {/* Dropdown Hệ size */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Globe2 size={13} className="text-blue-600" />
            <span>{t("meas.sizeSystem", "Hệ size")}:</span>
          </span>
          <select
            value={activeSystem}
            onChange={(e) => handleSystemChange(e.target.value as SizeSystem)}
            className="bg-white border-2 border-slate-300 text-blue-700 font-black text-xs rounded-xl px-2.5 py-1 outline-none cursor-pointer shadow-2xs focus:border-blue-600"
          >
            <option value="asia">{t("meas.systemAsia", "Châu Á (Asia)")}</option>
            <option value="us">{t("meas.systemUs", "Mỹ (US)")}</option>
            <option value="eu">{t("meas.systemEu", "Châu Âu (EU)")}</option>
            <option value="uk">{t("meas.systemUk", "Anh Quốc (UK)")}</option>
          </select>
        </div>

        {/* Segmented Buttons Form mặc */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <SlidersHorizontal size={13} className="text-emerald-600" />
            <span>{t("meas.fitPreference", "Phom mặc")}:</span>
          </span>
          <div className="inline-flex bg-white rounded-xl p-0.5 border border-slate-300 shadow-2xs">
            {(["slim", "regular", "relaxed"] as FitPreference[]).map((fitKey) => {
              const isActive = preferredFit === fitKey;
              const label =
                fitKey === "slim"
                  ? t("meas.fitSlim", "Ôm sát")
                  : fitKey === "regular"
                  ? t("meas.fitRegular", "Vừa vặn")
                  : t("meas.fitRelaxed", "Thoải mái");

              return (
                <button
                  key={fitKey}
                  type="button"
                  onClick={() => handleFitChange(fitKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Garment Sizes Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Topwear (Áo) */}
        <div className="bg-sky-50/90 border-2 border-sky-200 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-black uppercase text-sky-800 tracking-wider block mb-1">
              {t("meas.topwear", "ÁO SƠ MI / POLO")}
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-950 font-mono tracking-tight my-1">
              {topwearSizeText}
            </div>
            <span className="text-[10px] font-bold text-sky-700 block">
              {t("meas.topwearStandard", "Chuẩn hệ {system}").replace("{system}", systemName)}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-sky-200/80">
            {topwearSubLabelText && (
              <span className="text-[10px] text-sky-800 font-mono font-medium block">
                {topwearSubLabelText}
              </span>
            )}
            {topwearNotesText && (
              <span className="text-[10px] text-slate-500 italic block mt-0.5">
                {topwearNotesText}
              </span>
            )}
          </div>
        </div>

        {/* Bottomwear (Quần) */}
        <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block mb-1">
              {t("meas.bottomwear", "QUẦN TÂY / CHINO")}
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-950 font-mono tracking-tight my-1">
              {trouserTagText}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block">
              {bottomwear?.sub_label ||
                t("meas.bottomwearInches", "Eo W{w} x Dài L{i}")
                  .replace("{w}", String(data.waist_inches))
                  .replace("{i}", String(data.inseam_inches))}
            </span>
          </div>

          {hasHipAlert && (
            <div className="mt-2 p-1.5 rounded-lg bg-amber-100 border border-amber-300 flex items-center gap-1.5 text-amber-900 text-[10px] font-bold">
              <AlertCircle size={12} className="text-amber-700 flex-shrink-0" />
              <span>{t("meas.hipAlert", "Lưu ý vòng hông")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body Shape Classification */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {t("meas.bodyFit", "Phân loại vóc dáng")}
          </span>
          <strong className="text-xs sm:text-sm font-black text-slate-900">
            {localizedBodyShape(bodyShape, locale)}
          </strong>
        </div>
      </div>

      {/* Ease Allowance Recommendations */}
      <div className="space-y-2">
        <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
          <Scissors size={13} className="text-blue-600" />
          <span>{t("meas.easeAllowance", "Độ cử động may đo (Ease Allowance)")}</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">{t("meas.slimChest", "Ngực ôm")}</span>
            <strong className="text-xs font-black text-blue-700 font-mono">
              +{easeAllowance.slim_fit_chest_cm} <small className="text-[10px]">cm</small>
            </strong>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">{t("meas.regularChest", "Ngực vừa")}</span>
            <strong className="text-xs font-black text-blue-700 font-mono">
              +{easeAllowance.regular_fit_chest_cm} <small className="text-[10px]">cm</small>
            </strong>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">{t("meas.trouserWaist", "Cạp quần")}</span>
            <strong className="text-xs font-black text-emerald-700 font-mono">
              +{easeAllowance.trouser_waist_ease_cm} <small className="text-[10px]">cm</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <span>{t("meas.execTime", "Tính toán trong {s}s").replace("{s}", executionTime.toFixed(2))}</span>
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
          <ShieldCheck size={12} />
          <span>{t("meas.privacyGuaranteed", "Chuẩn ISO 8559")}</span>
        </span>
      </div>
    </section>
  );
};

export default AiGarmentCard;
