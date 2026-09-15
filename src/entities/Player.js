import * as THREE from 'three';
import { playerConfig } from '../config/player.js';
import { models } from '../world/modelCatalog.js';
import { palette } from '../config/graphics.js';

const ORDER_SILHOUETTE = 1;
const ORDER_HERO = 2;

// Herói controlado pelo jogador: animação, caminho a seguir e silhueta atrás de objetos.
export class Player {
  constructor(assets, nav, config = playerConfig) {
    this.config = config;
    this.nav = nav;
    this.path = [];
    this.object = new THREE.Group();
    this.object.name = 'player';

    const { scene, animations } = assets.character(models[config.model].path);
    scene.scale.setScalar(models[config.model].scale);
    scene.traverse((o) => {
      if (o.isMesh && !o.isSkinnedMesh) o.visible = config.loadout.includes(o.name);
    });
    this.model = scene;
    this.object.add(scene);

    this.mixer = new THREE.AnimationMixer(scene);
    const clip = (name) => {
      const c = animations.find((a) => a.name === name);
      if (!c) throw new Error(`Animação não encontrada: ${name}`);
      return this.mixer.clipAction(c);
    };
    this.actions = { idle: clip(config.animations.idle), run: clip(config.animations.run) };
    this.actions.run.timeScale = config.runAnimRate;
    this.current = this.actions.idle;
    this.current.play();

    this.addSilhouette(scene);

    // Lanterna: raio de luz em volta do herói
    this.lantern = new THREE.PointLight(palette.torch, 7, 8, 1.6);
    this.lantern.position.set(0, 2.6, 0.4);
    this.object.add(this.lantern);
  }

  // Cópia de cada malha visível que só aparece quando algo está na frente do herói
  addSilhouette(root) {
    const mat = new THREE.MeshBasicMaterial({
      color: this.config.silhouetteColor,
      depthFunc: THREE.GreaterDepth,
      depthWrite: false,
      fog: false,
    });
    const meshes = [];
    root.traverse((o) => {
      if (o.isMesh && o.visible) meshes.push(o);
    });
    for (const o of meshes) {
      o.renderOrder = ORDER_HERO;
      let ghost;
      if (o.isSkinnedMesh) {
        ghost = new THREE.SkinnedMesh(o.geometry, mat);
        ghost.bind(o.skeleton, o.bindMatrix);
      } else {
        ghost = new THREE.Mesh(o.geometry, mat);
      }
      ghost.position.copy(o.position);
      ghost.quaternion.copy(o.quaternion);
      ghost.scale.copy(o.scale);
      ghost.renderOrder = ORDER_SILHOUETTE;
      ghost.castShadow = false;
      ghost.receiveShadow = false;
      ghost.frustumCulled = false;
      o.parent.add(ghost);
    }
  }

  get position() {
    return this.object.position;
  }

  spawnAt(x, z) {
    this.object.position.set(x, 0, z);
    this.path = [];
  }

  moveTo(x, z) {
    const path = this.nav.findPath(this.position.x, this.position.z, x, z);
    this.path = path ?? [];
    return this.path.length ? this.path[this.path.length - 1] : null;
  }

  stop() {
    this.path = [];
  }

  get moving() {
    return this.path.length > 0;
  }

  play(action) {
    if (this.current === action) return;
    action.reset().fadeIn(this.config.fade).play();
    this.current.fadeOut(this.config.fade);
    this.current = action;
  }

  update(dt) {
    const { runSpeed, arriveDistance, turnSharpness } = this.config;
    let budget = runSpeed * dt;
    let heading = null;

    while (budget > 0 && this.path.length) {
      const [tx, tz] = this.path[0];
      const dx = tx - this.position.x;
      const dz = tz - this.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= arriveDistance) {
        this.path.shift();
        continue;
      }
      heading = Math.atan2(dx, dz);
      const step = Math.min(budget, dist);
      this.position.x += (dx / dist) * step;
      this.position.z += (dz / dist) * step;
      budget -= step;
      if (step >= dist - 1e-4) this.path.shift();
    }

    if (heading !== null) {
      const cur = this.object.rotation.y;
      const delta = Math.atan2(Math.sin(heading - cur), Math.cos(heading - cur));
      this.object.rotation.y = cur + delta * Math.min(1, dt * turnSharpness);
    }

    this.play(this.moving ? this.actions.run : this.actions.idle);
    this.mixer.update(dt);
  }
}
