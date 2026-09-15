import * as THREE from 'three';
import './combat.css';
import { skills } from '../config/combat.js';
import { isTouch } from '../config/graphics.js';

const ICONS = {
  sword: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36 6l6 0 0 6-18 18-6-6z" fill="currentColor"/><path d="M13 27l8 8-3 3-2-2-5 5-3-3 5-5-2-2z" fill="currentColor" opacity=".75"/></svg>`,
  shield: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5l15 5v12c0 10-7 17-15 21C16 39 9 32 9 22V10z" fill="currentColor"/><path d="M24 11l9 3v8c0 6-4 11-9 14z" fill="#0d1316" opacity=".35"/></svg>`,
};

// Interface de combate: orbe de vida, barra de habilidades, números de dano e barras dos inimigos.
export function createCombatHud(root, { onSkill }) {
  // orbe de vida
  const orb = document.createElement('div');
  orb.className = 'orb';
  orb.setAttribute('role', 'meter');
  orb.setAttribute('aria-label', 'Vida');
  orb.innerHTML = '<div class="orb__fill"></div><span class="orb__text"></span>';
  root.appendChild(orb);
  const orbFill = orb.querySelector('.orb__fill');
  const orbText = orb.querySelector('.orb__text');

  // barra de habilidades
  const bar = document.createElement('div');
  bar.className = 'skillbar';
  const slots = {};
  for (const [id, skill] of Object.entries(skills)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skill';
    btn.setAttribute('aria-label', `${skill.name} (${isTouch ? 'tocar' : `${skill.button} ou tecla ${skill.key}`})`);
    btn.innerHTML = `${ICONS[id] ?? ''}<span class="skill__cd"></span><span class="skill__key">${isTouch ? '' : skill.key}</span>`;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onSkill(id);
    });
    btn.title = `${skill.name}: ${skill.button.toLowerCase()}`;
    bar.appendChild(btn);
    slots[id] = { btn, cd: btn.querySelector('.skill__cd'), max: skill.cooldown };
  }
  root.appendChild(bar);

  // camada de textos flutuantes e barras
  const layer = document.createElement('div');
  layer.className = 'combat-layer';
  root.appendChild(layer);
  const floaters = [];
  const bars = new Map();
  const nameplate = document.createElement('div');
  nameplate.className = 'nameplate';
  nameplate.innerHTML = '<span class="nameplate__name"></span><span class="nameplate__bar"><span></span></span>';
  root.appendChild(nameplate);

  const v = new THREE.Vector3();
  const project = (pos, y, camera, width, height) => {
    v.set(pos.x, y, pos.z).project(camera);
    return [(v.x * 0.5 + 0.5) * width, (-v.y * 0.5 + 0.5) * height, v.z < 1];
  };

  let lastHp = -1;
  return {
    setHealth(hp, max) {
      const value = Math.ceil(hp);
      if (value === lastHp) return;
      lastHp = value;
      orbFill.style.transform = `translateY(${(1 - hp / max) * 100}%)`;
      orbText.textContent = String(value);
      orb.setAttribute('aria-valuenow', String(value));
      orb.setAttribute('aria-valuemax', String(max));
      orb.classList.toggle('orb--low', hp / max < 0.3);
    },

    setCooldowns(cooldowns) {
      for (const [id, s] of Object.entries(slots)) {
        const left = cooldowns[id] ?? 0;
        const frac = s.max ? left / s.max : 0;
        s.cd.style.setProperty('--cd', frac.toFixed(3));
        s.cd.textContent = left > 0.05 ? Math.ceil(left) : '';
        s.btn.classList.toggle('skill--cooling', left > 0.05);
      }
    },

    floatText(pos, text, kind, delay = 0) {
      // o texto anima dentro de um invólucro que só cuida da posição
      const el = document.createElement('div');
      el.className = `floater floater--${kind}`;
      const inner = document.createElement('span');
      inner.textContent = text;
      inner.style.animationDelay = `${delay}s`;
      el.appendChild(inner);
      layer.appendChild(el);
      floaters.push({ el, pos: pos.clone(), age: -delay, jitter: (Math.random() - 0.5) * 30 });
    },

    addEnemyBar(enemy) {
      const el = document.createElement('div');
      el.className = 'ebar';
      el.innerHTML = '<span></span>';
      layer.appendChild(el);
      bars.set(enemy, { el, fill: el.firstElementChild });
    },

    removeEnemyBar(enemy) {
      bars.get(enemy)?.el.remove();
      bars.delete(enemy);
    },

    updateWorldUi(camera, width, height, enemies, hovered, dt = 1 / 60) {
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.age += dt;
        if (f.age > 1.1) {
          f.el.remove();
          floaters.splice(i, 1);
          continue;
        }
        const [x, y] = project(f.pos, 2.3, camera, width, height);
        const rise = Math.max(f.age, 0) * 60;
        f.el.style.transform = `translate(-50%, -50%) translate(${(x + f.jitter).toFixed(1)}px, ${(y - rise).toFixed(1)}px)`;
      }

      for (const e of enemies) {
        const b = bars.get(e);
        if (!b) continue;
        const show = !e.dead && (e.hp < e.type.maxHp || e === hovered) && e.state !== 'spawning';
        b.el.style.display = show ? 'block' : 'none';
        if (!show) continue;
        const [x, y, front] = project(e.position, 2.15, camera, width, height);
        if (!front) {
          b.el.style.display = 'none';
          continue;
        }
        b.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        b.fill.style.transform = `scaleX(${(e.hp / e.type.maxHp).toFixed(3)})`;
      }

      // nome e vida do inimigo sob o cursor, no topo da tela (estilo Diablo)
      if (hovered && !hovered.dead) {
        nameplate.classList.add('nameplate--on');
        nameplate.querySelector('.nameplate__name').textContent = hovered.name;
        nameplate.querySelector('.nameplate__bar span').style.transform = `scaleX(${(hovered.hp / hovered.type.maxHp).toFixed(3)})`;
      } else {
        nameplate.classList.remove('nameplate--on');
      }
    },
  };
}
