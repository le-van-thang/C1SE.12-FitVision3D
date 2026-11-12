import React, { useState } from 'react';
import { X, Camera, Sparkles, Check, RefreshCw } from 'lucide-react';
import type { UserBodyProfile } from './types';
import { useI18n } from '@/i18n';

interface QuickBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBody: UserBodyProfile;
  onSaveBody: (newBody: UserBodyProfile) => void;
  onNavigateToCameraScan: () => void;
}

export const QuickBiometricModal: React.FC<QuickBiometricModalProps> = ({
  isOpen,
  onClose,
  currentBody,
  onSaveBody,
  onNavigateToCameraScan,
}) => {
  const { t } = useI18n();
  const [form, setForm] = useState<UserBodyProfile>(currentBody);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBody(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border-2 border-stone-400">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-stone-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-blue-700 flex-shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-950">
                  {t('ecommerce.biometricModal.title', 'Hồ Sơ Nhân Trắc Học 3D Của Bạn')}
                </h3>
                <p className="text-xs text-stone-600 font-medium">
                  {t('ecommerce.biometricModal.subtitle', 'Cơ sở để AI tự động so khớp kích cỡ trang phục chuẩn xác')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer border border-transparent hover:border-stone-300"
            >
              <X size={18} />
            </button>
          </div>

          {/* Camera Scan Highlight Banner - High Contrast Deep Slate */}
          <div
            style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}
            className="mt-4 p-4 rounded-xl border-2 border-stone-800 text-white flex items-center justify-between shadow-lg"
          >
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white mb-1 shadow-xs">
                {t('ecommerce.biometricModal.bannerBadge', 'Công nghệ cốt lõi ISO 8559')}
              </span>
              <h4 className="text-sm font-bold text-white">
                {t('ecommerce.biometricModal.bannerTitle', 'Quét Toàn Thân 3D Bằng Camera')}
              </h4>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                {t('ecommerce.biometricModal.bannerDesc', 'Trích xuất tự động 13 số đo chỉ trong 30 giây')}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigateToCameraScan();
              }}
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              className="px-4 py-2.5 rounded-xl text-white font-bold text-xs hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/40 cursor-pointer flex-shrink-0"
            >
              <Camera size={15} className="text-white" />
              <span>{t('ecommerce.biometricModal.bannerCta', 'Quét Ngay')}</span>
            </button>
          </div>

          {/* Quick Adjustment Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="text-xs font-black text-stone-800 uppercase tracking-wider">
              {t('ecommerce.biometricModal.formHeading', 'Hoặc cập nhật nhanh số đo thủ công:')}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  {t('ecommerce.biometricModal.height', 'Chiều cao (cm)')}
                </label>
                <input
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => setForm({ ...form, height_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-400 bg-stone-50 hover:border-stone-600 text-stone-950 text-sm font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  {t('ecommerce.biometricModal.weight', 'Cân nặng (kg)')}
                </label>
                <input
                  type="number"
                  value={form.weight_kg}
                  onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-400 bg-stone-50 hover:border-stone-600 text-stone-950 text-sm font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  {t('ecommerce.biometricModal.chest', 'Vòng ngực (cm)')}
                </label>
                <input
                  type="number"
                  value={form.chest_cm}
                  onChange={(e) => setForm({ ...form, chest_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-400 bg-stone-50 hover:border-stone-600 text-stone-950 text-sm font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  {t('ecommerce.biometricModal.waist', 'Vòng eo (cm)')}
                </label>
                <input
                  type="number"
                  value={form.waist_cm}
                  onChange={(e) => setForm({ ...form, waist_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-400 bg-stone-50 hover:border-stone-600 text-stone-950 text-sm font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  {t('ecommerce.biometricModal.hip', 'Vòng mông (cm)')}
                </label>
                <input
                  type="number"
                  value={form.hip_cm}
                  onChange={(e) => setForm({ ...form, hip_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-400 bg-stone-50 hover:border-stone-600 text-stone-950 text-sm font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  {t('ecommerce.biometricModal.shoulder', 'Rộng vai (cm)')}
                </label>
                <input
                  type="number"
                  value={form.shoulder_cm}
                  onChange={(e) => setForm({ ...form, shoulder_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-400 bg-stone-50 hover:border-stone-600 text-stone-950 text-sm font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 border-2 border-stone-300 hover:border-stone-400 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                {t('ecommerce.biometricModal.cancel', 'Hủy bỏ')}
              </button>
              <button
                type="submit"
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                className="relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer group before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700"
              >
                <Check size={14} className="text-white group-hover:scale-110 transition-transform duration-200" />
                <span>{t('ecommerce.biometricModal.save', 'Lưu & Tự Động Cập Nhật Size')}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

