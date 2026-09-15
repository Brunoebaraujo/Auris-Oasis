import * as THREE from 'three';
import { models } from '../world/modelCatalog.js';
import { rollDamage } from '../config/combat.js';
import { Animator, makeFlashable } from './animation.js';

const REPATH = 0.35;

// Inimigo com IA simples: parado/vagando → persegue → ataca; pode ser atordoado; morre e volta.
export class Enemy {
  constructor(assets, type, { x, z, home }) {
    this.type = type;
    this.name = type.name;
    this.home = new THREE.Vector3(home?.[0] ?? x, 0, home?.[1] ?? z);
    this.object = new THREE.Group();
    this.object.position.set(x, 0, z);
    this.object.rotation.y = Math.random() * Math.PI * 2;

    const def = models[type.model];
    const { scene, animations } = assets.character(def.path);
    scene.scale.setScalar(def.scale);
    this.object.add(scene);
    this.anim = new Animator(scene, animations, 0.15);
    this.fx = makeFlashable(scene);

    this.stunFx = createStunStars();
    this.stunFx.object.position.y = 2.25;
    this.object.add(this.stunFx.object);

    this.path = [];
    this.repath = 0;
    this.attackCooldown = 1;
    this.wanderTimer = 2 + Math.random() * 3;
    this.state = 'spawning';
    this.stateTime = 0;
    this.hp = type.maxHp;
    this.dead = false;
    this.gone = false; // já afundou e sumiu
    this.stunLeft = 0;
    this.impactDone = false;
    this.flinch = 0;
    this.anim.once(type.animations.spawn, 2.2);
  }

  get position() {
    return this.object.position;
  }

  get alive() {
    return !this.dead;
  }

  setState(state) {
    this.state = state;
    this.stateTime = 0;
  }

  // Recebe dano; `stun` em segundos (opcional)
  hit(amount, { stun = 0 } = {}) {
    if (this.dead) return { damage: 0 };
    this.hp = Math.max(0, this.hp - amount);
    this.fx.flash(stun ? 0xffd166 : 0xffffff, 0.12);
    this.aggro = true;
    if (this.hp === 0) {
      this.die();
      return { damage: amount, killed: true };
    }
    if (stun > 0) {
      this.stunLeft = Math.max(this.stunLeft, stun);
      this.path = [];
      this.setState('stunned');
      this.anim.once(this.type.animations.stunned, 0.6);
      return { damage: amount, stunned: true };
    }
    // golpe interrompe só se ele não estiver no meio do próprio ataque
    if (this.state !== 'attack') {
      this.flinch = 0.3;
      this.anim.once(this.type.animations.hit, 0.4);
    }
    return { damage: amount };
  }

  die() {
    this.dead = true;
    this.stunLeft = 0;
    this.stunFx.object.visible = false;
    this.path = [];
    this.setState('dead');
    this.anim.once(this.type.animations.death, 1.6);
  }

  update(dt, ctx) {
    const { player, nav } = ctx;
    const t = this.type;
    this.stateTime += dt;
    this.fx.update(dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // cambaleia um instante depois de apanhar
    if (this.flinch > 0 && ['idle', 'chase', 'return'].includes(this.state)) {
      this.flinch -= dt;
      this.anim.update(dt);
      return;
    }

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position).setY(0);
    const distPlayer = toPlayer.length();
    const distHome = this.position.distanceTo(this.home);

    switch (this.state) {
      case 'spawning':
        if (this.stateTime > 2.2) {
          this.setState('idle');
          this.anim.loop(t.animations.idle);
        }
        break;

      case 'dead':
        // depois de cair, afunda e some
        if (this.stateTime > 3) {
          this.object.position.y -= dt * 0.6;
          if (this.stateTime > 5) this.gone = true;
        }
        break;

      case 'stunned':
        this.stunLeft -= dt;
        this.stunFx.object.visible = true;
        this.stunFx.update(dt);
        if (this.stunLeft <= 0) {
          this.stunFx.object.visible = false;
          this.setState(player.dead ? 'return' : 'chase');
        } else if (this.stateTime > 0.6) {
          this.anim.loop(t.animations.idle, 0.4);
        }
        break;

      case 'idle': {
        this.anim.loop(this.path.length ? t.animations.walk : t.animations.idle, this.path.length ? 0.8 : 1);
        if (!player.dead && (distPlayer < t.aggroRadius || this.aggro)) {
          this.setState('chase');
          break;
        }
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 3 + Math.random() * 4;
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 3;
          this.path = nav.findPath(this.position.x, this.position.z, this.home.x + Math.cos(a) * r, this.home.z + Math.sin(a) * r) ?? [];
        }
        this.follow(dt, t.speed * 0.4);
        break;
      }

      case 'chase':
        if (player.dead || distHome > t.leashRadius) {
          this.aggro = false;
          this.setState('return');
          break;
        }
        if (distPlayer <= t.attackRange) {
          this.path = [];
          this.face(toPlayer, dt);
          this.anim.loop(t.animations.idle);
          if (this.attackCooldown <= 0) {
            this.setState('attack');
            this.impactDone = false;
            this.attackCooldown = t.attackInterval;
            this.anim.once(t.animations.attack, t.attackDuration);
          }
          break;
        }
        this.repath -= dt;
        if (this.repath <= 0) {
          this.repath = REPATH;
          const back = (t.attackRange * 0.8) / Math.max(distPlayer, 0.001);
          this.path = nav.findPath(this.position.x, this.position.z, player.position.x - toPlayer.x * back, player.position.z - toPlayer.z * back) ?? [];
        }
        this.anim.loop(t.animations.run);
        this.follow(dt, t.speed);
        break;

      case 'attack':
        this.face(toPlayer, dt);
        if (!this.impactDone && this.stateTime >= t.attackImpactAt) {
          this.impactDone = true;
          // acerta se o herói ainda estiver perto e na frente
          const facing = new THREE.Vector3(Math.sin(this.object.rotation.y), 0, Math.cos(this.object.rotation.y));
          if (distPlayer <= t.attackRange + 0.5 && facing.dot(toPlayer.clone().normalize()) > 0.3) {
            ctx.hitPlayer(rollDamage(t.damage), this);
          }
        }
        if (this.stateTime >= t.attackDuration) this.setState('chase');
        break;

      case 'return':
        this.hp = Math.min(t.maxHp, this.hp + t.maxHp * 0.25 * dt);
        if (distHome < 1) {
          this.path = [];
          this.setState('idle');
          break;
        }
        if (!this.path.length) this.path = nav.findPath(this.position.x, this.position.z, this.home.x, this.home.z) ?? [];
        this.anim.loop(t.animations.walk);
        if (!this.follow(dt, t.speed * 0.8)) this.position.copy(this.home);
        break;
      default:
    }

    this.anim.update(dt);
  }

  face(dir, dt) {
    if (dir.lengthSq() < 1e-6) return;
    const heading = Math.atan2(dir.x, dir.z);
    const cur = this.object.rotation.y;
    const delta = Math.atan2(Math.sin(heading - cur), Math.cos(heading - cur));
    this.object.rotation.y = cur + delta * Math.min(1, dt * 10);
  }

  // Segue o caminho; retorna false se não há caminho
  follow(dt, speed) {
    if (!this.path.length) return false;
    let budget = speed * dt;
    while (budget > 0 && this.path.length) {
      const [tx, tz] = this.path[0];
      const dir = new THREE.Vector3(tx - this.position.x, 0, tz - this.position.z);
      const dist = dir.length();
      if (dist < 0.05) {
        this.path.shift();
        continue;
      }
      this.face(dir, dt);
      const step = Math.min(budget, dist);
      this.position.addScaledVector(dir.normalize(), step);
      budget -= step;
      if (step >= dist - 1e-4) this.path.shift();
    }
    return true;
  }

  dispose() {
    this.object.removeFromParent();
    this.object.traverse((o) => {
      if (o.isMesh) o.material.dispose?.();
    });
  }
}

// Estrelinhas girando sobre a cabeça do atordoado
function createStunStars() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd166, fog: false });
  const stars = [0, 1, 2].map((i) => {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), mat);
    s.userData.a = (i / 3) * Math.PI * 2;
    group.add(s);
    return s;
  });
  group.visible = false;
  let t = 0;
  return {
    object: group,
    update(dt) {
      t += dt;
      for (const s of stars) {
        const a = s.userData.a + t * 4;
        s.position.set(Math.cos(a) * 0.38, Math.sin(t * 6 + s.userData.a) * 0.05, Math.sin(a) * 0.38);
        s.rotation.y = t * 5;
      }
    },
  };
}
