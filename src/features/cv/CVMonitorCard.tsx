import React from 'react';
import { Cpu, Eye, Zap, Layers } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { POSE_CONNECTIONS, mediaPipeService } from './mediapipe';
import { openCVService } from './opencv';

export const CVMonitorCard: React.FC = () => {
  const landmarks = mediaPipeService.getSimulatedLandmarks();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Computer Vision Pipeline (MediaPipe & OpenCV WASM)"
        subtitle="Mô hình BlazePose 33 điểm xương & Trích xuất đường bao pixel qua WebAssembly"
        icon={<Cpu className="w-4 h-4 text-cyan-400" />}
        action={
          <div className="flex gap-2">
            <Badge variant="cyan" dot>MediaPipe: Ready</Badge>
            <Badge variant="violet" dot>OpenCV.js: WASM Active</Badge>
          </div>
        }
      />
      <CardBody className="space-y-4">
        {/* Visual Skeleton Viewport */}
        <div className="relative h-64 bg-slate-950 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          
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
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })}

            {/* Draw Landmark Joints */}
            {landmarks.map((lm) => (
              <g key={`joint-${lm.index}`}>
                <circle
                  cx={lm.x * 100}
                  cy={lm.y * 100}
                  r="2"
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
              </g>
            ))}
          </svg>

          {/* Real-time stats overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-cyan-400" /> Keypoints: 33/33
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" /> Latency: 14ms (GPU WASM)
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" /> Calibration: Card 8.56cm
            </span>
          </div>
        </div>

        {/* Pipeline Steps Indicator */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">1. Preprocessing</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">Otsu & Canny Edge</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">2. Landmark Pose</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">MediaPipe BlazePose</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">3. Scale Calibrate</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">Px to Metric (cm)</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
