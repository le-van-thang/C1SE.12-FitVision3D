import React, { useEffect, useState } from 'react';
import { PauseCircle, Calendar, Clock, Save } from 'lucide-react';
import { commerceApi, type DbShopProfile } from '@/services/commerceApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';
import {
  PREP_TIME_CODES,
  formatPrepTimeLabel,
  normalizePrepTimeCode,
  toDateInputValue,
  type PrepTimeCode,
} from './shopSettingsHelpers';

interface OperationsSectionProps {
  shop: DbShopProfile;
  isApproved: boolean;
  onShopUpdated: (updated: DbShopProfile) => void;
  onReloadDashboard: () => Promise<void> | void;
}

export const OperationsSection: React.FC<OperationsSectionProps> = ({
  shop,
  isApproved,
  onShopUpdated,
  onReloadDashboard,
}) => {
  const { t, locale } = useI18n();

  const [operationalMode, setOperationalMode] = useState<'ACTIVE' | 'VACATION'>(
    shop.operational_mode === 'VACATION' ? 'VACATION' : 'ACTIVE'
  );
  const [vacationNote, setVacationNote] = useState(shop.vacation_note || '');
  const [vacationUntil, setVacationUntil] = useState(toDateInputValue(shop.vacation_until));
  const [prepTimeCode, setPrepTimeCode] = useState<PrepTimeCode>(normalizePrepTimeCode(shop.prep_time_days));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setOperationalMode(shop.operational_mode === 'VACATION' ? 'VACATION' : 'ACTIVE');
    setVacationNote(shop.vacation_note || '');
    setVacationUntil(toDateInputValue(shop.vacation_until));
    setPrepTimeCode(normalizePrepTimeCode(shop.prep_time_days));
  }, [shop]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Partial update: ONLY send Operations & Vacation fields
    const res = await commerceApi.updateShopProfile({
      operationalMode,
      vacationNote: operationalMode === 'VACATION' ? vacationNote.trim() : '',
      vacationUntil: operationalMode === 'VACATION' && vacationUntil ? vacationUntil : null,
      prepTimeDays: prepTimeCode,
    });
    setIsSaving(false);

    if (res.success && res.data) {
      onShopUpdated(res.data);
      showGlobalToast({
        type: 'success',
        title: t('shopSettings.operationsSavedTitle'),
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
        <h3 className="text-sm font-black text-slate-950">{t('shopSettings.sec2Title')}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec2Desc')}</p>
      </div>

      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          operationalMode === 'VACATION'
            ? 'bg-amber-50/80 border-amber-300'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              operationalMode === 'VACATION'
                ? 'bg-amber-200/80 text-amber-900'
                : 'bg-emerald-200/70 text-emerald-900'
            }`}
          >
            <PauseCircle size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-950">
              {operationalMode === 'VACATION' ? t('shopSettings.vacationOnTitle') : t('shopSettings.vacationOffTitle')}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {operationalMode === 'VACATION' ? t('shopSettings.vacationOnDesc') : t('shopSettings.vacationOffDesc')}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={operationalMode === 'VACATION'}
          onClick={() => setOperationalMode((prev) => (prev === 'VACATION' ? 'ACTIVE' : 'VACATION'))}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
            operationalMode === 'VACATION' ? 'bg-amber-500' : 'bg-emerald-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
              operationalMode === 'VACATION' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Calendar size={13} /> {t('shopSettings.vacationUntilLabel')}
          </label>
          <input
            type="date"
            disabled={operationalMode !== 'VACATION'}
            value={vacationUntil}
            onChange={(e) => setVacationUntil(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-mono outline-none focus:border-slate-950"
          />
          <p className="text-[11px] text-slate-400 mt-1">{t('shopSettings.vacationUntilHint')}</p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Clock size={13} /> {t('shopSettings.prepTimeLabel')}
          </label>
          <select
            value={prepTimeCode}
            onChange={(e) => setPrepTimeCode(e.target.value as PrepTimeCode)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-slate-950"
          >
            {PREP_TIME_CODES.map((code) => (
              <option key={code} value={code}>
                {formatPrepTimeLabel(code, locale)}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">{t('shopSettings.prepTimeHint')}</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.vacationNoteLabel')}</label>
        <textarea
          rows={3}
          disabled={operationalMode !== 'VACATION'}
          value={vacationNote}
          onChange={(e) => setVacationNote(e.target.value)}
          placeholder={t('shopSettings.vacationNotePlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-xs outline-none focus:border-slate-950"
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving || !isApproved}
          className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Save size={14} /> {isSaving ? t('shopSettings.saving') : t('shopSettings.saveOperationsBtn')}
        </button>
      </div>
    </form>
  );
};
