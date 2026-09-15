import * as THREE from 'three';
import { palette } from '../config/graphics.js';
import { createRng } from '../core/random.js';

// Cena provisória do Marco 0: um recorte da vila com blocos simples.
// Será substituída pelo mapa do Tiled (M2) e pela arte KayKit (M1).
// Convenção: norte = -Z (a montanha fica ao norte da vila).

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...extra });

export function buildTestScene(scene) {
  const rng = createRng(7);
  const shadowy = (m) => {
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // Luz: crepúsculo frio + lua com sombra
  scene.add(new THREE.HemisphereLight(palette.moon, palette.mossDark, 1.2));
  scene.add(new THREE.AmbientLight(palette.moon, 0.35));
  const moon = new THREE.DirectionalLight(palette.moon, 1.3);
  moon.position.set(-18, 30, 12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
  moon.shadow.bias = -0.0005;
  scene.add(moon, moon.target);

  // Chão
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat(palette.moss));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Praça e trilhas de terra
  const dirt = mat(palette.dirt);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(7, 24), dirt);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  scene.add(plaza);
  for (const [z, len] of [[-15.5, 19], [15, 18]]) {
    const path = new THREE.Mesh(new THREE.PlaneGeometry(3, len), dirt);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.01, z);
    path.receiveShadow = true;
    scene.add(path);
  }

  // Casas em volta da praça
  const houseAngles = [30, 80, 150, 210, 250, 330];
  for (const deg of houseAngles) {
    const a = THREE.MathUtils.degToRad(deg);
    const house = new THREE.Group();
    const w = rng.range(3.2, 4.2);
    const d = rng.range(3, 3.8);
    const h = rng.range(2.2, 2.8);
    const body = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(rng.next() > 0.5 ? palette.stone : palette.timber)));
    body.position.y = h / 2;
    const roof = shadowy(new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 2, 4), mat(palette.thatch)));
    roof.position.y = h + 1;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.1), mat(0x2a1d14));
    door.position.set(0, 0.75, d / 2 + 0.05);
    house.add(body, roof, door);
    house.position.set(Math.sin(a) * 11.5, 0, Math.cos(a) * 11.5);
    house.lookAt(0, 0, 0);
    scene.add(house);
  }

  // Fogueira central
  const fire = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = shadowy(new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), mat(palette.stone)));
    stone.position.set(Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8);
    fire.add(stone);
  }
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: palette.torch, emissive: palette.torch, emissiveIntensity: 2.5 }),
  );
  flame.position.y = 0.6;
  const fireLight = new THREE.PointLight(palette.torch, 30, 16, 1.6);
  fireLight.position.y = 1.6;
  fire.add(flame, fireLight);
  fire.position.set(0, 0, 0);
  scene.add(fire);

  // Floresta em anel (instanciada para aguentar muitas árvores)
  const treeSpots = [];
  while (treeSpots.length < 260) {
    const x = rng.range(-45, 45);
    const z = rng.range(-24, 45);
    const r = Math.hypot(x, z);
    const onPath = Math.abs(x) < 3.2;
    if (r < 16.5 || onPath) continue;
    treeSpots.push([x, z, rng.range(0.8, 1.5), rng.next() * Math.PI]);
  }
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 1.6, 6), mat(palette.timber), treeSpots.length);
  const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1.3, 3.4, 7), mat(palette.mossDark), treeSpots.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  treeSpots.forEach(([x, z, k, rot], i) => {
    q.setFromEuler(new THREE.Euler(0, rot, 0));
    s.set(k, k, k);
    m4.compose(new THREE.Vector3(x, 0.8 * k, z), q, s);
    trunks.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 2.9 * k, z), q, s);
    crowns.setMatrixAt(i, m4);
  });
  for (const im of [trunks, crowns]) {
    im.castShadow = true;
    im.receiveShadow = true;
    scene.add(im);
  }

  // Montanha ao norte e entrada da caverna
  const rock = mat(palette.mountain);
  for (let x = -48; x <= 48; x += 5) {
    for (let row = 0; row < 3; row++) {
      if (row === 0 && Math.abs(x) < 4) continue; // abre espaço para a entrada
      const k = rng.range(4, 7) + row * 2;
      const boulder = shadowy(new THREE.Mesh(new THREE.DodecahedronGeometry(k, 0), rock));
      boulder.position.set(x + rng.range(-1.5, 1.5), k * 0.45, -30 - row * 6 - rng.range(0, 2));
      boulder.rotation.set(rng.next(), rng.next() * 3, rng.next());
      scene.add(boulder);
    }
  }
  const caveFrame = shadowy(new THREE.Mesh(new THREE.BoxGeometry(6, 5, 3), rock));
  caveFrame.position.set(0, 2.5, -27);
  const caveMouth = new THREE.Mesh(new THREE.BoxGeometry(3, 3.4, 0.2), new THREE.MeshBasicMaterial({ color: 0x05070a }));
  caveMouth.position.set(0, 1.7, -25.45);
  scene.add(caveFrame, caveMouth);
  const torches = [];
  for (const x of [-2.2, 2.2]) {
    const light = new THREE.PointLight(palette.torch, 12, 9, 1.8);
    light.position.set(x, 2.6, -25);
    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 6),
      new THREE.MeshStandardMaterial({ color: palette.torch, emissive: palette.torch, emissiveIntensity: 3 }),
    );
    ember.position.copy(light.position);
    scene.add(light, ember);
    torches.push(light);
  }

  // Tremulação das chamas
  const flicker = {
    update(dt, t) {
      fireLight.intensity = 30 + Math.sin(t * 11) * 3 + Math.sin(t * 23.7) * 2;
      flame.scale.y = 1 + Math.sin(t * 9) * 0.08;
      torches.forEach((l, i) => (l.intensity = 12 + Math.sin(t * 13 + i * 2) * 1.5));
    },
  };

  // A sombra da lua acompanha o foco da câmera
  const followShadow = (focus) => {
    moon.target.position.copy(focus);
    moon.position.copy(focus).add(new THREE.Vector3(-18, 30, 12));
  };

  return { flicker, followShadow };
}
