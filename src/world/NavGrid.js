import * as THREE from 'three';

// Grade de navegação: células bloqueadas/livres + A* com suavização de caminho.
// Coordenadas do mundo em X/Z; a grade cobre [minX, minX + width] × [minZ, minZ + depth].
export class NavGrid {
  constructor({ minX, minZ, width, depth, resolution = 0.5, agentRadius = 0.45 }) {
    Object.assign(this, { minX, minZ, resolution, agentRadius });
    this.cols = Math.round(width / resolution);
    this.rows = Math.round(depth / resolution);
    this.blocked = new Uint8Array(this.cols * this.rows);
  }

  // --- conversões ---
  cellOf(x, z) {
    return [Math.floor((x - this.minX) / this.resolution), Math.floor((z - this.minZ) / this.resolution)];
  }

  centerOf(c, r) {
    return [this.minX + (c + 0.5) * this.resolution, this.minZ + (r + 0.5) * this.resolution];
  }

  inside(c, r) {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
  }

  walkableCell(c, r) {
    return this.inside(c, r) && this.blocked[r * this.cols + c] === 0;
  }

  isWalkable(x, z) {
    const [c, r] = this.cellOf(x, z);
    return this.walkableCell(c, r);
  }

  // --- bloqueios (já inflados pelo raio do personagem) ---
  forEachCellIn(minX, minZ, maxX, maxZ, fn) {
    const [c0, r0] = this.cellOf(minX, minZ);
    const [c1, r1] = this.cellOf(maxX, maxZ);
    for (let r = Math.max(0, r0); r <= Math.min(this.rows - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(this.cols - 1, c1); c++) fn(c, r);
    }
  }

  blockCircle(x, z, radius) {
    const R = radius + this.agentRadius;
    this.forEachCellIn(x - R, z - R, x + R, z + R, (c, r) => {
      const [cx, cz] = this.centerOf(c, r);
      if ((cx - x) ** 2 + (cz - z) ** 2 <= R * R) this.blocked[r * this.cols + c] = 1;
    });
  }

  blockBox(minX, minZ, maxX, maxZ) {
    const a = this.agentRadius;
    this.forEachCellIn(minX - a, minZ - a, maxX + a, maxZ + a, (c, r) => {
      this.blocked[r * this.cols + c] = 1;
    });
  }

  // Libera células cujo centro está dentro do retângulo (ex.: ponte sobre a água)
  unblockBox(minX, minZ, maxX, maxZ) {
    this.forEachCellIn(minX, minZ, maxX, maxZ, (c, r) => {
      const [cx, cz] = this.centerOf(c, r);
      if (cx >= minX && cx <= maxX && cz >= minZ && cz <= maxZ) this.blocked[r * this.cols + c] = 0;
    });
  }

  // Bloqueia a caixa de um objeto já posicionado no mundo
  blockObject(object3d, shrink = 1) {
    const box = new THREE.Box3().setFromObject(object3d);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const hx = ((box.max.x - box.min.x) / 2) * shrink;
    const hz = ((box.max.z - box.min.z) / 2) * shrink;
    this.blockBox(cx - hx, cz - hz, cx + hx, cz + hz);
  }

  // Célula livre mais próxima (busca em anéis)
  nearestWalkable(x, z, maxRings = 24) {
    const [c, r] = this.cellOf(x, z);
    if (this.walkableCell(c, r)) return [c, r];
    for (let k = 1; k <= maxRings; k++) {
      let best = null;
      let bestD = Infinity;
      for (let dr = -k; dr <= k; dr++) {
        for (let dc = -k; dc <= k; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== k) continue;
          if (!this.walkableCell(c + dc, r + dr)) continue;
          const d = dc * dc + dr * dr;
          if (d < bestD) {
            bestD = d;
            best = [c + dc, r + dr];
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  // Linha de visão: amostra o segmento a cada 1/4 de célula
  lineClear(ax, az, bx, bz) {
    const dist = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(dist / (this.resolution * 0.25));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!this.isWalkable(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }

  // A* em 8 direções, sem cortar quinas. Retorna pontos [x, z] suavizados.
  findPath(fromX, fromZ, toX, toZ) {
    const start = this.nearestWalkable(fromX, fromZ);
    const goal = this.nearestWalkable(toX, toZ);
    if (!start || !goal) return null;

    const goalExact = this.walkableCell(...this.cellOf(toX, toZ));
    const [gx, gz] = goalExact ? [toX, toZ] : this.centerOf(...goal);

    if (this.lineClear(fromX, fromZ, gx, gz)) return [[gx, gz]];

    const { cols } = this;
    const n = cols * this.rows;
    const g = new Float32Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const startI = start[1] * cols + start[0];
    const goalI = goal[1] * cols + goal[0];
    const h = (i) => {
      const dx = Math.abs((i % cols) - goal[0]);
      const dz = Math.abs(Math.floor(i / cols) - goal[1]);
      return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz);
    };

    const heap = new MinHeap();
    g[startI] = 0;
    heap.push(startI, h(startI));
    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
    ];

    let found = false;
    while (heap.size) {
      const i = heap.pop();
      if (i === goalI) {
        found = true;
        break;
      }
      if (closed[i]) continue;
      closed[i] = 1;
      const c = i % cols;
      const r = (i - c) / cols;
      for (const [dc, dr, cost] of dirs) {
        const nc = c + dc;
        const nr = r + dr;
        if (!this.walkableCell(nc, nr)) continue;
        if (dc && dr && (!this.walkableCell(c + dc, r) || !this.walkableCell(c, r + dr))) continue;
        const j = nr * cols + nc;
        const ng = g[i] + cost;
        if (ng < g[j]) {
          g[j] = ng;
          parent[j] = i;
          heap.push(j, ng + h(j));
        }
      }
    }
    if (!found) return null;

    const cells = [];
    for (let i = goalI; i !== -1; i = parent[i]) cells.push(i);
    cells.reverse();
    const points = cells.map((i) => this.centerOf(i % cols, Math.floor(i / cols)));
    points[points.length - 1] = [gx, gz];

    // Suavização: pula pontos intermediários quando há linha de visão
    const smooth = [];
    let ax = fromX;
    let az = fromZ;
    let k = 0;
    while (k < points.length) {
      let far = k;
      for (let m = points.length - 1; m > k; m--) {
        if (this.lineClear(ax, az, points[m][0], points[m][1])) {
          far = m;
          break;
        }
      }
      smooth.push(points[far]);
      [ax, az] = points[far];
      k = far + 1;
    }
    return smooth;
  }

  // Sobreposição de depuração (tecla G)
  createDebugOverlay() {
    const data = new Uint8Array(this.cols * this.rows * 4);
    for (let i = 0; i < this.blocked.length; i++) {
      const o = i * 4;
      data[o] = 255;
      data[o + 1] = 40;
      data[o + 2] = 30;
      data[o + 3] = this.blocked[i] ? 120 : 0;
    }
    const tex = new THREE.DataTexture(data, this.cols, this.rows);
    tex.magFilter = THREE.NearestFilter;
    tex.flipY = false;
    tex.needsUpdate = true;
    const w = this.cols * this.resolution;
    const d = this.rows * this.resolution;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(this.minX + w / 2, 0.05, this.minZ + d / 2);
    mesh.renderOrder = 10;
    mesh.visible = false;
    return mesh;
  }
}

class MinHeap {
  constructor() {
    this.items = [];
    this.keys = [];
  }

  get size() {
    return this.items.length;
  }

  push(item, key) {
    const { items, keys } = this;
    let i = items.length;
    items.push(item);
    keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= key) break;
      items[i] = items[p];
      keys[i] = keys[p];
      i = p;
    }
    items[i] = item;
    keys[i] = key;
  }

  pop() {
    const { items, keys } = this;
    const top = items[0];
    const lastItem = items.pop();
    const lastKey = keys.pop();
    if (items.length) {
      let i = 0;
      const n = items.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        let mk = lastKey;
        if (l < n && keys[l] < mk) {
          m = l;
          mk = keys[l];
        }
        if (r < n && keys[r] < mk) m = r;
        if (m === i) break;
        items[i] = items[m];
        keys[i] = keys[m];
        i = m;
      }
      items[i] = lastItem;
      keys[i] = lastKey;
    }
    return top;
  }
}
