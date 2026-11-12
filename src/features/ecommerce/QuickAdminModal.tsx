import React, { useState } from 'react';
import {
  X,
  Shield,
  Users,
  Store,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Unlock,
  AlertCircle,
  Activity,
  Check,
  Search,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface QuickAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAdminModal: React.FC<QuickAdminModalProps> = ({ isOpen, onClose }) => {
  const { profiles, stores, approveStore, rejectStore, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'stores' | 'system'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const mockUsersList = [
    { id: 'u-1', name: 'Lê Văn Thắng', email: 'thang.le@fitvision3d.com', role: 'Khách hàng', status: 'Hoạt động', joinDate: '10/11/2026' },
    { id: 'u-2', name: 'Nguyễn Văn Long (Tailor Bespoke)', email: 'long.tailor@sartoria.vn', role: 'Chủ shop may đo', status: 'Hoạt động', joinDate: '08/11/2026' },
    { id: 'u-3', name: 'TS. Lê Minh Thái', email: 'admin@fitvision3d.com', role: 'Quản trị viên sàn', status: 'Hoạt động', joinDate: '01/10/2026' },
    { id: 'u-4', name: 'Trần Thị Mai', email: 'mai.tran@gmail.com', role: 'Khách hàng', status: 'Hoạt động', joinDate: '11/11/2026' },
    { id: 'u-5', name: 'Hoàng Minh Quân (Sartoria Hà Nội)', email: 'quan.hm@sartoriahanoi.vn', role: 'Chủ shop may đo', status: 'Chờ duyệt', joinDate: '12/11/2026' },
  ];

  const pendingStoresList = [
    {
      id: 'store-101',
      brandName: 'Nhà May Sartoria Ý Hà Nội',
      owner: 'Hoàng Minh Quân',
      phone: '0988 123 456',
      specialty: 'Vest & Blazer May Đo Chuẩn Phom Ý',
      status: 'PENDING',
      date: 'Hôm nay, 14:20',
    },
    {
      id: 'store-102',
      brandName: 'Atelier Lụa Tự Nhiên Sài Gòn',
      owner: 'Nguyễn Bích Ngọc',
      phone: '0912 345 678',
      specialty: 'Đầm Lụa Tơ Tằm & Áo Dài Cao Cấp',
      status: 'PENDING',
      date: 'Hôm qua, 09:15',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400 flex items-center justify-center shadow-md">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">
                  Bảng Quản Trị Hệ Thống FitVision 3D
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Phân Quyền Admin
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Quản lý tài khoản người dùng, phê duyệt đối tác may đo và giám sát hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-colors"
              title="Mở toàn màn hình cổng admin"
            >
              <span>Cổng Admin Đầy Đủ</span>
              <ExternalLink size={13} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action notification toast */}
        {actionSuccess && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-stone-200 bg-stone-50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users size={15} />
            <span>Quản Lý Tài Khoản (5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'stores'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store size={15} />
            <span>Phê Duyệt Gian Hàng ({pendingStoresList.length} chờ duyệt)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Activity size={15} />
            <span>Giám Sát 3D & Máy Chủ</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* TAB 1: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên hoặc email người dùng..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-indigo-600 bg-stone-50"
                  />
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Tổng: <strong className="text-stone-800">5 tài khoản</strong>
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-extrabold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Người Dùng</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Vai Trò</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-right">Tác Vụ Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {mockUsersList.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-stone-900">
                          {u.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">
                          {u.email}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            u.role === 'Quản trị viên sàn'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : u.role === 'Chủ shop may đo'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => showNotification(`Đã phân lại quyền tài khoản ${u.name}`)}
                            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-300 cursor-pointer"
                          >
                            Đổi Quyền
                          </button>
                          <button
                            type="button"
                            onClick={() => showNotification(`Đã cập nhật trạng thái bảo mật cho ${u.name}`)}
                            className="px-2 py-1 rounded bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 text-[11px] font-bold border border-stone-300 cursor-pointer"
                            title="Khóa/Mở tài khoản"
                          >
                            <Lock size={12} className="inline mr-0.5" />
                            Khóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STORES APPROVAL */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>Hiện có <strong>2 nhà may</strong> đang nộp hồ sơ xin mở gian hàng B2B trên FitVision 3D.</span>
                <span className="font-bold text-[11px] text-amber-700">Yêu cầu kiểm tra rập may và thông số đo</span>
              </div>

              <div className="space-y-3">
                {pendingStoresList.map((st) => (
                  <div key={st.id} className="p-4 rounded-xl bg-stone-50 border-2 border-stone-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-sm">
                          {st.brandName}
                        </h4>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Đại diện: <strong>{st.owner}</strong> • SĐT: <span className="font-mono">{st.phone}</span>
                        </p>
                        <p className="text-xs text-indigo-700 font-semibold mt-1">
                          Chuyên môn: {st.specialty}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                        Chờ Admin duyệt
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={() => showNotification(`Đã gửi yêu cầu bổ sung hồ sơ tới ${st.brandName}`)}
                        className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                      >
                        Yêu Cầu Bổ Sung
                      </button>
                      <button
                        type="button"
                        onClick={() => showNotification(`Đã từ chối cấp phép gian hàng ${st.brandName}`)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                      >
                        Từ Chối
                      </button>
                      <button
                        type="button"
                        onClick={() => showNotification(`ĐÃ PHÊ DUYỆT THÀNH CÔNG gian hàng ${st.brandName}!`)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Phê Duyệt Gian Hàng</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM METRICS */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">LƯỢT QUÉT 3D ISO 8559</span>
                  <span className="text-xl font-black text-blue-950 mt-1 block">4,890</span>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">13 thông số trích xuất/lần</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">BẢO MẬT RAM 100%</span>
                  <span className="text-xl font-black text-emerald-950 mt-1 block">Zero-Retention</span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">Xóa ảnh ngay sau xử lý</span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">ĐƠN HÀNG MAY ĐO</span>
                  <span className="text-xl font-black text-purple-950 mt-1 block">342 đơn</span>
                  <span className="text-[10px] text-purple-600 mt-0.5 block">Tỷ lệ vừa vặn 98.4%</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <h4 className="font-extrabold text-xs text-stone-900">
                  Trạng Thái Dịch Vụ Hệ Thống (Live Health)
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200">
                    <span className="font-medium text-stone-700">PostgreSQL Database (Docker port 5432)</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sẵn sàng
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200">
                    <span className="font-medium text-stone-700">FastAPI 3D Anthropometry Service (Port 5000)</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hoạt động ổn định
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200">
                    <span className="font-medium text-stone-700">Trợ Lý Ảo Gemini 2.5 Fashion Assistant API</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Kết nối trực tiếp
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-stone-500 font-medium">
            FitVision 3D Capstone C1SE.12 • Phân luồng Quản Trị Viên Sàn
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-extrabold transition-colors cursor-pointer"
          >
            Đóng Bảng Quản Trị
          </button>
        </div>

      </div>
    </div>
  );
};

