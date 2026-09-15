# Plano de execução — Auris Oasis

Status: decisões aprovadas em 15/09/2026. Marco atual: M0 (fundação).

---

## 1. Diagnóstico do repositório

O repositório hoje contém só documentação: `README.md`, `docs/vision.md` e `docs/roadmap.md`. Não há código, assets nem pipeline de publicação.

Pontos fortes da documentação atual:

- O princípio "construa uma sala pequena que seja gostosa de explorar antes de construir o Oásis inteiro" é o certo e deve guiar todos os marcos abaixo.
- O MVP está bem cortado (sem multiplayer, economia, NFT ou marketplace).

Pontos que precisam ser ajustados para o novo pedido:

- O README fala em câmera "terceira pessoa / elevada". O pedido agora é **isométrica, estilo Diablo**.
- O README aponta o **PlayCanvas** como motor. O Editor do PlayCanvas guarda o projeto na nuvem dele, não no GitHub, o que conflita com "GitHub como fonte da verdade".
- O `vision.md` diz "sem combate" no MVP, mas dungeons exigem combate. O combate precisa entrar antes do Mapa 2.
- O `roadmap.md` coloca missões (Fase 4) depois de combate (Fase 3). Como a floresta é o lugar das missões, vale inverter: missões de exploração/coleta primeiro, combate depois.

---

## 2. Decisões propostas

### 2.1 Visão isométrica: 3D com câmera fixa (aprovado)

Diablo 1 e 2 usam sprites 2D isométricos; Diablo 3 e 4 usam cenas 3D com câmera alta e fixa. A recomendação é o segundo caminho:

- Personagens 3D animados já existem prontos e gratuitos. Em 2D seria preciso desenhar cada animação em 8 direções, e de novo para cada peça de equipamento.
- Criação de avatar e troca de equipamento visível ficam viáveis (trocar malha/cor em vez de redesenhar sprites).
- Luz dinâmica, sombra, névoa e o "raio de luz" do jogador na caverna saem quase de graça.
- Relevo (montanha, entrada da caverna, escadas da dungeon) é natural em 3D.

Parâmetros iniciais de câmera (ajustáveis num arquivo de configuração):

- Rotação horizontal fixa de 45°, sem o jogador girar a câmera.
- Inclinação entre 45° e 55° (testar as duas pontas no Marco 1).
- Testar **ortográfica** (isométrica "pura") contra **perspectiva com FOV baixo** (~30°, sensação Diablo 4) e escolher pelo feeling.
- Segue o jogador com suavização; zoom limitado (roda do mouse, faixa curta).
- **Oclusão**: árvores, paredes e telhados entre a câmera e o jogador ficam semitransparentes; telhado some ao entrar numa casa.

Controles padrão ARPG:

- Botão esquerdo: mover / interagir / atacar. Segurar = andar contínuo seguindo o cursor.
- Botão direito: habilidade (a partir do Marco 5).
- `1`–`4`: poções/habilidades. `I`: inventário. `J`: diário de missões. `M`: mapa. `Esc`: menu.

### 2.2 Motor: Three.js + Vite, tudo em código (aprovado)

- Todo o projeto vive no GitHub (código, mapas, dados de missões, assets).
- Maior ecossistema e documentação de 3D na web.
- Publicação no GitHub Pages via GitHub Actions, como nos outros projetos.
- JavaScript, como já previsto no README.

### 2.3 Arte: pacotes KayKit (CC0) para começar (aprovado)

- KayKit Character Pack: Adventurers — personagens low-poly já riggados e animados.
- KayKit Dungeon Remastered — mais de 200 peças modulares de dungeon (paredes, pisos, escadas, portas, baús), licença CC0, com repositório no GitHub.
- KayKit Skeletons — primeiros inimigos da caverna.
- Pacotes de natureza/vila compatíveis para a floresta e as casas.
- Estilo é "low-poly estilizado". O tom dark fantasy vem de iluminação, névoa e paleta. Se a ambição visual for realista/sombria, isso exige assets pagos e deve ser decidido cedo.

### 2.4 Mapas desenhados no Tiled

- [Tiled](https://www.mapeditor.org/) é gratuito, roda no Windows e exporta JSON.
- Mesmo sendo um jogo 3D, o mapa é uma grade: o jogo lê o JSON e monta a cena 3D.
- Isso permite que você desenhe as missões visualmente: marca uma área chamada `clareira_lobos` no Tiled e a missão referencia esse nome.

Camadas padrão de cada mapa:

| Camada | Tipo | Conteúdo |
|---|---|---|
| `terreno` | tiles | grama, terra, trilha, água, rocha, piso de caverna |
| `bloqueio` | tiles | onde não se anda (gera a grade de navegação) |
| `props` | objetos | árvores, casas, pedras, cercas, tochas |
| `entidades` | objetos | ponto de início, NPCs, baús, spawns de inimigos |
| `areas` | objetos | áreas nomeadas para missões, zonas seguras, música |
| `portais` | objetos | transições entre mapas (ex.: entrada da caverna) |

---

## 3. Mapa 1 — Vale inicial (nome provisório)

Grade inicial de 120 × 120 células. Layout proposto:

```
                          N
+--------------------------------------------------+
| ^^^^^^^^^^^^^^^^^^^ MONTANHA ^^^^^^^^^^^^^^^^^^^ |
| ^^^^^^^^^^^^^^^^^^^^^^^[C]^^^^^^^^^^^^^^^^^^^^^^ |
| TTTTT FLORESTA PROFUNDA TTTT:TTTTTTTTTTTTTTTTTTT |
| TTTTTTTTTTTTTTTTTTTTTTTTTTTT:TTTTTTTTTTTTTTTTTTT |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~[=]~~~~~~~~~~~~~~~~~~ |
| TTTTT FLORESTA MEDIA TTTTTTT:TTTTT (clareira) TT |
| TT ORLA TTTTTTTT +---------+---------+ ORLA TTTT |
| TTTTTTTTTTTTTTTT |                   | TTTTTTTTT |
| TTTTTTTTTTTTTTTT |   VILA (inicio)   | TTTTTTTTT |
| TTTTTTTTTTTTTTTT |                   | TTTTTTTTT |
| TTTTTTTTTTTTTTTT +---------+---------+ TTTTTTTTT |
| TTTTTTTTTTTTTTTTTTTTTTTTTTT:TTTTTTTTTTTTTTTTTTTT |
+--------------------------------------------------+
  [C] entrada da caverna   [=] ponte   : trilha
```

Zonas:

| Zona | Papel | Conteúdo inicial |
|---|---|---|
| Vila | zona segura, ponto de renascimento | doador de missões, ferreiro/mercador, baú pessoal, fogueira/waypoint |
| Orla da floresta | primeiras missões, sem perigo | coleta, exploração, entregas |
| Floresta média | missões com combate leve (Marco 5) | clareira com inimigos fracos, ruínas |
| Rio e ponte | barreira natural de progressão | ponte liberada por missão |
| Floresta profunda | missões mais difíceis | chefe de área opcional |
| Montanha | borda do mapa, não caminhável | trilha até a entrada da caverna `[C]` |

---

## 4. Mapa 2 — Caverna da montanha

```
[Saída p/ Mapa 1]
       |
  ANTECÂMARA  (zona segura: fogueira, waypoint)
       |
   ANDAR 1  (feito à mão)
       |
   ANDAR 2  (feito à mão)
       |
 CÂMARA DO CHEFE
```

- Transição por portal com tela de carregamento, estilo Diablo.
- Iluminação escura: luz ambiente mínima, raio de luz em volta do jogador, tochas nas paredes.
- Andares 1 e 2 desenhados no Tiled com o kit KayKit Dungeon.
- Evolução (Marco 7): andares procedurais montados a partir de "salas-modelo" desenhadas no Tiled, encaixadas por uma semente aleatória. Cada visita gera um layout diferente.

---

## 5. Sistema de Missões

Missões são objetivos compostos, não tarefas soltas. Cada missão agrupa objetivos menores.

Tipos de missão (o campo existe desde já; só `individual` funciona antes do multiplayer):

- `individual`
- `coletiva` (vários jogadores somam progresso)
- `competitiva` (jogadores disputam o mesmo objetivo)
- `intergrupo` (grupos contra grupos)

Participação é sempre explícita: no modo solo, o NPC oferece e o jogador aceita; no multiplayer, o jogador é designado ou convidado.

Tipos de objetivo previstos: `falar`, `ir_para` (área), `coletar`, `interagir`, `entregar`, `derrotar` (Marco 5), `sobreviver` (Marco 6).

Exemplo de arquivo `data/missoes/pegadas_na_orla.json`:

```json
{
  "id": "pegadas_na_orla",
  "titulo": "Pegadas na orla",
  "tipo": "individual",
  "participacao": { "modo": "aceite", "oferecida_por": "npc_cacadora" },
  "requisitos": { "nivel_min": 1, "missoes_concluidas": [] },
  "ordem_objetivos": "sequencial",
  "objetivos": [
    { "id": "o1", "tipo": "ir_para", "area": "orla_leste", "texto": "Investigue a orla leste" },
    { "id": "o2", "tipo": "coletar", "item": "pena_estranha", "qtd": 3, "area": "orla_leste" },
    { "id": "o3", "tipo": "entregar", "item": "pena_estranha", "qtd": 3, "npc": "npc_cacadora" }
  ],
  "recompensas": { "xp": 50, "ouro": 20, "itens": ["amuleto_simples"] },
  "desbloqueia": ["a_ponte_quebrada"]
}
```

Fluxo para criar uma missão nova (meta do Marco 4):

1. Desenhar a área e os itens/NPCs no Tiled.
2. Criar o JSON da missão referenciando os nomes do Tiled.
3. Recarregar o jogo. Nenhum código novo.

---

## 6. Arquitetura do código

```
Auris-Oasis/
├── index.html
├── vite.config.js
├── .github/workflows/deploy.yml     # build + GitHub Pages
├── public/assets/                   # modelos .glb, texturas, sons
├── maps/                            # arquivos do Tiled (.tmj)
│   ├── vale_inicial.tmj
│   └── caverna/
├── data/
│   ├── missoes/                     # um JSON por missão
│   ├── itens.json
│   ├── npcs.json
│   └── inimigos.json
├── src/
│   ├── main.js
│   ├── config/                      # câmera, controles, gráficos
│   ├── core/                        # loop, entrada, estados (menu → criação → mundo), eventos
│   ├── world/                       # leitor do Tiled, grade de navegação, A*, oclusão, portais
│   ├── entities/                    # jogador, NPC, inimigo, item no chão
│   ├── systems/                     # movimento, animação, missões, inventário, combate, loot, save
│   └── ui/                          # HUD, inventário, diário, diálogo (HTML/CSS por cima do canvas)
└── docs/
```

Salvamento: `localStorage` no começo; Supabase depois, como já previsto.

Meta de desempenho: 60 fps num notebook com GPU integrada (instanciamento de árvores, sombras só perto do jogador, texturas em atlas).

---

## 7. Marcos

Cada marco termina com algo jogável publicado no GitHub Pages.

| Marco | Entrega | Pronto quando |
|---|---|---|
| **M0 — Fundação** | Vite + Three.js, estrutura de pastas, deploy automático | A URL pública abre uma cena 3D |
| **M1 — A sala gostosa** | Câmera isométrica (testes orto × perspectiva), personagem animado, clicar para andar, pedaço 20×20 da vila, luz e sombra | Andar por 2 minutos é agradável por si só |
| **M2 — Blockout do Mapa 1** | Leitor do Tiled, vila + floresta + montanha com blocos simples, A*, colisão, oclusão, portal da caverna (placeholder) | Atravessar o mapa inteiro clicando sem travar |
| **M3 — Vila viva** | NPCs com diálogo, criação simples de personagem, artefato coletável, inventário, save local | Fase 1 do roadmap original concluída |
| **M4 — Missões** | Motor de missões por dados, diário, marcadores sobre NPCs, 2–3 missões de teste na orla | Você cria uma missão nova só com Tiled + JSON |
| **M5 — Combate básico** | Inimigos na floresta, ataque por clique, vida, morte e renascimento na vila, drops simples, objetivo `derrotar` | Uma missão de caça completa funciona |
| **M6 — Mapa 2** | Transição, antecâmara, 2 andares feitos à mão, chefe, iluminação de caverna | Entrar, limpar e sair da caverna |
| **M7 — Profundidade** | Andares procedurais, raridade de itens, atributos, equipamento visível | Duas visitas à caverna nunca são iguais |

Depois do M7: Supabase (contas e persistência), economia, multiplayer — e aí as missões coletivas, competitivas e intergrupo passam a funcionar.

---

## 8. Ajustes nos documentos existentes (feitos no M0)

- `README.md`: trocar "terceira pessoa" por "isométrica estilo Diablo"; atualizar direção de tecnologia (Three.js + Vite, Tiled, KayKit).
- `docs/vision.md`: registrar os dois mapas iniciais; mover "sem combate" para "combate básico entra antes da dungeon".
- `docs/roadmap.md`: substituir pelas etapas M0–M7.

---

## 9. Riscos

- **Escopo**: dois mapas + missões + dungeon é muito. Os marcos existem para cortar; nada do M5 em diante começa antes do M1 estar gostoso.
- **Coerência visual**: misturar pacotes de artistas diferentes quebra a identidade. Preferir uma família (KayKit) até o fim do M6.
- **Tom**: KayKit é estilizado. Se a meta for dark fantasy realista, decidir antes do M1.
- **Desempenho**: floresta densa pesa. Instanciamento e oclusão desde o M2.
