import React, { useState } from 'react';
import { useTranslation, useI18n } from '@/i18n';
import {
  Ruler,
  Camera,
  Layers,
  History,
  Scissors,
  Users,
  ShieldAlert,
  Activity,
  Settings,
  Sun,
  Moon,
  Sliders,
  Sparkles,
  FileText,
  Home,
} from 'lucide-react';

export type UserRole = 'shopper' | 'tailor' | 'admin';

export interface AppShellProps {
  currentPath?: string;
  pageTitle: string;
  pageSubtitle?: string;
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
  onNavigate?: (path: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPath = '/app',
  pageTitle,
  pageSubtitle,
  primaryAction,
  children,
  onNavigate = (path) => {
    window.location.href = path;
  },
}) => {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();
  const [role, setRole] = useState<UserRole>('shopper');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Nav Items based on Role
  const shopperNav = [
    { id: '/app', label: t('nav.overview'), icon: <Home className="w-4 h-4" /> },
    { id: '/app/scan', label: t('nav.scan'), icon: <Camera className="w-4 h-4" /> },
    { id: '/app/results', label: t('nav.results'), icon: <Layers className="w-4 h-4" /> },
    { id: '/app/fit', label: t('nav.fit'), icon: <Ruler className="w-4 h-4" /> },
    { id: '/app/history', label: t('nav.history'), icon: <History className="w-4 h-4" /> },
    { id: '/app/settings', label: t('nav.settings'), icon: <Settings className="w-4 h-4" /> },
  ];

  const tailorNav = [
    { id: '/studio', label: t('nav.overview'), icon: <Scissors className="w-4 h-4" /> },
    { id: '/studio/dossiers', label: t('nav.dossiers'), icon: <FileText className="w-4 h-4" /> },
    { id: '/studio/charts', label: t('nav.charts'), icon: <Layers className="w-4 h-4" /> },
    { id: '/studio/rules', label: t('nav.rules'), icon: <Sliders className="w-4 h-4" /> },
  ];

  const adminNav = [
    { id: '/admin', label: t('nav.overview'), icon: <Activity className="w-4 h-4" /> },
    { id: '/admin/users', label: t('admin.users', 'Người dùng'), icon: <Users className="w-4 h-4" /> },
    { id: '/admin/audit', label: t('admin.audit', 'Kiểm toán'), icon: <ShieldAlert className="w-4 h-4" /> },
    { id: '/admin/performance', label: t('admin.performance', 'Hiệu năng'), icon: <Sparkles className="w-4 h-4" /> },
  ];

  const navItems = role === 'shopper' ? shopperNav : role === 'tailor' ? tailorNav : adminNav;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col lg:flex-row transition-colors">
      {/* DESKTOP & TABLET SIDEBAR */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-kraft/60 bg-paper-2 flex-col justify-between sticky top-0 h-screen select-none">
        <div className="p-4 space-y-6">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('/')}
          >
            <div className="w-8 h-8 rounded-control bg-indigo flex items-center justify-center text-white font-serif font-bold text-base shadow-subtle">
              F
            </div>
            <div>
              <span className="font-sans font-semibold text-sm tracking-tight text-ink block leading-none">
                {t('brand.name')}
              </span>
              <span className="text-[11px] text-ink-2 font-sans mt-0.5 block leading-none">
                {t('brand.atelier')}
              </span>
            </div>
          </div>

          {/* Role Switcher (Mock Demo Bar) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-sans text-ink-2 uppercase tracking-wider block">
              Vai trò (Demo)
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-control bg-kraft/20 border border-kraft/50 text-[11px] font-sans">
              <button
                type="button"
                onClick={() => {
                  setRole('shopper');
                  onNavigate('/app');
                }}
                className={`py-1 rounded-[6px] text-center font-medium transition-colors ${
                  role === 'shopper' ? 'bg-paper text-indigo shadow-subtle' : 'text-ink-2 hover:text-ink'
                }`}
              >
                Shopper
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('tailor');
                  onNavigate('/studio');
                }}
                className={`py-1 rounded-[6px] text-center font-medium transition-colors ${
                  role === 'tailor' ? 'bg-paper text-indigo shadow-subtle' : 'text-ink-2 hover:text-ink'
                }`}
              >
                Tailor
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  onNavigate('/admin');
                }}
                className={`py-1 rounded-[6px] text-center font-medium transition-colors ${
                  role === 'admin' ? 'bg-paper text-indigo shadow-subtle' : 'text-ink-2 hover:text-ink'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-sans font-medium transition-colors ${
                    isActive
                      ? 'bg-paper text-indigo shadow-subtle border border-kraft/50'
                      : 'text-ink-2 hover:text-ink hover:bg-kraft/20'
                  }`}
                >
                  <span className={isActive ? 'text-indigo' : 'text-ink-2'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-kraft/40 space-y-3">
          {/* Language & Theme row */}
          <div className="flex items-center justify-between">
            {/* Language Switch */}
            <div className="inline-flex items-center rounded-control border border-kraft/60 bg-paper p-0.5">
              <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-[6px] ${
                  locale === 'vi' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-[6px] ${
                  locale === 'en' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
                }`}
              >
                EN
              </button>
            </div>

            {/* Dark Mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-1.5 rounded-control text-ink-2 hover:text-ink hover:bg-kraft/20 transition-colors"
              aria-label="Đổi giao diện sáng tối"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-ochre" /> : <Moon className="w-4 h-4 text-indigo" />}
            </button>
          </div>

          {/* User Profile Snippet */}
          <div className="flex items-center justify-between pt-2 border-t border-kraft/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-pill bg-kraft/40 border border-kraft flex items-center justify-center text-xs font-medium">
                U
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-medium text-ink block truncate">
                  Người dùng thử nghiệm
                </span>
                <span className="text-[10px] text-ink-2 block truncate">
                  {role === 'shopper' ? 'Khách mua sắm' : role === 'tailor' ? 'Xưởng may' : 'Quản trị viên'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-paper-2/95 backdrop-blur-sm border-b border-kraft/60 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-ink font-sans leading-tight">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-xs text-ink-2 font-sans mt-0.5 leading-tight">
                {pageSubtitle}
              </p>
            )}
          </div>

          {/* Mobile top controls */}
          <div className="flex items-center gap-2.5">
            <div className="lg:hidden inline-flex items-center rounded-control border border-kraft/60 bg-paper p-0.5">
              <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-[6px] ${
                  locale === 'vi' ? 'bg-indigo text-white' : 'text-ink-2'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-[6px] ${
                  locale === 'en' ? 'bg-indigo text-white' : 'text-ink-2'
                }`}
              >
                EN
              </button>
            </div>

            {primaryAction && <div>{primaryAction}</div>}
          </div>
        </header>

        {/* Page Content Body (Max Width 1200px) */}
        <main className="flex-1 max-w-content w-full mx-auto p-4 sm:p-8 space-y-6 pb-28 lg:pb-12">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-2/95 backdrop-blur-md border-t border-kraft/60 px-2 py-1.5 flex items-center justify-around">
        {shopperNav.slice(0, 5).map((item) => {
          const isActive = currentPath === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-control transition-colors ${
                isActive ? 'text-indigo font-medium' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {item.icon}
              </span>
              <span className="text-[10px] font-sans mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default AppShell;
