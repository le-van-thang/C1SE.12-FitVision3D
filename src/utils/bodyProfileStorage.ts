import type { BiometricInput, Measurement, MeshParameter } from '@/types/database.types';
import type { AiMeasurementResponse } from '@/services/aiService';
import type { UserBodyProfile } from '@/features/ecommerce/types';

export const BODY_PROFILE_UPDATED_EVENT = 'fv3d-body-profile-updated';

export interface StoredFullScanSnapshot {
  measurement: Measurement;
  biometric: BiometricInput;
  mesh: MeshParameter;
  garmentRec: AiMeasurementResponse['garment_size_recommendations'];
  isLiveBackend: boolean;
  executionTime: number;
  updatedAt: string;
}

const getBodyKey = (userId?: string | null) =>
  `fv3d_user_body_${userId || 'guest'}`;

const getScanKey = (userId?: string | null) =>
  `fv3d_full_scan_${userId || 'guest'}`;

export function loadUserBodyProfile(userId?: string | null): UserBodyProfile | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getBodyKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.height_cm === 'number' && typeof parsed.chest_cm === 'number') {
      return parsed as UserBodyProfile;
    }
  } catch {
    // ignore storage parse failures
  }
  return null;
}

export function saveUserBodyProfile(
  userId: string | null | undefined,
  profile: UserBodyProfile
): void {
  if (!userId) return;
  try {
    const normalized: UserBodyProfile = {
      ...profile,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(getBodyKey(userId), JSON.stringify(normalized));
    sessionStorage.setItem(
      'fv3d_estimator',
      JSON.stringify({
        stature_cm: normalized.height_cm,
        weight_kg: normalized.weight_kg,
        gender: normalized.gender,
      })
    );
    window.dispatchEvent(new Event(BODY_PROFILE_UPDATED_EVENT));
  } catch {
    // ignore quota errors
  }
}

export function loadFullScanSnapshot(userId?: string | null): StoredFullScanSnapshot | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getScanKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.measurement && parsed?.biometric && parsed?.mesh) {
      return parsed as StoredFullScanSnapshot;
    }
  } catch {
    // ignore storage parse failures
  }
  return null;
}

export function saveFullScanSnapshot(
  userId: string | null | undefined,
  snapshot: Omit<StoredFullScanSnapshot, 'updatedAt'>,
  source: 'scan' | 'demo' = 'scan'
): void {
  if (!userId) return;
  const updatedAt = new Date().toISOString();

  try {
    const fullPayload: StoredFullScanSnapshot = {
      ...snapshot,
      updatedAt,
    };
    localStorage.setItem(getScanKey(userId), JSON.stringify(fullPayload));
  } catch {
    // ignore quota errors
  }

  const bodyProfile: UserBodyProfile = {
    height_cm: Math.round(snapshot.biometric.stature_cm * 10) / 10,
    weight_kg: Math.round(snapshot.biometric.weight_kg * 10) / 10,
    chest_cm: Math.round(snapshot.measurement.chest_circ_cm * 10) / 10,
    waist_cm: Math.round(snapshot.measurement.waist_circ_cm * 10) / 10,
    hip_cm: Math.round(snapshot.measurement.hip_circ_cm * 10) / 10,
    shoulder_cm: Math.round((snapshot.measurement.shoulder_breadth_cm ?? 42) * 10) / 10,
    arm_length_cm: Math.round((snapshot.measurement.arm_length_cm ?? 58) * 10) / 10,
    inseam_cm: snapshot.measurement.inseam_cm
      ? Math.round(snapshot.measurement.inseam_cm * 10) / 10
      : undefined,
    gender:
      snapshot.biometric.gender === 'female'
        ? 'female'
        : snapshot.biometric.gender === 'male'
        ? 'male'
        : 'neutral',
    source,
    updated_at: updatedAt,
  };

  saveUserBodyProfile(userId, bodyProfile);
}

export function clearFullScanSnapshot(userId?: string | null): void {
  if (!userId) return;
  try {
    localStorage.removeItem(getScanKey(userId));
  } catch {
    // ignore
  }
}

let pendingStudioPhoto: { dataUrl: string; name: string } | null = null;
let studioCutoutCache: {
  cutoutDataUrl: string;
  originalDataUrl: string;
  foregroundRatio: number;
  width: number;
  height: number;
  fileName: string;
} | null = null;

/** Passes a user-uploaded photo transiently from Virtual Studio into Dashboard AI Scan (in-memory only). */
export function setPendingStudioPhoto(dataUrl: string, name = 'studio-photo.jpg'): void {
  pendingStudioPhoto = { dataUrl, name };
}

export function consumePendingStudioPhoto(): { dataUrl: string; name: string } | null {
  const item = pendingStudioPhoto;
  pendingStudioPhoto = null;
  return item;
}

export function setStudioCutoutCache(
  val: {
    cutoutDataUrl: string;
    originalDataUrl: string;
    foregroundRatio: number;
    width: number;
    height: number;
    fileName: string;
  } | null
): void {
  studioCutoutCache = val;
}

export function getStudioCutoutCache() {
  return studioCutoutCache;
}
