import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck,
  ExternalLink,
  Activity,
  UserCheck,
  Layers,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/common/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import {
  adminApi,
  AdminStoreItem,
  AdminUserItem,
  AdminStats,
  AdminAuditLogItem,
} from '@/services/adminApi';

type AdminMainTab = 'STORES' | 'USERS' | 'AUDIT';
type StoreFilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type UserFilterRole = 'ALL' | 'ADMIN' | 'SHOP_OWNER' | 'USER';

export const AdminPortal: React.FC = () => {
  const { t } = useI18n();
  const { currentUser, userRole } = useAuth();

  // Navigation tabs
  const [mainTab, setMainTab] = useState<AdminMainTab>('STORES');
  const [storeFilterTab, setStoreFilterTab] = useState<StoreFilterTab>('ALL');
  const [userFilterRole, setUserFilterRole] = useState<UserFilterRole>('ALL');

  // Search queries
  const [storeSearch, setStoreSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Live PostgreSQL Data States
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStores: 0,
    pendingStores: 0,
    approvedStores: 0,
    rejectedStores: 0,
    totalMeasurements: 0,
  });
  const [stores, setStores] = useState<AdminStoreItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Action States
  const [rejectingStore, setRejectingStore] = useState<AdminStoreItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewProofImage, setViewProofImage] = useState<{ brand: string; url: string } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isAdmin = userRole === 'admin' || currentUser?.email === 'levanthang0166@gmail.com';

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4500);
  };

  // Fetch all live data from PostgreSQL via backend API
  const fetchLiveData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [statsRes, storesRes, usersRes, logsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getStores(),
        adminApi.getUsers(),
        adminApi.getAuditLogs(30),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (storesRes.success && Array.isArray(storesRes.data)) {
        setStores(storesRes.data);
      }
      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
      if (logsRes.success && Array.isArray(logsRes.data)) {
        setAuditLogs(logsRes.data);
      }
    } catch (err: any) {
      showToast('error', 'Không thể kết nối cơ sở dữ liệu PostgreSQL.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Handle Approve Store
  const handleApproveStore = async (store: AdminStoreItem) => {
    setActionLoadingId(store.id);
    try {
      const res = await adminApi.approveStore(store.id);
      if (res.success) {
        showToast('success', `Đã phê duyệt thành công nhà may "${store.shop_name}".`);
        fetchLiveData(true);
      } else {
        showToast('error', res.error?.message || 'Lỗi khi phê duyệt hồ sơ.');
      }
    } catch {
      showToast('error', 'Lỗi hệ thống khi gửi yêu cầu duyệt.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Store
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingStore) return;
    if (!rejectionReason.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }

    setActionLoadingId(rejectingStore.id);
    try {
      const res = await adminApi.rejectStore(rejectingStore.id, rejectionReason.trim());
      if (res.success) {
        showToast('success', `Đã từ chối hồ sơ nhà may "${rejectingStore.shop_name}".`);
        setRejectingStore(null);
        setRejectionReason('');
        fetchLiveData(true);
      } else {
        showToast('error', res.error?.message || 'Lỗi khi từ chối hồ sơ.');
      }
    } catch {
      showToast('error', 'Lỗi hệ thống khi từ chối hồ sơ.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle User Status (Lock/Unlock)
  const handleToggleUserStatus = async (user: AdminUserItem) => {
    if (user.email === 'levanthang0166@gmail.com') {
      showToast('error', 'Tài khoản Super Administrator không thể bị khóa.');
      return;
    }
    const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setActionLoadingId(user.id);
    try {
      const res = await adminApi.updateUserStatus(user.id, newStatus);
      if (res.success) {
        showToast('success', `Đã chuyển trạng thái người dùng thành ${newStatus}.`);
        fetchLiveData(true);
      } else {
        showToast('error', res.error?.message || 'Không thể đổi trạng thái.');
      }
    } catch {
      showToast('error', 'Lỗi kết nối khi cập nhật người dùng.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Change User Role
  const handleChangeUserRole = async (user: AdminUserItem, newRole: string) => {
    if (user.email === 'levanthang0166@gmail.com' && newRole !== 'ADMIN') {
      showToast('error', 'Không thể hạ quyền của Super Administrator.');
      return;
    }
    setActionLoadingId(user.id);
    try {
      const res = await adminApi.updateUserRole(user.id, newRole);
      if (res.success) {
        showToast('success', `Đã cập nhật vai trò người dùng thành ${newRole}.`);
        fetchLiveData(true);
      } else {
        showToast('error', res.error?.message || 'Không thể cập nhật vai trò.');
      }
    } catch {
      showToast('error', 'Lỗi kết nối khi đổi vai trò.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (storeFilterTab !== 'ALL' && s.status !== storeFilterTab) return false;
      if (!storeSearch.trim()) return true;
      const q = storeSearch.toLowerCase();
      return (
        s.shop_name?.toLowerCase().includes(q) ||
        s.phone_number?.toLowerCase().includes(q) ||
        s.shop_address?.toLowerCase().includes(q) ||
        s.business_license_no?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.owner_email?.toLowerCase().includes(q)
      );
    });
  }, [stores, storeFilterTab, storeSearch]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userFilterRole !== 'ALL' && u.role !== userFilterRole) return false;
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    });
  }, [users, userFilterRole, userSearch]);

  return (
    <div className="min-h-screen bg-[#070B0E] text-slate-100 flex flex-col font-sans selection:bg-[#4FD1C5]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Notification */}
        {actionMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-xl border transition-all animate-fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C151B] via-[#0E1B22] to-[#0A1318] border border-cyan-500/20 p-6 sm:p-8 mb-8 shadow-2xl shadow-cyan-950/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4FD1C5]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-3">
                <ShieldCheck size={14} className="text-[#4FD1C5]" />
                <span>FitVision 3D • Super Admin Platform Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Cổng Điều Hành & Quản Trị Hệ&nbsp;Thống
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Đồng bộ trực tiếp cơ sở dữ liệu PostgreSQL thực tế, xét duyệt nhà may đo 3D theo chuẩn ISO 8559 và phân quyền tài khoản người dùng.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* PostgreSQL Live Badge */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0F1E24] border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>PostgreSQL: Kết nối thực</span>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchLiveData(false)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#14232C] hover:bg-[#1A2E3A] border border-slate-700 hover:border-cyan-500/40 text-slate-200 hover:text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
                <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
              </button>

              {/* Customer View Link */}
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F1E24] hover:bg-[#152B34] border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-[#4FD1C5] text-xs font-medium transition"
              >
                <ExternalLink size={13} />
                <span>Xem phòng đo 3D (Khách)</span>
              </Link>

              {/* Logged in admin pill */}
              <div className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300">
                <span className="text-slate-400">Admin: </span>
                <span className="font-semibold text-cyan-300">{currentUser?.full_name || 'Lê Văn Thắng'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Metrics Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Stores */}
          <div className="relative group overflow-hidden rounded-xl bg-[#0D161B] border border-slate-800 hover:border-cyan-500/40 p-4 transition duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng nhà may</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <StoreIcon size={18} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              {stats.totalStores}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Hồ sơ đối tác đã nộp</span>
          </div>

          {/* Pending Reviews */}
          <div className="relative group overflow-hidden rounded-xl bg-[#0D161B] border border-amber-500/20 hover:border-amber-500/50 p-4 transition duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-300/80 uppercase tracking-wider">Chờ xét duyệt</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock size={18} className="animate-pulse" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
              {stats.pendingStores}
            </div>
            <span className="text-[11px] text-amber-300/70 mt-1 block">Cần quản trị viên duyệt</span>
          </div>

          {/* Approved Stores */}
          <div className="relative group overflow-hidden rounded-xl bg-[#0D161B] border border-emerald-500/20 hover:border-emerald-500/50 p-4 transition duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-300/80 uppercase tracking-wider">Đã kích hoạt</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
              {stats.approvedStores}
            </div>
            <span className="text-[11px] text-emerald-300/70 mt-1 block">Đang hoạt động trên sàn</span>
          </div>

          {/* Total Registered Users */}
          <div className="relative group overflow-hidden rounded-xl bg-[#0D161B] border border-indigo-500/20 hover:border-indigo-500/50 p-4 transition duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-300/80 uppercase tracking-wider">Người dùng</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-indigo-300">
              {stats.totalUsers}
            </div>
            <span className="text-[11px] text-indigo-300/70 mt-1 block">Tài khoản trong CSDL</span>
          </div>

          {/* Biometric Scans */}
          <div className="relative group overflow-hidden rounded-xl bg-[#0D161B] border border-purple-500/20 hover:border-purple-500/50 p-4 transition duration-300 shadow-lg col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-300/80 uppercase tracking-wider">Phép đo 3D</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Activity size={18} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-purple-300">
              {stats.totalMeasurements}
            </div>
            <span className="text-[11px] text-purple-300/70 mt-1 block">Trích xuất nhân trắc</span>
          </div>
        </div>

        {/* Main Navigation Tabs - Sáng sủa, Đẳng cấp & Nổi bật */}
        <div className="flex flex-wrap items-center gap-3.5 mb-8 p-2 rounded-2xl bg-[#091217] border border-slate-700/80 shadow-2xl">
          {/* TAB 1: STORES */}
          <button
            type="button"
            onClick={() => setMainTab('STORES')}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              mainTab === 'STORES'
                ? 'bg-gradient-to-r from-[#20E3B2] via-[#00D2B4] to-[#38BDF8] text-[#021518] shadow-[0_4px_25px_rgba(32,227,178,0.5)] border border-teal-200 scale-[1.02]'
                : 'bg-[#13232C] hover:bg-[#1C323F] text-slate-100 hover:text-white border border-slate-700/90 hover:border-teal-400/60 shadow-md'
            }`}
          >
            <StoreIcon
              size={19}
              className={mainTab === 'STORES' ? 'text-[#021518] stroke-[2.4]' : 'text-[#20E3B2] stroke-[2]'}
            />
            <span className="tracking-wide">Hồ sơ Nhà may / Cửa hàng</span>
            {stats.pendingStores > 0 ? (
              <span
                className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black font-mono transition shadow-md ${
                  mainTab === 'STORES'
                    ? 'bg-[#021518] text-[#20E3B2]'
                    : 'bg-amber-400 text-slate-950 animate-bounce'
                }`}
              >
                {stats.pendingStores} mới
              </span>
            ) : (
              <span
                className={`ml-1 px-2 py-0.5 rounded-md text-xs font-bold font-mono transition ${
                  mainTab === 'STORES'
                    ? 'bg-[#021518]/25 text-[#021518]'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {stores.length}
              </span>
            )}
          </button>

          {/* TAB 2: USERS */}
          <button
            type="button"
            onClick={() => setMainTab('USERS')}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              mainTab === 'USERS'
                ? 'bg-gradient-to-r from-[#818CF8] via-[#6366F1] to-[#38BDF8] text-[#050814] shadow-[0_4px_25px_rgba(99,102,241,0.5)] border border-indigo-200 scale-[1.02]'
                : 'bg-[#13232C] hover:bg-[#1C323F] text-slate-100 hover:text-white border border-slate-700/90 hover:border-indigo-400/60 shadow-md'
            }`}
          >
            <Users
              size={19}
              className={mainTab === 'USERS' ? 'text-[#050814] stroke-[2.4]' : 'text-[#818CF8] stroke-[2]'}
            />
            <span className="tracking-wide">Quản lý Người dùng & Phân quyền</span>
            <span
              className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black font-mono transition shadow-md ${
                mainTab === 'USERS'
                  ? 'bg-[#050814] text-[#818CF8]'
                  : 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              {users.length}
            </span>
          </button>

          {/* TAB 3: AUDIT */}
          <button
            type="button"
            onClick={() => setMainTab('AUDIT')}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              mainTab === 'AUDIT'
                ? 'bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#FB923C] text-[#140D01] shadow-[0_4px_25px_rgba(245,158,11,0.5)] border border-amber-200 scale-[1.02]'
                : 'bg-[#13232C] hover:bg-[#1C323F] text-slate-100 hover:text-white border border-slate-700/90 hover:border-amber-400/60 shadow-md'
            }`}
          >
            <Shield
              size={19}
              className={mainTab === 'AUDIT' ? 'text-[#140D01] stroke-[2.4]' : 'text-[#FBBF24] stroke-[2]'}
            />
            <span className="tracking-wide">Nhật ký Kiểm toán Hệ thống</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-md text-xs font-bold font-mono transition ${
                mainTab === 'AUDIT'
                  ? 'bg-[#140D01]/25 text-[#140D01]'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              Live
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: STORES MANAGEMENT */}
        {/* ========================================================================= */}
        {mainTab === 'STORES' && (
          <div className="space-y-4">
            {/* Store Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D161B] border border-slate-800">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: 'Tất cả hồ sơ', count: stores.length },
                  { key: 'PENDING', label: 'Chờ duyệt', count: stores.filter((s) => s.status === 'PENDING').length },
                  { key: 'APPROVED', label: 'Đã duyệt', count: stores.filter((s) => s.status === 'APPROVED').length },
                  { key: 'REJECTED', label: 'Từ chối', count: stores.filter((s) => s.status === 'REJECTED').length },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStoreFilterTab(item.key as StoreFilterTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      storeFilterTab === item.key
                        ? 'bg-[#20E3B2] text-[#021417] shadow-[0_2px_14px_rgba(32,227,178,0.4)] border border-teal-200'
                        : 'bg-[#14232C] hover:bg-[#1C303C] text-slate-100 hover:text-white border border-slate-700 hover:border-teal-400/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                        storeFilterTab === item.key
                          ? 'bg-[#021417] text-[#20E3B2]'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Tìm theo tên xưởng, SĐT, GPKD..."
                  className="w-full bg-[#080E12] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4FD1C5] transition"
                />
                {storeSearch && (
                  <button
                    onClick={() => setStoreSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Stores Table */}
            <div className="overflow-hidden rounded-xl bg-[#0D161B] border border-slate-800 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080E12] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Thương hiệu / Cửa hàng</th>
                      <th className="py-3.5 px-4 font-semibold">Chủ sở hữu & Đại diện</th>
                      <th className="py-3.5 px-4 font-semibold">Địa chỉ & Liên hệ</th>
                      <th className="py-3.5 px-4 font-semibold">Hồ sơ Pháp lý / GPKD</th>
                      <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Thao tác duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <StoreIcon size={32} className="mx-auto text-slate-600 mb-2" />
                          <p className="text-sm font-medium">Không tìm thấy hồ sơ cửa hàng nào phù hợp.</p>
                          <p className="text-xs text-slate-400 mt-1">Dữ liệu được lấy theo thời gian thực từ bảng `shops` trong PostgreSQL.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((store) => {
                        const isPending = store.status === 'PENDING';
                        const isApproved = store.status === 'APPROVED';
                        const isRejected = store.status === 'REJECTED';
                        const isBusy = actionLoadingId === store.id;

                        return (
                          <tr
                            key={store.id}
                            className="hover:bg-slate-800/20 transition duration-150 group"
                          >
                            {/* Brand Name */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-[#4FD1C5] font-bold text-sm shrink-0">
                                  {store.shop_name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div>
                                  <div className="font-semibold text-white group-hover:text-[#4FD1C5] transition text-sm">
                                    {store.shop_name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    ID: {store.id.substring(0, 13)}...
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Owner details */}
                            <td className="py-4 px-4">
                              <div className="text-slate-200 font-medium">{store.owner_name || 'Khách nộp đơn'}</div>
                              <div className="text-[11px] font-mono text-slate-400">{store.owner_email || '—'}</div>
                              {store.owner_role && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300">
                                  ROLE: {store.owner_role}
                                </span>
                              )}
                            </td>

                            {/* Phone & Address */}
                            <td className="py-4 px-4 text-slate-300">
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Phone size={12} className="text-cyan-400 shrink-0" />
                                <span className="font-mono text-xs">{store.phone_number}</span>
                              </div>
                              <div className="flex items-start gap-1.5 text-[11px] text-slate-400 mt-1 max-w-xs">
                                <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{store.shop_address}</span>
                              </div>
                            </td>

                            {/* Verification Doc / Tax Code / Image Proof */}
                            <td className="py-4 px-4 text-slate-300">
                              {(() => {
                                const raw = store.business_license_no || '';
                                const hasImage = raw.includes('data:image') || raw.includes('http://') || raw.includes('https://');
                                const textPart = raw.includes('|') ? raw.split('|')[0].trim() : (hasImage ? '' : raw);
                                const imagePart = hasImage ? (raw.includes('|') ? raw.split('|')[1].trim() : raw) : null;

                                return (
                                  <div className="flex flex-col gap-1.5">
                                    {textPart && (
                                      <div className="flex items-center gap-1.5">
                                        <FileCheck2 size={13} className="text-emerald-400 shrink-0" />
                                        <span className="font-mono text-xs font-semibold text-slate-200">
                                          {textPart}
                                        </span>
                                      </div>
                                    )}
                                    {imagePart && (
                                      <button
                                        type="button"
                                        onClick={() => setViewProofImage({ brand: store.shop_name, url: imagePart })}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition cursor-pointer w-fit"
                                      >
                                        <span>👁️ Xem ảnh minh chứng</span>
                                      </button>
                                    )}
                                    {!textPart && !imagePart && (
                                      <span className="text-xs text-slate-400">Đang cập nhật</span>
                                    )}
                                    {store.tax_code && (
                                      <div className="text-[10px] font-mono text-slate-400">
                                        Mã số thuế: {store.tax_code}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {isPending && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  <Clock size={12} className="animate-pulse" />
                                  <span>Chờ duyệt</span>
                                </span>
                              )}
                              {isApproved && (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 size={12} />
                                    <span>Đã duyệt</span>
                                  </span>
                                  {store.approved_at && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                                      {new Date(store.approved_at).toLocaleDateString('vi-VN')}
                                    </div>
                                  )}
                                </div>
                              )}
                              {isRejected && (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                                    <XCircle size={12} />
                                    <span>Từ chối</span>
                                  </span>
                                  {store.rejection_reason && (
                                    <p className="text-[10px] text-rose-400/80 mt-1 max-w-[160px] line-clamp-2" title={store.rejection_reason}>
                                      Lý do: {store.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              {isPending && (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleApproveStore(store)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50"
                                  >
                                    <Check size={13} />
                                    <span>Duyệt</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setRejectingStore(store);
                                      setRejectionReason('');
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs transition cursor-pointer disabled:opacity-50"
                                  >
                                    <X size={13} />
                                    <span>Từ chối</span>
                                  </button>
                                </div>
                              )}

                              {isApproved && (
                                <div className="text-[11px] text-emerald-400/80 font-mono">
                                  ● Tài khoản Shop Owner Active
                                </div>
                              )}

                              {isRejected && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleApproveStore(store)}
                                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                                >
                                  Xét duyệt lại
                                </button>
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USER MANAGEMENT */}
        {/* ========================================================================= */}
        {mainTab === 'USERS' && (
          <div className="space-y-4">
            {/* User Filter & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D161B] border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: 'Tất cả người dùng', count: users.length },
                  { key: 'ADMIN', label: 'Quản trị viên (Admin)', count: users.filter((u) => u.role === 'ADMIN').length },
                  { key: 'SHOP_OWNER', label: 'Chủ xưởng may (Shop Owner)', count: users.filter((u) => u.role === 'SHOP_OWNER').length },
                  { key: 'USER', label: 'Khách hàng (User)', count: users.filter((u) => u.role === 'USER').length },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setUserFilterRole(item.key as UserFilterRole)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      userFilterRole === item.key
                        ? 'bg-[#818CF8] text-[#050814] shadow-[0_2px_14px_rgba(99,102,241,0.4)] border border-indigo-200'
                        : 'bg-[#14232C] hover:bg-[#1C303C] text-slate-100 hover:text-white border border-slate-700 hover:border-indigo-400/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                        userFilterRole === item.key
                          ? 'bg-[#050814] text-[#818CF8]'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* User search input */}
              <div className="relative w-full md:w-80">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm theo tên, email người dùng..."
                  className="w-full bg-[#080E12] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4FD1C5] transition"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl bg-[#0D161B] border border-slate-800 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080E12] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Tài khoản & Email</th>
                      <th className="py-3.5 px-4 font-semibold">Họ và tên</th>
                      <th className="py-3.5 px-4 font-semibold">Phân quyền (RBAC)</th>
                      <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                      <th className="py-3.5 px-4 font-semibold">Ngày tạo tài khoản</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Hành động quản lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user) => {
                      const isSuperAdmin = user.email === 'levanthang0166@gmail.com';
                      const isLocked = user.status === 'LOCKED' || user.status === 'BANNED';
                      const isBusy = actionLoadingId === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/20 transition duration-150">
                          {/* Email & Initial */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  user.role === 'ADMIN'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                    : user.role === 'SHOP_OWNER'
                                    ? 'bg-cyan-500/20 text-[#4FD1C5] border border-cyan-500/40'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-mono text-xs font-semibold text-white flex items-center gap-1.5">
                                  <span>{user.email}</span>
                                  {isSuperAdmin && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      SUPER ADMIN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  UUID: {user.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Full Name */}
                          <td className="py-4 px-4 font-medium text-slate-200">
                            {user.full_name || 'Chưa cập nhật'}
                          </td>

                          {/* Role Badge & Selector */}
                          <td className="py-4 px-4">
                            {user.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                <Shield size={12} />
                                <span>ADMINISTRATOR</span>
                              </span>
                            ) : user.role === 'SHOP_OWNER' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-[#4FD1C5] border border-cyan-500/30">
                                <StoreIcon size={12} />
                                <span>SHOP_OWNER</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                <Users size={12} />
                                <span>CUSTOMER_USER</span>
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {user.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>Hoạt động</span>
                              </span>
                            ) : user.status === 'PENDING_VERIFY' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                <span>Chờ xác thực</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                                <Lock size={11} />
                                <span>Đã khóa</span>
                              </span>
                            )}
                          </td>

                          {/* Created at */}
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                            {new Date(user.created_at).toLocaleString('vi-VN')}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {!isSuperAdmin ? (
                              <div className="inline-flex items-center gap-2">
                                {/* Lock/Unlock button */}
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`p-1.5 rounded-lg border text-xs transition cursor-pointer disabled:opacity-50 ${
                                    isLocked
                                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
                                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/60'
                                  }`}
                                  title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                >
                                  {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                </button>

                                {/* Switch role button */}
                                {user.role === 'USER' ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleChangeUserRole(user, 'SHOP_OWNER')}
                                    className="px-2.5 py-1 rounded bg-[#0E1E26] hover:bg-[#142A36] border border-cyan-500/30 text-[#4FD1C5] text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                                  >
                                    Cấp quyền Shop
                                  </button>
                                ) : user.role === 'SHOP_OWNER' ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleChangeUserRole(user, 'USER')}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] transition cursor-pointer disabled:opacity-50"
                                  >
                                    Thu hồi Shop
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-300/70 font-mono">
                                [Bảo vệ Toàn quyền]
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AUDIT LOGS */}
        {/* ========================================================================= */}
        {mainTab === 'AUDIT' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0D161B] border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Nhật ký Kiểm toán Hệ thống (Audit Trails)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lưu trữ các thao tác quan trọng: duyệt nhà may, thay đổi trạng thái người dùng theo tiêu chuẩn an ninh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchLiveData(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
              >
                <RefreshCw size={13} />
                <span>Cập nhật</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-[#0D161B] border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080E12] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Mã nhật ký</th>
                      <th className="py-3 px-4 font-semibold">Hành động (Action)</th>
                      <th className="py-3 px-4 font-semibold">Tác nhân (Actor)</th>
                      <th className="py-3 px-4 font-semibold">Thời gian xử lý</th>
                      <th className="py-3 px-4 font-semibold">Mã hóa IP Hash</th>
                      <th className="py-3 px-4 font-semibold">Thời gian ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                          Chưa có sự kiện kiểm toán mới nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/20">
                          <td className="py-3 px-4 text-slate-400">#{log.id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950/60 text-[#4FD1C5] border border-cyan-500/30">
                              {log.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-200 font-sans">
                            {log.user_email || log.user_id ? `${log.user_email || log.user_id}` : 'System / Background'}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {log.execution_time_ms} ms
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400">
                            {log.ip_address_hash || 'local'}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Rejection Reason */}
        {rejectingStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-[#0F171C] border border-rose-500/30 p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setRejectingStore(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Từ chối hồ sơ đối tác</h3>
                  <p className="text-xs text-slate-400">
                    Cửa hàng: <strong className="text-rose-300">{rejectingStore.shop_name}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Lý do từ chối (Gửi thông báo tới chủ nhà may):
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ví dụ: Giấy phép kinh doanh không khớp thông tin đại diện pháp luật, số điện thoại không liên lạc được..."
                    className="w-full bg-[#080E12] border border-slate-700 focus:border-rose-500 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectingStore(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-rose-950/50"
                  >
                    Xác nhận Từ chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xem ảnh Minh chứng Pháp lý / GPKD */}
        {viewProofImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setViewProofImage(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-[#11191E] border border-white/20 rounded-2xl p-5 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="text-amber-400" size={20} />
                  <h3 className="text-base font-bold text-white">
                    Ảnh minh chứng: {viewProofImage.brand}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewProofImage(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-lg bg-black/60 p-2 flex items-center justify-center">
                <img
                  src={viewProofImage.url}
                  alt={`Minh chứng ${viewProofImage.brand}`}
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
