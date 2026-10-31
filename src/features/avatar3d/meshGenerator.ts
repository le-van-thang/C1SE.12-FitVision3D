import * as THREE from 'three';
import type { BodyMeasurements, Gender } from '@/types';

/**
 * Base Mannequin Baseline Constants according to FitVision 3D Specification
 */
export const AVATAR_BASELINES = {
  male: {
    height: 175.0,
    chest: 96.0,
    waist: 82.0,
    hips: 98.0,
  },
  female: {
    height: 162.0,
    chest: 86.0,
    waist: 68.0,
    hips: 92.0,
  },
} as const;

export type RenderMode = 'shaded' | 'wireframe' | 'contour';

/**
 * Creates an authentic tailor's atelier mannequin (calico beige cloth, vermilion pin markers)
 */
export function createMannequinMesh(
  measurements: BodyMeasurements,
  renderMode: RenderMode = 'shaded',
  gender: Gender = 'male'
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FitVisionAtelierMannequin';

  const baseline = gender === 'female' ? AVATAR_BASELINES.female : AVATAR_BASELINES.male;

  // Dynamic Scaling Formula (PART 3)
  const scaleY = measurements.height / baseline.height;
  const scaleChest = measurements.chestGirth / baseline.chest;
  const scaleWaist = measurements.waistGirth / baseline.waist;
  const scaleHip = measurements.hipGirth / baseline.hips;
  const scaleShoulder = measurements.shoulderBreadth / 43.5;

  const isWireframe = renderMode === 'wireframe';

  // Calico beige natural cotton/canvas cloth material
  const material = new THREE.MeshStandardMaterial({
    color: 0xE2D7C3, // Calico beige natural fiber
    roughness: 0.85,
    metalness: 0.05,
    wireframe: isWireframe,
  });

  // Tailor's vermilion pin marker joints
  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0xD8452A, // Vermilion chalk/pin
    roughness: 0.4,
    metalness: 0.3,
    wireframe: isWireframe,
  });

  // Dark walnut wood stand base
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x4A463C,
    roughness: 0.7,
    metalness: 0.1,
  });

  // 1. Head
  const headGeo = new THREE.SphereGeometry(0.11, 24, 24);
  headGeo.scale(0.85, 1.15, 0.95);
  const headMesh = new THREE.Mesh(headGeo, material);
  headMesh.position.y = 1.62 * scaleY;
  group.add(headMesh);

  // 2. Neck
  const neckGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.08, 16);
  const neckMesh = new THREE.Mesh(neckGeo, material);
  neckMesh.position.y = 1.48 * scaleY;
  group.add(neckMesh);

  // 3. Chest / Upper Torso
  const chestGeo = new THREE.CylinderGeometry(
    0.17 * scaleShoulder,
    0.14 * scaleWaist,
    0.28,
    24
  );
  chestGeo.scale(1.2 * scaleChest, 1, 0.8 * scaleChest);
  const chestMesh = new THREE.Mesh(chestGeo, material);
  chestMesh.position.y = 1.30 * scaleY;
  group.add(chestMesh);

  // 4. Waist / Midsection
  const waistGeo = new THREE.CylinderGeometry(
    0.14 * scaleWaist,
    0.15 * scaleWaist,
    0.16,
    24
  );
  waistGeo.scale(1.15 * scaleWaist, 1, 0.75 * scaleWaist);
  const waistMesh = new THREE.Mesh(waistGeo, material);
  waistMesh.position.y = 1.10 * scaleY;
  group.add(waistMesh);

  // 5. Pelvis / Hips
  const hipGeo = new THREE.CylinderGeometry(
    0.15 * scaleWaist,
    0.18 * scaleHip,
    0.20,
    24
  );
  hipGeo.scale(1.2 * scaleHip, 1, 0.82 * scaleHip);
  const hipMesh = new THREE.Mesh(hipGeo, material);
  hipMesh.position.y = 0.94 * scaleY;
  group.add(hipMesh);

  // 6. Shoulders & Arms (A-Pose)
  const armRadius = 0.042;
  const armLen = 0.55 * (measurements.armLength / 60);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.21 * scaleShoulder, 1.40 * scaleY, 0);
  const lShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), pinMaterial);
  leftArmGroup.add(lShoulderJoint);

  const lArmGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.75, armLen, 16);
  const lArmMesh = new THREE.Mesh(lArmGeo, material);
  lArmMesh.position.set(-0.10, -armLen / 2, 0);
  lArmMesh.rotation.z = 0.35; // A-pose
  leftArmGroup.add(lArmMesh);
  group.add(leftArmGroup);

  // Right Arm
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.21 * scaleShoulder, 1.40 * scaleY, 0);
  const rShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), pinMaterial);
  rightArmGroup.add(rShoulderJoint);

  const rArmGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.75, armLen, 16);
  const rArmMesh = new THREE.Mesh(rArmGeo, material);
  rArmMesh.position.set(0.10, -armLen / 2, 0);
  rArmMesh.rotation.z = -0.35; // A-pose
  rightArmGroup.add(rArmMesh);
  group.add(rightArmGroup);

  // 7. Legs
  const legLen = 0.82 * (measurements.insideLegLength / 78);
  const legRadius = 0.065;

  const leftLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(legRadius, legRadius * 0.6, legLen, 16),
    material
  );
  leftLeg.position.set(-0.11 * scaleHip, 0.44 * scaleY, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(legRadius, legRadius * 0.6, legLen, 16),
    material
  );
  rightLeg.position.set(0.11 * scaleHip, 0.44 * scaleY, 0);
  group.add(rightLeg);

  // Contour Slicing Ring Lines (if in Contour mode)
  if (renderMode === 'contour') {
    const contourMaterial = new THREE.LineBasicMaterial({ color: 0x26356B });
    for (let y = 0.4; y < 1.6; y += 0.08) {
      const radius = 0.12 * Math.sin((y / 1.6) * Math.PI) * scaleChest;
      const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.8, 0, Math.PI * 2, false, 0);
      const points = curve.getPoints(36);
      const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
      const line = new THREE.Line(geo, contourMaterial);
      line.position.y = y * scaleY;
      group.add(line);
    }
  }

  // Atelier Wooden Floor Stand Post
  const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 16), woodMaterial);
  standPost.position.y = 0.2;
  group.add(standPost);

  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.03, 24), woodMaterial);
  standBase.position.y = 0.015;
  group.add(standBase);

  return group;
}

/**
 * Creates indicator tape measure bands around Chest, Waist, and Hips
 */
export function createMeasurementRings(
  measurements: BodyMeasurements,
  gender: Gender = 'male'
): THREE.Group {
  const ringGroup = new THREE.Group();
  ringGroup.name = 'MeasurementRings';

  const baseline = gender === 'female' ? AVATAR_BASELINES.female : AVATAR_BASELINES.male;
  const scaleY = measurements.height / baseline.height;
  const scaleChest = measurements.chestGirth / baseline.chest;
  const scaleWaist = measurements.waistGirth / baseline.waist;
  const scaleHip = measurements.hipGirth / baseline.hips;

  // Indigo tailor tape ribbon with vermilion accent line
  const chestTapeMaterial = new THREE.LineBasicMaterial({ color: 0x26356B, linewidth: 2 });
  const waistTapeMaterial = new THREE.LineBasicMaterial({ color: 0xD8452A, linewidth: 2 });
  const hipTapeMaterial = new THREE.LineBasicMaterial({ color: 0x26356B, linewidth: 2 });

  // Chest ring
  const chestCurve = new THREE.EllipseCurve(0, 0, 0.22 * scaleChest, 0.15 * scaleChest, 0, 2 * Math.PI, false, 0);
  const chestPoints = chestCurve.getPoints(50);
  const chestGeo = new THREE.BufferGeometry().setFromPoints(chestPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const chestRing = new THREE.Line(chestGeo, chestTapeMaterial);
  chestRing.position.y = 1.30 * scaleY;
  ringGroup.add(chestRing);

  // Waist ring
  const waistCurve = new THREE.EllipseCurve(0, 0, 0.18 * scaleWaist, 0.12 * scaleWaist, 0, 2 * Math.PI, false, 0);
  const waistPoints = waistCurve.getPoints(50);
  const waistGeo = new THREE.BufferGeometry().setFromPoints(waistPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const waistRing = new THREE.Line(waistGeo, waistTapeMaterial);
  waistRing.position.y = 1.10 * scaleY;
  ringGroup.add(waistRing);

  // Hip ring
  const hipCurve = new THREE.EllipseCurve(0, 0, 0.21 * scaleHip, 0.15 * scaleHip, 0, 2 * Math.PI, false, 0);
  const hipPoints = hipCurve.getPoints(50);
  const hipGeo = new THREE.BufferGeometry().setFromPoints(hipPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const hipRing = new THREE.Line(hipGeo, hipTapeMaterial);
  hipRing.position.y = 0.94 * scaleY;
  ringGroup.add(hipRing);

  return ringGroup;
}
