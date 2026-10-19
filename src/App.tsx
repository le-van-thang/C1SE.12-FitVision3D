import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { CameraFeed } from '@/features/capture/CameraFeed';
import { CVMonitorCard } from '@/features/cv/CVMonitorCard';
import { AnthropometryDisplay } from '@/features/anthropometry/AnthropometryDisplay';
import { MannequinViewer } from '@/features/avatar3d/MannequinViewer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { measurementService, isSupabaseConfigured } from '@/services/supabase';
import type { BodyMeasurements } from '@/types';
import {
  Scan,
  Cpu,
  Ruler,
  Box,
  Database,
  Sliders,
  CheckCircle,
  Save,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'capture' | 'avatar'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic interactive body measurements state
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: 172.5,
    chestGirth: 94.0,
    waistGirth: 78.5,
    hipGirth: 96.0,
    shoulderBreadth: 43.5,
    armLength: 61.0,
    insideLegLength: 79.5,
    unit: 'cm',
    confidenceScore: 0.95,
  });

  const handleMeasurementChange = (key: keyof BodyMeasurements, value: number) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveToSupabase = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await measurementService.saveMeasurements(measurements);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)}>
      {/* Hero Welcome Banner */}
      <div className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-white/10 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="cyan" dot>Hệ Thống Trực Tuyến v1.0.0</Badge>
            <Badge variant="violet">Capstone C1SE.12</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            FitVision <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">3D</span>: Đo Nhân Trắc Học & Thử Đồ Ảo
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
            Giải pháp đo đạc không tiếp xúc ứng dụng MediaPipe Pose, xử lý ảnh OpenCV.js WASM, trích xuất số đo theo tiêu chuẩn quốc tế ISO 8559 và tái tạo Mannequin 3D trên WebGL Three.js.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('capture')}
              icon={<Scan className="w-4 h-4" />}
            >
              Bắt đầu quét ảnh (Pose Guide)
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setActiveTab('avatar')}
              icon={<Box className="w-4 h-4" />}
            >
              Xem Mannequin 3D
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveToSupabase}
              disabled={isSaving}
              icon={saveSuccess ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            >
              {isSaving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu Supabase!' : 'Lưu số đo vào Cloud'}
            </Button>
          </div>
        </div>

        {/* Ambient decorative element */}
        <div className="absolute right-[-40px] -bottom-10 opacity-15 pointer-events-none hidden md:block">
          <Box className="w-72 h-72 text-cyan-400 transform rotate-12" />
        </div>
      </div>

      {/* Main Tab Content Switching */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Architecture Modules Showcase Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Cấu Trúc Khối Module Kiến Trúc Hệ Thống
                </h2>
                <p className="text-xs text-slate-400">Các khối tính năng cốt lõi theo tài liệu System Architecture</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Module 1: Capture */}
              <div
                onClick={() => setActiveTab('capture')}
                className="p-4 rounded-2xl glass-panel hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 mb-3">
                  <Scan className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">1. Module Capture</h3>
                <p className="text-xs text-slate-400 mt-1">Chụp 2 góc (Chính diện & Nghiêng), kiểm tra A-pose và ánh sáng.</p>
                <span className="text-[10px] font-mono text-cyan-400 mt-3 inline-flex items-center gap-1">
                  Mở camera <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Module 2: Computer Vision */}
              <div className="p-4 rounded-2xl glass-panel border-white/5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">2. CV Pipeline</h3>
                <p className="text-xs text-slate-400 mt-1">MediaPipe 33 điểm xương & OpenCV WASM trích xuất đường biên.</p>
                <span className="text-[10px] font-mono text-emerald-400 mt-3 inline-flex items-center gap-1">
                  WASM Active ✓
                </span>
              </div>

              {/* Module 3: Anthropometry */}
              <div className="p-4 rounded-2xl glass-panel border-white/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <Ruler className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">3. Anthropometry</h3>
                <p className="text-xs text-slate-400 mt-1">Tính số đo chuẩn ISO 8559 qua công thức elip Ramanujan.</p>
                <span className="text-[10px] font-mono text-cyan-400 mt-3 inline-flex items-center gap-1">
                  ISO 8559-1/2
                </span>
              </div>

              {/* Module 4: 3D Avatar */}
              <div
                onClick={() => setActiveTab('avatar')}
                className="p-4 rounded-2xl glass-panel hover:border-purple-500/40 cursor-pointer transition-all hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 mb-3">
                  <Box className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">4. 3D Avatar WebGL</h3>
                <p className="text-xs text-slate-400 mt-1">Three.js render mannequin tham số theo thời gian thực.</p>
                <span className="text-[10px] font-mono text-purple-400 mt-3 inline-flex items-center gap-1">
                  Tương tác 3D <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Module 5: Cloud Services */}
              <div className="p-4 rounded-2xl glass-panel border-white/5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">5. Cloud & DB</h3>
                <p className="text-xs text-slate-400 mt-1">Supabase PostgreSQL lưu trữ hồ sơ người dùng & lịch sử số đo.</p>
                <span className="text-[10px] font-mono text-amber-400 mt-3 inline-flex items-center gap-1">
                  {isSupabaseConfigured ? 'Connected' : 'Mock/Demo'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Split View: CV Pipeline & ISO 8559 Measurements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CVMonitorCard />
            <AnthropometryDisplay measurements={measurements} />
          </div>

          {/* 3D Mannequin Quick Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Box className="w-4 h-4 text-cyan-400" /> Tái Tạo Mannequin 3D (WebGL Three.js)
                </h2>
                <p className="text-xs text-slate-400">Hình thái học 3D thay đổi theo các thông số đo ISO 8559</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('avatar')}
                icon={<Sliders className="w-3.5 h-3.5" />}
              >
                Chỉnh sửa số đo tương tác
              </Button>
            </div>
            <MannequinViewer measurements={measurements} />
          </div>
        </div>
      )}

      {/* Capture Module Tab */}
      {activeTab === 'capture' && (
        <div className="space-y-6">
          <CameraFeed />
        </div>
      )}

      {/* 3D Avatar & Interactive Morphing Sliders Tab */}
      {activeTab === 'avatar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Canvas Area */}
          <div className="lg:col-span-2">
            <MannequinViewer measurements={measurements} />
          </div>

          {/* Parametric Adjustment Sidebar */}
          <div className="space-y-4">
            <Card glow>
              <CardHeader
                title="Tham Số Đo Cơ Thể (Morphing)"
                subtitle="Kéo thanh trượt để thay đổi hình dạng mannequin 3D tức thì"
                icon={<Sliders className="w-4 h-4 text-cyan-400" />}
              />
              <CardBody className="space-y-4">
                {/* Height Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Chiều cao (Height)</span>
                    <span className="font-mono text-cyan-400 font-bold">{measurements.height} cm</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="195"
                    step="0.5"
                    value={measurements.height}
                    onChange={(e) => handleMeasurementChange('height', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Chest Girth Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Vòng ngực (Chest Girth)</span>
                    <span className="font-mono text-cyan-400 font-bold">{measurements.chestGirth} cm</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="125"
                    step="0.5"
                    value={measurements.chestGirth}
                    onChange={(e) => handleMeasurementChange('chestGirth', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Waist Girth Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Vòng eo (Waist Girth)</span>
                    <span className="font-mono text-cyan-400 font-bold">{measurements.waistGirth} cm</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="115"
                    step="0.5"
                    value={measurements.waistGirth}
                    onChange={(e) => handleMeasurementChange('waistGirth', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Hip Girth Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Vòng mông (Hip Girth)</span>
                    <span className="font-mono text-cyan-400 font-bold">{measurements.hipGirth} cm</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="125"
                    step="0.5"
                    value={measurements.hipGirth}
                    onChange={(e) => handleMeasurementChange('hipGirth', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Shoulder Breadth */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Rộng vai (Shoulder Breadth)</span>
                    <span className="font-mono text-cyan-400 font-bold">{measurements.shoulderBreadth} cm</span>
                  </div>
                  <input
                    type="range"
                    min="36"
                    max="55"
                    step="0.5"
                    value={measurements.shoulderBreadth}
                    onChange={(e) => handleMeasurementChange('shoulderBreadth', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveToSupabase}
                    disabled={isSaving}
                    icon={<Save className="w-3.5 h-3.5" />}
                  >
                    {isSaving ? 'Đang lưu Cloud...' : 'Lưu thông số mới'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMeasurements({
                        height: 172.5,
                        chestGirth: 94.0,
                        waistGirth: 78.5,
                        hipGirth: 96.0,
                        shoulderBreadth: 43.5,
                        armLength: 61.0,
                        insideLegLength: 79.5,
                        unit: 'cm',
                        confidenceScore: 0.95,
                      })
                    }
                  >
                    Khôi phục mặc định
                  </Button>
                </div>
              </CardBody>
            </Card>

            <AnthropometryDisplay measurements={measurements} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
