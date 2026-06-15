import { loadJson, saveJson } from '../storage';
import { WORLDS } from './worlds';

// ことば冒険の進捗（算数版とは別名前空間 kotoba-adventure:）。
// アンロックは配列順の直線（前の世界クリアで次が開く）。

const HISTORY_KEY = 'kotoba-adventure:history';

export interface KotobaRecord {
  worldId: string;
  clearedAt: number;
  sparkles: number; // 0〜3（ノーミスで3）
}

export interface KotobaHistory {
  worlds: KotobaRecord[];
  totalSparkles: number;
}

export function loadKotobaHistory(): KotobaHistory {
  return loadJson<KotobaHistory>(HISTORY_KEY, { worlds: [], totalSparkles: 0 });
}

export function recordWorldClear(worldId: string, sparkles: number): void {
  const h = loadKotobaHistory();
  const existing = h.worlds.find((w) => w.worldId === worldId);
  if (existing) {
    // ベストな きらきらを 残す（リプレイで 下がらない）
    existing.sparkles = Math.max(existing.sparkles, sparkles);
    existing.clearedAt = Date.now();
  } else {
    h.worlds.push({ worldId, clearedAt: Date.now(), sparkles });
  }
  h.totalSparkles += sparkles;
  saveJson(HISTORY_KEY, h);
}

export function isWorldCleared(worldId: string): boolean {
  return loadKotobaHistory().worlds.some((w) => w.worldId === worldId);
}

export function worldSparkles(worldId: string): number {
  return loadKotobaHistory().worlds.find((w) => w.worldId === worldId)?.sparkles ?? 0;
}

/** index の世界が あそべるか（0は つねに可・前をクリアで 次が開く・クリア済みは つねに可） */
export function isWorldUnlocked(index: number): boolean {
  if (index <= 0) return true;
  const prev = WORLDS[index - 1];
  return isWorldCleared(prev.id);
}
