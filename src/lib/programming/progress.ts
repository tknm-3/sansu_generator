/**
 * プログラミング単元の 難易度アンロック管理。
 * 「かんたんを 何回か クリアしたら ふつう」「ふつうを 何回か クリアしたら むずかしい」。
 * 既存のスタンプ（rewards/stamps）とは別軸で、単元×難易度ごとのクリア回数を記録する。
 */
import { loadJson, saveJson } from '../storage';

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
