import { createClient } from '@supabase/supabase-js';
import type { BodyMeasurements, UserProfile } from '@/types';

// Retrieve Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate credentials configuration
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder-project.supabase.co' &&
  !supabaseUrl.includes('your-project-id')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[FitVision 3D] Supabase credentials are not fully configured yet. Running in offline/mock mode. ' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Initialize Supabase Client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * FitVision 3D Measurement Service API
 */
export const measurementService = {
  /**
   * Save body measurement records to Supabase 'measurements' table
   */
  async saveMeasurements(measurements: BodyMeasurements): Promise<{ data: BodyMeasurements | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      console.info('[Mock Service] Storing measurements locally (demo mode):', measurements);
      return { data: measurements, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('measurements')
        .insert([
          {
            user_id: measurements.userId,
            height: measurements.height,
            chest_girth: measurements.chestGirth,
            waist_girth: measurements.waistGirth,
            hip_girth: measurements.hipGirth,
            shoulder_breadth: measurements.shoulderBreadth,
            arm_length: measurements.armLength,
            inside_leg_length: measurements.insideLegLength,
            confidence_score: measurements.confidenceScore,
            unit: measurements.unit,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to save measurements');
      console.error('[Supabase Error] saveMeasurements:', error.message);
      return { data: null, error };
    }
  },

  /**
   * Fetch recent measurements history for a user
   */
  async getLatestMeasurements(userId: string): Promise<{ data: BodyMeasurements | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      // Mocked default ISO 8559 measurement for initial preview
      return {
        data: {
          height: 172.5,
          chestGirth: 94.0,
          waistGirth: 78.5,
          hipGirth: 96.0,
          shoulderBreadth: 43.5,
          armLength: 61.0,
          insideLegLength: 79.5,
          unit: 'cm',
          confidenceScore: 0.94,
        },
        error: null,
      };
    }

    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to fetch measurements');
      return { data: null, error };
    }
  },
};

/**
 * User Profile Service
 */
export const profileService = {
  async getProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: userId || 'demo-user-01',
          email: 'demo@fitvision3d.vn',
          fullName: 'Demo User (FitVision 3D)',
          gender: 'male',
          preferredUnit: 'cm',
          createdAt: new Date().toISOString(),
        },
        error: null,
      };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile');
      return { data: null, error };
    }
  },
};
