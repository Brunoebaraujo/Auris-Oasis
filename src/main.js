import { Game } from './core/Game.js';
import { buildTestScene } from './world/testScene.js';
import { createPatrolHero } from './world/patrol.js';
import { createHud, showFatal } from './ui/hud.js';

const root = document.getElementById('app');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (!webglAvailable()) {
  showFatal(root, 'Este navegador não suporta WebGL. Abra o Auris Oasis no Chrome, Edge ou Firefox atualizados.');
} else {
  const game = new Game(root);
  const world = buildTestScene(game.scene);
  const hero = createPatrolHero(game.scene);

  game.add(world.flicker);
  game.add(hero);
  game.add({ update: () => world.followShadow(game.rig.focus) });
  game.rig.follow(hero.object);

  const hud = createHud(root, { mode: game.rig.config.mode });
  game.input.onKey('KeyC', () => hud.setMode(game.rig.toggleMode()));
  game.input.onKey('Space', (e) => {
    e.preventDefault();
    hud.setPaused(hero.togglePause());
  });

  game.start();
  window.__auris = game; // atalho de depuração no console
}
