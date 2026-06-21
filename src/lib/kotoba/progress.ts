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

/** さきどりできる 世界数（フロンティアより先に チャレンジできる ぶん。算数版とおなじ） */
export const WORLD_LOOKAHEAD = 2;

/** 教材の ボス＝ライン10「IF-くん だいこうじょう」の index（最初の10は教材・順番固定） */
export const BOSS_INDEX = 9;
/** 11以降＝ボスの あとに ひらく 上級の たび（design §13） */
export const ADVANCED_START = 10;

/** ボス（ライン10）を クリアずみか＝上級の たびが ひらいたか */
export function isBossCleared(): boolean {
  return isWorldCleared(WORLDS[BOSS_INDEX].id);
}

/** クリア済みの 世界の インデックス一覧（配列順） */
function clearedIndices(): number[] {
  const h = loadKotobaHistory();
  return WORLDS
    .map((w, i) => (h.worlds.some((z) => z.worldId === w.id) ? i : -1))
    .filter((i) => i >= 0);
}

/** つぎに すすむ 世界（クリア済み最深＋1）。実績なしなら 0 */
export function worldFrontier(): number {
  const cleared = clearedIndices();
  return cleared.length ? Math.max(...cleared) + 1 : 0;
}

/**
 * 世界が あそべるか（としょかんモードと同じ）。
 * - さいしょの 世界は つねに 可
 * - クリア済みは つねに 可（やりなおし）
 * - 実績のある子は フロンティア＋さきどりぶん まで チャレンジできる
 * - 上級（11以降＝おうよう/ながい/たつじん）は つねに あそべる
 *   ＝「むずかしいのを すぐ」を かなえる。きほん（1〜10）だけ 順番に ひらく。
 */
export function isWorldUnlocked(index: number): boolean {
  if (index <= 0) return true;
  if (isWorldCleared(WORLDS[index].id)) return true;
  // 上級グループ（11以降）は 直線アンロックを とびこえて つねに 開放
  if (index >= ADVANCED_START) return true;
  const cleared = clearedIndices();
  if (cleared.length === 0) return index <= WORLD_LOOKAHEAD; // 実績なしでも さいしょの 数個は えらべる
  return index <= Math.max(...cleared) + 1 + WORLD_LOOKAHEAD;
}

export type WorldStatus = 'cleared' | 'current' | 'new' | 'locked';

/**
 * ハブ表示用の 世界の じょうたい。
 * - cleared: もう クリアした（やりなおせる）
 * - current: つぎに すすむ つづき（いまここ）
 * - new:     あそべるけど まだ クリアしてない（さきどり／とばした）
 * - locked:  まだ ひらかない
 */
export function worldStatus(index: number): WorldStatus {
  if (isWorldCleared(WORLDS[index].id)) return 'cleared';
  if (!isWorldUnlocked(index)) return 'locked';
  return index === worldFrontier() ? 'current' : 'new';
}
