import { getAccessToken, setAccessToken, authApi } from './authApi';
import type { StoredFullScanSnapshot } from '@/utils/bodyProfileStorage';

const MEASUREMENTS_API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL
  ? `${import.meta.env.VITE_BACKEND_API_URL}/api/v1/measurements`
  : 'http://localhost:5000/api/v1/measurements';

export interface ApiEnvelope<T = any> {
  success: boolean;
  data: T | null;
  error?: { code: string; message: string } | null;
}

export interface PersistedMeasurementRecord extends StoredFullScanSnapshot {
  id: string;
  userId: string;
  source: 'scan' | 'manual' | 'demo';
}

async function measurementsRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const token = getAccessToken();
  if (!token) {
    return {
      success: false,
      data: null,
      error: { code: 'AUTH_REQUIRED', message: 'Chưa có phiên đăng nhập Backend.' },
    };
  }

  const url = `${MEASUREMENTS_API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    let res = await fetch(url, { ...options, headers, credentials: 'include' });

    if (res.status === 401) {
      const refreshRes = await authApi.refreshToken();
      if (refreshRes.success && refreshRes.data?.accessToken) {
        setAccessToken(refreshRes.data.accessToken);
        headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
        res = await fetch(url, { ...options, headers, credentials: 'include' });
      }
    }

    const json = await res.json();
    return json as ApiEnvelope<T>;
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: err?.message || 'Network error' },
    };
  }
}

export const measurementsApi = {
  async saveSnapshot(payload: {
    biometric: {
      stature_cm: number;
      weight_kg: number;
      gender: 'male' | 'female' | 'neutral';
      calculated_bmi?: number;
    };
    measurement: {
      chest_circ_cm: number;
      waist_circ_cm: number;
      hip_circ_cm: number;
      inseam_cm?: number | null;
      shoulder_breadth_cm?: number | null;
      arm_length_cm?: number | null;
      bicep_circ_cm?: number | null;
      wrist_circ_cm?: number | null;
      thigh_circ_cm?: number | null;
      calf_circ_cm?: number | null;
      ankle_circ_cm?: number | null;
      extraction_confidence?: number | null;
    };
    mesh?: {
      base_gender_mesh: 'male' | 'female' | 'neutral';
      scale_chest: number;
      scale_waist: number;
      scale_hips: number;
      morph_payload?: Record<string, any> | null;
    };
    garmentRec?: Record<string, any> | null;
    source: 'scan' | 'manual' | 'demo';
    isLiveBackend: boolean;
    executionTime: number;
  }): Promise<ApiEnvelope<PersistedMeasurementRecord>> {
    return measurementsRequest<PersistedMeasurementRecord>('/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getLatest(): Promise<ApiEnvelope<PersistedMeasurementRecord | null>> {
    return measurementsRequest<PersistedMeasurementRecord | null>('/latest');
  },

  async getHistory(limit = 20): Promise<ApiEnvelope<PersistedMeasurementRecord[]>> {
    return measurementsRequest<PersistedMeasurementRecord[]>(`/history?limit=${limit}`);
  },

  async deleteRecord(id: string): Promise<ApiEnvelope<{ deleted: boolean; id: string }>> {
    return measurementsRequest<{ deleted: boolean; id: string }>(`/${id}`, {
      method: 'DELETE',
    });
  },
};
