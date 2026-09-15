// Números do combate. Ajuste aqui para balancear.

export const playerCombat = {
  maxHp: 120,
  regenDelay: 4,      // segundos sem levar dano até começar a recuperar
  regenPerSecond: 4,
  hubHeals: true,     // na Aldeia a vida volta cheia
};

// Habilidades do Guerreiro
export const skills = {
  sword: {
    name: 'Espadada',
    button: 'Botão esquerdo',
    key: '1',
    damage: [16, 22],   // dano "alto"
    range: 2.3,         // alcance (m)
    arc: 110,           // abertura do golpe (graus)
    duration: 0.75,     // tempo total do golpe (s)
    impactAt: 0.38,     // momento em que o dano acontece (s)
    cooldown: 0,
    animation: '1H_Melee_Attack_Slice_Diagonal',
    shake: 0.08,
  },
  shield: {
    name: 'Golpe de escudo',
    button: 'Botão direito',
    key: '2',
    damage: [4, 6],     // dano baixo
    stun: 2,            // atordoa por 2 segundos
    range: 1.9,
    arc: 80,
    duration: 0.7,
    impactAt: 0.32,
    cooldown: 5,        // recarga para não travar o inimigo para sempre
    animation: 'Block_Attack',
    shake: 0.14,
  },
};

// Inimigos
export const enemyTypes = {
  skeleton_minion: {
    name: 'Esqueleto Lacaio',
    model: 'skeleton_minion',
    maxHp: 55,
    damage: [6, 9],
    speed: 2.9,
    attackRange: 1.55,
    attackInterval: 1.8,  // tempo mínimo entre ataques (s)
    attackDuration: 1.1,
    attackImpactAt: 0.55,
    aggroRadius: 9,       // distância em que percebe o herói
    leashRadius: 18,      // distância máxima do ponto de origem antes de desistir
    respawn: 25,          // segundos para voltar depois de morrer
    radius: 0.45,
    animations: {
      idle: 'Idle_B',
      walk: 'Walking_D_Skeletons',
      run: 'Running_C',
      attack: 'Unarmed_Melee_Attack_Punch_A',
      hit: 'Hit_A',
      stunned: 'Hit_B',
      death: 'Death_C_Skeletons',
      spawn: 'Spawn_Ground_Skeletons',
    },
  },
};

export const rollDamage = ([min, max]) => Math.round(min + Math.random() * (max - min));
