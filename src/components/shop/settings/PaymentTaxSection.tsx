import React, { useEffect, useState } from 'react';
import { ShieldCheck, Landmark, CheckCircle2, KeyRound, Mail, Save } from 'lucide-react';
import { commerceApi, type DbShopBankAccount, type DbShopProfile } from '@/services/commerceApi';
import { VIETNAM_BANKS } from '@/utils/shopKycValidation';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';

interface PaymentTaxSectionProps {
  shop: DbShopProfile;
  bankAccount: DbShopBankAccount | null;
  isApproved: boolean;
  isGoogleAccount: boolean;
  userEmail?: string;
  onBankUpdated: (updated: DbShopBankAccount) => void;
  onReloadDashboard: () => Promise<void> | void;
}

export const PaymentTaxSection: React.FC<PaymentTaxSectionProps> = ({
  shop,
  bankAccount,
  isApproved,
  isGoogleAccount,
  userEmail,
  onBankUpdated,
  onReloadDashboard,
}) => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  const [bankCode, setBankCode] = useState(bankAccount?.bank_code || VIETNAM_BANKS[0].code);
  const [bankName, setBankName] = useState(bankAccount?.bank_name || VIETNAM_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState(bankAccount?.account_number || '');
  const [accountHolderName, setAccountHolderName] = useState(
    bankAccount?.account_holder_name || shop.legal_representative_name || ''
  );
  const [verifyPassword, setVerifyPassword] = useState('');
  const [confirmGoogleEmail, setConfirmGoogleEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bankAccount) {
      setBankCode(bankAccount.bank_code || VIETNAM_BANKS[0].code);
      setBankName(bankAccount.bank_name || VIETNAM_BANKS[0].name);
      setAccountNumber(bankAccount.account_number || '');
      setAccountHolderName(bankAccount.account_holder_name || '');
    }
  }, [bankAccount]);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoogleAccount) {
      if (!confirmGoogleEmail.trim()) {
        showGlobalToast({
          type: 'warning',
          title: isEn ? 'Google email required' : 'Vui lòng nhập Email Google xác nhận',
          message: '',
        });
        return;
      }
    } else if (!verifyPassword.trim()) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Password required' : 'Thiếu mật khẩu xác thực',
        message: '',
      });
      return;
    }

    setIsSaving(true);
    const res = await commerceApi.updateShopBankAccount({
      bankCode,
      bankName,
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      ...(isGoogleAccount
        ? { confirmEmail: confirmGoogleEmail.trim() }
        : { currentPassword: verifyPassword }),
    });
    setIsSaving(false);

    if (res.success && res.data) {
      onBankUpdated(res.data);
      setVerifyPassword('');
      setConfirmGoogleEmail('');
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Bank account updated!' : 'Đã cập nhật tài khoản Ngân hàng!',
        message: isEn
          ? `KYC name match verified (${Math.round(res.data.name_match_score)}%).`
          : `Đã đối chiếu khớp KYC (${Math.round(res.data.name_match_score)}%) với tên chủ Shop.`,
      });
      void onReloadDashboard();
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Bank update failed' : 'Không thể cập nhật ngân hàng',
        message: res.error?.message || '',
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" /> {t('shopSettings.sec4TaxTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec4TaxDesc')}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            {shop.tax_status || 'VERIFIED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">{t('shopSettings.entityTypeLabel')}</p>
            <p className="font-bold text-slate-900 mt-0.5">{shop.entity_type || 'INDIVIDUAL'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">{t('shopSettings.taxCodeLabel')}</p>
            <p className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {shop.tax_code || t('shopSettings.taxCodeFallback')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">{t('shopSettings.legalRepLabel')}</p>
            <p className="font-bold text-slate-900 mt-0.5">
              {shop.legal_representative_name || t('shopSettings.notUpdated')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">{t('shopSettings.cccdLabel')}</p>
            <p className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {shop.national_id_last4 ? `••••••••${shop.national_id_last4}` : t('shopSettings.notSaved')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
            <p className="text-[11px] text-slate-500">{t('shopSettings.licenseLabel')}</p>
            <p className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {shop.business_license_no || t('shopSettings.licenseFallback')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveBank} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3.5">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
            <Landmark size={16} /> {t('shopSettings.sec4BankTitle')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec4BankDesc')}</p>
        </div>

        {bankAccount && (
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-950">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>
                {t('shopSettings.bankCurrentPrefix')} <b>{bankAccount.bank_name}</b> • {t('shopSettings.bankAccShort')}{' '}
                <b className="font-mono tabular-nums">{bankAccount.account_number}</b> —{' '}
                <b>{bankAccount.account_holder_name}</b>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800">
              {bankAccount.verification_status} ({Math.round(bankAccount.name_match_score || 0)}%)
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.bankSelectLabel')}</label>
            <select
              value={bankCode}
              onChange={(e) => {
                const code = e.target.value;
                setBankCode(code);
                const found = VIETNAM_BANKS.find((b) => b.code === code);
                if (found) setBankName(found.name);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-slate-950"
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.bankNumberLabel')}</label>
            <input
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="19036888999011"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono tabular-nums text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">{t('shopSettings.bankHolderLabel')}</label>
            <input
              required
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="NGUYEN VAN A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold uppercase text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          {isGoogleAccount ? (
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <Mail size={13} className="text-blue-600" />
                {isEn ? 'Confirm Google Login Email *' : 'Nhập lại Email Google để xác nhận *'}
              </label>
              <input
                required
                type="email"
                value={confirmGoogleEmail}
                onChange={(e) => setConfirmGoogleEmail(e.target.value)}
                placeholder={userEmail || 'email@gmail.com'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50/40 text-xs text-slate-950 outline-none focus:border-slate-950"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <KeyRound size={13} className="text-amber-600" /> {t('shopSettings.bankPasswordLabel')}
              </label>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder={t('shopSettings.bankPasswordPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-xs text-slate-950 outline-none focus:border-slate-950"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving || !isApproved}
            className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Save size={14} /> {isSaving ? t('shopSettings.savingBankBtn') : t('shopSettings.saveBankBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
