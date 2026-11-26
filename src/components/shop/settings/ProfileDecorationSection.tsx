import React, { useEffect, useRef, useState } from 'react';
import { Store, Image as ImageIcon, Upload, Trash2, Phone, Mail, Save } from 'lucide-react';
import { commerceApi, type DbShopProfile } from '@/services/commerceApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';
import { compressImageToDataUrl, isValidShopImageUrl } from './shopSettingsHelpers';

interface ProfileDecorationSectionProps {
  shop: DbShopProfile;
  userEmail?: string;
  isApproved: boolean;
  onShopUpdated: (updated: DbShopProfile) => void;
  onReloadDashboard: () => Promise<void> | void;
}

export const ProfileDecorationSection: React.FC<ProfileDecorationSectionProps> = ({
  shop,
  userEmail,
  isApproved,
  onShopUpdated,
  onReloadDashboard,
}) => {
  const { t } = useI18n();

  const [shopName, setShopName] = useState(shop.shop_name || '');
  const [tagline, setTagline] = useState(shop.tagline || '');
  const [description, setDescription] = useState(shop.description || '');
  const [logoUrl, setLogoUrl] = useState(shop.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(shop.banner_url || '');
  const [phoneNumber, setPhoneNumber] = useState(shop.phone_number || '');
  const [contactEmail, setContactEmail] = useState(shop.contact_email || userEmail || '');
  const [isSaving, setIsSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setShopName(shop.shop_name || '');
    setTagline(shop.tagline || '');
    setDescription(shop.description || '');
    setLogoUrl(shop.logo_url || '');
    setBannerUrl(shop.banner_url || '');
    setPhoneNumber(shop.phone_number || '');
    setContactEmail(shop.contact_email || userEmail || '');
  }, [shop, userEmail]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showGlobalToast({
        type: 'warning',
        title: t('shopSettings.unsupportedFormatTitle'),
        message: t('shopSettings.unsupportedFormatMsg'),
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showGlobalToast({
        type: 'warning',
        title: t('shopSettings.imageTooLargeTitle'),
        message: t('shopSettings.imageUnder5mbMsg'),
      });
      return;
    }
    try {
      const dataUrl =
        kind === 'logo'
          ? await compressImageToDataUrl(file, 400, 400, 0.82)
          : await compressImageToDataUrl(file, 1280, 420, 0.78);
      if (!isValidShopImageUrl(dataUrl)) {
        showGlobalToast({
          type: 'warning',
          title: t('shopSettings.compressedTooLargeTitle'),
          message: t('shopSettings.chooseSmallerImageMsg'),
        });
        return;
      }
      if (kind === 'logo') setLogoUrl(dataUrl);
      else setBannerUrl(dataUrl);
    } catch (err: any) {
      showGlobalToast({
        type: 'error',
        title: t('shopSettings.imageProcessErrTitle'),
        message: err?.message || '',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shopName.trim().length < 2) {
      showGlobalToast({
        type: 'warning',
        title: t('shopSettings.shopNameShortTitle'),
        message: t('shopSettings.shopNameShortMsg'),
      });
      return;
    }
    if (!isValidShopImageUrl(logoUrl) || !isValidShopImageUrl(bannerUrl)) {
      showGlobalToast({
        type: 'warning',
        title: t('shopSettings.invalidImageUrlTitle'),
        message: t('shopSettings.invalidImageUrlMsg'),
      });
      return;
    }

    setIsSaving(true);
    // Partial update: ONLY send Profile & Decoration fields so other tabs are never overwritten
    const res = await commerceApi.updateShopProfile({
      shopName: shopName.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      logoUrl: logoUrl.trim() || null,
      bannerUrl: bannerUrl.trim() || null,
      phoneNumber: phoneNumber.trim(),
      contactEmail: contactEmail.trim() || null,
    });
    setIsSaving(false);

    if (res.success && res.data) {
      onShopUpdated(res.data);
      showGlobalToast({
        type: 'success',
        title: t('shopSettings.profileSavedTitle'),
        message: t('shopSettings.profileSavedMsg'),
      });
      void onReloadDashboard();
    } else {
      showGlobalToast({
        type: 'error',
        title: t('shopSettings.updateFailedTitle'),
        message: res.error?.message || '',
      });
    }
  };

  const safeBanner = isValidShopImageUrl(bannerUrl) ? bannerUrl : '';
  const safeLogo = isValidShopImageUrl(logoUrl) ? logoUrl : '';

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-black text-slate-950">{t('shopSettings.sec1Title')}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('shopSettings.sec1Desc')}{' '}
          <span className="font-mono text-slate-700">/stores/{shop.brand_slug || shop.shop_name}</span>.
        </p>
      </div>

      {/* Live Preview using safe <img> instead of CSS backgroundImage */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900">
        <div className="h-32 sm:h-40 w-full relative bg-slate-800 overflow-hidden">
          {safeBanner && (
            <img src={safeBanner} alt="Banner preview" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[10px] font-bold">
            {t('shopSettings.previewBadge')}
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-slate-900 font-black text-xl overflow-hidden shrink-0">
              {safeLogo ? (
                <img src={safeLogo} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                (shopName || 'FV').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 text-white pb-0.5">
              <p className="text-sm sm:text-base font-black truncate">
                {shopName || t('shopSettings.previewNameFallback')}
              </p>
              <p className="text-[11px] text-slate-200 truncate">
                {tagline || t('shopSettings.previewTaglineFallback')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon size={14} /> {t('shopSettings.logoLabel')}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handleImageUpload(e, 'logo')}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-900 text-[11px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Upload size={12} /> {t('shopSettings.uploadImage')}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title={t('shopSettings.removeImage')}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <input
            value={logoUrl.startsWith('data:') ? '' : logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder={
              logoUrl.startsWith('data:')
                ? t('shopSettings.logoDataPlaceholder')
                : t('shopSettings.logoUrlPlaceholder')
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon size={14} /> {t('shopSettings.bannerLabel')}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handleImageUpload(e, 'banner')}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-900 text-[11px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Upload size={12} /> {t('shopSettings.uploadImage')}
              </button>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title={t('shopSettings.removeImage')}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <input
            value={bannerUrl.startsWith('data:') ? '' : bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder={
              bannerUrl.startsWith('data:')
                ? t('shopSettings.bannerDataPlaceholder')
                : t('shopSettings.bannerUrlPlaceholder')
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Store size={13} /> {t('shopSettings.shopNameLabel')}
          </label>
          <input
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder={t('shopSettings.shopNamePlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.taglineLabel')}</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={t('shopSettings.taglinePlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-950 outline-none focus:border-slate-950"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Phone size={13} /> {t('shopSettings.phoneLabel')}
          </label>
          <input
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t('shopSettings.phonePlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-950 outline-none focus:border-slate-950"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Mail size={13} /> {t('shopSettings.emailLabel')}
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t('shopSettings.emailPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-950 outline-none focus:border-slate-950"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.descLabel')}</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('shopSettings.descPlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 leading-relaxed outline-none focus:border-slate-950"
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving || !isApproved}
          className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Save size={14} /> {isSaving ? t('shopSettings.saving') : t('shopSettings.saveProfileBtn')}
        </button>
      </div>
    </form>
  );
};
