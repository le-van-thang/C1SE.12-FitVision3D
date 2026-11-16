import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Store as StoreIcon,
  Users,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Tag,
  Megaphone,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Package,
  AlertCircle,
  ArrowRight,
  Shirt,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/features/ecommerce/types';
import { MOCK_PRODUCTS } from '@/features/ecommerce/mockProducts';
import type { AdminStats, AdminStoreItem } from '@/services/adminApi';
import {
  type PlatformConfig,
  type PlatformVoucher,
  resetPlatformConfig,
} from '@/services/platformConfig';

interface OverviewProps {
  stats: AdminStats;
  stores: AdminStoreItem[];
  orders: Order[];
  config: PlatformConfig;
  onNavigateTab: (tab: 'OVERVIEW' | 'STORES' | 'USERS' | 'ORDERS' | 'CATALOG' | 'CMS' | 'AUDIT') => void;
}

const ORDER_STATUS_META: Record<OrderStatus, { label: string; badgeCls: string; barCls: string }> = {
  pending: {
    label: 'Chờ duyệt',
    badgeCls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    barCls: 'bg-amber-400',
  },
  confirmed: {
    label: 'Đã xác nhận',
    badgeCls: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    barCls: 'bg-sky-400',
  },
  tailoring: {
    label: 'Đang may đo',
    badgeCls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    barCls: 'bg-indigo-400',
  },
  shipping: {
    label: 'Đang giao',
    badgeCls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    barCls: 'bg-cyan-400',
  },
  completed: {
    label: 'Hoàn thành',
    badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    barCls: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeCls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    barCls: 'bg-rose-400',
  },
};

export const AdminOverviewSection: React.FC<OverviewProps> = ({
  stats,
  stores,
  orders,
  config,
  onNavigateTab,
}) => {
  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalGmv = validOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'tailoring');
  const pendingStores = stores.filter((s) => s.status === 'PENDING');

  const storeRevenueMap = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; count: number }>();
    validOrders.forEach((o) => {
      const name = o.store_name || 'FitVision Atelier';
      const cur = map.get(name) || { name, revenue: 0, count: 0 };
      cur.revenue += o.total_amount || 0;
      cur.count += 1;
      map.set(name, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [validOrders]);

  const activeVouchersCount = config.vouchers.filter((v) => v.active).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#111921] border border-slate-700/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Doanh Thu Sàn (GMV)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white">
            {totalGmv.toLocaleString('vi-VN')} ₫
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">
            {validOrders.length} đơn hợp lệ · {completedCount} hoàn thành
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('STORES')}
          className="text-left rounded-2xl bg-[#111921] border border-amber-500/30 hover:border-amber-400 p-5 shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Hồ Sơ Nhà May Chờ Duyệt
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <StoreIcon size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-amber-300">
            {stats.pendingStores} / {stats.totalStores}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{stats.approvedStores} nhà may đang hoạt động</span>
            <ArrowRight size={11} />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('USERS')}
          className="text-left rounded-2xl bg-[#111921] border border-indigo-500/30 hover:border-indigo-400 p-5 shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Tài Khoản Hệ Thống
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white">
            {stats.totalUsers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{stats.totalMeasurements} lần quét nhân trắc 3D</span>
            <ArrowRight size={11} />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('CMS')}
          className="text-left rounded-2xl bg-[#111921] border border-sky-500/30 hover:border-sky-400 p-5 shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              Sản Phẩm & Khuyến Mãi
            </span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <Tag size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white">
            {MOCK_PRODUCTS.length - config.hiddenProductIds.length}/{MOCK_PRODUCTS.length} SP
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{activeVouchersCount} mã giảm giá đang bật</span>
            <ArrowRight size={11} />
          </p>
        </button>
      </div>

      {/* Middle Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Order Status Breakdown */}
        <div className="lg:col-span-6 rounded-2xl bg-[#111921] border border-slate-700/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag size={16} className="text-cyan-400" />
              <span>Phân Bổ Trạng Thái Đơn Hàng</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('ORDERS')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer bg-transparent border-0"
            >
              Quản lý đơn →
            </button>
          </div>

          <div className="space-y-3">
            {(['pending', 'confirmed', 'tailoring', 'shipping', 'completed', 'cancelled'] as OrderStatus[]).map((st) => {
              const count = orders.filter((o) => o.status === st).length;
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              const meta = ORDER_STATUS_META[st];
              return (
                <div key={st} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{meta.label}</span>
                    <span className="font-mono text-slate-400">
                      {count} đơn ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.barCls} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Revenue & Action Queue */}
        <div className="lg:col-span-6 rounded-2xl bg-[#111921] border border-slate-700/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <StoreIcon size={16} className="text-amber-400" />
            <span>Doanh Thu Theo Nhà May & Việc Cần Xử Lý</span>
          </h3>

          <div className="space-y-2.5">
            {storeRevenueMap.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa phát sinh đơn hàng.</p>
            ) : (
              storeRevenueMap.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0B1117] border border-slate-800"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">{s.name}</span>
                    <span className="text-[11px] text-slate-400">{s.count} đơn đặt may</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {s.revenue.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Hàng đợi ưu tiên của Admin
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab('STORES')}
                className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-left cursor-pointer transition"
              >
                <span className="text-lg font-black font-mono text-amber-300 block">{pendingStores.length}</span>
                <span className="text-[11px] text-slate-300">Shop chờ phê duyệt</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('ORDERS')}
                className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/30 text-left cursor-pointer transition"
              >
                <span className="text-lg font-black font-mono text-sky-300 block">{pendingOrders.length}</span>
                <span className="text-[11px] text-slate-300">Đơn đang chờ / may đo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onToast: (type: 'success' | 'error', text: string) => void;
}

export const AdminOrdersSection: React.FC<OrdersProps> = ({
  orders,
  onUpdateStatus,
  onToast,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        (o.store_name || '').toLowerCase().includes(q) ||
        o.recipient.phone.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'confirmed', label: 'Đã xác nhận' },
              { id: 'tailoring', label: 'Đang may đo' },
              { id: 'shipping', label: 'Đang giao' },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'cancelled', label: 'Đã hủy' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-[#111921] text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, tên khách, shop..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#111921] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-[#111921] border border-slate-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-[#0C131A]">
                <th className="py-3 px-4">Mã Đơn / Ngày</th>
                <th className="py-3 px-4">Khách Hàng & Giao Nhận</th>
                <th className="py-3 px-4">Nhà May</th>
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Điều Phối Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Không có đơn hàng nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const meta = ORDER_STATUS_META[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 align-top">
                        <span className="font-mono font-bold text-cyan-300 block">{order.id}</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="font-semibold text-white block">{order.customer_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono block">{order.recipient.phone}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">
                          {order.recipient.city}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top text-amber-200 font-medium">
                        {order.store_name || 'FitVision Atelier'}
                      </td>
                      <td className="py-3 px-4 align-top">
                        {order.items.map((it) => (
                          <div key={it.id} className="text-slate-200">
                            {it.product.name} <span className="text-slate-400">(x{it.quantity} · {it.variant.size_label})</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 align-top font-mono">
                        <span className="font-bold text-emerald-400 block">
                          {order.total_amount.toLocaleString('vi-VN')} ₫
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {order.payment_status === 'paid' ? 'Đã thanh toán' : 'COD / Chưa trả'}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex w-fit px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.badgeCls}`}>
                            {meta.label}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => {
                              const next = e.target.value as OrderStatus;
                              onUpdateStatus(order.id, next);
                              onToast('success', `Đã cập nhật đơn ${order.id} sang "${ORDER_STATUS_META[next].label}".`);
                            }}
                            className="h-8 px-2 rounded-lg bg-[#091016] border border-slate-700 text-[11px] text-slate-200 focus:border-cyan-400 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Chờ duyệt</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="tailoring">Đang may đo</option>
                            <option value="shipping">Đang giao hàng</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Hủy đơn</option>
                          </select>
                        </div>
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
  );
};

interface CatalogProps {
  config: PlatformConfig;
  onSaveConfig: (next: PlatformConfig) => void;
  onToast: (type: 'success' | 'error', text: string) => void;
}

export const AdminCatalogSection: React.FC<CatalogProps> = ({
  config,
  onSaveConfig,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand_name.toLowerCase().includes(q);
    });
  }, [search, catFilter]);

  const toggleProductVisibility = (prodId: string, prodName: string) => {
    const isHidden = config.hiddenProductIds.includes(prodId);
    const nextHidden = isHidden
      ? config.hiddenProductIds.filter((id) => id !== prodId)
      : [...config.hiddenProductIds, prodId];

    onSaveConfig({ ...config, hiddenProductIds: nextHidden });
    onToast(
      'success',
      isHidden ? `Đã mở hiển thị sản phẩm "${prodName}" trên sàn.` : `Đã tạm ẩn sản phẩm "${prodName}" khỏi sàn.`
    );
  };

  const commitPriceEdit = (prodId: string) => {
    const parsed = Number(priceDraft.replace(/\D/g, ''));
    if (!Number.isFinite(parsed) || parsed < 50_000) {
      onToast('error', 'Giá bán phải tối thiểu 50.000₫.');
      return;
    }
    const nextOverrides = { ...config.priceOverrides, [prodId]: parsed };
    onSaveConfig({ ...config, priceOverrides: nextOverrides });
    setEditingPriceId(null);
    onToast('success', 'Đã cập nhật giá niêm yết mới đồng bộ ngay lên trang Cửa hàng.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'shirt', label: 'Áo Sơ Mi' },
            { id: 'polo', label: 'Áo Polo' },
            { id: 'pants', label: 'Quần Tây / Chino' },
            { id: 'dress', label: 'Đầm Lụa' },
            { id: 'tailored', label: 'Bespoke' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                catFilter === c.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-[#111921] text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên áo, thương hiệu..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#111921] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((prod) => {
          const isHidden = config.hiddenProductIds.includes(prod.id);
          const currentPrice = config.priceOverrides[prod.id] ?? prod.sale_price ?? prod.price;
          const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);

          return (
            <div
              key={prod.id}
              className={`rounded-2xl p-4 border transition flex gap-4 ${
                isHidden
                  ? 'bg-[#0B1016] border-rose-500/30 opacity-75'
                  : 'bg-[#111921] border-slate-700/80'
              }`}
            >
              <img
                src={prod.image_url}
                alt={prod.name}
                className="w-20 h-24 rounded-xl object-cover border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                      {prod.brand_name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isHidden
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isHidden ? 'Đang ẩn' : 'Đang bán'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mt-0.5">{prod.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {prod.variants.length} phân loại · Tổng tồn: <strong className="text-slate-200">{totalStock}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  {editingPriceId === prod.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                        className="w-28 h-8 px-2 rounded-lg bg-[#091016] border border-cyan-500 text-xs font-mono text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => commitPriceEdit(prod.id)}
                        className="px-2.5 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer border-0"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPriceId(null)}
                        className="px-2 h-8 rounded-lg bg-slate-800 text-slate-300 text-[11px] cursor-pointer border-0"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPriceId(prod.id);
                        setPriceDraft(String(currentPrice));
                      }}
                      className="text-left group cursor-pointer bg-transparent border-0 p-0"
                      title="Bấm để chỉnh giá bán"
                    >
                      <span className="font-mono text-sm font-black text-emerald-400 group-hover:underline">
                        {currentPrice.toLocaleString('vi-VN')} ₫
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1.5">(Sửa giá)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleProductVisibility(prod.id, prod.name)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border cursor-pointer transition ${
                      isHidden
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{isHidden ? 'Hiện lại' : 'Ẩn sản phẩm'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CmsProps {
  config: PlatformConfig;
  onSaveConfig: (next: PlatformConfig) => void;
  onToast: (type: 'success' | 'error', text: string) => void;
}

export const AdminCmsSection: React.FC<CmsProps> = ({
  config,
  onSaveConfig,
  onToast,
}) => {
  const [heroBadge, setHeroBadge] = useState(config.heroBadgeVi);
  const [heroTitle, setHeroTitle] = useState(config.heroTitleVi);
  const [heroHighlight, setHeroHighlight] = useState(config.heroHighlightVi);
  const [marqueeText, setMarqueeText] = useState(config.marqueeItemsVi.join('\n'));
  const [marqueeOn, setMarqueeOn] = useState(config.marqueeEnabled);

  // Add Voucher state
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'fixed' | 'percent'>('fixed');
  const [newValue, setNewValue] = useState('50000');
  const [newTitle, setNewTitle] = useState('');

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = marqueeText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    onSaveConfig({
      ...config,
      marqueeEnabled: marqueeOn,
      marqueeItemsVi: lines.length > 0 ? lines : config.marqueeItemsVi,
      heroBadgeVi: heroBadge.trim() || config.heroBadgeVi,
      heroTitleVi: heroTitle.trim() || config.heroTitleVi,
      heroHighlightVi: heroHighlight.trim() || config.heroHighlightVi,
    });
    onToast('success', 'Đã lưu cấu hình Banner & Marquee! Thay đổi có hiệu lực ngay trên trang Khách hàng.');
  };

  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const val = Number(newValue);
    if (cleanCode.length < 3 || !Number.isFinite(val) || val <= 0) {
      onToast('error', 'Mã voucher tối thiểu 3 ký tự chữ/số và giá trị > 0.');
      return;
    }
    if (config.vouchers.some((v) => v.code === cleanCode)) {
      onToast('error', `Mã ${cleanCode} đã tồn tại trên hệ thống.`);
      return;
    }
    const created: PlatformVoucher = {
      code: cleanCode,
      discountType: newType,
      discountValue: val,
      titleVi:
        newTitle.trim() ||
        (newType === 'percent'
          ? `Giảm ${val}% đơn may đo FitVision`
          : `Giảm ${val.toLocaleString('vi-VN')}₫ đơn hàng`),
      titleEn:
        newType === 'percent'
          ? `${val}% Off FitVision Orders`
          : `${val.toLocaleString('vi-VN')}₫ Off Orders`,
      subVi: 'Mã chiến dịch quản trị viên phát hành toàn sàn',
      subEn: 'Platform-wide Admin campaign voucher',
      active: true,
      showOnStorefront: true,
    };
    onSaveConfig({ ...config, vouchers: [created, ...config.vouchers] });
    setNewCode('');
    setNewTitle('');
    onToast('success', `Đã phát hành mã "${cleanCode}" cho toàn bộ trang chủ & thanh toán.`);
  };

  const toggleVoucherField = (code: string, field: 'active' | 'showOnStorefront') => {
    const next = config.vouchers.map((v) =>
      v.code === code ? { ...v, [field]: !v[field] } : v
    );
    onSaveConfig({ ...config, vouchers: next });
  };

  const deleteVoucher = (code: string) => {
    onSaveConfig({ ...config, vouchers: config.vouchers.filter((v) => v.code !== code) });
    onToast('success', `Đã xóa mã ${code}.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Hero & Marquee Editor */}
      <form
        onSubmit={handleSaveBanner}
        className="lg:col-span-5 rounded-2xl bg-[#111921] border border-slate-700/80 p-5 space-y-4 h-fit"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Megaphone size={16} className="text-amber-400" />
            <span>Điều Khiển Banner & Thanh Chạy Chữ</span>
          </h3>
          <button
            type="button"
            onClick={() => {
              const reset = resetPlatformConfig();
              setHeroBadge(reset.heroBadgeVi);
              setHeroTitle(reset.heroTitleVi);
              setHeroHighlight(reset.heroHighlightVi);
              setMarqueeText(reset.marqueeItemsVi.join('\n'));
              setMarqueeOn(reset.marqueeEnabled);
              onSaveConfig(reset);
              onToast('success', 'Đã khôi phục giao diện & voucher về mặc định.');
            }}
            className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-0"
          >
            <RotateCcw size={12} />
            <span>Khôi phục gốc</span>
          </button>
        </div>

        <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1117] border border-slate-800 cursor-pointer">
          <span className="text-xs font-semibold text-slate-200">Bật thanh chạy thông báo trên cùng</span>
          <input
            type="checkbox"
            checked={marqueeOn}
            onChange={(e) => setMarqueeOn(e.target.checked)}
            className="w-4 h-4 accent-cyan-400 cursor-pointer"
          />
        </label>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Nội dung thanh chạy (mỗi dòng 1 câu)
          </label>
          <textarea
            rows={4}
            value={marqueeText}
            onChange={(e) => setMarqueeText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#091016] border border-slate-700 text-xs text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Nhãn phụ Hero Banner
          </label>
          <input
            type="text"
            value={heroBadge}
            onChange={(e) => setHeroBadge(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-[#091016] border border-slate-700 text-xs text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tiêu đề Hero
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#091016] border border-slate-700 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Từ nhấn vàng
            </label>
            <input
              type="text"
              value={heroHighlight}
              onChange={(e) => setHeroHighlight(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#091016] border border-slate-700 text-xs text-amber-300 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer border-0 transition"
        >
          <Save size={14} />
          <span>Lưu & Áp Dụng Lên Trang Chủ</span>
        </button>
      </form>

      {/* Right: Voucher Campaign Manager */}
      <div className="lg:col-span-7 rounded-2xl bg-[#111921] border border-slate-700/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag size={16} className="text-emerald-400" />
            <span>Quản Lý Mã Giảm Giá Toàn Sàn ({config.vouchers.length})</span>
          </h3>
        </div>

        <form onSubmit={handleAddVoucher} className="p-3.5 rounded-xl bg-[#0B1117] border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Phát hành mã khuyến mãi mới
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="VD: SALE20"
              className="h-9 px-3 rounded-lg bg-[#091016] border border-slate-700 text-xs font-mono uppercase text-white focus:border-cyan-400 focus:outline-none"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'fixed' | 'percent')}
              className="h-9 px-2 rounded-lg bg-[#091016] border border-slate-700 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="fixed">Giảm tiền cố định (₫)</option>
              <option value="percent">Giảm theo phần trăm (%)</option>
            </select>
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="50000"
              className="h-9 px-3 rounded-lg bg-[#091016] border border-slate-700 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Mô tả hiển thị cho khách (VD: Giảm 20% Tuần Lễ Thời Trang)"
              className="flex-1 h-9 px-3 rounded-lg bg-[#091016] border border-slate-700 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer border-0 shrink-0"
            >
              <Plus size={14} />
              <span>Tạo Mã</span>
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {config.vouchers.map((v) => (
            <div
              key={v.code}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                v.active ? 'bg-[#0B1117] border-slate-800' : 'bg-[#090D12] border-rose-500/20 opacity-60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300">
                    {v.code}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {v.discountType === 'percent'
                      ? `-${v.discountValue}%`
                      : `-${v.discountValue.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white truncate mt-1">{v.titleVi}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVoucherField(v.code, 'showOnStorefront')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer ${
                    v.showOnStorefront
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {v.showOnStorefront ? 'Hiện trang chủ' : 'Chỉ nhập mã'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleVoucherField(v.code, 'active')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer ${
                    v.active
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {v.active ? 'Đang bật' : 'Tạm tắt'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteVoucher(v.code)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 cursor-pointer"
                  title="Xóa mã"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
