import type { ExplainStep } from './explain';

/** 10にするために あと何個必要か（0..10にクランプ） */
export function missingToTen(current: number): number {
  if (current >= 10) return 0;
  if (current < 0) return 10;
  return 10 - current;
}

/** 選んだ値で10が完成するか */
export function isCorrectMissing(current: number, chosen: number): boolean {
  return current + chosen === 10;
}

/**
 * 答え選択肢を3つ生成（正解を必ず含む）。
 * rng は 0..1 を返す関数（テスト容易性のため注入可能、既定は Math.random）
 *
 * Note: rng が定数を返す場合でも無限ループを防ぐため、候補が既にセットに
 * 含まれている場合は (candidate + 1) % 11 で次の値を決定論的に探す。
 * これにより 0..10 の範囲内で必ず 3 つのユニークな値が得られる。
 */
export function makeAnswerChoices(current: number, rng: () => number = Math.random): number[] {
  const correct = missingToTen(current);
  const choices = new Set<number>([correct]);
  while (choices.size < 3) {
    let candidate = Math.floor(rng() * 11); // 0..10
    // If this candidate is already chosen, increment deterministically to avoid infinite loop
    while (choices.has(candidate)) {
      candidate = (candidate + 1) % 11;
    }
    choices.add(candidate);
  }
  return [...choices].sort(() => rng() - 0.5);
}

export function explainMakeTen(current: number, emoji: string): ExplainStep[] {
  const missing = missingToTen(current);
  return [
    {
      kind: 'objects',
      caption: `いま ${current}こ`,
      narration: `いま ${current}こ あるよ`,
      data: { emoji, count: current },
    },
    {
      kind: 'objects',
      caption: `あと ${missing}こ たすと…`,
      narration: `あと ${missing}こで 10こ`,
      data: { emoji, count: missing },
    },
    {
      kind: 'equation',
      caption: '10の できあがり！',
      narration: `${current}たす${missing}で 10`,
      data: { text: `${current} ＋ ${missing} ＝ 10` },
    },
  ];
}
