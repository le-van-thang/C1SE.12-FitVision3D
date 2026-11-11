import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import type { CartItem } from './types';

interface SmartCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
}

export const SmartCartDrawer: React.FC<SmartCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
    0
  );

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
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-base">Giỏ Hàng Thông Minh</h3>
                <p className="text-xs text-stone-500">{items.length} sản phẩm vừa vặn số đo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <ShoppingBag size={28} />
                </div>
                <h4 className="font-medium text-stone-800 text-sm">Giỏ hàng của bạn đang trống</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Hãy chọn những bộ trang phục thời thượng và để AI ướm thử độ vừa vặn cho bạn!
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <span>Khám phá bộ sưu tập ngay</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-sm flex gap-3.5"
                >
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-lg border border-stone-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                          {item.product.brand_name}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-0.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h5 className="text-xs font-medium text-stone-900 line-clamp-1 mt-0.5">
                        {item.product.name}
                      </h5>

                      {/* Size & AI Badge */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                          Size: {item.variant.size_label}
                        </span>
                        {item.is_ai_recommended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Sparkles size={10} />
                            <span>Vừa vặn {item.fit_score}%</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-xs text-stone-600 hover:bg-stone-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs text-stone-600 hover:bg-stone-200"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-semibold text-sm text-stone-900">
                        {((item.product.sale_price || item.product.price) * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-stone-50/50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Tạm tính ({items.length} món):</span>
                  <span>{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Phí giao hàng toàn quốc:</span>
                  <span className="text-emerald-700 font-medium">Miễn phí (Ưu đãi Capstone)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Tổng thanh toán:</span>
                  <span className="text-base text-blue-700">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Tiến Hành Đặt Hàng Ngay</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Bảo hiểm vừa vặn 100% đổi trả tận nhà miễn phí</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

