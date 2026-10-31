import React, { useState } from 'react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  SegmentedControl,
  Switch,
  Field,
  Select,
  Stepper,
  Tooltip,
  Popover,
  Banner,
  EmptyState,
  Skeleton,
  TapeMeasureProgress,
  FitRuler,
  Modal,
  Sheet,
  useToast,
} from '@/components/ui';
import { useTranslation, useI18n } from '@/i18n';
import {
  Camera,
  Sun,
  Moon,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';

export const KitPage: React.FC = () => {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();
  const { showToast } = useToast();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('colors');
  const [currentStep, setCurrentStep] = useState(3);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [unitSegment, setUnitSegment] = useState<'cm' | 'inch'>('cm');
  const [stepperValue, setStepperValue] = useState(2);

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

  const scanSteps = [
    { id: 1, label: t('scan.step1') },
    { id: 2, label: t('scan.step2') },
    { id: 3, label: t('scan.step3') },
    { id: 4, label: t('scan.step4') },
    { id: 5, label: t('scan.step5') },
    { id: 6, label: t('scan.step6') },
    { id: 7, label: t('scan.step7') },
  ];

  const tocItems = [
    { id: 'colors', label: t('kit.colors') },
    { id: 'typography', label: t('kit.typography') },
    { id: 'buttons', label: t('kit.buttons') },
    { id: 'controls', label: t('kit.controls') },
    { id: 'inputs', label: t('kit.inputs') },
    { id: 'feedback', label: t('kit.feedback') },
    { id: 'rulers', label: t('kit.rulers') },
    { id: 'cards', label: t('kit.cards') },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-paper-2/95 backdrop-blur-sm border-b border-kraft/60 px-6 py-4">
        <div className="max-w-content mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo font-medium">v2.5</span>
              <span className="text-ink-2 text-xs">/</span>
              <span className="text-xs text-ink-2 font-sans">{t('kit.title')}</span>
            </div>
            <h1 className="text-lg font-semibold text-ink font-sans">
              {t('brand.name')} — {t('kit.title')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-control border border-kraft/60 bg-paper p-0.5">
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

            {/* Dark / Light Toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleDarkMode}
              icon={isDarkMode ? <Sun className="w-3.5 h-3.5 text-ochre" /> : <Moon className="w-3.5 h-3.5 text-indigo" />}
            >
              {isDarkMode ? t('common.light') : t('common.dark')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = '/')}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              {t('nav.home')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="max-w-content mx-auto px-6 pt-8 flex items-start gap-8">
        {/* Left Column: Fixed TOC Sidebar (Desktop) */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-24">
          <div className="rounded-card border border-kraft/60 bg-paper-2 p-4 shadow-subtle">
            <span className="text-xs font-medium text-ink-2 uppercase tracking-wider block mb-3 font-sans">
              {t('kit.toc')}
            </span>
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-control text-xs font-sans transition-colors ${
                    activeSection === item.id
                      ? 'bg-paper text-indigo font-medium shadow-subtle border border-kraft/40'
                      : 'text-ink-2 hover:text-ink hover:bg-kraft/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Right Column: Component Specimens */}
        <main className="flex-1 space-y-12 min-w-0">
          {/* SECTION 1: COLOR PALETTE */}
          <section id="colors" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.colors')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Bảng màu tự nhiên gồm sợi bông mộc (paper), đường chỉ viền (kraft), mực kỹ thuật (ink), màu lam thương hiệu (indigo), và phấn đỏ (vermilion).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control border border-kraft/40 bg-paper mb-2" />
                <span className="font-mono text-xs font-medium block">paper</span>
                <span className="font-mono text-[11px] text-ink-2">#F1ECE2</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control border border-kraft/40 bg-paper-2 mb-2" />
                <span className="font-mono text-xs font-medium block">paper-2</span>
                <span className="font-mono text-[11px] text-ink-2">#E8E1D3</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control bg-kraft mb-2" />
                <span className="font-mono text-xs font-medium block">kraft</span>
                <span className="font-mono text-[11px] text-ink-2">#D8CBB1</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control bg-ink mb-2" />
                <span className="font-mono text-xs font-medium block text-ink">ink</span>
                <span className="font-mono text-[11px] text-ink-2">#17150F</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control bg-indigo mb-2" />
                <span className="font-mono text-xs font-medium block text-indigo">indigo</span>
                <span className="font-mono text-[11px] text-ink-2">#26356B</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control bg-vermilion mb-2" />
                <span className="font-mono text-xs font-medium block text-vermilion">vermilion</span>
                <span className="font-mono text-[11px] text-ink-2">#D8452A</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control bg-moss mb-2" />
                <span className="font-mono text-xs font-medium block text-moss">moss</span>
                <span className="font-mono text-[11px] text-ink-2">#3F6B4E</span>
              </div>
              <div className="rounded-card border border-kraft/60 bg-paper p-3 shadow-subtle">
                <div className="h-10 rounded-control bg-ochre mb-2" />
                <span className="font-mono text-xs font-medium block text-ochre">ochre</span>
                <span className="font-mono text-[11px] text-ink-2">#C98A1B</span>
              </div>
            </div>
          </section>

          {/* SECTION 2: TYPOGRAPHY */}
          <section id="typography" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.typography')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Chỉ dùng Fraunces serif (weight 400–500) cho tiêu đề lớn trang trọng. Toàn bộ giao diện và văn bản sử dụng Instrument Sans. Con số hiển thị bằng JetBrains Mono (tabular-nums).
              </p>
            </div>

            <Card>
              <div className="space-y-4">
                <div className="border-b border-kraft/40 pb-3">
                  <span className="text-xs text-ink-2 font-mono block mb-1">Fraunces (Weight 400 - Display)</span>
                  <h3 className="font-display text-3xl text-ink leading-tight">
                    {t('landing.headline')}
                  </h3>
                </div>

                <div className="border-b border-kraft/40 pb-3">
                  <span className="text-xs text-ink-2 font-mono block mb-1">Instrument Sans (Weight 400 / 500 / 600 - UI & Body)</span>
                  <p className="font-sans text-sm text-ink-2 leading-relaxed max-w-prose-editorial">
                    {t('landing.description')}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-ink-2 font-mono block mb-1">JetBrains Mono (Tabular Nums)</span>
                  <div className="flex flex-wrap gap-4 font-mono text-sm">
                    <span className="px-2.5 py-1 rounded-control bg-paper border border-kraft/60">
                      172.5 cm
                    </span>
                    <span className="px-2.5 py-1 rounded-control bg-paper border border-kraft/60">
                      94.2 cm
                    </span>
                    <span className="px-2.5 py-1 rounded-control bg-paper border border-kraft/60">
                      78.5 cm
                    </span>
                    <span className="px-2.5 py-1 rounded-control bg-paper border border-kraft/60 text-moss">
                      p95: 2.14s
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* SECTION 3: BUTTONS */}
          <section id="buttons" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.buttons')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Nút có bo góc 10px (`rounded-control`), độ cao cố định 40px (sm), 44px (md), 52px (lg).
              </p>
            </div>

            <Card>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">{t('kit.primaryBtn')}</Button>
                  <Button variant="accent" icon={<Camera className="w-4 h-4" />}>
                    {t('kit.accentBtn')}
                  </Button>
                  <Button variant="secondary">{t('kit.secondaryBtn')}</Button>
                  <Button variant="ghost">{t('kit.ghostBtn')}</Button>
                  <Button variant="danger">{t('kit.dangerBtn')}</Button>
                  <Button variant="primary" disabled>{t('common.disabled')}</Button>
                  <Button variant="primary" loading>{t('common.loading')}</Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-kraft/40">
                  <Button variant="primary" size="sm">40px (sm)</Button>
                  <Button variant="primary" size="md">44px (md)</Button>
                  <Button variant="primary" size="lg">52px (lg)</Button>
                </div>
              </div>
            </Card>
          </section>

          {/* SECTION 4: CONTROLS */}
          <section id="controls" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.controls')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Bộ điều khiển phân đoạn, công tắc chuyển đổi và bộ đếm số lượng.
              </p>
            </div>

            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <span className="text-xs text-ink-2 font-medium block mb-2 font-sans">
                    {t('kit.segmentedLabel')}
                  </span>
                  <SegmentedControl
                    options={[
                      { value: 'cm', label: 'Centimet (cm)' },
                      { value: 'inch', label: 'Inches (inch)' },
                    ]}
                    value={unitSegment}
                    onChange={(v) => setUnitSegment(v as any)}
                  />
                </div>

                <div>
                  <span className="text-xs text-ink-2 font-medium block mb-2 font-sans">
                    Công tắc (Switch)
                  </span>
                  <Switch
                    label={t('kit.switchLabel')}
                    checked={switchChecked}
                    onChange={setSwitchChecked}
                  />
                </div>

                <div>
                  <Stepper
                    label={t('kit.stepperLabel')}
                    value={stepperValue}
                    onChange={setStepperValue}
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* SECTION 5: INPUTS */}
          <section id="inputs" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.inputs')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Trường nhập liệu có nhãn sạch 13px và huy hiệu đơn vị gắn đuôi cố định.
              </p>
            </div>

            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field
                  label={t('kit.fieldLabel')}
                  unit="cm"
                  defaultValue="94.0"
                  hint="Chuẩn ISO 8559-1"
                />
                <Field
                  label={t('measurements.stature')}
                  unit="cm"
                  defaultValue="172.5"
                  hint="Từ mốc sọ Nasion đến gót chân"
                />
                <Select
                  label={t('kit.selectLabel')}
                  options={[
                    { value: 'shirt', label: 'Áo sơ mi may đo' },
                    { value: 'suit', label: 'Bộ âu phục cổ điển' },
                    { value: 'pants', label: 'Quần tây phom đứng' },
                  ]}
                />
              </div>
            </Card>
          </section>

          {/* SECTION 6: FEEDBACK & ALERTS */}
          <section id="feedback" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.feedback')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Huy hiệu viên thuốc (pill), khối thông báo (banner), bảng chỉ dẫn (tooltip), và thông báo nổi (toast).
              </p>
            </div>

            <Card>
              <div className="space-y-5">
                {/* Pill Badges */}
                <div>
                  <span className="text-xs text-ink-2 font-medium block mb-2 font-sans">
                    {t('kit.pillBadge')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="indigo" dot>Màu lam</Badge>
                    <Badge variant="vermilion" dot>Phấn đỏ</Badge>
                    <Badge variant="moss" dot>Đạt chuẩn</Badge>
                    <Badge variant="ochre" dot>Lưu ý</Badge>
                    <Badge variant="kraft">Vải mộc</Badge>
                    <Badge variant="outline">Đường viền</Badge>
                  </div>
                </div>

                {/* Banners */}
                <div className="space-y-2.5">
                  <Banner variant="info">
                    {t('kit.bannerInfo')}
                  </Banner>
                  <Banner variant="warning">
                    {t('kit.bannerWarning')}
                  </Banner>
                  <Banner variant="error">
                    {t('kit.bannerError')}
                  </Banner>
                </div>

                {/* Tooltips & Toasts */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-kraft/40">
                  <Tooltip content="Định nghĩa mốc sọ chuẩn ISO 8559">
                    <Button variant="secondary" size="sm">
                      Di chuột xem Tooltip
                    </Button>
                  </Tooltip>

                  <Popover
                    trigger={
                      <Button variant="secondary" size="sm">
                        Mở Popover Menu
                      </Button>
                    }
                    content={
                      <div className="space-y-2">
                        <span className="font-semibold text-ink block">Hồ sơ đo gần nhất</span>
                        <p className="text-xs text-ink-2">Lần quét gần nhất cách đây 2 ngày.</p>
                      </div>
                    }
                  />

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      showToast({
                        type: 'success',
                        title: t('common.success'),
                        message: t('scan.memoryCleared'),
                      })
                    }
                  >
                    Bật Toast Thành Công
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* SECTION 7: RULERS */}
          <section id="rulers" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.rulers')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Thước cuộn chỉ xuất hiện ở hai vị trí có tính chức năng: thanh tiến trình wizard và thước đo dung sai độ vừa.
              </p>
            </div>

            <div className="space-y-4">
              <TapeMeasureProgress
                currentStep={currentStep}
                totalSteps={7}
                steps={scanSteps}
                onStepClick={setCurrentStep}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FitRuler
                  label={t('measurements.chest')}
                  userValue={94.0}
                  minRange={92.0}
                  maxRange={96.0}
                />
                <FitRuler
                  label={t('measurements.waist')}
                  userValue={82.0}
                  minRange={76.0}
                  maxRange={80.0}
                />
              </div>
            </div>
          </section>

          {/* SECTION 8: CARDS & OVERLAYS */}
          <section id="cards" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink font-sans">
                {t('kit.cards')}
              </h2>
              <p className="text-xs text-ink-2 mt-0.5 max-w-prose-editorial">
                Thẻ thông tin tiêu chuẩn, khung trạng thái trống, bộ xương giả lập tải và hộp thoại nổi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EmptyState
                icon={<FolderOpen className="w-5 h-5" />}
                title={t('kit.emptyTitle')}
                description={t('kit.emptyDesc')}
                action={
                  <Button variant="primary" size="sm">
                    {t('kit.emptyAction')}
                  </Button>
                }
              />

              <Card>
                <CardHeader
                  title="Bộ khung giả lập đang tải (Skeleton)"
                  subtitle="Hiển thị trong khi tải dữ liệu số đo"
                />
                <CardBody className="space-y-3">
                  <Skeleton height={20} className="w-3/4" />
                  <Skeleton height={14} className="w-full" />
                  <Skeleton height={14} className="w-5/6" />
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
                    Mở Hộp Thoại (Modal)
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsSheetOpen(true)}>
                    Mở Ngăn Kéo (Sheet)
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        </main>
      </div>

      {/* Modal Specimen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('landing.privacyTitle')}
        subtitle={t('brand.name')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.close')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <p>{t('landing.privacyDesc')}</p>
      </Modal>

      {/* Sheet Specimen */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={t('measurements.title')}
        subtitle="ISO 8559-1"
      >
        <div className="space-y-2 text-xs font-sans">
          <div className="p-3 rounded-control border border-kraft/60 bg-paper flex justify-between">
            <span>{t('measurements.chest')}</span>
            <span className="font-mono font-semibold">94.0 cm</span>
          </div>
          <div className="p-3 rounded-control border border-kraft/60 bg-paper flex justify-between">
            <span>{t('measurements.waist')}</span>
            <span className="font-mono font-semibold">78.5 cm</span>
          </div>
          <div className="p-3 rounded-control border border-kraft/60 bg-paper flex justify-between">
            <span>{t('measurements.hips')}</span>
            <span className="font-mono font-semibold">96.0 cm</span>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
export default KitPage;
