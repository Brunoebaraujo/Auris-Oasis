import * as THREE from 'three';

// Controla as animações de um personagem: laços (parado, correr) e golpes de uma vez só.
export class Animator {
  constructor(root, clips, fade = 0.15) {
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = new Map(clips.map((c) => [c.name, c]));
    this.actions = new Map();
    this.fade = fade;
    this.current = null;
  }

  action(name) {
    if (!this.actions.has(name)) {
      const clip = this.clips.get(name);
      if (!clip) throw new Error(`Animação não encontrada: ${name}`);
      this.actions.set(name, this.mixer.clipAction(clip));
    }
    return this.actions.get(name);
  }

  loop(name, timeScale = 1) {
    const a = this.action(name);
    a.timeScale = timeScale;
    if (this.current === a) return;
    a.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(this.fade).play();
    this.current?.fadeOut(this.fade);
    this.current = a;
  }

  // Toca uma vez, ajustada para durar `duration` segundos, e congela no último quadro
  once(name, duration, fade = 0.08) {
    const a = this.action(name);
    const clip = this.clips.get(name);
    a.reset();
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    a.timeScale = duration ? clip.duration / duration : 1;
    a.fadeIn(fade).play();
    if (this.current && this.current !== a) this.current.fadeOut(fade);
    this.current = a;
  }

  update(dt) {
    this.mixer.update(dt);
  }
}

// Clona os materiais para poder piscar um personagem sem afetar os outros
export function makeFlashable(root) {
  const mats = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    const m = o.material;
    if (m.emissive) mats.push({ m, color: m.emissive.clone(), intensity: m.emissiveIntensity });
  });
  let timer = 0;
  const color = new THREE.Color();
  return {
    flash(hex = 0xffffff, seconds = 0.12) {
      color.setHex(hex);
      timer = seconds;
    },
    update(dt) {
      if (timer <= 0) return;
      timer -= dt;
      const on = timer > 0;
      for (const e of mats) {
        if (on) {
          e.m.emissive.copy(color);
          e.m.emissiveIntensity = 0.9;
        } else {
          e.m.emissive.copy(e.color);
          e.m.emissiveIntensity = e.intensity;
        }
      }
    },
    setOpacity(alpha) {
      for (const e of mats) {
        e.m.transparent = alpha < 1;
        e.m.opacity = alpha;
      }
    },
  };
}
