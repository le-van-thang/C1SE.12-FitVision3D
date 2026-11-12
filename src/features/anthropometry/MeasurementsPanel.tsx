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
      className={`flex items-center justify-between p-2.5 rounded-xl transition-all mb-1.5 cursor-pointer ${
        isActive
          ? 'bg-emerald-50 border-2 border-emerald-400 shadow-xs text-emerald-950'
          : 'bg-slate-50 hover:bg-blue-50/70 border-2 border-slate-200 hover:border-blue-300 text-slate-900'
      }`}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
          {label}
        </span>
        {sublabel ? (
          <span className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
            {sublabel}
          </span>
        ) : null}
      </div>

      <div className="flex-shrink-0 text-right">
        {value == null ? (
          <span className="font-mono text-slate-400 text-sm font-bold">—</span>
        ) : (
          <span className={`font-mono text-sm sm:text-base font-black ${isActive ? 'text-emerald-700' : 'text-blue-700'}`}>
            {shown.toFixed(1)}
            {unit && (
              <em className="not-italic text-[11px] font-bold text-slate-500 ml-1">
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

      <div className="space-y-1">
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

      <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mt-4 mb-2 block pt-2 border-t-2 border-slate-100">
        {t("meas.bioTitle", "CHỈ SỐ THỂ TRẠNG")}
      </h3>
      <div className="space-y-1">
        <MetricRow label={t("meas.stature", "Chiều cao")} field="stature_cm" value={biometric?.stature_cm} unit="cm" />
        <MetricRow label={t("meas.weight", "Cân nặng")} field="weight_kg" value={biometric?.weight_kg} unit="kg" />
        <MetricRow label={t("meas.bmi", "Chỉ số BMI")} field="calculated_bmi" value={biometric?.calculated_bmi} unit="" />
      </div>
    </section>
  );
};

export default MeasurementsPanel;
