import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Truck, RotateCcw } from 'lucide-react';
import type { CartItem } from './types';
import { useI18n } from '@/i18n';

interface SmartCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  selectedIds?: string[];
  onToggleSelectItem?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onChangeVariant?: (id: string, variantId: string) => void;
  onClearCart?: () => void;
  onCheckout: () => void;
}

const FREESHIP_THRESHOLD = 1000000;

export const SmartCartDrawer: React.FC<SmartCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  selectedIds,
  onToggleSelectItem,
  onToggleSelectAll,
  onRemoveItem,
  onUpdateQuantity,
  onChangeVariant,
  onClearCart,
  onCheckout,
}) => {
  const { t, locale } = useI18n();

  if (!isOpen) return null;

  const isEn = locale === 'en';
  const activeSelectedIds = selectedIds ?? items.map((i) => i.id);
  const selectedItems = items.filter((i) => activeSelectedIds.includes(i.id));
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
    0
  );
  const totalQty = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const remainingForFreeship = Math.max(0, FREESHIP_THRESHOLD - totalAmount);
  const freeshipProgress = Math.min(100, Math.round((totalAmount / FREESHIP_THRESHOLD) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Editorial Dark Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14171C] text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag size={17} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {t('ecommerce.drawer.cartTitle', 'Giỏ Hàng Thông Minh')}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {t('ecommerce.drawer.cartItemsCount', '{count} sản phẩm vừa vặn số đo').replace('{count}', String(totalQty))}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X size={17} />
            </button>
          </div>

          {/* Freeship Milestone Progress Bar */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-[#FBF5E9] border-b border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Truck size={14} className={remainingForFreeship === 0 ? 'text-emerald-600' : 'text-amber-600'} />
                  <span>
                    {remainingForFreeship === 0
                      ? (isEn ? 'Unlocked Free Express 3D Shipping!' : 'Đã mở khóa Freeship Hỏa Tốc Toàn Quốc!')
                      : (isEn
                          ? `Add ${remainingForFreeship.toLocaleString('vi-VN')} ₫ for Free Express Delivery`
                          : `Mua thêm ${remainingForFreeship.toLocaleString('vi-VN')} ₫ để nhận Freeship Hỏa Tốc`)}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-800">{freeshipProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-amber-200/70 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingForFreeship === 0 ? 'bg-emerald-500' : 'bg-[#C8963E]'
                  }`}
                  style={{ width: `${freeshipProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleSelectAll?.()}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    {isEn
                      ? `Select all (${selectedItems.length}/${items.length})`
                      : `Chọn tất cả (${selectedItems.length}/${items.length})`}
                  </span>
                </label>
                {onClearCart && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    {isEn ? 'Clear all' : 'Xóa tất cả'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#FAFAFB]">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3 bg-white rounded-2xl border border-slate-200 p-6">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag size={26} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {t('ecommerce.drawer.cartEmpty', 'Giỏ hàng của bạn đang trống')}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {t('ecommerce.drawer.cartEmptyDesc', 'Hãy chọn những bộ trang phục thời thượng và để AI ướm thử độ vừa vặn cho bạn!')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14171C] text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <span>{t('ecommerce.drawer.cartExploreNow', 'Khám phá bộ sưu tập ngay')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isSelected = activeSelectedIds.includes(item.id);
                return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border bg-white shadow-2xs flex gap-3 transition-opacity ${
                    isSelected ? 'border-slate-200' : 'border-slate-200/60 opacity-70'
                  }`}
                >
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectItem?.(item.id)}
                      aria-label={`Select ${item.product.name}`}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover object-top rounded-xl border border-slate-200/80 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          {item.product.brand_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                          title={isEn ? 'Remove item' : 'Xóa sản phẩm'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                        {isEn && item.product.name_en ? item.product.name_en : item.product.name}
                      </h5>

                      {/* Inline Variant / Size Switcher + Bespoke / AI Badge */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.product.is_bespoke ? (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            ✂️ May Đo Bespoke · 13 số đo 3D
                          </span>
                        ) : onChangeVariant && item.product.variants.length > 1 ? (
                          <select
                            value={item.variant.id}
                            onChange={(e) => onChangeVariant(item.id, e.target.value)}
                            aria-label="Select size"
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200/70 text-slate-900 border border-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            {item.product.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {`${t('ecommerce.drawer.sizePrefix', 'Size')} ${v.size_label} · ${v.color_name.split('(')[0].trim()}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {t('ecommerce.drawer.sizePrefix', 'Cỡ')}: {item.variant.size_label}
                          </span>
                        )}

                        {!item.product.is_bespoke && item.is_ai_recommended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Sparkles size={10} />
                            <span>
                              {t('ecommerce.drawer.fitMatchBadge', 'Vừa vặn {score}%').replace('{score}', String(item.fit_score))}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-mono font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-950">
                          {((item.product.sale_price || item.product.price) * item.quantity).toLocaleString('vi-VN')} ₫
                        </span>
                        {item.product.sale_price && (
                          <span className="block text-[10px] text-slate-400 line-through">
                            {(item.product.price * item.quantity).toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
                );
              })
            )}
          </div>

          {/* Sticky Footer Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-white space-y-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>{t('ecommerce.drawer.subtotal', 'Tạm tính ({count} món):').replace('{count}', String(totalQty))}</span>
                  <span className="font-semibold text-slate-800">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{t('ecommerce.drawer.shipping', 'Phí giao hàng toàn quốc:')}</span>
                  <span className="text-emerald-700 font-bold">
                    {remainingForFreeship === 0
                      ? t('ecommerce.drawer.free', 'Miễn phí (Ưu đãi FitVision)')
                      : (isEn ? 'Standard 0 ₫ (ISO Bonus)' : '0 ₫ (Ưu đãi ISO 8559)')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>{t('ecommerce.drawer.totalAmount', 'Tổng thanh toán:')}</span>
                  <span className="text-base text-rose-600">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <button
                type="button"
                disabled={selectedItems.length === 0}
                onClick={onCheckout}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  selectedItems.length > 0
                    ? 'bg-[#14171C] hover:bg-blue-600 active:scale-[0.98] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {selectedItems.length > 0
                    ? `${t('ecommerce.drawer.checkout', 'Tiến Hành Đặt Hàng Ngay')} (${selectedItems.length})`
                    : isEn
                      ? 'Select at least 1 item'
                      : 'Vui lòng chọn ít nhất 1 sản phẩm'}
                </span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>{t('ecommerce.drawer.checkoutProtected', 'Bảo hiểm vừa vặn 100%')}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <RotateCcw size={12} className="text-blue-600" />
                  <span>{isEn ? '14-day swap' : 'Đổi size 14 ngày'}</span>
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

