import * as THREE from 'three';
import { palette } from '../config/graphics.js';

// Herói provisório que percorre a vila sozinho, para testar a câmera.
// No M1 ele passa a obedecer ao clique do mouse.
export function createPatrolHero(scene) {
  const hero = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, 0.9, 4, 10),
    new THREE.MeshStandardMaterial({ color: palette.hero, roughness: 0.7 }),
  );
  body.position.y = 0.85;
  body.castShadow = true;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x3a2c20 }));
  nose.position.set(0, 1.3, 0.38);
  const lantern = new THREE.PointLight(palette.torch, 6, 7, 1.6); // raio de luz do jogador
  lantern.position.y = 2;
  hero.add(body, nose, lantern);
  scene.add(hero);

  const waypoints = [
    [3, 3], [0, -6], [0, -22], [0, -8], [-8, -3], [-6, 7], [0, 10], [0, 22], [0, 9], [8, 4],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z));

  let index = 0;
  let wait = 0;
  let paused = false;
  const speed = 4.5;
  const dir = new THREE.Vector3();

  return {
    object: hero,
    togglePause() {
      paused = !paused;
      return paused;
    },
    update(dt, t) {
      body.position.y = 0.85 + Math.abs(Math.sin(t * 8)) * (paused || wait > 0 ? 0 : 0.06);
      if (paused) return;
      if (wait > 0) {
        wait -= dt;
        return;
      }
      const goal = waypoints[index];
      dir.subVectors(goal, hero.position);
      const dist = dir.length();
      if (dist < 0.1) {
        index = (index + 1) % waypoints.length;
        wait = index === 3 ? 1.5 : 0.3; // pausa olhando a caverna
        return;
      }
      dir.normalize();
      hero.position.addScaledVector(dir, Math.min(speed * dt, dist));
      const yaw = Math.atan2(dir.x, dir.z);
      hero.rotation.y += Math.atan2(Math.sin(yaw - hero.rotation.y), Math.cos(yaw - hero.rotation.y)) * Math.min(1, dt * 10);
    },
  };
}
