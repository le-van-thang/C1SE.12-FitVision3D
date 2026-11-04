import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Store as StoreIcon,
  Phone,
  MapPin,
  FileCheck2,
  AlertTriangle,
  Users,
  Check,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/common/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import type { Store } from '@/types/database.types';

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const AdminPortal: React.FC = () => {
  const { t, locale } = useI18n();
  const {
    currentUser,
    userRole,
    stores,
    profiles,
    approveStore,
    rejectStore,
    switchDemoRole,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingStore, setRejectingStore] = useState<Store | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  // Metrics
  const totalCount = stores.length;
  const pendingCount = stores.filter((s) => s.status === 'PENDING').length;
  const approvedCount = stores.filter((s) => s.status === 'APPROVED').length;
  const rejectedCount = stores.filter((s) => s.status === 'REJECTED').length;

  // Filtered list
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // Tab filter
      if (activeTab !== 'ALL' && store.status !== activeTab) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const applicant = profiles.find((p) => p.id === store.user_id);
      return (
        store.brand_name.toLowerCase().includes(q) ||
        store.phone.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q) ||
        store.verification_doc.toLowerCase().includes(q) ||
        (applicant && applicant.full_name.toLowerCase().includes(q)) ||
        (applicant && applicant.email.toLowerCase().includes(q))
      );
    });
  }, [stores, profiles, activeTab, searchQuery]);

  const handleApprove = (store: Store) => {
    const res = approveStore(store.id);
    if (res.success) {
      setActionSuccess(t('admin.approveSuccess').replace('{brand}', store.brand_name));
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const openRejectModal = (store: Store) => {
    setRejectingStore(store);
    setRejectionReason('');
    setRejectError(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingStore) return;

    if (!rejectionReason.trim()) {
      setRejectError(t('admin.rejectReasonRequired'));
      return;
    }

    const res = rejectStore(rejectingStore.id, rejectionReason.trim());
    if (res.success) {
      setActionSuccess(t('admin.rejectSuccess').replace('{brand}', rejectingStore.brand_name));
      setRejectingStore(null);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  return (
    <div className="zf-app min-h-screen bg-[#0A0F12] text-white flex flex-col font-sans">
      <Navbar />

      <main className="zf-main flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Permission Guard Banner */}
        {!isAdmin && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="shrink-0 text-amber-400" />
              <div>
                <strong className="block font-semibold">{t('admin.previewTitle')}</strong>
                <span className="text-xs text-amber-200">
                  {t('admin.previewBodyPrefix')} <code>{userRole}</code>. {t('admin.previewBodyMid')} <strong>Admin</strong> {t('admin.previewBodySuffix')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => switchDemoRole('admin')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              {t('admin.switchToAdmin')}
            </button>
          </div>
        )}

        {/* Success toast */}
        {actionSuccess && (
          <div className="mb-6 p-3.5 rounded-xl bg-teal-500/10 border border-[#4FD1C5]/40 text-[#4FD1C5] text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 size={16} />
            <span className="font-medium">{actionSuccess}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2">
              <Shield size={12} /> {t('admin.badge')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('admin.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t('admin.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">{t('admin.signedInAdmin')}</span>
            <span className="px-2.5 py-1 rounded-md bg-[#162229] border border-white/10 text-indigo-300 font-semibold">
              {currentUser?.full_name || t('admin.guest')}
            </span>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#11191E] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t('admin.metricTotal')}
              </span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">
                {totalCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-300">
              <Users size={18} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#11191E] border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                {t('admin.metricPending')}
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block">
                {pendingCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock size={18} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#11191E] border border-teal-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
                {t('admin.metricApproved')}
              </span>
              <span className="text-2xl font-bold font-mono text-[#4FD1C5] mt-1 block">
                {approvedCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#4FD1C5]">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#11191E] border border-red-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block">
                {t('admin.metricRejected')}
              </span>
              <span className="text-2xl font-bold font-mono text-red-300 mt-1 block">
                {rejectedCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <XCircle size={18} />
            </div>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[#11191E] border border-white/10 text-xs">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#162229] text-[#4FD1C5] font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL'
                  ? `${t('admin.tabAll')} (${totalCount})`
                  : tab === 'PENDING'
                  ? `${t('admin.tabPending')} (${pendingCount})`
                  : tab === 'APPROVED'
                  ? `${t('admin.tabApproved')} (${approvedCount})`
                  : `${t('admin.tabRejected')} (${rejectedCount})`}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.searchPlaceholder')}
              className="w-full h-9 pl-9 pr-3 bg-[#11191E] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#4FD1C5] transition-colors"
            />
          </div>
        </div>

        {/* Applications List Table */}
        <div className="rounded-2xl bg-[#11191E] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A0F12] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">{t('admin.colBrand')}</th>
                  <th className="py-3.5 px-4">{t('admin.colApplicant')}</th>
                  <th className="py-3.5 px-4">{t('admin.colPhone')}</th>
                  <th className="py-3.5 px-4">{t('admin.colAddress')}</th>
                  <th className="py-3.5 px-4">{t('admin.colDoc')}</th>
                  <th className="py-3.5 px-4">{t('admin.colStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      {t('admin.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((store) => {
                    const applicant = profiles.find((p) => p.id === store.user_id);
                    const isPending = store.status === 'PENDING';
                    const isApproved = store.status === 'APPROVED';
                    const isRejected = store.status === 'REJECTED';

                    return (
                      <tr key={store.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Brand info */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white text-sm flex items-center gap-2">
                            <StoreIcon size={15} className="text-[#4FD1C5] shrink-0" />
                            <span>{store.brand_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: {store.id} • {new Date(store.created_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-GB')}
                          </div>
                        </td>

                        {/* Applicant */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-200">
                            {applicant?.full_name || t('admin.unknown')}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {applicant?.email || 'N/A'}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 font-mono text-slate-300">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0F12] border border-white/5">
                            <Phone size={12} className="text-teal-400" />
                            <span>{store.phone}</span>
                          </div>
                        </td>

                        {/* Address */}
                        <td className="py-4 px-4 text-slate-300 max-w-xs truncate" title={store.address}>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        </td>

                        {/* Verification Doc */}
                        <td className="py-4 px-4 max-w-xs truncate">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A0F12] border border-white/5 text-teal-300 font-mono text-[11px] truncate" title={store.verification_doc}>
                            <FileCheck2 size={12} className="shrink-0" />
                            <span className="truncate">{store.verification_doc}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-teal-500/20 text-[#4FD1C5] border border-teal-500/30'
                                : isRejected
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 size={10} />
                            ) : isRejected ? (
                              <XCircle size={10} />
                            ) : (
                              <Clock size={10} />
                            )}
                            {t('admin.status' + store.status, store.status)}
                          </span>
                          {isRejected && store.rejection_reason && (
                            <div className="text-[10px] text-red-300 mt-1 max-w-[200px] truncate" title={store.rejection_reason}>
                              {t('admin.reasonLabel')} {store.rejection_reason}
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-right">
                          {isPending ? (
                            <div className="inline-flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => handleApprove(store)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4FD1C5] hover:bg-[#6fdcd2] text-[#0A0F12] font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                                title={t('admin.approveTitle')}
                              >
                                <Check size={13} strokeWidth={2.5} />
                                <span>{t('admin.approve')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openRejectModal(store)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-semibold text-xs transition-colors cursor-pointer"
                                title={t('admin.rejectTitle')}
                              >
                                <X size={13} strokeWidth={2.5} />
                                <span>{t('admin.reject')}</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <span className="text-[11px] text-[#4FD1C5] font-medium inline-flex items-center gap-1">
                              <CheckCircle2 size={13} /> {t('admin.storeActivated')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-red-400 font-medium inline-flex items-center gap-1">
                              <XCircle size={13} /> {t('admin.rejected')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Reject Reason Modal */}
      {rejectingStore && (
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
          onClick={() => setRejectingStore(null)}
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
              padding: 24,
              color: '#FFFFFF',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

            <button
              type="button"
              onClick={() => setRejectingStore(null)}
              aria-label={t('admin.close')}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t('admin.modalTitle')}</h3>
                <p className="text-xs text-slate-400">{rejectingStore.brand_name}</p>
              </div>
            </div>

            {rejectError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('admin.reasonField')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('admin.reasonPlaceholder')}
                  className="w-full p-3 bg-[#0A0F12] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400 transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {t('admin.reasonHint')}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingStore(null)}
                  className="w-1/2 h-10 rounded-lg bg-[#162229] hover:bg-[#1f2f38] text-slate-300 font-semibold text-xs transition-colors"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 h-10 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md"
                >
                  {t('admin.confirmReject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
