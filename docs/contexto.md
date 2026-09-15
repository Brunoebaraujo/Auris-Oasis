# Contexto do jogo — Auris Oasis

Documento vivo com a visão de produto. Atualizado em 15/09/2026 a partir das definições do Bruno.
Decisões técnicas e marcos ficam em [`plano-de-execucao.md`](plano-de-execucao.md).

---

## 1. Conceito

- O **Oásis** é uma referência direta ao filme *Ready Player One*: um **mundo virtual** onde tudo cabe.
- A **Aldeia** é o **hub**: o ponto de encontro de todos os jogadores, de onde partem para explorar outros mundos.
- A ambição é reunir personagens de toda a cultura pop (ver os cuidados na seção 8).

## 2. Público e tom

- Jovens **de 12 a 80 anos**.
- Aldeia **cosmopolita**: gente de todo tipo convivendo no mesmo lugar.
- Combate no estilo Diablo, com violência estilizada, sem sangue ou mutilação, compatível com a faixa etária.

## 3. Plataformas

- **Desktop e mobile** (navegador).
- Consequências para o desenvolvimento:
  - controles por toque equivalentes ao mouse (tocar para andar, segurar para seguir);
  - interface que se adapta a telas pequenas;
  - perfil gráfico mais leve para celulares (sombras, resolução, densidade de árvores).

## 4. Estrutura do mundo

| Área | Papel |
|---|---|
| **Aldeia (hub)** | Encontro dos jogadores, NPCs de serviço, entrada para os mundos |
| **Entorno da Aldeia** | Floresta com as primeiras missões (proposta: tutorial da Fada) |
| **Caverna da montanha** | **Primeira área de exploração**, estilo Diablo |
| **Outros mundos** | Acessados a partir da Aldeia (proposta: praça de portais), liberados aos poucos |
| **Arena PvP** | Acessada pelo Grão-Mestre |

## 5. Estética

- Arquitetura da Aldeia **mistura medieval e futurista**.
- Base atual: KayKit (medieval, CC0). Próximo passo: encontrar pacotes CC0 de ficção científica compatíveis com o estilo low-poly para as peças futuristas.

## 6. Classes

- Começo com as **4 classes tradicionais**, que já existem no pacote de personagens:
  - Guerreiro (cavaleiro)
  - Bárbaro
  - Mago
  - Ladino
- Novas classes entram depois.

## 7. NPCs da Aldeia

| NPC | Função | Observações |
|---|---|---|
| **Vendedora de poções** | Loja de consumíveis | |
| **Mercador de armas** | Loja de armas e armaduras | Pode ser um **robô** (encaixa na mistura medieval + futurista) |
| **Alfaiate** | Aparência e trajes | Caminho natural para cosméticos |
| **A Fada** | **Doadora de missões** | Guia do jogador novo |
| **Grão-Mestre** | Leva à **arena PvP** | Nome provisório; ver seção 8 |

## 8. Diretrizes e riscos

### Propriedade intelectual

- Personagens, nomes, visuais e marcas da cultura pop pertencem aos seus donos. Usá-los no jogo, principalmente com venda de itens, NFT ou marketplace, exige **licença**. O próprio filme *Ready Player One* negociou licenças para cada personagem.
- Caminhos possíveis:
  - **Personagens originais** que evocam gêneros (ninja, astronauta, piloto de robô gigante, detetive noir) sem copiar nomes, visuais ou símbolos de obras existentes.
  - **Domínio público**, com cuidado: vale a obra original, não versões e marcas posteriores.
  - **Licenciamento** com os detentores, quando houver orçamento.
- "Grão-Mestre" dono de uma arena de gladiadores lembra muito um personagem da Marvel. Manter o conceito com visual e nome próprios.
- O desenvolvimento assistido por IA **não cria** versões de personagens protegidos. Os personagens do jogo serão originais.

### Público menor de idade (Brasil)

- O **ECA Digital (Lei 15.211/2025)** está em vigor desde 17/03/2026 e vale para jogos direcionados a menores ou de acesso provável por eles.
- Pontos que afetam diretamente o Auris Oasis:
  - **Caixas de recompensa pagas (loot boxes) são proibidas.** Itens pagos precisam ter conteúdo conhecido antes da compra.
  - **Verificação de idade** confiável; autodeclaração não basta.
  - **Chat e interação entre jogadores** ficam limitados por padrão para menores e dependem de consentimento dos responsáveis.
  - **Supervisão parental** e privacidade no nível máximo por padrão.
- **NFT, marketplace e economia** entre jogadores precisam de desenho jurídico específico para menores (idade mínima, pais, LGPD). Validar com advogado antes de implementar.
- Isto não é aconselhamento jurídico.

## 9. Longo prazo (mantido)

- NFT
- Marketplace
- Economia entre jogadores
- Multiplayer, eventos, PvP e arena

## 10. Pendências

- [ ] Confirmar se a floresta continua em volta da Aldeia (missões da Fada) além da praça de portais.
- [ ] Nome da Aldeia e do vale.
- [ ] Nome definitivo do Grão-Mestre.
- [ ] Escolher o caminho para a cultura pop (originais, domínio público, licenças).
- [ ] Bestiário da Caverna: diabretes, orcs, goblins e demônios; definir o chefe.
