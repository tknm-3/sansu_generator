import type { ExplainStep } from './explain';

export interface AdditionProblem {
  a: number;
  b: number;
  choices: number[];
}

export function generateAddition(rng: () => number = Math.random): AdditionProblem {
  const a = Math.floor(rng() * 9) + 1;
  const b = Math.floor(rng() * Math.min(9, 20 - a)) + 1;
  const answer = a + b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 19) + 2;
    if (c !== answer) choices.add(c);
  }
  return { a, b, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkAddition(p: AdditionProblem, chosen: number): boolean {
  return chosen === p.a + p.b;
}

export function explainAddition(p: AdditionProblem, emoji: string): ExplainStep[] {
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.a}こ`,
      narration: `はじめに ${p.a}こ`,
      data: { emoji, count: p.a },
    },
    {
      kind: 'objects',
      caption: `${p.b}こ ふえた`,
      narration: `${p.b}こ ふえたよ`,
      data: { emoji, count: p.b },
      quiz: {
        prompt: `${p.a}こと ${p.b}こ。あわせて なんこ？`,
        choices: p.choices,
        answer: p.a + p.b,
      },
    },
    {
      kind: 'equation',
      caption: 'あわせると…',
      narration: `${p.a}たす${p.b}は ${p.a + p.b}`,
      data: { text: `${p.a}＋${p.b} ＝ ${p.a + p.b}` },
    },
  ];
}
