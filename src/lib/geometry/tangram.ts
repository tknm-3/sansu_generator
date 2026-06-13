// スーパーマーケットの くに（としょかんモード）の タングラム問題 生成API。
// タングラムのピース（さんかく・しかく）で スーパーの しなものの かたちを
// 「くみあわせ／たりないピース／ぶんかい」で とく。
//
// としょかんバトルは『見せる＋選ばせる』なので、お題と選択肢を SVG で描き、
// 既存の shape-compose ビジュアル（ComposeSvg / ShapeChoiceGrid）に そのまま乗せる。

import type { RawTangram, TangramProblem } from './tangramShapes';
import { TANGRAM_COMPOSE, TANGRAM_MISSING, TANGRAM_DECOMPOSE } from './tangramData';

export type { TangramProblem, RawTangram };

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// プールごとに used を持って 重複回避＋選択肢シャッフル（正解は origIdx 0）
function makePicker(pool: RawTangram[]) {
  let used: number[] = [];
  return (rng: () => number): TangramProblem => {
    if (used.length >= pool.length) used = [];
    const available = pool.map((_, i) => i).filter((i) => !used.includes(i));
    const idx = available[Math.floor(rng() * available.length)];
    used.push(idx);
    const q = pool[idx];
    const withIdx = q.choices.map((c, i) => ({ ...c, origIdx: i }));
    const shuffled = shuffle(withIdx, rng);
    return {
      questionSvg: q.questionSvg,
      questionLabel: q.questionLabel,
      choices: shuffled.map(({ svg, label }) => ({ svg, label })),
      answerIndex: shuffled.findIndex((c) => c.origIdx === 0),
    };
  };
}

const pickCompose = makePicker(TANGRAM_COMPOSE);
const pickMissing = makePicker(TANGRAM_MISSING);
const pickDecompose = makePicker(TANGRAM_DECOMPOSE);

export function generateTangramCompose(rng: () => number = Math.random): TangramProblem {
  return pickCompose(rng);
}
export function generateTangramMissing(rng: () => number = Math.random): TangramProblem {
  return pickMissing(rng);
}
export function generateTangramDecompose(rng: () => number = Math.random): TangramProblem {
  return pickDecompose(rng);
}
