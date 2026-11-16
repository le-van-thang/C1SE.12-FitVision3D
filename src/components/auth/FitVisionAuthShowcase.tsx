import React, { useEffect, useState } from 'react';
import { Camera, Ruler, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  MeshViewport,
  type MetricKey,
} from '@/features/anthropometry/MeshViewport';
import type { MannequinViewZone } from '@/features/avatar3d/MannequinViewer';
import { DEMO_MESH, DEMO_MEASUREMENT } from '@/data/mockData';

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
      valueLabel: '92.4 cm · 42.1 cm',
      captionVi: 'Trích xuất 13 mốc nhân trắc chuẩn ISO 8559-1 chỉ trong 1.25 giây.',
      captionEn: 'Extracts 13 ISO 8559-1 body landmarks in just 1.25 seconds.',
      accentColor: '#38BDF8',
      icon: <Camera size={14} />,
    },
    {
      id: 1,
      zone: 'waist',
      metric: 'waist_circ_cm',
      pillVi: '2. Khớp Ease +4cm',
      pillEn: '2. Ease Fit +4cm',
      tagVi: 'ĐỘ CỬ ĐỘNG MAY ĐO',
      tagEn: 'TAILORED EASE ALLOWANCE',
      headlineVi: 'Khuyên dùng Size M',
      headlineEn: 'Size M Recommended',
      valueLabel: 'Eo 78.0 cm · +4cm Ease',
      captionVi: 'Tự động tính độ chùng vải giúp trang phục vừa phom và thoải mái.',
      captionEn: 'Balances fabric drape and movement allowance automatically.',
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
      valueLabel: '0 byte lưu máy chủ',
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
                strokeDasharray="94.2"
                strokeDashoffset="3.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-black text-emerald-300">98%</span>
          </div>
          <div className="leading-tight">
            <span className="text-[10px] font-bold text-white block">
              {isEn ? 'Fit Match' : 'Độ Vừa AI'}
            </span>
            <span className="text-[10px] font-mono text-[#F5EBD8]">
              {isEn ? 'AI Tailored' : 'Chuẩn May Đo'}
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
