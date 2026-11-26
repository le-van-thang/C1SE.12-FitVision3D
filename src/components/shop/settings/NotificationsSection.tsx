import React, { useEffect, useState } from 'react';
import { MessageSquare, Sparkles, Save } from 'lucide-react';
import { commerceApi, type DbShopProfile } from '@/services/commerceApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';

interface NotificationsSectionProps {
  shop: DbShopProfile;
  isApproved: boolean;
  onShopUpdated: (updated: DbShopProfile) => void;
  onReloadDashboard: () => Promise<void> | void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  shop,
  isApproved,
  onShopUpdated,
  onReloadDashboard,
}) => {
  const { t } = useI18n();
  const presets = [
    t('shopSettings.quickReplyPreset1'),
    t('shopSettings.quickReplyPreset2'),
    t('shopSettings.quickReplyPreset3'),
  ];

  const [quickReplyTemplate, setQuickReplyTemplate] = useState(shop.quick_reply_template || '');
  const [notifyNewOrderEmail, setNotifyNewOrderEmail] = useState(shop.notify_new_order_email ?? true);
  const [notifyLowStockEmail, setNotifyLowStockEmail] = useState(shop.notify_low_stock_email ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setQuickReplyTemplate(shop.quick_reply_template || '');
    setNotifyNewOrderEmail(shop.notify_new_order_email ?? true);
    setNotifyLowStockEmail(shop.notify_low_stock_email ?? true);
  }, [shop]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Partial update: ONLY send CSKH & Notifications fields
    const res = await commerceApi.updateShopProfile({
      quickReplyTemplate: quickReplyTemplate.trim() || null,
      notifyNewOrderEmail,
      notifyLowStockEmail,
    });
    setIsSaving(false);

    if (res.success && res.data) {
      onShopUpdated(res.data);
      showGlobalToast({
        type: 'success',
        title: t('shopSettings.notifySavedTitle'),
        message: '',
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

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
          <MessageSquare size={16} /> {t('shopSettings.sec6Title')}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec6Desc')}</p>
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-800 block">{t('shopSettings.quickReplyLabel')}</label>
        <textarea
          rows={3}
          value={quickReplyTemplate}
          onChange={(e) => setQuickReplyTemplate(e.target.value)}
          placeholder={t('shopSettings.quickReplyPlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 leading-relaxed outline-none focus:border-slate-950"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuickReplyTemplate(preset)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles size={11} className="text-amber-600" /> {t('shopSettings.usePreset')} #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-900">{t('shopSettings.notifyOrderTitle')}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('shopSettings.notifyOrderDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifyNewOrderEmail}
            onClick={() => setNotifyNewOrderEmail((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              notifyNewOrderEmail ? 'bg-[#14171C]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifyNewOrderEmail ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-900">{t('shopSettings.notifyStockTitle')}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('shopSettings.notifyStockDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifyLowStockEmail}
            onClick={() => setNotifyLowStockEmail((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              notifyLowStockEmail ? 'bg-[#14171C]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifyLowStockEmail ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving || !isApproved}
          className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Save size={14} /> {isSaving ? t('shopSettings.saving') : t('shopSettings.saveNotifyBtn')}
        </button>
      </div>
    </form>
  );
};
