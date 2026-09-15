// Cortina para troca de área e avisos curtos na tela
export function createCurtain(root) {
  const el = document.createElement('div');
  el.className = 'curtain';
  el.innerHTML = '<p class="curtain__text"></p>';
  root.appendChild(el);
  const text = el.querySelector('.curtain__text');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    async close(message) {
      text.textContent = message;
      el.classList.add('curtain--on');
      await wait(450);
    },
    async open() {
      el.classList.remove('curtain--on');
      await wait(450);
    },
  };
}

export function createToast(root) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  root.appendChild(el);
  let timer = 0;
  return (message) => {
    el.textContent = message;
    el.classList.add('toast--on');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('toast--on'), 2200);
  };
}
