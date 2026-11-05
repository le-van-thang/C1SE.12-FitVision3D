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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground, #f8fafc)", display: "flex", alignItems: "center", gap: "6px" }}>
            <FileImage size={15} style={{ color: "#38bdf8" }} />
            {t("cap.frontLabel")} <span style={{ color: "#ef4444" }}>*</span>
          </label>
          {!frontImage && (
            <button
              type="button"
              onClick={loadSamplePhoto}
              style={{
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles size={12} />
              {t("cap.loadSample")}
            </button>
          )}
        </div>

        {frontImage ? (
          <div
            style={{
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              background: "#09131f",
              height: "230px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={frontImage.url}
              alt="Front A-Pose Preview"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(5, 13, 20, 0.9))",
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                {frontImage.name}
              </span>
              <button
                type="button"
                onClick={() => setFrontImage(null)}
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Trash2 size={12} /> {t("cap.deletePhoto")}
              </button>
            </div>
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                background: "rgba(16, 185, 129, 0.2)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#34d399",
                borderRadius: "9999px",
                padding: "3px 10px",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <CheckCircle2 size={12} /> {t("cap.photoVerified")}
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
            style={{
              border: `2px dashed ${dragActive ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}`,
              borderRadius: "10px",
              background: dragActive ? "rgba(56, 189, 248, 0.05)" : "rgba(255, 255, 255, 0.02)",
              padding: "36px 16px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFrontFile(e.target.files[0])}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.12)",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <UploadCloud size={24} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "var(--foreground, #f8fafc)" }}>
              {t("cap.uploadPrompt")}
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted, #94a3b8)" }}>
              {t("cap.uploadSub")}
            </p>
          </div>
        )}
      </div>

      {/* Biometric Calibration Inputs */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          padding: "14px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "10px" }}>
          {t("cap.calibTitle")}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--muted, #94a3b8)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
              <Ruler size={13} style={{ color: "#38bdf8" }} /> {t("cap.heightLabel")}
            </label>
            <input
              type="number"
              min={100}
              max={250}
              placeholder="VD: 172"
              value={height}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
              className="zf-calib-input"
              style={{
                width: "100%",
                background: "var(--surface, #0f172a)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                padding: "8px 10px",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "var(--muted, #94a3b8)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
              <Scale size={13} style={{ color: "#38bdf8" }} /> {t("cap.weightLabel")}
            </label>
            <input
              type="number"
              min={30}
              max={250}
              placeholder="VD: 70"
              value={weight}
              onChange={handleWeightChange}
              onBlur={handleWeightBlur}
              className="zf-calib-input"
              style={{
                width: "100%",
                background: "var(--surface, #0f172a)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                padding: "8px 10px",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--muted, #94a3b8)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
            <User size={13} style={{ color: "#38bdf8" }} /> {t("cap.genderLabel")}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {(["male", "female", "neutral"] as const).map((g) => {
              const label = g === "male" ? t("cap.male") : g === "female" ? t("cap.female") : t("cap.unisex");
              const isSel = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  style={{
                    background: isSel ? "rgba(56, 189, 248, 0.15)" : "transparent",
                    border: `1px solid ${isSel ? "#38bdf8" : "rgba(255, 255, 255, 0.12)"}`,
                    color: isSel ? "#38bdf8" : "#94a3b8",
                    padding: "6px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: isSel ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guide Accordion */}
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.01)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "none",
            border: "none",
            color: "var(--muted, #94a3b8)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <HelpCircle size={14} style={{ color: "#38bdf8" }} /> {t("cap.guideTitle")}
          </span>
          {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showGuide && (
          <div style={{ padding: "0 12px 12px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.6 }}>
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              <li>{t("cap.guidePhotos")}</li>
              <li>{t("cap.guideDist")}</li>
              <li>{t("cap.guidePose")}</li>
              <li>{t("cap.guideWear")}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Scan CTA Trigger */}
      <button
        type="button"
        disabled={!frontImage || isProcessing}
        onClick={handleStartScan}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          background: frontImage && !isProcessing
            ? "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)"
            : "rgba(255, 255, 255, 0.05)",
          border: frontImage && !isProcessing ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
          color: frontImage && !isProcessing ? "#ffffff" : "#64748b",
          fontWeight: 600,
          fontSize: "14px",
          cursor: frontImage && !isProcessing ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: frontImage && !isProcessing ? "0 4px 14px rgba(2, 132, 199, 0.35)" : "none",
          transition: "all 0.2s ease",
        }}
      >
        {isProcessing ? (
          <>
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #ffffff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            {t("cap.scanningBtn")}
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {t("cap.scanBtn")}
          </>
        )}
      </button>
    </div>
  );
};

export default PhotoUploadCapture;
