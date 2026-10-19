import React, { useEffect, useState } from "react";
import { GlassCard } from "../common/GlassCard";
import type { PoseQuality, CameraState } from "../../types/biometrics.types";

export interface CameraGuideHUDProps {
  cameraState: CameraState;
  poseQuality: PoseQuality | null;
  onCaptureFront?: () => void;
  onCaptureSide?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  id?: string;
}

const STATE_LABELS: Record<CameraState, { text: string; sub: string }> = {
  idle:         { text: "Ready",                      sub: "Press the button below to start scan" },
  calibrating:  { text: "Calibrating Reference Card", sub: "Align A4 sheet or calibration card in frame" },
  front_capture:{ text: "Capture Front View",         sub: "Stand Upright - Face Camera with arms relaxed" },
  side_capture: { text: "Capture Side View",          sub: "Turn 90° - Profile View facing forward" },
  processing:   { text: "Extracting Measurements...", sub: "Ramanujan ellipse & biometric algorithms running" },
  complete:     { text: "Scan Complete! ✓",          sub: "Biometric parameters successfully extracted" },
  error:        { text: "Sensor Error Occurred",      sub: "Please verify camera permissions and retry" },
};

export const CameraGuideHUD: React.FC<CameraGuideHUDProps> = ({
  cameraState,
  poseQuality,
  onCaptureFront,
  onCaptureSide,
  videoRef,
  id = "camera-guide-hud",
}) => {
  const [scanPos, setScanPos] = useState(0);

  const isGreen   = poseQuality?.hud_color === "green" || cameraState === "complete";
  const isError   = cameraState === "error";
  const isProcess = cameraState === "processing";

  const borderCol = isError ? "#ef4444" : isProcess ? "#8b5cf6" : isGreen ? "#22c55e" : cameraState === "idle" ? "#1e293b" : "#f97316";
  const glowCol   = isError ? "rgba(239,68,68,0.35)" : isProcess ? "rgba(139,92,246,0.35)" : isGreen ? "rgba(34,197,94,0.35)" : "rgba(249,115,22,0.2)";

  // Scan line animation
  useEffect(() => {
    if (!isProcess) return;
    const interval = setInterval(() => setScanPos((p) => (p + 1.5) % 100), 16);
    return () => clearInterval(interval);
  }, [isProcess]);

  const info = STATE_LABELS[cameraState];
  const canCaptureFront = cameraState === "front_capture" && poseQuality?.hud_color === "green";
  const canCaptureSide  = cameraState === "side_capture"  && poseQuality?.hud_color === "green";

  return (
    <div id={id} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      {/* ── HUD Frame ── */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3/4",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        border: `1.5px solid ${borderCol}`,
        background: "rgba(10,13,20,0.85)",
        transition: "border-color 0.5s var(--ease-out-expo), box-shadow 0.5s var(--ease-out-expo)",
        boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.7), 0 0 30px ${glowCol}`,
        animation: isGreen && cameraState !== "complete" ? "hudGlow 2s ease infinite" : "none",
      }}>
        {/* Video */}
        {videoRef && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
        )}

        {/* Body silhouette */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <svg viewBox="0 0 120 200" fill="none" style={{ width: "55%", height: "80%", opacity: isGreen ? 0.9 : 0.5, transition: "opacity 0.4s" }}>
            <ellipse cx="60" cy="22" rx="16" ry="18" stroke={borderCol} strokeWidth="1.2" strokeDasharray="4 3" />
            <rect x="54" y="39" width="12" height="10" rx="4" stroke={borderCol} strokeWidth="1" strokeDasharray="3 2" />
            <path d="M20 52 Q60 46 100 52" stroke={borderCol} strokeWidth="1.2" strokeDasharray="4 3" />
            <path d="M22 52 Q18 90 24 118 Q30 140 36 175" stroke={borderCol} strokeWidth="1" strokeDasharray="3 2" />
            <path d="M98 52 Q102 90 96 118 Q90 140 84 175" stroke={borderCol} strokeWidth="1" strokeDasharray="3 2" />
            <path d="M22 56 L8 100" stroke={borderCol} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
            <path d="M98 56 L112 100" stroke={borderCol} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
            {[{ y: 66, label: "CHEST", col: "#06b6d4" }, { y: 88, label: "WAIST", col: "#8b5cf6" }, { y: 108, label: "HIP", col: "#06b6d4" }].map((r) => (
              <g key={r.label}>
                <line x1="24" y1={r.y} x2="96" y2={r.y} stroke={r.col} strokeWidth={isGreen ? "1.8" : "1"} strokeDasharray="5 3" opacity={isGreen ? 0.9 : 0.5} />
                <circle cx="24" cy={r.y} r="2.5" fill={r.col} opacity={isGreen ? 0.9 : 0.4} />
                <circle cx="96" cy={r.y} r="2.5" fill={r.col} opacity={isGreen ? 0.9 : 0.4} />
              </g>
            ))}
          </svg>
        </div>

        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <div key={pos} style={{
            position: "absolute",
            width: 22, height: 22,
            top:    pos[0] === "t" ? 10 : "auto", bottom: pos[0] === "b" ? 10 : "auto",
            left:   pos[1] === "l" ? 10 : "auto", right:  pos[1] === "r" ? 10 : "auto",
            borderTop:    pos[0] === "t" ? `2px solid ${borderCol}` : "none",
            borderBottom: pos[0] === "b" ? `2px solid ${borderCol}` : "none",
            borderLeft:   pos[1] === "l" ? `2px solid ${borderCol}` : "none",
            borderRight:  pos[1] === "r" ? `2px solid ${borderCol}` : "none",
            borderRadius: pos === "tl" ? "3px 0 0 0" : pos === "tr" ? "0 3px 0 0" : pos === "bl" ? "0 0 0 3px" : "0 0 3px 0",
            transition: "border-color 0.5s var(--ease-out-expo)",
          }} />
        ))}

        {/* Scan line */}
        {isProcess && (
          <div style={{
            position: "absolute", left: 0, right: 0, height: 2,
            top: `${scanPos}%`,
            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.9), transparent)",
            pointerEvents: "none",
            filter: "blur(1px)",
          }} />
        )}

        {/* Idle overlay */}
        {cameraState === "idle" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
            background: "rgba(10,13,20,0.6)",
          }}>
            <div style={{ fontSize: 42 }}>📷</div>
            <p style={{ color: "var(--clr-text-3)", fontSize: 12, textAlign: "center", padding: "0 16px" }}>
              Camera Sensor Standby
            </p>
          </div>
        )}

        {/* Confidence bottom badge */}
        {poseQuality && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(10,13,20,0.85)",
            border: `1px solid ${borderCol}30`,
            backdropFilter: "blur(8px)",
            borderRadius: "var(--r-full)",
            padding: "5px 14px",
          }}>
            <span className="dot" style={{ background: borderCol, boxShadow: `0 0 8px ${borderCol}`, animation: isGreen ? "pulse-dot 1.5s ease infinite" : "none" }} />
            <span style={{ color: borderCol, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>
              {Math.round(poseQuality.confidence_score * 100)}% CONF
            </span>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <GlassCard padding="sm" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--clr-text-1)", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
          {info.text}
        </p>
        <p style={{ color: "var(--clr-text-3)", fontSize: 11 }}>{info.sub}</p>
        {isProcess && (
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-bar__fill" style={{ width: "65%", animation: "shimmer 1.5s ease infinite" }} />
          </div>
        )}
      </GlassCard>

      {/* ── Action Buttons ── */}
      {(canCaptureFront || canCaptureSide) && (
        <button
          id={canCaptureFront ? "btn-capture-front" : "btn-capture-side"}
          className={`btn ${canCaptureFront ? "btn-primary" : "btn-secondary"} btn--full`}
          onClick={canCaptureFront ? onCaptureFront : onCaptureSide}
          style={{ minHeight: "48px" }}
        >
          📸 {canCaptureFront ? "Capture Front View" : "Capture Side View"}
        </button>
      )}

      {/* Privacy Notice */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px",
        background: "rgba(6,182,212,0.04)",
        border: "1px solid rgba(6,182,212,0.12)",
        borderRadius: "var(--r-md)",
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
        <p style={{ color: "var(--clr-text-3)", fontSize: 11, lineHeight: 1.55, margin: 0 }}>
          <span style={{ color: "var(--clr-cyan)", fontWeight: 600 }}>Zero-Image Retention:</span> Real-time frames are processed purely inside browser RAM. No visual imagery is ever transmitted to servers.
        </p>
      </div>
    </div>
  );
};

export default CameraGuideHUD;
