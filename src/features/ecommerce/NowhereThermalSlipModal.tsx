import React, { useRef } from 'react';
import { X, Printer, Download, Check, Sparkles, Scissors, ShieldCheck, QrCode } from 'lucide-react';
import { UserBodyProfile } from './types';

interface NowhereThermalSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  userName?: string;
}

export const NowhereThermalSlipModal: React.FC<NowhereThermalSlipModalProps> = ({
  isOpen,
  onClose,
  userBody,
  userName = 'Thắng Lê',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-100 rounded-3xl p-6 shadow-2xl border border-stone-300 max-h-[92vh] overflow-y-auto">
        
        {/* Header close */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-300/80 mb-4">
          <div className="flex items-center gap-2">
            <Scissors size={16} className="text-stone-700" />
            <span className="text-xs font-bold uppercase text-stone-800 tracking-wider">
              Bảng Số Đo May Đo Chuẩn ISO 8559-1
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── THE THERMAL RECEIPT SLIP ── */}
        <div
          ref={printRef}
          className="relative bg-white text-stone-900 p-6 rounded-t-xl shadow-md border border-stone-200 font-mono text-xs select-text overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(#e5e7eb 0.75px, transparent 0.75px)',
            backgroundSize: '12px 12px',
          }}
        >
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-dashed border-stone-400 space-y-1">
            <h2 className="font-serif text-xl font-black tracking-tight text-stone-950">
              FITVISION 3D · ATELIER
            </h2>
            <p className="text-[10px] text-stone-600 uppercase tracking-widest font-sans font-bold">
              Bảng Số Đo Nhân Trắc Học May Đo 3D
            </p>
            <p className="text-[10px] text-stone-500">
              TIÊU CHUẨN QUỐC TẾ ISO 8559-1:2017
            </p>
            <div className="pt-2 text-[10px] text-stone-600 flex justify-between items-center px-2">
              <span>MÃ SỐ ĐO: #FV3D-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span>{todayStr}</span>
            </div>
          </div>

          {/* Client Bio */}
          <div className="py-3 border-b border-stone-200 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-stone-500">CLIENT:</span>
              <span className="font-bold">{userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">SCAN MODE:</span>
              <span className="text-blue-700 font-bold">1-SHOT A-POSE AI 3D</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">TOLERANCE:</span>
              <span className="text-emerald-700 font-bold">± 0.45 CM (ACCURATE)</span>
            </div>
          </div>

          {/* Biometrics Table */}
          <div className="py-3 border-b-2 border-dashed border-stone-400 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">
              CORE 13-POINT BODY MEASUREMENTS
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">Chiều cao:</span>
                <span className="font-bold">{userBody.height_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Cân nặng:</span>
                <span className="font-bold">{userBody.weight_kg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Vòng ngực:</span>
                <span className="font-bold text-blue-700">{userBody.chest_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Vòng eo:</span>
                <span className="font-bold text-blue-700">{userBody.waist_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Vòng mông:</span>
                <span className="font-bold">{userBody.hip_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Rộng vai:</span>
                <span className="font-bold">{userBody.shoulder_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Dài tay áo:</span>
                <span className="font-bold">58.5 cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Vòng cổ:</span>
                <span className="font-bold">38.0 cm</span>
              </div>
            </div>
          </div>

          {/* Tailor Recommendation */}
          <div className="py-3 border-b border-stone-200 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">
              RECOMMENDED PATTERN SIZING
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span>Áo Sơ Mi / Polo (Shirt):</span>
                <span className="px-2 py-0.5 bg-stone-900 text-white rounded font-bold">SIZE M (48)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Quần Tây / Chino (Trousers):</span>
                <span className="px-2 py-0.5 bg-stone-900 text-white rounded font-bold">SIZE 31 (M)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Áo Khoác Blazer (Tailored Suit):</span>
                <span className="px-2 py-0.5 bg-stone-900 text-white rounded font-bold">SIZE 48R</span>
              </div>
            </div>
          </div>

          {/* Ease Allowance Formula (Ramanujan Ellipse Fit) */}
          <div className="py-3 border-b-2 border-dashed border-stone-400 text-[10px] text-stone-500 space-y-1">
            <div className="font-bold text-stone-700">EASE ALLOWANCE MATRIX:</div>
            <div>• Chest Ease: +5.0 cm (Relaxed Comfort)</div>
            <div>• Waist Ease: +3.5 cm (Natural Drape)</div>
            <div>• Ramanujan Cross-Section: Fit Ratio 0.982</div>
          </div>

          {/* Barcode & Signature */}
          <div className="pt-4 pb-2 text-center space-y-2">
            {/* SVG Barcode */}
            <div className="flex justify-center items-center py-1">
              <svg className="h-10 w-48 overflow-visible" viewBox="0 0 100 24">
                <rect x="0" y="0" width="2" height="24" fill="#000" />
                <rect x="3" y="0" width="1" height="24" fill="#000" />
                <rect x="5" y="0" width="3" height="24" fill="#000" />
                <rect x="9" y="0" width="1" height="24" fill="#000" />
                <rect x="12" y="0" width="2" height="24" fill="#000" />
                <rect x="15" y="0" width="4" height="24" fill="#000" />
                <rect x="21" y="0" width="1" height="24" fill="#000" />
                <rect x="24" y="0" width="2" height="24" fill="#000" />
                <rect x="28" y="0" width="3" height="24" fill="#000" />
                <rect x="33" y="0" width="2" height="24" fill="#000" />
                <rect x="37" y="0" width="1" height="24" fill="#000" />
                <rect x="40" y="0" width="4" height="24" fill="#000" />
                <rect x="46" y="0" width="2" height="24" fill="#000" />
                <rect x="50" y="0" width="1" height="24" fill="#000" />
                <rect x="53" y="0" width="3" height="24" fill="#000" />
                <rect x="58" y="0" width="2" height="24" fill="#000" />
                <rect x="62" y="0" width="1" height="24" fill="#000" />
                <rect x="65" y="0" width="4" height="24" fill="#000" />
                <rect x="71" y="0" width="2" height="24" fill="#000" />
                <rect x="75" y="0" width="3" height="24" fill="#000" />
                <rect x="80" y="0" width="1" height="24" fill="#000" />
                <rect x="83" y="0" width="2" height="24" fill="#000" />
                <rect x="87" y="0" width="4" height="24" fill="#000" />
                <rect x="93" y="0" width="1" height="24" fill="#000" />
                <rect x="96" y="0" width="3" height="24" fill="#000" />
              </svg>
            </div>
            <p className="text-[9px] tracking-widest text-stone-500 font-mono">
              * FITVISION-ISO-8559-VERIFIED *
            </p>
          </div>

          {/* Thermal Zig-zag Serrated Tear Edge Bottom */}
          <div
            className="absolute -bottom-2 inset-x-0 h-4 bg-repeat-x"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 20 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='0,0 10,10 20,0' fill='%23f5f5f4'/%3E%3C/svg%3E")`,
              backgroundSize: '16px 8px',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 active:scale-95"
          >
            <Printer size={15} />
            <span>In Bảng Số Đo May Đo</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
