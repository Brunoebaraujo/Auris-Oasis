import { Game } from './core/Game.js';
import { Assets } from './core/Assets.js';
import { allModelPaths } from './world/modelCatalog.js';
import { buildVillage } from './world/buildVillage.js';
import { vilaRecorte } from './world/maps/vilaRecorte.js';
import { Player } from './entities/Player.js';
import { ClickToMove } from './systems/ClickToMove.js';
import { createHud, showFatal } from './ui/hud.js';
import { createLoading } from './ui/loading.js';

const root = document.getElementById('app');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function boot() {
  const loading = createLoading(root);
  const assets = new Assets((p) => loading.progress(p));
  try {
    await assets.loadAll(allModelPaths());
  } catch (err) {
    console.error(err);
    loading.fail('Não foi possível carregar os modelos. Recarregue a página.');
    return;
  }

  const game = new Game(root);
  const village = buildVillage(game.scene, assets, vilaRecorte);
  const player = new Player(assets, village.nav);
  player.spawnAt(...village.spawn);
  game.scene.add(player.object);

  const controls = new ClickToMove(game.renderer.domElement, game.rig, player);
  game.scene.add(controls.marker.object);

  game.add(village);
  game.add(player);
  game.add(controls);
  game.add({ update: () => village.followShadow(game.rig.focus) });
  game.rig.follow(player.object);

  const hud = createHud(root, game.rig.config);
  game.rig.onChange = (cfg) => hud.setCamera(cfg);
  game.input.onKey('KeyC', () => game.rig.toggleMode());
  game.input.onKey('KeyG', () => (village.navDebug.visible = !village.navDebug.visible));
  game.input.onKey('KeyH', () => hud.toggle());
  game.input.onKey('KeyF', () => hud.toggleFps());
  game.add(hud);

  game.start();
  loading.done();
  window.__auris = { game, player, village }; // atalho de depuração no console
}

if (!webglAvailable()) {
  showFatal(root, 'Este navegador não suporta WebGL. Abra o Auris Oasis no Chrome, Edge ou Firefox atualizados.');
} else {
  boot();
}
