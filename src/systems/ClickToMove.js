import * as THREE from 'three';
import { palette } from '../config/graphics.js';

const REPATH_INTERVAL = 0.12; // s, enquanto o botão está pressionado
const REPATH_MIN_SHIFT = 0.35;

// Clique para andar; segurar o botão faz o herói seguir o cursor (estilo Diablo).
export class ClickToMove {
  constructor(canvas, rig, player) {
    this.canvas = canvas;
    this.rig = rig;
    this.player = player;
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.ndc = new THREE.Vector2();
    this.hit = new THREE.Vector3();
    this.holding = false;
    this.timer = 0;
    this.lastTarget = new THREE.Vector3(Infinity, 0, Infinity);
    this.marker = createMarker();
    this.enabled = true;
    this.activePointer = null;
    this.touchCount = 0;

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') this.touchCount++;
      // segundo dedo = pinça de zoom: cancela o andar contínuo
      if (this.touchCount > 1) {
        this.holding = false;
        return;
      }
      if (e.button !== 0 || !this.enabled) return;
      this.activePointer = e.pointerId;
      this.holding = true;
      this.setPointer(e);
      this.command(true);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.activePointer === null || e.pointerId === this.activePointer) this.setPointer(e);
    });
    const release = (e) => {
      if (e.pointerType === 'touch') this.touchCount = Math.max(0, this.touchCount - 1);
      if (e.pointerId === this.activePointer) {
        this.holding = false;
        this.activePointer = null;
      }
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setPointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  pick() {
    this.raycaster.setFromCamera(this.ndc, this.rig.camera);
    return this.raycaster.ray.intersectPlane(this.plane, this.hit);
  }

  command(showMarker) {
    const p = this.pick();
    if (!p) return;
    if (!showMarker && p.distanceTo(this.lastTarget) < REPATH_MIN_SHIFT && this.player.moving) return;
    this.lastTarget.copy(p);
    const dest = this.player.moveTo(p.x, p.z);
    if (dest && showMarker) this.marker.show(dest[0], dest[1]);
  }

  update(dt) {
    this.marker.update(dt);
    if (!this.holding || !this.enabled) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = REPATH_INTERVAL;
      this.command(false);
    }
  }
}

// Anel que marca o destino do clique
function createMarker() {
  const mat = new THREE.MeshBasicMaterial({
    color: palette.torch,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 28), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 5;
  let age = Infinity;
  const DURATION = 0.55;
  return {
    object: ring,
    show(x, z) {
      ring.position.set(x, 0.04, z);
      age = 0;
    },
    update(dt) {
      if (age >= DURATION) {
        mat.opacity = 0;
        return;
      }
      age += dt;
      const k = Math.min(age / DURATION, 1);
      const s = 1.4 - 0.6 * k;
      ring.scale.set(s, s, s);
      mat.opacity = 0.9 * (1 - k * k);
    },
  };
}
