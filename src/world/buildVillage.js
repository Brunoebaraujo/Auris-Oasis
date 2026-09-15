import * as THREE from 'three';
import { palette } from '../config/graphics.js';
import { createRng } from '../core/random.js';
import { models } from './modelCatalog.js';
import { NavGrid } from './NavGrid.js';
import { createCampfire } from './Campfire.js';
import { createGlow, valueNoise } from './fx.js';

const DEG = Math.PI / 180;

// Monta o recorte da vila a partir dos dados do mapa.
export function buildVillage(scene, assets, map) {
  const nav = new NavGrid({ ...map.bounds, resolution: 0.5, agentRadius: 0.45 });
  const updaters = [];

  scene.add(buildGround(map));
  const lights = buildLights(scene);
  updaters.push(lights);

  // Objetos do mapa
  for (const p of map.props) placeModel(scene, assets, nav, p);
  for (const m of map.mountains) placeModel(scene, assets, null, m);

  // Fogueira
  const fire = createCampfire(assets, map.campfire);
  scene.add(fire.object);
  nav.blockCircle(fire.collider.x, fire.collider.z, fire.collider.radius);
  updaters.push(fire);

  // Tochas
  const torches = map.torches.map(([x, z], i) => createTorchPost(assets, x, z, i));
  torches.forEach((t) => {
    scene.add(t.object);
    nav.blockCircle(t.x, t.z, 0.2);
  });
  updaters.push({
    update(_dt, t) {
      torches.forEach((torch, i) => torch.flicker(t, i));
    },
  });

  buildForest(scene, assets, nav, map);

  const navDebug = nav.createDebugOverlay();
  scene.add(navDebug);

  return {
    nav,
    navDebug,
    spawn: map.spawn,
    update(dt, t) {
      for (const u of updaters) u.update(dt, t);
    },
    followShadow: lights.followShadow,
  };
}

function placeModel(scene, assets, nav, { id, at, rot = 0 }) {
  const def = models[id];
  if (!def) throw new Error(`Modelo desconhecido no mapa: ${id}`);
  const obj = assets.instance(def.path);
  obj.scale.setScalar(def.scale);
  obj.position.set(at[0], 0, at[1]);
  obj.rotation.y = rot * DEG;
  scene.add(obj);
  obj.updateMatrixWorld(true);
  if (!nav) return obj;
  if (def.collider === 'box') nav.blockObject(obj, def.shrink ?? 1);
  else if (def.collider === 'circle') nav.blockCircle(at[0], at[1], def.radius);
  return obj;
}

// --- chão com terra batida pintada por vértice ---
function buildGround(map) {
  const SIZE = 140;
  const SEG = 150;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const grassA = new THREE.Color(0x4f6a35);
  const grassB = new THREE.Color(0x3d5a2e);
  const grassC = new THREE.Color(0x5e7a3c);
  const dirtA = new THREE.Color(0x7a6246);
  const dirtB = new THREE.Color(0x5f4c37);
  const c = new THREE.Color();
  const d = new THREE.Color();

  const { plaza, paths } = map.dirt;
  const segDist = (px, pz, [ax, az], [bx, bz]) => {
    const vx = bx - ax;
    const vz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
    return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const n1 = valueNoise(x * 0.25, z * 0.25);
    const n2 = valueNoise(x * 0.9 + 40, z * 0.9 - 17);

    // grama
    c.copy(grassA).lerp(grassB, n1).lerp(grassC, Math.max(0, n2 - 0.55) * 1.6);

    // terra: distância com borda irregular
    const edge = (n2 - 0.5) * 0.9;
    let dirt = 0;
    const dp = Math.hypot(x - plaza.x, z - plaza.z) - plaza.radius + edge;
    dirt = Math.max(dirt, THREE.MathUtils.clamp(0.5 - dp, 0, 1));
    for (const p of paths) {
      const dd = segDist(x, z, p.from, p.to) - p.width / 2 + edge * 0.6;
      dirt = Math.max(dirt, THREE.MathUtils.clamp(0.5 - dd * 1.2, 0, 1));
    }
    if (dirt > 0) {
      d.copy(dirtA).lerp(dirtB, n1 * 0.8);
      c.lerp(d, dirt);
    }

    // escurece longe da vila
    const far = THREE.MathUtils.smoothstep(Math.hypot(x, z), 26, 60);
    c.multiplyScalar(1 - far * 0.45);

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  ground.renderOrder = 3; // desenhado depois do herói: não dispara a silhueta
  ground.name = 'ground';
  return ground;
}

// --- luzes de crepúsculo ---
function buildLights(scene) {
  scene.add(new THREE.HemisphereLight(0x8fa6c0, 0x2f3a26, 0.95));
  scene.add(new THREE.AmbientLight(0x9fb4c8, 0.22));

  const moon = new THREE.DirectionalLight(0xb7c8e0, 1.15);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.03;
  scene.add(moon, moon.target);
  const offset = new THREE.Vector3(-22, 38, 14);

  return {
    update() {},
    followShadow(focus) {
      // encaixa na grade do shadow map para evitar tremulação das sombras
      const step = 52 / 2048;
      const fx = Math.round(focus.x / step) * step;
      const fz = Math.round(focus.z / step) * step;
      moon.target.position.set(fx, 0, fz);
      moon.position.set(fx + offset.x, offset.y, fz + offset.z);
    },
  };
}

// --- poste com tocha ---
function createTorchPost(assets, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.11, 1.8, 6),
    new THREE.MeshStandardMaterial({ color: palette.timber, roughness: 1, flatShading: true }),
  );
  post.position.y = 0.9;
  post.castShadow = true;
  group.add(post);

  const torch = assets.instance(models.torch.path);
  torch.position.y = 1.8 + 0.38;
  group.add(torch);

  const light = new THREE.PointLight(palette.torch, 11, 10, 1.7);
  light.position.y = 2.75;
  const glow = createGlow(palette.torch, 1.6);
  glow.position.y = 2.65;
  group.add(light, glow);

  return {
    object: group,
    x,
    z,
    flicker(t, i) {
      const k = Math.sin(t * 13 + i * 2.1) * 0.6 + Math.sin(t * 29 + i) * 0.4;
      light.intensity = 11 + k * 1.8;
      glow.scale.setScalar(1.6 + k * 0.12);
    },
  };
}

// --- floresta instanciada ---
function buildForest(scene, assets, nav, map) {
  const { minX, minZ, width, depth } = map.bounds;
  const maxX = minX + width;
  const maxZ = minZ + depth;
  const f = map.forest;
  const rng = createRng(f.seed);

  const kinds = ['tree_A', 'tree_B', 'tree_A', 'tree_B', 'trees_A_small', 'trees_B_small', 'trees_A_medium', 'trees_B_medium'];
  const buckets = new Map(kinds.map((k) => [k, []]));

  const insideInterior = (x, z) =>
    x > minX + f.edgeBand && x < maxX - f.edgeBand && z > minZ + f.edgeBand && z < maxZ - f.edgeBand;
  const inCorridor = (x, def) => f.corridors.some((c) => Math.abs(x - c.x) < c.halfWidth + (def.radius ?? 0) * 0.6);

  let tries = 0;
  let placed = 0;
  while (placed < f.count && tries < f.count * 20) {
    tries++;
    const x = rng.range(-f.outerRadius, f.outerRadius);
    const z = rng.range(-48, f.outerRadius);
    if (insideInterior(x, z)) continue;
    const inSlice = x >= minX && x <= maxX && z >= minZ && z <= maxZ;
    // perto da borda, só árvores únicas (mais fácil de ler o limite)
    const kind = inSlice ? (rng.next() > 0.5 ? 'tree_A' : 'tree_B') : kinds[Math.floor(rng.next() * kinds.length)];
    const def = models[kind];
    if (inCorridor(x, def)) continue;
    const scale = def.scale * rng.range(0.8, 1.25);
    buckets.get(kind).push({ x, z, scale, rot: rng.next() * Math.PI * 2 });
    if (inSlice || Math.abs(x - minX) < 4 || Math.abs(x - maxX) < 4 || Math.abs(z - minZ) < 4 || Math.abs(z - maxZ) < 4) {
      nav.blockCircle(x, z, (def.radius ?? 0.7) * (scale / def.scale));
    }
    placed++;
  }

  // Árvores extras garantindo que a borda do recorte fique fechada
  for (let s = minX; s <= maxX; s += 2.2) {
    for (const [x, z] of [[s, minZ + 1], [s, maxZ - 1], [minX + 1, s], [maxX - 1, s]]) {
      const def = models.tree_A;
      if (inCorridor(x, def) && Math.abs(z) > 15) continue;
      const kind = rng.next() > 0.5 ? 'tree_A' : 'tree_B';
      const jx = x + rng.range(-0.6, 0.6);
      const jz = z + rng.range(-0.6, 0.6);
      buckets.get(kind).push({ x: jx, z: jz, scale: def.scale * rng.range(0.85, 1.2), rot: rng.next() * 6.28 });
      nav.blockCircle(jx, jz, def.radius);
    }
  }

  // Árvores próximas projetam sombra; as distantes não (economiza GPU)
  const SHADOW_RADIUS = 34;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  for (const [kind, all] of buckets) {
    const near = all.filter((t) => Math.hypot(t.x, t.z) < SHADOW_RADIUS);
    const far = all.filter((t) => Math.hypot(t.x, t.z) >= SHADOW_RADIUS);
    for (const [list, shadows] of [[near, true], [far, false]]) {
      if (!list.length) continue;
      for (const part of assets.meshParts(models[kind].path)) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, list.length);
        list.forEach(({ x, z, scale, rot }, i) => {
          q.setFromAxisAngle(up, rot);
          m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(scale, scale, scale)).multiply(part.matrix);
          mesh.setMatrixAt(i, m4);
        });
        mesh.castShadow = shadows;
        mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        scene.add(mesh);
      }
    }
  }
}
