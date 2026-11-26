import React, { useState } from 'react';
import {
  Bell,
  Sliders,
  ShieldCheck,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import type { EaseAllowanceType } from '@/types/settings.types';

export const PrivacyTab: React.FC = () => {
  const { t } = useI18n();
  const { userPreferences, updateUserPreferences, deleteMy3DData, requestAccountLock } = useAuth();

  const [isDelete3DOpen, setIsDelete3DOpen] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleConfirmDelete3D = async () => {
    setModalError(null);
    setIsProcessing(true);
    try {
      const res = await deleteMy3DData();
      if (res.success) {
        setIsDelete3DOpen(false);
      } else {
        setModalError(res.error || 'Error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmLock = async () => {
    setModalError(null);
    setIsProcessing(true);
    try {
      const res = await requestAccountLock();
      if (res.success) {
        setIsLockOpen(false);
      } else {
        setModalError(res.error || 'Error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const easeOptions: Array<{ key: EaseAllowanceType; title: string; desc: string }> = [
    {
      key: 'slim',
      title: t('userSettings.privacy.easeSlimTitle'),
      desc: t('userSettings.privacy.easeSlimDesc'),
    },
    {
      key: 'regular',
      title: t('userSettings.privacy.easeRegularTitle'),
      desc: t('userSettings.privacy.easeRegularDesc'),
    },
    {
      key: 'relaxed',
      title: t('userSettings.privacy.easeRelaxedTitle'),
      desc: t('userSettings.privacy.easeRelaxedDesc'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-[#D8CBB1]/50 pb-4">
        <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
          {t('userSettings.privacy.title')}
        </h2>
        <p className="text-xs text-[#4A463C] mt-0.5">{t('userSettings.privacy.subtitle')}</p>
      </div>

      {/* 1. Email Notification Toggles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#26356B]" />
          <h3 className="text-sm font-bold text-[#17150F]">
            {t('userSettings.privacy.emailHeading')}
          </h3>
        </div>

        <div className="space-y-2.5 max-w-xl">
          <label className="flex items-center justify-between p-3.5 rounded-control border border-[#D8CBB1]/70 bg-white cursor-pointer hover:bg-[#F1ECE2]/40 transition-colors">
            <div>
              <div className="text-xs font-bold text-[#17150F]">
                {t('userSettings.privacy.orderUpdatesTitle')}
              </div>
              <div className="text-[11px] text-[#4A463C] mt-0.5">
                {t('userSettings.privacy.orderUpdatesDesc')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={userPreferences.emailOrderUpdates}
              onChange={(e) => updateUserPreferences({ emailOrderUpdates: e.target.checked })}
              className="w-4 h-4 accent-[#26356B] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-control border border-[#D8CBB1]/70 bg-white cursor-pointer hover:bg-[#F1ECE2]/40 transition-colors">
            <div>
              <div className="text-xs font-bold text-[#17150F]">
                {t('userSettings.privacy.promotionsTitle')}
              </div>
              <div className="text-[11px] text-[#4A463C] mt-0.5">
                {t('userSettings.privacy.promotionsDesc')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={userPreferences.emailPromotions}
              onChange={(e) => updateUserPreferences({ emailPromotions: e.target.checked })}
              className="w-4 h-4 accent-[#26356B] cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="h-px bg-[#D8CBB1]/50" />

      {/* 2. 3D Garment Ease Allowance Preference */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-[#26356B]" />
          <h3 className="text-sm font-bold text-[#17150F]">
            {t('userSettings.privacy.easeHeading')}
          </h3>
        </div>
        <p className="text-xs text-[#4A463C] max-w-xl">{t('userSettings.privacy.easeDesc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          {easeOptions.map((item) => {
            const active = userPreferences.easeAllowancePreference === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => updateUserPreferences({ easeAllowancePreference: item.key })}
                className={`p-3.5 rounded-control border text-left transition-all ${
                  active
                    ? 'border-[#26356B] bg-[#26356B]/10 ring-1 ring-[#26356B]'
                    : 'border-[#D8CBB1] bg-white hover:border-[#26356B]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17150F]">{item.title}</span>
                  {active && <CheckCircle2 size={14} className="text-[#26356B]" />}
                </div>
                <p className="text-[11px] text-[#4A463C] mt-1">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#D8CBB1]/50" />

      {/* 3. GDPR & Zero-Image Retention Controls */}
      <div className="p-5 rounded-card border border-[#D8452A]/30 bg-[#D8452A]/5 space-y-4">
        <div className="flex items-center gap-2 text-[#D8452A]">
          <ShieldCheck size={17} />
          <h3 className="text-sm font-bold">{t('userSettings.privacy.gdprHeading')}</h3>
        </div>
        <p className="text-xs text-[#4A463C] leading-relaxed max-w-2xl">
          {t('userSettings.privacy.gdprDesc')}
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setIsDelete3DOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-white border border-[#D8452A]/40 text-[#D8452A] hover:bg-[#D8452A]/10 text-xs font-bold transition-colors"
          >
            <Trash2 size={14} />
            <span>{t('userSettings.privacy.delete3DBtn')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setIsLockOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-[#D8452A] hover:bg-[#b83620] text-white text-xs font-bold transition-colors"
          >
            <Lock size={14} />
            <span>{t('userSettings.privacy.lockBtn')}</span>
          </button>
        </div>
      </div>

      {/* Delete 3D Data Confirmation Modal */}
      {isDelete3DOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-md w-full p-6 border border-[#D8CBB1] shadow-modal space-y-4">
            <div className="flex items-center gap-2.5 text-[#D8452A]">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold text-[#17150F]">
                {t('userSettings.privacy.delete3DModalTitle')}
              </h3>
            </div>
            <p className="text-xs text-[#4A463C] leading-relaxed">
              {t('userSettings.privacy.delete3DModalDesc')}
            </p>
            {modalError && (
              <div className="p-2.5 rounded-control bg-[#D8452A]/10 text-[#D8452A] text-xs font-medium">
                {modalError}
              </div>
            )}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsDelete3DOpen(false)}
                className="flex-1 py-2.5 rounded-control border border-[#D8CBB1] text-xs font-bold text-[#17150F] hover:bg-[#F1ECE2]"
              >
                {t('userSettings.privacy.delete3DKeep')}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete3D}
                className="flex-1 py-2.5 rounded-control bg-[#D8452A] hover:bg-[#b83620] text-white text-xs font-bold disabled:opacity-50"
              >
                {isProcessing
                  ? t('userSettings.security.processing')
                  : t('userSettings.privacy.delete3DConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Lock Confirmation Modal */}
      {isLockOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-md w-full p-6 border border-[#D8CBB1] shadow-modal space-y-4">
            <div className="flex items-center gap-2.5 text-[#D8452A]">
              <Lock size={20} />
              <h3 className="text-base font-bold text-[#17150F]">
                {t('userSettings.privacy.lockModalTitle')}
              </h3>
            </div>
            <p className="text-xs text-[#4A463C] leading-relaxed">
              {t('userSettings.privacy.lockModalDesc')}
            </p>
            {modalError && (
              <div className="p-2.5 rounded-control bg-[#D8452A]/10 text-[#D8452A] text-xs font-medium">
                {modalError}
              </div>
            )}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsLockOpen(false)}
                className="flex-1 py-2.5 rounded-control border border-[#D8CBB1] text-xs font-bold text-[#17150F] hover:bg-[#F1ECE2]"
              >
                {t('userSettings.privacy.lockCancel')}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmLock}
                className="flex-1 py-2.5 rounded-control bg-[#17150F] hover:bg-[#26356B] text-white text-xs font-bold disabled:opacity-50"
              >
                {isProcessing
                  ? t('userSettings.security.processing')
                  : t('userSettings.privacy.lockConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

