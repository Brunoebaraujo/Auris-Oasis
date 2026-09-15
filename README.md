# Auris Oasis

Auris Oasis is an experimental Diablo-like isometric RPG for the browser, focused on a small, playable vertical slice before expanding into a larger persistent world.

Execution plan (Portuguese): [`docs/plano-de-execucao.md`](docs/plano-de-execucao.md)
Product context (Portuguese): [`docs/contexto.md`](docs/contexto.md)

## Current objective

Build a first playable prototype with:

- Fixed isometric camera (Diablo-like), click to move
- Map 1: starting village surrounded by a forest for quests, with a mountain and a cave entrance to the north
- Map 2: the mountain cave, where the dungeons live
- Character entry and simple avatar creation
- One collectible artifact and a simple inventory
- Data-driven quest system (missions made of objectives)

## Development principle

Do not build the whole Oasis first.

Build one small room that feels good to enter, move around in, and collect something from.

If that loop is not fun, economy, NFTs, marketplace, lore and multiplayer are irrelevant.

## Technology

- **Three.js** for 3D rendering (fixed Diablo-like camera: low-FOV perspective by default, orthographic isometric as an option)
- **Vite** for development and builds
- **JavaScript** for gameplay code
- **Tiled** for map authoring (JSON export read by the game)
- **KayKit** asset packs (CC0) for characters, dungeon and village art — see [`public/assets/CREDITOS.md`](public/assets/CREDITOS.md)
- **GitHub Pages** via GitHub Actions for publishing
- **Supabase** later for login, character persistence and inventory
- GitHub is the source of truth for code, maps, quest data, assets and documentation

## Running locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

Controls in the current build:

| Input | Action |
|---|---|
| Left click | walk there (hold to keep following the cursor) |
| Mouse wheel | zoom |
| `Shift` + mouse wheel | camera pitch (30° to 60°) |
| `C` | switch camera (perspective / isometric) |
| `G` | show the navigation grid |
| `F` | frames per second |
| `H` | hide the help panel |

## Publishing

Every push to `main` builds and publishes the game to GitHub Pages.

One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## Project structure

```
.github/workflows/   build and deploy
data/                items, NPCs, enemies, quests (JSON)
docs/                vision, roadmap, execution plan
maps/                Tiled maps (.tmj)
public/assets/       models, textures, sounds
src/config/          camera, graphics and control settings
src/core/            game loop, input, camera rig
src/world/           map data and building, navigation grid, effects
src/entities/        player, NPCs, enemies, ground items
src/systems/         movement, quests, inventory, combat, loot, saving
src/ui/              HUD and menus (HTML/CSS over the canvas)
```

## Project status

- M0 (foundation): done.
- M1 (a room that feels good): done. A 20×20 village slice with KayKit art, animated knight, click-to-move with A* pathfinding, hero silhouette behind buildings, torch and campfire lighting. Camera: perspective, 42° pitch.
- Next: M2 (Map 1 blockout in Tiled).
