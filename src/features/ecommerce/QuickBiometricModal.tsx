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

        <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-stone-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {t('ecommerce.biometricModal.title', 'Hồ Sơ Nhân Trắc Học 3D Của Bạn')}
                </h3>
                <p className="text-xs text-stone-500">
                  {t('ecommerce.biometricModal.subtitle', 'Cơ sở để AI tự động so khớp kích cỡ trang phục chuẩn xác')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Camera Scan Highlight Banner */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-md">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white mb-1">
                {t('ecommerce.biometricModal.bannerBadge', 'Công nghệ cốt lõi ISO 8559')}
              </span>
              <h4 className="text-sm font-semibold">
                {t('ecommerce.biometricModal.bannerTitle', 'Quét Toàn Thân 3D Bằng Camera')}
              </h4>
              <p className="text-xs text-blue-200 mt-0.5">
                {t('ecommerce.biometricModal.bannerDesc', 'Trích xuất tự động 13 số đo chỉ trong 30 giây')}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigateToCameraScan();
              }}
              className="px-3.5 py-2 rounded-lg bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Camera size={14} />
              <span>{t('ecommerce.biometricModal.bannerCta', 'Quét Ngay')}</span>
            </button>
          </div>

          {/* Quick Adjustment Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t('ecommerce.biometricModal.formHeading', 'Hoặc cập nhật nhanh số đo thủ công:')}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t('ecommerce.biometricModal.height', 'Chiều cao (cm)')}
                </label>
                <input
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => setForm({ ...form, height_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t('ecommerce.biometricModal.weight', 'Cân nặng (kg)')}
                </label>
                <input
                  type="number"
                  value={form.weight_kg}
                  onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t('ecommerce.biometricModal.chest', 'Vòng ngực (cm)')}
                </label>
                <input
                  type="number"
                  value={form.chest_cm}
                  onChange={(e) => setForm({ ...form, chest_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t('ecommerce.biometricModal.waist', 'Vòng eo (cm)')}
                </label>
                <input
                  type="number"
                  value={form.waist_cm}
                  onChange={(e) => setForm({ ...form, waist_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t('ecommerce.biometricModal.hip', 'Vòng mông (cm)')}
                </label>
                <input
                  type="number"
                  value={form.hip_cm}
                  onChange={(e) => setForm({ ...form, hip_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {t('ecommerce.biometricModal.shoulder', 'Rộng vai (cm)')}
                </label>
                <input
                  type="number"
                  value={form.shoulder_cm}
                  onChange={(e) => setForm({ ...form, shoulder_cm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                {t('ecommerce.biometricModal.cancel', 'Hủy bỏ')}
              </button>
              <button
                type="submit"
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-blue-700 text-white transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>{t('ecommerce.biometricModal.save', 'Lưu & Tự Động Cập Nhật Size')}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

