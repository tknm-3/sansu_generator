// 「ぴったりはめよう」「タングラム」の セッション管理。
// ・おなじ パズルが つづけて でないように、さいきん だした ものを おぼえておく。
// ・クリアした かずに おうじて「ランク（しょうごう）」を かえして、すすんでる かんじを だす。

/** さいきん だした パズルID（あたらしい ものが せんとう） */
export type RecentIds = string[];

/**
 * さいきん だしていない パズルを ゆうせんして count こ えらぶ（じゅんばんは ランダム）。
 * fresh（さいきん だしてない）→ stale（さいきん だした）の じゅんで うめる。
 * テストしやすいように らんすう せいせいき（rng）を さしかえ かのうに する。
 */
export function pickPuzzles<T extends { id: string }>(
  all: T[],
  recentIds: RecentIds,
  count: number,
  rng: () => number = Math.random,
): T[] {
  if (all.length === 0) return [];
  const recent = new Set(recentIds);
  const shuffled = (arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const fresh = shuffled(all.filter((p) => !recent.has(p.id)));
  const stale = shuffled(all.filter((p) => recent.has(p.id)));
  const ordered = [...fresh, ...stale];
  const want = Math.min(count, all.length);
  return ordered.slice(0, want);
}

/**
 * あたらしく だしたIDを りれきに くわえて、ちょっきん keep こ だけ のこす（じゅうふく なし）。
 * keep は「ぜんたいの だいたい はんぶん」くらいを わたすと、てきどに ばらける。
 */
export function rememberPuzzles(prev: RecentIds, newIds: string[], keep: number): RecentIds {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...newIds, ...prev]) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.slice(0, Math.max(0, keep));
}

export interface PuzzleRank {
  label: string;
  emoji: string;
  /** つぎの ランクまで あと なんかい クリアが ひつようか（さいこうランクは 0） */
  toNext: number;
}

const RANK_STEPS: Array<{ min: number; label: string; emoji: string }> = [
  { min: 0, label: 'はじめまして', emoji: '🐣' },
  { min: 1, label: 'がんばってるね', emoji: '🌱' },
  { min: 3, label: 'じょうずだね', emoji: '✨' },
  { min: 6, label: 'パズル はかせ', emoji: '🌟' },
  { min: 10, label: 'パズル マスター', emoji: '👑' },
];

/** クリアした かいすう から いまの ランクを かえす。 */
export function puzzleRank(clears: number): PuzzleRank {
  let idx = 0;
  for (let i = 0; i < RANK_STEPS.length; i++) {
    if (clears >= RANK_STEPS[i].min) idx = i;
  }
  const cur = RANK_STEPS[idx];
  const next = RANK_STEPS[idx + 1];
  return {
    label: cur.label,
    emoji: cur.emoji,
    toNext: next ? next.min - clears : 0,
  };
}
