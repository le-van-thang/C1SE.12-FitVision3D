import React, { useState, useRef, useEffect } from 'react';
import { X, Store as StoreIcon, Phone, MapPin, FileCheck2, AlertCircle, ArrowRight, ShieldCheck, UploadCloud, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';

export const MerchantOnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    closeOnboarding,
    applyMerchant,
    currentUser,
  } = useAuth();
  const { t } = useI18n();

  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [verificationDoc, setVerificationDoc] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOnboardingModalOpen) {
      setIsSubmittedSuccess(false);
      setErrorMessage(null);
    }
  }, [isOnboardingModalOpen]);

  if (!isOnboardingModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Dung lượng ảnh minh chứng vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setDocFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDocPreview(dataUrl);
      if (!verificationDoc.trim()) {
        setVerificationDoc(`Giấy phép KD: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setDocFile(null);
    setDocPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const docPayload = docPreview
      ? `${verificationDoc ? verificationDoc.trim() + ' | ' : ''}${docPreview}`
      : verificationDoc.trim();

    if (!docPayload) {
      setErrorMessage('Vui lòng nhập Mã số thuế/GPKD hoặc tải ảnh minh chứng.');
      setLoading(false);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const res = await applyMerchant({
      brandName,
      phone,
      address,
      verificationDoc: docPayload,
      website_trap: websiteTrap,
    });
    setLoading(false);

    if (res.success) {
      setIsSubmittedSuccess(true);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrorMessage(res.error || t('merchant.submitFailed'));
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="zf-modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        background: 'rgba(5, 8, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={closeOnboarding}
    >
      <div
        ref={scrollContainerRef}
        className="zf-merchant-scroll"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: '#11191E',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 18,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          color: '#FFFFFF',
          padding: '28px 24px',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom scrollbar styling */}
        <style>{`
          .zf-merchant-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .zf-merchant-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.04);
            border-radius: 8px;
          }
          .zf-merchant-scroll::-webkit-scrollbar-thumb {
            background: rgba(246, 173, 85, 0.5);
            border-radius: 8px;
          }
          .zf-merchant-scroll::-webkit-scrollbar-thumb:hover {
            background: #F6AD55;
          }
        `}</style>

        {/* Accent top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, rgba(246, 173, 85, 0.4), #F6AD55, rgba(79, 209, 197, 0.4))',
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={closeOnboarding}
          className="zf-modal-close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            borderRadius: 8,
            cursor: 'pointer',
          }}
          aria-label={t('merchant.close')}
        >
          <X size={18} />
        </button>

        {/* ── MÀN HÌNH NỘP HỒ SƠ THÀNH CÔNG ── */}
        {isSubmittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 8px 12px' }} className="animate-fade-in">
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '2px solid #34D399',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 28px rgba(52, 211, 153, 0.35)',
              }}
            >
              <CheckCircle2 size={38} color="#34D399" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34D399', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
              <ShieldCheck size={14} />
              ĐÃ NỘP HỒ SƠ THÀNH CÔNG
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Hồ sơ mở cửa hàng đã được tiếp nhận!
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px', lineHeight: 1.6 }}>
              Hồ sơ đăng ký đối tác thương hiệu <strong style={{ color: '#F6AD55' }}>{brandName}</strong> đã được đồng bộ lên hệ thống và chuyển đến ban quản trị FitVision 3D xét duyệt trong 24h.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px 18px',
                textAlign: 'left',
                marginBottom: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B' }}>Tên thương hiệu:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{brandName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B' }}>Số điện thoại liên hệ:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B' }}>Địa chỉ showroom:</span>
                <span style={{ color: '#CBD5E1', fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{address}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B' }}>Trạng thái thẩm định:</span>
                <span style={{ color: '#F6AD55', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F6AD55', display: 'inline-block' }} />
                  Đang chờ phê duyệt (Dưới 24h)
                </span>
              </div>
              {docFile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#64748B' }}>Minh chứng đính kèm:</span>
                  <span style={{ color: '#34D399', fontWeight: 600, fontSize: 11.5 }}>✓ {docFile.name} ({(docFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={closeOnboarding}
              style={{
                width: '100%',
                height: 44,
                background: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)',
                color: '#0A0F12',
                fontWeight: 600,
                fontSize: 13.5,
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 209, 197, 0.3)',
              }}
            >
              Đã hiểu & Đóng cửa sổ
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'rgba(246, 173, 85, 0.15)',
                  border: '1px solid rgba(246, 173, 85, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#F6AD55',
                  flexShrink: 0,
                }}
              >
                <StoreIcon size={24} />
              </div>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, background: 'rgba(246, 173, 85, 0.12)', border: '1px solid rgba(246, 173, 85, 0.3)', color: '#F6AD55', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  <ShieldCheck size={12} />
                  {t('merchant.badge')}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {t('merchant.title')}
                </h2>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 0, lineHeight: 1.5 }}>
                  {t('merchant.desc')}
                </p>
              </div>
            </div>

            {/* Error Message at the top */}
            {errorMessage && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Honeypot field (hidden from real users, traps bots) */}
              <input
                type="text"
                name="b_extra_notes"
                value={websiteTrap}
                onChange={(e) => setWebsiteTrap(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              />

              {/* Tên thương hiệu / Nhà may */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
                  {t('merchant.brandName')} <span style={{ color: '#F6AD55' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                    <StoreIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder={t('merchant.brandPlaceholder')}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px 0 38px',
                      background: 'rgba(5, 8, 10, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
                  {t('merchant.phone')} <span style={{ color: '#F6AD55' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('merchant.phonePlaceholder')}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px 0 38px',
                      background: 'rgba(5, 8, 10, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#64748B' }}>
                  {t('merchant.phoneHint')}
                </p>
              </div>

              {/* Địa chỉ xưởng may / Showroom */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
                  {t('merchant.address')} <span style={{ color: '#F6AD55' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                    <MapPin size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('merchant.addressPlaceholder')}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px 0 38px',
                      background: 'rgba(5, 8, 10, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Mã số GPKD hoặc Link xác thực */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
                  Mã số GPKD / Mã số thuế hoặc Link xác thực <span style={{ color: '#F6AD55' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                    <FileCheck2 size={16} />
                  </div>
                  <input
                    type="text"
                    required={!docPreview}
                    value={verificationDoc}
                    onChange={(e) => setVerificationDoc(e.target.value)}
                    placeholder="Mã số GPKD (Ví dụ: 0108928374) hoặc link https://..."
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px 0 38px',
                      background: 'rgba(5, 8, 10, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Tải ảnh minh chứng pháp lý */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
                  Ảnh minh chứng pháp lý (GPKD / Mã số thuế / Bảng hiệu)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {!docPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '1px dashed rgba(246, 173, 85, 0.35)',
                      borderRadius: 10,
                      padding: '20px 14px',
                      textAlign: 'center',
                      background: 'rgba(246, 173, 85, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#F6AD55')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(246, 173, 85, 0.35)')}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(246, 173, 85, 0.12)',
                        color: '#F6AD55',
                        display: 'grid',
                        placeItems: 'center',
                        margin: '0 auto 8px',
                      }}
                    >
                      <UploadCloud size={20} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#F6AD55', marginBottom: 4 }}>
                      Nhấn để tải ảnh minh chứng hoặc kéo thả vào đây
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Hỗ trợ JPG, PNG, WEBP, PDF (Tối đa 5MB)
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(52, 211, 153, 0.08)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                      {docPreview.startsWith('data:image') ? (
                        <img
                          src={docPreview}
                          alt="Minh chứng"
                          style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <ImageIcon size={28} className="text-emerald-400 shrink-0" />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#34D399',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {docFile?.name || 'Ảnh minh chứng đã chọn'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>
                          {docFile ? `${(docFile.size / 1024).toFixed(0)} KB • Sẵn sàng nộp` : 'Đã nạp'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message right above the Submit button so user NEVER has to scroll up */}
              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#FCA5A5',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div style={{ paddingTop: 6 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="zf-btn zf-btn--full"
                  style={{
                    height: 42,
                    background: '#F6AD55',
                    color: '#0A0F12',
                    fontWeight: 600,
                    fontSize: 13,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                  }}
                >
                  {loading ? t('merchant.submitting') : t('merchant.submit')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
              <span>{t('merchant.applicant')} <strong style={{ color: '#FFFFFF' }}>{currentUser?.full_name}</strong></span>
              <span>{t('merchant.sla')} <strong style={{ color: '#4FD1C5' }}>{t('merchant.slaValue')}</strong></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
