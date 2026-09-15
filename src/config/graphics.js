// Perfil gráfico: "leve" em telas de toque (ou com ?leve na URL), "normal" no computador.
const params = new URLSearchParams(window.location.search);
const touch = window.matchMedia('(pointer: coarse)').matches;
export const isTouch = touch;
const leve = params.has('leve') || (touch && !params.has('normal'));

export const graphicsConfig = {
  profile: leve ? 'leve' : 'normal',
  maxPixelRatio: leve ? 1.5 : 2,
  shadows: true,
  shadowMapSize: leve ? 1024 : 2048,
  treeDensity: leve ? 0.55 : 1, // fração das árvores decorativas fora do mapa
  fog: { color: 0x2b3a3f, near: 42, far: 90 },
  exposure: 1.05,
};

// Cores de apoio (a arte principal vem dos modelos KayKit)
export const palette = {
  dusk: 0x2b3a3f,
  timber: 0x5a4030,
  metal: 0x5d6b78,
  torch: 0xe0a04a,
  neon: 0x5fd1e0,
  moon: 0x9fb4c8,
};

// Iluminação por ambiente (propriedade "ambiente" do mapa no Tiled)
export const ambiences = {
  aldeia: {
    background: 0x2b3a3f,
    fog: [42, 90],
    hemi: [0x8fa6c0, 0x2f3a26, 0.95],
    ambient: [0x9fb4c8, 0.22],
    moon: [0xb7c8e0, 1.15],
    fireflies: 0,
  },
  floresta: {
    background: 0x1f2d2c,
    fog: [36, 78],
    hemi: [0x7f9bb0, 0x243322, 1.0],
    ambient: [0x8fa8b8, 0.22],
    moon: [0xa9c0dc, 1.1],
    fireflies: 90,
  },
};

// Cores do terreno por tipo de tile
export const terrainColors = {
  grama: [0x4f6a35, 0x3d5a2e, 0x5e7a3c],
  mata: [0x33492a, 0x2a3f24, 0x3a5230],
  bosque: [0x46613a, 0x3a5530, 0x52703c],
  terra: [0x7a6246, 0x5f4c37],
  pedra: [0x77736b, 0x625f58],
  futurista: [0x3a5566, 0x2e4757],
  agua: [0x23465a, 0x1d3b4d],
};
