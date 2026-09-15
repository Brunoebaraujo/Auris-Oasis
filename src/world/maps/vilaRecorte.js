// Recorte 20×20 da vila (células de 2 m = 40 × 40 unidades), centrado na origem.
// Norte = -Z. Portas dos prédios apontam para +Z com rot 0; rot 90 aponta para +X.
// No M2 este arquivo é substituído pelo mapa do Tiled.

export const vilaRecorte = {
  id: 'vila_recorte',
  bounds: { minX: -20, minZ: -20, width: 40, depth: 40 },
  spawn: [1.5, 3],

  // Terra batida: praça circular e trilhas (segmentos com largura)
  dirt: {
    plaza: { x: 0, z: 0, radius: 6.5 },
    paths: [
      { from: [0, -6], to: [0, -60], width: 3 },   // trilha norte, rumo à floresta e à montanha
      { from: [0, 6], to: [0, 60], width: 3 },     // trilha sul
      { from: [-5, -3], to: [-9, -7.5], width: 2 },  // porta da taverna
      { from: [4.5, -4], to: [8, -7.5], width: 2 },  // ferraria
      { from: [-6, 1], to: [-10.5, 1.5], width: 1.8 }, // casa oeste
      { from: [6, 1.5], to: [11, 1.5], width: 1.8 },   // casa leste
      { from: [3, 5.5], to: [9, 9.5], width: 1.8 },    // mercado
    ],
  },

  props: [
    // Prédios
    { id: 'tavern', at: [-9, -12], rot: 0 },
    { id: 'blacksmith', at: [9, -12], rot: 0 },
    { id: 'home_B', at: [-14, 1], rot: 90 },
    { id: 'home_A', at: [14, 1.5], rot: -90 },
    { id: 'market', at: [11, 12.5], rot: 0 },
    { id: 'grain', at: [-12, 13], rot: 0 },
    { id: 'well', at: [4.8, 4.2], rot: 30 },

    // Cercas
    { id: 'fence', at: [-6.5, 9.5], rot: 90 },
    { id: 'fence', at: [-6.5, 15.5], rot: 90 },
    { id: 'fence', at: [-3.5, -17.5], rot: 0 },
    { id: 'fence', at: [3.5, -17.5], rot: 0 },

    // Taverna
    { id: 'barrel', at: [-4.2, -9.5], rot: 0 },
    { id: 'barrels', at: [-13.8, -8.2], rot: 20 },
    { id: 'keg', at: [-12.5, -7.2], rot: 0 },
    { id: 'table', at: [-5.2, -5.2], rot: 45 },
    { id: 'stool', at: [-6.3, -4.2], rot: 10 },
    { id: 'stool', at: [-4.1, -6.3], rot: 70 },

    // Ferraria
    { id: 'weaponrack', at: [4.2, -9.8], rot: 0 },
    { id: 'lumber', at: [13.8, -6.8], rot: 90 },
    { id: 'crates', at: [13.8, -15.5], rot: 0 },
    { id: 'wheelbarrow', at: [5.5, -7.2], rot: -30 },

    // Mercado e casas
    { id: 'crate_big', at: [6.5, 12], rot: 15 },
    { id: 'crate_small', at: [7.2, 13.4], rot: 40 },
    { id: 'sack', at: [15.8, 10.5], rot: 0 },
    { id: 'sack', at: [16.2, 11.4], rot: 60 },
    { id: 'crate_open', at: [16, 6.2], rot: 0 },
    { id: 'bucket', at: [6.4, 5.6], rot: 0 },
    { id: 'barrel', at: [-11, -2.8], rot: 0 },
    { id: 'tent', at: [-15, 7.5], rot: 90 },

    // Pedras soltas (decorativas)
    { id: 'rock_A', at: [-3, 9], rot: 10 },
    { id: 'rock_C', at: [8.5, -2.5], rot: 80 },
    { id: 'rock_B', at: [2.5, -14], rot: 40 },
    { id: 'rock_D', at: [-10, 6.5], rot: 0 },
    { id: 'rock_A', at: [11, -3.5], rot: 120 },
  ],

  // Postes com tocha: iluminam as entradas da praça
  torches: [
    [-2.4, -7.2],
    [2.4, -7.2],
    [-2.4, 7.2],
    [-7.4, -8.4],
    [11.6, 8.8],
  ],

  campfire: [0, 0],

  // Floresta: faixa bloqueada na borda do recorte + anel externo decorativo
  forest: {
    seed: 11,
    edgeBand: 3.5,          // largura da faixa de árvores dentro do recorte
    outerRadius: 60,
    corridors: [{ x: 0, halfWidth: 2.6 }], // trilhas norte/sul ficam livres
    count: 480,
  },

  mountains: [
    { id: 'mountain_A', at: [-18, -62], rot: 0 },
    { id: 'mountain_C', at: [12, -70], rot: 40 },
    { id: 'mountain_A', at: [40, -66], rot: 200 },
    { id: 'mountain_C', at: [-45, -72], rot: 120 },
    { id: 'hill', at: [-30, -44], rot: 0 },
    { id: 'hill', at: [28, -46], rot: 90 },
  ],
};
