/**
 * Shared device-model engine.
 *
 * Owns everything about turning a device id into a ready-to-animate Three.js
 * scene: the GLB registry, per-model pose/scale calibration, the session cache,
 * the fixes for quirks baked into the source scans, and the rig (lid hinge, bud
 * travel) the earbud animation drives.
 *
 * Both the Settings picker cards and the Dynamic Island connection notification
 * render the same devices, so this lives in one place rather than being
 * duplicated and drifting between the two.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ─── Real 3D GLB Asset Imports ────────────────────────────────────────────────
import s24ultraGlb       from '../assets/models/s24ultra.glb?url';
import s25ultraGlb       from '../assets/models/s25ultra.glb?url';
import s26ultraGlb       from '../assets/models/s26ultra.glb?url';
import zfold6Glb         from '../assets/models/zfold6.glb?url';
import zflip6Glb         from '../assets/models/zflip6.glb?url';
import iphone16proGlb    from '../assets/models/iphone16pro.glb?url';
import iphone15proGlb    from '../assets/models/iphone15pro.glb?url';
import iphone16Glb       from '../assets/models/iphone16.glb?url';
import iphone15Glb       from '../assets/models/iphone15.glb?url';
import iphone12Glb       from '../assets/models/iphone12.glb?url';
import iphone17proGlb    from '../assets/models/iphone17pro.glb?url';
import iphone17airGlb    from '../assets/models/iphone17air.glb?url';
import razerbarracudaGlb from '../assets/models/razerbarracuda.glb?url';
import sonywh1000Glb     from '../assets/models/sonywh1000.glb?url';
import airpodsproGlb     from '../assets/models/airpodspro.glb?url';
import airpodsmaxGlb     from '../assets/models/airpodsmax.glb?url';
import galaxybudsGlb     from '../assets/models/galaxybuds.glb?url';
import soundbarGlb       from '../assets/models/soundbar.glb?url';
import ps5ControllerGlb  from '../assets/models/ps5_controller.glb?url';
import xboxBlackGlb      from '../assets/models/xbox_black.glb?url';
import xboxWhiteGlb      from '../assets/models/xbox_white.glb?url';

export const GLB_MODEL_MAP = {
  s24ultra: s24ultraGlb,
  s25ultra: s25ultraGlb,
  s26ultra: s26ultraGlb,
  zfold6: zfold6Glb,
  zfold5: zfold6Glb,
  zflip6: zflip6Glb,
  zflip5: zflip6Glb,
  iphone17pro: iphone17proGlb,
  iphone17air: iphone17airGlb,
  iphone16pro: iphone16proGlb,
  iphone15pro: iphone15proGlb,
  iphone16: iphone16Glb,
  iphone15: iphone15Glb,
  iphone12: iphone12Glb,
  razerbarracuda: razerbarracudaGlb,
  sonywh1000: sonywh1000Glb,
  airpodspro: airpodsproGlb,
  airpodsmax: airpodsmaxGlb,
  galaxybuds: galaxybudsGlb,
  soundbar: soundbarGlb,
  ps5_controller: ps5ControllerGlb,
  xbox_black: xboxBlackGlb,
  xbox_white: xboxWhiteGlb,
};

// ─── Per-model Base Pose & Scale Configs (calibrated against the real GLBs) ───
export const MODEL_CONFIGS = {
  // baseRot* are the FINAL on-screen rotations. (They were once applied twice —
  // on the model and again on its parent group — so several values here are
  // half what they look like historically; the doubling is fixed.)
  s24ultra:       { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  // The s25 GLB is authored facing sideways (its thinnest axis is X, not Z like
  // s24/s26), so it needs a quarter turn to present its back to the camera.
  s25ultra:       { baseRotY: Math.PI / 2,    baseRotX: 0, scaleFactor: 1.60 },
  s26ultra:       { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  zfold6:         { baseRotY: Math.PI,        baseRotX: 0, scaleFactor: 1.60 },
  zflip6:         { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone17pro:    { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone17air:    { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone16pro:    { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone15pro:    { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone16:       { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone15:       { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  iphone12:       { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.60 },
  // The Razer GLB is authored front-on (thinnest axis Z), so it needs no turn
  // to face the viewer; the Sony GLB is authored side-on (thinnest axis X) and
  // needs a turn to match. Both end up presenting the same front view.
  razerbarracuda: { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.45 },
  sonywh1000:     { baseRotY: Math.PI / 1.75, baseRotX: 0, scaleFactor: 1.45 },
  airpodsmax:     { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.45 },
  // Earbuds. The AirPods scan is authored Y-up (matches Three's axes, baseRotX
  // 0) so its buds rise along local Y. The Galaxy GLB is authored Z-up, and
  // baseRotX ≈ -90° rotates that local Z onto world-up — which is also why its
  // buds must travel along local Z and nudge along local Y instead.
  //
  // budsAuthoredOut: the AirPods scan poses its earbuds ALREADY lifted clear of
  // the case, so their authored spot is the END of the animation and they must
  // be sunk into the case first. The Galaxy buds are modelled seated inside.
  // lidAuthoredOpen: this scan poses the CASE open too — its lid node sits
  // behind the body with no rotation of its own, so leaving the hinge at zero
  // (the resting state) showed a permanently open case. Like the buds, the
  // authored pose is the END of the animation, not the start.
  airpodspro:     { baseRotY: 0, baseRotX: 0, scaleFactor: 1.60, riseAxis: 'y', secondaryAxis: 'z', secondarySign: 1, riseMult: 0.55, budsAuthoredOut: true, lidAuthoredOpen: true, hingeZUseMax: true, openNudgeY: 0.10 },
  galaxybuds:     { baseRotY: 0, baseRotX: -Math.PI / 2 - 0.15, scaleFactor: 1.60, riseAxis: 'z', secondaryAxis: 'y', secondarySign: -1, riseMult: 0.85, lidOpenAngle: 2.05, openNudgeY: 0.38 },
  soundbar:       { baseRotY: Math.PI,        baseRotX: 0, scaleFactor: 1.35 },
  // The DualSense GLB is authored back-on, so it needs a half turn to show its
  // face; the Xbox GLBs are already authored face-on.
  ps5_controller: { baseRotY: Math.PI,        baseRotX: 0, scaleFactor: 1.28 },
  xbox_white:     { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.28 },
  xbox_black:     { baseRotY: 0,              baseRotX: 0, scaleFactor: 1.28 },
};

export const SPIN_MODELS = new Set([
  's24ultra', 's25ultra', 's26ultra', 'zfold6', 'zflip6',
  'iphone17pro', 'iphone17air', 'iphone16pro', 'iphone15pro', 'iphone16', 'iphone15', 'iphone12',
]);

// Tilt applied to the whole group while an earbud case is open. Shared so the
// drop measurement below sees the same pose the renderers actually draw.
export const OPEN_TILT_X = -0.20;

const EARBUD_NODES = {
  airpodspro: { lid: 'uzpdkgqkIIWTYxJ', left: 'DprZyuuKYVGeqRc', right: 'RTZiZFLcZlxaClC' },
  galaxybuds: { lid: 'Case_Lid', left: 'Earbud_Left', right: 'Earbud_Right' },
};

function boxVolume(box) {
  const s = box.getSize(new THREE.Vector3());
  return Math.max(s.x, 0) * Math.max(s.y, 0) * Math.max(s.z, 0);
}

// ── Ghost-Mesh Deduplication ───────────────────────────────────────────────
// Some source scans ship true duplicate "overlay" meshes: siblings sharing a
// parent that nearly — not exactly — occupy the same bounding box.
//
// A ghost is a near-DUPLICATE, so all three tests below must pass. A plain
// containment test is not enough and actively broke both earbud models: it
// deleted 29 of the AirPods scan's 48 meshes (stripping the detailed white
// shells, leaving dark low-poly ones — the "black earbuds") and deleted the
// Galaxy case's entire Case_Base, because the buds nested inside it counted as
// containing it (the ratio was taken against the smaller box, so any small part
// swallowed its own parent shell).
export function dedupeOverlappingMeshes(root) {
  root.updateWorldMatrix(true, true);
  const groups = new Map();
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const box = new THREE.Box3().setFromObject(child);
    if (!isFinite(box.min.x) || !isFinite(box.max.x)) return;
    const parentKey = child.parent ? child.parent.uuid : 'root';
    if (!groups.has(parentKey)) groups.set(parentKey, []);
    groups.get(parentKey).push({
      mesh: child, box,
      volume: boxVolume(box),
      verts: child.geometry.attributes?.position?.count || 0,
    });
  });

  const MIN_VOLUME_RATIO = 0.8;    // how alike in size two boxes must be
  const MIN_MUTUAL_OVERLAP = 0.9;  // fraction of EACH box that must overlap
  let removed = 0;

  for (const arr of groups.values()) {
    if (arr.length < 2) continue;
    arr.sort((a, b) => b.verts - a.verts); // most detailed mesh wins
    const kept = [];
    for (const candidate of arr) {
      let isGhost = false;
      for (const keptEntry of kept) {
        if (candidate.volume <= 0 || keptEntry.volume <= 0) continue;
        const sizeRatio =
          Math.min(candidate.volume, keptEntry.volume) /
          Math.max(candidate.volume, keptEntry.volume);
        if (sizeRatio < MIN_VOLUME_RATIO) continue;
        const inter = boxVolume(keptEntry.box.clone().intersect(candidate.box));
        if (inter / candidate.volume >= MIN_MUTUAL_OVERLAP &&
            inter / keptEntry.volume >= MIN_MUTUAL_OVERLAP) { isGhost = true; break; }
      }
      if (isGhost) { candidate.mesh.parent?.remove(candidate.mesh); removed++; }
      else kept.push(candidate);
    }
  }
  return removed;
}

// ── Ghost-Bud Removal ──────────────────────────────────────────────────────
// The AirPods scan also ships a single low-poly stand-in covering BOTH earbuds.
// It lives under a different parent than the two real bud nodes, so the
// sibling-scoped dedupe cannot see it and the per-node animation never touches
// it — it just sat there as a dark pair of buds poking out of the closed case.
// Identified structurally, never by name: a mesh outside both buds that sits
// almost entirely inside the space they occupy while carrying a fraction of
// their detail. Models without one are untouched.
export function removeGhostBudMeshes(root, leftBud, rightBud) {
  if (!leftBud || !rightBud) return 0;
  root.updateWorldMatrix(true, true);
  const isDescendantOf = (obj, ancestor) => {
    for (let p = obj; p; p = p.parent) if (p === ancestor) return true;
    return false;
  };
  const budUnion = new THREE.Box3().setFromObject(leftBud)
    .union(new THREE.Box3().setFromObject(rightBud));
  let budVerts = 0;
  for (const bud of [leftBud, rightBud]) {
    bud.traverse((c) => { if (c.isMesh) budVerts += c.geometry?.attributes?.position?.count || 0; });
  }

  const CONTAINMENT = 0.9;
  const DETAIL_RATIO = 0.2;
  const doomed = [];
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    if (isDescendantOf(child, leftBud) || isDescendantOf(child, rightBud)) return;
    const box = new THREE.Box3().setFromObject(child);
    const volume = boxVolume(box);
    if (volume <= 0) return;
    if (boxVolume(box.clone().intersect(budUnion)) / volume < CONTAINMENT) return;
    const verts = child.geometry.attributes?.position?.count || 0;
    if (budVerts > 0 && verts > budVerts * DETAIL_RATIO) return;
    doomed.push(child);
  });
  doomed.forEach((mesh) => mesh.parent?.remove(mesh));
  return doomed.length;
}

// ── Shared model cache ─────────────────────────────────────────────────────
// Each asset is fetched and parsed at most once per session; callers take a
// lightweight clone. Clones share geometry and materials with the cached
// master, so consumers must NOT dispose those on teardown — doing so would
// leave the cache pointing at freed GPU buffers.
const MODEL_CACHE = new Map();

export function loadSharedModel(modelId) {
  const url = GLB_MODEL_MAP[modelId];
  if (!url) return Promise.reject(new Error(`unknown model: ${modelId}`));
  if (!MODEL_CACHE.has(modelId)) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    MODEL_CACHE.set(modelId, loader.loadAsync(url).catch((err) => {
      MODEL_CACHE.delete(modelId); // let a later mount retry
      throw err;
    }));
  }
  return MODEL_CACHE.get(modelId);
}

/**
 * Clone a cached GLTF and get it camera-ready: quirks fixed, finish applied,
 * auto-fitted, posed, and (for earbuds) rigged with a lid hinge and bud travel.
 *
 * Returns the rig the animation loop needs; `budRise` is already expressed in
 * the bud nodes' own local units.
 */
export function prepareDeviceModel(gltf, { modelId, category, tintHex }) {
  const config = MODEL_CONFIGS[modelId] || { baseRotY: 0, baseRotX: 0, scaleFactor: 1.6 };
  const root = gltf.scene.clone(true);

  if (category === 'earbud') dedupeOverlappingMeshes(root);

  // AirPods Max ships flat/broken scan materials — give it a clean finish.
  // Everything else keeps its authored PBR for realism.
  if (modelId === 'airpodsmax') {
    const whiteAppleMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f5f7, roughness: 0.15, metalness: 0.2, clearcoat: 1.0, side: THREE.DoubleSide,
    });
    root.traverse((child) => { if (child.isMesh) child.material = whiteAppleMat; });
  } else {
    root.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.side = THREE.DoubleSide;
        if (child.material.roughness !== undefined) {
          child.material.roughness = Math.min(child.material.roughness, 0.35);
        }
      }
    });
  }

  // The Galaxy GLB is authored graphite; WinLand shows the silver finish.
  //
  // A flat white repaint left it reading as a featureless blob — with almost no
  // texture detail in this asset, a diffuse-only material gives the eye nothing
  // to catch. A polished metal is what makes the form legible instead: metalness
  // carries the environment, low roughness gives it a sharp highlight along the
  // lid seam, and the clearcoat adds the lacquered sheen the real case has. The
  // lid is kept a touch brighter than the base so the two halves read apart.
  if (modelId === 'galaxybuds') {
    const silver = (tone) => new THREE.MeshPhysicalMaterial({
      color: tone,
      metalness: 0.92,
      roughness: 0.19,
      clearcoat: 0.7,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.35,
      side: THREE.DoubleSide,
    });
    root.getObjectByName('Case_Base')?.traverse((c) => { if (c.isMesh) c.material = silver(0xc9ccd2); });
    root.getObjectByName('Case_Lid')?.traverse((c) => { if (c.isMesh) c.material = silver(0xdfe2e7); });
  }

  // Hardware finish. The picker used to be inert because nothing consumed the
  // colour — the models simply kept their authored materials. Tint the body
  // panels toward the chosen finish while leaving the dark parts (screens,
  // grilles, rubber) alone, otherwise a phone turns into a solid slab of
  // colour with no screen. Materials are cloned first: they are shared with
  // the cached master, so tinting in place would repaint every other card too.
  if (tintHex) {
    const tint = new THREE.Color(tintHex);
    const seen = new Map();
    root.traverse((child) => {
      if (!child.isMesh || !child.material || Array.isArray(child.material)) return;
      const src = child.material;
      if (!src.color) return;
      // Skip near-black surfaces — those read as screen/trim, not bodywork.
      const luma = 0.2126 * src.color.r + 0.7152 * src.color.g + 0.0722 * src.color.b;
      if (luma < 0.16) return;
      let cloned = seen.get(src.uuid);
      if (!cloned) {
        cloned = src.clone();
        cloned.color = src.color.clone().lerp(tint, 0.5);
        seen.set(src.uuid, cloned);
      }
      child.material = cloned;
    });
  }

  let lidNode = null, budLeftNode = null, budRightNode = null;
  let budLeftInitialY = 0, budLeftInitialZ = 0, budRightInitialY = 0, budRightInitialZ = 0;

  if (category === 'earbud') {
    const names = EARBUD_NODES[modelId];
    if (names) {
      lidNode = root.getObjectByName(names.lid);
      budLeftNode = root.getObjectByName(names.left);
      budRightNode = root.getObjectByName(names.right);
      removeGhostBudMeshes(root, budLeftNode, budRightNode);
      if (budLeftNode)  { budLeftInitialY  = budLeftNode.position.y;  budLeftInitialZ  = budLeftNode.position.z;  budLeftNode.visible = false; }
      if (budRightNode) { budRightInitialY = budRightNode.position.y; budRightInitialZ = budRightNode.position.z; budRightNode.visible = false; }
    }
  }

  // Auto-fit & centre strictly inside the canvas.
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const s = maxDim > 0 ? (config.scaleFactor || 1.6) / maxDim : 1;

  root.scale.set(s, s, s);
  root.position.sub(center.multiplyScalar(s));
  root.rotation.y = config.baseRotY;
  root.rotation.x = config.baseRotX;
  let initialYPos = root.position.y;

  let budRise = 1;
  let lidClosedAngle = 0; // hinge angle that shuts a case authored open
  let targetWorldRise = 0; // same travel, in world units, for framing the shot
  if (category === 'earbud') {
    // Re-centre on POST-rotation bounds. The auto-fit above centres in
    // PRE-rotation space, which only lands centred when the base rotation is
    // ~0 (AirPods). The Z-up Galaxy case otherwise floated high in frame.
    root.updateWorldMatrix(true, true);
    root.position.sub(new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3()));
    initialYPos = root.position.y;

    // Bud travel is chosen in WORLD units — a fraction of the case's on-screen
    // height — then converted into the bud nodes' own units. That conversion
    // matters: the Galaxy buds hang off the root, but the AirPods buds sit deep
    // under parents carrying their own scale, so a distance measured in root
    // units moved them about a seventh as far as intended.
    const riseAxisKey = config.riseAxis || 'y';
    root.updateWorldMatrix(true, true);
    const caseWorldHeight =
      new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y || 1;
    targetWorldRise = caseWorldHeight * (config.riseMult ?? 0.45);
    const budParentScale = new THREE.Vector3(1, 1, 1);
    (budLeftNode?.parent || root).getWorldScale(budParentScale);
    budRise = targetWorldRise / (Math.abs(budParentScale[riseAxisKey]) || 1);

    if (lidNode) {
      // Re-parent the lid into a pivot at its back-bottom edge so it swings
      // around the real hinge instead of the model origin.
      root.updateWorldMatrix(true, true);
      const lidBox = new THREE.Box3().setFromObject(lidNode);
      const hingeZ = config.hingeZUseMax ? lidBox.max.z : lidBox.min.z;
      const hingeWorld = new THREE.Vector3(
        (lidBox.min.x + lidBox.max.x) * 0.5, lidBox.min.y, hingeZ
      );
      const lidParent = lidNode.parent;
      if (lidParent) {
        lidParent.worldToLocal(hingeWorld);
        const lidPivot = new THREE.Group();
        lidPivot.position.copy(hingeWorld);
        lidParent.add(lidPivot);
        lidPivot.attach(lidNode); // preserve world transform
        lidNode = lidPivot;

        // For a case authored OPEN, work out the angle that actually shuts it.
        //
        // A guessed constant cannot do this: the lid is parked at whatever
        // angle the artist left it, and swinging it by some arbitrary amount
        // around the hinge leaves it floating beside the case rather than
        // seated on it. Instead, sweep the hinge and keep the angle that best
        // lands the lid's underside on the case rim, centred over it. One
        // sweep at load, and only for models that need it.
        if (config.fixedLidClosedAngle !== undefined) {
          lidClosedAngle = config.fixedLidClosedAngle;
          lidPivot.rotation.x = lidClosedAngle;
          lidPivot.updateMatrixWorld(true);
        } else if (config.lidAuthoredOpen) {
          const bodyBox = new THREE.Box3();
          root.traverse((c) => {
            if (!c.isMesh) return;
            for (let q = c; q; q = q.parent) {
              if (q === lidPivot || q === budLeftNode || q === budRightNode) return;
            }
            bodyBox.union(new THREE.Box3().setFromObject(c));
          });
          if (!bodyBox.isEmpty()) {
            const bodyCentre = bodyBox.getCenter(new THREE.Vector3());
            let best = 0;
            let bestScore = Infinity;
            for (let deg = -180; deg <= 180; deg += 1) {
              const a = (deg * Math.PI) / 180;
              lidPivot.rotation.x = a;
              lidPivot.updateMatrixWorld(true);
              const b = new THREE.Box3().setFromObject(lidPivot);
              if (b.isEmpty()) continue;
              const c = b.getCenter(new THREE.Vector3());
              // Seated means: underside meets the rim, and it sits over the
              // body rather than in front of or behind it.
              const score = Math.abs(b.min.y - bodyBox.max.y) * 2
                          + Math.abs(c.z - bodyCentre.z);
              if (score < bestScore) { bestScore = score; best = a; }
            }
            lidClosedAngle = best;
            lidPivot.rotation.x = best; // start shut
            lidPivot.updateMatrixWorld(true);
          }
        }
      }
    }
  }

  return {
    root, config, initialYPos, budRise, targetWorldRise,
    lidNode, budLeftNode, budRightNode,
    budLeftInitialY, budLeftInitialZ, budRightInitialY, budRightInitialZ,
    lidOpenSign: config.lidOpenSign ?? -1,
    lidOpenAngle: config.lidOpenAngle ?? 1.22,
    lidAuthoredOpen: !!config.lidAuthoredOpen,
    lidClosedAngle,
    // How far to sink the case once open, so the taller open silhouette stays
    // centred instead of riding high. Measured from the rendered bounds per
    // model rather than derived: the model sits inside a rotated, scaled parent
    // whose tilt changes as it opens, so the needed offset is not something the
    // rig dimensions predict.
    openNudgeY: config.openNudgeY ?? 0,
  };
}

/**
 * Standard studio lighting rig shared by every device renderer.
 *
 * Pass the renderer to also install an environment map. Metals reflect their
 * surroundings rather than responding to lights, so a metallic material in a
 * scene with no environment renders almost black no matter how many lights are
 * added — the polished cases and chrome trim need this to read as metal at all.
 */
export function addStudioLights(scene, renderer) {
  scene.add(new THREE.AmbientLight(0xffffff, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.0);
  rim.position.set(-5, -4, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.6);
  fill.position.set(-3, 4, 3);
  scene.add(fill);

  if (renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    pmrem.dispose();
    return () => env.texture.dispose();
  }
  return () => {};
}
