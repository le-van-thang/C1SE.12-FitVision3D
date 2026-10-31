// ============================================================
// FITVISION 3D - FITTING TYPES
// Derived strictly from the database schema (recommendations)
// ============================================================
import type { Recommendation } from './database.types';

// recommendations.fit_type
export type FitType = Recommendation['fit_type'];

export const FIT_TYPE_LABELS: Record<FitType, string> = {
  slim: 'Slim',
  regular: 'Regular',
  relaxed: 'Relaxed',
  oversized: 'Oversized',
};
