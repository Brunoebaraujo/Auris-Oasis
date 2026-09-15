# Roadmap

Every milestone ends with something playable published on GitHub Pages. Details in [`plano-de-execucao.md`](plano-de-execucao.md).

## M0 - Foundation (done)

- Vite + Three.js project and folder structure
- Automatic deploy to GitHub Pages
- Placeholder village scene with the isometric camera rig

Done when: the public URL opens a 3D scene.

## M1 - A room that feels good (done)

- Camera tuning: low-FOV perspective chosen, default pitch 42° (Shift + wheel adjusts between 30° and 60°)
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
- Mobile baseline: touch controls checked, responsive HUD, lighter graphics profile

Done when: the whole map can be crossed by clicking or tapping without getting stuck, on desktop and phone.

## M3 - Living village

- Service NPCs: potion seller, weapons merchant (robot), tailor, the Fairy (missions), arena master (PvP, placeholder)
- Character creation with the 4 classic classes
- First futuristic pieces mixed into the medieval village
- Collectible artifact and inventory
- Local save

Done when: the original Phase 1 vertical slice is complete.

## M4 - Missions

- Data-driven mission engine
- Quest log and NPC markers
- Two or three test missions in the forest edge (no combat)

Done when: a new mission can be created only with Tiled + JSON.

## M5 - Basic combat

- First enemies (goblins, imps)
- Click to attack, health, death and respawn in the village
- Simple drops
- "Defeat" objectives

Done when: a full hunting mission works.

## M6 - Map 2: the cave

- Map transition with loading screen
- Safe antechamber
- Two hand-made dungeon floors with imps, orcs, goblins and demons, and a boss
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
- Multiplayer: shared hub, cooperative play, PvP arena, battlegrounds, and collective, competitive and intergroup missions
- Portals from the hub to new worlds
- NFT, marketplace and player economy (legal review first: the audience includes minors, see `contexto.md`)
