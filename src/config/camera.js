// Parâmetros da câmera isométrica. Ajuste aqui para testar o "feeling".
export const cameraConfig = {
  // 'orthographic' = isométrica pura | 'perspective' = FOV baixo, sensação Diablo 4
  mode: 'orthographic',
  yawDeg: 45,          // rotação horizontal fixa
  pitchDeg: 50,        // inclinação (testar entre 45 e 55)
  distance: 40,        // distância do alvo
  orthoHeight: 20,     // altura visível do mundo, em unidades (modo ortográfico)
  fovDeg: 30,          // campo de visão (modo perspectiva)
  zoom: { min: 0.7, max: 1.4, step: 0.1 },
  followSharpness: 6,  // quanto maior, mais rápido a câmera alcança o alvo
};
