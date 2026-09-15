import { Game } from './core/Game.js';
import { Assets } from './core/Assets.js';
import { allModelPaths } from './world/modelCatalog.js';
import { WorldManager } from './world/WorldManager.js';
import { startArea, areas } from './world/areas.js';
import { Player } from './entities/Player.js';
import { ClickToMove } from './systems/ClickToMove.js';
import { Occlusion } from './systems/Occlusion.js';
import { Combat } from './systems/Combat.js';
import { createHud, showFatal } from './ui/hud.js';
import { createCombatHud } from './ui/combatHud.js';
import { createLoading } from './ui/loading.js';
import { WorldLabels } from './ui/labels.js';
import { createCurtain, createToast } from './ui/transition.js';

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
  const assets = new Assets((p) => loading.progress(p * 0.9));
  try {
    await assets.loadAll(allModelPaths());

    const game = new Game(root);
    const player = new Player(assets, null);
    game.scene.add(player.object);

    const labels = new WorldLabels(root);
    const hud = createHud(root, game.rig.config);
    const toast = createToast(root);
    let combat = null;
    const combatHud = createCombatHud(root, { onSkill: (id) => combat?.useSkill(id) });
    combatHud.toast = toast;

    const world = new WorldManager({
      game,
      assets,
      player,
      labels,
      curtain: createCurtain(root),
      toast,
      onAreaChange: (area) => hud.setArea(area.name),
    });

    combat = new Combat({
      game,
      assets,
      player,
      hud: combatHud,
      // ao cair, volta para a Aldeia com a vida cheia
      onPlayerDeath: () =>
        world.travel(
          { target: startArea, arrival: areas[startArea].arrival, label: 'Aldeia', after: () => player.revive() },
          'Você caiu. Voltando à Aldeia…',
        ),
    });
    world.combat = combat;

    const controls = new ClickToMove(game.renderer.domElement, game.rig, player, combat);
    game.scene.add(controls.marker.object);
    const occlusion = new Occlusion(game.renderer, game.rig, player.object, { radius: 2.6 });

    game.rig.follow(player.object);
    game.rig.onChange = (cfg) => hud.setCamera(cfg);

    game.add(world);
    game.add({ update: () => (controls.enabled = !world.busy && !player.dead) });
    game.add(controls);
    game.add(player);
    game.add(combat);
    game.add(occlusion);
    game.add(hud);
    game.afterUpdate = (dt) => {
      labels.update(game.rig.camera, root.clientWidth, root.clientHeight, game.rig.focus);
      combat.afterUpdate(game.rig.camera, root.clientWidth, root.clientHeight, dt);
    };

    game.input.onKey('KeyC', () => game.rig.toggleMode());
    game.input.onKey('KeyG', () => world.area && (world.area.navDebug.visible = !world.area.navDebug.visible));
    game.input.onKey('KeyH', () => hud.toggle());
    game.input.onKey('KeyF', () => hud.toggleFps());
    game.input.onKey('Digit1', () => combat.useSkill('sword'));
    game.input.onKey('Digit2', () => combat.useSkill('shield'));
    game.input.onKey('Numpad1', () => combat.useSkill('sword'));
    game.input.onKey('Numpad2', () => combat.useSkill('shield'));

    await world.load(startArea);
    loading.progress(1);
    game.start();
    loading.done();
    window.__auris = { game, player, world, combat }; // atalho de depuração no console
  } catch (err) {
    console.error(err);
    loading.fail('Não foi possível carregar o jogo. Recarregue a página.');
  }
}

if (!webglAvailable()) {
  showFatal(root, 'Este navegador não suporta WebGL. Abra o Auris Oasis no Chrome, Edge ou Firefox atualizados.');
} else {
  boot();
}
