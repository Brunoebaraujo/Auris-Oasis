// Entrada mínima de teclado. Mouse (clicar para andar) chega no M1.
export class Input {
  constructor(target = window) {
    this.handlers = new Map();
    this.down = new Set();
    target.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.down.add(e.code);
      (this.handlers.get(e.code) || []).forEach((fn) => fn(e));
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  onKey(code, fn) {
    if (!this.handlers.has(code)) this.handlers.set(code, []);
    this.handlers.get(code).push(fn);
  }

  isDown(code) {
    return this.down.has(code);
  }
}
