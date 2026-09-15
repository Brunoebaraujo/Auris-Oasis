import * as THREE from 'three';
import { palette } from '../config/graphics.js';
import { createGlow } from './fx.js';
import { makeOccludable } from '../systems/Occlusion.js';

const swirlVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const swirlFragment = `
uniform float uTime;
uniform vec3 uColor;
uniform float uActive;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float swirl = sin(a * 5.0 + r * 12.0 - uTime * 3.0) * 0.5 + 0.5;
  float core = smoothstep(1.0, 0.0, r);
  float rim = smoothstep(0.75, 1.0, r) * (1.0 - smoothstep(0.95, 1.0, r));
  float energy = mix(0.25, 1.0, uActive);
  vec3 col = uColor * (0.35 + swirl * 0.65) * core * energy + uColor * rim * 1.5 * energy;
  float alpha = clamp((core * (0.45 + swirl * 0.4) + rim) * mix(0.35, 0.95, uActive), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}`;

// Portal para outra área. Parado (bloqueado) ou ativo, com anel de pedra e metal.
export function createPortal({ x, z, color = palette.neon, locked = false, facing = 0 }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = facing;

  const stone = new THREE.MeshStandardMaterial({ color: 0x5f5d59, roughness: 0.95, flatShading: true });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4e5b66, roughness: 0.4, metalness: 0.7, flatShading: true });
  makeOccludable(stone);
  makeOccludable(metal);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.25, 12), stone);
  base.position.y = 0.12;
  base.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.2, 8, 24), stone);
  ring.position.y = 1.85;
  ring.castShadow = true;
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.08, 6, 32), metal);
  band.position.set(0, 1.85, 0.17);
  const runeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: locked ? 0.25 : 1 });
  const runes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), runeMat);
    rune.position.set(Math.cos(a) * 1.45, 1.85 + Math.sin(a) * 1.45, 0.24);
    rune.rotation.z = a;
    runes.push(rune);
  }
  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uActive: { value: locked ? 0 : 1 },
  };
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.3, 40),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: swirlVertex,
      fragmentShader: swirlFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  disc.position.y = 1.85;
  group.add(base, ring, band, disc, ...runes);

  // só portais ativos acendem luz de verdade (luzes custam desempenho)
  const light = locked ? null : new THREE.PointLight(color, 14, 9, 1.6);
  const glow = createGlow(color, locked ? 2 : 4.2);
  glow.position.y = 1.85;
  glow.material.opacity = locked ? 0.25 : 0.55;
  group.add(glow);
  if (light) {
    light.position.set(0, 1.9, 0.8);
    group.add(light);
  }

  return {
    object: group,
    x,
    z,
    locked,
    // o anel bloqueia as laterais; o centro é caminhável para o herói entrar
    colliders: [
      { x: x + Math.cos(facing) * 1.5, z: z - Math.sin(facing) * 1.5, radius: 0.35 },
      { x: x - Math.cos(facing) * 1.5, z: z + Math.sin(facing) * 1.5, radius: 0.35 },
    ],
    update(dt, t) {
      uniforms.uTime.value = t;
      if (!locked) {
        light.intensity = 14 + Math.sin(t * 4) * 2;
        glow.scale.setScalar(4.2 + Math.sin(t * 2.5) * 0.25);
      }
      band.rotation.z += dt * (locked ? 0.1 : 0.6);
    },
  };
}
