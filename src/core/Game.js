import * as THREE from 'three';
import { graphicsConfig } from '../config/graphics.js';
import { CameraRig } from './CameraRig.js';
import { Input } from './Input.js';

// Laço principal: renderer, cena, câmera e lista de sistemas a atualizar.
export class Game {
  constructor(container) {
    this.container = container;
    this.systems = [];
    this.timer = new THREE.Timer();
    this.timer.connect(document); // pausa o relógio quando a aba fica oculta

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, graphicsConfig.maxPixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = graphicsConfig.exposure;
    this.renderer.shadowMap.enabled = graphicsConfig.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const { color, near, far } = graphicsConfig.fog;
    this.scene.background = new THREE.Color(color);
    this.scene.fog = new THREE.Fog(color, near, far);

    this.input = new Input();
    this.resize();
    this.rig = new CameraRig(this.renderer.domElement);

    window.addEventListener('resize', () => this.resize());
  }

  add(system) {
    this.systems.push(system);
    return system;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.rig?.resize(w, h);
  }

  start() {
    this.renderer.setAnimationLoop((time) => {
      this.timer.update(time);
      const dt = Math.min(this.timer.getDelta(), 0.1);
      const t = this.timer.getElapsed();
      for (const s of this.systems) s.update?.(dt, t);
      this.rig.update(dt);
      this.renderer.render(this.scene, this.rig.camera);
    });
  }
}
