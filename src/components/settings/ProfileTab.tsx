import React, { useState, useRef } from 'react';
import {
  User,
  CheckCircle2,
  AlertCircle,
  Camera,
  ShieldCheck,
  Mail,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { validatePhoneNumber } from '@/lib/validationRules';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export const ProfileTab: React.FC = () => {
  const { t } = useI18n();
  const { currentUser, authProvider, getUserProfileDetails, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const details = getUserProfileDetails(currentUser?.id);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(details.phone || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(details.gender || 'male');
  const [birthDate, setBirthDate] = useState(details.birth_date || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError(t('userSettings.profile.errNameRequired'));
      return;
    }

    if (phone.trim() && !validatePhoneNumber(phone.trim()).valid) {
      setError(t('userSettings.profile.errPhoneInvalid'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        gender,
        birth_date: birthDate || undefined,
        avatar_url: avatarUrl,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3500);
      } else {
        setError(res.error || 'Error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(t('userSettings.profile.errImageTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="border-b border-[#D8CBB1]/50 pb-4 mb-6">
        <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
          {t('userSettings.profile.title')}
        </h2>
        <p className="text-xs text-[#4A463C] mt-0.5">{t('userSettings.profile.subtitle')}</p>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-control bg-[#3F6B4E]/10 border border-[#3F6B4E]/30 text-[#3F6B4E] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{t('userSettings.profile.savedMsg')}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-control bg-[#D8452A]/10 border border-[#D8452A]/30 text-[#D8452A] text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-4">
            {/* Locked Email */}
            <div>
              <label className="block text-xs font-bold text-[#17150F] mb-1">
                {t('userSettings.profile.emailLabel')}
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  disabled
                  className="w-full text-xs px-3.5 py-2.5 pr-44 rounded-control bg-[#E8E1D3]/60 border border-[#D8CBB1] text-[#4A463C] font-mono cursor-not-allowed select-none"
                />
                <div className="absolute right-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3F6B4E] bg-[#3F6B4E]/10 px-2 py-0.5 rounded border border-[#3F6B4E]/25">
                    <ShieldCheck size={11} />
                    {t('userSettings.profile.verifiedBadge')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#26356B] bg-[#26356B]/10 px-2 py-0.5 rounded border border-[#26356B]/20">
                    <Mail size={11} />
                    {authProvider === 'google'
                      ? t('userSettings.profile.providerGoogle')
                      : t('userSettings.profile.providerEmail')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#4A463C]/80 mt-1">{t('userSettings.profile.emailHint')}</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#17150F] mb-1">
                {t('userSettings.profile.fullNameLabel')} <span className="text-[#D8452A]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('userSettings.profile.fullNamePlaceholder')}
                className="w-full text-xs px-3.5 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none font-medium bg-white"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-[#17150F] mb-1">
                {t('userSettings.profile.phoneLabel')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('userSettings.profile.phonePlaceholder')}
                className="w-full text-xs px-3.5 py-2.5 rounded-control border border-[#D8CBB1] focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none font-mono bg-white"
              />
            </div>

            {/* Gender & Date of Birth (aligned 2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-bold text-[#17150F] mb-1.5">
                  {t('userSettings.profile.genderLabel')}
                </label>
                <div className="flex items-center gap-5 text-xs text-[#17150F] h-[38px]">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="accent-[#26356B]"
                      />
                      <span>
                        {g === 'male'
                          ? t('userSettings.profile.genderMale')
                          : g === 'female'
                          ? t('userSettings.profile.genderFemale')
                          : t('userSettings.profile.genderOther')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17150F] mb-1.5">
                  {t('userSettings.profile.birthDateLabel')}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-control border border-[#D8CBB1] focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right Avatar Panel */}
          <div className="md:col-span-4 flex flex-col items-center p-4 rounded-card bg-[#F1ECE2]/60 border border-[#D8CBB1]/70">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D8CBB1] mb-3 bg-[#E8E1D3] flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-[#4A463C]" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-[#D8CBB1] bg-white hover:bg-[#E8E1D3]/50 text-xs font-semibold text-[#17150F]"
              >
                <Camera size={13} />
                <span>{t('userSettings.profile.uploadPhoto')}</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control border border-[#D8452A]/30 text-[#D8452A] hover:bg-[#D8452A]/10 text-xs font-semibold"
                >
                  <Trash2 size={12} />
                  <span>{t('userSettings.profile.removePhoto')}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="w-full pt-2 border-t border-[#D8CBB1]/50">
              <div className="text-[11px] font-semibold text-[#4A463C] mb-2 text-center">
                {t('userSettings.profile.presetsLabel')}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-12 h-12 mx-auto rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === url
                        ? 'border-[#26356B] scale-105'
                        : 'border-transparent hover:border-[#D8CBB1]'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#D8CBB1]/50 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold text-xs transition-all disabled:opacity-50"
          >
            {isSaving ? t('userSettings.profile.savingBtn') : t('userSettings.profile.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};

