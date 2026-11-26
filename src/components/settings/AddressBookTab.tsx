import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { validatePhoneNumber } from '@/lib/validationRules';
import type { UserAddress, AddressType } from '@/types/settings.types';

export const AddressBookTab: React.FC = () => {
  const { t } = useI18n();
  const { currentUser, userAddresses, saveAddress, deleteAddress, setDefaultAddress } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [detail, setDetail] = useState('');
  const [label, setLabel] = useState<AddressType>('home');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openModal = (addr?: UserAddress) => {
    setError(null);
    if (addr) {
      setEditing(addr);
      setName(addr.recipientName);
      setPhone(addr.phone);
      setCity(addr.city);
      setDistrict(addr.district || '');
      setDetail(addr.detailedAddress);
      setLabel(addr.label);
      setIsDefault(addr.isDefault);
    } else {
      setEditing(null);
      setName(currentUser?.full_name || '');
      setPhone('');
      setCity('');
      setDistrict('');
      setDetail('');
      setLabel('home');
      setIsDefault(userAddresses.length === 0);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !city.trim() || !detail.trim()) {
      setError(t('userSettings.addresses.errRequired'));
      return;
    }
    if (!validatePhoneNumber(phone.trim()).valid) {
      setError(t('userSettings.addresses.errPhone'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveAddress({
        id: editing?.id,
        recipientName: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        detailedAddress: detail.trim(),
        label,
        isDefault,
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

  const handleSetDefault = async (id: string) => {
    setActionError(null);
    const res = await setDefaultAddress(id);
    if (!res.success) setActionError(res.error || 'Error');
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    const res = await deleteAddress(id);
    if (!res.success) setActionError(res.error || 'Error');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D8CBB1]/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
            {t('userSettings.addresses.title')}
          </h2>
          <p className="text-xs text-[#4A463C] mt-0.5">{t('userSettings.addresses.subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold text-xs transition-all shrink-0"
        >
          <Plus size={14} />
          <span>{t('userSettings.addresses.addBtn')}</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-control bg-[#D8452A]/10 border border-[#D8452A]/30 text-[#D8452A] text-xs font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {userAddresses.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-card border border-dashed border-[#D8CBB1] bg-[#F1ECE2]/40">
          <MapPin size={32} className="mx-auto text-[#4A463C]/50 mb-2" />
          <p className="text-sm font-bold text-[#17150F]">{t('userSettings.addresses.emptyTitle')}</p>
          <p className="text-xs text-[#4A463C] mt-1">{t('userSettings.addresses.emptySubtitle')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userAddresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-4 rounded-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                addr.isDefault
                  ? 'border-[#26356B]/35 bg-[#26356B]/5'
                  : 'border-[#D8CBB1]/70 bg-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-[#17150F]">{addr.recipientName}</span>
                  <span className="text-xs text-[#D8CBB1]">|</span>
                  <span className="text-xs font-mono font-medium text-[#4A463C]">{addr.phone}</span>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-[#D8CBB1] bg-[#E8E1D3]/60 text-[#17150F] inline-flex items-center gap-1">
                    {addr.label === 'home' ? (
                      <>
                        <Home size={10} /> {t('userSettings.addresses.labelHome')}
                      </>
                    ) : addr.label === 'office' ? (
                      <>
                        <Briefcase size={10} /> {t('userSettings.addresses.labelOffice')}
                      </>
                    ) : (
                      <>
                        <MapPin size={10} /> {t('userSettings.addresses.labelOther')}
                      </>
                    )}
                  </span>

                  {addr.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#D8452A]/40 bg-[#D8452A]/10 text-[#D8452A]">
                      {t('userSettings.addresses.defaultBadge')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#4A463C]">
                  {addr.detailedAddress}
                  {addr.district ? `, ${addr.district}` : ''}
                  {addr.city ? `, ${addr.city}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="px-2.5 py-1.5 rounded-control border border-[#D8CBB1] hover:bg-[#F1ECE2] text-xs font-semibold text-[#17150F]"
                  >
                    {t('userSettings.addresses.setDefaultBtn')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openModal(addr)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control border border-[#D8CBB1] hover:bg-[#F1ECE2] text-xs font-semibold text-[#26356B]"
                >
                  <Edit2 size={12} />
                  <span>{t('userSettings.addresses.editBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 rounded-control border border-[#D8452A]/30 text-[#D8452A] hover:bg-[#D8452A]/10"
                  title={t('userSettings.addresses.deleteTooltip')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-lg w-full p-6 border border-[#D8CBB1] shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8CBB1]/50 pb-3">
              <h3 className="text-base font-bold text-[#17150F]">
                {editing
                  ? t('userSettings.addresses.modalEditTitle')
                  : t('userSettings.addresses.modalAddTitle')}
              </h3>
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

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17150F] mb-1">
                    {t('userSettings.addresses.recipientLabel')} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('userSettings.addresses.recipientPlaceholder')}
                    className="w-full px-3 py-2 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17150F] mb-1">
                    {t('userSettings.addresses.phoneLabel')} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('userSettings.addresses.phonePlaceholder')}
                    className="w-full px-3 py-2 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17150F] mb-1">
                    {t('userSettings.addresses.cityLabel')} *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('userSettings.addresses.cityPlaceholder')}
                    className="w-full px-3 py-2 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17150F] mb-1">
                    {t('userSettings.addresses.districtLabel')}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={t('userSettings.addresses.districtPlaceholder')}
                    className="w-full px-3 py-2 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17150F] mb-1">
                  {t('userSettings.addresses.detailLabel')} *
                </label>
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={t('userSettings.addresses.detailPlaceholder')}
                  className="w-full px-3 py-2 rounded-control border border-[#D8CBB1] focus:border-[#26356B] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#17150F] mb-1">
                  {t('userSettings.addresses.typeLabel')}
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { id: 'home', text: t('userSettings.addresses.labelHome'), Icon: Home },
                      { id: 'office', text: t('userSettings.addresses.labelOffice'), Icon: Briefcase },
                      { id: 'other', text: t('userSettings.addresses.labelOther'), Icon: MapPin },
                    ] as const
                  ).map(({ id, text, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLabel(id)}
                      className={`flex-1 py-1.5 px-2 rounded-control border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        label === id
                          ? 'border-[#26356B] bg-[#26356B]/10 text-[#26356B] font-bold'
                          : 'border-[#D8CBB1] text-[#4A463C] hover:bg-[#F1ECE2]'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-[#26356B]"
                />
                <span className="text-xs font-medium text-[#17150F]">
                  {t('userSettings.addresses.setDefaultCheckbox')}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D8CBB1]/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-[#D8CBB1] text-[#17150F] font-bold hover:bg-[#F1ECE2]"
                >
                  {t('userSettings.addresses.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold disabled:opacity-50"
                >
                  {t('userSettings.addresses.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

