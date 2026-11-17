import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface HumanBodyParams {
  gender?: 'male' | 'female';
  scale_chest?: number;
  scale_waist?: number;
  scale_hips?: number;
}

export interface AnatomicalLandmarks {
  chest: THREE.Vector3;
  waist: THREE.Vector3;
  hips: THREE.Vector3;
  shoulders: THREE.Vector3;
  inseam: THREE.Vector3;
  arm_length: THREE.Vector3;
  bicep: THREE.Vector3;
  wrist: THREE.Vector3;
  thigh: THREE.Vector3;
  calf: THREE.Vector3;
  ankle: THREE.Vector3;
}

export interface ZozofitMaterialOptions {
  zUp?: boolean;
  coordScale?: number;
  density?: number;
  gridColor?: string;
  rimColor?: string;
}

/**
 * ZOZOFIT Quad-Grid Shader compatible with both THREE.SkinnedMesh and static THREE.Mesh
 * Renders crisp horizontal contour rings + vertical anatomical grid over a matte obsidian core.
 */
export function createSkinnedZozofitMaterial(
  opts: ZozofitMaterialOptions = {}
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGridColor: { value: new THREE.Color(opts.gridColor || '#7dd3fc') },
      uCoreColor: { value: new THREE.Color('#050d14') },
      uRimColor: { value: new THREE.Color(opts.rimColor || '#38bdf8') },
      uDensity: { value: opts.density ?? 46.0 },
      uCoordScale: { value: opts.coordScale ?? 1.0 },
      uZUp: { value: opts.zUp ? 1.0 : 0.0 },
    },
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>

      varying vec3 vObjPos;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        #include <skinbase_vertex>
        #include <beginnormal_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>

        #include <begin_vertex>
        #include <skinning_vertex>

        vObjPos = position;

        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        vNormalView = normalize(normalMatrix * objectNormal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uGridColor;
      uniform vec3 uCoreColor;
      uniform vec3 uRimColor;
      uniform float uDensity;
      uniform float uCoordScale;
      uniform float uZUp;

      varying vec3 vObjPos;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      float gridLine(float coord, float width) {
        float fw = max(fwidth(coord), 0.0001);
        float dist = abs(fract(coord - 0.5) - 0.5) / fw;
        return 1.0 - smoothstep(0.0, width, dist);
      }

      void main() {
        vec3 basePos = uZUp > 0.5
          ? vec3(vObjPos.x, vObjPos.z, -vObjPos.y)
          : vObjPos;
        vec3 p = basePos * uCoordScale;

        // Horizontal contour rings along body height (Y) + vertical triplanar lines
        float gy = gridLine(p.y * uDensity, 1.3);
        float gx = gridLine(p.x * uDensity, 1.3);
        float gz = gridLine(p.z * uDensity, 1.3);

        vec3 n = normalize(vNormalView);
        float gv = mix(gx, gz, abs(n.x));
        float quad = max(gy, gv);

        float fresnel = pow(1.0 - abs(dot(n, normalize(vViewDir))), 2.1);

        vec3 col = uCoreColor;
        col = mix(col, uRimColor, fresnel * 0.48);
        col = mix(col, uGridColor, quad * (0.42 + 0.58 * fresnel));

        gl_FragColor = vec4(col, 0.98);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
}

function clampScale(val: number | undefined): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? val : 1.0;
  return Math.min(1.38, Math.max(0.78, n));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Normalizes a static Z-Up female base mesh into upright Y-Up 1.72m centered coordinates,
 * and applies smooth Anatomical Gaussian Radial Torso Deformation for chest, waist, and hips
 * while isolating the arms so extremities never warp.
 */
/**
 * Samples the exact outermost X vertex on a built measurement ring (`ring_chest`, `ring_waist`, `ring_hips`)
 * so callout dots always sit locked directly onto the visible 3D ring regardless of body scale.
 */
function sampleRingAnchor(
  rings: THREE.Mesh[],
  bandKey: 'chest' | 'waist' | 'hips',
  pick: 'minX' | 'maxX',
  fallback: THREE.Vector3
): THREE.Vector3 {
  const ring = rings.find((r) => r.name === `ring_${bandKey}`);
  const pos = ring?.geometry?.attributes?.position as THREE.BufferAttribute | undefined;
  if (!pos || pos.count === 0) return fallback;

  let best: THREE.Vector3 | null = null;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (pick === 'minX') {
      if (!best || x < best.x) best = new THREE.Vector3(x, y, z);
    } else {
      if (!best || x > best.x) best = new THREE.Vector3(x, y, z);
    }
  }
  return best ?? fallback;
}

/**
 * Extracts exact 3D landmarks from deformed female geometry vertices & rings.
 */
function extractFemaleGeometryLandmarks(
  geometries: THREE.BufferGeometry[],
  rings: THREE.Mesh[],
  sChest: number,
  sWaist: number,
  sHips: number
): AnatomicalLandmarks {
  const sampleBox = (
    yLo: number,
    yHi: number,
    xLo: number,
    xHi: number,
    mode: 'avg' | 'minX' | 'maxX',
    fallback: THREE.Vector3
  ): THREE.Vector3 => {
    let sx = 0, sy = 0, sz = 0, n = 0;
    let bestPt: THREE.Vector3 | null = null;
    for (const geo of geometries) {
      const pos = geo.attributes.position as THREE.BufferAttribute | undefined;
      if (!pos) continue;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        if (y >= yLo && y <= yHi && x >= xLo && x <= xHi) {
          if (mode === 'minX') {
            if (!bestPt || x < bestPt.x) bestPt = new THREE.Vector3(x, y, z);
          } else if (mode === 'maxX') {
            if (!bestPt || x > bestPt.x) bestPt = new THREE.Vector3(x, y, z);
          } else {
            sx += x; sy += y; sz += z; n++;
          }
        }
      }
    }
    if (bestPt) return bestPt;
    return n > 0 ? new THREE.Vector3(sx / n, sy / n, sz / n) : fallback;
  };

  const hipMaxSpan = Math.max(1, sHips);
  const chestMaxSpan = Math.max(1, sChest);

  return {
    chest: sampleRingAnchor(
      rings,
      'chest',
      'minX',
      sampleBox(0.40, 0.44, -0.26 * chestMaxSpan, -0.06, 'minX', new THREE.Vector3(-0.145 * sChest, 0.42, 0.0))
    ),
    waist: sampleRingAnchor(
      rings,
      'waist',
      'minX',
      sampleBox(0.24, 0.28, -0.22 * Math.max(1, sWaist), -0.05, 'minX', new THREE.Vector3(-0.118 * sWaist, 0.26, 0.0))
    ),
    hips: sampleRingAnchor(
      rings,
      'hips',
      'maxX',
      sampleBox(0.00, 0.04, 0.07, 0.28 * hipMaxSpan, 'maxX', new THREE.Vector3(0.172 * sHips, 0.02, -0.04))
    ),
    shoulders: sampleBox(0.51, 0.58, 0.14 * Math.min(1, sChest), 0.22 * chestMaxSpan, 'avg', new THREE.Vector3(0.175 * sChest, 0.54, 0.0)),
    bicep: sampleBox(0.49, 0.59, -0.36, -0.26, 'avg', new THREE.Vector3(-0.31, 0.54, -0.05)),
    wrist: sampleBox(0.49, 0.59, -0.62, -0.55, 'avg', new THREE.Vector3(-0.585, 0.537, 0.03)),
    arm_length: sampleBox(0.49, 0.59, 0.49, 0.58, 'avg', new THREE.Vector3(0.535, 0.536, 0.0)),
    inseam: sampleBox(-0.39, -0.31, -0.15 * hipMaxSpan, -0.01, 'maxX', new THREE.Vector3(-0.045, -0.35, -0.04)),
    thigh: sampleBox(-0.22, -0.14, 0.02, 0.19 * hipMaxSpan, 'avg', new THREE.Vector3(0.095 * sHips, -0.18, -0.038)),
    calf: sampleBox(-0.55, -0.47, 0.03, 0.17 * Math.max(1, Math.sqrt(hipMaxSpan)), 'avg', new THREE.Vector3(0.097, -0.51, -0.068)),
    ankle: sampleBox(-0.77, -0.71, 0.04, 0.14, 'avg', new THREE.Vector3(0.084, -0.74, -0.049)),
  };
}

function extractMaleBoneLandmarks(
  root: THREE.Group,
  model: THREE.Object3D,
  rings: THREE.Mesh[],
  sChest: number,
  sWaist: number,
  sHips: number
): AnatomicalLandmarks {
  root.updateMatrixWorld(true);
  const byKey: Record<string, THREE.Vector3> = {};
  model.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      const n = obj.name.toLowerCase();
      const wp = new THREE.Vector3();
      obj.getWorldPosition(wp);
      if (n.includes('upperarm_')) byKey[n.includes('_r') ? 'upperarm_r' : 'upperarm_l'] = wp;
      else if (n.includes('lowerarm_')) byKey[n.includes('_r') ? 'lowerarm_r' : 'lowerarm_l'] = wp;
      else if (n.includes('hand_')) byKey[n.includes('_r') ? 'hand_r' : 'hand_l'] = wp;
      else if (n.includes('thigh_') && !n.includes('twist')) byKey[n.includes('_r') ? 'thigh_r' : 'thigh_l'] = wp;
      else if (n.includes('calf_') && !n.includes('twist')) byKey[n.includes('_r') ? 'calf_r' : 'calf_l'] = wp;
      else if (n.includes('foot_')) byKey[n.includes('_r') ? 'foot_r' : 'foot_l'] = wp;
    }
  });

  // Identify screen-left (-X) vs screen-right (+X) bones dynamically
  const upperL = byKey.upperarm_l && byKey.upperarm_r
    ? (byKey.upperarm_r.x < byKey.upperarm_l.x ? byKey.upperarm_r : byKey.upperarm_l)
    : new THREE.Vector3(-0.18 * sChest, 0.49, 0.0);
  const upperR = byKey.upperarm_l && byKey.upperarm_r
    ? (byKey.upperarm_r.x > byKey.upperarm_l.x ? byKey.upperarm_r : byKey.upperarm_l)
    : new THREE.Vector3(0.18 * sChest, 0.49, 0.0);
  const lowerL = byKey.lowerarm_l && byKey.lowerarm_r
    ? (byKey.lowerarm_r.x < byKey.lowerarm_l.x ? byKey.lowerarm_r : byKey.lowerarm_l)
    : new THREE.Vector3(-0.40, 0.36, 0.0);
  const lowerR = byKey.lowerarm_l && byKey.lowerarm_r
    ? (byKey.lowerarm_r.x > byKey.lowerarm_l.x ? byKey.lowerarm_r : byKey.lowerarm_l)
    : new THREE.Vector3(0.40, 0.36, 0.0);
  const handL = byKey.hand_l && byKey.hand_r
    ? (byKey.hand_r.x < byKey.hand_l.x ? byKey.hand_r : byKey.hand_l)
    : new THREE.Vector3(-0.62, 0.22, 0.02);
  const handR = byKey.hand_l && byKey.hand_r
    ? (byKey.hand_r.x > byKey.hand_l.x ? byKey.hand_r : byKey.hand_l)
    : new THREE.Vector3(0.62, 0.22, 0.02);

  const thighL = byKey.thigh_l && byKey.thigh_r
    ? (byKey.thigh_r.x < byKey.thigh_l.x ? byKey.thigh_r : byKey.thigh_l)
    : new THREE.Vector3(-0.10, -0.02, 0.02);
  const thighR = byKey.thigh_l && byKey.thigh_r
    ? (byKey.thigh_r.x > byKey.thigh_l.x ? byKey.thigh_r : byKey.thigh_l)
    : new THREE.Vector3(0.10, -0.02, 0.02);
  const calfL = byKey.calf_l && byKey.calf_r
    ? (byKey.calf_r.x < byKey.calf_l.x ? byKey.calf_r : byKey.calf_l)
    : new THREE.Vector3(-0.11, -0.38, 0.0);
  const calfR = byKey.calf_l && byKey.calf_r
    ? (byKey.calf_r.x > byKey.calf_l.x ? byKey.calf_r : byKey.calf_l)
    : new THREE.Vector3(0.11, -0.38, 0.0);
  const footL = byKey.foot_l && byKey.foot_r
    ? (byKey.foot_r.x < byKey.foot_l.x ? byKey.foot_r : byKey.foot_l)
    : new THREE.Vector3(-0.13, -0.78, 0.0);
  const footR = byKey.foot_l && byKey.foot_r
    ? (byKey.foot_r.x > byKey.foot_l.x ? byKey.foot_r : byKey.foot_l)
    : new THREE.Vector3(0.13, -0.78, 0.0);

  const inseamMid = new THREE.Vector3().lerpVectors(thighL, footL, 0.42);
  inseamMid.x += 0.042; // Nudge to medial/inner surface of left leg

  const thighPt = new THREE.Vector3().lerpVectors(thighR, calfR, 0.36);
  thighPt.x += 0.022 * sHips;

  const calfPt = new THREE.Vector3().lerpVectors(calfR, footR, 0.35);
  calfPt.x += 0.016 * Math.sqrt(sHips);

  return {
    chest: sampleRingAnchor(rings, 'chest', 'minX', new THREE.Vector3(-0.145 * sChest, 0.42, 0.02)),
    waist: sampleRingAnchor(rings, 'waist', 'minX', new THREE.Vector3(-0.118 * sWaist, 0.25, 0.035)),
    hips: sampleRingAnchor(rings, 'hips', 'maxX', new THREE.Vector3(0.152 * sHips, 0.02, 0.038)),
    shoulders: upperR.clone().add(new THREE.Vector3(0.015 * sChest, 0.018, 0)),
    bicep: new THREE.Vector3().lerpVectors(upperL, lowerL, 0.48),
    wrist: handL.clone(),
    arm_length: new THREE.Vector3().lerpVectors(lowerR, handR, 0.65),
    inseam: inseamMid,
    thigh: thighPt,
    calf: calfPt,
    ankle: footR.clone(),
  };
}

function normalizeAndDeformFemaleGeometry(
  geo: THREE.BufferGeometry,
  sChest: number,
  sWaist: number,
  sHips: number
): void {
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    const preSize = new THREE.Vector3();
    geo.boundingBox.getSize(preSize);
    // Only rotate if raw geometry is still lying along Z axis
    if (preSize.z > preSize.y * 1.15) {
      geo.rotateX(-Math.PI / 2);
    }
  }
  // Face front (+Z toward camera) instead of showing the back
  geo.rotateY(Math.PI);
  geo.computeBoundingBox();

  const box = geo.boundingBox;
  if (!box) return;

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const uniformScale = 1.72 / (size.y || 1);
  const posAttr = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < posAttr.count; i++) {
    let x = (posAttr.getX(i) - center.x) * uniformScale;
    const y = (posAttr.getY(i) - center.y) * uniformScale;
    let z = (posAttr.getZ(i) - center.z) * uniformScale;

    // Gaussian radial deformation bands calibrated to female torso proportions
    const wHips = Math.exp(-Math.pow((y - 0.02) / 0.12, 2) * 0.5);
    const wWaist = Math.exp(-Math.pow((y - 0.26) / 0.085, 2) * 0.5);
    const wChest = Math.exp(-Math.pow((y - 0.42) / 0.09, 2) * 0.5);

    const torsoFactor =
      1.0 +
      (sHips - 1.0) * wHips +
      (sWaist - 1.0) * wWaist +
      (sChest - 1.0) * wChest;

    // Mask arms laterally so only trunk expands/contracts
    const armMask = 1.0 - smoothstep(0.155, 0.215, Math.abs(x));
    const scaleXZ = 1.0 + (torsoFactor - 1.0) * armMask;

    const zCenter = -0.035;
    x *= scaleXZ;
    z = zCenter + (z - zCenter) * scaleXZ;

    posAttr.setXYZ(i, x, y, z);
  }

  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
}

function buildConformalFemaleRings(
  geometries: THREE.BufferGeometry[],
  activeZone: string
): THREE.Mesh[] {
  const bands = [
    { key: 'chest', y: 0.42, halfHeight: 0.032, maxAbsX: 0.25 },
    { key: 'waist', y: 0.26, halfHeight: 0.028, maxAbsX: 0.22 },
    { key: 'hips', y: 0.02, halfHeight: 0.032, maxAbsX: 0.26 },
  ];
  const SECTORS = 64;
  const CLEARANCE_M = 0.011;

  return bands.map((band) => {
    const isActive = activeZone === band.key;
    const ptsXZ: { x: number; z: number }[] = [];

    for (const geo of geometries) {
      const pos = geo.attributes.position as THREE.BufferAttribute | undefined;
      if (!pos) continue;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        if (Math.abs(y - band.y) <= band.halfHeight && Math.abs(x) <= band.maxAbsX) {
          ptsXZ.push({ x, z: pos.getZ(i) });
        }
      }
    }

    let pts: THREE.Vector3[] = [];
    if (ptsXZ.length >= 16) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const p of ptsXZ) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;

      const sectorMax = new Array<number>(SECTORS).fill(0);
      for (const p of ptsXZ) {
        const dx = p.x - cx;
        const dz = p.z - cz;
        const r = Math.hypot(dx, dz);
        let angle = Math.atan2(dz, dx);
        if (angle < 0) angle += Math.PI * 2;
        const idx = Math.min(SECTORS - 1, Math.floor((angle / (Math.PI * 2)) * SECTORS));
        if (r > sectorMax[idx]) sectorMax[idx] = r;
      }

      // Fill any empty angular sector using nearest populated neighbors
      const filled = [...sectorMax];
      for (let i = 0; i < SECTORS; i++) {
        if (filled[i] > 0) continue;
        for (let step = 1; step < SECTORS / 2; step++) {
          const prev = sectorMax[(i - step + SECTORS) % SECTORS];
          const next = sectorMax[(i + step) % SECTORS];
          if (prev > 0 || next > 0) {
            filled[i] = prev > 0 && next > 0 ? (prev + next) / 2 : prev || next;
            break;
          }
        }
      }

      // Smooth while preserving strict >= max outer surface clearance so ring never clips inside torso
      const smoothed = filled.map((_, i) => {
        const prev = filled[(i - 1 + SECTORS) % SECTORS];
        const curr = filled[i];
        const next = filled[(i + 1) % SECTORS];
        return Math.max(curr, prev * 0.22 + curr * 0.56 + next * 0.22) + CLEARANCE_M;
      });

      pts = smoothed.map((r, i) => {
        const theta = ((i + 0.5) / SECTORS) * Math.PI * 2;
        return new THREE.Vector3(cx + Math.cos(theta) * r, band.y, cz + Math.sin(theta) * r);
      });
    } else {
      for (let i = 0; i < SECTORS; i++) {
        const theta = (i / SECTORS) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * 0.16, band.y, Math.sin(theta) * 0.12));
      }
    }

    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, isActive ? 0.0085 : 0.0032, 12, true);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: isActive ? 0xa3e635 : 0x38bdf8,
      transparent: true,
      opacity: isActive ? 0.98 : 0.45,
    });
    const ringMesh = new THREE.Mesh(tubeGeo, tubeMat);
    ringMesh.name = `ring_${band.key}`;
    return ringMesh;
  });
}

function buildMeasurementRings(
  isFemale: boolean,
  sChest: number,
  sWaist: number,
  sHips: number,
  activeZone: string
): THREE.Mesh[] {
  const ringConfigs = isFemale
    ? [
        { key: 'chest', y: 0.42, rx: 0.145 * sChest, rz: 0.118 * sChest, zOffset: -0.037 },
        { key: 'waist', y: 0.26, rx: 0.120 * sWaist, rz: 0.084 * sWaist, zOffset: -0.015 },
        { key: 'hips', y: 0.02, rx: 0.174 * sHips, rz: 0.105 * sHips, zOffset: -0.056 },
      ]
    : [
        { key: 'chest', y: 0.42, rx: 0.145 * sChest, rz: 0.112 * sChest, zOffset: 0.020 },
        { key: 'waist', y: 0.25, rx: 0.118 * sWaist, rz: 0.090 * sWaist, zOffset: 0.035 },
        { key: 'hips', y: 0.02, rx: 0.152 * sHips, rz: 0.085 * sHips, zOffset: 0.038 },
      ];

  return ringConfigs.map((rc) => {
    const isActive = activeZone === rc.key;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(theta) * rc.rx,
          rc.y,
          Math.sin(theta) * rc.rz + rc.zOffset
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, isActive ? 0.0085 : 0.0032, 12, true);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: isActive ? 0xa3e635 : isFemale ? 0x38bdf8 : 0x38bdf8,
      transparent: true,
      opacity: isActive ? 0.98 : 0.45,
    });
    const ringMesh = new THREE.Mesh(tubeGeo, tubeMat);
    ringMesh.name = `ring_${rc.key}`;
    return ringMesh;
  });
}

function finalizeFallbackXbot(
  model: THREE.Group,
  sChest: number,
  sWaist: number,
  sHips: number,
  activeZone: string,
  onLoaded: (group: THREE.Group) => void
) {
  const root = new THREE.Group();
  const zozofitMat = createSkinnedZozofitMaterial({ coordScale: 0.01, density: 52.0 });

  model.traverse((child) => {
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      const skinned = child as THREE.SkinnedMesh;
      if (skinned.name === 'Beta_Joints') {
        skinned.visible = false;
      } else {
        skinned.material = zozofitMat;
      }
      skinned.skeleton.pose();
      skinned.frustumCulled = false;
    } else if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = zozofitMat;
    }
  });

  model.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      const bone = child as THREE.Bone;
      const n = bone.name.toLowerCase();
      if (n.endsWith('leftarm')) bone.rotation.set(0, 0, -0.62);
      if (n.endsWith('rightarm')) bone.rotation.set(0, 0, 0.62);
      if (n.endsWith('spine') || n.endsWith('spine1')) bone.scale.set(sWaist, 1, sWaist);
      else if (n.endsWith('spine2')) bone.scale.set(sChest, 1, sChest);
      else if (n.endsWith('hips')) bone.scale.set(sHips, 1, sHips);
    }
  });

  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  model.scale.multiplyScalar(1.72 / (size.y || 1));
  model.updateMatrixWorld(true);
  const center = new THREE.Vector3();
  new THREE.Box3().setFromObject(model).getCenter(center);
  model.position.sub(center);

  root.add(model);
  buildMeasurementRings(false, sChest, sWaist, sHips, activeZone).forEach((r) => root.add(r));
  onLoaded(root);
}

/**
 * Loads anatomical 3D body mesh tailored to gender:
 * - Female: `/models/female_base_mesh.glb` (18.6k smooth vertices) + Gaussian radial deformation
 * - Male / Neutral: `/models/male_base_mesh.glb` (anatomical A-Pose with spine/pelvis skeletal scaling)
 * Automatically falls back to `/Xbot.glb` if a model fails to load.
 */
export function loadRealHumanModel(
  params: HumanBodyParams,
  activeZone:
    | 'chest'
    | 'waist'
    | 'hips'
    | 'shoulders'
    | 'inseam'
    | 'arm_length'
    | 'bicep'
    | 'wrist'
    | 'thigh'
    | 'calf'
    | 'ankle'
    | string = 'waist',
  onLoaded: (group: THREE.Group) => void
): void {
  const loader = new GLTFLoader();
  const isFemale = params.gender === 'female';
  const sChest = clampScale(params.scale_chest);
  const sWaist = clampScale(params.scale_waist);
  const sHips = clampScale(params.scale_hips);

  const modelUrl = isFemale ? '/models/female_base_mesh.glb' : '/models/male_base_mesh.glb';

  loader.load(
    modelUrl,
    (gltf) => {
      const root = new THREE.Group();
      const model = gltf.scene;

      if (isFemale) {
        const femaleMat = createSkinnedZozofitMaterial({
          zUp: false,
          coordScale: 1.0,
          density: 46.0,
          gridColor: '#93c5fd',
          rimColor: '#38bdf8',
        });

        const deformedGeometries: THREE.BufferGeometry[] = [];
        model.updateMatrixWorld(true);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry = mesh.geometry.clone();
            // Bake GLB parent node transform (e.g. Sketchfab_model Z-Up -> Y-Up) once into vertices
            mesh.geometry.applyMatrix4(mesh.matrixWorld);
            normalizeAndDeformFemaleGeometry(mesh.geometry, sChest, sWaist, sHips);
            deformedGeometries.push(mesh.geometry);
            mesh.material = femaleMat;
            mesh.frustumCulled = false;
          }
        });

        // Reset node transforms after baking matrixWorld so model isn't rotated twice
        model.traverse((node) => {
          node.position.set(0, 0, 0);
          node.rotation.set(0, 0, 0);
          node.scale.set(1, 1, 1);
          node.updateMatrix();
        });

        root.add(model);
        const femaleRings = buildConformalFemaleRings(deformedGeometries, activeZone);
        femaleRings.forEach((r) => root.add(r));
        root.userData.landmarks = extractFemaleGeometryLandmarks(
          deformedGeometries,
          femaleRings,
          sChest,
          sWaist,
          sHips
        );
        onLoaded(root);
        return;
      }

      // Male / Neutral: anatomical A-pose skeletal mesh (Z-Up raw geometry -> Y-Up wrapper)
      const maleMat = createSkinnedZozofitMaterial({
        zUp: true,
        coordScale: 1.0,
        density: 46.0,
      });

      model.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          const skinned = child as THREE.SkinnedMesh;
          skinned.material = maleMat;
          skinned.skeleton.pose();
          skinned.frustumCulled = false;
        } else if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = maleMat;
        }
      });

      // Apply girth scaling along spine01/02/03 & pelvis
      model.traverse((child) => {
        if ((child as THREE.Bone).isBone) {
          const bone = child as THREE.Bone;
          const n = bone.name.toLowerCase();
          if (n.includes('spine01') || n.endsWith('spine')) {
            bone.scale.set(sWaist, 1.0, sWaist);
          } else if (n.includes('spine02') || n.includes('spine03') || n.endsWith('spine2')) {
            bone.scale.set(sChest, 1.0, sChest);
          } else if (n.includes('pelvis') || n.endsWith('hips')) {
            bone.scale.set(sHips, 1.0, sHips);
          }
        }
      });

      model.updateMatrixWorld(true);
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);

      // Stand upright if model exported Z-Up
      if (rawSize.z > rawSize.y * 1.15) {
        model.rotation.x = -Math.PI / 2;
      }

      model.updateMatrixWorld(true);
      const uprightBox = new THREE.Box3().setFromObject(model);
      const uprightSize = new THREE.Vector3();
      uprightBox.getSize(uprightSize);

      const uniformScale = 1.72 / (uprightSize.y || 1);
      model.scale.multiplyScalar(uniformScale);

      model.updateMatrixWorld(true);
      const normalizedCenter = new THREE.Vector3();
      new THREE.Box3().setFromObject(model).getCenter(normalizedCenter);
      model.position.sub(normalizedCenter);

      root.add(model);
      const maleRings = buildMeasurementRings(false, sChest, sWaist, sHips, activeZone);
      maleRings.forEach((r) => root.add(r));
      root.userData.landmarks = extractMaleBoneLandmarks(root, model, maleRings, sChest, sWaist, sHips);
      onLoaded(root);
    },
    undefined,
    () => {
      loader.load('/Xbot.glb', (fallback) => {
        finalizeFallbackXbot(fallback.scene, sChest, sWaist, sHips, activeZone, onLoaded);
      });
    }
  );
}
