import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Check, ArrowRight, Eye } from 'lucide-react';
import { UserBodyProfile } from './types';

interface MaisonVellRunwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  onAddToCart: (piece: { id: string; name: string; price: number; size: string }) => void;
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
// Values for d from -1 to 5
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
  // d in range [-1, 5]
  const clamped = Math.max(-1, Math.min(5, d));
  const idx = clamped + 1; // maps -1..5 to 0..6
  const base = Math.floor(idx);
  const frac = idx - base;
  if (base >= 6) return arr[6];
  return lerp(arr[base], arr[base + 1], frac);
}

export const MaisonVellRunwayModal: React.FC<MaisonVellRunwayModalProps> = ({
  isOpen,
  onClose,
  userBody,
  onAddToCart,
}) => {
  const [currentLookIdx, setCurrentLookIdx] = useState(0);
  const [addedPieceId, setAddedPieceId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentLook = RUNWAY_LOOKS[currentLookIdx];

  const handleNext = () => {
    setCurrentLookIdx((prev) => (prev + 1) % RUNWAY_LOOKS.length);
  };

  const handlePrev = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-7xl max-h-[96vh] bg-[#f8fafc] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200">
        
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-stone-200 bg-white flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-serif text-base font-bold shadow-sm">
              V
            </div>
            <div>
              <span className="font-mono text-xs font-black uppercase tracking-widest text-stone-900">
                MAISON VELL
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-stone-400 font-medium">
                Runway Depth Perspective Lookbook
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Body Fit Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Vóc dáng: {userBody.height_cm}cm • {userBody.weight_kg}kg (Ngực {userBody.chest_cm}cm)</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Stage & Product Rail Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
          
          {/* Left/Center: Runway Depth Stage (8 cols) */}
          <div
            className="lg:col-span-8 relative overflow-hidden bg-gradient-to-b from-[#eef4f9] to-[#f8fafc] flex flex-col justify-between p-6 select-none"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX !== null) {
                const diff = e.changedTouches[0].clientX - touchStartX;
                if (diff > 50) handlePrev();
                if (diff < -50) handleNext();
                setTouchStartX(null);
              }
            }}
          >
            {/* Stage Title */}
            <div className="z-10">
              <span className="text-[11px] uppercase tracking-widest font-mono text-stone-500 font-bold">
                SPRING / SUMMER 2027 COUTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 mt-1">
                {currentLook.title}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mt-1">
                {currentLook.subtitle}
              </p>
            </div>

            {/* Models Runway Scene (Z-space depth perspective) */}
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-12 sm:pb-8">
              {RUNWAY_LOOKS.map((look, i) => {
                // Compute relative distance from current active look
                let rawDiff = i - currentLookIdx;
                // Wrap around 6 looks
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
                const heightOnSheet = 496 - 48; // 448

                return (
                  <div
                    key={look.lookNumber}
                    style={{
                      left: `${cx * 100}%`,
                      bottom: `${(1 - fy) * 100}%`,
                      transform: `translate(-50%, 100%) scale(${h * 1.35})`,
                      filter: blur > 0.3 ? `blur(${blur}px)` : 'none',
                      opacity,
                      zIndex,
                    }}
                    onClick={() => setCurrentLookIdx(i)}
                    className="absolute pointer-events-auto cursor-pointer transition-all duration-700 ease-out origin-bottom group"
                  >
                    <svg
                      viewBox={`0 0 ${widthOnSheet} ${heightOnSheet}`}
                      className="h-80 sm:h-96 md:h-[480px] drop-shadow-xl overflow-visible transition-transform duration-300 group-hover:scale-105"
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

                    {/* Active Look Focus Dot */}
                    {d === 0 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-mono font-bold shadow-lg animate-pulse whitespace-nowrap">
                        ACTIVE LOOK
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls & Navigation */}
            <div className="z-10 flex items-center justify-between pt-4 border-t border-stone-200/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-white hover:bg-stone-100 text-stone-800 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 border border-stone-200"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-white hover:bg-stone-100 text-stone-800 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 border border-stone-200"
                >
                  <ChevronRight size={20} />
                </button>
                <span className="text-xs font-mono font-bold text-stone-500 ml-2">
                  Kéo hoặc bấm để chuyển sàn diễn ({currentLookIdx + 1}/6)
                </span>
              </div>

              {/* Big Look Number Display */}
              <div className="text-right">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tighter">
                  N° {currentLook.lookNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Synchronized Product Rail (4 cols) */}
          <div className="lg:col-span-4 bg-white border-l border-stone-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-stone-400">
                  PIECES IN THIS LOOK
                </h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Fit Match 3D
                </span>
              </div>

              <div className="space-y-4">
                {currentLook.pieces.map((piece) => {
                  const [px0, px1, py0, py1] = piece.box;
                  const pWidth = px1 - px0;
                  const pHeight = py1 - py0;
                  const isAdded = addedPieceId === piece.id;

                  return (
                    <div
                      key={piece.id}
                      className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 transition-all flex gap-4 items-center group"
                    >
                      {/* Product SVG crop from 960x720 sheet */}
                      <div className="w-20 h-20 rounded-xl bg-white border border-stone-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
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

                      {/* Info & Fit */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {piece.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-stone-950 font-mono">
                            {piece.priceVND.toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            (${piece.priceUSD})
                          </span>
                        </div>

                        {/* AI Fit Match Pill */}
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black font-mono text-[10px]">
                            {piece.fitScore}%
                          </span>
                          <span className="text-stone-600 font-medium">
                            Gợi ý: Size <strong className="text-stone-900">{piece.recSize}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddPiece(piece)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white hover:bg-stone-900 hover:text-white text-stone-700 border border-stone-200 shadow-xs'
                        }`}
                        title="Thêm vào giỏ hàng"
                      >
                        {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bespoke Fit Notes */}
              <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Dự Đoán Số Đo May Đo Bespoke</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                  Trang phục Maison Vell được tính toán độ rũ và cử động tự nhiên (Ease Allowance +4.5cm). Với vòng ngực {userBody.chest_cm}cm và eo {userBody.waist_cm}cm, bạn sẽ mặc vừa chuẩn phom couture như người mẫu trên sàn catwalk.
                </p>
              </div>
            </div>

            {/* Quick Add Whole Look CTA */}
            <div className="pt-4 mt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  currentLook.pieces.forEach((p) => handleAddPiece(p));
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-95"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Thêm Trọn Bộ Outfit Look {currentLook.lookNumber} (−10%)</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

