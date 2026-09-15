import * as THREE from 'three';
import { cameraConfig } from '../config/camera.js';

// Câmera fixa estilo Diablo: não gira, segue um alvo, zoom curto.
export class CameraRig {
  constructor(canvas, config = cameraConfig) {
    this.config = { ...config };
    this.zoom = 1;
    this.focus = new THREE.Vector3();
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
        const { min, max, step } = this.config.zoom;
        this.zoom = THREE.MathUtils.clamp(this.zoom + Math.sign(delta) * step, min, max);
        this.applyProjection();
      },
      { passive: false },
    );

    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.place();
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

  applyProjection() {
    const h = (this.config.orthoHeight * this.zoom) / 2;
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
        ? (this.config.orthoHeight * this.zoom) / 2 / Math.tan(fov / 2)
        : this.config.distance;
    return new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * dist,
      Math.sin(pitch) * dist,
      Math.cos(yaw) * Math.cos(pitch) * dist,
    );
  }

  place() {
    this.camera.position.copy(this.focus).add(this.offset());
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
