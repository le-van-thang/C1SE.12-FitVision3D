import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sun, UserCheck, ShieldAlert } from 'lucide-react';
import { PoseGuideOverlay } from './PoseGuideOverlay';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { PoseFeedback } from '@/types';

interface CameraFeedProps {
  onCaptureCompleted?: (frontImage: string, sideImage: string) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onCaptureCompleted }) => {
  const [activeView, setActiveView] = useState<'front' | 'side'>('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [frontCaptured, setFrontCaptured] = useState<string | null>(null);
  const [sideCaptured, setSideCaptured] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Simulated real-time pose guidance feedback
  const [feedback, setFeedback] = useState<PoseFeedback>({
    isAligned: true,
    distanceStatus: 'optimal',
    lightingQuality: 'good',
    postureCheck: {
      isFullBodyVisible: true,
      isFrontFacing: true,
      areArmsSpread: true,
      areLegsSeparated: true,
    },
    guidanceMessage: 'Tư thế đạt chuẩn A-pose. Giữ nguyên vị trí để chụp!',
  });

  // Start web camera stream
  const startCamera = async () => {
    setPermissionError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        throw new Error('Camera API không được hỗ trợ trên trình duyệt này');
      }
    } catch (err: unknown) {
      console.warn('Camera stream error, activating simulation mode:', err);
      setPermissionError('Không thể mở Webcam (hoặc đang chạy giả lập). Hệ thống kích hoạt chế độ mô phỏng AI.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Simulate countdown and take photo
  const triggerCapture = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          performCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const performCapture = () => {
    const dummyImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" fill="%230f172a"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%2306b6d4" font-family="sans-serif" font-size="24" text-anchor="middle">Ảnh chụp ${activeView === 'front' ? 'Mặt trước (A-Pose)' : 'Mặt nghiêng'}</text></svg>`;
    
    if (activeView === 'front') {
      setFrontCaptured(dummyImage);
      setActiveView('side');
      setFeedback({
        isAligned: true,
        distanceStatus: 'optimal',
        lightingQuality: 'good',
        postureCheck: {
          isFullBodyVisible: true,
          isFrontFacing: false,
          areArmsSpread: false,
          areLegsSeparated: true,
        },
        guidanceMessage: 'Đã chụp mặt trước! Vui lòng quay nghiêng 90 độ để chụp mặt bên.',
      });
    } else {
      setSideCaptured(dummyImage);
      if (onCaptureCompleted) {
        onCaptureCompleted(frontCaptured || dummyImage, dummyImage);
      }
    }
  };

  const resetCaptures = () => {
    setFrontCaptured(null);
    setSideCaptured(null);
    setActiveView('front');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Viewport & Controls header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            Module Chụp Ảnh & Hướng Dẫn Tư Thế (Pose Guide)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chụp 2 góc (Chính diện A-pose và Nghiêng 90°) theo chuẩn quét nhân trắc học ISO 8559.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-white/10">
          <button
            onClick={() => setActiveView('front')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'front'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Chính diện (A-Pose) {frontCaptured && '✓'}
          </button>
          <button
            onClick={() => setActiveView('side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'side'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Mặt nghiêng (90°) {sideCaptured && '✓'}
          </button>
        </div>
      </div>

      {/* Main Viewfinder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Viewfinder Box */}
        <div className="lg:col-span-2 relative aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
          {/* Real video or simulation fallback */}
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-[#080c14]">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Kính ngắm AI & Khung hướng dẫn</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Bật webcam để tự động căn chỉnh tư thế theo thời gian thực hoặc dùng dữ liệu mẫu.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="mt-4"
                icon={<Camera className="w-3.5 h-3.5" />}
              >
                Kích hoạt Webcam
              </Button>
            </div>
          )}

          {/* SVG Silhouette Pose Overlay */}
          <PoseGuideOverlay mode={activeView} isAligned={feedback.isAligned} />

          {/* Countdown Display */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
              <span className="text-8xl font-black text-cyan-400 animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {/* Viewfinder Status Overlay Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
            <Badge variant="cyan" dot>
              {activeView === 'front' ? 'Góc chụp: Chính diện (Front)' : 'Góc chụp: Bên hông (Side)'}
            </Badge>

            <div className="flex items-center gap-2">
              <Badge variant={feedback.lightingQuality === 'good' ? 'emerald' : 'amber'}>
                <Sun className="w-3 h-3 mr-1 inline" /> Ánh sáng: Tốt
              </Badge>
              <Badge variant="violet">
                <UserCheck className="w-3 h-3 mr-1 inline" /> Toàn thân: Đạt
              </Badge>
            </div>
          </div>

          {/* Live Instruction Banner at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between bg-slate-900/85 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-slate-200">
                {feedback.guidanceMessage}
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={triggerCapture}
              disabled={countdown !== null}
              icon={<Camera className="w-3.5 h-3.5" />}
            >
              Chụp ảnh ({countdown ?? 'Ready'})
            </Button>
          </div>
        </div>

        {/* Pose Inspection & Calibration Guide Card */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl glass-panel flex flex-col gap-4">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" /> Tiêu chuẩn tư thế (ISO 8559)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Tư thế A-Pose:</span>
                  <p className="text-slate-400 mt-0.5">Hai tay dang rộng góc ~35-45°, cách hông 1 khoảng để thuật toán tách biên tay và thân.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Khoảng cách đứng:</span>
                  <p className="text-slate-400 mt-0.5">Cách camera 2.0m - 2.5m để toàn bộ từ đỉnh đầu đến gót chân nằm trọn trong khung hình.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Trang phục ôm sát:</span>
                  <p className="text-slate-400 mt-0.5">Nên mặc đồ tập gym, áo thun ôm hoặc đồ ngủ bó sát để hạn chế sai số độ dày vải.</p>
                </div>
              </div>
            </div>

            {/* Captured Photos Preview */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Ảnh đã chụp:</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-lg border border-dashed border-white/15 bg-slate-950/60 flex items-center justify-center text-center p-2">
                  {frontCaptured ? (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mặt trước ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Chưa có ảnh trước</span>
                  )}
                </div>
                <div className="h-24 rounded-lg border border-dashed border-white/15 bg-slate-950/60 flex items-center justify-center text-center p-2">
                  {sideCaptured ? (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mặt bên ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Chưa có ảnh nghiêng</span>
                  )}
                </div>
              </div>

              {(frontCaptured || sideCaptured) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCaptures}
                  className="w-full mt-3 text-xs text-slate-400 hover:text-rose-400"
                  icon={<RefreshCw className="w-3 h-3" />}
                >
                  Chụp lại từ đầu
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
