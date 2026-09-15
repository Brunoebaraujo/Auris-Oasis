import './hud.css';
import { isTouch } from '../config/graphics.js';

const MODE_LABEL = { orthographic: 'isométrica', perspective: 'perspectiva' };

const DESKTOP_KEYS = `
  <dt>Esquerdo</dt><dd>andar; no inimigo, espadada (segure para continuar)</dd>
  <dt>Direito</dt><dd>golpe de escudo: atordoa por 2 s</dd>
  <dt>1 / 2</dt><dd>espadada / escudo no inimigo mais próximo</dd>
  <dt>Roda</dt><dd>zoom</dd>
  <dt>Shift + roda</dt><dd>inclinação <span data-pitch></span></dd>
  <dt>C</dt><dd>câmera <span data-mode></span></dd>
  <dt>G</dt><dd>grade de navegação</dd>
  <dt>F</dt><dd>quadros por segundo</dd>
  <dt>H</dt><dd>esconder este painel</dd>`;

const TOUCH_KEYS = `
  <dt>Toque</dt><dd>andar (segure para seguir o dedo); no inimigo, espadada</dd>
  <dt>Botões</dt><dd>espada e escudo no inimigo mais próximo</dd>
  <dt>Pinça</dt><dd>zoom</dd>
  <dt>Portais</dt><dd>entre no círculo para viajar</dd>
  <span hidden data-pitch></span><span hidden data-mode></span>`;

export function createHud(root, camera) {
  const el = document.createElement('aside');
  el.className = 'hud';
  el.id = 'painel-ajuda';
  el.innerHTML = `
    <h1 class="hud__title">Auris Oasis</h1>
    <p class="hud__stage">Marco 5: <span data-area>Aldeia</span></p>
    <dl class="hud__keys">${isTouch ? TOUCH_KEYS : DESKTOP_KEYS}</dl>`;
  root.appendChild(el);

  const areaName = document.createElement('p');
  areaName.className = 'area-name';
  root.appendChild(areaName);

  const help = document.createElement('button');
  help.className = 'help-button';
  help.type = 'button';
  help.textContent = '?';
  help.setAttribute('aria-controls', 'painel-ajuda');
  help.setAttribute('aria-label', 'Mostrar ou esconder a ajuda');
  root.appendChild(help);

  const vignette = document.createElement('div');
  vignette.className = 'vignette';
  root.appendChild(vignette);

  const fps = document.createElement('output');
  fps.className = 'fps';
  fps.hidden = true;
  root.appendChild(fps);
  let frames = 0;
  let acc = 0;

  const modeEl = el.querySelector('[data-mode]');
  const pitchEl = el.querySelector('[data-pitch]');
  const areaEl = el.querySelector('[data-area]');

  const hud = {
    setCamera({ mode, pitchDeg }) {
      modeEl.textContent = `(${MODE_LABEL[mode]})`;
      pitchEl.textContent = `(${pitchDeg}°)`;
    },
    setArea(name) {
      areaEl.textContent = name;
      areaName.textContent = name;
      areaName.classList.remove('area-name--on');
      void areaName.offsetWidth; // reinicia a animação
      areaName.classList.add('area-name--on');
    },
    toggle() {
      el.hidden = !el.hidden;
      help.setAttribute('aria-expanded', String(!el.hidden));
    },
    toggleFps() {
      fps.hidden = !fps.hidden;
    },
    update(dt) {
      if (fps.hidden) return;
      frames++;
      acc += dt;
      if (acc >= 0.5) {
        fps.textContent = `${Math.round(frames / acc)} qps`;
        frames = 0;
        acc = 0;
      }
    },
  };
  help.addEventListener('click', () => hud.toggle());
  // em telas pequenas a ajuda começa fechada
  if (window.matchMedia('(max-width: 700px)').matches) el.hidden = true;
  help.setAttribute('aria-expanded', String(!el.hidden));
  hud.setCamera(camera);
  return hud;
}

export function showFatal(root, message) {
  const el = document.createElement('div');
  el.className = 'fatal';
  el.textContent = message;
  root.appendChild(el);
}
