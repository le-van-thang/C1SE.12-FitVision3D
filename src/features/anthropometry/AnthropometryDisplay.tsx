import React from 'react';
import { Ruler, Sparkles, Check, ArrowRight, Tag } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { BodyMeasurements } from '@/types';
import { matchIsoSize } from './isoStandards';

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
    unit: 'cm',
    confidenceScore: 0.95,
  },
}) => {
  const sizeRec = matchIsoSize(
    measurements.chestGirth,
    measurements.waistGirth,
    measurements.hipGirth,
    'male',
    'shirt'
  );

  const metricCards = [
    { label: 'Chiều cao (Stature)', value: measurements.height, unit: 'cm', note: 'ISO 8559-1 #3.1' },
    { label: 'Vòng ngực (Chest)', value: measurements.chestGirth, unit: 'cm', note: 'ISO 8559-1 #3.2' },
    { label: 'Vòng eo (Waist)', value: measurements.waistGirth, unit: 'cm', note: 'ISO 8559-1 #3.3' },
    { label: 'Vòng mông (Hip)', value: measurements.hipGirth, unit: 'cm', note: 'ISO 8559-1 #3.4' },
    { label: 'Rộng vai (Shoulder)', value: measurements.shoulderBreadth, unit: 'cm', note: 'Bi-acromial' },
    { label: 'Dài tay (Arm length)', value: measurements.armLength, unit: 'cm', note: 'Acromion to wrist' },
    { label: 'Dài chân trong (Inseam)', value: measurements.insideLegLength, unit: 'cm', note: 'Crotch to ankle' },
    { label: 'Độ tin cậy AI', value: Math.round(measurements.confidenceScore * 100), unit: '%', note: 'Deep learning' },
  ];

  return (
    <Card glow className="overflow-hidden">
      <CardHeader
        title="Thông Số Nhân Trắc Học (ISO 8559 Standards)"
        subtitle="Hệ quy chiếu số đo cơ thể người theo tiêu chuẩn quốc tế ISO 8559-1 & ISO 8559-2"
        icon={<Ruler className="w-4 h-4 text-cyan-400" />}
        action={<Badge variant="emerald" dot>Độ chính xác: 95%</Badge>}
      />
      <CardBody className="space-y-6">
        {/* Recommended Size Highlight Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-xl">
              {sizeRec.recommendedSize}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Size khuyến nghị: {sizeRec.recommendedSize}</span>
                <Badge variant="cyan">Match {sizeRec.matchScore}%</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{sizeRec.notes}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Kiểu vừa vặn: <strong className="text-cyan-400 uppercase">Regular Fit</strong></span>
          </div>
        </div>

        {/* 8-Grid Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metricCards.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-white tracking-tight">
                  {item.value}
                </span>
                <span className="text-xs text-slate-400 font-medium">{item.unit}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {item.note}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
