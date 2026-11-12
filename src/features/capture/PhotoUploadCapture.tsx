// ============================================================
// PHOTO UPLOAD CAPTURE STUDIO
// Replaces laptop webcam with high-resolution mobile photo upload
// Single-View 3D Body Mesh Recovery (SMPLer-X / ISO 8559)
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "../../i18n";
import {
  UploadCloud,
  CheckCircle2,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Scale,
  Ruler,
  HelpCircle,
  FileImage,
} from "lucide-react";

export interface PhotoUploadCaptureProps {
  onScan: (params: {
    frontFile: File | Blob;
    height_cm: number;
    weight_kg: number;
    gender: "male" | "female" | "neutral";
  }) => void;
  isProcessing: boolean;
  initialHeight?: number;
  initialWeight?: number;
  initialGender?: "male" | "female" | "neutral";
}

export const PhotoUploadCapture: React.FC<PhotoUploadCaptureProps> = ({
  onScan,
  isProcessing,
  initialHeight,
  initialWeight,
  initialGender = "male",
}) => {
  const { t } = useI18n();
  const [frontImage, setFrontImage] = useState<{ file: File | Blob; url: string; name: string } | null>(null);
  const [height, setHeight] = useState<string>(initialHeight ? String(initialHeight) : "");
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : "");
  const [gender, setGender] = useState<"male" | "female" | "neutral">(initialGender);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  useEffect(() => {
    if (initialHeight) setHeight(String(initialHeight));
  }, [initialHeight]);

  useEffect(() => {
    if (initialWeight) setWeight(String(initialWeight));
  }, [initialWeight]);

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Cho phép người dùng xóa trắng trường input để gõ lại từ đầu (không bị nhảy về số 0)
    if (val === '') {
      setHeight('');
      return;
    }
    // Xóa số 0 thừa ở đầu nếu gõ số mới (ví dụ "02" -> "2", "0172" -> "172")
    if (/^0+[1-9]/.test(val)) {
      val = val.replace(/^0+/, '');
    }
    setHeight(val);
  };

  const handleHeightBlur = () => {
    if (!height.trim()) return;
    const num = parseFloat(height);
    if (isNaN(num) || num <= 0) {
      setHeight('');
    } else {
      setHeight(String(num));
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === '') {
      setWeight('');
      return;
    }
    if (/^0+[1-9]/.test(val)) {
      val = val.replace(/^0+/, '');
    }
    setWeight(val);
  };

  const handleWeightBlur = () => {
    if (!weight.trim()) return;
    const num = parseFloat(weight);
    if (isNaN(num) || num <= 0) {
      setWeight('');
    } else {
      setWeight(String(num));
    }
  };

  const frontInputRef = useRef<HTMLInputElement>(null);

  const handleFrontFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setFrontImage({ file, url, name: file.name });
  };

  const loadSamplePhoto = async () => {
    try {
      const res = await fetch("/hero-avatar.jpg");
      const blob = await res.blob();
      const file = new File([blob], "sample_a_pose.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setFrontImage({ file, url, name: "sample_a_pose.jpg" });
    } catch {
      // Fallback: create dummy image canvas if asset is missing
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, 600, 900);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Standard A-Pose Sample", 300, 450);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "standard_a_pose.jpg", { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          setFrontImage({ file, url, name: "standard_a_pose.jpg" });
        }
      }, "image/jpeg");
    }
  };

  const handleStartScan = () => {
    if (!frontImage) return;
    const finalHeight = parseFloat(height) || initialHeight || 172;
    const finalWeight = parseFloat(weight) || initialWeight || 70;
    onScan({
      frontFile: frontImage.file,
      height_cm: finalHeight,
      weight_kg: finalWeight,
      gender,
    });
  };

  return (
    <div className="photo-upload-studio" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Upload Zone: Single Front A-Pose (SMPLer-X Standard) */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileImage size={15} className="text-blue-600" />
            <span>{t("cap.frontLabel", "Ảnh toàn thân chính diện (A-Pose)")}</span>
            <span className="text-rose-500 font-black">*</span>
          </label>
          {!frontImage && (
            <button
              type="button"
              onClick={loadSamplePhoto}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 text-xs font-black shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>{t("cap.loadSample", "Nạp ảnh mẫu A-Pose")}</span>
            </button>
          )}
        </div>

        {frontImage ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 h-60 flex items-center justify-center shadow-xs">
            <img
              src={frontImage.url}
              alt="Front A-Pose Preview"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-3 flex justify-between items-center text-white">
              <span className="text-xs font-mono font-bold truncate max-w-[200px]">
                {frontImage.name}
              </span>
              <button
                type="button"
                onClick={() => setFrontImage(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>{t("cap.deletePhoto", "Xóa ảnh")}</span>
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={12} />
              <span>{t("cap.photoVerified", "Ảnh hợp lệ")}</span>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) handleFrontFile(e.dataTransfer.files[0]);
            }}
            onClick={() => frontInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all shadow-xs ${
              dragActive
                ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40'
            }`}
          >
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFrontFile(e.target.files[0])}
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-900 mb-1">
              {t("cap.uploadPrompt", "Chọn hoặc kéo thả ảnh chụp toàn thân")}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {t("cap.uploadSub", "1 ảnh dáng chữ A nhìn thẳng • Tự động trích xuất số đo 3D")}
            </p>
          </div>
        )}
      </div>

      {/* Biometric Calibration Inputs */}
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/90 p-4 space-y-3">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">
          {t("cap.calibTitle", "THÔNG SỐ HIỆU CHUẨN NHÂN TRẮC HỌC")}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Ruler size={14} className="text-blue-600" />
              <span>{t("cap.heightLabel", "Chiều cao (cm)")}</span>
            </label>
            <input
              type="number"
              min={100}
              max={250}
              placeholder="VD: 172"
              value={height}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
              className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-sm font-black font-mono text-slate-900 outline-none transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Scale size={14} className="text-blue-600" />
              <span>{t("cap.weightLabel", "Cân nặng (kg)")}</span>
            </label>
            <input
              type="number"
              min={30}
              max={250}
              placeholder="VD: 68"
              value={weight}
              onChange={handleWeightChange}
              onBlur={handleWeightBlur}
              className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-sm font-black font-mono text-slate-900 outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <User size={14} className="text-blue-600" />
            <span>{t("cap.genderLabel", "Giới tính")}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["male", "female", "neutral"] as const).map((g) => {
              const label = g === "male" ? t("cap.male", "Nam") : g === "female" ? t("cap.female", "Nữ") : t("cap.unisex", "Unisex");
              const isSel = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSel
                      ? 'bg-blue-600 text-white shadow-xs border-2 border-blue-600'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guide Accordion */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2">
            <HelpCircle size={14} className="text-blue-600" />
            <span>{t("cap.guideTitle", "Hướng dẫn chụp ảnh chuẩn A-Pose")}</span>
          </span>
          {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showGuide && (
          <div className="p-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
            <ul className="list-disc pl-4 space-y-1">
              <li>{t("cap.guidePhotos", "Đứng cách camera 2-2.5m, chụp toàn thân từ đầu đến chân.")}</li>
              <li>{t("cap.guideDist", "Giữ điện thoại thẳng đứng ngang tầm ngực.")}</li>
              <li>{t("cap.guidePose", "Tạo dáng chữ A: hai chân rộng bằng vai, hai tay chếch 30-45 độ.")}</li>
              <li>{t("cap.guideWear", "Mặc trang phục ôm sát gọn gàng để trích xuất số đo chính xác nhất.")}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Scan CTA Trigger */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={frontImage ? handleStartScan : loadSamplePhoto}
        className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
          isProcessing
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : frontImage
            ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500 shadow-blue-500/20 hover:scale-[1.01]'
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-2 border-blue-400'
        }`}
      >
        {isProcessing ? (
          <>
            <div
              style={{
                width: "18px",
                height: "18px",
                border: "2.5px solid #ffffff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span>{t("cap.scanningBtn")}</span>
          </>
        ) : frontImage ? (
          <>
            <Sparkles size={18} style={{ color: "#FACC15" }} />
            <span>{t("cap.scanBtn")}</span>
          </>
        ) : (
          <>
            <Sparkles size={18} style={{ color: "#38BDF8" }} />
            <span>{t("cap.loadSamplePrompt", "⚡ Nạp Ảnh Mẫu & Bắt Đầu Quét 3D")}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PhotoUploadCapture;
