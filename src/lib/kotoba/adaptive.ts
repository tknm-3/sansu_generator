import { loadJson, saveJson } from '../storage';
import type { GenOpts } from './generate';
import type { LineId } from './types';

// 適応的難易度（§8）。連続正解で1段あがり、つまずきで1段さがる。
// 常に ~80% 正答帯に よせ、やさしすぎ/むずかしすぎを 避ける。

const STATS_KEY = 'kotoba-adventure:stats';

export interface LineStat {
  correct: number;
  wrong: number;
}
export type KotobaStats = Record<string, LineStat>;

export function loadStats(): KotobaStats {
  return loadJson<KotobaStats>(STATS_KEY, {});
}

/** 1問の結果を ログ（パーソナライズ・検証の燃料）。latency では 罰しない。 */
export function recordAttempt(lineId: LineId, correct: boolean): void {
  const s = loadStats();
  const st = s[lineId] ?? { correct: 0, wrong: 0 };
  if (correct) st.correct++; else st.wrong++;
  s[lineId] = st;
  saveJson(STATS_KEY, s);
}

/** 適応レベルの 上限（4＝天井を のばした 上級） */
export const MAX_LEVEL = 4;

/** レベル(1〜4)→ 出題オプション。床は保ち、上だけ のばす（§エビデンス） */
export function optsForLevel(level: number): GenOpts {
  if (level <= 1) return { minMora: 2, maxMora: 2, choiceCount: 3 };
  if (level === 2) return { minMora: 2, maxMora: 3, choiceCount: 4 };
  if (level === 3) return { minMora: 3, maxMora: 4, choiceCount: 4 };
  return { minMora: 3, maxMora: 5, choiceCount: 5 }; // レベル4: 4〜5モーラ・5択
}

export interface Adaptive {
  level: number;
  opts: () => GenOpts;
  record: (correct: boolean) => void;
}

/**
 * セッション内の 適応コントローラ。
 * - 2連続せいかい → レベル+1（最大3）
 * - 1つでも つまずき → レベル-1（最小1）、連続カウントを リセット
 */
export function makeAdaptive(startLevel = 1): Adaptive {
  let level = Math.min(MAX_LEVEL, Math.max(1, startLevel));
  let streak = 0;
  return {
    get level() { return level; },
    opts: () => optsForLevel(level),
    record(correct: boolean) {
      if (correct) {
        streak++;
        if (streak >= 2 && level < MAX_LEVEL) { level++; streak = 0; }
      } else {
        streak = 0;
        if (level > 1) level--;
      }
    },
  };
}
