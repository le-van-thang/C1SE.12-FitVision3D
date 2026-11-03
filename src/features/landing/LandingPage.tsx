import React, { useState } from 'react';
import { useTranslation, useI18n } from '@/i18n';
import { Button, Badge, Card } from '@/components/ui';
import {
  Camera,
  Ruler,
  ShieldCheck,
  Scissors,
  ArrowRight,
  Sun,
  Moon,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface LandingPageProps {
  onStartScan?: () => void;
  onExploreDemo?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartScan = () => {
    window.location.href = '/app/scan';
  },
  onExploreDemo = () => {
    window.location.href = '/_kit';
  },
}) => {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();
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

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors flex flex-col relative">
      {/* Subtle faint tape measure line on the far left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 border-r border-kraft/30 pointer-events-none opacity-20 hidden md:block">
        <div className="h-full flex flex-col justify-between py-6">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={`w-full bg-ink ${i % 10 === 0 ? 'h-[1.5px]' : i % 5 === 0 ? 'h-[1px]' : 'h-[0.5px]'}`}
            />
          ))}
        </div>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-kraft/60 px-6 py-4">
        <div className="max-w-content mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <div className="inline-flex items-center rounded-control border border-kraft/60 bg-paper-2 p-0.5">
              <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-[8px] transition-colors ${
                  locale === 'vi' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-[8px] transition-colors ${
                  locale === 'en' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
                }`}
              >
                EN
              </button>
            </div>

            {/* Dark Mode toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleDarkMode}
              icon={isDarkMode ? <Sun className="w-3.5 h-3.5 text-ochre" /> : <Moon className="w-3.5 h-3.5 text-indigo" />}
            >
              {isDarkMode ? t('common.light') : t('common.dark')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => (window.location.href = '/_kit')}
            >
              {t('nav.uiKit')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onStartScan}
            >
              {t('landing.ctaStart')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Landing Content Container */}
      <main className="flex-1 max-w-content mx-auto w-full px-6 py-12 sm:py-16 space-y-20">
        {/* HERO SECTION: Asymmetric Editorial Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-4">
          {/* Left Column: Headlines & CTA (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="indigo" dot>
              {t('landing.badge')}
            </Badge>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.18] tracking-tight">
              {t('landing.headline')}
            </h1>

            <p className="font-sans text-base text-ink-2 leading-relaxed max-w-prose-editorial">
              {t('landing.description')}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button
                variant="accent"
                size="lg"
                onClick={onStartScan}
                icon={<Camera className="w-4 h-4" />}
              >
                {t('landing.ctaStart')}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onExploreDemo}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                {t('landing.ctaDemo')}
              </Button>
            </div>

            {/* Stats row */}
            <div className="pt-8 border-t border-kraft/40 grid grid-cols-3 gap-6">
              <div>
                <span className="font-mono text-xl sm:text-2xl font-semibold text-ink block">
                  ± 4.5 mm
                </span>
                <span className="text-xs text-ink-2 font-sans mt-0.5 block">
                  {t('landing.statAccuracy')}
                </span>
              </div>
              <div>
                <span className="font-mono text-xl sm:text-2xl font-semibold text-moss block">
                  &lt; 3.0 s
                </span>
                <span className="text-xs text-ink-2 font-sans mt-0.5 block">
                  {t('landing.statSla')}
                </span>
              </div>
              <div>
                <span className="font-mono text-xl sm:text-2xl font-semibold text-indigo block">
                  RAM 100%
                </span>
                <span className="text-xs text-ink-2 font-sans mt-0.5 block">
                  {t('landing.statPrivacy')}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Mannequin Visualization (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-card border border-kraft/60 bg-paper-2 p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-kraft/40">
                <span className="text-xs font-sans text-ink-2">Mô hình ma-nơ-canh ba chiều</span>
                <Badge variant="moss" dot>ISO 8559</Badge>
              </div>

              {/* Vector blueprint silhouette preview */}
              <div className="aspect-[4/5] rounded-control bg-paper border border-kraft/40 relative flex items-center justify-center overflow-hidden p-6">
                <svg
                  viewBox="0 0 200 320"
                  className="w-full h-full text-indigo/80 stroke-current fill-none stroke-[1.2]"
                >
                  {/* Head */}
                  <ellipse cx="100" cy="38" rx="18" ry="24" className="stroke-indigo fill-paper-2/40" />
                  {/* Nasion anchor mark */}
                  <circle cx="100" cy="36" r="2.5" className="fill-vermilion stroke-none" />
                  <line x1="90" y1="36" x2="110" y2="36" className="stroke-vermilion stroke-[0.8]" />

                  {/* Torso */}
                  <path d="M 68 76 C 75 70, 125 70, 132 76 L 126 140 C 122 170, 78 170, 74 140 Z" className="fill-paper-2/20" />

                  {/* Chest Slicing Ellipse */}
                  <ellipse cx="100" cy="100" rx="36" ry="7" className="stroke-indigo stroke-dasharray-[3_2]" />
                  <text x="142" y="103" className="fill-ink-2 text-[8px] font-mono stroke-none">
                    94.0cm
                  </text>

                  {/* Waist Slicing Ellipse */}
                  <ellipse cx="100" cy="132" rx="28" ry="6" className="stroke-indigo stroke-dasharray-[3_2]" />
                  <text x="134" y="135" className="fill-ink-2 text-[8px] font-mono stroke-none">
                    78.5cm
                  </text>

                  {/* Pelvis & Hips */}
                  <ellipse cx="100" cy="165" rx="38" ry="8" className="stroke-indigo stroke-dasharray-[3_2]" />
                  <text x="144" y="168" className="fill-ink-2 text-[8px] font-mono stroke-none">
                    96.0cm
                  </text>

                  {/* Legs */}
                  <line x1="84" y1="172" x2="80" y2="295" className="stroke-kraft" />
                  <line x1="116" y1="172" x2="120" y2="295" className="stroke-kraft" />
                  {/* Arms */}
                  <line x1="68" y1="76" x2="48" y2="185" className="stroke-kraft" />
                  <line x1="132" y1="76" x2="152" y2="185" className="stroke-kraft" />
                </svg>

                {/* Floating Dimension Callout */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-control bg-paper-2 border border-kraft/60 shadow-subtle text-[11px] font-mono">
                  Chiều cao: <span className="font-semibold text-ink">172.5 cm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THREE STEPS HORIZONTAL TIMELINE (Not identical cards) */}
        <section className="space-y-8 pt-4">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h2 className="font-sans text-2xl font-semibold text-ink tracking-tight">
              {t('landing.timelineTitle')}
            </h2>
            <p className="text-xs text-ink-2 font-sans">
              Quy trình đo đạc kỹ thuật số tuân thủ nghiêm ngặt nguyên lý quang học và giải phẫu người.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-card border border-kraft/60 bg-paper-2 space-y-3 relative shadow-card">
              <span className="font-mono text-xs text-indigo font-semibold block">
                01
              </span>
              <h3 className="font-sans text-base font-semibold text-ink">
                {t('landing.step1Title')}
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed font-sans">
                {t('landing.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-card border border-kraft/60 bg-paper-2 space-y-3 relative shadow-card">
              <span className="font-mono text-xs text-vermilion font-semibold block">
                02
              </span>
              <h3 className="font-sans text-base font-semibold text-ink">
                {t('landing.step2Title')}
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed font-sans">
                {t('landing.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-card border border-kraft/60 bg-paper-2 space-y-3 relative shadow-card">
              <span className="font-mono text-xs text-moss font-semibold block">
                03
              </span>
              <h3 className="font-sans text-base font-semibold text-ink">
                {t('landing.step3Title')}
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed font-sans">
                {t('landing.step3Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRIVACY COMMITMENT (ZERO-IMAGE RETENTION) */}
        <section className="rounded-card border border-kraft/60 bg-paper-2 p-8 sm:p-10 shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <Badge variant="vermilion" dot>
                {t('landing.statPrivacy')}
              </Badge>
              <h2 className="font-sans text-2xl font-semibold text-ink tracking-tight">
                {t('landing.privacyTitle')}
              </h2>
              <p className="text-sm text-ink-2 font-sans leading-relaxed max-w-prose-editorial">
                {t('landing.privacyDesc')}
              </p>
              <ul className="space-y-2 pt-2 text-xs text-ink-2 font-sans">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                  {t('landing.privacyPoint1')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                  {t('landing.privacyPoint2')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                  {t('landing.privacyPoint3')}
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="w-24 h-24 rounded-modal border border-kraft/60 bg-paper flex items-center justify-center text-vermilion shadow-subtle">
                <ShieldCheck className="w-12 h-12" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: TAILOR ATELIER BLOCK */}
        <section className="rounded-card border border-kraft/60 bg-kraft/15 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <Badge variant="kraft">Xưởng may đo</Badge>
              <h2 className="font-sans text-2xl font-semibold text-ink tracking-tight">
                {t('landing.studioTitle')}
              </h2>
              <p className="text-sm text-ink-2 font-sans leading-relaxed">
                {t('landing.studioDesc')}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => (window.location.href = '/studio')}
              icon={<Scissors className="w-4 h-4" />}
            >
              {t('landing.studioCta')}
            </Button>
          </div>
        </section>
      </main>

      {/* REFINED CLEAN FOOTER */}
      <footer className="border-t border-kraft/60 bg-paper-2 py-8 px-6 text-xs text-ink-2 font-sans mt-auto">
        <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{t('brand.name')}</span>
            <span>—</span>
            <span>ISO 8559-1:2017</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => (window.location.href = '/_kit')}
              className="hover:text-ink transition-colors"
            >
              {t('nav.uiKit')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => (window.location.href = '/app')}
              className="hover:text-ink transition-colors"
            >
              {t('nav.overview')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => (window.location.href = '/studio')}
              className="hover:text-ink transition-colors"
            >
              {t('nav.studio')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
