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

const EMPTY_HISTORY: AdventureHistory = { zones: [], totalSparkles: 0 };

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
  return loadJson<AdventureHistory>(HISTORY_KEY, EMPTY_HISTORY);
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

export function isZoneUnlocked(zoneIndex: number, zoneIds: string[]): boolean {
  if (zoneIndex === 0) return true;
  return isZoneCleared(zoneIds[zoneIndex - 1]);
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
