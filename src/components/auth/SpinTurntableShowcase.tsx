import React, { useState } from 'react';
import { Layers, Scissors, ShieldCheck, RotateCw } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  MeshViewport,
  type MetricKey,
} from '@/features/anthropometry/MeshViewport';
import type { MannequinViewZone } from '@/features/avatar3d/MannequinViewer';
import { DEMO_MESH, DEMO_MEASUREMENT } from '@/data/mockData';

interface ZonePreset {
  zone: MannequinViewZone;
  metric: MetricKey;
  labelVi: string;
  labelEn: string;
  value: string;
}

const ZONE_PRESETS: ZonePreset[] = [
  {
    zone: 'full_body',
    metric: 'shoulder_breadth_cm',
    labelVi: 'Toàn thân',
    labelEn: 'Full Body',
    value: '172 cm',
  },
  {
    zone: 'chest',
    metric: 'chest_circ_cm',
    labelVi: 'Vòng ngực',
    labelEn: 'Chest',
    value: '92.4 cm',
  },
  {
    zone: 'waist',
    metric: 'waist_circ_cm',
    labelVi: 'Vòng eo',
    labelEn: 'Waist',
    value: '78.0 cm',
  },
  {
    zone: 'hips',
    metric: 'hip_circ_cm',
    labelVi: 'Vòng mông',
    labelEn: 'Hips',
    value: '96.0 cm',
  },
];

export const SpinTurntableShowcase: React.FC = () => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  const [activeZone, setActiveZone] = useState<MannequinViewZone>('full_body');
  const [activeMetric, setActiveMetric] = useState<MetricKey>('chest_circ_cm');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);

  return (
    <div className="zf-auth-showcase-pane">
      <div className="zf-auth-grid" />

      {/* Top Brand Header */}
      <div className="relative z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
            <Scissors size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-[#14171C] block leading-tight">
              FitVision <span className="text-blue-600">3D</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 block">
              {t('app.auth.engine', 'Công cụ phân tích hình thể 3D')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAutoRotate((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
              isAutoRotate
                ? 'bg-[#14171C] text-white border-[#14171C]'
                : 'bg-white/90 text-slate-700 border-slate-300'
            }`}
            title={isEn ? 'Toggle 360° auto-rotate' : 'Bật/tắt tự xoay 360°'}
          >
            <RotateCw size={11} className={isAutoRotate ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
            <span>360°</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ISO 8559-1</span>
          </div>
        </div>
      </div>

      {/* Center Stage: Real Interactive 3D Humanoid Mesh on Spin-Product Studio Gray */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center my-1">
        {/* Three.js Interactive 3D Mesh Canvas (Transparent over #E2E4E8) */}
        <div className="w-full h-full">
          <MeshViewport
            meshParams={DEMO_MESH}
            measurement={DEMO_MEASUREMENT}
            height="100%"
            variant="studio"
            autoRotate={isAutoRotate}
            hideCallouts
            hideZonePill
            hideDragHint
            activeMetric={activeMetric}
            externalZone={activeZone}
            onSelectMetric={(m) => setActiveMetric(m)}
          />
        </div>

        {/* SVG Architectural Connector Lines (Left Card -> 3D Mesh) */}
        <svg
          className="hidden xl:block absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 27 40 H 37 L 43 34"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.35"
            pathLength={1}
            className="fv-connector-path"
          />
          <path
            d="M 76 52 H 63 L 57 48"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.35"
            pathLength={1}
            className="fv-connector-path"
          />
        </svg>

        {/* Left Spin-Product Notched Spec Card */}
        <div className="hidden xl:block absolute left-0 top-[24%] w-44 z-20 fv-notched-card bg-white/95 backdrop-blur-sm px-4 py-3.5 shadow-lg border border-white pointer-events-none">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-600">
              FITVISION 3D
            </span>
            <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-mono font-bold text-slate-700 rounded">
              ISO 8559
            </span>
          </div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-950 leading-snug">
            {isEn ? '13-Point 3D\nBody Model' : 'Mô Hình 3D\nChuẩn 13 Mốc'}
          </h4>
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[10px] font-mono text-slate-600">
            <div className="flex justify-between">
              <span>{isEn ? 'Precision' : 'Sai số'}</span>
              <strong className="text-slate-950">±0.8 cm</strong>
            </div>
            <div className="flex justify-between">
              <span>{isEn ? 'Latency' : 'Xử lý'}</span>
              <strong className="text-emerald-700">1.25s</strong>
            </div>
            <div className="flex justify-between">
              <span>{isEn ? 'RAM Privacy' : 'Lưu ảnh'}</span>
              <strong className="text-blue-600">0 byte</strong>
            </div>
          </div>
        </div>

        {/* Right Compact Zone Metric Cards (Click to Zoom Camera + Highlight Ring on 3D Model) */}
        <div className="hidden sm:flex flex-col gap-1.5 absolute right-0 top-[28%] z-20 w-36">
          {ZONE_PRESETS.slice(1).map((item) => {
            const isSelected = activeZone === item.zone;
            return (
              <button
                key={item.zone}
                type="button"
                onClick={() => {
                  setActiveZone(item.zone);
                  setActiveMetric(item.metric);
                }}
                className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'bg-[#14171C] text-white border-[#14171C] scale-[1.03]'
                    : 'bg-white/90 hover:bg-white text-slate-900 border-white'
                }`}
              >
                <span className={`text-[9px] font-mono uppercase tracking-wider block ${isSelected ? 'text-blue-300' : 'text-slate-500'}`}>
                  {isEn ? item.labelEn : item.labelVi}
                </span>
                <span className="font-mono text-xs font-black">
                  {item.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom-Left Spin-Product Corner-Bracket Zone Selector */}
        <div className="absolute left-0 bottom-2 flex items-center gap-1.5 z-20">
          {ZONE_PRESETS.map((item) => {
            const isSelected = activeZone === item.zone;
            return (
              <button
                key={item.zone}
                type="button"
                onClick={() => {
                  setActiveZone(item.zone);
                  setActiveMetric(item.metric);
                }}
                className={`px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white text-[#14171C] fv-bracket-active shadow-sm'
                    : 'bg-white/60 text-slate-700 hover:bg-white/90 rounded'
                }`}
              >
                {isEn ? item.labelEn : item.labelVi}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Readout Track + Privacy Footer */}
      <div className="relative z-20 space-y-2">
        <div className="flex items-center justify-center gap-3 text-[10px] font-mono tracking-widest text-slate-600">
          <span className="uppercase font-semibold">
            {isEn ? 'Drag 3D Model to Rotate 360°' : 'Kéo mô hình 3D để xoay 360°'}
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-bold text-[#14171C]">
            {isEn ? 'Scroll to Zoom' : 'Cuộn để phóng to'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white/85 border border-slate-300/80 text-[11px] text-slate-700 shadow-2xs">
          <span className="flex items-center gap-1.5 font-semibold truncate">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate">
              {t('app.auth.aboutTitle', 'Ảnh xử lý trên RAM 100% — Không lưu trữ máy chủ')}
            </span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-blue-700 shrink-0">
            <Layers size={12} />
            <span>WebGL 3D</span>
          </span>
        </div>
      </div>
    </div>
  );
};
