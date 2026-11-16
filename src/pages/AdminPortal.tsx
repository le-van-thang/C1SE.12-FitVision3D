import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Activity,
  UserCheck,
  Layers,
  Database,
  Calendar,
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Megaphone,
  LogOut,
  Menu,
  Scissors,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import {
  loadPlatformConfig,
  savePlatformConfig,
  type PlatformConfig,
} from '@/services/platformConfig';
import {
  AdminOverviewSection,
  AdminOrdersSection,
  AdminCatalogSection,
  AdminCmsSection,
} from '@/components/admin/AdminOperationsTabs';
import {
  adminApi,
  AdminStoreItem,
  AdminUserItem,
  AdminStats,
  AdminAuditLogItem,
} from '@/services/adminApi';

export type AdminMainTab =
  | 'OVERVIEW'
  | 'STORES'
  | 'USERS'
  | 'ORDERS'
  | 'CATALOG'
  | 'CMS'
  | 'AUDIT';
type StoreFilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type UserFilterRole = 'ALL' | 'ADMIN' | 'SHOP_OWNER' | 'USER';

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, signOut } = useAuth();
  const { orders, updateOrderStatus } = useOrders();

  // Navigation tabs & Responsive Sidebar Drawer
  const [mainTab, setMainTab] = useState<AdminMainTab>('OVERVIEW');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() => loadPlatformConfig());
  const [storeFilterTab, setStoreFilterTab] = useState<StoreFilterTab>('ALL');
  const [userFilterRole, setUserFilterRole] = useState<UserFilterRole>('ALL');

  const handleSavePlatformConfig = (next: PlatformConfig) => {
    setPlatformConfig(next);
    savePlatformConfig(next);
  };

  const handleAdminSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

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

  const sidebarGroups: {
    groupLabel: string;
    items: {
      id: AdminMainTab;
      label: string;
      icon: React.ReactNode;
      badge?: string | number;
      badgeTone?: 'amber' | 'blue' | 'emerald';
    }[];
  }[] = [
    {
      groupLabel: 'Vận Hành & Thương Mại',
      items: [
        {
          id: 'OVERVIEW',
          label: 'Tổng Quan Sàn',
          icon: <LayoutDashboard size={16} />,
        },
        {
          id: 'ORDERS',
          label: 'Đơn Hàng Toàn Sàn',
          icon: <ShoppingBag size={16} />,
          badge: orders.filter((o) => o.status === 'pending' || o.status === 'tailoring').length || orders.length,
          badgeTone: orders.some((o) => o.status === 'pending') ? 'amber' : 'blue',
        },
        {
          id: 'CATALOG',
          label: 'Sản Phẩm & Giá',
          icon: <Tag size={16} />,
          badge: platformConfig.hiddenProductIds.length > 0 ? `${platformConfig.hiddenProductIds.length} ẩn` : undefined,
          badgeTone: 'amber',
        },
        {
          id: 'CMS',
          label: 'Banner & Voucher',
          icon: <Megaphone size={16} />,
          badge: platformConfig.vouchers.filter((v) => v.active).length,
          badgeTone: 'emerald',
        },
      ],
    },
    {
      groupLabel: 'Quản Trị Hệ Thống',
      items: [
        {
          id: 'STORES',
          label: 'Duyệt Nhà May',
          icon: <StoreIcon size={16} />,
          badge: stats.pendingStores > 0 ? `${stats.pendingStores} mới` : stores.length,
          badgeTone: stats.pendingStores > 0 ? 'amber' : 'blue',
        },
        {
          id: 'USERS',
          label: 'Tài Khoản & Quyền',
          icon: <Users size={16} />,
          badge: users.length,
          badgeTone: 'blue',
        },
        {
          id: 'AUDIT',
          label: 'Nhật Ký Hệ Thống',
          icon: <Shield size={16} />,
          badge: 'Live',
          badgeTone: 'emerald',
        },
      ],
    },
  ];

  const activeSectionMeta: Record<AdminMainTab, { title: string; subtitle: string }> = {
    OVERVIEW: {
      title: 'Tổng Quan Điều Hành Sàn',
      subtitle: 'Theo dõi doanh thu GMV, tỷ lệ hoàn thành đơn may đo, hàng chờ xét duyệt và tình trạng toàn hệ thống.',
    },
    ORDERS: {
      title: 'Điều Phối Đơn Hàng Toàn Sàn',
      subtitle: 'Giám sát mọi đơn may đo xuyên suốt các nhà may đối tác và cập nhật tiến độ xử lý theo thời gian thực.',
    },
    CATALOG: {
      title: 'Kiểm Duyệt Sản Phẩm & Giá Bán',
      subtitle: 'Ẩn/hiện sản phẩm vi phạm hoặc hết vải và điều chỉnh giá niêm yết đồng bộ tức thì lên trang Khách hàng.',
    },
    CMS: {
      title: 'Quản Lý Banner, Marquee & Voucher',
      subtitle: 'Chỉnh sửa thanh thông báo chạy, thông điệp Hero trang chủ và phát hành mã giảm giá cho Checkout.',
    },
    STORES: {
      title: 'Thẩm Định & Xét Duyệt Nhà May Đối Tác',
      subtitle: 'Kiểm tra ảnh minh chứng, địa chỉ Atelier và phê duyệt/từ chối hồ sơ đăng ký bán hàng.',
    },
    USERS: {
      title: 'Quản Lý Tài Khoản & Phân Quyền RBAC',
      subtitle: 'Điều chỉnh vai trò Admin / Chủ Shop / Khách hàng và khóa tạm thời tài khoản vi phạm trên PostgreSQL.',
    },
    AUDIT: {
      title: 'Nhật Ký Kiểm Toán & Bảo Mật Hệ Thống',
      subtitle: 'Truy vết thao tác quản trị, thời gian phản hồi hệ thống và toàn bộ biến động quyền hạn.',
    },
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#14171C] text-white">
      {/* Sidebar Brand Header (Matches Homepage Obsidian Header) */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Scissors size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-[15px]">FITVISION 3D</span>
              <span className="px-1.5 py-0.5 rounded bg-[#C8963E]/20 border border-[#C8963E]/50 text-[9px] font-black text-amber-200 uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] tracking-[0.14em] uppercase text-stone-400">Atelier Control</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups (Compact spacing so zero ugly scrollbar) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
        {sidebarGroups.map((group) => (
          <div key={group.groupLabel}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              {group.groupLabel}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = mainTab === item.id;
                const badgeCls =
                  item.badgeTone === 'amber'
                    ? isActive
                      ? 'bg-[#C8963E] text-white'
                      : 'bg-amber-400 text-[#14171C]'
                    : item.badgeTone === 'emerald'
                    ? isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white/10 text-stone-300';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMainTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#14171C] shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-blue-600' : 'text-stone-400'}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono shrink-0 ${badgeCls}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Admin Account & Sign Out */}
      <div className="p-3.5 border-t border-white/10 bg-[#0E1116] space-y-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {(currentUser?.full_name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {currentUser?.full_name || 'Lê Văn Thắng'}
            </p>
            <p className="text-[10px] text-amber-200/90 font-mono truncate">
              {currentUser?.email || 'Super Administrator'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAdminSignOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-600 border border-white/10 hover:border-rose-500 text-stone-200 hover:text-white text-xs font-bold transition cursor-pointer"
        >
          <LogOut size={13} />
          <span>Đăng xuất Quản trị viên</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] flex font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Desktop Fixed Admin Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#14171C] border-r border-stone-800 z-30 shadow-xl">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Slide Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#14171C] border-r border-stone-800 h-full z-10 flex flex-col">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-3.5 right-3 w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Right Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Clean White Admin Header Bar (Matches Homepage White Nav Band) */}
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer"
              aria-label="Mở menu quản trị"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                <span className="truncate font-semibold text-slate-600">
                  Cổng Điều Hành FitVision 3D
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-[#14161A] font-extrabold truncate">
                  {activeSectionMeta[mainTab].title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>PostgreSQL: Kết nối thực</span>
            </div>

            <button
              type="button"
              onClick={() => fetchLiveData(false)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
              <span className="hidden sm:inline">{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Toast Notification */}
          {actionMessage && (
            <div
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border transition-all animate-fade-in ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              )}
              <span className="text-sm font-bold">{actionMessage.text}</span>
              <button
                onClick={() => setActionMessage(null)}
                className="ml-2 text-slate-400 hover:text-slate-800"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Active Page Header Banner */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/90">
            <div>
              <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#14161A]">
                {activeSectionMeta[mainTab].title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {activeSectionMeta[mainTab].subtitle}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-slate-600 shadow-2xs shrink-0">
              <span>Role:</span>
              <strong className="text-blue-600 uppercase">{userRole || 'ADMIN'}</strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 0: PLATFORM OVERVIEW */}
          {/* ========================================================================= */}
          {mainTab === 'OVERVIEW' && (
            <AdminOverviewSection
              stats={stats}
              stores={stores}
              orders={orders}
              config={platformConfig}
              onNavigateTab={(tab) => setMainTab(tab)}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PLATFORM ORDERS */}
          {/* ========================================================================= */}
          {mainTab === 'ORDERS' && (
            <AdminOrdersSection
              orders={orders}
              onUpdateStatus={updateOrderStatus}
              onToast={showToast}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CATALOG MODERATION */}
          {/* ========================================================================= */}
          {mainTab === 'CATALOG' && (
            <AdminCatalogSection
              config={platformConfig}
              onSaveConfig={handleSavePlatformConfig}
              onToast={showToast}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CMS BANNER & VOUCHERS */}
          {/* ========================================================================= */}
          {mainTab === 'CMS' && (
            <AdminCmsSection
              config={platformConfig}
              onSaveConfig={handleSavePlatformConfig}
              onToast={showToast}
            />
          )}

        {/* ========================================================================= */}
        {/* TAB 1: STORES MANAGEMENT */}
        {/* ========================================================================= */}
        {mainTab === 'STORES' && (
          <div className="space-y-4">
            {/* Store Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      storeFilterTab === item.key
                        ? 'bg-[#14171C] text-white border-[#14171C] shadow-xs'
                        : 'bg-[#F7F7F5] hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                        storeFilterTab === item.key
                          ? 'bg-amber-400 text-[#14171C]'
                          : 'bg-white text-slate-600 border border-slate-200'
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
                  className="w-full bg-[#F7F7F5] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
                {storeSearch && (
                  <button
                    onClick={() => setStoreSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Stores Table */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Thương hiệu / Cửa hàng</th>
                      <th className="py-3.5 px-4 font-bold">Chủ sở hữu & Đại diện</th>
                      <th className="py-3.5 px-4 font-bold">Địa chỉ & Liên hệ</th>
                      <th className="py-3.5 px-4 font-bold">Hồ sơ Pháp lý / GPKD</th>
                      <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                      <th className="py-3.5 px-4 font-bold text-right">Thao tác duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <StoreIcon size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-semibold text-slate-700">Không tìm thấy hồ sơ cửa hàng nào phù hợp.</p>
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
                            className="hover:bg-slate-50/80 transition duration-150 group"
                          >
                            {/* Brand Name */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#9A6E24] font-bold text-sm shrink-0">
                                  {store.shop_name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div>
                                  <div className="font-bold text-[#14161A] group-hover:text-blue-600 transition text-sm">
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
                              <div className="text-[#14161A] font-semibold">{store.owner_name || 'Khách nộp đơn'}</div>
                              <div className="text-[11px] font-mono text-slate-500">{store.owner_email || '—'}</div>
                              {store.owner_role && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  ROLE: {store.owner_role}
                                </span>
                              )}
                            </td>

                            {/* Phone & Address */}
                            <td className="py-4 px-4 text-slate-700">
                              <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                <Phone size={12} className="text-blue-600 shrink-0" />
                                <span className="font-mono text-xs">{store.phone_number}</span>
                              </div>
                              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1 max-w-xs">
                                <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{store.shop_address}</span>
                              </div>
                            </td>

                            {/* Verification Doc / Tax Code / Image Proof */}
                            <td className="py-4 px-4 text-slate-700">
                              {(() => {
                                const raw = store.business_license_no || '';
                                const hasImage = raw.includes('data:image') || raw.includes('http://') || raw.includes('https://');
                                const textPart = raw.includes('|') ? raw.split('|')[0].trim() : (hasImage ? '' : raw);
                                const imagePart = hasImage ? (raw.includes('|') ? raw.split('|')[1].trim() : raw) : null;

                                return (
                                  <div className="flex flex-col gap-1.5">
                                    {textPart && (
                                      <div className="flex items-center gap-1.5">
                                        <FileCheck2 size={13} className="text-emerald-600 shrink-0" />
                                        <span className="font-mono text-xs font-bold text-[#14161A]">
                                          {textPart}
                                        </span>
                                      </div>
                                    )}
                                    {imagePart && (
                                      <button
                                        type="button"
                                        onClick={() => setViewProofImage({ brand: store.shop_name, url: imagePart })}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#9A6E24] border border-amber-200 text-[11px] font-bold transition cursor-pointer w-fit whitespace-nowrap"
                                      >
                                        <span>Xem ảnh minh chứng</span>
                                      </button>
                                    )}
                                    {!textPart && !imagePart && (
                                      <span className="text-xs text-slate-400">Đang cập nhật</span>
                                    )}
                                    {store.tax_code && (
                                      <div className="text-[10px] font-mono text-slate-500">
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                  <Clock size={12} />
                                  <span>Chờ duyệt</span>
                                </span>
                              )}
                              {isApproved && (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
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
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                    <XCircle size={12} />
                                    <span>Từ chối</span>
                                  </span>
                                  {store.rejection_reason && (
                                    <p className="text-[10px] text-rose-600 mt-1 max-w-[160px] line-clamp-2" title={store.rejection_reason}>
                                      Lý do: {store.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              {isPending && (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleApproveStore(store)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs disabled:opacity-50 whitespace-nowrap"
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
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                  >
                                    <X size={13} />
                                    <span>Từ chối</span>
                                  </button>
                                </div>
                              )}

                              {isApproved && (
                                <div className="text-[11px] text-emerald-700 font-mono font-semibold whitespace-nowrap">
                                  ● Shop Owner Active
                                </div>
                              )}

                              {isRejected && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleApproveStore(store)}
                                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      userFilterRole === item.key
                        ? 'bg-[#14171C] text-white border-[#14171C] shadow-xs'
                        : 'bg-[#F7F7F5] hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                        userFilterRole === item.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
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
                  className="w-full bg-[#F7F7F5] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Tài khoản & Email</th>
                      <th className="py-3.5 px-4 font-bold">Họ và tên</th>
                      <th className="py-3.5 px-4 font-bold">Phân quyền (RBAC)</th>
                      <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                      <th className="py-3.5 px-4 font-bold">Ngày tạo tài khoản</th>
                      <th className="py-3.5 px-4 font-bold text-right">Hành động quản lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const isSuperAdmin = user.email === 'levanthang0166@gmail.com';
                      const isLocked = user.status === 'LOCKED' || user.status === 'BANNED';
                      const isBusy = actionLoadingId === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition duration-150">
                          {/* Email & Initial */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  user.role === 'ADMIN'
                                    ? 'bg-blue-600 text-white'
                                    : user.role === 'SHOP_OWNER'
                                    ? 'bg-amber-100 text-[#9A6E24] border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-mono text-xs font-bold text-[#14161A] flex items-center gap-1.5">
                                  <span>{user.email}</span>
                                  {isSuperAdmin && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-[#9A6E24] border border-amber-300">
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
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            {user.full_name || 'Chưa cập nhật'}
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-4">
                            {user.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                <Shield size={12} />
                                <span>ADMINISTRATOR</span>
                              </span>
                            ) : user.role === 'SHOP_OWNER' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-[#9A6E24] border border-amber-200 whitespace-nowrap">
                                <StoreIcon size={12} />
                                <span>SHOP_OWNER</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                                <Users size={12} />
                                <span>CUSTOMER_USER</span>
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {user.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Hoạt động</span>
                              </span>
                            ) : user.status === 'PENDING_VERIFY' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span>Chờ xác thực</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                <Lock size={11} />
                                <span>Đã khóa</span>
                              </span>
                            )}
                          </td>

                          {/* Created at */}
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(user.created_at).toLocaleString('vi-VN')}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {!isSuperAdmin ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`p-1.5 rounded-lg border text-xs transition cursor-pointer disabled:opacity-50 ${
                                    isLocked
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                >
                                  {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                </button>

                                {user.role === 'USER' ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleChangeUserRole(user, 'SHOP_OWNER')}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#14171C] hover:bg-blue-600 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                                  >
                                    Cấp quyền Shop
                                  </button>
                                ) : user.role === 'SHOP_OWNER' ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleChangeUserRole(user, 'USER')}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                                  >
                                    Thu hồi Shop
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#9A6E24] font-mono font-bold">
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
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-[#14161A] text-sm">Nhật ký Kiểm toán Hệ thống (Audit Trails)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưu trữ các thao tác quan trọng: duyệt nhà may, thay đổi trạng thái người dùng theo tiêu chuẩn an ninh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchLiveData(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7F7F5] hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shrink-0"
              >
                <RefreshCw size={13} />
                <span>Cập nhật</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Mã nhật ký</th>
                      <th className="py-3.5 px-4 font-bold">Hành động (Action)</th>
                      <th className="py-3.5 px-4 font-bold">Tác nhân (Actor)</th>
                      <th className="py-3.5 px-4 font-bold">Thời gian xử lý</th>
                      <th className="py-3.5 px-4 font-bold">Mã hóa IP Hash</th>
                      <th className="py-3.5 px-4 font-bold">Thời gian ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500 font-sans">
                          Chưa có sự kiện kiểm toán mới nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 text-slate-500 font-bold">#{log.id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {log.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#14161A] font-semibold font-sans">
                            {log.user_email || log.user_id ? `${log.user_email || log.user_id}` : 'System / Background'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {log.execution_time_ms} ms
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-500">
                            {log.ip_address_hash || 'local'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setRejectingStore(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#14161A]">Từ chối hồ sơ đối tác</h3>
                  <p className="text-xs text-slate-500">
                    Cửa hàng: <strong className="text-rose-600">{rejectingStore.shop_name}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Lý do từ chối (Gửi thông báo tới chủ nhà may):
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ví dụ: Giấy phép kinh doanh không khớp thông tin đại diện pháp luật, số điện thoại không liên lạc được..."
                    className="w-full bg-[#F7F7F5] border border-slate-200 focus:bg-white focus:border-rose-500 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectingStore(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setViewProofImage(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="text-[#C8963E]" size={20} />
                  <h3 className="text-base font-bold text-[#14161A]">
                    Ảnh minh chứng: {viewProofImage.brand}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewProofImage(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-xl bg-[#F7F7F5] border border-slate-200 p-2 flex items-center justify-center">
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
    </div>
  );
};
