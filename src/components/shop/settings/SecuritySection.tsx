import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Lock, AlertTriangle, LogOut } from 'lucide-react';
import { authApi } from '@/services/authApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';

interface SecuritySectionProps {
  isGoogleAccount: boolean;
  onSignedOutAll: () => Promise<void> | void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  isGoogleAccount,
  onSignedOutAll,
}) => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoogleAccount) return;
    if (newPassword !== confirmNewPassword) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Passwords do not match' : 'Mật khẩu xác nhận không khớp',
        message: '',
      });
      return;
    }
    setIsChangingPassword(true);
    const res = await authApi.changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    setIsChangingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Password updated' : 'Cập nhật mật khẩu thành công',
        message: res.data?.message || '',
      });
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Password update failed' : 'Đổi mật khẩu thất bại',
        message: res.error?.message || '',
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoggingOutAll(true);
    const res = await authApi.logoutAll();
    setIsLoggingOutAll(false);

    if (res.success) {
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Signed out of all devices' : 'Đã đăng xuất toàn bộ thiết bị',
        message: res.data?.message || '',
      });
      await onSignedOutAll();
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Action failed' : 'Thao tác thất bại',
        message: res.error?.message || '',
      });
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
      >
        <div className="border-b border-slate-100 pb-3.5">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
            <KeyRound size={16} /> {t('shopSettings.sec5PassTitle')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec5PassDesc')}</p>
        </div>

        {isGoogleAccount && (
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-950">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{t('shopSettings.googlePassDisabledNotice')}</p>
          </div>
        )}

        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity ${
            isGoogleAccount ? 'opacity-45 pointer-events-none select-none' : ''
          }`}
        >
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.curPassLabel')}</label>
            <input
              required={!isGoogleAccount}
              disabled={isGoogleAccount}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('shopSettings.curPassPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs text-slate-950 outline-none focus:border-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.newPassLabel')}</label>
            <input
              required={!isGoogleAccount}
              disabled={isGoogleAccount}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('shopSettings.newPassPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs text-slate-950 outline-none focus:border-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.confirmPassLabel')}</label>
            <input
              required={!isGoogleAccount}
              disabled={isGoogleAccount}
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder={t('shopSettings.confirmPassPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs text-slate-950 outline-none focus:border-slate-950"
            />
          </div>
        </div>

        <div
          className={`flex justify-end pt-2 border-t border-slate-100 ${
            isGoogleAccount ? 'opacity-45 pointer-events-none select-none' : ''
          }`}
        >
          <button
            type="submit"
            disabled={isChangingPassword || isGoogleAccount}
            className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <Lock size={14} /> {isChangingPassword ? t('shopSettings.updatingPassBtn') : t('shopSettings.updatePassBtn')}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-rose-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-rose-600" /> {t('shopSettings.logoutAllTitle')}
          </h4>
          <p className="text-xs text-slate-600 max-w-xl">{t('shopSettings.logoutAllDesc')}</p>
        </div>

        {!confirmLogoutAll ? (
          <button
            type="button"
            onClick={() => setConfirmLogoutAll(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <LogOut size={14} /> {t('shopSettings.logoutAllBtn')}
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmLogoutAll(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
            >
              {t('shopSettings.logoutAllCancel')}
            </button>
            <button
              type="button"
              disabled={isLoggingOutAll}
              onClick={() => void handleLogoutAllDevices()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {isLoggingOutAll ? t('shopSettings.logoutAllBusy') : t('shopSettings.logoutAllConfirm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
