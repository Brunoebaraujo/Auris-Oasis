import { areas } from './areas.js';
import { buildArea } from './Area.js';
import { loadTiledMap } from './tiled.js';

const ENTER_RADIUS = 1.1;
const REARM_RADIUS = 2.6;
const NOTICE_RADIUS = 2.4;

// Carrega áreas, troca de área pelos portais e avisa sobre portais fechados.
export class WorldManager {
  constructor({ game, assets, player, labels, curtain, toast, onAreaChange, combat }) {
    Object.assign(this, { game, assets, player, labels, curtain, toast, onAreaChange, combat });
    this.area = null;
    this.busy = false;
    this.armed = new Set();
    this.noticed = new Set();
  }

  async load(id, arrival) {
    const def = areas[id];
    if (!def) throw new Error(`Área desconhecida: ${id}`);
    const map = await loadTiledMap(def.file);
    const next = buildArea(this.assets, map, id);

    if (this.area) this.area.dispose();
    this.area = next;
    const { scene } = this.game;
    scene.add(next.group);
    const [bg, near, far] = [next.ambience.background, ...next.ambience.fog];
    scene.background.setHex(bg);
    scene.fog.color.setHex(bg);
    scene.fog.near = near;
    scene.fog.far = far;

    const spawn = next.spawns.get(arrival ?? def.arrival) ?? next.spawns.values().next().value ?? [0, 0];
    this.player.setNav(next.nav);
    this.player.spawnAt(spawn[0], spawn[1]);
    this.game.rig.snapTo(this.player.object.position);
    this.labels.set(next.labels);
    this.combat?.setArea(next);
    this.armed.clear();
    this.noticed.clear();
    this.onAreaChange?.(next);
    return next;
  }

  async travel(portal, message) {
    if (this.busy) return;
    this.busy = true;
    this.player.stop();
    try {
      await this.curtain.close(message ?? `Atravessando o portal: ${portal.label}`);
      await this.load(portal.target, portal.arrival);
      portal.after?.();
    } catch (err) {
      console.error(err);
      this.toast('Não foi possível abrir este portal.');
    } finally {
      await this.curtain.open();
      this.busy = false;
    }
  }

  update(dt, t) {
    if (!this.area) return;
    this.area.update(dt, t);
    this.area.followShadow(this.game.rig.focus);
    if (this.busy) return;

    const p = this.player.position;
    for (const portal of this.area.portals) {
      const d = Math.hypot(p.x - portal.x, p.z - portal.z);
      if (d > REARM_RADIUS) {
        this.armed.add(portal);
        this.noticed.delete(portal);
      }
      if (portal.locked) {
        if (d < NOTICE_RADIUS && !this.noticed.has(portal)) {
          this.noticed.add(portal);
          this.toast(`${portal.label}: em breve`);
        }
        continue;
      }
      // só entra se o herói chegou de fora (evita voltar ao nascer em cima do portal)
      if (d < ENTER_RADIUS && this.armed.has(portal)) {
        this.travel(portal);
        return;
      }
    }
  }
}
