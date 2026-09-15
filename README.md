# Auris Oasis

Auris Oasis is an experimental Diablo-like isometric RPG for the browser, focused on a small, playable vertical slice before expanding into a larger persistent world.

Execution plan (Portuguese): [`docs/plano-de-execucao.md`](docs/plano-de-execucao.md)
Product context (Portuguese): [`docs/contexto.md`](docs/contexto.md)

## Current objective

Build a first playable prototype with:

- Fixed Diablo-like camera, click (or tap) to move
- The village as the hub, with portals to every area
- The Forest (starting missions) and the Cave (first dungeon), reached by portal
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
- **Tiled** for map authoring (`.tmj` files read by the game) — see [`docs/mapas.md`](docs/mapas.md)
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
| Left click | walk there (hold to keep following the cursor); on an enemy: sword slash (hold to keep attacking) |
| Right click | shield bash: low damage, stuns for 2 s (5 s cooldown) |
| `1` / `2` | sword / shield on the nearest enemy |
| Mouse wheel | zoom |
| `Shift` + mouse wheel | camera pitch (30° to 60°) |
| `C` | switch camera (perspective / isometric) |
| `G` | show the navigation grid |
| `F` | frames per second |
| `H` | hide the help panel |

On phones and tablets: tap to walk, hold to keep following your finger, tap an enemy to attack, use the sword and shield buttons, pinch to zoom, `?` for help. Add `?leve` to the URL to force the lighter graphics profile on desktop (or `?normal` to force full quality on a phone).

## Publishing

Every push to `main` builds and publishes the game to GitHub Pages.

One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## Project structure

```
.github/workflows/   build and deploy
data/                items, NPCs, enemies, quests (JSON)
docs/                vision, roadmap, execution plan, product context, map guide
public/assets/       models (glb) and credits
public/maps/         Tiled maps (.tmj) and the terrain tileset
src/config/          camera, graphics and control settings
src/core/            game loop, input, camera rig
src/world/           Tiled loader, area building, portals, navigation grid, effects
src/entities/        player, NPCs, enemies, ground items
src/systems/         movement, quests, inventory, combat, loot, saving
src/ui/              HUD and menus (HTML/CSS over the canvas)
```

## Project status

- M0 (foundation): done.
- M1 (a room that feels good): done. A 20×20 village slice with KayKit art, animated knight, click-to-move with A* pathfinding, hero silhouette behind buildings, torch and campfire lighting. Camera: perspective, 42° pitch.
- M2 (village hub and portals): done. The village is the hub with a portal plaza; the Forest is the first area; Cave and new-world portals and the Arena of Aurelius gate are in place but closed. Tiled maps, occlusion hole, touch controls and a lighter mobile profile.
- M5 (basic combat), built ahead of M3/M4: the Warrior's sword slash and shield bash, skeleton minions in the Forest, health orb, skill bar, damage numbers, death and return to the village. Waiting for the play test.
- Next: combat tuning, then M3 (living village hub: NPCs, character creation, inventory).
