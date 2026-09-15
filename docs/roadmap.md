# Roadmap

Every milestone ends with something playable published on GitHub Pages. Details in [`plano-de-execucao.md`](plano-de-execucao.md).

## M0 - Foundation (done)

- Vite + Three.js project and folder structure
- Automatic deploy to GitHub Pages
- Placeholder village scene with the isometric camera rig

Done when: the public URL opens a 3D scene.

## M1 - A room that feels good (built, awaiting feel test)

- Isometric camera tuning (orthographic vs. low-FOV perspective)
- Animated character (KayKit)
- Click to move, hold to keep moving
- 20×20 slice of the village with real art, light and shadow
- Pulled forward from M2: grid navigation with A* (needed to walk around buildings) and a hero silhouette when hidden behind objects

Done when: walking around for two minutes is enjoyable on its own.

## M2 - Map 1 blockout

- Tiled map loader (replaces `src/world/maps/vilaRecorte.js`)
- Village, forest and mountain blocked out
- Navigation grid generated from the Tiled blocking layer
- Occlusion fading for trees, walls and roofs (the M1 silhouette stays)
- Cave entrance portal (placeholder)

Done when: the whole map can be crossed by clicking without getting stuck.

## M3 - Living village

- NPCs with dialogue
- Simple character creation
- Collectible artifact and inventory
- Local save

Done when: the original Phase 1 vertical slice is complete.

## M4 - Missions

- Data-driven mission engine
- Quest log and NPC markers
- Two or three test missions in the forest edge (no combat)

Done when: a new mission can be created only with Tiled + JSON.

## M5 - Basic combat

- Forest enemies
- Click to attack, health, death and respawn in the village
- Simple drops
- "Defeat" objectives

Done when: a full hunting mission works.

## M6 - Map 2: the cave

- Map transition with loading screen
- Safe antechamber
- Two hand-made dungeon floors and a boss
- Cave lighting (player light radius, torches)

Done when: the player can enter, clear and leave the cave.

## M7 - Depth

- Procedural dungeon floors from room templates
- Loot rarity
- Stats and visible equipment

Done when: two visits to the cave are never the same.

## Later

- Supabase accounts and persistence
- Economy, trading and marketplace
- Multiplayer: shared world, cooperative play, battlegrounds, and collective, competitive and intergroup missions
