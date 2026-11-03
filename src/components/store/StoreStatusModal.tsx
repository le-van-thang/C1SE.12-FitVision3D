import React from 'react';
import { X, Clock, AlertTriangle, CheckCircle2, Store as StoreIcon, Phone, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';

export const StoreStatusModal: React.FC = () => {
  const {
    isStatusModalOpen,
    closeStatusModal,
    currentStore,
    openOnboarding,
  } = useAuth();
  const { t, locale } = useI18n();

  if (!isStatusModalOpen || !currentStore) return null;

  const isApproved = currentStore.status === 'APPROVED';
  const isRejected = currentStore.status === 'REJECTED';

  const formattedDate = currentStore.created_at
    ? new Date(currentStore.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('storeStatus.today');

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
        padding: 16,
        background: 'rgba(5, 8, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={closeStatusModal}
    >
      <div
        className="zf-modal-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          background: '#11191E',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 18,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          color: '#FFFFFF',
          padding: '28px 24px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: isApproved
              ? '#4FD1C5'
              : isRejected
              ? '#EF4444'
              : 'linear-gradient(90deg, rgba(246, 173, 85, 0.3), #F6AD55, rgba(246, 173, 85, 0.3))',
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={closeStatusModal}
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
          aria-label={t('storeStatus.close')}
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 12px',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isApproved
                ? 'rgba(79, 209, 197, 0.12)'
                : isRejected
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(246, 173, 85, 0.12)',
              border: `1px solid ${
                isApproved
                  ? 'rgba(79, 209, 197, 0.3)'
                  : isRejected
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(246, 173, 85, 0.3)'
              }`,
              color: isApproved ? '#4FD1C5' : isRejected ? '#F87171' : '#F6AD55',
            }}
          >
            {isApproved ? (
              <CheckCircle2 size={28} />
            ) : isRejected ? (
              <AlertTriangle size={28} />
            ) : (
              <Clock size={28} className="animate-pulse" />
            )}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            {isApproved
              ? t('storeStatus.titleApproved')
              : isRejected
              ? t('storeStatus.titleRejected')
              : t('storeStatus.titlePending')}
          </h3>

          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>
            {isApproved
              ? t('storeStatus.descApproved')
              : isRejected
              ? t('storeStatus.descRejected')
              : t('storeStatus.descPending')}
          </p>
        </div>

        {/* Rejection reason box */}
        {isRejected && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, color: '#FCA5A5', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> {t('storeStatus.rejectionFrom')}
            </div>
            <p style={{ color: '#FECACA', margin: 0, lineHeight: 1.5 }}>
              {currentStore.rejection_reason || t('storeStatus.rejectionDefault')}
            </p>
          </div>
        )}

        {/* Application details card */}
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: '#0A0F12',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ color: '#94A3B8' }}>{t('storeStatus.appStatus')}</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                background: isApproved
                  ? 'rgba(79, 209, 197, 0.15)'
                  : isRejected
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(246, 173, 85, 0.15)',
                color: isApproved ? '#4FD1C5' : isRejected ? '#F87171' : '#F6AD55',
                border: `1px solid ${
                  isApproved
                    ? 'rgba(79, 209, 197, 0.3)'
                    : isRejected
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(246, 173, 85, 0.3)'
                }`,
              }}
            >
              {t('storeStatus.status' + currentStore.status, currentStore.status)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <StoreIcon size={13} /> {t('storeStatus.brand')}
            </span>
            <span style={{ fontWeight: 600, color: '#FFFFFF', textAlign: 'right' }}>{currentStore.brand_name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Phone size={13} /> {t('storeStatus.phone')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>{currentStore.phone}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <MapPin size={13} /> {t('storeStatus.address')}
            </span>
            <span style={{ color: '#CBD5E1', textAlign: 'right', maxWidth: 220 }}>{currentStore.address}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#94A3B8', flexShrink: 0 }}>{t('storeStatus.verification')}</span>
            <span style={{ color: '#4FD1C5', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentStore.verification_doc}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: 11, color: '#64748B' }}>
            <span>{t('storeStatus.submittedAt')}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formattedDate}</span>
          </div>
        </div>

        {/* Action Button */}
        {isRejected ? (
          <button
            type="button"
            onClick={() => {
              closeStatusModal();
              openOnboarding();
            }}
            className="zf-btn zf-btn--full"
            style={{
              height: 40,
              background: '#F6AD55',
              color: '#0A0F12',
              fontWeight: 600,
              fontSize: 12,
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
            <RefreshCw size={14} /> {t('storeStatus.editResubmit')}
          </button>
        ) : (
          <button
            type="button"
            onClick={closeStatusModal}
            className="zf-btn zf-btn--secondary zf-btn--full"
            style={{
              height: 40,
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              fontSize: 12,
              borderRadius: 8,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {t('storeStatus.closeWindow')}
          </button>
        )}
      </div>
    </div>
  );
};
