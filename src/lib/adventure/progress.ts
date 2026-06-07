import { loadJson, saveJson } from '../storage';
import type { RunState, TornPage } from './types';

const RUN_KEY = 'math-adventure:run';
const HISTORY_KEY = 'math-adventure:history';
const TORN_KEY = 'math-adventure:torn-pages';

export interface ZoneRecord {
  zoneId: string;
  clearedAt: number;
  perfect: boolean; // ノーミス
  sparkles: number;
}

export interface AdventureHistory {
  zones: ZoneRecord[];
  totalSparkles: number;
}

export function loadRun(): RunState | null {
  return loadJson<RunState | null>(RUN_KEY, null);
}

export function saveRun(state: RunState): void {
  saveJson(RUN_KEY, state);
}

export function clearRun(): void {
  saveJson(RUN_KEY, null);
}

export function loadHistory(): AdventureHistory {
  // 空のときは 毎回 あたらしい オブジェクトを 返す（共有 fallback を 破壊的に push しない）
  return loadJson<AdventureHistory>(HISTORY_KEY, { zones: [], totalSparkles: 0 });
}

export function recordZoneClear(zoneId: string, perfect: boolean, sparkles: number): void {
  const h = loadHistory();
  const existing = h.zones.find((z) => z.zoneId === zoneId);
  const record: ZoneRecord = { zoneId, clearedAt: Date.now(), perfect, sparkles };
  if (existing) {
    Object.assign(existing, record);
  } else {
    h.zones.push(record);
  }
  h.totalSparkles += sparkles;
  saveJson(HISTORY_KEY, h);
}

export function isZoneCleared(zoneId: string): boolean {
  const h = loadHistory();
  return h.zones.some((z) => z.zoneId === zoneId);
}

/** さきどりできる ゾーン数（フロンティアより先に チャレンジできる ぶん）*/
export const ZONE_LOOKAHEAD = 2;

/** クリア済みの ゾーンの インデックス一覧（配列順）*/
function clearedIndices(zoneIds: string[]): number[] {
  const h = loadHistory();
  return zoneIds
    .map((id, i) => (h.zones.some((z) => z.zoneId === id) ? i : -1))
    .filter((i) => i >= 0);
}

/** つぎに すすむ ゾーン（クリア済み最深＋1）。実績なしなら 0 */
export function zoneFrontier(zoneIds: string[]): number {
  const cleared = clearedIndices(zoneIds);
  return cleared.length ? Math.max(...cleared) + 1 : 0;
}

/**
 * ゾーンが あそべるか。
 * - はじめての子（クリア履歴なし）は さいしょの 章だけ（ガイド）
 * - 実績のある子は フロンティア＋さきどりぶん まで チャレンジできる
 * クリア済みの 章は つねに あそべる（やりなおし）。
 */
export function isZoneUnlocked(zoneIndex: number, zoneIds: string[]): boolean {
  if (zoneIndex === 0) return true;
  if (isZoneCleared(zoneIds[zoneIndex])) return true;
  const cleared = clearedIndices(zoneIds);
  if (cleared.length === 0) return false; // 実績なし＝線形（さいしょの章のみ）
  return zoneIndex <= Math.max(...cleared) + 1 + ZONE_LOOKAHEAD;
}

export type ZoneStatus = 'cleared' | 'current' | 'new' | 'locked';

/**
 * ハブ表示用の 章の じょうたい。
 * - cleared: もう よんだ（やりなおせる）
 * - current: つぎに よむ つづき（いまここ）
 * - new:     あそべるけど まだ よんでいない（さきどり／とばした章）
 * - locked:  まだ ひらかない
 */
export function zoneStatus(zoneIndex: number, zoneIds: string[]): ZoneStatus {
  if (isZoneCleared(zoneIds[zoneIndex])) return 'cleared';
  if (!isZoneUnlocked(zoneIndex, zoneIds)) return 'locked';
  return zoneIndex === zoneFrontier(zoneIds) ? 'current' : 'new';
}

export function loadTornPages(): TornPage[] {
  return loadJson<TornPage[]>(TORN_KEY, []);
}

export function addTornPage(page: TornPage): void {
  const pages = loadTornPages();
  pages.push(page);
  saveJson(TORN_KEY, pages);
}

export function removeTornPage(nodeId: string): void {
  const pages = loadTornPages().filter((p) => p.nodeId !== nodeId);
  saveJson(TORN_KEY, pages);
}

/** ✨きらきら獲得数を計算（ノーミス: 3、1ミス: 2、2ミス: 1、3ミス以上: 1）*/
export function calcSparkles(maxHp: number, remainingHp: number): number {
  const damage = maxHp - remainingHp;
  if (damage === 0) return 3;
  if (damage === 1) return 2;
  return 1;
}

export function makeInitialRun(_zoneId: string, startId: string): RunState {
  return {
    hp: 3,
    maxHp: 3,
    items: [],
    currentNodeId: startId,
    visitedIds: [],
    tornPages: [],
    sparkles: 0,
    startedAt: Date.now(),
  };
}
