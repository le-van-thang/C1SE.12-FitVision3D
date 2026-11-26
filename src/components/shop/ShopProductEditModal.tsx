import React, { useEffect, useState } from 'react';
import {
  X,
  Save,
  Upload,
  Palette,
  Video,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { commerceApi, type DbProduct } from '@/services/commerceApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';
import {
  addCustomColorWithoutToggle,
  compressImageToDataUrl,
  isValidProductVideoUrl,
  isValidShopImageUrl,
  parseStockDraft,
  sanitizeStockInput,
} from './settings/shopSettingsHelpers';

const ALL_SIZES: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const QUICK_COLORS: { name: string; hex: string }[] = [
  { name: 'Đen Tuyền', hex: '#14171C' },
  { name: 'Trắng Tinh', hex: '#FFFFFF' },
  { name: 'Trắng Kem', hex: '#F3F4F6' },
  { name: 'Be Sữa', hex: '#E6D5B8' },
  { name: 'Xám Nhạt', hex: '#CBD5E1' },
  { name: 'Xám Khói', hex: '#64748B' },
  { name: 'Xanh Navy', hex: '#1E3A8A' },
  { name: 'Xanh Da Trời', hex: '#60A5FA' },
  { name: 'Xanh Rêu', hex: '#3F6212' },
  { name: 'Nâu Bò', hex: '#92400E' },
  { name: 'Đỏ Đô', hex: '#881337' },
  { name: 'Hồng Phấn', hex: '#F9A8D4' },
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

interface ShopProductEditModalProps {
  product: DbProduct | null;
  onClose: () => void;
  onUpdated: (updated: DbProduct) => void;
}

export const ShopProductEditModal: React.FC<ShopProductEditModalProps> = ({
  product,
  onClose,
  onUpdated,
}) => {
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'shirt' | 'polo' | 'pants' | 'dress' | 'tailored'>('shirt');
  const [genderTarget, setGenderTarget] = useState<'male' | 'female' | 'unisex'>('male');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [fabricMaterial, setFabricMaterial] = useState('');
  const [stretchType, setStretchType] = useState('Co giãn nhẹ (2-3%)');
  const [isBespoke, setIsBespoke] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [description, setDescription] = useState('');
  const [primaryImage, setPrimaryImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[]>(['S', 'M', 'L', 'XL']);
  const [sizeStockMap, setSizeStockMap] = useState<Record<string, string>>({
    XS: '10',
    S: '20',
    M: '30',
    L: '30',
    XL: '20',
    XXL: '10',
  });
  const [colorVariants, setColorVariants] = useState<{ colorName: string; colorHex: string; imageUrl: string }[]>([]);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customHex, setCustomHex] = useState('#1E3A8A');
  const [customName, setCustomName] = useState('Xanh Navy');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name || '');
    setCategory((product.category as any) || 'shirt');
    setGenderTarget((product.gender_target as any) || 'male');
    setPrice(String(product.price || ''));
    setSalePrice(product.sale_price ? String(product.sale_price) : '');
    setFabricMaterial(product.fabric_material || '');
    setStretchType(product.stretch_type || 'Co giãn nhẹ (2-3%)');
    setIsBespoke(Boolean(product.is_bespoke));
    setIsHidden(Boolean(product.is_hidden));
    setDescription(product.description || '');
    setPrimaryImage(product.image_url || '');
    setVideoUrl(product.video_url || '');

    const variants = product.variants || [];
    const sizes = Array.from(
      new Set(
        variants
          .map((v) => v.size_label)
          .filter((s): s is 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' => ALL_SIZES.includes(s as any))
      )
    );
    setSelectedSizes(sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL']);

    const nextStock: Record<string, string> = { XS: '10', S: '20', M: '30', L: '30', XL: '20', XXL: '10' };
    const seenSizes = new Set<string>();
    for (const v of variants) {
      if (v.size_label && typeof v.stock === 'number' && !seenSizes.has(v.size_label)) {
        nextStock[v.size_label] = String(Math.max(0, Math.min(999, Math.trunc(v.stock))));
        seenSizes.add(v.size_label);
      }
    }
    setSizeStockMap(nextStock);

    const uniqueColors = Array.from(
      new Map(
        variants.map((v) => [
          `${(v.color_hex || '#14171C').toLowerCase()}|${(v.color_name || '').toLowerCase()}`,
          {
            colorName: v.color_name || t('shopPortal.defaultColorName'),
            colorHex: v.color_hex || '#14171C',
            imageUrl:
              (v as any).image_url && (v as any).image_url !== product.image_url
                ? (v as any).image_url
                : '',
          },
        ])
      ).values()
    );
    setColorVariants(
      uniqueColors.length > 0
        ? uniqueColors
        : [{ colorName: 'Trắng Kem', colorHex: '#F3F4F6', imageUrl: '' }]
    );
  }, [product]);

  if (!product) return null;

  const handleToggleSize = (sz: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    setSelectedSizes((prev) => {
      if (prev.includes(sz)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== sz);
      }
      return [...prev, sz].sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b));
    });
  };

  const handleToggleColor = (preset: { name: string; hex: string }) => {
    setColorVariants((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.colorHex.toLowerCase() === preset.hex.toLowerCase() ||
          c.colorName.toLowerCase() === preset.name.toLowerCase()
      );
      if (idx >= 0) {
        if (prev.length === 1) return prev;
        return prev.filter((_, i) => i !== idx);
      }
      if (prev.length >= 6) {
        showGlobalToast({ type: 'warning', title: t('shopPortal.maxColorsToast'), message: '' });
        return prev;
      }
      return [...prev, { colorName: preset.name, colorHex: preset.hex, imageUrl: '' }];
    });
  };

  const handleFileToDataUrl = async (file: File, onLoaded: (url: string) => void) => {
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      showGlobalToast({
        type: 'error',
        title: t('shopPortal.invalidImageTitle'),
        message: 'JPG / PNG / WebP',
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES * 2.5) {
      showGlobalToast({
        type: 'warning',
        title: t('shopPortal.invalidImageTitle'),
        message: t('shopPortal.invalidImageUrlMsg'),
      });
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 960, 960, 0.8);
      if (!isValidShopImageUrl(compressed)) {
        showGlobalToast({
          type: 'warning',
          title: t('shopPortal.invalidImageTitle'),
          message: t('shopPortal.invalidImageUrlMsg'),
        });
        return;
      }
      onLoaded(compressed);
    } catch {
      showGlobalToast({
        type: 'error',
        title: t('shopPortal.invalidImageTitle'),
        message: t('shopPortal.imageCompressError'),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericSale = salePrice.trim() ? Number(salePrice) : null;

    if (cleanName.length < 3) {
      showGlobalToast({
        type: 'warning',
        title: t('shopPortal.productNameShortTitle'),
        message: t('shopPortal.productNameShortMsg'),
      });
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 1000) {
      showGlobalToast({
        type: 'warning',
        title: t('shopPortal.invalidPriceTitle'),
        message: t('shopPortal.invalidPriceMsg'),
      });
      return;
    }
    if (numericSale !== null && (!Number.isFinite(numericSale) || numericSale < 1000 || numericSale >= numericPrice)) {
      showGlobalToast({
        type: 'warning',
        title: t('shopPortal.invalidSalePriceTitle'),
        message: t('shopPortal.invalidSalePriceMsg'),
      });
      return;
    }

    const resolvedPrimary = primaryImage.trim() || product.image_url;
    if (!isValidShopImageUrl(resolvedPrimary)) {
      showGlobalToast({
        type: 'error',
        title: t('shopPortal.invalidImageTitle'),
        message: t('shopPortal.invalidImageUrlMsg'),
      });
      return;
    }
    const cleanVideo = videoUrl.trim();
    if (cleanVideo && !isValidProductVideoUrl(cleanVideo)) {
      showGlobalToast({
        type: 'error',
        title: t('shopPortal.invalidImageTitle'),
        message: t('shopPortal.invalidVideoUrlMsg'),
      });
      return;
    }
    const cleanColors = colorVariants.map((c) => ({
      colorName: c.colorName.trim() || t('shopPortal.defaultColorName'),
      colorHex: c.colorHex,
      imageUrl: c.imageUrl.trim() || resolvedPrimary,
    }));
    for (const c of cleanColors) {
      if (!isValidShopImageUrl(c.imageUrl)) {
        showGlobalToast({
          type: 'error',
          title: t('shopPortal.invalidImageTitle'),
          message: t('shopPortal.invalidImageUrlMsg'),
        });
        return;
      }
    }

    const numericStockMap: Record<string, number> = {};
    for (const sz of selectedSizes) {
      numericStockMap[sz] = parseStockDraft(sizeStockMap[sz], 0);
    }

    setIsSaving(true);
    const res = await commerceApi.updateShopProduct(product.id, {
      name: cleanName,
      category,
      genderTarget,
      price: numericPrice,
      salePrice: numericSale,
      isBespoke,
      isHidden,
      fabricMaterial: fabricMaterial.trim(),
      stretchType,
      imageUrl: resolvedPrimary,
      videoUrl: cleanVideo || null,
      description: description.trim(),
      colorVariants: cleanColors,
      sizes: selectedSizes,
      stockMap: numericStockMap,
    });
    setIsSaving(false);

    if (res.success && res.data) {
      onUpdated(res.data);
      showGlobalToast({
        type: 'success',
        title: t('shopPortal.productUpdatedTitle'),
        message: res.data.name,
      });
      onClose();
    } else {
      showGlobalToast({
        type: 'error',
        title: t('shopPortal.productUpdateFailedTitle'),
        message: res.error?.message || t('shopPortal.productUpdateFailedMsg'),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950 truncate">
              {t('shopPortal.editModalTitle')}
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">ID: {product.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHidden((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isHidden
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
              {isHidden ? t('shopPortal.productHide') : t('shopPortal.statusActive')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                {t('shopPortal.fieldProductName')}
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                {t('shopPortal.fieldCategory')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
              >
                <option value="shirt">{t('shopPortal.sizeCatShirt')}</option>
                <option value="polo">{t('shopPortal.sizeCatPolo')}</option>
                <option value="pants">{t('shopPortal.sizeCatPants')}</option>
                <option value="dress">{t('shopPortal.sizeCatDress')}</option>
                <option value="tailored">{t('shopPortal.sizeCatTailored')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                {t('shopPortal.fieldGender')}
              </label>
              <select
                value={genderTarget}
                onChange={(e) => setGenderTarget(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
              >
                <option value="male">{t('shopPortal.genderMale')}</option>
                <option value="female">{t('shopPortal.genderFemale')}</option>
                <option value="unisex">{t('shopPortal.genderUnisex')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                {t('shopPortal.fieldBasePrice')}
              </label>
              <input
                required
                type="number"
                min={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-950 outline-none focus:border-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                {t('shopPortal.fieldFinalPrice')}
              </label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder={t('shopPortal.optionalSalePlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-950 outline-none focus:border-slate-950"
              />
            </div>
          </div>

          {/* Main Image & Fabric */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <label className="relative w-16 h-20 rounded-xl overflow-hidden border border-slate-300 cursor-pointer shrink-0 group">
                <img src={primaryImage || product.image_url} alt={name} className="w-full h-full object-cover" />
                <span className="absolute inset-x-0.5 bottom-0.5 py-0.5 rounded bg-black/75 text-white text-[8px] font-bold text-center">
                  {t('shopPortal.changeImageBtn')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileToDataUrl(f, setPrimaryImage);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-bold text-slate-900">{t('shopPortal.mainImageLabel')}</p>
                <input
                  value={primaryImage.startsWith('data:image') ? '' : primaryImage}
                  onChange={(e) => setPrimaryImage(e.target.value)}
                  placeholder={primaryImage.startsWith('data:image') ? '✓ Local photo' : t('shopPortal.pasteImageUrl')}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] outline-none focus:border-slate-950"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  {t('shopPortal.fabricLabel')}
                </label>
                <input
                  value={fabricMaterial}
                  onChange={(e) => setFabricMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-950 outline-none focus:border-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                  <Video size={12} /> Video URL
                </label>
                <input
                  value={videoUrl.startsWith('data:video') ? '' : videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-950 outline-none focus:border-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Sizes & Stock */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-900">{t('shopPortal.sizesLabel')}</label>
              <div className="inline-flex items-center gap-1">
                <span className="text-[10px] text-slate-500">{t('shopPortal.stockApplyAllLabel')}</span>
                {[0, 10, 20, 50].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() =>
                      setSizeStockMap((prev) => {
                        const next = { ...prev };
                        selectedSizes.forEach((sz) => {
                          next[sz] = String(qty);
                        });
                        return next;
                      })
                    }
                    className="px-2 py-0.5 rounded bg-white hover:bg-[#14171C] hover:text-white border border-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_SIZES.map((sz) => {
                const active = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleToggleSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                      active
                        ? 'bg-[#14171C] text-white border-[#14171C]'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedSizes.map((sz) => (
                <label
                  key={sz}
                  className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300"
                >
                  <span className="text-[11px] font-mono font-black text-slate-900">Size {sz}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={sizeStockMap[sz] ?? ''}
                      onChange={(e) =>
                        setSizeStockMap((prev) => ({
                          ...prev,
                          [sz]: sanitizeStockInput(e.target.value),
                        }))
                      }
                      onBlur={() =>
                        setSizeStockMap((prev) => ({
                          ...prev,
                          [sz]: String(parseStockDraft(prev[sz], 0)),
                        }))
                      }
                      className="w-12 text-right bg-transparent font-mono text-xs font-bold text-slate-950 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">{t('shopPortal.stockUnit')}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2-Layer Colors */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Palette size={14} className="text-blue-600" />
                {t('shopPortal.colorsSectionTitle')} ({colorVariants.length}/6)
              </label>
              {colorVariants.length < 6 && (
                <button
                  type="button"
                  onClick={() => setShowCustomColor((v) => !v)}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  {t('shopPortal.customColorBtn')}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_COLORS.map((preset) => {
                const active = colorVariants.some(
                  (c) =>
                    c.colorHex.toLowerCase() === preset.hex.toLowerCase() ||
                    c.colorName.toLowerCase() === preset.name.toLowerCase()
                );
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleToggleColor(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                      active
                        ? 'bg-[#14171C] text-white border-[#14171C]'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {showCustomColor && colorVariants.length < 6 && (
              <div className="p-2.5 rounded-xl bg-white border border-slate-300 flex items-center gap-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('shopPortal.customColorNamePlaceholder')}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const result = addCustomColorWithoutToggle(colorVariants, {
                      name: customName.trim() || customHex,
                      hex: customHex,
                    });
                    if (result.status === 'duplicate') {
                      showGlobalToast({
                        type: 'warning',
                        title: t('shopPortal.duplicateColorToast'),
                        message: '',
                      });
                      return;
                    }
                    if (result.status === 'max_reached') {
                      showGlobalToast({
                        type: 'warning',
                        title: t('shopPortal.maxColorsToast'),
                        message: '',
                      });
                      return;
                    }
                    setColorVariants(result.variants);
                    setCustomName('');
                    setShowCustomColor(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#14171C] text-white text-xs font-bold cursor-pointer"
                >
                  {t('shopPortal.addCustomColorBtn')}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {colorVariants.map((cv, idx) => {
                const hasCustom = Boolean(cv.imageUrl && cv.imageUrl.trim());
                return (
                  <div
                    key={`${cv.colorHex}-${idx}`}
                    className="w-24 bg-white rounded-xl border border-slate-200 p-1.5 flex flex-col items-center gap-1 relative"
                  >
                    <label className="relative w-14 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer">
                      <img
                        src={hasCustom ? cv.imageUrl : primaryImage || product.image_url}
                        alt={cv.colorName}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0.5 bottom-0.5 py-0.5 rounded bg-black/65 text-white text-[8px] font-bold text-center">
                        <Upload size={8} className="inline mr-0.5" />
                        {hasCustom ? t('shopPortal.customImageBadge') : t('shopPortal.sharedImageBadge')}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            handleFileToDataUrl(f, (url) =>
                              setColorVariants((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, imageUrl: url } : it))
                              )
                            );
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <span className="text-[10px] font-bold text-slate-800 truncate max-w-[78px]">
                      {cv.colorName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              {t('shopSettings.descLabel')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 leading-relaxed outline-none focus:border-slate-950"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50"
            >
              {t('shopPortal.replyCancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {isSaving ? t('shopSettings.saving') : t('shopPortal.saveProductChangesBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
