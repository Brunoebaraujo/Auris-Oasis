// Parâmetros da câmera. Ajuste aqui para testar o "feeling".
export const cameraConfig = {
  // 'perspective' = FOV baixo, sensação Diablo 4 (escolhida no M1) | 'orthographic' = isométrica pura
  mode: 'perspective',
  yawDeg: 45,          // rotação horizontal fixa
  pitchDeg: 42,        // inclinação padrão (era 50 no M0)
  pitch: { min: 30, max: 60, step: 2 }, // Shift + roda ajusta durante o jogo
  distance: 40,        // distância do alvo (modo ortográfico)
  orthoHeight: 20,     // altura visível do mundo, em unidades
  fovDeg: 30,          // campo de visão (modo perspectiva)
  zoom: { min: 0.7, max: 1.4, step: 0.1 },
  followSharpness: 6,  // quanto maior, mais rápido a câmera alcança o alvo
};
