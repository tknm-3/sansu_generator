import type { ExplainStep } from './explain';

export interface SubtractionProblem {
  a: number;
  b: number;
  choices: number[];
}

export function generateSubtraction(rng: () => number = Math.random): SubtractionProblem {
  const a = Math.floor(rng() * 9) + 2;
  const b = Math.floor(rng() * (a - 1)) + 1;
  const answer = a - b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 10);
    if (c !== answer) choices.add(c);
  }
  return { a, b, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkSubtraction(p: SubtractionProblem, chosen: number): boolean {
  return chosen === p.a - p.b;
}

export function explainSubtraction(p: SubtractionProblem, emoji: string): ExplainStep[] {
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.a}こ あるよ`,
      narration: `はじめに ${p.a}こ`,
      data: { emoji, count: p.a },
    },
    {
      kind: 'objects',
      caption: `${p.b}こ たべちゃった！\nのこりを かぞえてみよう`,
      narration: `${p.b}こ へったよ。のこりは なんこかな`,
      data: { emoji, count: p.a - p.b },
      quiz: {
        prompt: 'のこりは なんこ？',
        choices: p.choices,
        answer: p.a - p.b,
      },
    },
    {
      kind: 'equation',
      caption: 'のこりは…',
      narration: `${p.a}ひく${p.b}は ${p.a - p.b}`,
      data: { text: `${p.a}－${p.b} ＝ ${p.a - p.b}` },
    },
  ];
}
