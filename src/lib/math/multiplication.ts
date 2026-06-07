import type { ExplainStep } from './explain';

export interface MultiplicationProblem {
  a: number;
  b: number;
  groups: number[];
  choices: number[];
}

export interface MultiplicationOptions {
  /** かける数・かけられる数の さいしょう（きほん 2） */
  minFactor?: number;
  /** かける数・かけられる数の さいだい（きほん 9）。5の段までなら 5 */
  maxFactor?: number;
}

export function generateMultiplication(
  rng: () => number = Math.random,
  options: MultiplicationOptions = {},
): MultiplicationProblem {
  const minFactor = options.minFactor ?? 2;
  const maxFactor = options.maxFactor ?? 9;
  const span = maxFactor - minFactor + 1;
  const a = Math.floor(rng() * span) + minFactor;
  const b = Math.floor(rng() * span) + minFactor;
  const answer = a * b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.max(1, answer + (Math.floor(rng() * 10) - 5));
    if (c !== answer) choices.add(c);
  }
  return {
    a,
    b,
    groups: Array(a).fill(b),
    choices: [...choices].sort(() => rng() - 0.5),
  };
}

export function checkMultiplication(p: MultiplicationProblem, chosen: number): boolean {
  return chosen === p.a * p.b;
}

export function explainMultiplication(p: MultiplicationProblem, emoji: string): ExplainStep[] {
  const repeated = Array(p.a).fill(p.b).join('＋');
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.b}こで\n1つの かたまり`,
      narration: `${p.b}こで ひとつの かたまりだよ`,
      data: { emoji, count: p.b },
    },
    {
      kind: 'groups',
      caption: `それが ${p.a}つ。\n${repeated} だね`,
      narration: `${p.b}こが ${p.a}つ。${repeated}`,
      data: { emoji, perGroup: p.b, groups: p.a },
      quiz: {
        prompt: `${p.b}こが ${p.a}つ。ぜんぶで なんこ？`,
        choices: p.choices,
        answer: p.a * p.b,
      },
    },
    {
      kind: 'equation',
      caption: 'しきに すると…',
      narration: `${p.a}かける${p.b}は ${p.a * p.b}`,
      data: { text: `${p.a}×${p.b} ＝ ${p.a * p.b}` },
    },
  ];
}
