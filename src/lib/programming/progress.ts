/**
 * プログラミング単元の 難易度アンロック管理。
 * 「かんたんを 何回か クリアしたら ふつう」「ふつうを 何回か クリアしたら むずかしい」。
 * 既存のスタンプ（rewards/stamps）とは別軸で、単元×難易度ごとのクリア回数を記録する。
 */
import { loadJson, saveJson } from '../storage';
import { ADVENTURE_QUEST, ADVENTURE_ZONES } from './adventureLevels';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'superhard';

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'superhard'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'かんたん',
  normal: 'ふつう',
  hard: 'むずかしい',
  superhard: 'スペシャル',
};

export const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: '🌱',
  normal: '⭐',
  hard: '🔥',
  superhard: '💎',
};

/** つぎの 難易度を ひらくのに ひつような クリア回数 */
export const UNLOCK_THRESHOLD = 2;

const KEY = 'math-app:prog-progress';

interface ProgProgress {
  /** `${unitId}:${difficulty}` -> クリア回数 */
  clears: Record<string, number>;
}

const EMPTY: ProgProgress = { clears: {} };

function load(): ProgProgress {
  return loadJson<ProgProgress>(KEY, EMPTY);
}

function slotKey(unitId: string, diff: Difficulty): string {
  return `${unitId}:${diff}`;
}

/** その単元・難易度の クリア回数 */
export function getClears(unitId: string, diff: Difficulty): number {
  return load().clears[slotKey(unitId, diff)] ?? 0;
}

/** クリアを1回 きろくして、新しい合計回数を返す */
export function addClear(unitId: string, diff: Difficulty): number {
  const state = load();
  const key = slotKey(unitId, diff);
  const next = (state.clears[key] ?? 0) + 1;
  saveJson(KEY, { clears: { ...state.clears, [key]: next } });
  return next;
}

const PREV_DIFF: Partial<Record<Difficulty, Difficulty>> = {
  normal: 'easy',
  hard: 'normal',
  superhard: 'hard',
};

/** その難易度が あそべる（解放ずみ）か */
export function isUnlocked(unitId: string, diff: Difficulty): boolean {
  if (diff === 'easy') return true;
  const prev = PREV_DIFF[diff]!;
  return getClears(unitId, prev) >= UNLOCK_THRESHOLD;
}

/** つぎの難易度を ひらくまでの のこり回数（0なら解放ずみ／最高難易度） */
export function clearsToUnlockNext(unitId: string, diff: Difficulty): number {
  if (diff === 'superhard') return 0;
  return Math.max(0, UNLOCK_THRESHOLD - getClears(unitId, diff));
}

/** クリアした結果、つぎの難易度が あらたに 解放されたか（演出用） */
export function didUnlockNext(diff: Difficulty, clearsAfter: number): boolean {
  if (diff === 'superhard') return false;
  return clearsAfter === UNLOCK_THRESHOLD;
}

// ───────────────────────── ぼうけんしよう（問題集モード）─────────────────────────
// いつでも あそべる 特別枠（解放じょうけんは なし）。
// 1問ずつ じゅんばんに クリアしていき、達成度を 可視化する。

const ADV_KEY = 'math-app:adventure-progress';

interface AdventureProgress {
  /** questId -> 達成じょうきょう */
  cleared: Record<string, { perfect: boolean }>;
  /** あつめた きらきら（✨）の ごうけい。クリアの たびに ふえる（リプレイでも ふえる）*/
  sparkles?: number;
}

const ADV_EMPTY: AdventureProgress = { cleared: {}, sparkles: 0 };

function loadAdv(): AdventureProgress {
  return loadJson<AdventureProgress>(ADV_KEY, ADV_EMPTY);
}

/** クリア1回で もらえる きらきら（ぴったり賞は ボーナス）*/
export const SPARKLE_CLEAR = 1;
export const SPARKLE_PERFECT = 3;

/** あつめた きらきらの ごうけい */
export function getSparkles(): number {
  return loadAdv().sparkles ?? 0;
}

/** 冒険モードは いつでも あそべる（解放じょうけんは なし） */
export function isAdventureUnlocked(): boolean {
  return true;
}

/** その問題の 達成じょうきょう（なければ null） */
export function getQuestCleared(questId: string): { perfect: boolean } | null {
  return loadAdv().cleared[questId] ?? null;
}

/** その問題を クリアずみか */
export function isQuestCleared(questId: string): boolean {
  return getQuestCleared(questId) != null;
}

/**
 * 問題クリアを きろくして、こんかい もらった きらきら(✨)の かずを かえす。
 * ぴったり賞は いちど とれば のこる。きらきらは クリアの たびに ふえる（同じ問題の
 * リプレイでも ふえる）ので、「もう いちど とこう」の どうきづけに なる。
 */
export function addQuestClear(questId: string, perfect: boolean): number {
  const state = loadAdv();
  const prev = state.cleared[questId];
  const nextPerfect = (prev?.perfect ?? false) || perfect;
  const earned = perfect ? SPARKLE_PERFECT : SPARKLE_CLEAR;
  saveJson(ADV_KEY, {
    cleared: { ...state.cleared, [questId]: { perfect: nextPerfect } },
    sparkles: (state.sparkles ?? 0) + earned,
  });
  return earned;
}

/** 達成度サマリ（達成度バー・パーセント表示用） */
export function getAdventureSummary(): { total: number; clearedCount: number; perfectCount: number } {
  const state = loadAdv();
  let clearedCount = 0;
  let perfectCount = 0;
  for (const q of ADVENTURE_QUEST) {
    const c = state.cleared[q.id];
    if (c) {
      clearedCount += 1;
      if (c.perfect) perfectCount += 1;
    }
  }
  return { total: ADVENTURE_QUEST.length, clearedCount, perfectCount };
}

/** いま あたらしく あそべる（フロンティアの）問題の index。ぜんぶ クリアずみなら length */
export function nextPlayableIndex(): number {
  const state = loadAdv();
  for (let i = 0; i < ADVENTURE_QUEST.length; i++) {
    if (!state.cleared[ADVENTURE_QUEST[i].id]) return i;
  }
  return ADVENTURE_QUEST.length;
}

/** その index の問題が あそべる（クリアずみ または フロンティア）か */
export function isQuestUnlocked(index: number): boolean {
  return index <= nextPlayableIndex();
}

export type ZoneStatus = 'cleared' | 'current' | 'next' | 'locked';

/** そのゾーンの 問題が ぜんぶ クリアずみか */
function isZoneCleared(zoneId: string): boolean {
  const state = loadAdv();
  const quests = ADVENTURE_QUEST.filter((q) => q.zoneId === zoneId);
  return quests.length > 0 && quests.every((q) => state.cleared[q.id]);
}

/** いま いる ゾーンの id（フロンティアの問題が ぞくする ゾーン） */
export function currentZoneId(): string {
  const idx = Math.min(nextPlayableIndex(), ADVENTURE_QUEST.length - 1);
  return ADVENTURE_QUEST[idx].zoneId;
}

/** マップ表示用：ゾーンの じょうたい */
export function getZoneStatus(zoneId: string): ZoneStatus {
  if (isZoneCleared(zoneId)) return 'cleared';
  const cur = currentZoneId();
  if (zoneId === cur) return 'current';
  const curIdx = ADVENTURE_ZONES.findIndex((z) => z.id === cur);
  const thisIdx = ADVENTURE_ZONES.findIndex((z) => z.id === zoneId);
  if (thisIdx === curIdx + 1) return 'next';
  return 'locked';
}
