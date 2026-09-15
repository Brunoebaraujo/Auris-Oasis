import * as THREE from 'three';

// Abre um "buraco" pontilhado em tudo que fica entre a câmera e o herói (estilo Diablo 4).
// Os materiais do cenário recebem um trecho de shader que descarta pixels
// dentro de um círculo em volta do herói e mais próximos da câmera do que ele.
const uniforms = {
  uHolePos: { value: new THREE.Vector2(-9999, -9999) },
  uHoleRadius: { value: 0 },
  uHoleDepth: { value: 0 },
};

const patched = new WeakSet();

export function makeOccludable(material) {
  if (!material || patched.has(material)) return;
  patched.add(material);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvViewDepth = -mvPosition.z;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vViewDepth;
uniform vec2 uHolePos;
uniform float uHoleRadius;
uniform float uHoleDepth;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uHoleRadius > 0.0 && vViewDepth < uHoleDepth) {
  float k = distance(gl_FragCoord.xy, uHolePos) / uHoleRadius;
  if (k < 1.0) {
    float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (k < 0.7 || n > (k - 0.7) / 0.3) discard;
  }
}`,
      );
  };
  material.customProgramCacheKey = () => 'auris-occludable';
  material.needsUpdate = true;
}

export function makeTreeOccludable(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(makeOccludable);
  });
}

export class Occlusion {
  constructor(renderer, rig, target, { radius = 2.1, height = 1.1 } = {}) {
    Object.assign(this, { renderer, rig, target, radius, height });
    this.v = new THREE.Vector3();
    this.side = new THREE.Vector3();
    this.size = new THREE.Vector2();
  }

  project(point, out) {
    const cam = this.rig.camera;
    out.copy(point).project(cam);
    this.renderer.getDrawingBufferSize(this.size);
    return [(out.x * 0.5 + 0.5) * this.size.x, (out.y * 0.5 + 0.5) * this.size.y];
  }

  update() {
    const cam = this.rig.camera;
    const center = this.v.copy(this.target.position);
    center.y += this.height;
    const [cx, cy] = this.project(center, new THREE.Vector3());

    // raio em pixels: projeta um ponto deslocado para a direita da câmera
    this.side.setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(this.radius).add(center);
    const [sx, sy] = this.project(this.side, new THREE.Vector3());

    uniforms.uHolePos.value.set(cx, cy);
    uniforms.uHoleRadius.value = Math.hypot(sx - cx, sy - cy);
    uniforms.uHoleDepth.value = center.applyMatrix4(cam.matrixWorldInverse).z * -1 - 0.9;
  }
}
