// =============================================================================
// FITVISION 3D - USER ACCOUNT SETTINGS (/settings)
// Atelier Editorial Design · Modular 5-Tab Customer Settings
// =============================================================================

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Lock,
  MapPin,
  CreditCard,
  Bell,
  ArrowLeft,
  Sliders,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { AddressBookTab } from '@/components/settings/AddressBookTab';
import { RefundBankTab } from '@/components/settings/RefundBankTab';
import { PrivacyTab } from '@/components/settings/PrivacyTab';

type TabKey = 'profile' | 'security' | 'addresses' | 'bank' | 'privacy';

const VALID_TABS: readonly TabKey[] = ['profile', 'security', 'addresses', 'bank', 'privacy'];

export const UserSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const { currentUser, getUserProfileDetails, userAddresses, refundBank, signOut } = useAuth();

  const rawTab = searchParams.get('tab') as TabKey | null;
  const activeTab: TabKey = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'profile';
  const setActiveTab = (tab: TabKey) => setSearchParams({ tab }, { replace: true });

  const details = getUserProfileDetails(currentUser?.id);
  const profileSyncKey = `${currentUser?.id || ''}|${currentUser?.full_name || ''}|${currentUser?.avatar_url || ''}|${details.phone || ''}|${details.gender || ''}|${details.birth_date || ''}`;

  const navItems: Array<{
    key: TabKey;
    label: string;
    Icon: React.FC<{ size?: number; className?: string }>;
    badge?: React.ReactNode;
  }> = [
    { key: 'profile', label: t('userSettings.nav.profile'), Icon: User },
    { key: 'security', label: t('userSettings.nav.security'), Icon: Lock },
    {
      key: 'addresses',
      label: t('userSettings.nav.addresses'),
      Icon: MapPin,
      badge:
        userAddresses.length > 0 ? (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#E8E1D3] text-[#17150F] font-bold">
            {userAddresses.length}
          </span>
        ) : null,
    },
    {
      key: 'bank',
      label: t('userSettings.nav.bank'),
      Icon: CreditCard,
      badge: refundBank ? (
        <span
          className="w-2 h-2 rounded-full bg-[#3F6B4E]"
          title={t('userSettings.linkedTooltip')}
        />
      ) : null,
    },
    { key: 'privacy', label: t('userSettings.nav.privacy'), Icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#F1ECE2] text-[#17150F] font-sans antialiased pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#F1ECE2]/95 border-b border-[#D8CBB1]/70">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 rounded-control text-[#4A463C] hover:text-[#17150F] hover:bg-[#E8E1D3] transition-colors"
              title={t('userSettings.backToStore')}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-5 w-px bg-[#D8CBB1]" />
            <div>
              <h1 className="font-sans text-xl font-bold text-[#17150F] tracking-tight">
                {t('userSettings.pageTitle')}
              </h1>
              <p className="text-[11px] font-medium text-[#4A463C] hidden sm:block">
                {t('userSettings.pageSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#4A463C] font-mono hidden md:inline">
              {currentUser?.email}
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-control border border-[#D8CBB1] bg-white text-xs font-semibold text-[#17150F] hover:bg-[#E8E1D3]/60 transition-colors"
            >
              {t('userSettings.storefront')}
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 bg-white rounded-card border border-[#D8CBB1]/70 p-4 shadow-card">
            <div className="flex items-center gap-3 pb-4 mb-3 border-b border-[#D8CBB1]/50">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#26356B] shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#26356B] text-white font-bold text-base flex items-center justify-center shrink-0">
                  {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-[#17150F] truncate">
                  {currentUser?.full_name || t('userSettings.customerFallback')}
                </div>
                <div className="text-[11px] text-[#4A463C] truncate flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3F6B4E] shrink-0" />
                  <span className="truncate">{currentUser?.email}</span>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map(({ key, label, Icon, badge }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs transition-colors text-left ${
                      isActive
                        ? 'bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                        : 'text-[#4A463C] font-semibold hover:bg-[#F1ECE2]/60 hover:text-[#17150F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-[#26356B]' : 'text-[#4A463C]/70'} />
                      <span>{label}</span>
                    </div>
                    {badge}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 mt-4 border-t border-[#D8CBB1]/50 space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium text-[#4A463C] hover:bg-[#F1ECE2]/60 hover:text-[#17150F]"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders size={14} />
                  <span>{t('userSettings.nav.bodyStudio')}</span>
                </div>
                <ExternalLink size={12} />
              </button>

              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-semibold text-[#D8452A] hover:bg-[#D8452A]/10 transition-colors"
              >
                <LogOut size={14} />
                <span>{t('userSettings.nav.signOut')}</span>
              </button>
            </div>
          </aside>

          {/* Right Tab Content */}
          <section className="lg:col-span-9 bg-white rounded-card border border-[#D8CBB1]/70 p-6 sm:p-8 shadow-card">
            {activeTab === 'profile' && <ProfileTab key={profileSyncKey} />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'addresses' && <AddressBookTab />}
            {activeTab === 'bank' && <RefundBankTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserSettingsPage;
