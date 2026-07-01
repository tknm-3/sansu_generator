import { RIKA_GROUPS, RIKA_SEQUENCES, RIKA_PREDICTS } from './data';
import { getRikaUnit } from './units';
import type { RikaQuestion, RikaKind, RikaUnitId } from './types';

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
export function genClassify(rng?: Rng, unit?: RikaUnitId): RikaQuestion {
  const pool = unit ? RIKA_GROUPS.filter((x) => x.unit === unit) : RIKA_GROUPS;
  const g = pick(pool.length ? pool : RIKA_GROUPS, rng);
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
export function genOdd(rng?: Rng, unit?: RikaUnitId): RikaQuestion {
  const base = RIKA_GROUPS.filter((x) => x.members.length >= 3 && (!unit || x.unit === unit));
  const g = pick(base.length ? base : RIKA_GROUPS.filter((x) => x.members.length >= 3), rng);
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
export function genSequence(rng?: Rng, unit?: RikaUnitId): RikaQuestion {
  const pool = unit ? RIKA_SEQUENCES.filter((x) => x.unit === unit) : RIKA_SEQUENCES;
  const seq = pick(pool.length ? pool : RIKA_SEQUENCES, rng);
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

// ── 予想: 1つの ものを みせて「どっちに なるか」を 2択で 予想する（POE）──
export function genPredict(rng?: Rng, unit?: RikaUnitId): RikaQuestion {
  const pool = unit ? RIKA_PREDICTS.filter((x) => x.unit === unit) : RIKA_PREDICTS;
  const set = pick(pool.length ? pool : RIKA_PREDICTS, rng);
  const item = pick(set.items, rng);
  return {
    kind: 'predict',
    prompt: set.prompt,
    speak: set.prompt,
    groupId: set.id,
    choices: [],
    answer: item.positive ? 0 : 1, // labels[0]=positive
    itemEmoji: item.emoji,
    labels: set.labels,
    reason: item.reason,
  };
}

/** メカを 指定 or ランダムで 1問つくる（unit で 出題プールを しぼる）*/
export function generateRika(rng?: Rng, kind?: RikaKind, unit?: RikaUnitId): RikaQuestion {
  const kinds = unit ? getRikaUnit(unit).kinds : (['classify', 'odd-one-out', 'sequence'] as RikaKind[]);
  const k = kind ?? pick(kinds, rng);
  if (k === 'classify') return genClassify(rng, unit);
  if (k === 'odd-one-out') return genOdd(rng, unit);
  if (k === 'predict') return genPredict(rng, unit);
  return genSequence(rng, unit);
}
