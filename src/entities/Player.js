import * as THREE from 'three';
import { playerConfig } from '../config/player.js';
import { playerCombat, skills } from '../config/combat.js';
import { models } from '../world/modelCatalog.js';
import { palette } from '../config/graphics.js';
import { Animator, makeFlashable } from './animation.js';

const ORDER_SILHOUETTE = 1;
const ORDER_HERO = 2;
const REPATH_TARGET = 0.25;

// Herói: movimento, golpes, vida e silhueta atrás de objetos.
export class Player {
  constructor(assets, nav, config = playerConfig) {
    this.config = config;
    this.nav = nav;
    this.path = [];
    this.object = new THREE.Group();
    this.object.name = 'player';

    const { scene, animations } = assets.character(models[config.model].path);
    scene.scale.setScalar(models[config.model].scale);
    scene.traverse((o) => {
      if (o.isMesh && !o.isSkinnedMesh) o.visible = config.loadout.includes(o.name);
    });
    this.model = scene;
    this.object.add(scene);
    this.anim = new Animator(scene, animations, config.fade);
    this.anim.loop(config.animations.idle);
    this.flashFx = makeFlashable(scene);
    this.addSilhouette(scene);

    this.lantern = new THREE.PointLight(palette.torch, 7, 8, 1.6);
    this.lantern.position.set(0, 2.6, 0.4);
    this.object.add(this.lantern);

    // combate
    this.maxHp = playerCombat.maxHp;
    this.hp = this.maxHp;
    this.dead = false;
    this.sinceHit = 99;
    this.action = null; // golpe em andamento
    this.intent = null; // golpe pendente (andando até o alvo)
    this.cooldowns = Object.fromEntries(Object.keys(skills).map((k) => [k, 0]));
    this.repathTimer = 0;
    this.onImpact = null; // definido pelo sistema de combate
  }

  addSilhouette(root) {
    const mat = new THREE.MeshBasicMaterial({
      color: this.config.silhouetteColor,
      depthFunc: THREE.GreaterDepth,
      depthWrite: false,
      fog: false,
    });
    const meshes = [];
    root.traverse((o) => {
      if (o.isMesh && o.visible) meshes.push(o);
    });
    for (const o of meshes) {
      o.renderOrder = ORDER_HERO;
      let ghost;
      if (o.isSkinnedMesh) {
        ghost = new THREE.SkinnedMesh(o.geometry, mat);
        ghost.bind(o.skeleton, o.bindMatrix);
      } else {
        ghost = new THREE.Mesh(o.geometry, mat);
      }
      ghost.position.copy(o.position);
      ghost.quaternion.copy(o.quaternion);
      ghost.scale.copy(o.scale);
      ghost.renderOrder = ORDER_SILHOUETTE;
      ghost.castShadow = false;
      ghost.frustumCulled = false;
      o.parent.add(ghost);
    }
  }

  setNav(nav) {
    this.nav = nav;
    this.path = [];
  }

  get position() {
    return this.object.position;
  }

  spawnAt(x, z) {
    this.object.position.set(x, 0, z);
    this.path = [];
    this.action = null;
    this.intent = null;
  }

  revive() {
    this.dead = false;
    this.hp = this.maxHp;
    this.sinceHit = 99;
    this.anim.loop(this.config.animations.idle);
  }

  moveTo(x, z) {
    if (this.dead) return null;
    this.intent = null;
    const path = this.nav.findPath(this.position.x, this.position.z, x, z);
    this.path = path ?? [];
    return this.path.length ? this.path[this.path.length - 1] : null;
  }

  stop() {
    this.path = [];
    this.intent = null;
  }

  get moving() {
    return this.path.length > 0;
  }

  get busy() {
    return Boolean(this.action);
  }

  // Golpe contra um inimigo: anda até ele se estiver longe
  attack(skillId, target) {
    if (this.dead || !target || target.dead) return;
    if (this.intent?.target !== target || this.intent.skill !== skillId) this.repathTimer = 0;
    this.intent = { skill: skillId, target };
  }

  // Golpe na direção de um ponto, sem sair do lugar
  strikeToward(skillId, x, z) {
    if (this.dead) return false;
    this.intent = null;
    this.path = [];
    return this.startAction(skillId, null, Math.atan2(x - this.position.x, z - this.position.z));
  }

  ready(skillId) {
    return this.cooldowns[skillId] <= 0 && !this.action && !this.dead;
  }

  startAction(skillId, target, heading) {
    if (!this.ready(skillId)) return false;
    const skill = skills[skillId];
    this.action = { skillId, skill, target, heading, elapsed: 0, impacted: false };
    this.cooldowns[skillId] = skill.cooldown;
    this.path = [];
    this.anim.once(skill.animation, skill.duration);
    return true;
  }

  takeDamage(amount) {
    if (this.dead) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.sinceHit = 0;
    this.flashFx.flash(0xff3b2f, 0.14);
    if (this.hp === 0) {
      this.dead = true;
      this.action = null;
      this.intent = null;
      this.path = [];
      this.anim.once(this.config.animations.death, 1.1);
    }
    return amount;
  }

  heal(amount) {
    if (this.dead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  get facing() {
    return this.object.rotation.y;
  }

  turnTowards(heading, dt, sharpness = this.config.turnSharpness) {
    const cur = this.object.rotation.y;
    const delta = Math.atan2(Math.sin(heading - cur), Math.cos(heading - cur));
    this.object.rotation.y = cur + delta * Math.min(1, dt * sharpness);
  }

  update(dt) {
    for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    this.sinceHit += dt;
    this.flashFx.update(dt);

    if (this.dead) {
      this.anim.update(dt);
      return;
    }

    // golpe em andamento: fica parado, virado para o alvo
    if (this.action) {
      const a = this.action;
      a.elapsed += dt;
      const heading = a.target && !a.target.dead ? Math.atan2(a.target.position.x - this.position.x, a.target.position.z - this.position.z) : a.heading;
      if (heading !== undefined && heading !== null) this.turnTowards(heading, dt, 22);
      if (!a.impacted && a.elapsed >= a.skill.impactAt) {
        a.impacted = true;
        this.onImpact?.(a);
      }
      if (a.elapsed >= a.skill.duration) this.action = null;
      this.anim.update(dt);
      return;
    }

    // golpe pendente: aproxima-se do alvo e golpeia
    if (this.intent) {
      const { target, skill: skillId } = this.intent;
      if (target.dead) {
        this.intent = null;
      } else {
        const skill = skills[skillId];
        const dx = target.position.x - this.position.x;
        const dz = target.position.z - this.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= skill.range * 0.85) {
          this.path = [];
          if (this.startAction(skillId, target, Math.atan2(dx, dz))) {
            this.intent = null;
          } else {
            this.turnTowards(Math.atan2(dx, dz), dt);
          }
        } else {
          this.repathTimer -= dt;
          if (this.repathTimer <= 0) {
            this.repathTimer = REPATH_TARGET;
            const back = (skill.range * 0.7) / dist;
            this.path = this.nav.findPath(this.position.x, this.position.z, target.position.x - dx * back, target.position.z - dz * back) ?? [];
          }
        }
      }
    }

    // andar
    const { runSpeed, arriveDistance } = this.config;
    let budget = runSpeed * dt;
    let heading = null;
    while (budget > 0 && this.path.length) {
      const [tx, tz] = this.path[0];
      const dx = tx - this.position.x;
      const dz = tz - this.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= arriveDistance) {
        this.path.shift();
        continue;
      }
      heading = Math.atan2(dx, dz);
      const step = Math.min(budget, dist);
      this.position.x += (dx / dist) * step;
      this.position.z += (dz / dist) * step;
      budget -= step;
      if (step >= dist - 1e-4) this.path.shift();
    }
    if (heading !== null) this.turnTowards(heading, dt);

    if (this.moving) this.anim.loop(this.config.animations.run, this.config.runAnimRate);
    else this.anim.loop(this.config.animations.idle);
    this.anim.update(dt);
  }
}
