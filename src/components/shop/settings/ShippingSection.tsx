import React, { useEffect, useState } from 'react';
import { MapPin, Truck, Save } from 'lucide-react';
import { commerceApi, type DbShopProfile } from '@/services/commerceApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';

interface ShippingSectionProps {
  shop: DbShopProfile;
  isApproved: boolean;
  onShopUpdated: (updated: DbShopProfile) => void;
  onReloadDashboard: () => Promise<void> | void;
}

export const ShippingSection: React.FC<ShippingSectionProps> = ({
  shop,
  isApproved,
  onShopUpdated,
  onReloadDashboard,
}) => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  const [pickupAddress, setPickupAddress] = useState(shop.pickup_address || shop.shop_address || '');
  const [returnSameAsPickup, setReturnSameAsPickup] = useState(shop.return_same_as_pickup ?? true);
  const [returnAddress, setReturnAddress] = useState(shop.return_address || shop.shop_address || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPickupAddress(shop.pickup_address || shop.shop_address || '');
    setReturnSameAsPickup(shop.return_same_as_pickup ?? true);
    setReturnAddress(shop.return_address || shop.shop_address || '');
  }, [shop]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPickup = pickupAddress.trim();
    if (cleanPickup.length < 5) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Pickup address too short' : 'Địa chỉ lấy hàng chưa đầy đủ',
        message: '',
      });
      return;
    }
    setIsSaving(true);
    // Partial update: ONLY send Shipping fields
    const res = await commerceApi.updateShopProfile({
      shopAddress: cleanPickup,
      pickupAddress: cleanPickup,
      returnSameAsPickup,
      returnAddress: returnSameAsPickup ? cleanPickup : returnAddress.trim() || cleanPickup,
    });
    setIsSaving(false);

    if (res.success && res.data) {
      onShopUpdated(res.data);
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Shipping addresses saved!' : 'Đã lưu Địa Chỉ Vận Chuyển!',
        message: '',
      });
      void onReloadDashboard();
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Update failed' : 'Cập nhật thất bại',
        message: res.error?.message || '',
      });
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-black text-slate-950">{t('shopSettings.sec3Title')}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec3Desc')}</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-700" /> {t('shopSettings.pickupLabel')}
          </label>
          <input
            required
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder={t('shopSettings.pickupPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
          />
          <p className="text-[11px] text-slate-500">{t('shopSettings.pickupHint')}</p>
        </div>

        <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={returnSameAsPickup}
            onChange={(e) => setReturnSameAsPickup(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 accent-[#14171C] cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800">{t('shopSettings.returnSameLabel')}</span>
        </label>

        <div
          className={`p-4 rounded-2xl border space-y-2.5 transition-opacity ${
            returnSameAsPickup ? 'border-slate-200 bg-slate-100/70 opacity-65' : 'border-slate-200 bg-white'
          }`}
        >
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Truck size={14} className="text-slate-700" /> {t('shopSettings.returnLabel')}
          </label>
          <input
            disabled={returnSameAsPickup}
            value={returnSameAsPickup ? pickupAddress : returnAddress}
            onChange={(e) => setReturnAddress(e.target.value)}
            placeholder={t('shopSettings.returnPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving || !isApproved}
          className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Save size={14} /> {isSaving ? t('shopSettings.saving') : t('shopSettings.saveShippingBtn')}
        </button>
      </div>
    </form>
  );
};
