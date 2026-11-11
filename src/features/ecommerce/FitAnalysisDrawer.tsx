import React from 'react';
import { X, CheckCircle2, Sparkles, AlertCircle, Ruler, ChevronRight } from 'lucide-react';
import type { FashionProduct, UserBodyProfile, FitMatchResult, ProductVariant } from './types';

interface FitAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: FashionProduct | null;
  selectedVariant: ProductVariant | null;
  userBody: UserBodyProfile;
  fitResult: FitMatchResult | null;
  onSelectSize: (variant: ProductVariant) => void;
  onAddToCart: () => void;
}

export const FitAnalysisDrawer: React.FC<FitAnalysisDrawerProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariant,
  userBody,
  fitResult,
  onSelectSize,
  onAddToCart,
}) => {
  if (!isOpen || !product || !selectedVariant || !fitResult) return null;

  const spec = selectedVariant.spec;
  const isPants = product.category === 'pants';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-base">Đối Chiếu Độ Vừa Vặn 3D</h3>
                <p className="text-xs text-stone-500">Chuẩn nhân trắc học may mặc ISO 8559-1</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Product Summary */}
            <div className="flex gap-3.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-20 object-cover rounded-lg border border-stone-200 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  {product.brand_name}
                </span>
                <h4 className="text-sm font-medium text-stone-900 line-clamp-1">{product.name}</h4>
                <p className="text-xs text-stone-500 mt-0.5">{product.fabric_material}</p>
                <p className="text-sm font-semibold text-stone-900 mt-1">
                  {product.price.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>

            {/* Match Score Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="font-semibold text-emerald-800 text-sm">
                    {fitResult.verdict_label_vi}
                  </span>
                </div>
                <span className="font-mono text-xl font-bold text-emerald-700">
                  {fitResult.match_percentage}%
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {fitResult.advisor_advice_vi}
              </p>
            </div>

            {/* Size Selector in Drawer */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                Chọn kích cỡ đối chiếu:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {product.variants.map((v) => {
                  const isSelected = v.size_label === selectedVariant.size_label;
                  const isRecommended = v.size_label === fitResult.recommended_size;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelectSize(v)}
                      className={`relative py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {v.size_label}
                      {isRecommended && (
                        <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-full">
                          AI
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Delta Metrics Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center justify-between">
                <span>So Sánh Chi Tiết Chỉ Số (cm)</span>
                <span className="text-[10px] text-stone-400 font-normal">Cơ thể vs Áo thực tế</span>
              </h4>

              {!isPants && (
                <>
                  {/* Chest */}
                  <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-stone-900 block">Vòng ngực (Bust/Chest)</span>
                      <span className="text-[11px] text-stone-500">
                        Cơ thể: <b className="font-mono text-stone-800">{userBody.chest_cm}cm</b> ➔ Áo:{' '}
                        <b className="font-mono text-stone-800">{spec.chest_cm}cm</b>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        +{spec.chest_cm - userBody.chest_cm} cm
                      </span>
                      <span className="block text-[10px] text-stone-400 mt-0.5">Độ cử động êm</span>
                    </div>
                  </div>

                  {/* Shoulder */}
                  <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-stone-900 block">Rộng vai (Shoulder)</span>
                      <span className="text-[11px] text-stone-500">
                        Cơ thể: <b className="font-mono text-stone-800">{userBody.shoulder_cm}cm</b> ➔ Áo:{' '}
                        <b className="font-mono text-stone-800">{spec.shoulder_cm}cm</b>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                        +{(spec.shoulder_cm - userBody.shoulder_cm).toFixed(1)} cm
                      </span>
                      <span className="block text-[10px] text-stone-400 mt-0.5">Vừa khít cầu vai</span>
                    </div>
                  </div>
                </>
              )}

              {/* Waist */}
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-stone-900 block">Vòng eo (Waist)</span>
                  <span className="text-[11px] text-stone-500">
                    Cơ thể: <b className="font-mono text-stone-800">{userBody.waist_cm}cm</b> ➔ Phom:{' '}
                    <b className="font-mono text-stone-800">{spec.waist_cm}cm</b>
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    +{spec.waist_cm - userBody.waist_cm} cm
                  </span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">Thoải mái khi ngồi</span>
                </div>
              </div>

              {/* Garment Length */}
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-stone-900 block">Chiều dài trang phục</span>
                  <span className="text-[11px] text-stone-500">Chuẩn may đo thiết kế</span>
                </div>
                <span className="font-mono font-bold text-stone-800 text-xs">
                  {spec.length_cm} cm
                </span>
              </div>
            </div>

            {/* Zero Return Guarantee Badge */}
            <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
              <Ruler size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Cam kết FitVision 3D:</strong> Dữ liệu đã hiệu chuẩn theo thước đo Ramanujan ISO 8559-1. Đảm bảo vừa vặn trên 97% hoặc miễn phí đổi size tận nhà.
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-stone-200 bg-white space-y-2">
            <button
              onClick={() => {
                onAddToCart();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Thêm Size {selectedVariant.size_label} Vào Giỏ Hàng</span>
              <ChevronRight size={16} />
            </button>
            <p className="text-[11px] text-center text-stone-400">
              Được bảo chứng bởi thuật toán AI Sizing Engine v2.5
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

