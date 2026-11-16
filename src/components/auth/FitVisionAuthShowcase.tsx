import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Ruler, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  MeshViewport,
  type MetricKey,
} from '@/features/anthropometry/MeshViewport';
import type { MannequinViewZone } from '@/features/avatar3d/MannequinViewer';
import { DEMO_BIOMETRIC, DEMO_MEASUREMENT, DEMO_MESH } from '@/data/mockData';
import { recommendGarmentSizes } from '@/utils/garmentSizeCalculator';
import sizeCharts from '@shared/size-charts.json';

interface AtelierPhase {
  id: number;
  zone: MannequinViewZone;
  metric: MetricKey;
  pillVi: string;
  pillEn: string;
  tagVi: string;
  tagEn: string;
  headlineVi: string;
  headlineEn: string;
  valueLabel: string;
  captionVi: string;
  captionEn: string;
  accentColor: string;
  icon: React.ReactNode;
}

export const FitVisionAuthShowcase: React.FC = () => {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const [phaseIdx, setPhaseIdx] = useState<number>(0);

  const shoulderCm = DEMO_MEASUREMENT.shoulder_breadth_cm ?? 42.1;
  const demoSizing = useMemo(
    () =>
      recommendGarmentSizes({
        gender: DEMO_BIOMETRIC.gender === 'other' ? 'neutral' : DEMO_BIOMETRIC.gender,
        chest_cm: DEMO_MEASUREMENT.chest_circ_cm,
        waist_cm: DEMO_MEASUREMENT.waist_circ_cm,
        hips_cm: DEMO_MEASUREMENT.hip_circ_cm ?? undefined,
        shoulder_cm: shoulderCm,
        inseam_cm: DEMO_MEASUREMENT.inseam_cm ?? undefined,
        height_cm: DEMO_BIOMETRIC.stature_cm ?? undefined,
        weight_kg: DEMO_BIOMETRIC.weight_kg ?? undefined,
      }),
    [shoulderCm]
  );

  const waistEaseCm = sizeCharts.ease_allowances?.trouser_waist_ease_cm ?? 2.0;
  const confidencePct = Math.round((DEMO_MEASUREMENT.extraction_confidence ?? 0.94) * 100);
  const ringCircumference = 94.2;
  const ringOffset = Math.round(ringCircumference * (1 - confidencePct / 100) * 10) / 10;

  const phases: AtelierPhase[] = [
    {
      id: 0,
      zone: 'chest',
      metric: 'chest_circ_cm',
      pillVi: '1. Quét ISO 3D',
      pillEn: '1. ISO 3D Scan',
      tagVi: 'CẮT LỚP ELIP RAMANUJAN',
      tagEn: 'RAMANUJAN 3D SLICING',
      headlineVi: 'Vòng ngực & Cầu vai',
      headlineEn: 'Chest & Shoulder Line',
      valueLabel: `${DEMO_MEASUREMENT.chest_circ_cm.toFixed(1)} cm · ${shoulderCm.toFixed(1)} cm`,
      captionVi: 'Trích xuất 13 mốc nhân trắc chuẩn ISO 8559-1 từ dữ liệu mẫu 1m72 / 70kg.',
      captionEn: 'Extracts 13 ISO 8559-1 body landmarks (172cm / 70kg sample profile).',
      accentColor: '#38BDF8',
      icon: <Camera size={14} />,
    },
    {
      id: 1,
      zone: 'waist',
      metric: 'waist_circ_cm',
      pillVi: `2. Khớp Ease +${waistEaseCm}cm`,
      pillEn: `2. Ease Fit +${waistEaseCm}cm`,
      tagVi: 'ĐỘ CỬ ĐỘNG MAY ĐO',
      tagEn: 'TAILORED EASE ALLOWANCE',
      headlineVi: `Khuyên dùng Size ${demoSizing.topwear.recommended_label}`,
      headlineEn: `Size ${demoSizing.topwear.recommended_label} Recommended`,
      valueLabel: `${isEn ? 'Waist' : 'Eo'} ${DEMO_MEASUREMENT.waist_circ_cm.toFixed(1)} cm · +${waistEaseCm}cm Ease`,
      captionVi: `Cỡ quần ${demoSizing.bottomwear.waist_inches}W (≈ Size ${demoSizing.bottomwear.asia}), tổng cạp ${demoSizing.ease_allowance_recommendation.trouser_waist_ease_cm} cm khi cử động.`,
      captionEn: `Waist ${demoSizing.bottomwear.waist_inches}W (≈ Size ${demoSizing.bottomwear.asia}), tailored to ${demoSizing.ease_allowance_recommendation.trouser_waist_ease_cm} cm with ease.`,
      accentColor: '#34D399',
      icon: <Ruler size={14} />,
    },
    {
      id: 2,
      zone: 'full_body',
      metric: 'hip_circ_cm',
      pillVi: '3. Phòng 3D & RAM',
      pillEn: '3. VELL 3D & RAM',
      tagVi: 'BẢO MẬT ZERO-RETENTION',
      tagEn: 'ZERO-RETENTION PRIVACY',
      headlineVi: 'Ướm đồ 3D trực tiếp',
      headlineEn: 'Live 3D Try-On',
      valueLabel: isEn ? '0 bytes saved on disk' : '0 byte lưu máy chủ',
      captionVi: 'Ảnh xử lý hoàn toàn trên RAM tạm thời và tự động xóa ngay lập tức.',
      captionEn: 'Images are processed strictly in RAM and destroyed immediately.',
      accentColor: '#FBBF24',
      icon: <Sparkles size={14} />,
    },
  ];

  // Auto-advance atelier phase every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIdx((prev) => (prev + 1) % phases.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [phases.length]);

  const activePhase = phases[phaseIdx];

  return (
    <div className="zf-auth-showcase-pane">
      {/* Subtle blueprint grid */}
      <div className="zf-auth-grid" />

      {/* Tailor Measuring-Tape Scale Along Left Seam (Signature FitVision Motif) */}
      <div className="hidden xl:flex flex-col justify-between py-6 absolute left-0 top-0 bottom-0 w-3 border-r border-white/10 pointer-events-none opacity-45 z-10">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className={`bg-stone-300 ${i % 5 === 0 ? 'w-2.5 h-[1.5px]' : 'w-1.5 h-[1px]'}`}
          />
        ))}
      </div>

      {/* Top Tagline Row */}
      <div className="relative z-20 flex items-center justify-between gap-4 pl-2">
        <div>
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] block"
            style={{ color: activePhase.accentColor }}
          >
            {isEn ? activePhase.tagEn : activePhase.tagVi}
          </span>
          <h2 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight mt-1 m-0 leading-snug">
            {isEn ? (
              <>
                Precision <span className="text-[#F5EBD8]">3D Tailoring</span> For Your Silhouette
              </>
            ) : (
              <>
                Đo Dáng <span className="text-[#F5EBD8]">Chuẩn May Đo 3D</span> Cho Riêng Bạn
              </>
            )}
          </h2>
        </div>

        {/* Animated Circular Fit Score Ring */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray={String(ringCircumference)}
                strokeDashoffset={String(ringOffset)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-black text-emerald-300">{confidencePct}%</span>
          </div>
          <div className="leading-tight">
            <span className="text-[10px] font-bold text-white block">
              {isEn ? 'AI Confidence' : 'Độ Tin Cậy AI'}
            </span>
            <span className="text-[10px] font-mono text-[#F5EBD8]">
              {isEn ? `Demo · Size ${demoSizing.topwear.recommended_label}` : `Mẫu Demo · Size ${demoSizing.topwear.recommended_label}`}
            </span>
          </div>
        </div>
      </div>

      {/* Center Seamless 3D Interactive Stage (No cramped inner box!) */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center my-1">
        {/* Sweeping Caliper Scan Laser */}
        <div className="zf-auth-scan" />

        {/* Real 3D WebGL Mannequin Floating Directly on Studio Stage */}
        <div className="w-full h-full">
          <MeshViewport
            meshParams={DEMO_MESH}
            measurement={DEMO_MEASUREMENT}
            height="100%"
            variant="studio"
            autoRotate
            hideCallouts
            hideZonePill
            hideDragHint
            activeMetric={activePhase.metric}
            externalZone={activePhase.zone}
          />
        </div>

        {/* Top-Left Floating Live Inspection Readout */}
        <div className="fv-float-slow hidden md:block absolute top-4 left-2 z-20 px-3.5 py-2.5 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-300">
            <span style={{ color: activePhase.accentColor }}>{activePhase.icon}</span>
            <span>{isEn ? activePhase.headlineEn : activePhase.headlineVi}</span>
          </div>
          <span className="font-mono text-sm font-black text-white block mt-0.5">
            {activePhase.valueLabel}
          </span>
        </div>

        {/* Bottom-Right Subtle Interactive 3D Hint */}
        <div className="hidden md:flex absolute bottom-3 right-2 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono text-stone-200 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>{isEn ? 'Drag 3D model to rotate' : 'Kéo xoay 3D 360°'}</span>
        </div>
      </div>

      {/* Bottom Interactive Phase Switcher + Crisp Unclipped Footer */}
      <div className="relative z-20 space-y-2.5 pl-2">
        <div className="grid grid-cols-3 gap-2">
          {phases.map((p, idx) => {
            const isActive = phaseIdx === idx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhaseIdx(idx)}
                className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#14171C] border-white shadow-lg scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
                  <span className={isActive ? 'text-blue-600' : 'text-stone-400'}>{p.icon}</span>
                  <span className="truncate">{isEn ? p.pillEn : p.pillVi}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
            <span className="leading-snug">
              {isEn ? activePhase.captionEn : activePhase.captionVi}
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5EBD8] text-[#14171C] shrink-0">
            ±0.8cm
          </span>
        </div>
      </div>
    </div>
  );
};
