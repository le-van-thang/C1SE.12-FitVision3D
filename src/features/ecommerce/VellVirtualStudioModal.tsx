import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
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
  Store,
  Shirt,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { MannequinViewer, type GarmentOverlay3D } from '../avatar3d/MannequinViewer';
import { processPersonCutout, type CutoutResult } from '@/utils/personSegmentation';
import {
  setPendingStudioPhoto,
  loadFullScanSnapshot,
  setStudioCutoutCache,
  getStudioCutoutCache,
} from '@/utils/bodyProfileStorage';
import type { FashionProduct, ProductVariant, UserBodyProfile } from './types';
import type { MeshParameter, Measurement } from '@/types/database.types';

export interface VellVirtualStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  isAuthenticated?: boolean;
  hasBodyProfile?: boolean;
  initialStageMode?: StageMode;
  products?: FashionProduct[];
  initialProduct?: FashionProduct | null;
  onUpdateGender?: (gender: 'male' | 'female') => void;
  onOpenSignIn?: () => void;
  onOpenBiometrics?: () => void;
  onAddToCart?: (product: FashionProduct, size: string) => void;
}

type GarmentSizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL';
type StageMode = 'avatar3d' | 'photo' | 'lookbook';
type StudioTab = 'outfits' | 'body' | 'dna' | 'atelier';

interface StudioOutfitItem {
  key: string;
  shopName: string;
  name: string;
  category: string;
  garment3dType: 'top' | 'bottom' | 'full';
  genderTarget: 'male' | 'female' | 'unisex';
  tag: string;
  price: number;
  chest_ease: number;
  waist_ease: number;
  colorHex: string;
  img: string;
  thumb: string;
  fabric: string;
  sourceProduct?: FashionProduct;
  variantSpecs?: Partial<Record<GarmentSizeKey, { chest: number; waist: number; hip: number }>>;
  tryOnFlatImg?: string;
  isFoldedOriginal?: boolean;
}

const DEFAULT_GARMENT_SPECS: Record<GarmentSizeKey, { chest: number; waist: number; hip: number }> = {
  XS: { chest: 86, waist: 70, hip: 88 },
  S: { chest: 92, waist: 75, hip: 93 },
  M: { chest: 98, waist: 80, hip: 98 },
  L: { chest: 104, waist: 86, hip: 103 },
  XL: { chest: 110, waist: 92, hip: 109 },
};

const SIZE_LIST: GarmentSizeKey[] = ['XS', 'S', 'M', 'L', 'XL'];

const CURATED_STUDIO_LOOKS: StudioOutfitItem[] = [
  {
    key: 'vell-tuxedo',
    shopName: 'VELL Atelier',
    name: 'Night Suit Bespoke Tuxedo',
    category: 'formal',
    garment3dType: 'full',
    genderTarget: 'male',
    tag: 'Bespoke Suit',
    price: 2450000,
    chest_ease: 5.0,
    waist_ease: 4.5,
    colorHex: '#1E293B',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=360&q=85',
    fabric: 'Wool Ý Super 150s Lót Lụa Bemberg',
  },
  {
    key: 'vell-bomber',
    shopName: 'VELL Atelier',
    name: 'Bomber Cargo Streetwear',
    category: 'street',
    garment3dType: 'top',
    genderTarget: 'male',
    tag: 'Streetwear',
    price: 1250000,
    chest_ease: 6.5,
    waist_ease: 6.0,
    colorHex: '#334155',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=360&q=85',
    fabric: 'Nylon Twill Chống Nước Phối Rib Len Dày',
  },
  {
    key: 'vell-knit',
    shopName: 'VELL Atelier',
    name: 'Library Knit Tailored',
    category: 'everyday',
    garment3dType: 'full',
    genderTarget: 'unisex',
    tag: 'Classic Knit',
    price: 920000,
    chest_ease: 5.5,
    waist_ease: 5.0,
    colorHex: '#D6D3D1',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=360&q=85',
    fabric: 'Len Lông Cừu Merino Blend 100%',
  },
  {
    key: 'vell-denim',
    shopName: 'VELL Atelier',
    name: 'Denim Maxi Couture',
    category: 'everyday',
    garment3dType: 'bottom',
    genderTarget: 'female',
    tag: 'Casual Atelier',
    price: 850000,
    chest_ease: 4.5,
    waist_ease: 4.0,
    colorHex: '#3B82F6',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=360&q=85',
    fabric: 'Denim Cotton 13.5oz Wash Mềm',
  },
  {
    key: 'vell-cloud',
    shopName: 'VELL Atelier',
    name: 'Cloud Set Minimalist',
    category: 'everyday',
    garment3dType: 'full',
    genderTarget: 'female',
    tag: 'Daily Luxe',
    price: 690000,
    chest_ease: 5.0,
    waist_ease: 4.5,
    colorHex: '#E7E5E4',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=360&q=85',
    fabric: 'Sợi Cotton Dệt Kim Mịn Không Nhăn',
  },
  {
    key: 'vell-lilac',
    shopName: 'VELL Atelier',
    name: 'Lilac Run Athletic',
    category: 'athletic',
    garment3dType: 'full',
    genderTarget: 'female',
    tag: 'Sporty Chic',
    price: 580000,
    chest_ease: 3.0,
    waist_ease: 3.0,
    colorHex: '#A78BFA',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=360&q=85',
    fabric: 'Spandex Co Giãn 4 Chiều Kháng Khuẩn',
  },
  {
    key: 'vell-satin',
    shopName: 'VELL Atelier',
    name: 'Satin Night Slip',
    category: 'sleep',
    garment3dType: 'full',
    genderTarget: 'female',
    tag: 'Silk Luxury',
    price: 1150000,
    chest_ease: 4.0,
    waist_ease: 5.0,
    colorHex: '#F43F5E',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=360&q=85',
    fabric: 'Lụa Tơ Tằm Bảo Lộc Dệt Satin 19 Momme',
  },
  {
    key: 'vell-sage',
    shopName: 'VELL Atelier',
    name: 'Sage Slip Cocktail',
    category: 'party',
    garment3dType: 'full',
    genderTarget: 'female',
    tag: 'Party Elegance',
    price: 1350000,
    chest_ease: 4.0,
    waist_ease: 4.5,
    colorHex: '#10B981',
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=360&q=85',
    fabric: 'Lụa Habotai Nhuộm Thủ Công Tự Nhiên',
  },
];

function mapProductToStudioItem(p: FashionProduct): StudioOutfitItem {
  const variantSpecs: Partial<Record<GarmentSizeKey, { chest: number; waist: number; hip: number }>> = {};
  (p.variants || []).forEach((v: ProductVariant) => {
    const lbl = v.size_label;
    if (lbl === 'XS' || lbl === 'S' || lbl === 'M' || lbl === 'L' || lbl === 'XL') {
      variantSpecs[lbl] = {
        chest: v.spec?.chest_cm || DEFAULT_GARMENT_SPECS[lbl].chest,
        waist: v.spec?.waist_cm || DEFAULT_GARMENT_SPECS[lbl].waist,
        hip: v.spec?.hip_cm || DEFAULT_GARMENT_SPECS[lbl].hip,
      };
    }
  });
  const firstVar = p.variants?.[0];
  const cat = String(p.category || '').toLowerCase();
  const nameLower = p.name.toLowerCase();
  const g3d: 'top' | 'bottom' | 'full' =
    cat === 'pants' || (cat === 'tailored' && nameLower.includes('quần'))
      ? 'bottom'
      : cat === 'dress' || cat === 'bespoke' || (cat === 'tailored' && (nameLower.includes('suit') || nameLower.includes('bộ')))
        ? 'full'
        : 'top';

  const isFolded = nameLower.includes('sơ my') || nameLower.includes('sơ mi') || nameLower.includes('gấp');
  // Với sản phẩm áo sơ mi bị chụp gấp nếp, dùng phom áo sơ mi may đo cao cấp mở phẳng để ướm thử vừa vặn dáng người:
  const flatImg = isFolded
    ? 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80'
    : p.image_url;

  return {
    key: `shop-${p.id}`,
    shopName: p.brand_name || 'FitVision Partner',
    name: p.name,
    category: cat === 'pants' || cat === 'shirt' || cat === 'polo' ? 'everyday' : cat === 'blazer' || cat === 'tailored' || cat === 'bespoke' ? 'formal' : 'party',
    garment3dType: g3d,
    genderTarget: p.gender_target,
    tag: cat.toUpperCase(),
    price: p.sale_price ?? p.price,
    chest_ease: firstVar?.spec ? Math.round(((firstVar.spec.ease_min_cm + firstVar.spec.ease_max_cm) / 2) * 10) / 10 : 5.0,
    waist_ease: 4.5,
    colorHex: firstVar?.color_hex || '#3B82F6',
    img: p.image_url,
    thumb: p.image_url,
    fabric: p.fabric_material,
    sourceProduct: p,
    variantSpecs,
    tryOnFlatImg: flatImg,
    isFoldedOriginal: isFolded,
  };
}

function evaluateSizeFit(
  userBody: UserBodyProfile,
  look: StudioOutfitItem,
  sizeKey: GarmentSizeKey
) {
  const spec = look.variantSpecs?.[sizeKey] || DEFAULT_GARMENT_SPECS[sizeKey];
  const isBottom = look.garment3dType === 'bottom';
  const chestDelta = Math.round((spec.chest - userBody.chest_cm) * 10) / 10;
  const waistDelta = Math.round((spec.waist - (userBody.waist_cm + (isBottom ? 2.5 : 0))) * 10) / 10;
  const hipDelta = Math.round((spec.hip - userBody.hip_cm) * 10) / 10;

  let score = 100;
  if (isBottom) {
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
  const primaryDelta = isBottom ? waistDelta : chestDelta;
  let status: 'tight' | 'ideal' | 'relaxed' = 'ideal';
  if (primaryDelta < 1.5) status = 'tight';
  else if (primaryDelta > 8.5) status = 'relaxed';

  return { sizeKey, spec, chestDelta, waistDelta, hipDelta, pct, status };
}

function getBestLookFit(userBody: UserBodyProfile, look: StudioOutfitItem) {
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
  products = [],
  initialProduct = null,
  onUpdateGender,
  onOpenSignIn,
  onOpenBiometrics,
  onAddToCart,
}) => {
  const { locale } = useI18n();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Build unified shop catalog: real Storefront Shop Products + VELL Studio Looks
  const allStudioItems = useMemo(() => {
    const shopItems = products.map(mapProductToStudioItem);
    return [...shopItems, ...CURATED_STUDIO_LOOKS];
  }, [products]);

  const shopNames = useMemo(() => {
    const set = new Set<string>();
    allStudioItems.forEach((it) => set.add(it.shopName));
    return ['all', ...Array.from(set)];
  }, [allStudioItems]);

  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [studioGender, setStudioGender] = useState<'male' | 'female'>(
    userBody.gender === 'female' ? 'female' : 'male'
  );
  const [activeItemKey, setActiveItemKey] = useState<string>(allStudioItems[0]?.key || 'vell-tuxedo');
  const [activeTab, setActiveTab] = useState<StudioTab>('outfits');
  const [stageMode, setStageMode] = useState<StageMode>(initialStageMode);
  const [wearGarment3D, setWearGarment3D] = useState<boolean>(true);
  const [selectedSizeOverride, setSelectedSizeOverride] = useState<GarmentSizeKey | null>(null);
  const [isWiping, setIsWiping] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

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

  // Sync gender & targeted Shop Room cleanly when opening modal or changing userBody.gender
  useEffect(() => {
    if (!isOpen) return;
    setStageMode(initialStageMode);
    setStudioGender(userBody.gender === 'female' ? 'female' : 'male');
    if (initialProduct) {
      setSelectedShop(initialProduct.brand_name);
      const targetKey = `shop-${initialProduct.id}`;
      setActiveItemKey(targetKey);
      setHistory([targetKey]);
      setHistoryPointer(0);
    } else {
      setSelectedShop('all');
      const preferred = allStudioItems.find(
        (it) =>
          it.genderTarget === (userBody.gender === 'female' ? 'female' : 'male') ||
          it.genderTarget === 'unisex'
      );
      const key = preferred?.key || allStudioItems[0]?.key || 'vell-tuxedo';
      setActiveItemKey(key);
      setHistory([key]);
      setHistoryPointer(0);
    }
    setSelectedSizeOverride(null);
  }, [isOpen, initialStageMode, initialProduct, userBody.gender, allStudioItems]);

  const effectiveUserBody: UserBodyProfile = useMemo(
    () => ({ ...userBody, gender: studioGender }),
    [userBody, studioGender]
  );

  // Filter items cleanly by Shop Room + Gender + Category
  const filteredLooks = useMemo(() => {
    return allStudioItems.filter((item) => {
      const matchShop = selectedShop === 'all' || item.shopName === selectedShop;
      const matchGender = item.genderTarget === studioGender || item.genderTarget === 'unisex';
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      return matchShop && matchGender && matchCat;
    });
  }, [allStudioItems, selectedShop, studioGender, activeCategory]);

  const currentLook = useMemo(() => {
    return (
      allStudioItems.find((it) => it.key === activeItemKey) ||
      filteredLooks[0] ||
      allStudioItems[0]
    );
  }, [allStudioItems, activeItemKey, filteredLooks]);

  const lookFits = useMemo(() => {
    const map: Record<string, ReturnType<typeof getBestLookFit>> = {};
    allStudioItems.forEach((look) => {
      map[look.key] = getBestLookFit(effectiveUserBody, look);
    });
    return map;
  }, [allStudioItems, effectiveUserBody]);

  const bestFitForCurrent = lookFits[currentLook.key] || evaluateSizeFit(effectiveUserBody, currentLook, 'M');
  const activeSize: GarmentSizeKey = selectedSizeOverride || bestFitForCurrent.sizeKey;
  const activeEval = useMemo(
    () => evaluateSizeFit(effectiveUserBody, currentLook, activeSize),
    [effectiveUserBody, currentLook, activeSize]
  );

  // Load full 11-metric snapshot when available
  const fullScanSnapshot = useMemo(
    () => (isOpen && hasBodyProfile ? loadFullScanSnapshot(currentUser?.id) : null),
    [isOpen, hasBodyProfile, currentUser?.id]
  );

  // 3D Mannequin mesh dynamically reacts to studioGender (male ↔ female) & scanned body scales
  const studioMeshParams: MeshParameter | null = useMemo(() => {
    const isFem = studioGender === 'female';
    if (!hasBodyProfile) {
      return {
        id: `studio-preview-${studioGender}`,
        measurement_id: 'studio-preview',
        base_gender_mesh: isFem ? 'female_base' : 'male_base',
        scale_chest: 1.0,
        scale_waist: 1.0,
        scale_hips: 1.0,
        morph_payload: {},
        created_at: new Date().toISOString(),
      };
    }
    return {
      id: `studio-live-${studioGender}`,
      measurement_id: 'studio-live',
      base_gender_mesh: isFem ? 'female_base' : 'male_base',
      scale_chest: Math.round((effectiveUserBody.chest_cm / 88) * 1000) / 1000,
      scale_waist: Math.round((effectiveUserBody.waist_cm / 80) * 1000) / 1000,
      scale_hips: Math.round((effectiveUserBody.hip_cm / 94) * 1000) / 1000,
      morph_payload: {},
      created_at: new Date().toISOString(),
    };
  }, [hasBodyProfile, studioGender, effectiveUserBody]);

  const studioMeasurement: Measurement | null = useMemo(() => {
    if (!hasBodyProfile) return null;
    if (fullScanSnapshot?.measurement) {
      return {
        ...fullScanSnapshot.measurement,
        chest_circ_cm: effectiveUserBody.chest_cm,
        waist_circ_cm: effectiveUserBody.waist_cm,
        hip_circ_cm: effectiveUserBody.hip_cm,
        shoulder_breadth_cm: effectiveUserBody.shoulder_cm,
        arm_length_cm: effectiveUserBody.arm_length_cm,
        inseam_cm: effectiveUserBody.inseam_cm ?? fullScanSnapshot.measurement.inseam_cm,
      };
    }
    return {
      id: 'studio-live-meas',
      user_id: 'current',
      input_id: 'studio',
      chest_circ_cm: effectiveUserBody.chest_cm,
      waist_circ_cm: effectiveUserBody.waist_cm,
      hip_circ_cm: effectiveUserBody.hip_cm,
      shoulder_breadth_cm: effectiveUserBody.shoulder_cm,
      inseam_cm: effectiveUserBody.inseam_cm ?? Math.round(effectiveUserBody.height_cm * 0.45 * 10) / 10,
      arm_length_cm: effectiveUserBody.arm_length_cm,
      bicep_circ_cm: null,
      wrist_circ_cm: null,
      thigh_circ_cm: null,
      calf_circ_cm: null,
      ankle_circ_cm: null,
      extraction_confidence: 0.95,
      created_at: new Date().toISOString(),
    };
  }, [hasBodyProfile, effectiveUserBody, fullScanSnapshot]);

  // 3D Garment Overlay Shell worn directly on top of the 3D Avatar
  const studioGarmentOverlay: GarmentOverlay3D = useMemo(
    () => ({
      visible: wearGarment3D,
      category: currentLook.garment3dType,
      sizeLabel: activeSize,
      chestCm: activeEval.spec.chest,
      waistCm: activeEval.spec.waist,
      hipCm: activeEval.spec.hip,
      bodyChestCm: hasBodyProfile ? effectiveUserBody.chest_cm : 88,
      bodyWaistCm: hasBodyProfile ? effectiveUserBody.waist_cm : 74,
      bodyHipCm: hasBodyProfile ? effectiveUserBody.hip_cm : 92,
      colorHex: currentLook.colorHex,
    }),
    [wearGarment3D, currentLook, activeSize, activeEval.spec, hasBodyProfile, effectiveUserBody]
  );

  const handleToggleGender = (nextG: 'male' | 'female') => {
    setStudioGender(nextG);
    if (onUpdateGender && hasBodyProfile) {
      onUpdateGender(nextG);
    }
    // Auto-switch active outfit to match selected gender cleanly
    const matched = allStudioItems.find(
      (it) =>
        (selectedShop === 'all' || it.shopName === selectedShop) &&
        (it.genderTarget === nextG || it.genderTarget === 'unisex')
    );
    if (matched) setActiveItemKey(matched.key);
    setSelectedSizeOverride(null);
  };

  const handleSelectLook = (itemKey: string) => {
    setSelectedSizeOverride(null);
    if (itemKey === activeItemKey) return;
    setIsWiping(true);
    setActiveItemKey(itemKey);

    const nextHistory = history.slice(0, historyPointer + 1);
    nextHistory.push(itemKey);
    setHistory(nextHistory);
    setHistoryPointer(nextHistory.length - 1);

    setTimeout(() => setIsWiping(false), 800);
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prev = historyPointer - 1;
      setHistoryPointer(prev);
      setActiveItemKey(history[prev]);
      setSelectedSizeOverride(null);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const next = historyPointer + 1;
      setHistoryPointer(next);
      setActiveItemKey(history[next]);
      setSelectedSizeOverride(null);
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
                ? 'Please sign in so FitVision can load your real 3D body profile and try on shop garments in 3D.'
                : 'Vui lòng đăng nhập để đồng bộ vóc dáng 3D cá nhân, vào phòng thử đồ riêng của từng shop và ướm quần áo trực tiếp lên mô hình.'}
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
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">{locale === 'en' ? 'Back' : 'Quay lại'}</span>
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider uppercase text-white truncate">
                  {selectedShop === 'all' ? 'FitVision Studio' : `Phòng Thử · ${selectedShop}`}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/25 text-blue-200 border border-blue-400/40 hidden sm:inline-block">
                  3D Fitting Room
                </span>
              </div>
              <p className="text-[11px] text-stone-300 font-medium truncate hidden md:block">
                {locale === 'en'
                  ? 'Try shop garments directly on your 3D body & inspect ease clearance'
                  : 'Mặc thử đồ thật từ từng Shop lên mô hình 3D Nam/Nữ & kiểm tra độ vừa từng vòng'}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-full border border-white/15 text-xs font-semibold overflow-x-auto scrollbar-none">
            {[
              { id: 'outfits', label: locale === 'en' ? 'SHOP RACK' : 'ĐỒ CỦA SHOP' },
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
          {/* Left Column (lg:col-span-3): Profile, Gender Auto-Switch, 3D Clothes Fit Deltas, Retake */}
          <div className="hidden lg:flex lg:col-span-3 p-4 flex-col justify-between z-10 pointer-events-auto overflow-y-auto gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/75 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3">
              {/* Header + Instant Male/Female Model Switch */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User size={14} className="text-blue-400 shrink-0" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-white truncate">
                    Hồ Sơ Vóc Dáng
                  </span>
                </div>
                <div className="inline-flex p-0.5 rounded-lg bg-white/10 border border-white/15 shrink-0">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleToggleGender(g)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                        studioGender === g ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      {g === 'male' ? 'Nam' : 'Nữ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Core Dimensions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Chiều cao</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {hasBodyProfile ? `${effectiveUserBody.height_cm} cm` : '— cm'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Cân nặng</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {hasBodyProfile ? `${effectiveUserBody.weight_kg} kg` : '— kg'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Vòng ngực</span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {hasBodyProfile ? `${effectiveUserBody.chest_cm} cm` : '— cm'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                  <span className="text-[10px] font-semibold text-stone-300 block">Vòng eo</span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {hasBodyProfile ? `${effectiveUserBody.waist_cm} cm` : '— cm'}
                  </span>
                </div>
              </div>

              {/* Always-Accessible Retake / Edit Measurements Actions */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleSendPhotoTo3DScan}
                  className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <Camera size={12} />
                  <span>{hasBodyProfile ? 'Quét lại 3D' : 'Quét AI 3D'}</span>
                </button>
                {onOpenBiometrics && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBiometrics();
                    }}
                    className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-100 border border-white/15 font-bold text-[11px] cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <Ruler size={12} />
                    <span>{hasBodyProfile ? 'Sửa số đo' : 'Nhập tay'}</span>
                  </button>
                )}
              </div>

              {/* Size Tester + Live 3D Garment Ease Breakdown */}
              {hasBodyProfile && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950/90 to-slate-900/90 border border-blue-400/40 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200 font-bold">Mặc thử Size {activeSize}:</span>
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
                      <span className={`font-mono font-bold ${activeEval.chestDelta < 1.5 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {activeEval.chestDelta >= 0 ? '+' : ''}{activeEval.chestDelta} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Độ dư Eo:</span>
                      <span className={`font-mono font-bold ${activeEval.waistDelta < 1.0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {activeEval.waistDelta >= 0 ? '+' : ''}{activeEval.waistDelta} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Độ dư Hông:</span>
                      <span className={`font-mono font-bold ${activeEval.hipDelta < 1.0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {activeEval.hipDelta >= 0 ? '+' : ''}{activeEval.hipDelta} cm
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-[11px]">
                <span className="font-bold text-stone-200 block mb-0.5">Chất liệu vải ({currentLook.shopName}):</span>
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
                onClick={() => allStudioItems[0] && handleSelectLook(allStudioItems[0].key)}
                className="p-2 rounded-xl text-stone-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                title="Khôi phục mặc định"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Center Column (lg:col-span-5): Interactive 3D Clothes Stage / Clean Cutout Photo / Lookbook */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-between py-3 px-4 overflow-hidden">
            {/* Top Stage Controls: 3D (with Dress Toggle) | Cutout Photo | Lookbook */}
            <div className="relative z-20 flex items-center gap-1.5 flex-wrap justify-center">
              <div className="flex items-center gap-1 p-1 rounded-full bg-stone-950/80 backdrop-blur-xl border border-white/20 shadow-lg">
                <button
                  type="button"
                  onClick={() => setStageMode('avatar3d')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    stageMode === 'avatar3d' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-200 hover:text-white'
                  }`}
                >
                  <Box size={13} />
                  <span>Mô Phỏng 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStageMode('photo')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    stageMode === 'photo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-200 hover:text-white'
                  }`}
                >
                  <Scissors size={13} />
                  <span>Ảnh Cá Nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStageMode('lookbook')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    stageMode === 'lookbook' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-200 hover:text-white'
                  }`}
                >
                  <ImageIcon size={13} />
                  <span>Mẫu Gốc</span>
                </button>
              </div>

              {stageMode === 'avatar3d' && (
                <button
                  type="button"
                  onClick={() => setWearGarment3D((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer shadow-lg ${
                    wearGarment3D
                      ? 'bg-emerald-600/90 border-emerald-400 text-white'
                      : 'bg-stone-950/80 border-white/20 text-stone-300'
                  }`}
                  title="Bật/tắt lớp trang phục 3D ướm trực tiếp lên cơ thể"
                >
                  <Shirt size={13} />
                  <span>{wearGarment3D ? 'Đang mặc đồ 3D' : 'Hiện khung 3D'}</span>
                </button>
              )}
            </div>

            {/* Stage Viewport */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-1.5 min-h-[430px]">
              <div className="absolute bottom-3 w-52 h-8 rounded-full bg-black/70 blur-md pointer-events-none" />

              {stageMode === 'avatar3d' && (
                <div className="relative w-full h-full flex flex-col">
                  <div className="flex-1 relative">
                    <MannequinViewer
                      variant="studio"
                      meshParams={studioMeshParams}
                      measurement={studioMeasurement}
                      garmentOverlay={studioGarmentOverlay}
                      height="100%"
                      autoRotate
                      hideZonePill
                    />
                  </div>
                  {/* Fit ring color legend when wearing 3D clothes */}
                  {wearGarment3D && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1 rounded-full bg-stone-950/75 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-stone-200 z-20 whitespace-nowrap">
                      <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Vừa đẹp</span>
                      <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Rộng êm</span>
                      <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Kích/Chật</span>
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
                          Chọn Ảnh Cá Nhân Đưa Vào Studio
                        </h4>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          Tự động cắt phông nền & cân khung chiều cao nhân vật đứng gọn trong phòng Loft, sau đó quét số đo 3D hoặc xem thử đồ ngay.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
                      >
                        Chọn Ảnh Toàn Thân
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-end pb-3">
                      {/* Top Cutout Controls + 3D Scan Action */}
                      <div className="absolute top-1 inset-x-1 flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/15 text-[11px] z-20">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEnableCutout((v) => !v)}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                              enableCutout ? 'bg-emerald-600 text-white' : 'bg-white/15 text-stone-200'
                            }`}
                          >
                            {enableCutout ? (cutoutResult.engine === 'mediapipe' ? '✓ Tách nền AI' : '✓ Đã tách nền') : 'Ảnh gốc'}
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
                            <span>Quét lấy số đo 3D</span>
                          </button>
                        </div>
                      </div>

                      {/* Scaled Person Cutout Frame Standing Tall inside Studio Loft */}
                      <div className="relative h-[82%] max-h-[540px] flex items-end justify-center select-none w-full">
                        <img
                          src={enableCutout ? cutoutResult.cutoutDataUrl : cutoutResult.originalDataUrl}
                          alt="Personal cutout"
                          className="h-full w-auto object-contain object-bottom drop-shadow-[0_22px_32px_rgba(0,0,0,0.85)] transition-all duration-300 pointer-events-none"
                          style={{
                            filter: isCuttingOut ? 'blur(2px) brightness(0.9)' : 'none',
                          }}
                        />
                      </div>

                      {/* Selected Garment Spec Floating Card Next to Cutout */}
                      <div className="hidden sm:flex items-center gap-2.5 p-2 rounded-2xl bg-stone-950/85 backdrop-blur-xl border border-white/20 shadow-2xl absolute right-2 bottom-3 max-w-[215px] z-20">
                        <img
                          src={currentLook.thumb}
                          alt={currentLook.name}
                          className="w-11 h-14 rounded-xl object-cover shrink-0 border border-white/15"
                        />
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase text-blue-300 block truncate">
                            {currentLook.shopName}
                          </span>
                          <span className="text-[11px] font-extrabold text-white block truncate">
                            {currentLook.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-300 block mt-0.5">
                            {hasBodyProfile ? `Size ${activeSize} · ${activeEval.pct}% hợp dáng` : 'Chưa có số đo'}
                          </span>
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
                    {currentLook.shopName}
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
                <span className="px-2 py-1 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black uppercase tracking-wider">
                  BETA 3D
                </span>

                {currentLook.sourceProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart && currentLook.sourceProduct) {
                        onAddToCart(currentLook.sourceProduct, activeSize);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    <span>{hasBodyProfile ? `Mua Size ${activeSize}` : 'Chọn Mua'}</span>
                  </button>
                ) : (
                  <span
                    className="px-3 py-2 rounded-xl bg-white/10 text-stone-300 border border-white/15 font-bold text-[11px] cursor-default"
                    title="Mẫu trình diễn thử nghiệm 3D (chưa mở bán)"
                  >
                    Mẫu Thử Nghiệm Beta
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (lg:col-span-4): Shop Room Selector + Matching Gender Garments */}
          <div className="lg:col-span-4 p-4 sm:p-5 overflow-y-auto space-y-3.5 z-10 pointer-events-auto">
            {activeTab === 'outfits' && (
              <div className="space-y-3.5">
                {/* Per-Shop Fitting Room Selector */}
                <div className="p-2.5 rounded-2xl bg-stone-950/75 border border-white/15 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                      <Store size={13} className="text-amber-300" />
                      <span>Phòng thử theo Shop</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-300 font-bold">
                      Đồ {studioGender === 'male' ? 'Nam' : 'Nữ'} ({filteredLooks.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    {shopNames.map((shop) => (
                      <button
                        key={shop}
                        type="button"
                        onClick={() => {
                          setSelectedShop(shop);
                          const first = allStudioItems.find(
                            (it) =>
                              (shop === 'all' || it.shopName === shop) &&
                              (it.genderTarget === studioGender || it.genderTarget === 'unisex')
                          );
                          if (first) handleSelectLook(first.key);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          selectedShop === shop
                            ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-xs'
                            : 'bg-white/10 hover:bg-white/20 text-stone-200 border-white/15'
                        }`}
                      >
                        {shop === 'all' ? 'Tất cả Shop' : shop}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'Tất Cả' },
                    { id: 'everyday', label: 'Hàng Ngày' },
                    { id: 'formal', label: 'Công Sở / Vest' },
                    { id: 'athletic', label: 'Thể Thao' },
                    { id: 'party', label: 'Dự Tiệc' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        activeCategory === c.id
                          ? 'bg-white text-stone-950 border-white shadow-md'
                          : 'bg-stone-950/70 hover:bg-stone-900 text-stone-100 border-white/20'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Matching Shop Items Grid */}
                {filteredLooks.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-stone-950/70 border border-white/15 text-center text-xs text-stone-300 space-y-2">
                    <p>Shop này chưa có mẫu {studioGender === 'male' ? 'Nam' : 'Nữ'} thuộc danh mục đang chọn.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory('all');
                        setSelectedShop('all');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
                    >
                      Xem tất cả đồ {studioGender === 'male' ? 'Nam' : 'Nữ'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredLooks.map((look) => {
                      const isSelected = look.key === currentLook.key;
                      const dynFit = lookFits[look.key];
                      return (
                        <div
                          key={look.key}
                          onClick={() => handleSelectLook(look.key)}
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
                            <div className="absolute top-1.5 left-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-stone-200 border border-white/10">
                                {look.shopName}
                              </span>
                            </div>
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
                )}
              </div>
            )}

            {activeTab === 'body' && (
              <div className="p-5 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                  <Ruler size={16} className="text-blue-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Số Đo ISO 8559-1 ({studioGender === 'male' ? 'Nam' : 'Nữ'})
                  </h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Chu vi ngực (Chest):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${effectiveUserBody.chest_cm} cm` : '— cm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Chu vi eo (Waist):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${effectiveUserBody.waist_cm} cm` : '— cm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Chu vi mông (Hip):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${effectiveUserBody.hip_cm} cm` : '— cm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-stone-200 font-medium">Rộng vai (Shoulder):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {hasBodyProfile ? `${effectiveUserBody.shoulder_cm || 43} cm` : '— cm'}
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
                    Tỉ Lệ Vóc Dáng & Phom Mặc
                  </h3>
                </div>
                {hasBodyProfile ? (
                  <div className="space-y-3 text-stone-200 leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-400/30">
                      <span className="font-bold text-purple-200 block mb-1">
                        Tỉ lệ Ngực / Eo: {(effectiveUserBody.chest_cm / Math.max(effectiveUserBody.waist_cm, 1)).toFixed(2)}
                      </span>
                      <span>
                        {effectiveUserBody.chest_cm / Math.max(effectiveUserBody.waist_cm, 1) > 1.2
                          ? 'Phom dáng V-Shape — rất hợp đồ cắt gọn gàng, tôn bờ vai.'
                          : 'Phom dáng cân đối tiêu chuẩn — dễ mặc hầu hết phom Regular / Relaxed.'}
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
                    Quy Trình May Đo Từng Shop
                  </h3>
                </div>
                <p className="text-stone-200 leading-relaxed">
                  Mỗi shop sử dụng bảng thông số riêng (Ngực, Eo, Hông, Độ cử động). Khi thử đồ tại phòng của shop nào, hệ thống đối chiếu trực tiếp kích thước từng sản phẩm của chính shop đó lên mô hình 3D của bạn.
                </p>
                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-400/30 space-y-1">
                  <span className="font-bold text-amber-200 block">Cam Kết Vừa Vặn 100%:</span>
                  <p className="text-[11px] text-stone-200">Hỗ trợ đổi/sửa miễn phí trong 14 ngày nếu không vừa như dự đoán 3D.</p>
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
