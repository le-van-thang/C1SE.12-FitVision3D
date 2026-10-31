// ============================================================
// CAMERA VIEWFINDER
// Clean viewport: 1px technical grid, minimal corner brackets.
// ============================================================
import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import type { CameraState, PoseQuality } from "../../types/biometrics.types";

export interface CameraViewfinderProps {
  cameraState: CameraState;
  poseQuality: PoseQuality | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  id?: string;
}

const STATE_LABELS: Record<CameraState, { text: string; sub: string }> = {
  idle:          { text: "Standby",            sub: "Start the scan to open the camera" },
  calibrating:   { text: "Calibrate scale",    sub: "Hold an A4 sheet or card in frame" },
  front_capture: { text: "Front view",         sub: "Stand upright, arms relaxed" },
  side_capture:  { text: "Side view",          sub: "Turn 90°, face forward" },
  processing:    { text: "Extracting",         sub: "Computing measurements" },
  complete:      { text: "Scan complete",      sub: "Measurements extracted" },
  error:         { text: "Camera error",       sub: "Check permissions and retry" },
};

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({ cameraState, poseQuality, videoRef, id = "camera-viewfinder" }) => {
  const [scan, setScan] = useState(0);
  const processing = cameraState === "processing";
  const ready = poseQuality?.hud_color === "green" || cameraState === "complete";

  const color =
    cameraState === "error" ? "var(--danger)"
    : processing ? "var(--teal)"
    : ready ? "var(--lime)"
    : cameraState === "idle" ? "var(--muted)"
    : "var(--label)";

  useEffect(() => {
    if (!processing) return;
    const t = setInterval(() => setScan((p) => (p + 1) % 100), 16);
    return () => clearInterval(t);
  }, [processing]);

  const info = STATE_LABELS[cameraState];

  return (
    <div id={id}>
      <div className="zf-viewfinder" style={{ ["--vf" as string]: color }}>
        {videoRef && <video ref={videoRef} autoPlay muted playsInline />}

        <div className="zf-silhouette">
          <svg viewBox="0 0 120 200" fill="none" style={{ width: "54%", height: "82%", opacity: cameraState === "idle" ? 0.25 : 0.8 }}>
            <ellipse cx="60" cy="22" rx="15" ry="18" stroke={color} strokeWidth="0.8" />
            <path d="M54 39v10M66 39v10" stroke={color} strokeWidth="0.8" />
            <path d="M22 54Q60 46 98 54L96 118Q90 150 84 190M22 54L24 118Q30 150 36 190" stroke={color} strokeWidth="0.8" />
            <path d="M22 56L8 104M98 56L112 104" stroke={color} strokeWidth="0.8" />
            {[66, 88, 108].map((y) => (
              <line key={y} x1="20" y1={y} x2="100" y2={y} stroke={ready ? "var(--lime)" : color} strokeWidth="0.8" strokeDasharray="3 3" />
            ))}
          </svg>
        </div>

        {(["tl", "tr", "bl", "br"] as const).map((c) => <span key={c} className={`zf-corner zf-corner--${c}`} />)}
        {processing && <span className="zf-scanline" style={{ top: `${scan}%` }} />}

        {cameraState === "idle" && (
          <div className="zf-vf-center">
            <Camera size={28} strokeWidth={1.5} />
            <span>Camera standby</span>
          </div>
        )}
      </div>

      <div className="zf-caption">
        <strong>{info.text}</strong>
        <span>{info.sub}</span>
      </div>
    </div>
  );
};

export default CameraViewfinder;
