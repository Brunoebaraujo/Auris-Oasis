import * as THREE from 'three';
import { enemyTypes, playerCombat, rollDamage, skills } from '../config/combat.js';
import { Enemy } from '../entities/Enemy.js';

const PICK_RADIUS = 0.8;
const AUTO_TARGET_RANGE = 7;

// Sistema de combate: inimigos da área, golpes do herói, dano, morte e renascimento.
export class Combat {
  constructor({ game, assets, player, hud, onPlayerDeath }) {
    Object.assign(this, { game, assets, player, hud, onPlayerDeath });
    this.enemies = [];
    this.spawners = [];
    this.area = null;
    this.hovered = null;
    this.group = new THREE.Group();
    this.group.name = 'inimigos';
    game.scene.add(this.group);
    this.shake = 0;
    this.deathTimer = 0;
    player.onImpact = (action) => this.resolveStrike(action);
  }

  // Troca de área: remove inimigos antigos e cria os da nova área
  setArea(area) {
    this.enemies.forEach((e) => this.remove(e));
    this.enemies = [];
    this.hovered = null;
    this.area = area;
    this.spawners = (area.enemySpawns ?? []).flatMap((s) => {
      const type = enemyTypes[s.type];
      if (!type) {
        console.warn(`Inimigo desconhecido: ${s.type}`);
        return [];
      }
      return Array.from({ length: s.count }, () => ({ ...s, typeDef: type, timer: 0.2 + Math.random() * 1.5, enemy: null }));
    });
    if (this.player.hp > 0 && area.safe && playerCombat.hubHeals) this.player.hp = this.player.maxHp;
  }

  spawn(spawner) {
    const { nav } = this.area;
    let x = spawner.x;
    let z = spawner.z;
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * spawner.radius;
      const cx = spawner.x + Math.cos(a) * r;
      const cz = spawner.z + Math.sin(a) * r;
      if (nav.isWalkable(cx, cz)) {
        x = cx;
        z = cz;
        break;
      }
    }
    const enemy = new Enemy(this.assets, spawner.typeDef, { x, z });
    enemy.spawner = spawner;
    spawner.enemy = enemy;
    this.enemies.push(enemy);
    this.group.add(enemy.object);
    this.hud.addEnemyBar(enemy);
  }

  remove(enemy) {
    this.hud.removeEnemyBar(enemy);
    enemy.dispose();
  }

  // Inimigo sob o raio do mouse/toque
  pick(ray) {
    let best = null;
    let bestD = Infinity;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (const e of this.enemies) {
      if (e.dead) continue;
      a.set(e.position.x, 0.1, e.position.z);
      b.set(e.position.x, 1.9, e.position.z);
      const d = ray.distanceSqToSegment(a, b);
      const along = ray.origin.distanceTo(e.position);
      if (d < PICK_RADIUS * PICK_RADIUS && along < bestD) {
        best = e;
        bestD = along;
      }
    }
    return best;
  }

  setHovered(enemy) {
    this.hovered = enemy;
  }

  nearestEnemy(maxDist = AUTO_TARGET_RANGE) {
    let best = null;
    let bestD = maxDist;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = e.position.distanceTo(this.player.position);
      if (d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  // Botões de habilidade (toque ou teclas 1/2): alvo sob o cursor, senão o mais próximo
  useSkill(skillId) {
    const p = this.player;
    if (p.dead) return;
    if (p.cooldowns[skillId] > 0) {
      this.hud.toast?.(`${skills[skillId].name}: recarregando`);
      return;
    }
    const target = this.hovered && !this.hovered.dead ? this.hovered : this.nearestEnemy();
    if (target) p.attack(skillId, target);
    else p.strikeToward(skillId, p.position.x + Math.sin(p.facing), p.position.z + Math.cos(p.facing));
  }

  // Momento do impacto do golpe do herói: acerta todos no arco à frente
  resolveStrike(action) {
    const { skill } = action;
    const p = this.player;
    const facing = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    const cosArc = Math.cos(THREE.MathUtils.degToRad(skill.arc / 2));
    let hits = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const to = new THREE.Vector3().subVectors(e.position, p.position).setY(0);
      const dist = to.length();
      if (dist > skill.range + e.type.radius) continue;
      if (dist > 0.3 && facing.dot(to.normalize()) < cosArc) continue;
      const result = e.hit(rollDamage(skill.damage), { stun: skill.stun ?? 0 });
      hits++;
      this.hud.floatText(e.position, String(result.damage), 'damage');
      if (result.stunned) this.hud.floatText(e.position, 'Atordoado!', 'stun', 0.35);
    }
    if (hits) this.shake = Math.max(this.shake, skill.shake);
  }

  hitPlayer(amount) {
    const p = this.player;
    if (p.dead) return;
    p.takeDamage(amount);
    this.hud.floatText(p.position, String(amount), 'hurt');
    this.shake = Math.max(this.shake, 0.1);
    if (p.dead) {
      this.deathTimer = 2.2;
      this.hovered = null;
    }
  }

  update(dt) {
    if (!this.area) return;
    const p = this.player;
    const ctx = { player: p, nav: this.area.nav, hitPlayer: (amount, from) => this.hitPlayer(amount, from) };

    // renascimento dos inimigos
    for (const s of this.spawners) {
      if (s.enemy && !s.enemy.gone) continue;
      if (s.enemy?.gone) {
        this.remove(s.enemy);
        this.enemies = this.enemies.filter((e) => e !== s.enemy);
        s.enemy = null;
        s.timer = s.typeDef.respawn;
      }
      s.timer -= dt;
      if (s.timer <= 0) this.spawn(s);
    }

    for (const e of this.enemies) e.update(dt, ctx);
    this.separate();

    // vida do herói
    if (!p.dead && p.sinceHit > playerCombat.regenDelay) p.heal(playerCombat.regenPerSecond * dt);
    if (this.area.safe && !p.dead && playerCombat.hubHeals) p.heal(p.maxHp);
    if (p.dead && this.deathTimer > 0) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.onPlayerDeath?.();
    }

    // tremida da câmera
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 0.9);
      const k = this.shake;
      this.game.rig.shakeOffset.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    } else {
      this.game.rig.shakeOffset.set(0, 0, 0);
    }

    if (this.hovered?.dead) this.hovered = null;
    this.hud.setHealth(p.hp, p.maxHp);
    this.hud.setCooldowns(p.cooldowns);
  }

  // Afasta inimigos que se sobrepõem entre si e do herói
  separate() {
    const list = this.enemies.filter((e) => !e.dead);
    const nav = this.area.nav;
    const push = (e, dx, dz) => {
      const nx = e.position.x + dx;
      const nz = e.position.z + dz;
      if (nav.isWalkable(nx, nz)) e.position.set(nx, 0, nz);
    };
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const d = Math.hypot(dx, dz);
        const min = a.type.radius + b.type.radius;
        if (d > 0.001 && d < min) {
          const k = (min - d) / d / 2;
          push(a, -dx * k, -dz * k);
          push(b, dx * k, dz * k);
        }
      }
      if (!this.player.dead) {
        const dx = a.position.x - this.player.position.x;
        const dz = a.position.z - this.player.position.z;
        const d = Math.hypot(dx, dz);
        const min = a.type.radius + 0.45;
        if (d > 0.001 && d < min) push(a, (dx / d) * (min - d), (dz / d) * (min - d));
      }
    }
  }

  afterUpdate(camera, width, height, dt) {
    this.hud.updateWorldUi(camera, width, height, this.enemies, this.hovered, dt);
  }
}
