import React, { useEffect, useRef, useState } from 'react';
import { Layers, Plus, Scissors, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n';

const TURNTABLE_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261107_112151_ae5c9a8f-07da-4b83-8dd8-88f4c762a5dfc0.mp4';

interface HotspotItem {
  id: string;
  top: string;
  left: string;
  titleVi: string;
  titleEn: string;
  metric: string;
  descVi: string;
  descEn: string;
}

const BIOMETRIC_HOTSPOTS: HotspotItem[] = [
  {
    id: 'shoulder',
    top: '23%',
    left: '48%',
    titleVi: 'Rộng cầu vai ISO',
    titleEn: 'ISO Shoulder Span',
    metric: '43.0 cm',
    descVi: 'Định chuẩn 2 điểm mỏm vai giúp vai áo đứng phom tự nhiên.',
    descEn: 'Acromion shoulder alignment for crisp collar and sleeve drape.',
  },
  {
    id: 'chest',
    top: '30%',
    left: '39%',
    titleVi: 'Vòng ngực & Ease',
    titleEn: '3D Chest & Ease',
    metric: '96.0 cm',
    descVi: 'Cắt lớp elip Ramanujan 3D, tự cộng +4cm độ cử động êm ái.',
    descEn: 'Ramanujan 3D ellipse slice with +4cm tailored ease allowance.',
  },
  {
    id: 'waist',
    top: '41%',
    left: '60%',
    titleVi: 'Vòng eo & Tỉ lệ',
    titleEn: 'Waist Silhouette',
    metric: '78.0 cm',
    descVi: 'Trích xuất nhanh 1.25s · Xóa sạch ảnh khỏi RAM sau khi đo.',
    descEn: 'Extracted in 1.25s · Zero-Retention RAM photo destruction.',
  },
];

export const SpinTurntableShowcase: React.FC = () => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontThumbRef = useRef<HTMLCanvasElement>(null);
  const backThumbRef = useRef<HTMLCanvasElement>(null);

  const framesRef = useRef<Blob[]>([]);
  const stageBgRef = useRef<string>('#E2E4E8');
  const angRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const idleRef = useRef<number>(0);
  const draggingRef = useRef<boolean>(false);
  const lastXRef = useRef<number>(0);
  const lastTRef = useRef<number>(0);
  const tweenRef = useRef<{
    startAng: number;
    targetAng: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const decodingRef = useRef<boolean>(false);
  const lastDrawnFrameRef = useRef<number>(-1);

  const [cacheReady, setCacheReady] = useState(false);
  const [stageBg, setStageBg] = useState('#E2E4E8');
  const [displayAngle, setDisplayAngle] = useState(0);
  const [isFacingFront, setIsFacingFront] = useState(true);
  const [activeLook, setActiveLook] = useState<'front' | 'back'>('front');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  // Extract frames from turntable MP4 for crisp drag-scrubbing
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    const captureFrames = async () => {
      if (!vid.duration || vid.readyState < 2) return;
      const fps = 24;
      const total = Math.max(24, Math.min(240, Math.round(vid.duration * fps)));
      const offscreen = document.createElement('canvas');
      const targetW = Math.min(540, vid.videoWidth || 540);
      const targetH = Math.round((targetW / (vid.videoWidth || 732)) * (vid.videoHeight || 1296));
      offscreen.width = targetW;
      offscreen.height = targetH;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Sample seamless studio backdrop color from pixel (6,6)
      try {
        ctx.drawImage(vid, 0, 0, targetW, targetH);
        const px = ctx.getImageData(6, 6, 1, 1).data;
        if (px[0] > 180 && px[1] > 180 && px[2] > 180) {
          const hex = `#${[px[0], px[1], px[2]].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
          stageBgRef.current = hex;
          setStageBg(hex);
        }
      } catch {
        // Ignore CORS pixel read issue if any
      }

      const collected: Blob[] = new Array(total);
      const grabAt = (frameIdx: number) =>
        new Promise<void>((resolve) => {
          const onSeeked = () => {
            vid.removeEventListener('seeked', onSeeked);
            try {
              ctx.drawImage(vid, 0, 0, targetW, targetH);
              offscreen.toBlob(
                (blob) => {
                  if (blob) collected[frameIdx] = blob;
                  resolve();
                },
                'image/jpeg',
                0.85
              );
            } catch {
              resolve();
            }
          };
          vid.addEventListener('seeked', onSeeked, { once: true });
          vid.currentTime = Math.min(vid.duration - 0.02, frameIdx / fps);
        });

      vid.pause();
      // Sample every 2nd frame first (~120 frames) for ultra-fast interactive startup
      const step = 2;
      for (let i = 0; i < total && !cancelled; i += step) {
        await grabAt(i);
        if (i + 1 < total && collected[i]) collected[i + 1] = collected[i];
      }

      if (cancelled) return;
      const valid = collected.filter(Boolean);
      if (valid.length > 10) {
        // Drop duplicated final loop frame
        if (valid.length > 20) valid.pop();
        framesRef.current = valid;
        drawThumbnails(valid);
        setCacheReady(true);
      } else {
        vid.play().catch(() => undefined);
      }
    };

    const drawThumbnails = async (blobs: Blob[]) => {
      const renderThumb = async (blob: Blob, targetCanvas: HTMLCanvasElement | null) => {
        if (!blob || !targetCanvas) return;
        try {
          const bmp = await createImageBitmap(blob);
          const ctx = targetCanvas.getContext('2d');
          if (!ctx) return;
          const cw = targetCanvas.width;
          const ch = targetCanvas.height;
          const cropSize = Math.round(bmp.width * 0.62);
          const sx = Math.round((bmp.width - cropSize) / 2);
          const sy = Math.round(bmp.height * 0.07);
          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(bmp, sx, sy, cropSize, cropSize, 0, 0, cw, ch);
          bmp.close();
        } catch {
          // ignore
        }
      };
      await renderThumb(blobs[0], frontThumbRef.current);
      await renderThumb(blobs[Math.floor(blobs.length * 0.5)], backThumbRef.current);
    };

    const onLoadedData = () => {
      captureFrames();
    };

    vid.addEventListener('loadeddata', onLoadedData, { once: true });
    if (vid.readyState >= 2) captureFrames();

    return () => {
      cancelled = true;
      vid.removeEventListener('loadeddata', onLoadedData);
    };
  }, []);

  // Render active frame on canvas
  const drawFrameForAngle = async (ang: number) => {
    const blobs = framesRef.current;
    const canvas = canvasRef.current;
    if (!blobs.length || !canvas) return;

    const norm = ((ang % 1) + 1) % 1;
    const idx = Math.round(norm * blobs.length) % blobs.length;
    if (idx === lastDrawnFrameRef.current || decodingRef.current) return;

    const blob = blobs[idx];
    if (!blob) return;

    decodingRef.current = true;
    try {
      const bmp = await createImageBitmap(blob);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const cw = canvas.width;
        const ch = canvas.height;
        const scale = Math.max(cw / bmp.width, ch / bmp.height);
        const dw = bmp.width * scale;
        const dh = bmp.height * scale;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      }
      bmp.close();
      lastDrawnFrameRef.current = idx;
    } catch {
      // ignore frame decode abort
    } finally {
      decodingRef.current = false;
    }
  };

  // Smooth inertia + 3s idle auto-spin animation loop
  useEffect(() => {
    if (!cacheReady) return;
    let rafId = 0;
    let prevTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;

      if (tweenRef.current) {
        const tw = tweenRef.current;
        const tNorm = Math.min(1, (now - tw.startTime) / tw.duration);
        const eased = tNorm < 0.5 ? 4 * tNorm * tNorm * tNorm : 1 - Math.pow(-2 * tNorm + 2, 3) / 2;
        angRef.current = tw.startAng + (tw.targetAng - tw.startAng) * eased;
        if (tNorm >= 1) {
          angRef.current = ((tw.targetAng % 1) + 1) % 1;
          tweenRef.current = null;
          velRef.current = 0;
        }
      } else if (!draggingRef.current) {
        idleRef.current += dt;
        const targetVel = idleRef.current > 3 ? 0.045 : 0;
        const easeRate = targetVel > 0 ? dt * 0.8 : dt * 2.2;
        velRef.current += (targetVel - velRef.current) * easeRate;
        angRef.current = (((angRef.current + velRef.current * dt) % 1) + 1) % 1;
      }

      const norm = ((angRef.current % 1) + 1) % 1;
      const deg = Math.round(norm * 360) % 360;
      setDisplayAngle(deg);
      const front = (norm < 0.045 || norm > 0.955) && !draggingRef.current && !tweenRef.current && Math.abs(velRef.current) < 0.03;
      setIsFacingFront(front);
      setActiveLook(norm > 0.25 && norm < 0.75 ? 'back' : 'front');

      drawFrameForAngle(norm);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cacheReady]);

  const spinTo = (target: number) => {
    idleRef.current = 0;
    const current = ((angRef.current % 1) + 1) % 1;
    let delta = target - current;
    if (delta > 0.5) delta -= 1;
    if (delta < -0.5) delta += 1;
    tweenRef.current = {
      startAng: current,
      targetAng: current + delta,
      startTime: performance.now(),
      duration: 900 + Math.abs(delta) * 700,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!cacheReady) return;
    draggingRef.current = true;
    tweenRef.current = null;
    idleRef.current = 0;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !cacheReady) return;
    const now = performance.now();
    const dx = e.clientX - lastXRef.current;
    const dtMs = Math.max(8, now - lastTRef.current);
    const dAng = -dx / 520;
    angRef.current = (((angRef.current + dAng) % 1) + 1) % 1;
    const instantVel = (dAng / dtMs) * 1000;
    velRef.current = Math.max(-2.5, Math.min(2.5, instantVel * 0.6 + velRef.current * 0.4));
    lastXRef.current = e.clientX;
    lastTRef.current = now;
    idleRef.current = 0;
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <div
      className="zf-auth-showcase-pane"
      style={{ background: stageBg }}
    >
      <div className="zf-auth-grid" />

      {/* Top Brand Header */}
      <div className="relative z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
            <Scissors size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-[#14171C] block leading-tight">
              FitVision <span className="text-blue-600">3D</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 block">
              {t('app.auth.engine', 'Công cụ đo dáng 3D ISO 8559')}
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ISO 8559-1</span>
        </div>
      </div>

      {/* Center Stage: Full-Body 360° Interactive Model + Hotspots + Notched Spec Card */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 min-h-0 flex items-center justify-center my-1 select-none touch-none cursor-grab active:cursor-grabbing"
      >
        {/* Model Turntable Container */}
        <div
          className="relative h-full max-h-[540px] aspect-[732/1296] flex items-center justify-center"
          style={{
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)',
            maskImage: 'linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)',
          }}
        >
          <video
            ref={videoRef}
            src={TURNTABLE_VIDEO_URL}
            muted
            playsInline
            loop
            autoPlay
            preload="auto"
            crossOrigin="anonymous"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cacheReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />
          <canvas
            ref={canvasRef}
            width={720}
            height={1276}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              cacheReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        </div>

        {/* SVG Architectural Connector Line from Info Card to Chest */}
        <svg
          className="hidden xl:block absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 28 38 H 37 L 41 31"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.35"
            pathLength={1}
            className="fv-connector-path"
            style={{
              opacity: isFacingFront || !cacheReady ? 0.95 : 0,
              transition: 'opacity 0.35s ease',
            }}
          />
        </svg>

        {/* Left Spin-Product Notched Editorial Card (100% FitVision 3D Text) */}
        <div className="hidden xl:block absolute left-0 top-[24%] w-48 z-20 fv-notched-card bg-white/95 backdrop-blur-sm px-4 py-3.5 shadow-lg border border-white">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-600">
              FITVISION 3D
            </span>
            <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-mono font-bold text-slate-700 rounded">
              ISO 8559
            </span>
          </div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-950 leading-snug">
            {isEn ? '13-Point Body\nScan Engine' : 'Quét 13 Mốc\nVóc Dáng 3D'}
          </h4>
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[10px] font-mono text-slate-600">
            <div className="flex justify-between">
              <span>{isEn ? 'Precision' : 'Sai số'}</span>
              <strong className="text-slate-950">±0.8 cm</strong>
            </div>
            <div className="flex justify-between">
              <span>{isEn ? 'Latency' : 'Tốc độ'}</span>
              <strong className="text-emerald-700">1.25s</strong>
            </div>
            <div className="flex justify-between">
              <span>{isEn ? 'RAM Privacy' : 'Lưu ảnh'}</span>
              <strong className="text-blue-600">0 byte</strong>
            </div>
          </div>
        </div>

        {/* 3 Interactive Pulsing + Biometric Hotspots (Visible Facing Front) */}
        {BIOMETRIC_HOTSPOTS.map((pin) => {
          const isShown = isFacingFront || !cacheReady;
          const isOpen = hoveredPin === pin.id;
          const onRight = parseFloat(pin.left) > 50;

          return (
            <div
              key={pin.id}
              style={{ top: pin.top, left: pin.left }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-300 ${
                isShown ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
              }`}
              onMouseEnter={() => setHoveredPin(pin.id)}
              onMouseLeave={() => setHoveredPin(null)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredPin(isOpen ? null : pin.id);
                }}
                className="relative w-6 h-6 rounded-full bg-white/95 text-[#14171C] border border-slate-300 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                aria-label={isEn ? pin.titleEn : pin.titleVi}
              >
                <span className="absolute inset-0 rounded-full bg-white/80 animate-ping" />
                <Plus size={12} className="relative z-10" />
              </button>

              {isOpen && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-52 bg-white text-slate-900 p-3 rounded-lg shadow-xl border border-slate-200 pointer-events-none animate-in fade-in duration-150 ${
                    onRight ? 'left-8' : 'right-8'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
                      {isEn ? pin.titleEn : pin.titleVi}
                    </span>
                    <span className="font-mono text-[11px] font-black text-blue-600">{pin.metric}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {isEn ? pin.descEn : pin.descVi}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Front / Back Look Thumbnails (Corner-Bracket Selector from Spin Product Section 7) */}
        {cacheReady && (
          <div className="absolute left-0 bottom-3 flex items-center gap-2 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                spinTo(0);
              }}
              className={`w-12 h-12 p-1 bg-white/90 transition-all cursor-pointer ${
                activeLook === 'front' ? 'fv-bracket-active opacity-100' : 'opacity-65 grayscale hover:opacity-90'
              }`}
              title={isEn ? 'Front View' : 'Góc trước'}
            >
              <canvas ref={frontThumbRef} width={96} height={96} className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                spinTo(0.5);
              }}
              className={`w-12 h-12 p-1 bg-white/90 transition-all cursor-pointer ${
                activeLook === 'back' ? 'fv-bracket-active opacity-100' : 'opacity-65 grayscale hover:opacity-90'
              }`}
              title={isEn ? 'Back View' : 'Góc sau'}
            >
              <canvas ref={backThumbRef} width={96} height={96} className="w-full h-full object-cover" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Readout Track + Privacy Footer */}
      <div className="relative z-20 space-y-2.5">
        <div className="flex items-center justify-center gap-3 text-[10px] font-mono tracking-widest text-slate-600">
          <span className="uppercase font-semibold">
            {isEn ? 'Drag to rotate 360°' : 'Kéo để xoay 360°'}
          </span>
          <div className="relative w-28 h-[1.5px] bg-slate-400/70">
            <span
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#14171C] transition-transform"
              style={{ left: `${(displayAngle / 360) * 100}%` }}
            />
          </div>
          <span className="font-bold text-[#14171C] w-9 text-right">
            {String(displayAngle).padStart(3, '0')}°
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white/85 border border-slate-300/80 text-[11px] text-slate-700 shadow-2xs">
          <span className="flex items-center gap-1.5 font-semibold truncate">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate">
              {t('app.auth.aboutTitle', 'Ảnh xử lý trên RAM 100% — Không lưu trữ máy chủ')}
            </span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-blue-700 shrink-0">
            <Layers size={12} />
            <span>3D ISO</span>
          </span>
        </div>
      </div>
    </div>
  );
};
