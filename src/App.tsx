import React, { useState, useEffect } from 'react';
import { I18nProvider, useTranslation } from '@/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { LandingPage } from '@/features/landing/LandingPage';
import { KitPage } from '@/features/kit/KitPage';
import { AppShell } from '@/components/layout/AppShell';
import { AnthropometryDisplay } from '@/features/anthropometry/AnthropometryDisplay';
import { MannequinViewer } from '@/features/avatar3d/MannequinViewer';
import { CVMonitorCard } from '@/features/cv/CVMonitorCard';
import { CameraFeed } from '@/features/capture/CameraFeed';
import { Button, Badge, Card, FitRuler } from '@/components/ui';
import type { BodyMeasurements } from '@/types';
import {
  Camera,
  Layers,
  Ruler,
  CheckCircle2,
  Sliders,
  History,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

function AppContent() {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  // Interactive measurements state
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: 172.5,
    chestGirth: 94.0,
    waistGirth: 78.5,
    hipGirth: 96.0,
    shoulderBreadth: 43.5,
    armLength: 61.0,
    insideLegLength: 79.5,
    unit: 'cm',
    confidenceScore: 0.96,
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. Landing Page Route
  if (currentPath === '/') {
    return (
      <LandingPage
        onStartScan={() => navigate('/app/scan')}
        onExploreDemo={() => navigate('/_kit')}
      />
    );
  }

  // 2. Storybook-lite / UI Kit Route
  if (currentPath === '/_kit') {
    return <KitPage />;
  }

  // 3. Shopper Scan Wizard Route
  if (currentPath === '/app/scan') {
    return (
      <AppShell
        currentPath={currentPath}
        pageTitle={t('scan.title')}
        pageSubtitle="Quy trình 7 bước đo nhân trắc học không tiếp xúc"
        onNavigate={navigate}
        primaryAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app')}
          >
            {t('common.cancel')}
          </Button>
        }
      >
        <div className="space-y-6">
          <CameraFeed
            onCaptureCompleted={() => {
              navigate('/app/results');
            }}
          />
        </div>
      </AppShell>
    );
  }

  // 4. Shopper Results & 3D Mannequin Route
  if (currentPath === '/app/results') {
    return (
      <AppShell
        currentPath={currentPath}
        pageTitle={t('nav.results')}
        pageSubtitle="Hồ sơ nhân trắc học giải phẫu theo tiêu chuẩn quốc tế ISO 8559-1"
        onNavigate={navigate}
        primaryAction={
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate('/app/scan')}
            icon={<Camera className="w-4 h-4" />}
          >
            {t('scan.retake')}
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <AnthropometryDisplay measurements={measurements} />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <MannequinViewer measurements={measurements} />
          </div>
        </div>
      </AppShell>
    );
  }

  // 5. Shopper Fit Guide Route
  if (currentPath === '/app/fit') {
    return (
      <AppShell
        currentPath={currentPath}
        pageTitle={t('fit.title')}
        pageSubtitle="So khớp số đo với bảng kích cỡ thương hiệu"
        onNavigate={navigate}
      >
        <div className="space-y-6 max-w-3xl">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-kraft/40">
                <div>
                  <h3 className="font-sans text-base font-semibold text-ink">
                    Kích cỡ đề xuất: <span className="text-indigo font-bold">M (Medium)</span>
                  </h3>
                  <p className="text-xs text-ink-2 mt-0.5">Dựa trên vòng ngực 94.0 cm và vòng eo 78.5 cm</p>
                </div>
                <Badge variant="moss" dot>Đạt chuẩn</Badge>
              </div>

              <div className="space-y-3">
                <FitRuler
                  label={t('measurements.chest')}
                  userValue={measurements.chestGirth}
                  minRange={92.0}
                  maxRange={96.0}
                />
                <FitRuler
                  label={t('measurements.waist')}
                  userValue={measurements.waistGirth}
                  minRange={76.0}
                  maxRange={80.0}
                />
                <FitRuler
                  label={t('measurements.hips')}
                  userValue={measurements.hipGirth}
                  minRange={94.0}
                  maxRange={98.0}
                />
              </div>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // 6. Tailor Studio Route
  if (currentPath.startsWith('/studio')) {
    return (
      <AppShell
        currentPath={currentPath}
        pageTitle="Xưởng May Đo (Tailor Studio)"
        pageSubtitle="Quản lý hồ sơ khách hàng, bảng kích cỡ thương hiệu và độ rộng thoải mái"
        onNavigate={navigate}
        primaryAction={
          <Button variant="primary" size="sm">
            Tạo bảng kích cỡ mới
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <span className="text-xs text-ink-2 block">Tổng hồ sơ khách</span>
            <span className="font-mono text-2xl font-semibold text-ink block mt-1">24</span>
            <span className="text-[11px] text-moss mt-1 block">8 hồ sơ mới trong tuần</span>
          </Card>
          <Card>
            <span className="text-xs text-ink-2 block">Bảng kích cỡ hoạt động</span>
            <span className="font-mono text-2xl font-semibold text-ink block mt-1">6</span>
            <span className="text-[11px] text-ink-2 mt-1 block">Tops & Bottoms (US/EU/TCVN)</span>
          </Card>
          <Card>
            <span className="text-xs text-ink-2 block">Dung sai độ rộng (Ease)</span>
            <span className="font-mono text-2xl font-semibold text-indigo block mt-1">± 2.0 cm</span>
            <span className="text-[11px] text-ink-2 mt-1 block">Đã hiệu chỉnh theo kiểu dáng</span>
          </Card>
        </div>
      </AppShell>
    );
  }

  // 7. Admin Console Route
  if (currentPath.startsWith('/admin')) {
    return (
      <AppShell
        currentPath={currentPath}
        pageTitle="Bảng Điều Khiển Quản Trị"
        pageSubtitle="Giám sát bảo mật Zero-Retention, độ trễ và số lượt quét toàn hệ thống"
        onNavigate={navigate}
        primaryAction={
          <Button variant="secondary" size="sm">
            Xuất báo cáo tuân thủ
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <span className="text-xs text-ink-2 block">Tổng phiên quét</span>
            <span className="font-mono text-2xl font-semibold text-ink block mt-1">1,482</span>
            <span className="text-[11px] text-moss mt-1 block">100% tuân thủ Zero-Retention</span>
          </Card>
          <Card>
            <span className="text-xs text-ink-2 block">Độ trễ trung vị p50</span>
            <span className="font-mono text-2xl font-semibold text-indigo block mt-1">1.82 s</span>
            <span className="text-[11px] text-ink-2 mt-1 block">Mục tiêu SLA &lt; 3.0s</span>
          </Card>
          <Card>
            <span className="text-xs text-ink-2 block">Trạng thái máy chủ</span>
            <span className="font-mono text-2xl font-semibold text-moss block mt-1">Bình thường</span>
            <span className="text-[11px] text-ink-2 mt-1 block">WASM client active</span>
          </Card>
        </div>
      </AppShell>
    );
  }

  // 8. Default: Shopper Overview (`/app`)
  return (
    <AppShell
      currentPath="/app"
      pageTitle={t('nav.overview')}
      pageSubtitle="Tổng quan số đo nhân trắc học và gợi ý kích cỡ gần nhất"
      onNavigate={navigate}
      primaryAction={
        <Button
          variant="accent"
          size="sm"
          onClick={() => navigate('/app/scan')}
          icon={<Camera className="w-4 h-4" />}
        >
          {t('nav.scan')}
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <span className="text-xs text-ink-2 block">{t('measurements.stature')}</span>
            <span className="font-mono text-xl font-semibold text-ink block mt-1">
              {measurements.height} cm
            </span>
            <span className="text-[11px] text-ink-2/70 font-mono mt-0.5 block">ISO 8559-1</span>
          </Card>

          <Card>
            <span className="text-xs text-ink-2 block">{t('measurements.chest')}</span>
            <span className="font-mono text-xl font-semibold text-ink block mt-1">
              {measurements.chestGirth} cm
            </span>
            <span className="text-[11px] text-ink-2/70 font-mono mt-0.5 block">Vòng ngực</span>
          </Card>

          <Card>
            <span className="text-xs text-ink-2 block">{t('measurements.waist')}</span>
            <span className="font-mono text-xl font-semibold text-ink block mt-1">
              {measurements.waistGirth} cm
            </span>
            <span className="text-[11px] text-ink-2/70 font-mono mt-0.5 block">Vòng eo</span>
          </Card>

          <Card>
            <span className="text-xs text-ink-2 block">{t('measurements.hips')}</span>
            <span className="font-mono text-xl font-semibold text-ink block mt-1">
              {measurements.hipGirth} cm
            </span>
            <span className="text-[11px] text-ink-2/70 font-mono mt-0.5 block">Vòng mông</span>
          </Card>
        </div>

        {/* Interactive Mannequin 3D & Pipeline Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <AnthropometryDisplay measurements={measurements} />
            <CVMonitorCard />
          </div>

          <div className="lg:col-span-5 space-y-6 sticky top-20">
            <MannequinViewer measurements={measurements} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </I18nProvider>
  );
}

export default App;
