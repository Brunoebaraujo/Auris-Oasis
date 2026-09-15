// Tela de carregamento com barra de progresso
export function createLoading(root) {
  const el = document.createElement('div');
  el.className = 'loading';
  el.innerHTML = `
    <p class="loading__title">Auris Oasis</p>
    <div class="loading__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <span></span>
    </div>
    <p class="loading__text">Acendendo as tochas da vila</p>`;
  root.appendChild(el);
  const bar = el.querySelector('.loading__bar');
  const fill = bar.querySelector('span');
  return {
    progress(p) {
      const pct = Math.round(p * 100);
      fill.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(pct));
    },
    fail(message) {
      el.querySelector('.loading__text').textContent = message;
      el.classList.add('loading--error');
    },
    done() {
      el.classList.add('loading--done');
      setTimeout(() => el.remove(), 700);
    },
  };
}
