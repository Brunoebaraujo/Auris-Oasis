export const playerConfig = {
  model: 'knight',
  // Peças visíveis do modelo (o resto do equipamento fica escondido)
  loadout: ['1H_Sword', 'Round_Shield', 'Knight_Helmet', 'Knight_Cape'],
  runSpeed: 5.2,          // unidades por segundo
  runAnimRate: 1.0,       // velocidade da animação de corrida
  turnSharpness: 14,
  arriveDistance: 0.08,
  fade: 0.18,             // transição entre animações (s)
  animations: { idle: 'Idle', run: 'Running_A', hit: 'Hit_A', death: 'Death_A' },
  silhouetteColor: 0xc98a3a, // cor do herói quando está atrás de algo
};
