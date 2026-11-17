import React, { useEffect, useState } from 'react';
import { Camera, Ruler, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  MeshViewport,
  type MetricKey,
} from '@/features/anthropometry/MeshViewport';
import type { MannequinViewZone } from '@/features/avatar3d/MannequinViewer';
import { DEMO_MEASUREMENT, DEMO_MESH } from '@/data/mockData';

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
  valueVi: string;
  valueEn: string;
  captionVi: string;
  captionEn: string;
  accentColor: string;
  icon: React.ReactNode;
}

const MALE_PREVIEW_MESH = {
  ...DEMO_MESH,
  base_gender_mesh: 'male_base' as const,
  scale_chest: 1.05,
  scale_waist: 0.96,
  scale_hips: 1.02,
};

const FEMALE_PREVIEW_MESH = {
  ...DEMO_MESH,
  base_gender_mesh: 'female_base' as const,
  scale_chest: 1.04,
  scale_waist: 0.94,
  scale_hips: 1.06,
};

const FitVisionAuthShowcaseInner: React.FC = () => {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [previewGender, setPreviewGender] = useState<'male' | 'female'>('male');

  const previewMesh = previewGender === 'female' ? FEMALE_PREVIEW_MESH : MALE_PREVIEW_MESH;

  const phases: AtelierPhase[] = [
    {
      id: 0,
      zone: 'chest',
      metric: 'chest_circ_cm',
      pillVi: '1. Quét ISO 3D',
      pillEn: '1. ISO 3D Scan',
      tagVi: 'CẮT LỚP ELIP RAMANUJAN',
      tagEn: 'RAMANUJAN 3D SLICING',
      headlineVi: 'Trích xuất tự động',
      headlineEn: 'Automated Extraction',
      valueVi: '13 Mốc Nhân Trắc 3D',
      valueEn: '13 ISO 8559-1 Landmarks',
      captionVi: 'Đăng nhập để quét ảnh chữ A và nhận số đo Ngực · Eo · Hông · Vai của riêng bạn.',
      captionEn: 'Sign in to scan your A-pose photo and extract your personal Chest · Waist · Hips.',
      accentColor: '#38BDF8',
      icon: <Camera size={14} />,
    },
    {
      id: 1,
      zone: 'waist',
      metric: 'waist_circ_cm',
      pillVi: '2. Khớp Size & Ease',
      pillEn: '2. Ease & Sizing',
      tagVi: 'ĐỘ CỬ ĐỘNG MAY ĐO',
      tagEn: 'TAILORED EASE ALLOWANCE',
      headlineVi: 'Gợi ý size theo dáng',
      headlineEn: 'Personalized Size Match',
      valueVi: 'Cộng Ease +2 đến +8 cm',
      valueEn: '+2 to +8 cm Ease Balance',
      captionVi: 'Tự động tính độ chùng vải theo từng phom Slim / Regular giúp mặc vừa vặn nhất.',
      captionEn: 'Balances fabric drape across Slim & Regular fits automatically for your silhouette.',
      accentColor: '#34D399',
      icon: <Ruler size={14} />,
    },
    {
      id: 2,
      zone: 'full_body',
      metric: 'hip_circ_cm',
      pillVi: '3. Phòng 3D & RAM',
      pillEn: '3. 3D Room & RAM',
      tagVi: 'BẢO MẬT ZERO-RETENTION',
      tagEn: 'ZERO-RETENTION PRIVACY',
      headlineVi: 'Ướm đồ 3D trực tiếp',
      headlineEn: 'Live 3D Try-On',
      valueVi: '0 byte lưu máy chủ',
      valueEn: '0 bytes stored on disk',
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

      {/* Tailor Measuring-Tape Scale Along Left Seam */}
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

        {/* Precision Spec Pill (No misleading personal measurements before login) */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
          <div className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/30 font-mono text-xs font-black text-emerald-300">
            ±0.8 cm
          </div>
          <div className="leading-tight">
            <span className="text-[10px] font-bold text-white block">
              {isEn ? 'AI Accuracy' : 'Độ Chuẩn AI'}
            </span>
            <span className="text-[10px] font-mono text-[#F5EBD8]">
              ISO 8559-1
            </span>
          </div>
        </div>
      </div>

      {/* Center Seamless 3D Interactive Stage */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center my-1">
        {/* Sweeping Caliper Scan Laser */}
        <div className="zf-auth-scan" />

        {/* Real 3D WebGL Anatomical Mesh (Male / Female Toggleable) */}
        <div className="w-full h-full">
          <MeshViewport
            meshParams={previewMesh}
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

        {/* Top-Left Floating Capability Readout */}
        <div className="fv-float-slow hidden md:block absolute top-4 left-2 z-20 px-3.5 py-2.5 rounded-xl bg-black/45 backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-300">
            <span style={{ color: activePhase.accentColor }}>{activePhase.icon}</span>
            <span>{isEn ? activePhase.headlineEn : activePhase.headlineVi}</span>
          </div>
          <span className="font-mono text-sm font-black text-white block mt-0.5">
            {isEn ? activePhase.valueEn : activePhase.valueVi}
          </span>
        </div>

        {/* Top-Right Compact Male / Female 3D Model Preview Switch */}
        <div className="hidden md:flex absolute top-4 right-2 z-20 items-center gap-1 p-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 select-none">
          <button
            type="button"
            onClick={() => setPreviewGender('male')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border-0 ${
              previewGender === 'male'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-transparent text-stone-300 hover:text-white'
            }`}
          >
            {isEn ? 'Male 3D' : 'Dáng Nam'}
          </button>
          <button
            type="button"
            onClick={() => setPreviewGender('female')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border-0 ${
              previewGender === 'female'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-transparent text-stone-300 hover:text-white'
            }`}
          >
            {isEn ? 'Female 3D' : 'Dáng Nữ'}
          </button>
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

export const FitVisionAuthShowcase = React.memo(FitVisionAuthShowcaseInner);
