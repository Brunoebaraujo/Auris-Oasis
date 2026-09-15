// Catálogo de modelos: caminho, escala e colisão.
// O Hexagon Pack é em miniatura, por isso as escalas 4–5.
// collider: 'box' usa a caixa do modelo (reduzida por `shrink`); 'circle' usa `radius`; 'none' não bloqueia.

export const models = {
  // Vila
  tavern: { path: 'village/tavern', scale: 4.5, collider: 'box', shrink: 0.78 },
  blacksmith: { path: 'village/blacksmith', scale: 4.5, collider: 'box', shrink: 0.8 },
  home_A: { path: 'village/home_A', scale: 4.5, collider: 'box', shrink: 0.9 },
  home_B: { path: 'village/home_B', scale: 4.5, collider: 'box', shrink: 0.82 },
  well: { path: 'village/well', scale: 4.5, collider: 'circle', radius: 1.3 },
  market: { path: 'village/market', scale: 4.5, collider: 'box', shrink: 0.8 },
  grain: { path: 'village/grain', scale: 4, collider: 'box', shrink: 0.95 },
  fence: { path: 'village/fence_wood_straight', scale: 4.5, collider: 'box', shrink: 1 },
  fence_gate: { path: 'village/fence_wood_straight_gate', scale: 4.5, collider: 'none' },

  // Natureza
  tree_A: { path: 'nature/tree_single_A', scale: 5, collider: 'circle', radius: 0.7 },
  tree_B: { path: 'nature/tree_single_B', scale: 5, collider: 'circle', radius: 0.7 },
  trees_A_small: { path: 'nature/trees_A_small', scale: 4, collider: 'circle', radius: 2.4 },
  trees_B_small: { path: 'nature/trees_B_small', scale: 4, collider: 'circle', radius: 2.4 },
  trees_A_medium: { path: 'nature/trees_A_medium', scale: 4, collider: 'circle', radius: 3 },
  trees_B_medium: { path: 'nature/trees_B_medium', scale: 4, collider: 'circle', radius: 3 },
  rock_A: { path: 'nature/rock_single_A', scale: 5, collider: 'none' },
  rock_B: { path: 'nature/rock_single_B', scale: 5, collider: 'none' },
  rock_C: { path: 'nature/rock_single_C', scale: 5, collider: 'none' },
  rock_D: { path: 'nature/rock_single_D', scale: 5, collider: 'none' },
  hill: { path: 'nature/hill_single_A', scale: 10, collider: 'none' },
  mountain_A: { path: 'nature/mountain_A', scale: 20, collider: 'none' },
  mountain_C: { path: 'nature/mountain_C', scale: 24, collider: 'none' },

  // Objetos
  barrel: { path: 'props/dg_barrel_large', scale: 0.55, collider: 'circle', radius: 0.55 },
  barrels: { path: 'props/dg_barrel_small_stack', scale: 0.6, collider: 'circle', radius: 0.7 },
  crates: { path: 'props/dg_crates_stacked', scale: 0.55, collider: 'box', shrink: 1 },
  keg: { path: 'props/dg_keg', scale: 0.6, collider: 'circle', radius: 0.6 },
  table: { path: 'props/dg_table_medium', scale: 0.7, collider: 'box', shrink: 1 },
  stool: { path: 'props/dg_stool', scale: 0.7, collider: 'none' },
  torch: { path: 'props/dg_torch_lit', scale: 1, collider: 'none' },
  crate_big: { path: 'props/crate_A_big', scale: 5, collider: 'box', shrink: 1 },
  crate_small: { path: 'props/crate_A_small', scale: 5, collider: 'none' },
  crate_open: { path: 'props/crate_open', scale: 5, collider: 'box', shrink: 1 },
  sack: { path: 'props/sack', scale: 5, collider: 'none' },
  bucket: { path: 'props/bucket_water', scale: 5, collider: 'none' },
  wheelbarrow: { path: 'props/wheelbarrow', scale: 5, collider: 'box', shrink: 0.9 },
  lumber: { path: 'props/resource_lumber', scale: 4, collider: 'box', shrink: 0.9 },
  weaponrack: { path: 'props/weaponrack', scale: 5, collider: 'box', shrink: 1 },
  tent: { path: 'props/tent', scale: 5, collider: 'box', shrink: 0.9 },

  // Personagens
  knight: { path: 'characters/knight', scale: 1 },
};

export const allModelPaths = () => Object.values(models).map((m) => m.path);
