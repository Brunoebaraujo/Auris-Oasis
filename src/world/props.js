import * as THREE from 'three';
import { palette } from '../config/graphics.js';
import { models } from './modelCatalog.js';
import { createGlow } from './fx.js';
import { makeOccludable } from '../systems/Occlusion.js';

const wood = () => new THREE.MeshStandardMaterial({ color: palette.timber, roughness: 1, flatShading: true });
const metal = () => new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.45, metalness: 0.6, flatShading: true });

function shadowy(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  makeOccludable(mesh.material);
  return mesh;
}

// Poste de madeira com tocha acesa (medieval)
export function createTorchPost(assets, x, z, seed = 0, withLight = true) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const post = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.8, 6), wood()));
  post.position.y = 0.9;
  const torch = assets.instance(models.torch.path);
  torch.position.y = 2.18;
  const light = withLight ? new THREE.PointLight(palette.torch, 11, 10, 1.7) : null;
  const glow = createGlow(palette.torch, 1.6);
  glow.position.y = 2.65;
  group.add(post, torch, glow);
  if (light) {
    light.position.y = 2.75;
    group.add(light);
  }
  return {
    object: group,
    collider: { x, z, radius: 0.2 },
    update(_dt, t) {
      const k = Math.sin(t * 13 + seed * 2.1) * 0.6 + Math.sin(t * 29 + seed) * 0.4;
      if (light) light.intensity = 11 + k * 1.8;
      glow.scale.setScalar(1.6 + k * 0.12);
    },
  };
}

// Lampião futurista: poste metálico com esfera de luz fria
export function createLamppost(x, z, seed = 0, withLight = true) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const pole = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 2.6, 8), metal()));
  pole.position.y = 1.3;
  const base = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.2, 8), metal()));
  base.position.y = 0.1;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 20), new THREE.MeshBasicMaterial({ color: palette.neon }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 2.75;
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), new THREE.MeshBasicMaterial({ color: 0xc8f6ff }));
  bulb.position.y = 2.75;
  const light = withLight ? new THREE.PointLight(palette.neon, 9, 10, 1.7) : null;
  const glow = createGlow(palette.neon, 1.5);
  glow.position.y = 2.75;
  group.add(pole, base, ring, bulb, glow);
  if (light) {
    light.position.y = 2.7;
    group.add(light);
  }
  return {
    object: group,
    collider: { x, z, radius: 0.35 },
    update(dt, t) {
      ring.rotation.z += dt * 1.2;
      ring.position.y = 2.75 + Math.sin(t * 2 + seed) * 0.05;
      if (light) light.intensity = 9 + Math.sin(t * 3 + seed) * 0.6;
    },
  };
}

// Ponte de tábuas sobre um retângulo (em unidades do mundo)
export function createBridge(x0, z0, x1, z1) {
  const group = new THREE.Group();
  const alongZ = Math.abs(z1 - z0) >= Math.abs(x1 - x0);
  const length = alongZ ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
  const width = alongZ ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  const mat = wood();
  makeOccludable(mat);
  const planks = Math.floor(length / 0.45);
  for (let i = 0; i < planks; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.12, 0.4), mat);
    plank.position.set(0, 0.06 + (i % 2) * 0.01, -length / 2 + 0.225 + i * (length / planks));
    plank.receiveShadow = true;
    plank.castShadow = true;
    group.add(plank);
  }
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, length), mat);
    rail.position.set((side * width) / 2, 0.75, 0);
    rail.castShadow = true;
    group.add(rail);
    for (let i = 0; i <= 3; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), mat);
      post.position.set((side * width) / 2, 0.4, -length / 2 + (i * length) / 3);
      post.castShadow = true;
      group.add(post);
    }
  }
  group.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  if (!alongZ) group.rotation.y = Math.PI / 2;
  return { object: group };
}

// Portão de pedra e metal da arena (fechado por enquanto)
export function createArenaGate(assets, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const stone = new THREE.MeshStandardMaterial({ color: 0x6d6a64, roughness: 0.95, flatShading: true });
  const add = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    group.add(shadowy(mesh));
    return mesh;
  };
  add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.6, 1.2), stone), 0, 2.3, -2.6);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.6, 1.2), stone), 0, 2.3, 2.6);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 6.6), stone), 0, 5, 0);
  const bars = metal();
  for (let i = -3; i <= 3; i++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6), bars), 0, 2.2, i * 0.55);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4), bars), 0, 3.4, 0);
  const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshBasicMaterial({ color: palette.torch }));
  emblem.position.set(-0.8, 5, 0);
  group.add(emblem);
  for (const side of [-1, 1]) {
    const torch = assets.instance(models.torch.path);
    torch.position.set(-0.8, 3.1, side * 2.6);
    const glow = createGlow(palette.torch, 1.4);
    glow.position.set(-0.8, 3.6, side * 2.6);
    group.add(torch, glow);
  }
  return {
    object: group,
    colliders: [
      { x, z: z - 2.6, radius: 0.85 },
      { x, z: z + 2.6, radius: 0.85 },
      { x, z, radius: 1.6 },
    ],
    update(dt) {
      emblem.rotation.y += dt;
    },
  };
}

// Fogueira apagada (acampamento abandonado)
export function createColdFire(assets, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const rocks = ['nature/rock_single_A', 'nature/rock_single_B', 'nature/rock_single_C'];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rock = assets.instance(rocks[i % 3]);
    rock.scale.setScalar(2);
    rock.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
    group.add(rock);
  }
  const ash = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshStandardMaterial({ color: 0x2a2624 }));
  ash.rotation.x = -Math.PI / 2;
  ash.position.y = 0.02;
  group.add(ash);
  return { object: group, collider: { x, z, radius: 1.1 } };
}
