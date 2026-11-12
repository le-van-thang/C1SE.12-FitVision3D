import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, LogIn, Camera, ArrowDown, Check, ArrowRight } from 'lucide-react';
import { UserBodyProfile } from './types';

interface MaisonVellRunwayHeroProps {
  userBody: UserBodyProfile;
  isAuthenticated: boolean;
  onOpenSignIn: () => void;
  onOpenVellStudio: () => void;
  onNavigateToScan: () => void;
  onAddToCart: (piece: { id: string; name: string; price: number; size: string }) => void;
  onScrollToCatalog: () => void;
}

interface RunwayPiece {
  id: string;
  name: string;
  priceUSD: number;
  priceVND: number;
  box: [number, number, number, number]; // x0, x1, y0, y1 on 960x720 sheet
  fitScore: number;
  recSize: string;
}

interface RunwayLook {
  lookNumber: number;
  title: string;
  subtitle: string;
  xRange: [number, number]; // x0, x1 on 960x540 sheet
  pieces: RunwayPiece[];
}

const RUNWAY_LOOKS: RunwayLook[] = [
  {
    lookNumber: 15,
    title: 'Look 15 — Blush Feathers',
    subtitle: 'Blush feather structured jacket & satin wide trousers',
    xRange: [12, 176],
    pieces: [
      { id: 'mv-15-1', name: 'Feather Structured Jacket', priceUSD: 2900, priceVND: 68000000, box: [26, 224, 28, 214], fitScore: 98, recSize: 'M' },
      { id: 'mv-15-2', name: 'Satin Wide Leg Trousers', priceUSD: 1450, priceVND: 34000000, box: [304, 412, 22, 236], fitScore: 96, recSize: 'M' },
    ],
  },
  {
    lookNumber: 16,
    title: 'Look 16 — Sage Pleats',
    subtitle: 'Sage micro-pleated couture gown & sculpted waist belt',
    xRange: [178, 330],
    pieces: [
      { id: 'mv-16-1', name: 'Pleated Evening Dress', priceUSD: 2200, priceVND: 51500000, box: [530, 666, 12, 242], fitScore: 95, recSize: 'S' },
      { id: 'mv-16-2', name: 'Gold Waist Belt', priceUSD: 420, priceVND: 9800000, box: [752, 922, 100, 146], fitScore: 99, recSize: 'FREE' },
    ],
  },
  {
    lookNumber: 17,
    title: 'Look 17 — Champagne Trench',
    subtitle: 'Champagne liquid-satin trench dress & architectural tote',
    xRange: [331, 470],
    pieces: [
      { id: 'mv-17-1', name: 'Satin Trench Dress', priceUSD: 2350, priceVND: 55000000, box: [70, 176, 246, 466], fitScore: 97, recSize: 'M' },
      { id: 'mv-17-2', name: 'Top Handle Sculpted Bag', priceUSD: 980, priceVND: 23000000, box: [294, 422, 294, 432], fitScore: 100, recSize: 'ONE' },
    ],
  },
  {
    lookNumber: 18,
    title: 'Look 18 — Billow Blouse',
    subtitle: 'Blush billow sleeve silk blouse & pleated tie trousers',
    xRange: [476, 633],
    pieces: [
      { id: 'mv-18-1', name: 'Billow Sleeve Blouse', priceUSD: 860, priceVND: 20000000, box: [508, 688, 240, 452], fitScore: 94, recSize: 'M' },
      { id: 'mv-18-2', name: 'Tie Waist Chino Trousers', priceUSD: 740, priceVND: 17300000, box: [780, 890, 252, 466], fitScore: 98, recSize: 'L' },
    ],
  },
  {
    lookNumber: 19,
    title: 'Look 19 — Powder Coat',
    subtitle: 'Powder-blue cashmere long coat & ivory tailored trousers',
    xRange: [634, 767],
    pieces: [
      { id: 'mv-19-1', name: 'Powder Blue Long Coat', priceUSD: 1980, priceVND: 46500000, box: [64, 178, 484, 698], fitScore: 98, recSize: 'L' },
      { id: 'mv-19-2', name: 'Ivory Straight Trousers', priceUSD: 690, priceVND: 16200000, box: [316, 396, 482, 698], fitScore: 96, recSize: 'M' },
    ],
  },
  {
    lookNumber: 20,
    title: 'Look 20 — Sculpted Ruffle',
    subtitle: 'Architectural ivory ruffle top & pleated cascading maxi skirt',
    xRange: [767, 956],
    pieces: [
      { id: 'mv-20-1', name: 'Sculpted Ruffle Top', priceUSD: 1120, priceVND: 26300000, box: [530, 672, 508, 682], fitScore: 97, recSize: 'M' },
      { id: 'mv-20-2', name: 'Pleated Maxi Skirt', priceUSD: 1340, priceVND: 31400000, box: [754, 916, 484, 700], fitScore: 95, recSize: 'M' },
    ],
  },
];

const MODELS_SHEET_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png&w=3840&q=85';

const PRODUCTS_SHEET_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042057_080e85b0-b4aa-4072-8eb9-2304c7baf42b.png&w=2400&q=85';

// Depth stops table from UI/Maison Vell.docx
const DEPTH_STOPS = {
  KX: [1.2, 0.744, 0.496, 0.346, 0.235, 0.15, 0.085],
  KF: [1.14, 0.89, 0.777, 0.704, 0.651, 0.616, 0.59],
  KH: [1.18, 0.832, 0.574, 0.436, 0.334, 0.258, 0.19],
  KB: [0, 0, 1.5, 4, 8, 12, 17],
  KO: [1, 1, 1, 1, 0.86, 0.5, 0],
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getInterpolatedStop(d: number, arr: number[]) {
  const clamped = Math.max(-1, Math.min(5, d));
  const idx = clamped + 1;
  const base = Math.floor(idx);
  const frac = idx - base;
  if (base >= 6) return arr[6];
  return lerp(arr[base], arr[base + 1], frac);
}

export const MaisonVellRunwayHero: React.FC<MaisonVellRunwayHeroProps> = ({
  userBody,
  isAuthenticated,
  onOpenSignIn,
  onOpenVellStudio,
  onNavigateToScan,
  onAddToCart,
  onScrollToCatalog,
}) => {
  const [currentLookIdx, setCurrentLookIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [addedPieceId, setAddedPieceId] = useState<string | null>(null);

  // Auto-play catwalk rotation
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentLookIdx((prev) => (prev + 1) % RUNWAY_LOOKS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const currentLook = RUNWAY_LOOKS[currentLookIdx];

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentLookIdx((prev) => (prev + 1) % RUNWAY_LOOKS.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentLookIdx((prev) => (prev - 1 + RUNWAY_LOOKS.length) % RUNWAY_LOOKS.length);
  };

  const handleAddPiece = (piece: RunwayPiece) => {
    onAddToCart({
      id: piece.id,
      name: `${currentLook.title} · ${piece.name}`,
      price: piece.priceVND,
      size: piece.recSize,
    });
    setAddedPieceId(piece.id);
    setTimeout(() => setAddedPieceId(null), 2500);
  };

  return (
    <section
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#eaf1f8] via-[#f1f6fa] to-[#f8fafc] border-b-2 border-stone-200 select-none"
    >
      {/* ── TOP EDITORIAL ANNOUNCEMENT TICKER ── */}
      <div className="bg-stone-900 text-white py-2 px-4 flex items-center justify-between text-xs font-mono font-bold tracking-wider z-20 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-stone-300">SÀN DIỄN 3D CHUYỂN ĐỘNG · MAISON VELL SPRING/SUMMER 2027</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-stone-400 text-[11px]">
          <span>THUẬT TOÁN ĐO SIZE CHUẨN ISO 8559-1</span>
          <span>•</span>
          <span className="text-amber-300">TỰ ĐỘNG CHUYỂN LOOK CATWALK (4.2S)</span>
        </div>
      </div>

      {/* ── MAIN STAGE & PRODUCT RAIL CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[580px] md:min-h-[640px]">
        
        {/* Left/Center: Runway Catwalk Stage (8 Columns) */}
        <div className="lg:col-span-8 relative h-[420px] sm:h-[500px] md:h-[560px] flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-tr from-white/60 via-[#e7eff6]/70 to-[#f6f9fc]/90 border-2 border-stone-300 shadow-xl p-6 sm:p-8">
          
          {/* Header over the runway */}
          <div className="z-10 flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 text-white text-[11px] font-mono font-bold uppercase tracking-widest shadow-sm">
                <Sparkles size={12} className="text-amber-300" />
                <span>RUNWAY PERSPECTIVE 3D</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-stone-950 tracking-tight mt-2">
                {currentLook.title}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-md">
                {currentLook.subtitle}
              </p>
            </div>

            {/* Look Number Indicator */}
            <div className="text-right">
              <span className="font-serif text-3xl sm:text-5xl font-black text-stone-900 tracking-tighter block">
                N° {currentLook.lookNumber}
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                Look {currentLookIdx + 1} / 6
              </span>
            </div>
          </div>

          {/* Runway Perspective Receding Models */}
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-6 sm:pb-8">
            {RUNWAY_LOOKS.map((look, i) => {
              let rawDiff = i - currentLookIdx;
              while (rawDiff < -1) rawDiff += 6;
              while (rawDiff > 5) rawDiff -= 6;
              const d = rawDiff;

              const cx = getInterpolatedStop(d, DEPTH_STOPS.KX);
              const fy = getInterpolatedStop(d, DEPTH_STOPS.KF);
              const h = getInterpolatedStop(d, DEPTH_STOPS.KH);
              const blur = getInterpolatedStop(d, DEPTH_STOPS.KB);
              const opacity = getInterpolatedStop(d, DEPTH_STOPS.KO);
              const zIndex = 100 - Math.round(d * 10);

              if (opacity <= 0.02) return null;

              const [x0, x1] = look.xRange;
              const widthOnSheet = x1 - x0;
              const heightOnSheet = 496 - 48;

              return (
                <div
                  key={look.lookNumber}
                  style={{
                    left: `${cx * 100}%`,
                    bottom: `${(1 - fy) * 100}%`,
                    transform: `translate(-50%, 100%) scale(${h * 1.32})`,
                    filter: blur > 0.3 ? `blur(${blur}px)` : 'none',
                    opacity,
                    zIndex,
                  }}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentLookIdx(i);
                  }}
                  className="absolute pointer-events-auto cursor-pointer transition-all duration-700 ease-out origin-bottom group"
                >
                  <svg
                    viewBox={`0 0 ${widthOnSheet} ${heightOnSheet}`}
                    className="h-72 sm:h-88 md:h-[460px] drop-shadow-2xl overflow-visible transition-transform duration-300 group-hover:scale-105"
                  >
                    <image
                      href={MODELS_SHEET_URL}
                      x={-x0}
                      y={-48}
                      width={960}
                      height={540}
                      preserveAspectRatio="none"
                    />
                  </svg>

                  {d === 0 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-stone-950 text-white text-[10px] font-mono font-black shadow-xl border border-white/20 animate-pulse whitespace-nowrap">
                      ★ ACTIVE CATWALK
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Runway Controls */}
          <div className="z-10 flex items-center justify-between pt-4 border-t border-stone-300/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-stone-900 hover:bg-black text-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Look trước"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-stone-900 hover:bg-black text-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Look tiếp theo"
              >
                <ChevronRight size={20} />
              </button>
              <span className="text-xs font-mono font-bold text-stone-700 ml-2">
                Bấm nút hoặc chọn người mẫu để đổi look
              </span>
            </div>

            {/* Quick action to open VELL 3D Studio */}
            <button
              type="button"
              onClick={onOpenVellStudio}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Thử Đồ Ảo (VELL 3D Studio Wipe)</span>
            </button>
          </div>

        </div>

        {/* Right: Synchronized Product Rail & Guest CTA Card (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Active Look Products Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400 block">
                  ĐỒNG PHỤC SÀN CATWALK
                </span>
                <h3 className="text-base font-black text-stone-950 font-sans">
                  Sản Phẩm Trong Look {currentLook.lookNumber}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-black border border-emerald-300">
                Fit 98%
              </span>
            </div>

            {/* Pieces list */}
            <div className="space-y-3">
              {currentLook.pieces.map((piece) => {
                const [px0, px1, py0, py1] = piece.box;
                const pWidth = px1 - px0;
                const pHeight = py1 - py0;
                const isAdded = addedPieceId === piece.id;

                return (
                  <div
                    key={piece.id}
                    className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-white border border-stone-300 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                      <svg
                        viewBox={`0 0 ${pWidth} ${pHeight}`}
                        className="w-full h-full object-contain"
                      >
                        <image
                          href={PRODUCTS_SHEET_URL}
                          x={-px0}
                          y={-py0}
                          width={960}
                          height={720}
                          preserveAspectRatio="none"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-950 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {piece.name}
                      </h4>
                      <p className="text-xs font-black text-stone-900 font-mono mt-0.5">
                        {piece.priceVND.toLocaleString('vi-VN')} ₫
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-600 font-medium">
                        <span>Gợi ý: Size <strong className="text-stone-900">{piece.recSize}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddPiece(piece)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                        isAdded
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-stone-900 hover:bg-black text-white shadow-xs'
                      }`}
                      title="Thêm vào giỏ"
                    >
                      {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Whole Look button */}
            <button
              type="button"
              onClick={() => {
                currentLook.pieces.forEach((p) => handleAddPiece(p));
              }}
              className="w-full py-3 px-4 rounded-xl bg-stone-950 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 active:scale-95"
            >
              <Sparkles size={14} className="text-yellow-400" />
              <span>Thêm Trọn Bộ Outfit Look {currentLook.lookNumber} (−10%)</span>
            </button>
          </div>

          {/* Guest Onboarding High-Contrast Value Proposition */}
          {!isAuthenticated ? (
            <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-stone-950 text-white rounded-3xl p-6 shadow-xl space-y-3.5 border-2 border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">
                    Bạn Chưa Đăng Nhập
                  </h4>
                  <p className="text-[11px] text-blue-200">
                    Kích hoạt thuật toán đo size 3D tự động
                  </p>
                </div>
              </div>

              <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
                Đăng nhập để tự động lưu số đo 13 điểm chuẩn ISO 8559 và xem độ vừa vặn từng centimet của mọi trang phục.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-102"
                >
                  <LogIn size={14} className="text-blue-600" />
                  <span>Đăng Nhập</span>
                </button>
                <button
                  type="button"
                  onClick={onNavigateToScan}
                  className="py-2.5 px-3 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Camera size={14} />
                  <span>Quét Vóc Dáng</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged-In User Biometrics Card */
            <div className="bg-white rounded-3xl p-6 border-2 border-stone-800 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-stone-500">
                  HỒ SƠ CỦA BẠN
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  ISO 8559 ACTIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">Chiều cao • Cân nặng</span>
                  <span className="font-bold text-stone-900">{userBody.height_cm}cm • {userBody.weight_kg}kg</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">Vòng ngực • Vòng eo</span>
                  <span className="font-bold text-blue-700">{userBody.chest_cm}cm • {userBody.waist_cm}cm</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onScrollToCatalog}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Xem Sản Phẩm May Đo Tương Ứng</span>
                <ArrowDown size={14} />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Down arrow link to full product catalog */}
      <div className="pb-6 text-center">
        <button
          type="button"
          onClick={onScrollToCatalog}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 border-2 border-stone-800 text-stone-950 text-xs font-black shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <span>Khám Phá Toàn Bộ Sàn Thời Trang (Catalog 4 Cột)</span>
          <ArrowDown size={14} className="animate-bounce" />
        </button>
      </div>

    </section>
  );
};
