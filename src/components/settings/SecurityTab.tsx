import React, { useState, useMemo } from 'react';
import {
  Lock,
  Laptop,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { validatePassword } from '@/lib/validationRules';
import { detectCurrentDevice, evaluatePasswordStrength } from './userSettingsHelpers';

export const SecurityTab: React.FC = () => {
  const { t } = useI18n();
  const { authProvider, changePassword, logoutAllDevices } = useAuth();
  const isGoogleAccount = authProvider === 'google';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const currentDevice = useMemo(() => detectCurrentDevice(), []);
  const strength = useMemo(() => evaluatePasswordStrength(newPassword), [newPassword]);
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const confirmMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  const strengthText =
    strength.level === 'empty'
      ? t('userSettings.security.strengthEmpty')
      : strength.level === 'weak'
      ? t('userSettings.security.strengthWeak')
      : strength.level === 'fair'
      ? t('userSettings.security.strengthFair')
      : strength.level === 'good'
      ? t('userSettings.security.strengthGood')
      : t('userSettings.security.strengthStrong');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoogleAccount) return;
    setPassError(null);
    setPassSuccess(false);

    if (!currentPassword.trim()) {
      setPassError(t('userSettings.security.errCurrentRequired'));
      return;
    }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      setPassError(t('userSettings.security.errPasswordRule'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError(t('userSettings.security.errMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setPassSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.error || 'Error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAll = async () => {
    setSessionError(null);
    setIsRevoking(true);
    try {
      const res = await logoutAllDevices();
      if (res.success) {
        setIsRevokeModalOpen(false);
      } else {
        setSessionError(res.error || 'Error');
      }
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#D8CBB1]/50 pb-4">
        <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
          {t('userSettings.security.title')}
        </h2>
        <p className="text-xs text-[#4A463C] mt-0.5">{t('userSettings.security.subtitle')}</p>
      </div>

      {/* Password Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-[#26356B]" />
          <h3 className="text-sm font-bold text-[#17150F]">
            {t('userSettings.security.passwordHeading')}
          </h3>
        </div>

        {isGoogleAccount && (
          <div className="p-3.5 rounded-control bg-[#26356B]/10 border border-[#26356B]/25 text-[#26356B] text-xs font-medium flex items-start gap-2.5 max-w-lg">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t('userSettings.security.googleNotice')}</p>
          </div>
        )}

        {passSuccess && (
          <div className="p-3 rounded-control bg-[#3F6B4E]/10 border border-[#3F6B4E]/30 text-[#3F6B4E] text-xs font-medium flex items-center gap-2 max-w-lg">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{t('userSettings.security.passwordUpdated')}</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-control bg-[#D8452A]/10 border border-[#D8452A]/30 text-[#D8452A] text-xs font-medium flex items-center gap-2 max-w-lg">
            <AlertCircle size={16} className="shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form
          onSubmit={handleChangePassword}
          className={`space-y-3.5 max-w-lg ${isGoogleAccount ? 'opacity-50 pointer-events-none select-none' : ''}`}
        >
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-[#17150F] mb-1">
              {t('userSettings.security.currentPassLabel')} <span className="text-[#D8452A]">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                disabled={isGoogleAccount}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('userSettings.security.currentPassPlaceholder')}
                className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none font-mono bg-white"
                required={!isGoogleAccount}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-[#4A463C] hover:text-[#17150F]"
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-[#17150F] mb-1">
              {t('userSettings.security.newPassLabel')} <span className="text-[#D8452A]">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                disabled={isGoogleAccount}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('userSettings.security.newPassPlaceholder')}
                className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none font-mono bg-white"
                required={!isGoogleAccount}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-[#4A463C] hover:text-[#17150F]"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {newPassword && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full bg-[#E8E1D3] rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all ${
                        step <= strength.score ? strength.colorClass : 'bg-[#D8CBB1]/50'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-[#4A463C]">
                  <span>
                    {t('userSettings.security.strengthLabel')}{' '}
                    <strong className="text-[#17150F]">{strengthText}</strong>
                  </span>
                  <span className="font-mono">
                    {newPassword.length}/32 {t('userSettings.security.charCountUnit')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password with real-time red/green indicator bar */}
          <div>
            <label className="block text-xs font-bold text-[#17150F] mb-1">
              {t('userSettings.security.confirmPassLabel')} <span className="text-[#D8452A]">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                disabled={isGoogleAccount}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('userSettings.security.confirmPassPlaceholder')}
                aria-invalid={confirmMismatch}
                className={`w-full text-xs pl-3.5 pr-10 py-2.5 rounded-control border-2 outline-none font-mono bg-white transition-all ${
                  confirmMismatch
                    ? 'border-[#D8452A] bg-[#D8452A]/5 focus:ring-2 focus:ring-[#D8452A]/20'
                    : confirmMatch
                    ? 'border-[#3F6B4E] bg-[#3F6B4E]/5 focus:ring-2 focus:ring-[#3F6B4E]/20'
                    : 'border-[#D8CBB1] focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B]'
                }`}
                required={!isGoogleAccount}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-[#4A463C] hover:text-[#17150F]"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {confirmPassword && (
              <div className="mt-2 space-y-1.5" role="status" aria-live="polite">
                <div className="h-1.5 w-full rounded-full bg-[#E8E1D3] overflow-hidden">
                  <div
                    className={`h-full w-full rounded-full transition-all duration-300 ${
                      confirmMatch ? 'bg-[#3F6B4E]' : 'bg-[#D8452A] animate-pulse'
                    }`}
                  />
                </div>
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                    confirmMatch ? 'text-[#3F6B4E]' : 'text-[#D8452A]'
                  }`}
                >
                  {confirmMatch ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  <span>
                    {confirmMatch
                      ? t('userSettings.security.matchOk')
                      : t('userSettings.security.matchErr')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleAccount || confirmMismatch}
            className="px-5 py-2.5 rounded-control bg-[#17150F] hover:bg-[#26356B] text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('userSettings.security.updatingBtn') : t('userSettings.security.updateBtn')}
          </button>
        </form>
      </div>

      <div className="h-px bg-[#D8CBB1]/50" />

      {/* Active Session (Real browser/OS — zero hardcoded fake IP/city/iPhone) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Laptop size={16} className="text-[#26356B]" />
            <div>
              <h3 className="text-sm font-bold text-[#17150F]">
                {t('userSettings.security.sessionsHeading')}
              </h3>
              <p className="text-[11px] text-[#4A463C]">
                {t('userSettings.security.sessionsSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSessionError(null);
              setIsRevokeModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-control border border-[#D8452A]/40 text-[#D8452A] hover:bg-[#D8452A]/10 text-xs font-bold transition-colors shrink-0"
          >
            {t('userSettings.security.logoutAllBtn')}
          </button>
        </div>

        <div className="p-3.5 rounded-control border border-[#26356B]/25 bg-[#26356B]/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-control bg-[#26356B]/10 text-[#26356B] flex items-center justify-center shrink-0">
              <Laptop size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#17150F] flex flex-wrap items-center gap-1.5">
                <span>
                  {currentDevice.label} {t('userSettings.security.thisDeviceSuffix')}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3F6B4E]/15 text-[#3F6B4E] border border-[#3F6B4E]/30">
                  {t('userSettings.security.currentSessionBadge')}
                </span>
              </div>
              <div className="text-[11px] text-[#4A463C] mt-0.5">
                {t('userSettings.security.activeNow')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revoke All Sessions Modal */}
      {isRevokeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-md w-full p-6 border border-[#D8CBB1] shadow-modal space-y-4">
            <div className="flex items-center gap-2.5 text-[#D8452A]">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold text-[#17150F]">
                {t('userSettings.security.revokeModalTitle')}
              </h3>
            </div>
            <p className="text-xs text-[#4A463C] leading-relaxed">
              {t('userSettings.security.revokeModalDesc')}
            </p>
            {sessionError && (
              <div className="p-2.5 rounded-control bg-[#D8452A]/10 text-[#D8452A] text-xs font-medium">
                {sessionError}
              </div>
            )}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setIsRevokeModalOpen(false)}
                className="flex-1 py-2.5 rounded-control border border-[#D8CBB1] text-xs font-bold text-[#17150F] hover:bg-[#F1ECE2]"
              >
                {t('userSettings.security.revokeCancel')}
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleRevokeAll}
                className="flex-1 py-2.5 rounded-control bg-[#D8452A] hover:bg-[#b83620] text-white text-xs font-bold disabled:opacity-50"
              >
                {isRevoking
                  ? t('userSettings.security.processing')
                  : t('userSettings.security.revokeConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

