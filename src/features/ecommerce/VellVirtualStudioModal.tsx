import React, { useState } from 'react';
import {
  X,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  Bookmark,
  ShoppingBag,
  Check,
  Ruler,
  User,
  ShieldCheck,
  Scissors,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import type { FashionProduct, UserBodyProfile } from './types';

export interface VellVirtualStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  initialProduct?: FashionProduct | null;
  onAddToCart?: (product: FashionProduct, size: string) => void;
}

const VELL_LOOKS = [
  {
    id: 0,
    name: 'Denim Maxi Couture',
    category: 'everyday',
    tag: 'Casual Atelier',
    price: 850000,
    chest_ease: 5.5,
    waist_ease: 6.0,
    recommended_size: 'L',
    match_percentage: 98,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=360&q=85',
    fabric: 'Denim Cotton 13.5oz Wash Mềm',
  },
  {
    id: 1,
    name: 'Cloud Set Minimalist',
    category: 'everyday',
    tag: 'Daily Luxe',
    price: 690000,
    chest_ease: 4.5,
    waist_ease: 5.0,
    recommended_size: 'M',
    match_percentage: 96,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=360&q=85',
    fabric: 'Sợi Cotton Dệt Kim Mịn Không Nhăn',
  },
  {
    id: 2,
    name: 'Library Knit Tailored',
    category: 'everyday',
    tag: 'Classic Knit',
    price: 920000,
    chest_ease: 6.0,
    waist_ease: 6.5,
    recommended_size: 'L',
    match_percentage: 99,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=360&q=85',
    fabric: 'Len Lông Cừu Merino Blend 100%',
  },
  {
    id: 3,
    name: 'Lilac Run Athletic',
    category: 'athletic',
    tag: 'Sporty Chic',
    price: 580000,
    chest_ease: 3.5,
    waist_ease: 4.0,
    recommended_size: 'M',
    match_percentage: 94,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=360&q=85',
    fabric: 'Spandex Co Giãn 4 Chiều Kháng Khuẩn',
  },
  {
    id: 4,
    name: 'Satin Night Slip',
    category: 'sleep',
    tag: 'Silk Luxury',
    price: 1150000,
    chest_ease: 4.0,
    waist_ease: 5.5,
    recommended_size: 'M',
    match_percentage: 97,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=360&q=85',
    fabric: 'Lụa Tơ Tằm Bảo Lộc Dệt Satin 19 Momme',
  },
  {
    id: 5,
    name: 'Night Suit Bespoke Tuxedo',
    category: 'formal',
    tag: 'Bespoke Evening',
    price: 2450000,
    chest_ease: 5.0,
    waist_ease: 4.5,
    recommended_size: 'L',
    match_percentage: 99,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=360&q=85',
    fabric: 'Wool Ý Super 150s Lót Lụa Bemberg',
  },
  {
    id: 6,
    name: 'Sage Slip Cocktail',
    category: 'party',
    tag: 'Party Elegance',
    price: 1350000,
    chest_ease: 4.0,
    waist_ease: 5.0,
    recommended_size: 'S',
    match_percentage: 95,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=360&q=85',
    fabric: 'Lụa Habotai Nhuộm Thủ Công Tự Nhiên',
  },
  {
    id: 7,
    name: 'Bomber Cargo Streetwear',
    category: 'street',
    tag: 'High-End Street',
    price: 1250000,
    chest_ease: 7.0,
    waist_ease: 8.0,
    recommended_size: 'XL',
    match_percentage: 97,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=360&q=85',
    fabric: 'Nylon Twill Chống Nước Phối Rib Len Dày',
  },
];

type StudioTab = 'outfits' | 'body' | 'dna' | 'atelier';

export const VellVirtualStudioModal: React.FC<VellVirtualStudioModalProps> = ({
  isOpen,
  onClose,
  userBody,
  onAddToCart,
}) => {
  const { locale } = useI18n();
  const [activeLookIndex, setActiveLookIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<StudioTab>('outfits');
  const [isWiping, setIsWiping] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [history, setHistory] = useState<number[]>([0]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const [savedToLibrary, setSavedToLibrary] = useState<boolean>(false);

  const currentLook = VELL_LOOKS[activeLookIndex];

  const handleSelectLook = (idx: number) => {
    if (idx === activeLookIndex) return;
    setIsWiping(true);
    setActiveLookIndex(idx);

    const nextHistory = history.slice(0, historyPointer + 1);
    nextHistory.push(idx);
    setHistory(nextHistory);
    setHistoryPointer(nextHistory.length - 1);

    setTimeout(() => {
      setIsWiping(false);
    }, 950);
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prev = historyPointer - 1;
      setHistoryPointer(prev);
      setActiveLookIndex(history[prev]);
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 750);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const next = historyPointer + 1;
      setHistoryPointer(next);
      setActiveLookIndex(history[next]);
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 750);
    }
  };

  const filteredLooks =
    activeCategory === 'all'
      ? VELL_LOOKS
      : VELL_LOOKS.filter((l) => l.category === activeCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 p-2 sm:p-4">
      {/* Studio Window: Clean Architectural 3-Panel Layout with Crisp High Contrast */}
      <div className="relative w-full h-full max-w-7xl max-h-[94vh] rounded-3xl overflow-hidden bg-white border border-slate-300 shadow-2xl flex flex-col font-sans text-slate-900 select-none">
        
        {/* ── TOP HEADER BAR (DEEP NAVY SLATE FOR CLEAR HIERARCHY) ── */}
        <header className="relative z-20 h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Scissors size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide uppercase text-white">
                  FitVision <span className="text-blue-400">VELL</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 hidden sm:inline-block">
                  Virtual Fitting 3D
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate hidden md:block">
                {locale === 'en'
                  ? 'Anthropometric Virtual Fitting Room & Auto Sizing'
                  : 'Phòng Thử Đồ Nhân Trắc Học & Dự Đoán Size Tự Động'}
              </p>
            </div>
          </div>

          {/* Center Step Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-semibold overflow-x-auto scrollbar-none">
            {[
              { id: 'outfits', label: locale === 'en' ? 'OUTFITS' : 'BỘ SƯU TẬP' },
              { id: 'body', label: locale === 'en' ? 'BODY ISO' : 'SỐ ĐO ISO' },
              { id: 'dna', label: locale === 'en' ? 'PROPORTIONS' : 'TỈ LỆ DÁNG' },
              { id: 'atelier', label: locale === 'en' ? 'ATELIER' : 'NHÀ MAY' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Close Studio Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Virtual Studio"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── MAIN STUDIO STAGE: LEFT INSPECTOR (WHITE) | CENTER MODEL (GALLERY DARK) | RIGHT WARDROBE (SLATE-50) ── */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column (lg:col-span-3): Crisp White Biometric & Fit Inspector */}
          <aside className="hidden lg:flex lg:col-span-3 bg-white border-r border-slate-200 p-5 flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Biometric Profile Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-blue-600" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800">
                      {locale === 'en' ? 'Your Body Profile' : 'Hồ Sơ Vóc Dáng Của Bạn'}
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* 4 Core Dimensions */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {locale === 'en' ? 'Height' : 'Chiều cao'}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{userBody.height_cm} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {locale === 'en' ? 'Weight' : 'Cân nặng'}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{userBody.weight_kg} kg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {locale === 'en' ? 'Chest (V1)' : 'Vòng ngực (V1)'}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{userBody.chest_cm} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {locale === 'en' ? 'Waist (V2)' : 'Vòng eo (V2)'}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{userBody.waist_cm} cm</span>
                  </div>
                </div>
              </div>

              {/* Fit Prediction Card (High Contrast Light Blue Card) */}
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold">
                    {locale === 'en' ? 'Recommended Size:' : 'Khuyên dùng bộ này:'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg font-mono font-extrabold bg-blue-600 text-white text-xs shadow-2xs">
                    Size {currentLook.recommended_size}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/70">
                  <span className="text-slate-600 font-medium">
                    {locale === 'en' ? 'AI Fit Score:' : 'Độ vừa vặn AI:'}
                  </span>
                  <span className="font-extrabold text-emerald-700 font-mono">
                    {currentLook.match_percentage}% Match
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-600 font-medium whitespace-nowrap">
                    {locale === 'en' ? 'Ease Allowance:' : 'Độ cử động:'}
                  </span>
                  <span className="font-bold text-blue-700 font-mono whitespace-nowrap">
                    +{currentLook.chest_ease} cm ({locale === 'en' ? 'Comfort' : 'Êm ái'})
                  </span>
                </div>
              </div>

              {/* Fabric Spec Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  {locale === 'en' ? 'Fabric Material' : 'Chất liệu vải'}
                </span>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  {currentLook.fabric}
                </p>
              </div>
            </div>

            {/* Bottom Undo / Redo / Reset Bar */}
            <div className="mt-4 p-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyPointer <= 0}
                className="flex-1 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white disabled:opacity-35 transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold"
                title="Quay lại bộ trước"
              >
                <Undo2 size={14} />
                <span>{locale === 'en' ? 'Undo' : 'Lùi'}</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyPointer >= history.length - 1}
                className="flex-1 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white disabled:opacity-35 transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold"
                title="Tiếp theo"
              >
                <Redo2 size={14} />
                <span>{locale === 'en' ? 'Redo' : 'Tiến'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLook(0)}
                className="flex-1 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold"
                title="Khôi phục mặc định"
              >
                <RotateCcw size={14} />
                <span>{locale === 'en' ? 'Reset' : 'Mặc định'}</span>
              </button>
            </div>
          </aside>

          {/* Center Column (lg:col-span-5): Clean Studio Viewport (No Blurry Double Background!) */}
          <div
            className="lg:col-span-5 relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 50% 35%, #1e293b 0%, #0f172a 55%, #020617 100%)',
            }}
          >
            {/* Clean Framed Portrait Container */}
            <div className="relative h-full max-h-[76vh] w-full max-w-[420px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900">
              
              {/* Top Floating Fit Badge inside Viewport */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-sm">
                  {currentLook.tag}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-mono font-bold shadow-sm">
                  {currentLook.match_percentage}% {locale === 'en' ? 'Fit' : 'Vừa vặn'}
                </span>
              </div>

              {/* Crisp Model Look Image */}
              <div className="relative flex-1 overflow-hidden bg-slate-900">
                <img
                  src={currentLook.img}
                  alt={currentLook.name}
                  className="w-full h-full object-cover object-top pointer-events-none transition-all duration-300 select-none"
                  style={{
                    filter: isWiping ? 'brightness(1.06)' : 'none',
                  }}
                />

                {/* Scan Line Wipe Animation */}
                {isWiping && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute left-[-15%] right-[-15%] h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_25px_8px_rgba(255,255,255,0.85),0_0_60px_18px_rgba(59,130,246,0.55)] animate-scan-wipe" />
                  </div>
                )}

                {/* Hotspot 1: Chest Ease Allowance */}
                <div className="absolute top-[33%] left-[57%] group/hotspot cursor-pointer z-20">
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-white shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-50" />
                  </div>
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden group-hover/hotspot:block whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700 text-white text-[11px] shadow-xl z-30">
                    <span className="font-bold text-blue-300">Vòng Ngực Áo:</span>{' '}
                    {userBody.chest_cm + currentLook.chest_ease}cm (+{currentLook.chest_ease}cm Ease)
                  </div>
                </div>

                {/* Hotspot 2: Waist Ease Allowance */}
                <div className="absolute top-[47%] left-[41%] group/hotspot cursor-pointer z-20">
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-white shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-50" />
                  </div>
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden group-hover/hotspot:block whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700 text-white text-[11px] shadow-xl z-30">
                    <span className="font-bold text-emerald-300">Vòng Eo Áo:</span>{' '}
                    {userBody.waist_cm + currentLook.waist_ease}cm
                  </div>
                </div>
              </div>

              {/* Clean Anchored Bottom Bar (High Contrast Dark Navy Footer) */}
              <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 z-20">
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {currentLook.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-extrabold text-amber-300 font-mono">
                      {currentLook.price.toLocaleString('vi-VN')} ₫
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      · Size {currentLook.recommended_size}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSavedToLibrary(true);
                      setTimeout(() => setSavedToLibrary(false), 2000);
                    }}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Lưu vào tủ đồ"
                  >
                    {savedToLibrary ? <Check size={16} className="text-emerald-400" /> : <Bookmark size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart) {
                        const fakeProd: any = {
                          id: `vell-${currentLook.id}`,
                          name: currentLook.name,
                          price: currentLook.price,
                          image_url: currentLook.img,
                          brand_name: 'VELL Atelier',
                          fabric_material: currentLook.fabric,
                          category: currentLook.category,
                        };
                        onAddToCart(fakeProd, currentLook.recommended_size);
                      }
                    }}
                    className="px-3.5 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    <span>{locale === 'en' ? `Add Size ${currentLook.recommended_size}` : `Mua Size ${currentLook.recommended_size}`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (lg:col-span-4): Clean Light Wardrobe Selector */}
          <div className="lg:col-span-4 bg-slate-50 border-l border-slate-200 p-4 sm:p-5 overflow-y-auto space-y-4">
            {activeTab === 'outfits' && (
              <div className="space-y-4">
                {/* Outfits Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'Tất Cả (8)' },
                    { id: 'everyday', label: 'Hàng Ngày' },
                    { id: 'formal', label: 'Dạ Hội / Vest' },
                    { id: 'athletic', label: 'Thể Thao' },
                    { id: 'sleep', label: 'Lụa Mềm' },
                    { id: 'street', label: 'Streetwear' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        activeCategory === c.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* 2-Column Crisp White Outfit Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredLooks.map((look) => {
                    const isSelected = look.id === activeLookIndex;
                    return (
                      <div
                        key={look.id}
                        onClick={() => handleSelectLook(look.id)}
                        className={`group relative p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden bg-white ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-sm'
                        }`}
                      >
                        <div className="relative aspect-[3/4] rounded-xl bg-slate-100 overflow-hidden mb-2.5">
                          <img
                            src={look.thumb}
                            alt={look.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 right-1.5">
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
                              {look.match_percentage}%
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {look.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <span className="font-mono text-blue-700 font-extrabold">
                            {look.price.toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                            Size {look.recommended_size}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Ruler size={16} className="text-blue-600" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    Trích Xuất Nhân Trắc Học ISO 8559-1
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hệ thống sử dụng tích phân Ramanujan bậc hai để trích xuất các đường bao chu vi từ ảnh chụp dáng chuẩn của bạn:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">Chu vi ngực (Bust/Chest):</span>
                    <span className="font-mono font-extrabold text-blue-700">{userBody.chest_cm} cm</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">Chu vi eo tự nhiên (Waist):</span>
                    <span className="font-mono font-extrabold text-blue-700">{userBody.waist_cm} cm</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">Chu vi mông (Hip):</span>
                    <span className="font-mono font-extrabold text-blue-700">{userBody.hip_cm} cm</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">Rộng vai (Bi-acromial):</span>
                    <span className="font-mono font-extrabold text-blue-700">{userBody.shoulder_cm || 43} cm</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dna' && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Sparkles size={16} className="text-purple-600" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    Tỉ Lệ Vóc Dáng & Phân Tích Hình Thể
                  </h3>
                </div>
                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="font-bold text-purple-900 block mb-1">
                      Dáng Người: Cân Đối Chuẩn V-Shape
                    </span>
                    <span className="text-slate-700">
                      Tỉ lệ Vai/Eo đạt 1.25. Phù hợp nhất với các thiết kế Regular Slim hoặc Tuxedo tôn bờ vai vững chãi.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-1">
                      Khuyến Nghị Cổ Áo:
                    </span>
                    <span className="text-slate-700">
                      Cổ bẻ Semi-spread hoặc Cổ bấm cổ điển tôn đường nét khuôn mặt góc cạnh.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'atelier' && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    Quy Trình Cắt May Nhà May (Bespoke Specs)
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Khi đặt may, số đo của bạn sẽ được mã hóa và chuyển thẳng đến tay thợ may trưởng. Không cần đến tiệm đo dây thủ công.
                </p>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 block">Cam Kết Vừa Vặn 100%:</span>
                  <p className="text-[11px] text-amber-950/80">
                    Nếu áo không vừa như dự đoán 3D, xưởng may chỉnh sửa hoàn toàn miễn phí trong 14 ngày.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VellVirtualStudioModal;
