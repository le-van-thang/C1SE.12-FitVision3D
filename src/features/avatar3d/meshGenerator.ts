import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface HumanBodyParams {
  gender?: 'male' | 'female';
  scale_chest?: number;
  scale_waist?: number;
  scale_hips?: number;
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
function normalizeAndDeformFemaleGeometry(
  geo: THREE.BufferGeometry,
  sChest: number,
  sWaist: number,
  sHips: number
): void {
  // Bake Z-Up -> Y-Up rotation (-90 deg X) directly into geometry vertices
  geo.rotateX(-Math.PI / 2);
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

    const zCenter = 0.032;
    x *= scaleXZ;
    z = zCenter + (z - zCenter) * scaleXZ;

    posAttr.setXYZ(i, x, y, z);
  }

  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
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
        { key: 'chest', y: 0.42, rx: 0.140 * sChest, rz: 0.116 * sChest, zOffset: 0.032 },
        { key: 'waist', y: 0.26, rx: 0.116 * sWaist, rz: 0.088 * sWaist, zOffset: 0.015 },
        { key: 'hips', y: 0.02, rx: 0.176 * sHips, rz: 0.108 * sHips, zOffset: 0.050 },
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

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry = mesh.geometry.clone();
            normalizeAndDeformFemaleGeometry(mesh.geometry, sChest, sWaist, sHips);
            mesh.material = femaleMat;
            mesh.frustumCulled = false;
          }
        });

        root.add(model);
        buildMeasurementRings(true, sChest, sWaist, sHips, activeZone).forEach((r) => root.add(r));
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
      buildMeasurementRings(false, sChest, sWaist, sHips, activeZone).forEach((r) => root.add(r));
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
