# Como editar os mapas no Tiled

Os mapas do jogo ficam em `public/maps/` e são editados no [Tiled](https://www.mapeditor.org/) (gratuito).
O jogo lê os arquivos `.tmj` direto; depois de salvar e enviar para a `main`, a versão publicada atualiza sozinha.

| Arquivo | Área |
|---|---|
| `aldeia.tmj` | Aldeia (hub) com a praça dos portais |
| `floresta.tmj` | Floresta, primeira área de missões |
| `tilesets/terreno.tsj` | Tipos de terreno (não precisa editar) |

Escala: cada quadrado do mapa (tile) tem **2 × 2 metros** no jogo. O norte é o topo do mapa.

## Camadas

| Camada | Tipo | Para que serve |
|---|---|---|
| `terreno` | tiles | Pinta o chão |
| `bloqueio` | tiles | Pinte o tile vermelho onde o herói **não** pode andar (além do que já bloqueia sozinho) |
| `objetos` | objetos | Prédios, cercas, pedras, caixotes |
| `entidades` | objetos | Pontos de chegada, portais, tochas, pontes e áreas de missão |

## Tipos de terreno

| Tile | Anda? | Observação |
|---|---|---|
| `grama` | sim | |
| `terra` | sim | trilhas e praças |
| `pedra` | sim | calçamento |
| `futurista` | sim | piso metálico da Aldeia |
| `agua` | não | afunda o chão e mostra água; use uma `ponte` para atravessar |
| `mata` | não | floresta fechada; o jogo planta as árvores |
| `bosque` | sim | árvores soltas, dá para andar entre elas |
| `bloqueio` | — | use só na camada `bloqueio` |

## Objetos (camada `objetos`)

Crie um **ponto** (atalho `I`), escreva `prop` no campo **Class** e adicione as propriedades:

| Propriedade | Tipo | Exemplo |
|---|---|---|
| `modelo` | string | `tavern`, `blacksmith`, `home_A`, `home_B`, `market`, `well`, `grain`, `fence`, `barrel`, `barrels`, `keg`, `crates`, `table`, `stool`, `weaponrack`, `lumber`, `wheelbarrow`, `crate_big`, `crate_small`, `crate_open`, `sack`, `bucket`, `tent`, `rock_A` a `rock_D` |
| `rot` | float | rotação em graus (0 = porta virada para o sul) |
| `escala` | float | opcional, multiplica o tamanho |

A lista completa de modelos fica em `src/world/modelCatalog.js`.

## Entidades (camada `entidades`)

| Class | Forma | Propriedades |
|---|---|---|
| `spawn` | ponto | **Name** = nome do ponto de chegada (`inicio` é o padrão da área) |
| `portal` | ponto | `destino` (id da área), `chegada` (nome do spawn no destino), `rotulo` (texto), `cor` (cor), `bloqueado` (bool) |
| `arena` | ponto | `rotulo`, `bloqueado` |
| `fogueira` | ponto | fogueira acesa |
| `fogueira_apagada` | ponto | |
| `tocha` | ponto | `luz` (bool): acende luz de verdade; use com moderação |
| `lampiao` | ponto | `luz` (bool) |
| `ponte` | retângulo | cubra a água de uma margem à outra |
| `area` | retângulo | **Name** = nome usado pelas missões (ex.: `clareira_leste`) |
| `inimigo` | ponto | `tipo` (ex.: `skeleton_minion`), `quantidade` (int), `raio` (float, espalhamento em metros). Renascem sozinhos depois de mortos |

## Propriedades do mapa

Em **Map → Map Properties**:

| Propriedade | Tipo | Para que serve |
|---|---|---|
| `nome` | string | Nome mostrado ao chegar |
| `ambiente` | string | `aldeia` ou `floresta` (luz, névoa, vaga-lumes) |
| `floresta_externa` | bool | Planta árvores decorativas em volta do mapa |
| `semente` | int | Muda a distribuição das árvores |
| `segura` | bool | Zona segura: a vida do herói fica cheia |

Tipos de inimigo disponíveis ficam em `src/config/combat.js`.

## Criar uma área nova

1. Copie `floresta.tmj` com outro nome e edite.
2. Registre a área em `src/world/areas.js`.
3. Aponte um portal da Aldeia para ela (`destino` = id da área, `bloqueado` = falso).

## Luzes e desempenho

Cada tocha ou lampião com `luz` ligada pesa no celular. Mantenha até uns 6 por área; os demais ficam só com o brilho. No perfil leve (celulares), essas luzes são desligadas automaticamente.
