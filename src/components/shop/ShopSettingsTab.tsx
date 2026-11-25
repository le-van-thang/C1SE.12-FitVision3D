import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  PauseCircle,
  Truck,
  Landmark,
  Lock,
  Bell,
  ExternalLink,
} from 'lucide-react';
import type {
  DbShopBankAccount,
  DbShopProfile,
  ShopReputationSummary,
} from '@/services/commerceApi';
import { useI18n } from '@/i18n';
import { ProfileDecorationSection } from './settings/ProfileDecorationSection';
import { OperationsSection } from './settings/OperationsSection';
import { ShippingSection } from './settings/ShippingSection';
import { PaymentTaxSection } from './settings/PaymentTaxSection';
import { SecuritySection } from './settings/SecuritySection';
import { NotificationsSection } from './settings/NotificationsSection';

type SettingsSection =
  | 'profile'
  | 'operations'
  | 'shipping'
  | 'payment'
  | 'security'
  | 'notifications';

interface ShopSettingsTabProps {
  shop: DbShopProfile;
  bankAccount: DbShopBankAccount | null;
  reputation: ShopReputationSummary | null;
  userEmail?: string;
  authProvider?: 'google' | 'password';
  onShopUpdated: (updated: DbShopProfile) => void;
  onBankUpdated: (updated: DbShopBankAccount) => void;
  onReloadDashboard: () => Promise<void> | void;
  onSignedOutAll: () => Promise<void> | void;
}

export const ShopSettingsTab: React.FC<ShopSettingsTabProps> = ({
  shop,
  bankAccount,
  reputation,
  userEmail,
  authProvider = 'password',
  onShopUpdated,
  onBankUpdated,
  onReloadDashboard,
  onSignedOutAll,
}) => {
  const { t } = useI18n();
  const [section, setSection] = useState<SettingsSection>('profile');
  const isGoogleAccount = authProvider === 'google';
  const isApproved = shop.status === 'APPROVED';

  const navItems: Array<{
    id: SettingsSection;
    label: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'profile',
      label: t('shopSettings.navProfile'),
      desc: t('shopSettings.navProfileDesc'),
      icon: <Store size={15} />,
    },
    {
      id: 'operations',
      label: t('shopSettings.navOperations'),
      desc: t('shopSettings.navOperationsDesc'),
      icon: <PauseCircle size={15} />,
      badge: shop.operational_mode === 'VACATION' ? t('shopSettings.badgeVacation') : undefined,
    },
    {
      id: 'shipping',
      label: t('shopSettings.navShipping'),
      desc: t('shopSettings.navShippingDesc'),
      icon: <Truck size={15} />,
    },
    {
      id: 'payment',
      label: t('shopSettings.navPayment'),
      desc: t('shopSettings.navPaymentDesc'),
      icon: <Landmark size={15} />,
    },
    {
      id: 'security',
      label: t('shopSettings.navSecurity'),
      desc: t('shopSettings.navSecurityDesc'),
      icon: <Lock size={15} />,
    },
    {
      id: 'notifications',
      label: t('shopSettings.navNotifications'),
      desc: t('shopSettings.navNotificationsDesc'),
      icon: <Bell size={15} />,
    },
  ];

  return (
    <div className="space-y-5 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
            {t('shopSettings.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {reputation && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full font-mono tabular-nums border ${
                reputation.ratingCount > 0
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}
            >
              ★ {reputation.ratingCount > 0 ? reputation.ratingAvg.toFixed(1) : '0.0'}/5 ({reputation.ratingCount})
            </span>
          )}
          <Link
            to={`/stores/${encodeURIComponent(shop.brand_slug || shop.shop_name)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
          >
            <ExternalLink size={13} /> {t('shopSettings.viewPublicStore')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-2.5 space-y-1">
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                  active ? 'bg-[#14171C] text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950 whitespace-nowrap shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {section === 'profile' && (
            <ProfileDecorationSection
              shop={shop}
              userEmail={userEmail}
              isApproved={isApproved}
              onShopUpdated={onShopUpdated}
              onReloadDashboard={onReloadDashboard}
            />
          )}
          {section === 'operations' && (
            <OperationsSection
              shop={shop}
              isApproved={isApproved}
              onShopUpdated={onShopUpdated}
              onReloadDashboard={onReloadDashboard}
            />
          )}
          {section === 'shipping' && (
            <ShippingSection
              shop={shop}
              isApproved={isApproved}
              onShopUpdated={onShopUpdated}
              onReloadDashboard={onReloadDashboard}
            />
          )}
          {section === 'payment' && (
            <PaymentTaxSection
              shop={shop}
              bankAccount={bankAccount}
              isApproved={isApproved}
              isGoogleAccount={isGoogleAccount}
              userEmail={userEmail}
              onBankUpdated={onBankUpdated}
              onReloadDashboard={onReloadDashboard}
            />
          )}
          {section === 'security' && (
            <SecuritySection
              isGoogleAccount={isGoogleAccount}
              onSignedOutAll={onSignedOutAll}
            />
          )}
          {section === 'notifications' && (
            <NotificationsSection
              shop={shop}
              isApproved={isApproved}
              onShopUpdated={onShopUpdated}
              onReloadDashboard={onReloadDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
};
