import './hud.css';

const MODE_LABEL = { orthographic: 'isométrica', perspective: 'perspectiva' };

export function createHud(root, { mode }) {
  const el = document.createElement('aside');
  el.className = 'hud';
  el.innerHTML = `
    <h1 class="hud__title">Auris Oasis</h1>
    <p class="hud__stage">Marco 0: fundação</p>
    <dl class="hud__keys">
      <dt>C</dt><dd>câmera <span data-mode></span></dd>
      <dt>Espaço</dt><dd>pausar o herói <span data-pause></span></dd>
      <dt>Roda</dt><dd>zoom</dd>
    </dl>`;
  root.appendChild(el);
  const modeEl = el.querySelector('[data-mode]');
  const pauseEl = el.querySelector('[data-pause]');
  const hud = {
    setMode(m) {
      modeEl.textContent = `(${MODE_LABEL[m]})`;
    },
    setPaused(p) {
      pauseEl.textContent = p ? '(parado)' : '';
    },
  };
  hud.setMode(mode);
  return hud;
}

export function showFatal(root, message) {
  const el = document.createElement('div');
  el.className = 'fatal';
  el.textContent = message;
  root.appendChild(el);
}
