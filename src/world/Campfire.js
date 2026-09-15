import * as THREE from 'three';
import { palette } from '../config/graphics.js';
import { createGlow, getGlowTexture } from './fx.js';
import { createRng } from '../core/random.js';

// Fogueira da praça: pedras, lenha, chamas, brasas subindo e luz tremulante.
export function createCampfire(assets, [x, z]) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const rng = createRng(3);

  const rocks = ['nature/rock_single_A', 'nature/rock_single_B', 'nature/rock_single_C', 'nature/rock_single_D'];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rock = assets.instance(rocks[i % rocks.length]);
    rock.scale.setScalar(2.1 + rng.next() * 0.6);
    rock.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1);
    rock.rotation.y = rng.next() * Math.PI * 2;
    group.add(rock);
  }

  const wood = new THREE.MeshStandardMaterial({ color: palette.timber, roughness: 1, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.5, 6), wood);
    log.rotation.z = Math.PI / 2 - 0.35;
    log.rotation.y = (i / 3) * Math.PI;
    log.position.y = 0.3;
    log.castShadow = true;
    group.add(log);
  }

  const flameMat = (color, opacity) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [
    [0.5, 1.5, palette.torch, 0.85],
    [0.34, 1.9, 0xffc46b, 0.8],
    [0.18, 1.2, 0xfff1c2, 0.9],
  ].map(([r, h, color, op], i) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1, true), flameMat(color, op));
    f.position.y = h / 2 + 0.2;
    f.userData.phase = i * 1.7;
    group.add(f);
    return f;
  });

  const glow = createGlow(palette.torch, 5);
  glow.position.y = 1;
  group.add(glow);

  const light = new THREE.PointLight(palette.torch, 38, 18, 1.5);
  light.position.y = 1.8;
  group.add(light);

  // Brasas
  const COUNT = 70;
  const positions = new Float32Array(COUNT * 3);
  const life = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);
  const drift = new Float32Array(COUNT * 2);
  const respawn = (i) => {
    positions[i * 3] = (rng.next() - 0.5) * 0.6;
    positions[i * 3 + 1] = 0.4 + rng.next() * 0.4;
    positions[i * 3 + 2] = (rng.next() - 0.5) * 0.6;
    life[i] = 1.2 + rng.next() * 2;
    speed[i] = 0.8 + rng.next() * 1.4;
    drift[i * 2] = (rng.next() - 0.5) * 0.5;
    drift[i * 2 + 1] = (rng.next() - 0.5) * 0.5;
  };
  for (let i = 0; i < COUNT; i++) {
    respawn(i);
    life[i] *= rng.next();
  }
  const embersGeo = new THREE.BufferGeometry();
  embersGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const embers = new THREE.Points(
    embersGeo,
    new THREE.PointsMaterial({
      map: getGlowTexture(),
      color: 0xffb35c,
      size: 0.28,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  embers.frustumCulled = false;
  group.add(embers);

  return {
    object: group,
    collider: { x, z, radius: 1.35 },
    update(dt, t) {
      const pulse = Math.sin(t * 11) * 0.5 + Math.sin(t * 23.7) * 0.3 + Math.sin(t * 5.3) * 0.2;
      light.intensity = 38 + pulse * 6;
      glow.material.opacity = 0.55 + pulse * 0.08;
      flames.forEach((f) => {
        const p = f.userData.phase;
        f.scale.set(1 + Math.sin(t * 13 + p) * 0.08, 1 + Math.sin(t * 9 + p) * 0.14, 1 + Math.cos(t * 12 + p) * 0.08);
        f.rotation.y += dt * (1 + p);
      });
      for (let i = 0; i < COUNT; i++) {
        life[i] -= dt;
        if (life[i] <= 0) respawn(i);
        positions[i * 3] += drift[i * 2] * dt + Math.sin(t * 3 + i) * 0.004;
        positions[i * 3 + 1] += speed[i] * dt;
        positions[i * 3 + 2] += drift[i * 2 + 1] * dt;
      }
      embersGeo.attributes.position.needsUpdate = true;
    },
  };
}
