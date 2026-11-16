import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  MeshViewport,
  type MetricKey,
} from '@/features/anthropometry/MeshViewport';
import type { MannequinViewZone } from '@/features/avatar3d/MannequinViewer';
import { DEMO_MESH, DEMO_MEASUREMENT } from '@/data/mockData';

interface ShowcaseStep {
  id: number;
  zone: MannequinViewZone;
  metric: MetricKey;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  badgeText: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  icon: React.ReactNode;
}

export const FitVisionAuthShowcase: React.FC = () => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const steps: ShowcaseStep[] = [
    {
      id: 0,
      zone: 'chest',
      metric: 'chest_circ_cm',
      titleVi: '1. Quét Dáng AI 30s',
      titleEn: '1. 30s AI Body Scan',
      descVi: 'Cắt lớp elip Ramanujan 3D trích xuất 13 mốc chuẩn ISO 8559.',
      descEn: 'Ramanujan 3D ellipse slicing extracts 13 ISO 8559 landmarks.',
      badgeText: '92.4 cm · ISO Chest',
      accentBg: 'bg-blue-600/20',
      accentBorder: 'border-blue-400/50',
      accentText: 'text-sky-300',
      icon: <Camera size={15} />,
    },
    {
      id: 1,
      zone: 'waist',
      metric: 'waist_circ_cm',
      titleVi: '2. Tính Độ Cử Động',
      titleEn: '2. Ease Allowance Fit',
      descVi: 'Tự cộng +4cm độ cử động may đo để vừa phom & mặc thoải mái.',
      descEn: 'Adds +4cm artisan tailoring ease for natural comfort & drape.',
      badgeText: '98% Match · Size M',
      accentBg: 'bg-emerald-500/20',
      accentBorder: 'border-emerald-400/50',
      accentText: 'text-emerald-300',
      icon: <Ruler size={15} />,
    },
    {
      id: 2,
      zone: 'full_body',
      metric: 'hip_circ_cm',
      titleVi: '3. Phòng Thử Đồ VELL',
      titleEn: '3. 3D Virtual Studio',
      descVi: 'Ướm đồ 3D trực tiếp trước khi mua · Xóa sạch ảnh khỏi RAM.',
      descEn: 'Preview outfits in 3D before checkout · 0-byte RAM retention.',
      badgeText: '0 byte RAM · 3D Live',
      accentBg: 'bg-amber-500/20',
      accentBorder: 'border-amber-300/50',
      accentText: 'text-amber-300',
      icon: <Sparkles size={15} />,
    },
  ];

  // Auto-cycle workflow highlight smoothly to demonstrate how FitVision 3D works
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % steps.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [steps.length]);

  const currentStep = steps[activeStepIdx];

  return (
    <div className="zf-auth-showcase-pane">
      <div className="zf-auth-grid" />
      <div className="zf-auth-orb" />

      {/* 1. Top Brand Bar */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/35">
            <Scissors size={19} strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white block leading-tight">
              FitVision <span className="text-sky-400">3D</span>
            </span>
            <span className="text-[11px] font-medium text-slate-300 block">
              {t('app.auth.engine', 'Atelier & Công nghệ đo dáng 3D')}
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t('app.auth.isoBadge', 'CHUẨN ISO 8559-1')}</span>
        </div>
      </div>

      {/* 2. Center Live 3D Scanner Viewport + Animated Laser Beam + Live Metrics */}
      <div className="relative z-10 my-auto py-2">
        <div className="relative rounded-2xl overflow-hidden bg-[#0B1018]/90 border border-white/15 shadow-2xl">
          {/* Animated Cobalt Scan Laser Sweep */}
          <div className="zf-auth-scan" />

          {/* Floating Step Status Pill Top-Left */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-white shadow-md">
            <span className={currentStep.accentText}>{currentStep.icon}</span>
            <span>{currentStep.badgeText}</span>
          </div>

          {/* Floating Fit Match Pill Top-Right */}
          <div className="hidden sm:flex absolute top-3 right-3 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md border border-emerald-400/50 text-[11px] font-mono font-black text-white shadow-md">
            <CheckCircle2 size={13} />
            <span>98% {isEn ? 'Perfect Fit' : 'Vừa Vặn'}</span>
          </div>

          {/* Live WebGL 3D Mannequin Canvas */}
          <div className="h-[240px] xl:h-[290px]">
            <MeshViewport
              meshParams={DEMO_MESH}
              measurement={DEMO_MEASUREMENT}
              height="100%"
              variant="dark"
              autoRotate
              hideCallouts
              hideZonePill
              hideDragHint
              activeMetric={currentStep.metric}
              externalZone={currentStep.zone}
            />
          </div>

          {/* Floating Bottom Extracted Measurements Bar inside 3D Frame */}
          <div className="px-4 py-2.5 bg-black/55 backdrop-blur-md border-t border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/5 px-2 py-1 border border-white/10">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Chest' : 'Vòng ngực'}
              </span>
              <span className="font-mono text-xs font-extrabold text-sky-300">92.4 cm</span>
            </div>
            <div className="rounded-lg bg-white/5 px-2 py-1 border border-white/10">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Waist' : 'Vòng eo'}
              </span>
              <span className="font-mono text-xs font-extrabold text-emerald-300">78.0 cm</span>
            </div>
            <div className="rounded-lg bg-white/5 px-2 py-1 border border-white/10">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Shoulder' : 'Rộng vai'}
              </span>
              <span className="font-mono text-xs font-extrabold text-amber-300">42.1 cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive 3-Step Animated App Workflow Cards */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg xl:text-xl font-bold text-white leading-snug m-0">
            {t('app.auth.taglinePre', 'Đo dáng ')}{' '}
            <span className="text-sky-400 italic">{t('app.auth.taglineHi', 'Nhân Trắc Học 3D')}</span>,{' '}
            <span className="text-amber-200">{t('app.auth.taglinePost', 'chọn size chuẩn từng cm.')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {steps.map((step, idx) => {
            const isActive = activeStepIdx === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepIdx(idx)}
                className={`text-left p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `${step.accentBg} ${step.accentBorder} shadow-lg scale-[1.02]`
                    : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={isActive ? step.accentText : 'text-slate-400'}>
                    {step.icon}
                  </span>
                  <span className="text-[11px] font-bold text-white truncate">
                    {isEn ? step.titleEn : step.titleVi}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug line-clamp-2 m-0">
                  {isEn ? step.descEn : step.descVi}
                </p>
              </button>
            );
          })}
        </div>

        {/* Bottom Zero-Retention Privacy Guarantee Pill */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
          <span className="flex items-center gap-2 font-medium truncate">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">
              {t('app.auth.aboutDesc', 'Ảnh xử lý trên bộ nhớ RAM và tự động xóa vĩnh viễn (0 byte lưu trữ).')}
            </span>
          </span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-sky-300 border border-blue-400/30 shrink-0">
            ±0.8cm
          </span>
        </div>
      </div>
    </div>
  );
};
