import type { PoseLandmark2D } from '@/types';

/**
 * Standard 33 MediaPipe Pose Landmarks
 */
export const MEDIAPIPE_POSE_LANDMARKS = [
  'NOSE',
  'LEFT_EYE_INNER',
  'LEFT_EYE',
  'LEFT_EYE_OUTER',
  'RIGHT_EYE_INNER',
  'RIGHT_EYE',
  'RIGHT_EYE_OUTER',
  'LEFT_EAR',
  'RIGHT_EAR',
  'MOUTH_LEFT',
  'MOUTH_RIGHT',
  'LEFT_SHOULDER',
  'RIGHT_SHOULDER',
  'LEFT_ELBOW',
  'RIGHT_ELBOW',
  'LEFT_WRIST',
  'RIGHT_WRIST',
  'LEFT_PINKY',
  'RIGHT_PINKY',
  'LEFT_INDEX',
  'RIGHT_INDEX',
  'LEFT_THUMB',
  'RIGHT_THUMB',
  'LEFT_HIP',
  'RIGHT_HIP',
  'LEFT_KNEE',
  'RIGHT_KNEE',
  'LEFT_ANKLE',
  'RIGHT_ANKLE',
  'LEFT_HEEL',
  'RIGHT_HEEL',
  'LEFT_FOOT_INDEX',
  'RIGHT_FOOT_INDEX',
] as const;

/**
 * Skeleton Connection Pairs for Rendering Pose Topology
 */
export const POSE_CONNECTIONS: [number, number][] = [
  // Shoulders & Chest
  [11, 12],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Torso / Hips
  [11, 23], [12, 24], [23, 24],
  // Left leg
  [23, 25], [25, 27], [27, 29], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [30, 32],
  // Face / Neck
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
];

/**
 * MediaPipe Pose Pipeline Wrapper
 */
export class MediaPipePoseService {
  private isInitialized = false;

  public async initialize(): Promise<boolean> {
    try {
      console.info('[MediaPipe] Initializing BlazePose model...');
      // MediaPipe / TFJS runtime initialization hook
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('[MediaPipe] Failed to load model:', err);
      return false;
    }
  }

  /**
   * Generates sample/simulated 33 landmarks for standard A-pose
   */
  public getSimulatedLandmarks(): PoseLandmark2D[] {
    return [
      { index: 0, name: 'NOSE', x: 0.5, y: 0.15, z: 0, visibility: 0.99 },
      { index: 11, name: 'LEFT_SHOULDER', x: 0.42, y: 0.28, z: 0, visibility: 0.98 },
      { index: 12, name: 'RIGHT_SHOULDER', x: 0.58, y: 0.28, z: 0, visibility: 0.98 },
      { index: 13, name: 'LEFT_ELBOW', x: 0.36, y: 0.42, z: 0, visibility: 0.95 },
      { index: 14, name: 'RIGHT_ELBOW', x: 0.64, y: 0.42, z: 0, visibility: 0.95 },
      { index: 15, name: 'LEFT_WRIST', x: 0.30, y: 0.56, z: 0, visibility: 0.96 },
      { index: 16, name: 'RIGHT_WRIST', x: 0.70, y: 0.56, z: 0, visibility: 0.96 },
      { index: 23, name: 'LEFT_HIP', x: 0.45, y: 0.52, z: 0, visibility: 0.97 },
      { index: 24, name: 'RIGHT_HIP', x: 0.55, y: 0.52, z: 0, visibility: 0.97 },
      { index: 25, name: 'LEFT_KNEE', x: 0.44, y: 0.72, z: 0, visibility: 0.98 },
      { index: 26, name: 'RIGHT_KNEE', x: 0.56, y: 0.72, z: 0, visibility: 0.98 },
      { index: 27, name: 'LEFT_ANKLE', x: 0.43, y: 0.92, z: 0, visibility: 0.95 },
      { index: 28, name: 'RIGHT_ANKLE', x: 0.57, y: 0.92, z: 0, visibility: 0.95 },
    ];
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const mediaPipeService = new MediaPipePoseService();
