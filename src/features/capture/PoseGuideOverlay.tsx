import React from 'react';

interface PoseGuideOverlayProps {
  mode: 'front' | 'side';
  isAligned?: boolean;
}

export const PoseGuideOverlay: React.FC<PoseGuideOverlayProps> = ({
  mode,
  isAligned = false,
}) => {
  const strokeColor = isAligned ? '#10b981' : '#06b6d4';

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
      {/* Corner Viewfinder Brackets */}
      <div className="absolute inset-6 border border-white/10 rounded-2xl">
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
      </div>

      {/* Center alignment guide line */}
      <div className="absolute inset-y-8 w-[1px] bg-cyan-500/20 dashed" />

      {/* SVG Human Silhouette Guide */}
      <svg
        className="w-full h-full max-h-[85%] transition-colors duration-500 opacity-80"
        viewBox="0 0 200 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {mode === 'front' ? (
          // Front A-Pose Guide Silhouette
          <g stroke={strokeColor} strokeWidth="1.8" strokeDasharray="4 4">
            {/* Head */}
            <ellipse cx="100" cy="45" rx="18" ry="24" />
            <circle cx="100" cy="45" r="3" fill={strokeColor} />
            {/* Neck */}
            <path d="M94 69 L94 80 M106 69 L106 80" />
            {/* Torso & Shoulders */}
            <path d="M60 92 L94 80 L106 80 L140 92" />
            {/* Torso Contours */}
            <path d="M65 95 C62 135, 70 170, 72 210 L128 210 C130 170, 138 135, 135 95" />
            {/* Arms (A-Pose ~35 deg) */}
            <path d="M60 92 L36 170 L24 235" />
            <path d="M140 92 L164 170 L176 235" />
            {/* Legs */}
            <path d="M78 210 L70 300 L68 375" />
            <path d="M122 210 L130 300 L132 375" />
            <path d="M90 215 L90 290 L88 370" />
            <path d="M110 215 L110 290 L112 370" />
            {/* Reference horizontal markers */}
            <line x1="50" y1="92" x2="150" y2="92" strokeWidth="0.8" opacity="0.4" />
            <line x1="55" y1="130" x2="145" y2="130" strokeWidth="0.8" opacity="0.4" />
            <line x1="60" y1="165" x2="140" y2="165" strokeWidth="0.8" opacity="0.4" />
            <line x1="58" y1="210" x2="142" y2="210" strokeWidth="0.8" opacity="0.4" />
          </g>
        ) : (
          // Side View Silhouette Guide
          <g stroke={strokeColor} strokeWidth="1.8" strokeDasharray="4 4">
            {/* Head side */}
            <ellipse cx="100" cy="45" rx="16" ry="24" />
            {/* Spine & Back profile */}
            <path d="M102 69 C95 100, 92 140, 96 175 C98 200, 92 225, 96 260 L98 370" />
            {/* Chest & Front profile */}
            <path d="M106 69 C118 100, 120 135, 112 175 C108 205, 114 235, 110 260 L108 370" />
            {/* Arm hanging naturally */}
            <path d="M102 96 L104 185 L106 240" />
          </g>
        )}
      </svg>
    </div>
  );
};
