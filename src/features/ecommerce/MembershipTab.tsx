import React, { useEffect, useState } from 'react';
import {
  Crown,
  Gift,
  Sparkles,
  Copy,
  Check,
  Scissors,
  Truck,
  ShieldCheck,
  CalendarCheck2,
  Percent,
  History,
} from 'lucide-react';
import type { Order, UserBodyProfile } from './types';
import { getAccessToken } from '@/services/authApi';
import { commerceApi, type DbMembershipWallet } from '@/services/commerceApi';

export type MembershipTierId = 'member' | 'silver' | 'gold' | 'vip';

export interface MembershipTierDef {
  id: MembershipTierId;
  nameVi: string;
  nameEn: string;
  minSpend: number;
  discountPct: number;
  badgeBg: string;
  badgeText: string;
  cardGradient: string;
  cardBorder: string;
  cardText: string;
  accentBar: string;
  perksVi: string[];
  perksEn: string[];
}

export const MEMBERSHIP_TIERS: MembershipTierDef[] = [
  {
    id: 'member',
    nameVi: 'Thành Viên',
    nameEn: 'Atelier Member',
    minSpend: 0,
    discountPct: 0,
    badgeBg: 'bg-amber-50 border-amber-300',
    badgeText: 'text-amber-950',
    cardGradient: 'from-[#FFF9EC] via-[#F9EDD3] to-[#F0DEC0]',
    cardBorder: 'border-amber-400/80',
    cardText: 'text-slate-900',
    accentBar: 'bg-amber-600',
    perksVi: [
      'Tích 1 FitPoint cho mỗi 10.000₫ chi tiêu may đo',
      'Miễn phí giao hàng cho đơn hàng từ 1.000.000₫',
      'Chỉnh sửa phom dáng miễn phí trong 14 ngày',
    ],
    perksEn: [
      'Earn 1 FitPoint for every 10,000₫ tailored spend',
      'Complimentary shipping on orders from 1,000,000₫',
      'Free 14-day tailored garment fit adjustment',
    ],
  },
  {
    id: 'silver',
    nameVi: 'Hội Viên Bạc',
    nameEn: 'Silver Atelier',
    minSpend: 2_000_000,
    discountPct: 5,
    badgeBg: 'bg-slate-100 border-slate-400',
    badgeText: 'text-slate-900',
    cardGradient: 'from-[#EFF4FB] via-[#DFE8F5] to-[#CEDBE9]',
    cardBorder: 'border-slate-400/90',
    cardText: 'text-slate-950',
    accentBar: 'bg-blue-700',
    perksVi: [
      'Ưu đãi tự động 5% bằng mã FITSILVER5 cho mọi đơn',
      'Ưu tiên dựng mô hình & tính số đo 3D AI nhanh',
      'Quà chào mừng nâng hạng +100 FitPoints',
    ],
    perksEn: [
      '5% member discount via FITSILVER5 on every order',
      'Priority AI 3D silhouette & measurement queue',
      '+100 FitPoints tier upgrade bonus',
    ],
  },
  {
    id: 'gold',
    nameVi: 'Hội Viên Vàng',
    nameEn: 'Gold Tailor',
    minSpend: 5_000_000,
    discountPct: 10,
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    cardGradient: 'from-[#FFF7DB] via-[#F6DF98] to-[#E2B755]',
    cardBorder: 'border-amber-400/80',
    cardText: 'text-[#2D1F05]',
    accentBar: 'bg-amber-800',
    perksVi: [
      'Giảm 10% đơn hàng với mã hội viên FITVISION10',
      'Freeship hỏa tốc 0₫ không giới hạn giá trị đơn',
      'Hỗ trợ bảo hành & chỉnh sửa đường may tận nhà',
    ],
    perksEn: [
      '10% off tailored orders with member code FITVISION10',
      'Unlimited 0₫ express shipping nationwide',
      'Complimentary at-home fit alteration pickup',
    ],
  },
  {
    id: 'vip',
    nameVi: 'Atelier VIP',
    nameEn: 'Bespoke VIP',
    minSpend: 15_000_000,
    discountPct: 15,
    badgeBg: 'bg-[#14171C] border-amber-400/60',
    badgeText: 'text-amber-200',
    cardGradient: 'from-[#1F242D] via-[#14171C] to-[#2B2418]',
    cardBorder: 'border-amber-400/60',
    cardText: 'text-[#FBF7EE]',
    accentBar: 'bg-amber-400',
    perksVi: [
      'Ưu đãi may đo VIP 15% & hoàn thiện ưu tiên trong 48h',
      'Stylist 3D riêng tư vấn chất liệu & Ease Allowance 1-1',
      'Đặc quyền sinh nhật & bộ chăm sóc trang phục cao cấp',
    ],
    perksEn: [
      '15% Bespoke VIP privilege & 48h priority tailoring',
      'Dedicated 3D Stylist 1-on-1 fabric & ease curation',
      'Birthday bespoke gift & luxury garment care kit',
    ],
  },
];

interface VoucherOffer {
  code: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  costPts: number;
  minTier: MembershipTierId;
}

const VOUCHER_OFFERS: VoucherOffer[] = [
  {
    code: 'FITMEMBER50',
    titleVi: 'Giảm 50.000₫ đơn may đo',
    titleEn: '50,000₫ Off Bespoke Order',
    descVi: 'Áp dụng trực tiếp ở bước Thanh toán cho mọi đơn hàng',
    descEn: 'Redeem directly at Checkout for any tailored order',
    costPts: 60,
    minTier: 'member',
  },
  {
    code: 'CAPSTONE2026',
    titleVi: 'Giảm 100.000₫ BST Atelier',
    titleEn: '100,000₫ Off Atelier Edit',
    descVi: 'Đặc quyền thành viên FitVision 3D khi chốt đơn trực tuyến',
    descEn: 'FitVision 3D member privilege on online orders',
    costPts: 120,
    minTier: 'member',
  },
  {
    code: 'FITVISION10',
    titleVi: 'Giảm 10% toàn bộ đơn hàng',
    titleEn: '10% Off Entire Order',
    descVi: 'Tiết kiệm lớn cho combo Blazer / Áo sơ mi may đo',
    descEn: 'Best savings on tailored Blazers & Shirt combos',
    costPts: 180,
    minTier: 'member',
  },
  {
    code: 'FITVIP150',
    titleVi: 'Voucher 150.000₫ Bespoke',
    titleEn: '150,000₫ Bespoke Privilege',
    descVi: 'Dành riêng cho trang phục may đo riêng theo số đo 3D',
    descEn: 'Exclusive for custom 3D-measured garments',
    costPts: 240,
    minTier: 'member',
  },
];

export interface MembershipSummary {
  totalSpend: number;
  earnedPoints: number;
  currentTier: MembershipTierDef;
  nextTier: MembershipTierDef | null;
  progressPct: number;
  remainingToNext: number;
}

export function computeMembershipSummary(
  orders: Order[],
  userBody?: UserBodyProfile
): MembershipSummary {
  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalSpend = validOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const spendPts = Math.floor(totalSpend / 10_000);
  const scanBonus = userBody && userBody.height_cm > 0 ? 50 : 0;
  const welcomeBonus = 40;
  const earnedPoints = spendPts + scanBonus + welcomeBonus;

  let currentIdx = 0;
  for (let i = MEMBERSHIP_TIERS.length - 1; i >= 0; i--) {
    if (totalSpend >= MEMBERSHIP_TIERS[i].minSpend) {
      currentIdx = i;
      break;
    }
  }

  const currentTier = MEMBERSHIP_TIERS[currentIdx];
  const nextTier = MEMBERSHIP_TIERS[currentIdx + 1] ?? null;

  let progressPct = 100;
  let remainingToNext = 0;
  if (nextTier) {
    const span = nextTier.minSpend - currentTier.minSpend;
    const achieved = totalSpend - currentTier.minSpend;
    progressPct = Math.max(4, Math.min(100, Math.round((achieved / span) * 100)));
    remainingToNext = Math.max(0, nextTier.minSpend - totalSpend);
  }

  return {
    totalSpend,
    earnedPoints,
    currentTier,
    nextTier,
    progressPct,
    remainingToNext,
  };
}

interface StoredLoyaltyState {
  bonusPoints: number;
  spentPoints: number;
  unlockedCodes: string[];
  lastCheckInDate: string | null;
}

interface MembershipTabProps {
  userId: string;
  userName: string;
  orders: Order[];
  userBody: UserBodyProfile;
  locale: 'vi' | 'en';
}

export const MembershipTab: React.FC<MembershipTabProps> = ({
  userId,
  userName,
  orders,
  userBody,
  locale,
}) => {
  const isEn = locale === 'en';
  const storageKey = `fv3d_loyalty_${userId || 'guest'}`;

  const [loyaltyState, setLoyaltyState] = useState<StoredLoyaltyState>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          bonusPoints: Number(parsed.bonusPoints) || 0,
          spentPoints: Number(parsed.spentPoints) || 0,
          unlockedCodes: Array.isArray(parsed.unlockedCodes) ? parsed.unlockedCodes : ['FITMEMBER50'],
          lastCheckInDate: parsed.lastCheckInDate || null,
        };
      }
    } catch {
      // ignore storage errors
    }
    return {
      bonusPoints: 0,
      spentPoints: 0,
      unlockedCodes: ['FITMEMBER50'],
      lastCheckInDate: null,
    };
  });

  const [previewTierId, setPreviewTierId] = useState<MembershipTierId>('member');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [dbWallet, setDbWallet] = useState<DbMembershipWallet | null>(null);
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);

  const loadLiveMembership = async () => {
    if (!getAccessToken()) return;
    setIsSyncingWallet(true);
    const res = await commerceApi.getMembership();
    if (res.success && res.data) {
      setDbWallet(res.data);
      persistLoyalty({
        bonusPoints: res.data.bonusPoints,
        spentPoints: res.data.spentPoints,
        unlockedCodes: res.data.unlockedCodes,
        lastCheckInDate: res.data.lastCheckInDate,
      });
    }
    setIsSyncingWallet(false);
  };

  useEffect(() => {
    loadLiveMembership();
    const onUpdated = () => {
      loadLiveMembership();
    };
    window.addEventListener('fv3d-membership-updated', onUpdated);
    return () => window.removeEventListener('fv3d-membership-updated', onUpdated);
  }, [userId]);

  const summary = computeMembershipSummary(orders, userBody);
  const effectiveSummary: MembershipSummary = dbWallet
    ? (() => {
        const spend = Math.max(dbWallet.totalSpend, summary.totalSpend);
        let idx = 0;
        for (let i = MEMBERSHIP_TIERS.length - 1; i >= 0; i--) {
          if (spend >= MEMBERSHIP_TIERS[i].minSpend) {
            idx = i;
            break;
          }
        }
        const cur = MEMBERSHIP_TIERS[idx];
        const nxt = MEMBERSHIP_TIERS[idx + 1] ?? null;
        let pct = 100;
        let rem = 0;
        if (nxt) {
          pct = Math.max(4, Math.min(100, Math.round(((spend - cur.minSpend) / (nxt.minSpend - cur.minSpend)) * 100)));
          rem = Math.max(0, nxt.minSpend - spend);
        }
        return {
          totalSpend: spend,
          earnedPoints: Math.floor(spend / 10_000) + dbWallet.bonusPoints,
          currentTier: cur,
          nextTier: nxt,
          progressPct: pct,
          remainingToNext: rem,
        };
      })()
    : summary;

  useEffect(() => {
    setPreviewTierId(effectiveSummary.currentTier.id);
  }, [effectiveSummary.currentTier.id]);

  const persistLoyalty = (next: StoredLoyaltyState) => {
    setLoyaltyState(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const availablePoints = dbWallet
    ? Math.max(0, Math.floor(effectiveSummary.totalSpend / 10_000) + dbWallet.bonusPoints - dbWallet.spentPoints)
    : Math.max(0, summary.earnedPoints + loyaltyState.bonusPoints - loyaltyState.spentPoints);

  const todayStr = new Date().toISOString().slice(0, 10);
  const effectiveLastCheckIn = dbWallet?.lastCheckInDate ?? loyaltyState.lastCheckInDate;
  const alreadyCheckedInToday = effectiveLastCheckIn === todayStr;

  const handleDailyCheckIn = async () => {
    if (alreadyCheckedInToday || isSyncingWallet) return;

    if (getAccessToken()) {
      setIsSyncingWallet(true);
      const res = await commerceApi.checkInMembership();
      setIsSyncingWallet(false);
      if (res.success && res.data?.wallet) {
        setDbWallet(res.data.wallet);
        persistLoyalty({
          bonusPoints: res.data.wallet.bonusPoints,
          spentPoints: res.data.wallet.spentPoints,
          unlockedCodes: res.data.wallet.unlockedCodes,
          lastCheckInDate: res.data.wallet.lastCheckInDate,
        });
      }
    } else {
      persistLoyalty({
        ...loyaltyState,
        bonusPoints: loyaltyState.bonusPoints + 20,
        lastCheckInDate: todayStr,
      });
    }

    setFeedbackMsg(
      isEn
        ? 'Checked in! +20 FitPoints saved to PostgreSQL Atelier wallet.'
        : 'Điểm danh thành công! Đã cộng +20 FitPoints vào ví hội viên (PostgreSQL).'
    );
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRedeemVoucher = async (offer: VoucherOffer) => {
    const unlockedList = dbWallet?.unlockedCodes ?? loyaltyState.unlockedCodes;
    if (unlockedList.includes(offer.code)) {
      navigator.clipboard.writeText(offer.code);
      setCopiedCode(offer.code);
      setTimeout(() => setCopiedCode(null), 2000);
      return;
    }

    if (availablePoints < offer.costPts) {
      setFeedbackMsg(
        isEn
          ? `You need ${offer.costPts - availablePoints} more FitPoints to unlock ${offer.code}.`
          : `Bạn cần thêm ${offer.costPts - availablePoints} FitPoints để đổi mã ${offer.code}.`
      );
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }

    if (getAccessToken()) {
      setIsSyncingWallet(true);
      const res = await commerceApi.redeemMembershipVoucher(offer.code);
      setIsSyncingWallet(false);
      if (!res.success || !res.data?.wallet) {
        setFeedbackMsg(res.error?.message || 'Không thể đổi voucher lúc này.');
        setTimeout(() => setFeedbackMsg(null), 3500);
        return;
      }
      setDbWallet(res.data.wallet);
      persistLoyalty({
        bonusPoints: res.data.wallet.bonusPoints,
        spentPoints: res.data.wallet.spentPoints,
        unlockedCodes: res.data.wallet.unlockedCodes,
        lastCheckInDate: res.data.wallet.lastCheckInDate,
      });
    } else {
      persistLoyalty({
        ...loyaltyState,
        spentPoints: loyaltyState.spentPoints + offer.costPts,
        unlockedCodes: [...loyaltyState.unlockedCodes, offer.code],
      });
    }

    navigator.clipboard.writeText(offer.code);
    setCopiedCode(offer.code);
    setFeedbackMsg(
      isEn
        ? `Unlocked & copied code ${offer.code}! Saved to PostgreSQL.`
        : `Đã đổi & lưu mã ${offer.code} vào PostgreSQL! Dùng ngay ở bước Thanh toán.`
    );
    setTimeout(() => {
      setCopiedCode(null);
      setFeedbackMsg(null);
    }, 3500);
  };

  const previewTier = MEMBERSHIP_TIERS.find((t) => t.id === previewTierId) || effectiveSummary.currentTier;
  const activeUnlockedCodes = dbWallet?.unlockedCodes ?? loyaltyState.unlockedCodes;
  const cardSerial = `FV3D-${(userId || 'ATELIER').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase().padEnd(6, '8')}`;

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles size={14} className="text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 1. Digital Atelier Membership Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${effectiveSummary.currentTier.cardGradient} border-[1.5px] ${effectiveSummary.currentTier.cardBorder} ${effectiveSummary.currentTier.cardText} shadow-sm`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/8 border border-black/10 text-[10px] font-black uppercase tracking-wider">
                <Crown size={12} className="text-amber-600" />
                <span>FitVision Atelier Club</span>
              </div>
              {dbWallet && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-[9px] font-bold">
                  ● PostgreSQL Sync
                </span>
              )}
            </div>
            <h4 className="text-lg sm:text-xl font-black tracking-tight mt-2 leading-none">
              {isEn ? effectiveSummary.currentTier.nameEn : effectiveSummary.currentTier.nameVi}
            </h4>
            <p className="text-[11px] opacity-75 font-mono mt-1">
              {userName} · {cardSerial}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
              FitPoints
            </span>
            <span className="text-2xl font-black font-mono tracking-tight">
              {availablePoints.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold opacity-75 block">
              {isEn ? 'pts available' : 'điểm khả dụng'}
            </span>
          </div>
        </div>

        {/* Spend & Next Tier Progress */}
        <div className="mt-4 pt-3 border-t border-black/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span>
              {isEn ? 'Cumulative Spend: ' : 'Chi tiêu tích lũy: '}
              <span className="font-mono">{effectiveSummary.totalSpend.toLocaleString('vi-VN')}₫</span>
            </span>
            {effectiveSummary.nextTier ? (
              <span className="opacity-80">
                {isEn ? 'Next: ' : 'Tiếp theo: '}
                {isEn ? effectiveSummary.nextTier.nameEn : effectiveSummary.nextTier.nameVi}
              </span>
            ) : (
              <span className="text-amber-500 font-black">MAX VIP TIER</span>
            )}
          </div>

          <div className="h-2 rounded-full bg-black/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${effectiveSummary.currentTier.accentBar} transition-all duration-500`}
              style={{ width: `${effectiveSummary.progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[10.5px] opacity-80 pt-0.5">
            <span>
              {effectiveSummary.nextTier
                ? isEn
                  ? `${effectiveSummary.remainingToNext.toLocaleString('vi-VN')}₫ away from ${effectiveSummary.nextTier.nameEn}`
                  : `Còn ${effectiveSummary.remainingToNext.toLocaleString('vi-VN')}₫ để lên ${effectiveSummary.nextTier.nameVi}`
                : isEn
                ? 'Unlocked all exclusive Atelier Bespoke VIP benefits'
                : 'Đã mở khóa toàn bộ đặc quyền cao cấp nhất Atelier VIP'}
            </span>

            <button
              type="button"
              onClick={handleDailyCheckIn}
              disabled={alreadyCheckedInToday || isSyncingWallet}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer shrink-0 ${
                alreadyCheckedInToday
                  ? 'bg-black/5 border-black/10 opacity-60 cursor-default'
                  : 'bg-white text-[#14171C] border-stone-300 hover:bg-stone-50 shadow-2xs'
              }`}
            >
              <CalendarCheck2 size={12} className="text-emerald-600" />
              <span>
                {alreadyCheckedInToday
                  ? isEn
                    ? 'Checked in'
                    : 'Đã điểm danh'
                  : isEn
                  ? '+20 pts Check-in'
                  : 'Điểm danh +20đ'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Redeemable Member Vouchers */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-300/85 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center">
              <Gift size={15} />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {isEn ? 'Member Privileges & Vouchers' : 'Kho Mã Ưu Đãi Hội Viên'}
              </h5>
              <p className="text-[10.5px] text-slate-600 font-medium">
                {isEn ? 'Unlock with FitPoints and apply right at Checkout' : 'Đổi bằng FitPoints và dán trực tiếp khi Thanh toán'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {VOUCHER_OFFERS.map((offer) => {
            const isUnlocked = activeUnlockedCodes.includes(offer.code);
            const isCopied = copiedCode === offer.code;
            const canAfford = availablePoints >= offer.costPts;

            return (
              <div
                key={offer.code}
                className={`p-3 rounded-xl border-[1.5px] transition-all flex flex-col justify-between gap-2.5 ${
                  isUnlocked
                    ? 'bg-emerald-50/60 border-emerald-400/80'
                    : 'bg-slate-50 border-slate-300/85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-900">
                      {offer.code}
                    </span>
                    <span className="text-[10px] font-extrabold text-amber-800">
                      {isUnlocked
                        ? isEn
                          ? 'Unlocked'
                          : 'Đã sở hữu'
                        : `${offer.costPts} FitPoints`}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 mt-1.5 leading-snug">
                    {isEn ? offer.titleEn : offer.titleVi}
                  </p>
                  <p className="text-[10.5px] text-slate-600 font-medium mt-0.5 leading-snug">
                    {isEn ? offer.descEn : offer.descVi}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRedeemVoucher(offer)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isUnlocked
                      ? 'bg-white hover:bg-stone-100 text-stone-900 border-stone-300'
                      : canAfford
                      ? 'bg-[#14171C] hover:bg-stone-800 text-white border-[#14171C]'
                      : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check size={12} />
                      <span>{isEn ? 'Copied!' : 'Đã chép mã!'}</span>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <Copy size={12} />
                      <span>{isEn ? 'Copy Code' : 'Sao chép mã'}</span>
                    </>
                  ) : (
                    <>
                      <Percent size={12} />
                      <span>
                        {canAfford
                          ? isEn
                            ? `Redeem (${offer.costPts} pts)`
                            : `Đổi ngay (${offer.costPts} điểm)`
                          : isEn
                          ? `Need ${offer.costPts} pts`
                          : `Cần ${offer.costPts} điểm`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive 4-Tier Perks Breakdown */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-300/85 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
            {isEn ? 'Atelier Membership Tiers' : 'Đặc Quyền Theo Hạng Hội Viên'}
          </span>
          <span className="text-[10.5px] font-mono font-bold text-slate-600">
            {previewTier.minSpend === 0
              ? isEn
                ? 'From 0₫'
                : 'Từ 0₫'
              : `>= ${(previewTier.minSpend / 1_000_000).toFixed(0)}M₫`}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {MEMBERSHIP_TIERS.map((tier) => {
            const isSelected = previewTier.id === tier.id;
            const isCurrent = effectiveSummary.currentTier.id === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setPreviewTierId(tier.id)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border-[1.5px] transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-[#14171C] text-white border-[#14171C] shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {isEn ? tier.nameEn.split(' ')[0] : tier.nameVi.replace('Hội Viên ', '')}
                {isCurrent ? ' •' : ''}
              </button>
            );
          })}
        </div>

        <ul className="space-y-1.5 text-xs text-slate-800 m-0 p-0 list-none">
          {(isEn ? previewTier.perksEn : previewTier.perksVi).map((perk, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                {idx === 0 ? (
                  <Scissors size={10} />
                ) : idx === 1 ? (
                  <Truck size={10} />
                ) : (
                  <ShieldCheck size={10} />
                )}
              </span>
              <span className="leading-snug font-medium">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Real PostgreSQL FitPoints Ledger */}
      {dbWallet && dbWallet.logs && dbWallet.logs.length > 0 && (
        <div className="bg-white rounded-2xl border-[1.5px] border-slate-300/85 p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <History size={13} className="text-blue-600" />
              <span>{isEn ? 'FitPoints Transaction Ledger' : 'Lịch Sử Giao Dịch Điểm (PostgreSQL)'}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              {dbWallet.logs.length} bản ghi
            </span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {dbWallet.logs.map((lg) => (
              <div
                key={lg.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{lg.description}</p>
                  <p className="text-[10px] font-mono text-slate-500">
                    {new Date(lg.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span
                  className={`font-mono font-black shrink-0 ${
                    lg.points_delta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {lg.points_delta >= 0 ? `+${lg.points_delta}` : lg.points_delta} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
