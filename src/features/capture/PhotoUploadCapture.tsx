// ============================================================
// PHOTO UPLOAD CAPTURE STUDIO
// Replaces laptop webcam with high-resolution mobile photo upload
// Features: Dual-perspective dropzone, A-pose guide, biometric inputs
// ============================================================
import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  CheckCircle2,
  Trash2,
  Sparkles,
  Info,
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
    sideFile?: File | Blob | null;
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
  initialHeight = 172,
  initialWeight = 70,
  initialGender = "male",
}) => {
  const [frontImage, setFrontImage] = useState<{ file: File | Blob; url: string; name: string } | null>(null);
  const [sideImage, setSideImage] = useState<{ file: File | Blob; url: string; name: string } | null>(null);
  const [height, setHeight] = useState<number>(initialHeight);
  const [weight, setWeight] = useState<number>(initialWeight);
  const [gender, setGender] = useState<"male" | "female" | "neutral">(initialGender);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [dragActiveFront, setDragActiveFront] = useState<boolean>(false);
  const [dragActiveSide, setDragActiveSide] = useState<boolean>(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  const handleFrontFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setFrontImage({ file, url, name: file.name });
  };

  const handleSideFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSideImage({ file, url, name: file.name });
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
    onScan({
      frontFile: frontImage.file,
      sideFile: sideImage?.file || null,
      height_cm: height,
      weight_kg: weight,
      gender,
    });
  };

  return (
    <div className="photo-upload-studio" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Upload Zone 1: Front A-Pose (Required) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground, #f8fafc)", display: "flex", alignItems: "center", gap: "6px" }}>
            <FileImage size={15} style={{ color: "#38bdf8" }} />
            Ảnh toàn thân chính diện (A-Pose) <span style={{ color: "#ef4444" }}>*</span>
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
              Nạp ảnh mẫu A-Pose
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
              height: "200px",
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
              <span style={{ fontSize: "11px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
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
                <Trash2 size={12} /> Xóa
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
                padding: "2px 8px",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CheckCircle2 size={11} /> Mặt trước (0°)
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveFront(true);
            }}
            onDragLeave={() => setDragActiveFront(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActiveFront(false);
              if (e.dataTransfer.files?.[0]) handleFrontFile(e.dataTransfer.files[0]);
            }}
            onClick={() => frontInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActiveFront ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}`,
              borderRadius: "10px",
              background: dragActiveFront ? "rgba(56, 189, 248, 0.05)" : "rgba(255, 255, 255, 0.02)",
              padding: "24px 16px",
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
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.1)",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
              }}
            >
              <UploadCloud size={22} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 500, color: "var(--foreground, #f8fafc)" }}>
              Chọn hoặc kéo thả ảnh từ điện thoại
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--muted, #94a3b8)" }}>
              Toàn thân dáng chữ A • Định dạng JPG, PNG
            </p>
          </div>
        )}
      </div>

      {/* Upload Zone 2: Side Profile (Optional) */}
      <div>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground, #f8fafc)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <FileImage size={15} style={{ color: "#94a3b8" }} />
          Ảnh chụp góc nghiêng 90° (Tùy chọn)
        </label>
        {sideImage ? (
          <div
            style={{
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "#09131f",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={sideImage.url} alt="Side Profile" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            <button
              type="button"
              onClick={() => setSideImage(null)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "rgba(0, 0, 0, 0.6)",
                border: "none",
                color: "#f87171",
                borderRadius: "4px",
                padding: "3px 6px",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveSide(true);
            }}
            onDragLeave={() => setDragActiveSide(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActiveSide(false);
              if (e.dataTransfer.files?.[0]) handleSideFile(e.dataTransfer.files[0]);
            }}
            onClick={() => sideInputRef.current?.click()}
            style={{
              border: `1px dashed ${dragActiveSide ? "#38bdf8" : "rgba(255, 255, 255, 0.12)"}`,
              borderRadius: "8px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              background: "rgba(255, 255, 255, 0.01)",
            }}
          >
            <input
              ref={sideInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleSideFile(e.target.files[0])}
            />
            <UploadCloud size={16} style={{ color: "var(--muted, #94a3b8)" }} />
            <span style={{ fontSize: "12px", color: "var(--muted, #94a3b8)" }}>
              Thêm ảnh chụp góc nghiêng để tăng độ chính xác vòng ngực & mông
            </span>
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
          Thông số hiệu chuẩn nhân trắc học
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--muted, #94a3b8)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
              <Ruler size={13} style={{ color: "#38bdf8" }} /> Chiều cao (cm)
            </label>
            <input
              type="number"
              min={120}
              max={230}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
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
              <Scale size={13} style={{ color: "#38bdf8" }} /> Cân nặng (kg)
            </label>
            <input
              type="number"
              min={35}
              max={160}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
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
            <User size={13} style={{ color: "#38bdf8" }} /> Giới tính giải phẫu
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {(["male", "female", "neutral"] as const).map((g) => {
              const label = g === "male" ? "Nam" : g === "female" ? "Nữ" : "Unisex";
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
            <HelpCircle size={14} style={{ color: "#38bdf8" }} /> Hướng dẫn chụp ảnh chuẩn ISO 8559
          </span>
          {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showGuide && (
          <div style={{ padding: "0 12px 12px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.6 }}>
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              <li><strong>Khoảng cách:</strong> Đứng cách camera 2.5m - 3m, thấy rõ từ đỉnh đầu đến gót chân.</li>
              <li><strong>Dáng đứng chữ A (A-Pose):</strong> Hai tay dang nhẹ 30° - 40° so với thân, hai chân rộng bằng vai.</li>
              <li><strong>Trang phục:</strong> Mặc quần áo thun ôm sát (gym, yoga) để AI nhận diện đường cong chính xác nhất.</li>
              <li><strong>Góc chụp:</strong> Đặt điện thoại cao ngang ngực/bụng, giữ máy thẳng đứng, không nghiêng.</li>
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
            Đang phân tích hình thể &amp; tính toán ISO 8559...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Phân tích &amp; Dựng hình thể 3D (AI Scan)
          </>
        )}
      </button>
    </div>
  );
};

export default PhotoUploadCapture;
