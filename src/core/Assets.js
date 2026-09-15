import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { makeOccludable } from '../systems/Occlusion.js';

const BASE = `${import.meta.env.BASE_URL}assets/models/`;

// Carrega e guarda os modelos .glb. Instâncias compartilham geometria e material.
export class Assets {
  constructor(onProgress) {
    this.cache = new Map();
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = (_url, loaded, total) => onProgress?.(loaded / total);
    this.loader = new GLTFLoader(this.manager);
    this.loader.setMeshoptDecoder(MeshoptDecoder);
  }

  async loadAll(paths) {
    const unique = [...new Set(paths)];
    await Promise.all(
      unique.map(async (path) => {
        const gltf = await this.loader.loadAsync(`${BASE}${path}.glb`);
        const scenery = !path.startsWith('characters/');
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (scenery) (Array.isArray(o.material) ? o.material : [o.material]).forEach(makeOccludable);
          }
        });
        this.cache.set(path, gltf);
      }),
    );
  }

  get(path) {
    const gltf = this.cache.get(path);
    if (!gltf) throw new Error(`Modelo não carregado: ${path}`);
    return gltf;
  }

  // Cópia leve para objetos estáticos
  instance(path) {
    return this.get(path).scene.clone(true);
  }

  // Cópia com esqueleto próprio para personagens animados
  character(path) {
    const gltf = this.get(path);
    return { scene: cloneSkinned(gltf.scene), animations: gltf.animations };
  }

  // Todas as malhas de um modelo, com a transformação local de cada uma
  meshParts(path) {
    const root = this.get(path).scene;
    root.updateMatrixWorld(true);
    const parts = [];
    root.traverse((o) => {
      if (o.isMesh) parts.push({ geometry: o.geometry, material: o.material, matrix: o.matrixWorld.clone() });
    });
    return parts;
  }
}
