import React from 'react';
import { Cpu, Eye, Zap, Layers } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { POSE_CONNECTIONS, mediaPipeService } from './mediapipe';
import { useTranslation } from '@/i18n';

export const CVMonitorCard: React.FC = () => {
  const { t } = useTranslation();
  const landmarks = mediaPipeService.getSimulatedLandmarks();

  return (
    <Card>
      <CardHeader
        title="Trích Xuất Thị Giác Máy Tính (MediaPipe & OpenCV)"
        subtitle="Mô hình BlazePose 33 điểm xương & Trích xuất đường bao qua WebAssembly"
        icon={<Cpu className="w-4 h-4 text-indigo" />}
        action={
          <div className="flex gap-2">
            <Badge variant="indigo" dot>MediaPipe</Badge>
            <Badge variant="moss" dot>WASM</Badge>
          </div>
        }
      />
      <CardBody className="space-y-4">
        {/* Visual Skeleton Viewport */}
        <div className="relative h-64 bg-paper rounded-control border border-kraft/60 overflow-hidden flex items-center justify-center shadow-subtle">
          {/* 2D Pose Skeleton SVG */}
          <svg className="w-full h-full p-4" viewBox="0 0 100 100">
            {/* Draw Bone Connections */}
            {POSE_CONNECTIONS.map(([i1, i2], idx) => {
              const p1 = landmarks.find((l) => l.index === i1);
              const p2 = landmarks.find((l) => l.index === i2);
              if (!p1 || !p2) return null;
              return (
                <line
                  key={`bone-${idx}`}
                  x1={p1.x * 100}
                  y1={p1.y * 100}
                  x2={p2.x * 100}
                  y2={p2.y * 100}
                  stroke="#26356B"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              );
            })}

            {/* Draw Landmark Joints */}
            {landmarks.map((lm) => (
              <g key={`joint-${lm.index}`}>
                <circle
                  cx={lm.x * 100}
                  cy={lm.y * 100}
                  r="1.8"
                  fill="#D8452A"
                  stroke="#F1ECE2"
                  strokeWidth="0.8"
                />
              </g>
            ))}
          </svg>

          {/* Real-time stats overlay */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-ink-2 bg-paper-2/90 px-3 py-1.5 rounded-control border border-kraft/60">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-indigo" /> 33/33 Điểm mốc
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-moss" /> 14ms (WASM)
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-ink" /> Thẻ chuẩn: 85.6 mm
            </span>
          </div>
        </div>

        {/* Pipeline Steps Indicator */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-control bg-paper border border-kraft/60">
            <span className="text-ink-2 block text-[10px] font-mono">01. TIỀN XỬ LÝ</span>
            <span className="font-medium text-ink mt-0.5 block">Tách biên Canny</span>
          </div>
          <div className="p-2.5 rounded-control bg-paper border border-kraft/60">
            <span className="text-ink-2 block text-[10px] font-mono">02. KHUNG XƯƠNG</span>
            <span className="font-medium text-ink mt-0.5 block">MediaPipe Pose</span>
          </div>
          <div className="p-2.5 rounded-control bg-paper border border-kraft/60">
            <span className="text-ink-2 block text-[10px] font-mono">03. ĐỊNH CỠ</span>
            <span className="font-medium text-ink mt-0.5 block">Tỷ lệ mm/pixel</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
export default CVMonitorCard;
