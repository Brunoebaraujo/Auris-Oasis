import * as THREE from 'three';

// Rótulos em HTML presos a pontos do mundo (portais, e no M3 os NPCs)
export class WorldLabels {
  constructor(root) {
    this.layer = document.createElement('div');
    this.layer.className = 'labels';
    root.appendChild(this.layer);
    this.items = [];
    this.v = new THREE.Vector3();
  }

  set(list) {
    this.clear();
    for (const l of list) {
      const el = document.createElement('div');
      el.className = 'label';
      el.innerHTML = `<span class="label__name"></span>${l.sub ? '<span class="label__sub"></span>' : ''}`;
      el.querySelector('.label__name').textContent = l.text;
      if (l.sub) el.querySelector('.label__sub').textContent = l.sub;
      this.layer.appendChild(el);
      this.items.push({ el, pos: new THREE.Vector3(l.x, l.y, l.z) });
    }
  }

  clear() {
    this.items.forEach((i) => i.el.remove());
    this.items = [];
  }

  update(camera, width, height, focus) {
    for (const { el, pos } of this.items) {
      const dist = Math.hypot(pos.x - focus.x, pos.z - focus.z);
      this.v.copy(pos).project(camera);
      const visible = this.v.z < 1 && Math.abs(this.v.x) < 1.2 && Math.abs(this.v.y) < 1.2 && dist < 24;
      el.style.opacity = visible ? String(THREE.MathUtils.clamp((24 - dist) / 6, 0, 1)) : '0';
      if (!visible) continue;
      const x = (this.v.x * 0.5 + 0.5) * width;
      const y = (-this.v.y * 0.5 + 0.5) * height;
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }
}
