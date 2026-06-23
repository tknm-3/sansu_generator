import { RIKA_GROUPS, RIKA_SEQUENCES } from './data';
import type { RikaQuestion, RikaKind } from './types';

// りかランドの問題生成。rng 既定は Math.random（テストは seeded を渡す）。
export type Rng = () => number;
const R = (rng?: Rng): number => (rng ? rng() : Math.random());

function pick<T>(arr: T[], rng?: Rng): T {
  return arr[Math.floor(R(rng) * arr.length)];
}
function shuffle<T>(arr: T[], rng?: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R(rng) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 分類: お題の なかま に あう絵を 1つ えらぶ ──
export function genClassify(rng?: Rng): RikaQuestion {
  const g = pick(RIKA_GROUPS, rng);
  const correct = pick(g.members, rng);
  const ds = shuffle(g.distractors, rng).slice(0, 3);
  const opts = shuffle([correct, ...ds], rng);
  return {
    kind: 'classify',
    prompt: g.prompt,
    speak: g.prompt,
    groupId: g.id,
    choices: opts.map((e) => ({ emoji: e })),
    answer: opts.indexOf(correct),
  };
}

// ── なかまはずれ: 3つは なかま、1つだけ ちがう。それを えらぶ ──
const ODD_PROMPT = 'なかま じゃない のは どれ？';
export function genOdd(rng?: Rng): RikaQuestion {
  const g = pick(RIKA_GROUPS.filter((x) => x.members.length >= 3), rng);
  const sames = shuffle(g.members, rng).slice(0, 3);
  const odd = pick(g.distractors, rng);
  const opts = shuffle([...sames, odd], rng);
  return {
    kind: 'odd-one-out',
    prompt: ODD_PROMPT,
    speak: ODD_PROMPT,
    groupId: g.id,
    choices: opts.map((e) => ({ emoji: e })),
    answer: opts.indexOf(odd),
  };
}

// ── そだつ じゅんばん: シャッフルした絵を さいしょ から じゅんに タップ ──
export function genSequence(rng?: Rng): RikaQuestion {
  const seq = pick(RIKA_SEQUENCES, rng);
  const stages = seq.stages;
  // perm[displayPos] = もとの stage index（表示順）
  const perm = shuffle(stages.map((_, i) => i), rng);
  const choices = perm.map((i) => ({ emoji: stages[i] }));
  // order[rank] = rank番目に タップすべき choice(表示) index
  const order = stages.map((_, rank) => perm.indexOf(rank));
  return {
    kind: 'sequence',
    prompt: seq.prompt,
    speak: seq.prompt,
    groupId: seq.id,
    choices,
    answer: -1,
    order,
  };
}

/** メカを 指定 or ランダムで 1問つくる */
export function generateRika(rng?: Rng, kind?: RikaKind): RikaQuestion {
  const k = kind ?? pick(['classify', 'odd-one-out', 'sequence'] as RikaKind[], rng);
  if (k === 'classify') return genClassify(rng);
  if (k === 'odd-one-out') return genOdd(rng);
  return genSequence(rng);
}
