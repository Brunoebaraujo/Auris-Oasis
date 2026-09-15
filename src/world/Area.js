import * as THREE from 'three';
import { ambiences, graphicsConfig, terrainColors } from '../config/graphics.js';

// No perfil leve, tochas e lampiões ficam só com o brilho (sem luz dinâmica)
const decorLights = graphicsConfig.profile !== 'leve';
import { createRng } from '../core/random.js';
import { models } from './modelCatalog.js';
import { NavGrid } from './NavGrid.js';
import { createCampfire } from './Campfire.js';
import { createPortal } from './Portal.js';
import { createArenaGate, createBridge, createColdFire, createLamppost, createTorchPost } from './props.js';
import { getGlowTexture, valueNoise } from './fx.js';
import { tiledColor } from './tiled.js';

const DEG = Math.PI / 180;
const BLOCKING_TILES = new Set(['mata', 'agua']);
const MARGIN = 38; // chão e floresta decorativa além da borda do mapa

// Constrói uma área jogável a partir de um mapa do Tiled já carregado.
export function buildArea(assets, map, id) {
  const cell = map.props.celula ?? 2;
  const width = map.width * cell;
  const depth = map.height * cell;
  const minX = -width / 2;
  const minZ = -depth / 2;
  const toWorld = (cx, cy) => [minX + cx * cell, minZ + cy * cell];
  const tileAt = (c, r) => (c < 0 || r < 0 || c >= map.width || r >= map.height ? null : map.terrain[r * map.width + c]);

  const ambience = ambiences[map.props.ambiente] ?? ambiences.aldeia;
  const rng = createRng(map.props.semente ?? 1);
  const group = new THREE.Group();
  group.name = `area:${id}`;
  const updaters = [];
  const owned = []; // geometrias/materiais criados só para esta área
  const nav = new NavGrid({ minX, minZ, width, depth, resolution: 0.5, agentRadius: 0.45 });

  // --- chão e água ---
  const outside = map.props.floresta_externa ? 'mata' : 'grama';
  const ground = buildGround({ map, cell, minX, minZ, width, depth, tileAt, outside });
  group.add(ground.mesh);
  owned.push(ground.mesh.geometry, ground.mesh.material);
  if (ground.hasWater) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({ color: 0x2c6480, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.82 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.12;
    water.renderOrder = 3;
    group.add(water);
    owned.push(water.geometry, water.material);
  }

  // --- luzes ---
  const lights = buildLights(group, ambience);

  // --- bloqueio por tiles ---
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const [x, z] = toWorld(c, r);
      if (BLOCKING_TILES.has(tileAt(c, r)) || map.blocking[r * map.width + c]) nav.blockBox(x + 0.05, z + 0.05, x + cell - 0.05, z + cell - 0.05);
    }
  }

  // --- objetos (props) ---
  for (const o of map.objects) {
    if (o.type !== 'prop') continue;
    const def = models[o.props.modelo];
    if (!def) {
      console.warn(`Modelo desconhecido no mapa ${id}: ${o.props.modelo}`);
      continue;
    }
    const [x, z] = toWorld(o.x, o.y);
    const obj = assets.instance(def.path);
    obj.scale.setScalar(def.scale * (o.props.escala ?? 1));
    obj.position.set(x, 0, z);
    obj.rotation.y = (o.props.rot ?? 0) * DEG;
    group.add(obj);
    obj.updateMatrixWorld(true);
    if (def.collider === 'box') nav.blockObject(obj, def.shrink ?? 1);
    else if (def.collider === 'circle') nav.blockCircle(x, z, def.radius);
  }

  // --- entidades ---
  const spawns = new Map();
  const portals = [];
  const labels = [];
  const zones = [];
  const add = (thing) => {
    group.add(thing.object);
    if (thing.update) updaters.push(thing);
    for (const c of thing.colliders ?? (thing.collider ? [thing.collider] : [])) nav.blockCircle(c.x, c.z, c.radius);
    return thing;
  };
  let seed = 0;
  for (const e of map.entities) {
    const [x, z] = toWorld(e.x, e.y);
    switch (e.type) {
      case 'spawn':
        spawns.set(e.name, [x, z]);
        break;
      case 'fogueira':
        add(createCampfire(assets, [x, z]));
        break;
      case 'fogueira_apagada':
        add(createColdFire(assets, x, z));
        break;
      case 'tocha':
        add(createTorchPost(assets, x, z, seed++, decorLights && e.props.luz !== false));
        break;
      case 'lampiao':
        add(createLamppost(x, z, seed++, decorLights && e.props.luz === true));
        break;
      case 'portal': {
        const locked = Boolean(e.props.bloqueado) || !e.props.destino;
        const portal = add(createPortal({ x, z, color: tiledColor(e.props.cor, 0x5fd1e0), locked }));
        Object.assign(portal, { name: e.name, target: e.props.destino, arrival: e.props.chegada, label: e.props.rotulo ?? e.name });
        portals.push(portal);
        labels.push({ text: portal.label, sub: locked ? 'em breve' : null, x, y: 4.2, z });
        break;
      }
      case 'arena': {
        const gate = add(createArenaGate(assets, x, z));
        Object.assign(gate, { x, z, locked: true, label: e.props.rotulo ?? 'Arena', name: e.name });
        portals.push(gate);
        labels.push({ text: gate.label, sub: 'em breve', x, y: 6.4, z });
        break;
      }
      case 'ponte': {
        const [x1, z1] = toWorld(e.x + e.w, e.y + e.h);
        add(createBridge(x, z, x1, z1));
        // libera a travessia, com folga nas pontas para o raio do herói
        const m = nav.agentRadius + 0.1;
        if (Math.abs(z1 - z) >= Math.abs(x1 - x)) nav.unblockBox(x + 0.3, z - m, x1 - 0.3, z1 + m);
        else nav.unblockBox(x - m, z + 0.3, x1 + m, z1 - 0.3);
        break;
      }
      case 'area': {
        const [x1, z1] = toWorld(e.x + e.w, e.y + e.h);
        zones.push({ name: e.name, minX: x, minZ: z, maxX: x1, maxZ: z1, props: e.props });
        break;
      }
      default:
        console.warn(`Entidade desconhecida no mapa ${id}: ${e.type}`);
    }
  }

  // --- árvores ---
  owned.push(...buildTrees({ group, assets, nav, map, cell, minX, minZ, width, depth, tileAt, rng }));

  // --- vaga-lumes ---
  if (ambience.fireflies) {
    const ff = createFireflies(ambience.fireflies, minX, minZ, width, depth, rng);
    group.add(ff.object);
    updaters.push(ff);
    owned.push(ff.object.geometry, ff.object.material);
  }

  const navDebug = nav.createDebugOverlay();
  group.add(navDebug);
  owned.push(navDebug.geometry, navDebug.material, navDebug.material.map);

  return {
    id,
    name: map.props.nome ?? id,
    ambience,
    group,
    nav,
    navDebug,
    spawns,
    portals,
    labels,
    zones,
    update(dt, t) {
      for (const u of updaters) u.update(dt, t);
    },
    followShadow: lights.followShadow,
    dispose() {
      group.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
        if (o.isPointLight || o.isDirectionalLight) o.dispose?.();
      });
      owned.forEach((x) => x?.dispose?.());
      group.removeFromParent();
    },
  };
}

// --- chão pintado por vértice a partir dos tiles ---
function buildGround({ map, minX, minZ, width, depth, cell, tileAt, outside }) {
  const sizeX = width + MARGIN * 2;
  const sizeZ = depth + MARGIN * 2;
  const step = graphicsConfig.profile === 'leve' ? 1 : 0.7;
  const geo = new THREE.PlaneGeometry(sizeX, sizeZ, Math.round(sizeX / step), Math.round(sizeZ / step));
  geo.rotateX(-Math.PI / 2);
  geo.translate(minX + width / 2, 0, minZ + depth / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const palettes = Object.fromEntries(Object.entries(terrainColors).map(([k, list]) => [k, list.map((c) => new THREE.Color(c))]));
  const c = new THREE.Color();
  const tmp = new THREE.Color();
  let hasWater = false;

  const typeAt = (x, z) => {
    const col = Math.floor((x - minX) / cell);
    const row = Math.floor((z - minZ) / cell);
    return tileAt(col, row) ?? outside;
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const n1 = valueNoise(x * 0.25, z * 0.25);
    const n2 = valueNoise(x * 0.9 + 40, z * 0.9 - 17);
    // amostra 4 pontos em volta (com borda irregular) e mistura as cores
    let r = 0;
    let g = 0;
    let b = 0;
    let water = 0;
    const jx = (n2 - 0.5) * 0.9;
    const jz = (valueNoise(x * 0.9 - 9, z * 0.9 + 31) - 0.5) * 0.9;
    for (const [ox, oz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
      const type = typeAt(x + ox + jx, z + oz + jz);
      const pal = palettes[type] ?? palettes.grama;
      c.copy(pal[0]).lerp(pal[1], n1);
      if (pal[2]) c.lerp(pal[2], Math.max(0, n2 - 0.55) * 1.6);
      r += c.r;
      g += c.g;
      b += c.b;
      if (type === 'agua') water += 0.25;
    }
    tmp.setRGB(r / 4, g / 4, b / 4);
    // escurece fora do mapa
    const dx = Math.max(minX - x, 0, x - (minX + width));
    const dz = Math.max(minZ - z, 0, z - (minZ + depth));
    tmp.multiplyScalar(1 - THREE.MathUtils.smoothstep(Math.hypot(dx, dz), 2, 26) * 0.5);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
    if (water > 0) {
      hasWater = true;
      pos.setY(i, -0.45 * water);
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  mesh.renderOrder = 3; // depois do herói: o chão não dispara a silhueta
  mesh.name = 'ground';
  return { mesh, hasWater };
}

// --- luz da lua e do céu ---
function buildLights(group, amb) {
  group.add(new THREE.HemisphereLight(...amb.hemi));
  group.add(new THREE.AmbientLight(...amb.ambient));
  const moon = new THREE.DirectionalLight(...amb.moon);
  moon.castShadow = true;
  const size = graphicsConfig.shadowMapSize;
  moon.shadow.mapSize.set(size, size);
  Object.assign(moon.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 120 });
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.03;
  group.add(moon, moon.target);
  const offset = new THREE.Vector3(-22, 38, 14);
  const snap = 64 / size;
  return {
    followShadow(focus) {
      const fx = Math.round(focus.x / snap) * snap;
      const fz = Math.round(focus.z / snap) * snap;
      moon.target.position.set(fx, 0, fz);
      moon.position.set(fx + offset.x, offset.y, fz + offset.z);
    },
  };
}

// --- árvores instanciadas: tiles de mata + anel decorativo ---
function buildTrees({ group, assets, nav, map, cell, minX, minZ, width, depth, tileAt, rng }) {
  const kinds = ['tree_A', 'tree_B', 'trees_A_small', 'trees_B_small', 'trees_A_medium', 'trees_B_medium'];
  const shadowed = new Map(kinds.map((k) => [k, []]));
  const plain = new Map(kinds.map((k) => [k, []]));

  const isMata = (c, r) => tileAt(c, r) === 'mata' || (tileAt(c, r) === null && map.props.floresta_externa);
  const nearPath = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const t = tileAt(c + dc, r + dr);
        if (t && t !== 'bosque' && t !== 'mata') return true;
      }
    }
    return false;
  };
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const tile = tileAt(c, r);
      if (tile === 'mata') {
        const deep = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dc, dr]) => isMata(c + dc, r + dr));
        const x = minX + (c + 0.5) * cell + rng.range(-0.55, 0.55);
        const z = minZ + (r + 0.5) * cell + rng.range(-0.55, 0.55);
        const kind = deep && rng.next() < 0.25 ? (rng.next() < 0.5 ? 'trees_A_small' : 'trees_B_small') : rng.next() < 0.5 ? 'tree_A' : 'tree_B';
        const def = models[kind];
        // árvores da borda da mata um pouco menores: atrapalham menos a visão
        const size = (deep ? rng.range(0.85, 1.15) : rng.range(0.65, 0.85)) * (kind.startsWith('trees') ? 0.75 : 1);
        shadowed.get(kind).push({ x, z, scale: def.scale * size, rot: rng.next() * Math.PI * 2 });
      } else if (tile === 'bosque' && !nearPath(c, r) && rng.next() < 0.32) {
        // bosque: árvore solta, com colisão própria
        const kind = rng.next() < 0.5 ? 'tree_A' : 'tree_B';
        const x = minX + (c + 0.5) * cell + rng.range(-0.5, 0.5);
        const z = minZ + (r + 0.5) * cell + rng.range(-0.5, 0.5);
        const k = rng.range(0.6, 0.85);
        shadowed.get(kind).push({ x, z, scale: models[kind].scale * k, rot: rng.next() * Math.PI * 2 });
        nav.blockCircle(x, z, 0.45);
      }
    }
  }

  if (map.props.floresta_externa) {
    const count = Math.round((width + depth) * 4 * graphicsConfig.treeDensity);
    let placed = 0;
    let tries = 0;
    while (placed < count && tries++ < count * 30) {
      const x = rng.range(minX - MARGIN + 2, minX + width + MARGIN - 2);
      const z = rng.range(minZ - MARGIN + 2, minZ + depth + MARGIN - 2);
      const inside = x > minX - 1 && x < minX + width + 1 && z > minZ - 1 && z < minZ + depth + 1;
      if (inside) continue;
      const kind = kinds[Math.floor(rng.next() * 4)]; // só as espécies leves fora do mapa
      const near = Math.max(minX - x, x - (minX + width), minZ - z, z - (minZ + depth)) < 5;
      (near ? shadowed : plain).get(kind).push({ x, z, scale: models[kind].scale * rng.range(0.8, 1.25), rot: rng.next() * Math.PI * 2 });
      placed++;
    }
  }

  const created = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (const [bucket, shadows] of [[shadowed, true], [plain, false]]) {
    for (const [kind, list] of bucket) {
      if (!list.length) continue;
      for (const part of assets.meshParts(models[kind].path)) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, list.length);
        list.forEach(({ x, z, scale, rot }, i) => {
          q.setFromAxisAngle(up, rot);
          m4.compose(p.set(x, 0, z), q, s.set(scale, scale, scale)).multiply(part.matrix);
          mesh.setMatrixAt(i, m4);
        });
        mesh.castShadow = shadows;
        mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        group.add(mesh);
        created.push(mesh);
      }
    }
  }
  return [];
}

// --- vaga-lumes piscando ---
function createFireflies(count, minX, minZ, width, depth, rng) {
  const positions = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const base = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    base[i * 3] = rng.range(minX, minX + width);
    base[i * 3 + 1] = rng.range(0.6, 2.6);
    base[i * 3 + 2] = rng.range(minZ, minZ + depth);
    phase[i] = rng.next() * 100;
  }
  positions.set(base);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: getGlowTexture() }, uScale: { value: window.innerHeight / 2 } },
    vertexShader: `
      attribute float phase;
      uniform float uTime;
      uniform float uScale;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vAlpha = pow(max(0.0, sin(uTime * 1.3 + phase)), 3.0);
        gl_PointSize = 0.35 * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap;
      varying float vAlpha;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vec3(0.75, 1.0, 0.45) * t.a, t.a * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    object: points,
    update(_dt, t) {
      mat.uniforms.uTime.value = t;
      for (let i = 0; i < count; i++) {
        const ph = phase[i];
        positions[i * 3] = base[i * 3] + Math.sin(t * 0.3 + ph) * 1.2;
        positions[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.7 + ph * 2) * 0.3;
        positions[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.25 + ph) * 1.2;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
