import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface HumanBodyParams {
  gender?: 'male' | 'female';
  scale_chest?: number;
  scale_waist?: number;
  scale_hips?: number;
}

/**
 * ZOZOFIT Quad-Grid Shader compatible with THREE.SkinnedMesh
 * Renders a dense cyan-white square grid over a deep matte dark silhouette
 */
export function createSkinnedZozofitMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGridColor: { value: new THREE.Color('#7dd3fc') },
      uCoreColor: { value: new THREE.Color('#050d14') },
      uRimColor:  { value: new THREE.Color('#38bdf8') },
      uDensity:   { value: 52.0 },
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

        // Keep original unscaled bind-pose coordinates for uniform square grid lines
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

      varying vec3 vObjPos;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      float gridLine(float coord, float width) {
        float fw = max(fwidth(coord), 0.0001);
        float dist = abs(fract(coord - 0.5) - 0.5) / fw;
        return 1.0 - smoothstep(0.0, width, dist);
      }

      void main() {
        // Normalize object coordinates
        float scale = length(vObjPos) > 10.0 ? 0.01 : 1.0;
        vec3 p = vObjPos * scale;

        // Clean horizontal contour rings + vertical body lines (Quad Grid, NO diagonal triangles)
        float gy = gridLine(p.y * uDensity, 1.35);
        float gx = gridLine(p.x * uDensity, 1.35);
        float gz = gridLine(p.z * uDensity, 1.35);

        // Triplanar blend between X and Z vertical lines so sides don't stretch
        vec3 n = normalize(vNormalView);
        float gv = mix(gx, gz, abs(n.x));
        float quad = max(gy, gv);

        // Smooth anatomical Fresnel rim glow
        float fresnel = pow(1.0 - abs(dot(n, normalize(vViewDir))), 2.2);

        vec3 col = uCoreColor;
        col = mix(col, uRimColor, fresnel * 0.45);
        col = mix(col, uGridColor, quad * (0.42 + 0.58 * fresnel));

        gl_FragColor = vec4(col, 0.98);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Loads the standard neutral humanoid mannequin (Xbot), resets it to an anatomical A-Pose,
 * dynamically scales body girth (chest, waist, hips), and adds contoured ZOZOFIT measurement rings.
 */
export function loadRealHumanModel(
  params: HumanBodyParams,
  activeZone: 'chest' | 'waist' | 'hips' | 'shoulders' | 'inseam' = 'waist',
  onLoaded: (group: THREE.Group) => void
): void {
  const loader = new GLTFLoader();

  // Load standard humanoid mannequin (Xbot) instead of anime character
  loader.load('/Xbot.glb', (gltf) => {
    const root = new THREE.Group();
    const model = gltf.scene;
    const zozofitMat = createSkinnedZozofitMaterial();

    const sChest = params.scale_chest || 1.0;
    const sWaist = params.scale_waist || 1.0;
    const sHips  = params.scale_hips  || 1.0;

    // 1. Reset SkinnedMesh to clean rest pose and apply ZOZOFIT quad-grid shader
    model.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinned = child as THREE.SkinnedMesh;
        if (skinned.name === 'Beta_Joints') {
          // Hide mechanical joint markers so body is clean and continuous
          skinned.visible = false;
        } else {
          skinned.material = zozofitMat;
        }
        if (skinned.parent) {
          skinned.parent.position.set(0, 0, 0);
          skinned.parent.rotation.set(0, 0, 0);
          skinned.parent.scale.set(1, 1, 1);
        }
        skinned.skeleton.pose();
        skinned.frustumCulled = false;
      } else if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = zozofitMat;
      }
    });

    // 2. Rotate arms from T-Pose to natural ZOZOFIT A-Pose (~35 degrees) & apply girth scaling
    model.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone;
        const n = bone.name.toLowerCase();

        // Lower arms naturally into ergonomic A-Pose
        if (n.endsWith('leftarm')) {
          bone.rotation.set(0, 0, -0.62);
        }
        if (n.endsWith('rightarm')) {
          bone.rotation.set(0, 0, 0.62);
        }

        // Anthropometric girth scaling (X and Z expand with body measurements)
        if (n.endsWith('spine') || n.endsWith('spine1')) {
          bone.scale.set(sWaist, 1.0, sWaist);
        } else if (n.endsWith('spine2')) {
          bone.scale.set(sChest, 1.0, sChest);
        } else if (n.endsWith('hips')) {
          bone.scale.set(sHips, 1.0, sHips);
        }
      }
    });

    // 3. Auto-center and normalize height to exactly 1.72 units in viewport
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const targetHeight = 1.72;
    const uniformScale = targetHeight / (size.y || 1);
    model.scale.multiplyScalar(uniformScale);

    model.updateMatrixWorld(true);
    const normalizedBox = new THREE.Box3().setFromObject(model);
    const normalizedCenter = new THREE.Vector3();
    normalizedBox.getCenter(normalizedCenter);
    model.position.sub(normalizedCenter);

    root.add(model);

    // 4. Add Contoured ZOZOFIT Measurement Rings (Chest, Waist, Hips)
    const ringConfigs = [
      { key: 'chest', y: 0.30, rx: 0.165 * sChest, rz: 0.125 * sChest, zOffset: 0.015 },
      { key: 'waist', y: 0.08, rx: 0.135 * sWaist, rz: 0.102 * sWaist, zOffset: 0.010 },
      { key: 'hips',  y: -0.09, rx: 0.178 * sHips, rz: 0.132 * sHips, zOffset: -0.005 },
    ];

    ringConfigs.forEach((rc) => {
      const isActive = activeZone === rc.key;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * rc.rx, rc.y, Math.sin(theta) * rc.rz + rc.zOffset));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, isActive ? 0.009 : 0.0035, 12, true);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: isActive ? 0xa3e635 : 0x38bdf8,
        transparent: true,
        opacity: isActive ? 0.98 : 0.45,
      });
      const ringMesh = new THREE.Mesh(tubeGeo, tubeMat);
      ringMesh.name = `ring_${rc.key}`;
      root.add(ringMesh);
    });

    onLoaded(root);
  });
}
