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

## M2 - Village hub and portals (done)

- Tiled map loader (`public/maps/*.tmj`, guide in `mapas.md`)
- The village as the hub, with a portal plaza
- Forest as the first area, reached by portal; Cave and new-world portals present but closed
- Arena of Aurelius gate (closed)
- Area switching with a loading curtain
- Navigation grid generated from the map (terrain, blocking layer, props)
- Occlusion: dithered hole around the hero (the M1 silhouette stays)
- Mobile baseline: tap and hold to move, pinch zoom, responsive HUD, lighter graphics profile

Done when: the player can go to the Forest and back and cross both areas without getting stuck, on desktop and phone.

## M3 - Living village hub

- Service NPCs: potion seller, weapons merchant (robot), tailor, the Fairy (missions), Aurelius the arena master (PvP, placeholder)
- Character creation with the 4 classic classes
- First futuristic pieces mixed into the medieval village
- Collectible artifact and inventory
- Local save

Done when: the original Phase 1 vertical slice is complete.

## M4 - Missions

- Data-driven mission engine
- Quest log and NPC markers
- Two or three test missions in the Forest (no combat)

Done when: a new mission can be created only with Tiled + JSON.

## M5 - Basic combat (built ahead of M3/M4, awaiting test)

- Warrior skills: left click = sword slash (high damage, cleaves the arc in front), right click = shield bash (low damage, 2 s stun, 5 s cooldown); keys 1 and 2 and on-screen buttons target the nearest enemy
- Click an enemy to walk to it and attack; hold to keep attacking
- First enemy: skeleton minion (KayKit Skeletons), in four groups in the Forest; rises from the ground, chases, punches, gets stunned, dies and respawns after 25 s
- Health orb, skill bar with cooldowns, enemy health bars, floating damage numbers, hovered enemy name, hit flash and camera shake
- Health regenerates out of combat; the village is a safe zone; on death the hero returns to the village
- Numbers in `src/config/combat.js`

Done when: fighting the skeletons in the Forest feels good.

## M6 - The Cave

- Cave portal opened in the hub
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
