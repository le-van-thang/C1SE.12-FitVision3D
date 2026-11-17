import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  Bookmark,
  ShoppingBag,
  Check,
  Ruler,
  User,
  ShieldCheck,
  Lock,
  LogIn,
  Camera,
  UploadCloud,
  Scissors,
  SlidersHorizontal,
  Box,
  Image as ImageIcon,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { MannequinViewer } from '../avatar3d/MannequinViewer';
import { processPersonCutout, type CutoutResult } from '@/utils/personSegmentation';
import {
  setPendingStudioPhoto,
  loadFullScanSnapshot,
  setStudioCutoutCache,
  getStudioCutoutCache,
} from '@/utils/bodyProfileStorage';
import type { FashionProduct, UserBodyProfile } from './types';
import type { MeshParameter, Measurement } from '@/types/database.types';

export interface VellVirtualStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  isAuthenticated?: boolean;
  hasBodyProfile?: boolean;
  initialStageMode?: StageMode;
  onOpenSignIn?: () => void;
  onOpenBiometrics?: () => void;
  initialProduct?: FashionProduct | null;
  onAddToCart?: (product: FashionProduct, size: string) => void;
}

type GarmentSizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL';
type StageMode = 'avatar3d' | 'photo' | 'lookbook';
type StudioTab = 'outfits' | 'body' | 'dna' | 'atelier';

interface LookItem {
  id: number;
  name: string;
  category: string;
  isBottom?: boolean;
  tag: string;
  price: number;
  chest_ease: number;
  waist_ease: number;
  img: string;
  thumb: string;
  fabric: string;
}

const VELL_LOOKS: LookItem[] = [
  {
    id: 0,
    name: 'Denim Maxi Couture',
    category: 'everyday',
    isBottom: true,
    tag: 'Casual Atelier',
    price: 850000,
    chest_ease: 4.5,
    waist_ease: 4.0,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=360&q=85',
    fabric: 'Denim Cotton 13.5oz Wash Mềm',
  },
  {
    id: 1,
    name: 'Cloud Set Minimalist',
    category: 'everyday',
    tag: 'Daily Luxe',
    price: 690000,
    chest_ease: 5.0,
    waist_ease: 4.5,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=360&q=85',
    fabric: 'Sợi Cotton Dệt Kim Mịn Không Nhăn',
  },
  {
    id: 2,
    name: 'Library Knit Tailored',
    category: 'everyday',
    tag: 'Classic Knit',
    price: 920000,
    chest_ease: 5.5,
    waist_ease: 5.0,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=360&q=85',
    fabric: 'Len Lông Cừu Merino Blend 100%',
  },
  {
    id: 3,
    name: 'Lilac Run Athletic',
    category: 'athletic',
    tag: 'Sporty Chic',
    price: 580000,
    chest_ease: 3.0,
    waist_ease: 3.0,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=360&q=85',
    fabric: 'Spandex Co Giãn 4 Chiều Kháng Khuẩn',
  },
  {
    id: 4,
    name: 'Satin Night Slip',
    category: 'sleep',
    tag: 'Silk Luxury',
    price: 1150000,
    chest_ease: 4.0,
    waist_ease: 5.0,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=360&q=85',
    fabric: 'Lụa Tơ Tằm Bảo Lộc Dệt Satin 19 Momme',
  },
  {
    id: 5,
    name: 'Night Suit Bespoke Tuxedo',
    category: 'formal',
    tag: 'Bespoke Evening',
    price: 2450000,
    chest_ease: 5.0,
    waist_ease: 4.0,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=360&q=85',
    fabric: 'Wool Ý Super 150s Lót Lụa Bemberg',
  },
  {
    id: 6,
    name: 'Sage Slip Cocktail',
    category: 'party',
    tag: 'Party Elegance',
    price: 1350000,
    chest_ease: 4.0,
    waist_ease: 4.5,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=360&q=85',
    fabric: 'Lụa Habotai Nhuộm Thủ Công Tự Nhiên',
  },
  {
    id: 7,
    name: 'Bomber Cargo Streetwear',
    category: 'street',
    tag: 'High-End Street',
    price: 1250000,
    chest_ease: 6.5,
    waist_ease: 6.0,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=360&q=85',
    fabric: 'Nylon Twill Chống Nước Phối Rib Len Dày',
  },
];

const GARMENT_SIZE_SPECS: Record<GarmentSizeKey, { chest: number; waist: number; hip: number }> = {
  XS: { chest: 86, waist: 70, hip: 88 },
  S: { chest: 92, waist: 75, hip: 93 },
  M: { chest: 98, waist: 80, hip: 98 },
  L: { chest: 104, waist: 86, hip: 103 },
  XL: { chest: 110, waist: 92, hip: 109 },
};

const SIZE_LIST: GarmentSizeKey[] = ['XS', 'S', 'M', 'L', 'XL'];

function evaluateSizeFit(userBody: UserBodyProfile, look: LookItem, sizeKey: GarmentSizeKey) {
  const spec = GARMENT_SIZE_SPECS[sizeKey];
  const chestDelta = Math.round((spec.chest - userBody.chest_cm) * 10) / 10;
  const waistDelta = Math.round((spec.waist - (userBody.waist_cm + (look.isBottom ? 2.5 : 0))) * 10) / 10;
  const hipDelta = Math.round((spec.hip - userBody.hip_cm) * 10) / 10;

  let score = 100;
  if (look.isBottom) {
    if (waistDelta < 0) score -= 32;
    score -= Math.abs(waistDelta - look.waist_ease) * 3.5;
    score -= Math.abs(hipDelta - 5) * 2.5;
    if ((userBody.height_cm >= 167 || (userBody.inseam_cm ?? 0) >= 76) && (sizeKey === 'XS' || sizeKey === 'S') && userBody.weight_kg >= 52) {
      score -= 14;
    }
  } else {
    if (chestDelta < 0.5) score -= 36;
    score -= Math.abs(chestDelta - look.chest_ease) * 3.2;
    score -= Math.abs(waistDelta - look.waist_ease) * 2.2;
  }

  const pct = Math.max(55, Math.min(99, Math.round(score)));
  const primaryDelta = look.isBottom ? waistDelta : chestDelta;
  let status: 'tight' | 'ideal' | 'relaxed' = 'ideal';
  if (primaryDelta < 1.5) status = 'tight';
  else if (primaryDelta > 8.5) status = 'relaxed';

  return { sizeKey, spec, chestDelta, waistDelta, hipDelta, pct, status };
}

function getBestLookFit(userBody: UserBodyProfile, look: LookItem) {
  let best = evaluateSizeFit(userBody, look, 'M');
  for (const s of SIZE_LIST) {
    const candidate = evaluateSizeFit(userBody, look, s);
    if (candidate.pct > best.pct) best = candidate;
  }
  return best;
}

export const VellVirtualStudioModal: React.FC<VellVirtualStudioModalProps> = ({
  isOpen,
  onClose,
  userBody,
  isAuthenticated = false,
  hasBodyProfile = false,
  initialStageMode = 'avatar3d',
  onOpenSignIn,
  onOpenBiometrics,
  onAddToCart,
}) => {
  const { locale } = useI18n();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [activeLookIndex, setActiveLookIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<StudioTab>('outfits');
  const [stageMode, setStageMode] = useState<StageMode>(initialStageMode);
  const [selectedSizeOverride, setSelectedSizeOverride] = useState<GarmentSizeKey | null>(null);
  const [isWiping, setIsWiping] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [history, setHistory] = useState<number[]>([0]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const [savedToLibrary, setSavedToLibrary] = useState<boolean>(false);

  // Personal photo cutout state (preserved across round-trips to /dashboard scan)
  const [userPhotoName, setUserPhotoName] = useState<string>(() => getStudioCutoutCache()?.fileName || 'studio-photo.jpg');
  const [cutoutResult, setCutoutResult] = useState<CutoutResult | null>(() => {
    const cached = getStudioCutoutCache();
    return cached
      ? {
          cutoutDataUrl: cached.cutoutDataUrl,
          originalDataUrl: cached.originalDataUrl,
          foregroundRatio: cached.foregroundRatio,
          width: cached.width,
          height: cached.height,
        }
      : null;
  });
  const [enableCutout, setEnableCutout] = useState<boolean>(true);
  const [bgSensitivity, setBgSensitivity] = useState<number>(0.52);
  const [isCuttingOut, setIsCuttingOut] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStageMode(initialStageMode);
    }
  }, [isOpen, initialStageMode]);

  const currentLook = VELL_LOOKS[activeLookIndex];

  const lookFits = useMemo(() => {
    const map: Record<number, ReturnType<typeof getBestLookFit>> = {};
    VELL_LOOKS.forEach((look) => {
      map[look.id] = getBestLookFit(userBody, look);
    });
    return map;
  }, [userBody]);

  const bestFitForCurrent = lookFits[currentLook.id];
  const activeSize: GarmentSizeKey = selectedSizeOverride || bestFitForCurrent.sizeKey;
  const activeEval = useMemo(
    () => evaluateSizeFit(userBody, currentLook, activeSize),
    [userBody, currentLook, activeSize]
  );

  // Load full 11-metric snapshot when available so limbs (bicep, wrist, thigh, calf, ankle) aren't dashes
  const fullScanSnapshot = useMemo(
    () => (isOpen && hasBodyProfile ? loadFullScanSnapshot(currentUser?.id) : null),
    [isOpen, hasBodyProfile, currentUser?.id]
  );

  // Build live 3D MeshParameter & Measurement synced directly to userBody + full scan
  const studioMeshParams: MeshParameter | null = useMemo(() => {
    if (!hasBodyProfile) return null;
    if (fullScanSnapshot?.mesh) return fullScanSnapshot.mesh;
    return {
      id: 'studio-live-mesh',
      measurement_id: 'studio-live',
      base_gender_mesh: userBody.gender === 'female' ? 'female_base' : 'male_base',
      scale_chest: Math.round((userBody.chest_cm / 88) * 1000) / 1000,
      scale_waist: Math.round((userBody.waist_cm / 80) * 1000) / 1000,
      scale_hips: Math.round((userBody.hip_cm / 94) * 1000) / 1000,
      morph_payload: {},
      created_at: new Date().toISOString(),
    };
  }, [hasBodyProfile, userBody, fullScanSnapshot]);

  const studioMeasurement: Measurement | null = useMemo(() => {
    if (!hasBodyProfile) return null;
    if (fullScanSnapshot?.measurement) {
      return {
        ...fullScanSnapshot.measurement,
        chest_circ_cm: userBody.chest_cm,
        waist_circ_cm: userBody.waist_cm,
        hip_circ_cm: userBody.hip_cm,
        shoulder_breadth_cm: userBody.shoulder_cm,
        arm_length_cm: userBody.arm_length_cm,
        inseam_cm: userBody.inseam_cm ?? fullScanSnapshot.measurement.inseam_cm,
      };
    }
    return {
      id: 'studio-live-meas',
      user_id: 'current',
      input_id: 'studio',
      chest_circ_cm: userBody.chest_cm,
      waist_circ_cm: userBody.waist_cm,
      hip_circ_cm: userBody.hip_cm,
      shoulder_breadth_cm: userBody.shoulder_cm,
      inseam_cm: userBody.inseam_cm ?? Math.round(userBody.height_cm * 0.45 * 10) / 10,
      arm_length_cm: userBody.arm_length_cm,
      bicep_circ_cm: null,
      wrist_circ_cm: null,
      thigh_circ_cm: null,
      calf_circ_cm: null,
      ankle_circ_cm: null,
      extraction_confidence: 0.95,
      created_at: new Date().toISOString(),
    };
  }, [hasBodyProfile, userBody, fullScanSnapshot]);

  const handleSelectLook = (idx: number) => {
    setSelectedSizeOverride(null);
    if (idx === activeLookIndex) return;
    setIsWiping(true);
    setActiveLookIndex(idx);

    const nextHistory = history.slice(0, historyPointer + 1);
    nextHistory.push(idx);
    setHistory(nextHistory);
    setHistoryPointer(nextHistory.length - 1);

    setTimeout(() => {
      setIsWiping(false);
    }, 900);
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prev = historyPointer - 1;
      setHistoryPointer(prev);
      setActiveLookIndex(history[prev]);
      setSelectedSizeOverride(null);
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 750);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const next = historyPointer + 1;
      setHistoryPointer(next);
      setActiveLookIndex(history[next]);
      setSelectedSizeOverride(null);
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 750);
    }
  };

  const runCutoutForInput = async (input: File | string, sens: number, name: string) => {
    setIsCuttingOut(true);
    try {
      const res = await processPersonCutout(input, sens);
      setCutoutResult(res);
      setStudioCutoutCache({ ...res, fileName: name });
    } finally {
      setIsCuttingOut(false);
    }
  };

  const handleUserPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUserPhotoName(file.name);
    setStageMode('photo');
    await runCutoutForInput(file, bgSensitivity, file.name);
  };

  const handleSensitivityChange = async (nextSens: number) => {
    setBgSensitivity(nextSens);
    if (cutoutResult?.originalDataUrl) {
      await runCutoutForInput(cutoutResult.originalDataUrl, nextSens, userPhotoName);
    }
  };

  const handleSendPhotoTo3DScan = () => {
    if (cutoutResult?.originalDataUrl) {
      setPendingStudioPhoto(cutoutResult.originalDataUrl, userPhotoName);
    }
    onClose();
    navigate('/dashboard?from=studio');
  };

  const filteredLooks =
    activeCategory === 'all'
      ? VELL_LOOKS
      : VELL_LOOKS.filter((l) => l.category === activeCategory);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
        <div className="relative w-full max-w-md rounded-3xl overflow-hidden bg-stone-950/90 border border-white/20 shadow-2xl p-7 text-center text-white space-y-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-400/40 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock size={26} />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-300 block">
              FitVision VELL · Virtual Fitting 3D
            </span>
            <h3 className="text-lg font-extrabold text-white">
              {locale === 'en'
                ? 'Sign In to Enter 3D Fitting Room'
                : 'Đăng Nhập Để Dùng Phòng Thử Đồ Ảo 3D'}
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              {locale === 'en'
                ? 'Please sign in so FitVision can load your real 3D body profile and compute accurate Ease Allowance & size matches.'
                : 'Vui lòng đăng nhập để hệ thống đồng bộ số đo 3D cá nhân của bạn, tách nền ảnh và mô phỏng độ vừa trang phục chính xác.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
            >
              {locale === 'en' ? 'Cancel' : 'Để sau'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSignIn) onOpenSignIn();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogIn size={14} />
              <span>{locale === 'en' ? 'Sign In Now' : 'Đăng Nhập Ngay'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-7xl max-h-[96vh] m-2 sm:m-4 rounded-3xl overflow-hidden bg-stone-950 border border-white/20 shadow-2xl flex flex-col font-sans text-white select-none">
        {/* Atmospheric Loft Texture + Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034551_6394b127-5366-40a8-9c82-3c416f1161f1.png&w=2400&q=85')`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 45%, rgba(12,10,9,0.22) 0%, rgba(12,10,9,0.72) 100%)',
          }}
        />

        {/* Hidden personal photo input */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handleUserPhotoChange}
          className="hidden"
        />

        {/* ── TOP FROSTED GLASS CONTROL BAR ── */}
        <header className="relative z-20 h-16 px-4 sm:px-6 border-b border-white/15 bg-stone-950/75 backdrop-blur-xl flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                  FitVision <span className="text-blue-400">VELL</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/25 text-blue-200 border border-blue-400/40 hidden sm:inline-block">
                  Virtual Fitting 3D
                </span>
              </div>
              <p className="text-[11px] text-stone-300 font-medium truncate hidden md:block">
                {locale === 'en'
                  ? '3D Silhouette Fit Simulation & Personal Cutout Studio'
                  : 'Mô phỏng 3D theo số đo thật & Tách nền ảnh cá nhân trong khung Studio'}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-full border border-white/15 text-xs font-semibold overflow-x-auto scrollbar-none">
            {[
              { id: 'outfits', label: locale === 'en' ? 'OUTFITS' : 'BỘ SƯU TẬP' },
              { id: 'body', label: locale === 'en' ? 'BODY ISO' : 'SỐ ĐO ISO' },
              { id: 'dna', label: locale === 'en' ? 'PROPORTIONS' : 'TỈ LỆ DÁNG' },
              { id: 'atelier', label: locale === 'en' ? 'ATELIER' : 'NHÀ MAY' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-stone-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Virtual Studio"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── MAIN STUDIO STAGE ── */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column (lg:col-span-3): Profile, Real Fit Deltas & Scan/Input CTAs */}
          <div className="hidden lg:flex lg:col-span-3 p-4 flex-col justify-between z-10 pointer-events-auto overflow-y-auto gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/75 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-blue-400" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                    {locale === 'en' ? 'Your Body Profile' : 'Hồ Sơ Vóc Dáng'}
                  </span>
                </div>
                <span className={`w-2 h-2 rounded-full ${hasBodyProfile ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Chiều cao</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {hasBodyProfile ? `${userBody.height_cm} cm` : '— cm'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Cân nặng</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {hasBodyProfile ? `${userBody.weight_kg} kg` : '— kg'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Vòng ngực</span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {hasBodyProfile ? `${userBody.chest_cm} cm` : '— cm'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Vòng eo</span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {hasBodyProfile ? `${userBody.waist_cm} cm` : '— cm'}
                  </span>
                </div>
              </div>

              {!hasBodyProfile ? (
                <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-400/40 space-y-2 text-xs">
                  <p className="text-amber-200 font-semibold leading-snug text-[11px]">
                    {locale === 'en'
                      ? 'Scan 3D or enter measurements to compute real size fit.'
                      : 'Chưa có số đo 3D. Hãy quét ảnh hoặc nhập số đo để thử đồ chuẩn.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleSendPhotoTo3DScan}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Camera size={13} />
                    <span>{locale === 'en' ? 'Go to 3D AI Scan' : 'Quét Lấy Số Đo 3D'}</span>
                  </button>
                  {onOpenBiometrics && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBiometrics();
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-stone-100 border border-white/15 font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      {locale === 'en' ? 'Manual Input' : 'Hoặc nhập tay nhanh'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/90 to-slate-900/90 border border-blue-400/40 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200 font-bold">Thử Size {activeSize}:</span>
                    <span className={`px-2 py-0.5 rounded-md font-mono font-black text-[11px] ${
                      activeEval.status === 'tight'
                        ? 'bg-rose-500 text-white'
                        : activeEval.status === 'relaxed'
                        ? 'bg-sky-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {activeEval.pct}% {activeEval.status === 'tight' ? 'Hơi kích' : activeEval.status === 'relaxed' ? 'Rộng êm' : 'Vừa đẹp'}
                    </span>
                  </div>

                  {/* Interactive Size Tester Pills */}
                  <div className="grid grid-cols-5 gap-1 pt-0.5">
                    {SIZE_LIST.map((sz) => {
                      const isBest = sz === bestFitForCurrent.sizeKey;
                      const isCur = sz === activeSize;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSizeOverride(sz)}
                          className={`py-1 rounded-lg font-mono text-[11px] font-black transition-all cursor-pointer relative ${
                            isCur
                              ? 'bg-white text-stone-950 shadow-sm'
                              : 'bg-white/10 hover:bg-white/20 text-stone-200'
                          }`}
                          title={isBest ? `AI khuyên dùng Size ${sz}` : `Thử Size ${sz}`}
                        >
                          {sz}
                          {isBest && (
                            <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Độ dư Ngực:</span>
                      <span className={`font-mono font-bold ${activeEval.chestDelta < 1 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {activeEval.chestDelta >= 0 ? '+' : ''}{activeEval.chestDelta} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Độ dư Eo:</span>
                      <span className={`font-mono font-bold ${activeEval.waistDelta < 0.5 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {activeEval.waistDelta >= 0 ? '+' : ''}{activeEval.waistDelta} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Độ dư Hông:</span>
                      <span className={`font-mono font-bold ${activeEval.hipDelta < 0.5 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {activeEval.hipDelta >= 0 ? '+' : ''}{activeEval.hipDelta} cm
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-[11px]">
                <span className="font-bold text-stone-200 block mb-0.5">Chất liệu vải:</span>
                <p className="text-white/90 font-medium leading-snug">{currentLook.fabric}</p>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-stone-950/75 backdrop-blur-xl border border-white/20 flex items-center justify-around shadow-xl shrink-0">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyPointer <= 0}
                className="p-2 rounded-xl text-stone-100 hover:text-white hover:bg-white/15 disabled:opacity-30 transition-all cursor-pointer"
                title="Quay lại bộ trước"
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyPointer >= history.length - 1}
                className="p-2 rounded-xl text-stone-100 hover:text-white hover:bg-white/15 disabled:opacity-30 transition-all cursor-pointer"
                title="Tiếp theo"
              >
                <Redo2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleSelectLook(0)}
                className="p-2 rounded-xl text-stone-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                title="Khôi phục mặc định"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Center Column (lg:col-span-5): Live Stage (3D Avatar | Cutout User Photo | Lookbook Model) */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-between py-3 px-4 overflow-hidden">
            {/* Stage Mode Switcher */}
            <div className="relative z-20 flex items-center gap-1 p-1 rounded-full bg-stone-950/80 backdrop-blur-xl border border-white/20 shadow-lg">
              <button
                type="button"
                onClick={() => setStageMode('avatar3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  stageMode === 'avatar3d' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-200 hover:text-white'
                }`}
              >
                <Box size={13} />
                <span>{locale === 'en' ? '3D Body Fit' : 'Mô Phỏng 3D'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStageMode('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  stageMode === 'photo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-200 hover:text-white'
                }`}
              >
                <Scissors size={13} />
                <span>{locale === 'en' ? 'Your Photo Cutout' : 'Ảnh Cá Nhân (Tách Nền)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStageMode('lookbook')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  stageMode === 'lookbook' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-200 hover:text-white'
                }`}
              >
                <ImageIcon size={13} />
                <span>{locale === 'en' ? 'Lookbook' : 'Mẫu Studio'}</span>
              </button>
            </div>

            {/* Stage Viewport */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-2">
              <div className="absolute bottom-4 w-52 h-8 rounded-full bg-black/70 blur-md pointer-events-none" />

              {stageMode === 'avatar3d' && (
                <div className="relative w-full h-full min-h-[420px] flex flex-col">
                  <div className="flex-1 relative">
                    <MannequinViewer
                      variant="studio"
                      meshParams={studioMeshParams}
                      measurement={studioMeasurement}
                      height="100%"
                      autoRotate
                      hideZonePill
                    />
                  </div>
                  {!hasBodyProfile && (
                    <div className="absolute inset-x-4 bottom-20 p-3 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-blue-400/40 text-center space-y-2 z-20">
                      <p className="text-xs text-stone-100 font-semibold">
                        {locale === 'en'
                          ? 'Upload your photo to extract exact 3D body measurements & simulate fit.'
                          : 'Đang hiển thị dáng tham chiếu. Hãy quét 3D hoặc nhập số đo để dựng đúng vóc dáng bạn.'}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleSendPhotoTo3DScan}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                        >
                          Quét AI 3D ngay
                        </button>
                        {onOpenBiometrics && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenBiometrics();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                          >
                            Nhập số đo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stageMode === 'photo' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                  {!cutoutResult ? (
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full max-w-sm rounded-3xl border-2 border-dashed border-emerald-400/50 bg-stone-950/75 hover:bg-stone-900/90 backdrop-blur-xl p-6 text-center space-y-3 cursor-pointer transition-all shadow-2xl"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto">
                        <UploadCloud size={26} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-white">
                          {locale === 'en'
                            ? 'Place Your Photo in the 3D Loft'
                            : 'Chọn Ảnh Cá Nhân Đưa Vào Phòng Studio'}
                        </h4>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          {locale === 'en'
                            ? 'Auto-removes messy room backgrounds, normalizes distance scaling, and matches your measurements.'
                            : 'Hệ thống tự động cắt tách phông nền thừa, cân tỷ lệ khung người dù chụp gần/xa và chuyển nhanh sang quét số đo 3D.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
                      >
                        {locale === 'en' ? 'Choose Full-Body Photo' : 'Chọn Ảnh Toàn Thân'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-end pb-14">
                      {/* Cutout & Auto-scaled Person Standing in Studio Loft */}
                      <img
                        src={enableCutout ? cutoutResult.cutoutDataUrl : cutoutResult.originalDataUrl}
                        alt="Personal cutout"
                        className="max-h-[82%] max-w-[85%] object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)] transition-all duration-300"
                        style={{
                          filter: isCuttingOut ? 'blur(2px) brightness(0.9)' : 'none',
                        }}
                      />

                      {/* Floating Personal Cutout Controls + 3D Scan Action */}
                      <div className="absolute top-2 inset-x-2 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/15 text-[11px] z-20">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEnableCutout((v) => !v)}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                              enableCutout ? 'bg-emerald-600 text-white' : 'bg-white/15 text-stone-200'
                            }`}
                          >
                            {enableCutout ? '✓ Đã tách nền' : 'Ảnh gốc'}
                          </button>
                          {enableCutout && (
                            <label className="flex items-center gap-1.5 text-stone-200 font-semibold">
                              <SlidersHorizontal size={12} />
                              <span>Ngưỡng</span>
                              <input
                                type="range"
                                min={0.2}
                                max={0.9}
                                step={0.04}
                                value={bgSensitivity}
                                onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                                className="w-16 accent-emerald-400 cursor-pointer"
                              />
                            </label>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer"
                          >
                            Đổi ảnh
                          </button>
                          <button
                            type="button"
                            onClick={handleSendPhotoTo3DScan}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Camera size={12} />
                            <span>Quét ảnh lấy số đo 3D</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stageMode === 'lookbook' && (
                <div className="relative h-full w-auto aspect-[1360/2048] flex items-center justify-center overflow-hidden">
                  <img
                    src={currentLook.img}
                    alt={currentLook.name}
                    className="w-full h-full object-contain object-bottom pointer-events-none transition-all duration-300 select-none"
                    style={{
                      filter: isWiping ? 'brightness(1.08)' : 'none',
                    }}
                  />
                  {isWiping && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute left-[-15%] right-[-15%] h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_25px_8px_rgba(255,255,255,0.85),0_0_60px_18px_rgba(59,130,246,0.55)] animate-scan-wipe" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="relative z-20 w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-stone-950/85 backdrop-blur-xl border border-white/20 shadow-2xl">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 truncate">
                  <span className="truncate">{currentLook.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/15 text-stone-100 border border-white/10 shrink-0">
                    {currentLook.tag}
                  </span>
                </h3>
                <span className="text-xs font-extrabold text-amber-300 font-mono block mt-0.5">
                  {currentLook.price.toLocaleString('vi-VN')} ₫
                  {hasBodyProfile && (
                    <span className="ml-2 text-emerald-300">
                      · Size {activeSize} ({activeEval.pct}% hợp dáng)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSavedToLibrary(true);
                    setTimeout(() => setSavedToLibrary(false), 2000);
                  }}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/15 transition-colors cursor-pointer"
                  title="Lưu vào tủ đồ"
                >
                  {savedToLibrary ? <Check size={16} className="text-emerald-400" /> : <Bookmark size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onAddToCart) {
                      const fakeProd: any = {
                        id: `vell-${currentLook.id}`,
                        name: currentLook.name,
                        price: currentLook.price,
                        image_url: currentLook.img,
                        brand_name: 'VELL Atelier',
                        fabric_material: currentLook.fabric,
                        category: currentLook.category,
                      };
                      onAddToCart(fakeProd, activeSize);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>{hasBodyProfile ? `Mua Size ${activeSize}` : 'Chọn Mua'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (lg:col-span-4): Smoked Glass Outfits & Spec Panel */}
          <div className="lg:col-span-4 p-4 sm:p-5 overflow-y-auto space-y-4 z-10 pointer-events-auto">
            {activeTab === 'outfits' && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'Tất Cả (8)' },
                    { id: 'everyday', label: 'Hàng Ngày' },
                    { id: 'formal', label: 'Dạ Hội / Vest' },
                    { id: 'athletic', label: 'Thể Thao' },
                    { id: 'sleep', label: 'Lụa Mềm' },
                    { id: 'street', label: 'Streetwear' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        activeCategory === c.id
                          ? 'bg-white text-stone-950 border-white shadow-md'
                          : 'bg-stone-950/70 hover:bg-stone-900 text-stone-100 border-white/20'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {filteredLooks.map((look) => {
                    const isSelected = look.id === activeLookIndex;
                    const dynFit = lookFits[look.id];
                    return (
                      <div
                        key={look.id}
                        onClick={() => handleSelectLook(look.id)}
                        className={`group relative p-2.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-blue-950/85 border-blue-400 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400'
                            : 'bg-stone-950/75 hover:bg-stone-900/90 border-white/20 hover:border-white/40 shadow-lg'
                        }`}
                      >
                        <div className="relative aspect-[3/4] rounded-xl bg-black/50 overflow-hidden mb-2">
                          <img
                            src={look.thumb}
                            alt={look.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 right-1.5">
                            {hasBodyProfile ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-emerald-600 text-white shadow-sm">
                                {dynFit.pct}%
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-950/85 text-stone-200 border border-white/15">
                                ISO 8559
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                          {look.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <span className="font-mono text-amber-300 font-extrabold">
                            {look.price.toLocaleString('vi-VN')} ₫
                          </span>
                          {hasBodyProfile ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600/40 text-blue-100 border border-blue-400/30 font-mono text-[10px] font-bold">
                              Size {dynFit.sizeKey}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300 font-mono text-[10px]">
                              XS–XL
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="p-5 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                  <Ruler size={16} className="text-blue-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Trích Xuất Nhân Trắc Học ISO 8559-1
                  </h3>
                </div>
                <p className="text-xs text-stone-200 leading-relaxed">
                  Hệ thống sử dụng tích phân Ramanujan bậc hai để trích xuất các đường bao chu vi từ ảnh chụp dáng chuẩn của bạn:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Chu vi ngực (Chest):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${userBody.chest_cm} cm` : '— cm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Chu vi eo (Waist):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${userBody.waist_cm} cm` : '— cm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Chu vi mông (Hip):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${userBody.hip_cm} cm` : '— cm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Rộng vai (Shoulder):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${userBody.shoulder_cm || 43} cm` : '— cm'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dna' && (
              <div className="p-5 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                  <Sparkles size={16} className="text-purple-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Tỉ Lệ Vóc Dáng & Phân Tích Hình Thể
                  </h3>
                </div>
                {hasBodyProfile ? (
                  <div className="space-y-3 text-stone-200 leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-400/30">
                      <span className="font-bold text-purple-200 block mb-1">
                        Tỉ lệ Ngực / Eo: {(userBody.chest_cm / Math.max(userBody.waist_cm, 1)).toFixed(2)}
                      </span>
                      <span>
                        {userBody.chest_cm / Math.max(userBody.waist_cm, 1) > 1.2
                          ? 'Phom dáng V-Shape (vai/ngực nở, eo thon) — rất hợp đồ cắt gọn gàng.'
                          : 'Phom dáng cân đối tiêu chuẩn — phù hợp hầu hết phom Regular / Relaxed.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-300">Vui lòng quét 3D hoặc nhập số đo để xem phân tích tỉ lệ hình thể.</p>
                )}
              </div>
            )}

            {activeTab === 'atelier' && (
              <div className="p-5 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Quy Trình Cắt May & Bảo Hành Size
                  </h3>
                </div>
                <p className="text-stone-200 leading-relaxed">
                  Thông số của bạn được quy đổi chính xác sang độ cử động may mặc thực tế trước khi gửi xưởng.
                </p>
                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-400/30 space-y-1">
                  <span className="font-bold text-amber-200 block">Cam Kết Vừa Vặn 100%:</span>
                  <p className="text-[11px] text-stone-200">Nếu trang phục không vừa như dự đoán 3D, hỗ trợ đổi/sửa miễn phí trong 14 ngày.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VellVirtualStudioModal;
