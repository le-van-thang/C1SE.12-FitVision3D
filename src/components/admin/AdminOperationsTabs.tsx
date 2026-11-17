import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Store as StoreIcon,
  Users,
  Eye,
  EyeOff,
  Search,
  Tag,
  Megaphone,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  ArrowRight,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/features/ecommerce/types';
import { MOCK_PRODUCTS } from '@/features/ecommerce/mockProducts';
import type { AdminStats, AdminStoreItem } from '@/services/adminApi';
import { commerceApi } from '@/services/commerceApi';
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
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    barCls: 'bg-amber-500',
  },
  confirmed: {
    label: 'Đã xác nhận',
    badgeCls: 'bg-sky-50 text-sky-700 border-sky-200',
    barCls: 'bg-sky-500',
  },
  tailoring: {
    label: 'Đang may đo',
    badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barCls: 'bg-indigo-500',
  },
  shipping: {
    label: 'Đang giao',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    barCls: 'bg-blue-600',
  },
  completed: {
    label: 'Hoàn thành',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barCls: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
    barCls: 'bg-rose-500',
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
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng Doanh Thu Sàn (GMV)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-[#14161A]">
            {totalGmv.toLocaleString('vi-VN')} ₫
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {validOrders.length} đơn hợp lệ · {completedCount} hoàn thành
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('STORES')}
          className="text-left rounded-2xl bg-white border border-slate-200/90 hover:border-[#C8963E] p-5 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A6E24]">
              Hồ Sơ Shop Chờ Duyệt
            </span>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[#C8963E]">
              <StoreIcon size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-[#14161A]">
            {stats.pendingStores} <span className="text-base font-bold text-slate-400">/ {stats.totalStores}</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
            <span>{stats.approvedStores} shop đang hoạt động</span>
            <ArrowRight size={11} className="text-[#C8963E]" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('USERS')}
          className="text-left rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 p-5 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tài Khoản Hệ Thống
            </span>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-[#14161A]">
            {stats.totalUsers}
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
            <span>{stats.totalMeasurements} lần quét nhân trắc 3D</span>
            <ArrowRight size={11} className="text-blue-600" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('CMS')}
          className="text-left rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 p-5 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sản Phẩm & Khuyến Mãi
            </span>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-[#14171C]">
              <Tag size={18} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-[#14161A]">
            {MOCK_PRODUCTS.length - config.hiddenProductIds.length}/{MOCK_PRODUCTS.length} SP
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
            <span>{activeVouchersCount} mã giảm giá đang bật</span>
            <ArrowRight size={11} />
          </p>
        </button>
      </div>

      {/* Middle Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Order Status Breakdown */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#14161A] flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-600" />
              <span>Phân Bổ Trạng Thái Đơn Hàng</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('ORDERS')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer bg-transparent border-0"
            >
              Quản lý đơn →
            </button>
          </div>

          <div className="space-y-3.5">
            {(['pending', 'confirmed', 'tailoring', 'shipping', 'completed', 'cancelled'] as OrderStatus[]).map((st) => {
              const count = orders.filter((o) => o.status === st).length;
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              const meta = ORDER_STATUS_META[st];
              return (
                <div key={st} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold">{meta.label}</span>
                    <span className="font-mono font-bold text-slate-600">
                      {count} đơn ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
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
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#14161A] flex items-center gap-2 border-b border-slate-100 pb-3">
            <StoreIcon size={16} className="text-[#C8963E]" />
            <span>Doanh Thu Theo Shop & Việc Cần Xử Lý</span>
          </h3>

          <div className="space-y-2.5">
            {storeRevenueMap.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Chưa phát sinh đơn hàng.</p>
            ) : (
              storeRevenueMap.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F7F7F5] border border-slate-200/80"
                >
                  <div>
                    <span className="text-xs font-bold text-[#14161A] block">{s.name}</span>
                    <span className="text-[11px] text-slate-500">{s.count} đơn đặt may</span>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-700">
                    {s.revenue.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Hàng đợi ưu tiên của Admin
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('STORES')}
                className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-left cursor-pointer transition"
              >
                <span className="text-xl font-black font-mono text-[#9A6E24] block">{pendingStores.length}</span>
                <span className="text-[11px] font-semibold text-slate-700">Shop chờ phê duyệt</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('ORDERS')}
                className="p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-left cursor-pointer transition"
              >
                <span className="text-xl font-black font-mono text-blue-700 block">{pendingOrders.length}</span>
                <span className="text-[11px] font-semibold text-slate-700">Đơn đang chờ / may đo</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#14171C] text-white border-[#14171C] shadow-xs'
                  : 'bg-[#F7F7F5] text-slate-700 border-slate-200 hover:bg-slate-100'
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
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-3.5 px-4 font-bold">Mã Đơn / Ngày</th>
                <th className="py-3.5 px-4 font-bold">Khách Hàng & Giao Nhận</th>
                <th className="py-3.5 px-4 font-bold">Shop / Nhà May</th>
                <th className="py-3.5 px-4 font-bold">Sản Phẩm</th>
                <th className="py-3.5 px-4 font-bold">Tổng Tiền</th>
                <th className="py-3.5 px-4 font-bold">Điều Phối Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Không có đơn hàng nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const meta = ORDER_STATUS_META[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono font-bold text-blue-700 block">{order.id}</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold text-[#14161A] block">{order.customer_name}</span>
                        <span className="text-[11px] text-slate-600 font-mono block">{order.recipient.phone}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">
                          {order.recipient.city}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top text-[#9A6E24] font-bold">
                        {order.store_name || 'FitVision Atelier'}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        {order.items.map((it) => (
                          <div key={it.id} className="text-slate-800 font-medium">
                            {it.product.name} <span className="text-slate-500 font-normal">(x{it.quantity} · {it.variant.size_label})</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 align-top font-mono">
                        <span className="font-black text-emerald-700 block">
                          {order.total_amount.toLocaleString('vi-VN')} ₫
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                          {order.payment_status === 'paid' ? 'Đã thanh toán' : 'COD / Chưa trả'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${meta.badgeCls}`}>
                            {meta.label}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => {
                              const next = e.target.value as OrderStatus;
                              onUpdateStatus(order.id, next);
                              onToast('success', `Đã cập nhật đơn ${order.id} sang "${ORDER_STATUS_META[next].label}".`);
                            }}
                            className="h-8 px-2 rounded-lg bg-white border border-slate-300 text-[11px] font-semibold text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
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

  const toggleProductVisibility = async (prodId: string, prodName: string) => {
    const isHidden = config.hiddenProductIds.includes(prodId);
    const nextIsHidden = !isHidden;
    const nextHidden = isHidden
      ? config.hiddenProductIds.filter((id) => id !== prodId)
      : [...config.hiddenProductIds, prodId];

    onSaveConfig({ ...config, hiddenProductIds: nextHidden });
    await commerceApi.moderateProduct(prodId, { isHidden: nextIsHidden });
    onToast(
      'success',
      isHidden
        ? `Đã mở hiển thị sản phẩm "${prodName}" trên sàn (PostgreSQL).`
        : `Đã tạm ẩn sản phẩm "${prodName}" khỏi sàn (PostgreSQL).`
    );
  };

  const commitPriceEdit = async (prodId: string) => {
    const parsed = Number(priceDraft.replace(/\D/g, ''));
    if (!Number.isFinite(parsed) || parsed < 50_000) {
      onToast('error', 'Giá bán phải tối thiểu 50.000₫.');
      return;
    }
    const nextOverrides = { ...config.priceOverrides, [prodId]: parsed };
    onSaveConfig({ ...config, priceOverrides: nextOverrides });
    setEditingPriceId(null);
    await commerceApi.moderateProduct(prodId, { salePrice: parsed });
    onToast('success', 'Đã lưu giá niêm yết mới vào PostgreSQL & đồng bộ trang Cửa hàng.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition ${
                catFilter === c.id
                  ? 'bg-[#14171C] text-white border-[#14171C] shadow-xs'
                  : 'bg-[#F7F7F5] text-slate-700 border-slate-200 hover:bg-slate-100'
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
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
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
              className={`rounded-2xl p-4 border shadow-xs transition flex gap-4 bg-white ${
                isHidden ? 'border-rose-200 bg-rose-50/30 opacity-85' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <img
                src={prod.image_url}
                alt={prod.name}
                className="w-20 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9A6E24] font-bold">
                      {prod.brand_name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${
                        isHidden
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isHidden ? 'Đang ẩn' : 'Đang bán'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#14161A] truncate mt-0.5">{prod.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {prod.variants.length} phân loại · Tổng tồn: <strong className="text-slate-800">{totalStock}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {editingPriceId === prod.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                        className="w-28 h-8 px-2 rounded-lg bg-white border border-blue-500 text-xs font-mono text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => commitPriceEdit(prod.id)}
                        className="px-2.5 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer border-0"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPriceId(null)}
                        className="px-2 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer border-0"
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
                      <span className="font-mono text-sm font-black text-[#14161A] group-hover:text-blue-600 group-hover:underline">
                        {currentPrice.toLocaleString('vi-VN')} ₫
                      </span>
                      <span className="text-[10px] font-semibold text-blue-600 ml-1.5">(Sửa giá)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleProductVisibility(prod.id, prod.name)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border cursor-pointer transition whitespace-nowrap ${
                      isHidden
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
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

  useEffect(() => {
    setHeroBadge(config.heroBadgeVi);
    setHeroTitle(config.heroTitleVi);
    setHeroHighlight(config.heroHighlightVi);
    setMarqueeText(config.marqueeItemsVi.join('\n'));
    setMarqueeOn(config.marqueeEnabled);
  }, [config.heroBadgeVi, config.heroTitleVi, config.heroHighlightVi, config.marqueeItemsVi, config.marqueeEnabled]);

  // Add Voucher state
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'fixed' | 'percent'>('fixed');
  const [newValue, setNewValue] = useState('50000');
  const [newTitle, setNewTitle] = useState('');

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = marqueeText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const nextConfig: PlatformConfig = {
      ...config,
      marqueeEnabled: marqueeOn,
      marqueeItemsVi: lines.length > 0 ? lines : config.marqueeItemsVi,
      heroBadgeVi: heroBadge.trim() || config.heroBadgeVi,
      heroTitleVi: heroTitle.trim() || config.heroTitleVi,
      heroHighlightVi: heroHighlight.trim() || config.heroHighlightVi,
    };
    onSaveConfig(nextConfig);
    await commerceApi.saveSettings({
      marqueeEnabled: nextConfig.marqueeEnabled,
      marqueeItemsVi: nextConfig.marqueeItemsVi,
      marqueeItemsEn: nextConfig.marqueeItemsEn,
      heroBadgeVi: nextConfig.heroBadgeVi,
      heroTitleVi: nextConfig.heroTitleVi,
      heroHighlightVi: nextConfig.heroHighlightVi,
    });
    onToast('success', 'Đã lưu cấu hình Banner & Marquee vào PostgreSQL! Trang Khách hàng đã cập nhật.');
  };

  const handleAddVoucher = async (e: React.FormEvent) => {
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
    await commerceApi.createVoucher(created);
    setNewCode('');
    setNewTitle('');
    onToast('success', `Đã lưu mã "${cleanCode}" vào PostgreSQL & đồng bộ trang chủ.`);
  };

  const toggleVoucherField = async (code: string, field: 'active' | 'showOnStorefront') => {
    const target = config.vouchers.find((v) => v.code === code);
    if (!target) return;
    const nextVal = !target[field];
    const next = config.vouchers.map((v) =>
      v.code === code ? { ...v, [field]: nextVal } : v
    );
    onSaveConfig({ ...config, vouchers: next });
    await commerceApi.updateVoucher(code, { [field]: nextVal });
  };

  const deleteVoucher = async (code: string) => {
    onSaveConfig({ ...config, vouchers: config.vouchers.filter((v) => v.code !== code) });
    await commerceApi.deleteVoucher(code);
    onToast('success', `Đã xóa mã ${code} khỏi PostgreSQL.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Hero & Marquee Editor */}
      <form
        onSubmit={handleSaveBanner}
        className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-4 h-fit"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#14161A] flex items-center gap-2">
            <Megaphone size={16} className="text-[#C8963E]" />
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
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-transparent border-0"
          >
            <RotateCcw size={12} />
            <span>Khôi phục gốc</span>
          </button>
        </div>

        <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-slate-200 cursor-pointer">
          <span className="text-xs font-bold text-slate-800">Bật thanh chạy thông báo trên cùng</span>
          <input
            type="checkbox"
            checked={marqueeOn}
            onChange={(e) => setMarqueeOn(e.target.checked)}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </label>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Nội dung thanh chạy (mỗi dòng 1 câu)
          </label>
          <textarea
            rows={4}
            value={marqueeText}
            onChange={(e) => setMarqueeText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Nhãn phụ Hero Banner
          </label>
          <input
            type="text"
            value={heroBadge}
            onChange={(e) => setHeroBadge(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Tiêu đề Hero
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Từ nhấn vàng
            </label>
            <input
              type="text"
              value={heroHighlight}
              onChange={(e) => setHeroHighlight(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs font-bold text-[#9A6E24] focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-10 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border-0 transition"
        >
          <Save size={14} />
          <span>Lưu & Áp Dụng Lên Trang Chủ</span>
        </button>
      </form>

      {/* Right: Voucher Campaign Manager */}
      <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#14161A] flex items-center gap-2">
            <Tag size={16} className="text-emerald-600" />
            <span>Quản Lý Mã Giảm Giá Toàn Sàn ({config.vouchers.length})</span>
          </h3>
        </div>

        <form onSubmit={handleAddVoucher} className="p-4 rounded-xl bg-[#F7F7F5] border border-slate-200 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Phát hành mã khuyến mãi mới
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="VD: SALE20"
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-mono uppercase text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'fixed' | 'percent')}
              className="h-9 px-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="fixed">Giảm tiền cố định (₫)</option>
              <option value="percent">Giảm theo phần trăm (%)</option>
            </select>
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="50000"
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Mô tả hiển thị cho khách (VD: Giảm 20% Tuần Lễ Thời Trang)"
              className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border-0 shrink-0 transition"
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
                v.active ? 'bg-[#F7F7F5] border-slate-200' : 'bg-rose-50/40 border-rose-200 opacity-70'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-[#9A6E24]">
                    {v.code}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {v.discountType === 'percent'
                      ? `-${v.discountValue}%`
                      : `-${v.discountValue.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#14161A] truncate mt-1">{v.titleVi}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVoucherField(v.code, 'showOnStorefront')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer whitespace-nowrap ${
                    v.showOnStorefront
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {v.showOnStorefront ? 'Hiện trang chủ' : 'Chỉ nhập mã'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleVoucherField(v.code, 'active')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer whitespace-nowrap ${
                    v.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {v.active ? 'Đang bật' : 'Tạm tắt'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteVoucher(v.code)}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 cursor-pointer"
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
