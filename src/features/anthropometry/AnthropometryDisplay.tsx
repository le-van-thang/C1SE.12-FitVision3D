import React from 'react';
import { Ruler, Sparkles, Check } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { BodyMeasurements } from '@/types';
import { matchIsoSize } from './isoStandards';
import { useTranslation } from '@/i18n';

interface AnthropometryDisplayProps {
  measurements?: BodyMeasurements;
}

export const AnthropometryDisplay: React.FC<AnthropometryDisplayProps> = ({
  measurements = {
    height: 172.5,
    chestGirth: 94.0,
    waistGirth: 78.5,
    hipGirth: 96.0,
    shoulderBreadth: 43.5,
    armLength: 61.0,
    insideLegLength: 79.5,
    bicepGirth: 29.4,
    wristGirth: 16.6,
    thighGirth: 55.3,
    calfGirth: 36.6,
    ankleGirth: 21.4,
    unit: 'cm',
    confidenceScore: 0.95,
  },
}) => {
  const { t } = useTranslation();

  const sizeRec = matchIsoSize(
    measurements.chestGirth,
    measurements.waistGirth,
    measurements.hipGirth,
    'male',
    'shirt'
  );

  const metricCards = [
    { label: t('measurements.stature'), value: measurements.height, unit: 'cm', note: 'ISO 8559-1 #3.1' },
    { label: t('measurements.chest'), value: measurements.chestGirth, unit: 'cm', note: 'ISO 8559-1 #3.2' },
    { label: t('measurements.waist'), value: measurements.waistGirth, unit: 'cm', note: 'ISO 8559-1 #3.3' },
    { label: t('measurements.hips'), value: measurements.hipGirth, unit: 'cm', note: 'ISO 8559-1 #3.4' },
    { label: t('measurements.shoulder'), value: measurements.shoulderBreadth, unit: 'cm', note: 'Bi-acromial' },
    { label: t('measurements.armLength'), value: measurements.armLength, unit: 'cm', note: 'Acromion to wrist' },
    { label: t('meas.bicep'), value: measurements.bicepGirth ?? 29.4, unit: 'cm', note: 'ISO 8559-1 #5.3.16' },
    { label: t('meas.wrist'), value: measurements.wristGirth ?? 16.6, unit: 'cm', note: 'ISO 8559-1 #5.3.18' },
    { label: t('meas.thigh'), value: measurements.thighGirth ?? 55.3, unit: 'cm', note: 'ISO 8559-1 #5.3.20' },
    { label: t('meas.calf'), value: measurements.calfGirth ?? 36.6, unit: 'cm', note: 'ISO 8559-1 #5.3.22' },
    { label: t('meas.ankle'), value: measurements.ankleGirth ?? 21.4, unit: 'cm', note: 'ISO 8559-1 #5.3.23' },
    { label: t('measurements.inseam'), value: measurements.insideLegLength, unit: 'cm', note: 'Crotch to ankle' },
  ];

  return (
    <Card>
      <CardHeader
        title={t('measurements.title')}
        subtitle="Hệ quy chiếu số đo cơ thể người theo tiêu chuẩn quốc tế ISO 8559-1"
        icon={<Ruler className="w-4 h-4 text-indigo" />}
        action={<Badge variant="moss" dot>{Math.round(measurements.confidenceScore * 100)}%</Badge>}
      />
      <CardBody className="space-y-5">
        {/* Recommended Size Box */}
        <div className="p-4 rounded-control bg-paper border border-kraft/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-control bg-indigo/10 border border-indigo/25 flex items-center justify-center text-indigo font-mono font-semibold text-lg">
              {sizeRec.recommendedSize}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-sm">
                  {t('fit.recommendedSize')}: {sizeRec.recommendedSize}
                </span>
                <Badge variant="indigo">{sizeRec.matchScore}%</Badge>
              </div>
              <p className="text-xs text-ink-2 mt-0.5">{sizeRec.notes}</p>
            </div>
          </div>
          <div className="text-xs text-ink-2">
            {t('fit.fitComfort')}: <strong className="text-indigo">{t('fit.regular')}</strong>
          </div>
        </div>

        {/* 8-Grid Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metricCards.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-control bg-paper border border-kraft/60 shadow-subtle transition-colors hover:border-kraft"
            >
              <span className="text-[11px] text-ink-2 block truncate">
                {item.label}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-mono font-semibold text-ink tracking-tight">
                  {item.value}
                </span>
                <span className="text-xs text-ink-2 font-mono">{item.unit}</span>
              </div>
              <span className="text-[10px] text-ink-2/70 font-mono mt-1 block">
                {item.note}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
export default AnthropometryDisplay;
