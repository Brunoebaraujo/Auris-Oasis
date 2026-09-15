import * as THREE from 'three';
import { cameraConfig } from '../config/camera.js';

// Câmera fixa estilo Diablo: não gira, segue um alvo, zoom curto.
export class CameraRig {
  constructor(canvas, config = cameraConfig) {
    this.config = { ...config };
    this.zoom = 1;
    this.focus = new THREE.Vector3();
    this.shakeOffset = new THREE.Vector3();
    this.target = null;

    const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    this.persp = new THREE.PerspectiveCamera(this.config.fovDeg, aspect, 0.1, 500);
    this.camera = this.config.mode === 'perspective' ? this.persp : this.ortho;

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        // No Windows, Shift + roda chega como rolagem horizontal (deltaX)
        const delta = e.deltaY || e.deltaX;
        if (!delta) return;
        if (e.shiftKey) {
          this.adjustPitch(Math.sign(delta) * this.config.pitch.step);
          return;
        }
        this.zoomBy(Math.sign(delta));
      },
      { passive: false },
    );

    // Pinça com dois dedos para zoom (celular)
    const touches = new Map();
    let pinchStart = 0;
    let zoomStart = 1;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        pinchStart = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomStart = this.zoom;
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (touches.size !== 2 || !pinchStart) return;
      const [a, b] = [...touches.values()];
      const ratio = pinchStart / Math.max(Math.hypot(a[0] - b[0], a[1] - b[1]), 1);
      const { min, max } = this.config.zoom;
      this.zoom = THREE.MathUtils.clamp(zoomStart * ratio, min, max);
      this.applyProjection();
    });
    const lift = (e) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinchStart = 0;
    };
    canvas.addEventListener('pointerup', lift);
    canvas.addEventListener('pointercancel', lift);

    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.place();
  }

  snapTo(position) {
    this.focus.copy(position);
    this.place();
  }

  zoomBy(steps) {
    const { min, max, step } = this.config.zoom;
    this.zoom = THREE.MathUtils.clamp(this.zoom + steps * step, min, max);
    this.applyProjection();
  }

  follow(object3d) {
    this.target = object3d;
    this.focus.copy(object3d.position);
    this.place();
  }

  adjustPitch(deltaDeg) {
    const { min, max } = this.config.pitch;
    this.config.pitchDeg = THREE.MathUtils.clamp(this.config.pitchDeg + deltaDeg, min, max);
    this.place();
    this.onChange?.(this.config);
  }

  toggleMode() {
    this.config.mode = this.config.mode === 'perspective' ? 'orthographic' : 'perspective';
    this.camera = this.config.mode === 'perspective' ? this.persp : this.ortho;
    this.applyProjection();
    this.place();
    this.onChange?.(this.config);
    return this.config.mode;
  }

  resize(width, height) {
    this.aspect = width / Math.max(height, 1);
    this.applyProjection();
  }

  // Altura visível do mundo. Em tela em pé (celular) abre um pouco mais,
  // senão a largura visível fica estreita demais.
  viewHeight() {
    const portrait = this.aspect < 1 ? Math.sqrt(1 / this.aspect) : 1;
    return this.config.orthoHeight * this.zoom * portrait;
  }

  applyProjection() {
    const h = this.viewHeight() / 2;
    Object.assign(this.ortho, { left: -h * this.aspect, right: h * this.aspect, top: h, bottom: -h });
    this.ortho.updateProjectionMatrix();

    this.persp.aspect = this.aspect;
    this.persp.updateProjectionMatrix();
  }

  offset() {
    const yaw = THREE.MathUtils.degToRad(this.config.yawDeg);
    const pitch = THREE.MathUtils.degToRad(this.config.pitchDeg);
    // Em perspectiva, afasta a câmera para enquadrar a mesma área da ortográfica
    const fov = THREE.MathUtils.degToRad(this.config.fovDeg);
    const dist =
      this.config.mode === 'perspective'
        ? this.viewHeight() / 2 / Math.tan(fov / 2)
        : this.config.distance;
    return new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * dist,
      Math.sin(pitch) * dist,
      Math.cos(yaw) * Math.cos(pitch) * dist,
    );
  }

  place() {
    this.camera.position.copy(this.focus).add(this.offset()).add(this.shakeOffset);
    this.camera.lookAt(this.focus);
  }

  update(dt) {
    if (this.target) {
      const k = 1 - Math.exp(-this.config.followSharpness * dt);
      this.focus.lerp(this.target.position, k);
    }
    this.place();
  }
}
