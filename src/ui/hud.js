import './hud.css';

const MODE_LABEL = { orthographic: 'isométrica', perspective: 'perspectiva' };

export function createHud(root, camera) {
  const el = document.createElement('aside');
  el.className = 'hud';
  el.innerHTML = `
    <h1 class="hud__title">Auris Oasis</h1>
    <p class="hud__stage">Marco 1: a vila</p>
    <dl class="hud__keys">
      <dt>Clique</dt><dd>andar (segure para seguir o cursor)</dd>
      <dt>Roda</dt><dd>zoom</dd>
      <dt>Shift + roda</dt><dd>inclinação <span data-pitch></span></dd>
      <dt>C</dt><dd>câmera <span data-mode></span></dd>
      <dt>G</dt><dd>grade de navegação</dd>
      <dt>F</dt><dd>quadros por segundo</dd>
      <dt>H</dt><dd>esconder este painel</dd>
    </dl>`;
  root.appendChild(el);

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
  const hud = {
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
    setCamera({ mode, pitchDeg }) {
      modeEl.textContent = `(${MODE_LABEL[mode]})`;
      pitchEl.textContent = `(${pitchDeg}°)`;
    },
    toggle() {
      el.hidden = !el.hidden;
    },
  };
  hud.setCamera(camera);
  return hud;
}

export function showFatal(root, message) {
  const el = document.createElement('div');
  el.className = 'fatal';
  el.textContent = message;
  root.appendChild(el);
}
