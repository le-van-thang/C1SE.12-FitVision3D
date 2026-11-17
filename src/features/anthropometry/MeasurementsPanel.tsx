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
      onClick={onClick}
      title={sublabel ? `${label} — ${sublabel}` : label}
      className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-emerald-50 border-2 border-emerald-400 shadow-xs text-emerald-950'
          : 'bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-slate-900'
      }`}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
          {label}
        </span>
        {sublabel ? (
          <span className={`text-[10px] leading-tight truncate ${isActive ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
            {sublabel}
          </span>
        ) : null}
      </div>

      <div className="flex-shrink-0 text-right">
        {value == null ? (
          <span className="font-mono text-slate-400 text-xs font-bold">—</span>
        ) : (
          <span className={`font-mono text-xs sm:text-sm font-black ${isActive ? 'text-emerald-700' : 'text-blue-700'}`}>
            {shown.toFixed(1)}
            {unit && (
              <em className="not-italic text-[10px] font-bold text-slate-500 ml-0.5">
                {unit}
              </em>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export interface MeasurementsPanelProps {
  measurement: Measurement | null;
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
    <section id={id} aria-label={t("meas.title", "Bảng Số Đo ISO 8559")}>
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100 mb-3">
        <div>
          <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
            {t("meas.title", "SỐ ĐO ISO 8559-1")}
          </h2>
          {measurement && (
            <div className="text-[10px] font-bold text-blue-600 mt-0.5 flex items-center gap-1">
              <span>{isLiveBackend ? t("dashx.sourceModel", "Mô hình SMPLer-X") : t("dashx.sourceFormula", "Giải tích ISO 8559")}</span>
            </div>
          )}
        </div>
        {conf != null && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            {t("meas.confidence", "Độ tin cậy: {p}%").replace("{p}", (conf * 100).toFixed(0))}
          </span>
        )}
      </div>

      {/* Biometric Summary Strip */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-center">
          <span className="text-[10px] font-bold text-slate-500 block truncate">{t("meas.stature", "Chiều cao")}</span>
          <strong className="font-mono text-xs sm:text-sm font-black text-blue-700">
            {biometric?.stature_cm != null ? `${biometric.stature_cm.toFixed(1)} ` : "—"}
            {biometric?.stature_cm != null && <small className="text-[10px] font-bold text-slate-500">cm</small>}
          </strong>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-center">
          <span className="text-[10px] font-bold text-slate-500 block truncate">{t("meas.weight", "Cân nặng")}</span>
          <strong className="font-mono text-xs sm:text-sm font-black text-blue-700">
            {biometric?.weight_kg != null ? `${biometric.weight_kg.toFixed(1)} ` : "—"}
            {biometric?.weight_kg != null && <small className="text-[10px] font-bold text-slate-500">kg</small>}
          </strong>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-center">
          <span className="text-[10px] font-bold text-slate-500 block truncate">{t("meas.bmi", "Chỉ số BMI")}</span>
          <strong className="font-mono text-xs sm:text-sm font-black text-blue-700">
            {biometric?.calculated_bmi != null ? biometric.calculated_bmi.toFixed(1) : "—"}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <MetricRow
          label={t("meas.chest", "Vòng ngực")}
          sublabel={t("meas.chestSub", "Đo ngang đỉnh ngực chuẩn") || undefined}
          field="chest_circ_cm"
          value={measurement?.chest_circ_cm}
          unit="cm"
          isActive={activeMetric === "chest_circ_cm"}
          onClick={() => onSelectMetric?.("chest_circ_cm")}
        />
        <MetricRow
          label={t("meas.waist", "Vòng eo")}
          sublabel={t("meas.waistSub", "Vị trí hẹp nhất thắt lưng") || undefined}
          field="waist_circ_cm"
          value={measurement?.waist_circ_cm}
          unit="cm"
          isActive={activeMetric === "waist_circ_cm"}
          onClick={() => onSelectMetric?.("waist_circ_cm")}
        />
        <MetricRow
          label={t("meas.hips", "Vòng mông / hông")}
          sublabel={t("meas.hipsSub", "Điểm nở nhất của mông") || undefined}
          field="hip_circ_cm"
          value={measurement?.hip_circ_cm}
          unit="cm"
          isActive={activeMetric === "hip_circ_cm"}
          onClick={() => onSelectMetric?.("hip_circ_cm")}
        />
        <MetricRow
          label={t("meas.shoulders", "Rộng vai")}
          sublabel={t("meas.shouldersSub", "Từ mút vai trái sang phải") || undefined}
          field="shoulder_breadth_cm"
          value={measurement?.shoulder_breadth_cm}
          unit="cm"
          isActive={activeMetric === "shoulder_breadth_cm"}
          onClick={() => onSelectMetric?.("shoulder_breadth_cm")}
        />
        <MetricRow
          label={t("meas.armLength", "Chiều dài tay áo")}
          sublabel={t("meas.armLengthSub", "Từ đỉnh vai đến cổ tay") || undefined}
          field="arm_length_cm"
          value={measurement?.arm_length_cm}
          unit="cm"
          isActive={activeMetric === "arm_length_cm"}
          onClick={() => onSelectMetric?.("arm_length_cm")}
        />
        <MetricRow
          label={t("meas.bicep", "Vòng bắp tay")}
          sublabel={t("meas.bicepSub", "Chính giữa đỉnh vai và cùi chỏ") || undefined}
          field="bicep_circ_cm"
          value={measurement?.bicep_circ_cm}
          unit="cm"
          isActive={activeMetric === "bicep_circ_cm"}
          onClick={() => onSelectMetric?.("bicep_circ_cm")}
        />
        <MetricRow
          label={t("meas.wrist", "Vòng cổ tay")}
          sublabel={t("meas.wristSub", "Ngay phía trên mắt cá cổ tay") || undefined}
          field="wrist_circ_cm"
          value={measurement?.wrist_circ_cm}
          unit="cm"
          isActive={activeMetric === "wrist_circ_cm"}
          onClick={() => onSelectMetric?.("wrist_circ_cm")}
        />
        <MetricRow
          label={t("meas.thigh", "Vòng đùi")}
          sublabel={t("meas.thighSub", "Vị trí lớn nhất sát đáy quần") || undefined}
          field="thigh_circ_cm"
          value={measurement?.thigh_circ_cm}
          unit="cm"
          isActive={activeMetric === "thigh_circ_cm"}
          onClick={() => onSelectMetric?.("thigh_circ_cm")}
        />
        <MetricRow
          label={t("meas.calf", "Vòng bắp chân")}
          sublabel={t("meas.calfSub", "Điểm lớn nhất bắp chuối") || undefined}
          field="calf_circ_cm"
          value={measurement?.calf_circ_cm}
          unit="cm"
          isActive={activeMetric === "calf_circ_cm"}
          onClick={() => onSelectMetric?.("calf_circ_cm")}
        />
        <MetricRow
          label={t("meas.ankle", "Vòng cổ chân")}
          sublabel={t("meas.ankleSub", "Ngay trên mắt cá chân") || undefined}
          field="ankle_circ_cm"
          value={measurement?.ankle_circ_cm}
          unit="cm"
          isActive={activeMetric === "ankle_circ_cm"}
          onClick={() => onSelectMetric?.("ankle_circ_cm")}
        />
        <div className="sm:col-span-2">
          <MetricRow
            label={t("meas.inseam", "Dài chân (Inseam)")}
            sublabel={t("meas.inseamSub", "Từ đáy quần xuống gấu quần") || undefined}
            field="inseam_cm"
            value={measurement?.inseam_cm}
            unit="cm"
            isActive={activeMetric === "inseam_cm"}
            onClick={() => onSelectMetric?.("inseam_cm")}
          />
        </div>
      </div>
    </section>
  );
};

export default MeasurementsPanel;
