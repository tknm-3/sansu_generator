import type { AdventureMap, MapNode, NodeKind } from './types';
import type { AdventureZoneDef } from './types';

const NODE_KINDS: { kind: NodeKind; weight: number }[] = [
  { kind: 'battle', weight: 60 },
  { kind: 'treasure', weight: 15 },
  { kind: 'rest', weight: 15 },
  { kind: 'mimic', weight: 10 },
];

function pickKind(rng: () => number): NodeKind {
  const total = NODE_KINDS.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total;
  for (const { kind, weight } of NODE_KINDS) {
    r -= weight;
    if (r <= 0) return kind;
  }
  return 'battle';
}

/**
 * ゾーンのマップを生成する。
 *
 * レイヤー構造:
 *   layer 0      : スタートノード（1つ）
 *   layer 1..N-2 : 各2ノード（branch 0, 1）
 *   layer N-1    : ボスノード（1つ）
 *
 * 接続: 各ノードから次レイヤーの両方のノードへ進める（2分岐選択）。
 * ボス直前のレイヤーは両ノードともボスへ接続。
 */
export function generateMap(zone: AdventureZoneDef, rng: () => number = Math.random): AdventureMap {
  const { id: zoneId, layerCount } = zone;
  const nodes: MapNode[] = [];

  // layer 0: start
  const startId = `${zoneId}-L0`;
  nodes.push({
    id: startId,
    kind: 'battle',
    zoneId,
    layer: 0,
    branch: -1,
    nextIds: [],
  });

  // layers 1 .. N-2
  for (let l = 1; l <= layerCount - 2; l++) {
    for (const b of [0, 1] as const) {
      nodes.push({
        id: `${zoneId}-L${l}-${b}`,
        kind: pickKind(rng),
        zoneId,
        layer: l,
        branch: b,
        nextIds: [],
      });
    }
  }

  // layer N-1: boss
  const bossId = `${zoneId}-boss`;
  nodes.push({
    id: bossId,
    kind: 'boss',
    zoneId,
    layer: layerCount - 1,
    branch: -1,
    nextIds: [],
  });

  // Wire up connections
  const byLayer = new Map<number, MapNode[]>();
  for (const n of nodes) {
    const arr = byLayer.get(n.layer) ?? [];
    arr.push(n);
    byLayer.set(n.layer, arr);
  }

  for (let l = 0; l <= layerCount - 2; l++) {
    const curr = byLayer.get(l) ?? [];
    const next = byLayer.get(l + 1) ?? [];
    for (const n of curr) {
      n.nextIds = next.map((m) => m.id);
    }
  }

  return { zoneId, nodes, startId, bossId };
}

export function getNode(map: AdventureMap, id: string): MapNode {
  const n = map.nodes.find((n) => n.id === id);
  if (!n) throw new Error(`node not found: ${id}`);
  return n;
}
