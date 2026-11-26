import React, { useState } from 'react';
import { CreditCard, Building2, AlertCircle, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { VIETNAM_BANKS } from '@/types/settings.types';
import { normalizeBankHolderName } from './userSettingsHelpers';

export const RefundBankTab: React.FC = () => {
  const { t } = useI18n();
  const { refundBank, saveRefundBank, deleteRefundBank } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankCode, setBankCode] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openModal = () => {
    setError(null);
    if (refundBank) {
      setBankCode(refundBank.bankCode);
      setAccountNumber(refundBank.accountNumber);
      setHolderName(refundBank.accountHolderName);
    } else {
      setBankCode('VCB');
      setAccountNumber('');
      setHolderName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAcc = accountNumber.replace(/\s+/g, '');
    if (!/^\d{6,20}$/.test(cleanAcc)) {
      setError(t('userSettings.bank.errAccountNumber'));
      return;
    }

    const cleanHolder = normalizeBankHolderName(holderName).replace(/\s+/g, ' ').trim();
    if (cleanHolder.length < 2) {
      setError(t('userSettings.bank.errHolder'));
      return;
    }

    const bankObj = VIETNAM_BANKS.find((b) => b.code === bankCode);
    setIsSaving(true);
    try {
      const res = await saveRefundBank({
        bankCode,
        bankName: bankObj ? bankObj.name : bankCode,
        accountNumber: cleanAcc,
        accountHolderName: cleanHolder,
      });
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setError(res.error || 'Error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    const res = await deleteRefundBank();
    if (!res.success) setActionError(res.error || 'Error');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D8CBB1]/50 pb-4">
        <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
          {t('userSettings.bank.title')}
        </h2>
        <p className="text-xs text-[#4A463C] mt-0.5">{t('userSettings.bank.subtitle')}</p>
      </div>

      {/* Policy Notice */}
      <div className="p-4 rounded-card bg-[#C98A1B]/10 border border-[#C98A1B]/30 text-[#17150F] text-xs flex items-start gap-2.5">
        <AlertCircle size={16} className="text-[#C98A1B] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">{t('userSettings.bank.policyTitle')}</div>
          <p className="mt-0.5 text-[#4A463C] leading-relaxed">{t('userSettings.bank.policyDesc')}</p>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-control bg-[#D8452A]/10 border border-[#D8452A]/30 text-[#D8452A] text-xs font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {refundBank ? (
        <div className="max-w-md space-y-4">
          <div className="p-5 rounded-card bg-[#26356B] text-white shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#C9D2F5]" />
                <span className="font-bold text-sm">{refundBank.bankCode}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/15 text-white">
                {t('userSettings.bank.linkedBadge')}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-white/70">{t('userSettings.bank.accountNumberLabel')}</div>
              <div className="font-mono text-lg font-bold tracking-wider">
                {refundBank.accountNumber}
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-white/15">
              <div>
                <div className="text-[10px] text-white/70">{t('userSettings.bank.holderNameLabel')}</div>
                <div className="font-mono text-xs font-bold">{refundBank.accountHolderName}</div>
              </div>
              <div className="text-[10px] text-white/70 text-right max-w-[160px] truncate">
                {refundBank.bankName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-[#D8CBB1] hover:bg-[#F1ECE2] text-xs font-bold text-[#17150F]"
            >
              <Edit2 size={13} />
              <span>{t('userSettings.bank.editBtn')}</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-[#D8452A]/40 text-[#D8452A] hover:bg-[#D8452A]/10 text-xs font-bold"
            >
              <Trash2 size={13} />
              <span>{t('userSettings.bank.removeBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-md text-center py-10 px-4 rounded-card border border-dashed border-[#D8CBB1] bg-[#F1ECE2]/40">
          <CreditCard size={32} className="mx-auto text-[#4A463C]/50 mb-2" />
          <p className="text-sm font-bold text-[#17150F]">{t('userSettings.bank.emptyTitle')}</p>
          <p className="text-xs text-[#4A463C] mt-1 mb-4">{t('userSettings.bank.emptySubtitle')}</p>
          <button
            type="button"
            onClick={openModal}
            className="px-4 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold text-xs"
          >
            {t('userSettings.bank.linkBtn')}
          </button>
        </div>
      )}

      {/* Bank Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-md w-full p-6 border border-[#D8CBB1] shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8CBB1]/50 pb-3">
              <h3 className="text-base font-bold text-[#17150F]">{t('userSettings.bank.modalTitle')}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#4A463C] hover:text-[#17150F]"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-control bg-[#D8452A]/10 text-[#D8452A] text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#17150F] mb-1">
                  {t('userSettings.bank.selectBankLabel')} *
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none bg-white font-medium"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} — {b.shortName} ({b.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#17150F] mb-1">
                  {t('userSettings.bank.accountNumberInput')} *
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                  placeholder={t('userSettings.bank.accountNumberPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#17150F] mb-1">
                  {t('userSettings.bank.holderInput')} *
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(normalizeBankHolderName(e.target.value))}
                  placeholder={t('userSettings.bank.holderPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D8CBB1]/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#D8CBB1] text-[#17150F] font-bold hover:bg-[#F1ECE2]"
                >
                  {t('userSettings.bank.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold disabled:opacity-50"
                >
                  {t('userSettings.bank.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

