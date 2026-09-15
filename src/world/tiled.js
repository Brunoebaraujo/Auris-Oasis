// Leitor de mapas do Tiled (.tmj, formato JSON) com tileset externo (.tsj).
const BASE = `${import.meta.env.BASE_URL}maps/`;

const propsOf = (entity) => Object.fromEntries((entity.properties ?? []).map((p) => [p.name, p.value]));

export async function loadTiledMap(file) {
  const map = await fetchJson(`${BASE}${file}`);
  const tilesets = await Promise.all(
    map.tilesets.map(async (ts) => {
      const data = ts.source ? await fetchJson(new URL(ts.source, new URL(`${BASE}${file}`, window.location.href)).href) : ts;
      const types = new Map((data.tiles ?? []).map((t) => [t.id, propsOf(t).tipo]));
      return { firstgid: ts.firstgid, count: data.tilecount, types };
    }),
  );

  const typeOfGid = (gid) => {
    if (!gid) return null;
    const id = gid & 0x1fffffff; // remove bits de espelhamento
    const ts = tilesets.find((t) => id >= t.firstgid && id < t.firstgid + t.count);
    return ts ? ts.types.get(id - ts.firstgid) ?? null : null;
  };

  const layer = (name) => map.layers.find((l) => l.name === name);
  const tileLayer = (name) => {
    const l = layer(name);
    if (!l) return null;
    return l.data.map(typeOfGid);
  };

  const pxToCell = 1 / map.tilewidth;
  const objects = (name) =>
    (layer(name)?.objects ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type || o.class || '',
      // posição em células (fracionárias)
      x: o.x * pxToCell,
      y: o.y * pxToCell,
      w: (o.width ?? 0) * pxToCell,
      h: (o.height ?? 0) * pxToCell,
      props: propsOf(o),
    }));

  return {
    width: map.width,
    height: map.height,
    props: propsOf(map),
    terrain: tileLayer('terreno') ?? [],
    blocking: tileLayer('bloqueio') ?? [],
    objects: objects('objetos'),
    entities: objects('entidades'),
  };
}

// Cor do Tiled "#AARRGGBB" ou "#RRGGBB" -> número RGB
export function tiledColor(value, fallback) {
  if (!value) return fallback;
  const hex = value.replace('#', '');
  return parseInt(hex.length === 8 ? hex.slice(2) : hex, 16);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url}: ${res.status}`);
  return res.json();
}
