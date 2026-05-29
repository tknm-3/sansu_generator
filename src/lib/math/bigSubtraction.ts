import type { ExplainStep } from './explain';

export interface BigSubtractionProblem {
  a: number;
  b: number;
  onesA: number;
  onesB: number;
  tensA: number;
  tensB: number;
  choices: number[];
}

export function generateBigSubtraction(rng: () => number = Math.random): BigSubtractionProblem {
  const b = Math.floor(rng() * 40) + 10;
  const a = b + Math.floor(rng() * 40) + 1;
  const answer = a - b;
  const onesA = a % 10;
  const tensA = Math.floor(a / 10);
  const onesB = b % 10;
  const tensB = Math.floor(b / 10);
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.max(1, answer + (Math.floor(rng() * 10) - 5));
    if (c !== answer) choices.add(c);
  }
  return { a, b, onesA, onesB, tensA, tensB, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkBigSubtraction(p: BigSubtractionProblem, chosen: number): boolean {
  return chosen === p.a - p.b;
}

export function explainBigSubtraction(p: BigSubtractionProblem): ExplainStep[] {
  const borrow = p.onesA < p.onesB;
  const onesResult = borrow ? p.onesA + 10 - p.onesB : p.onesA - p.onesB;
  const tensResult = (borrow ? p.tensA - 1 : p.tensA) - p.tensB;
  return [
    {
      kind: 'placeValue',
      caption: borrow
        ? `いちの くらい: ${p.onesA}から ${p.onesB}は ひけない\nじゅうから 10 かりて ${p.onesA + 10}－${p.onesB}＝${onesResult}`
        : `いちの くらい: ${p.onesA}－${p.onesB}＝${onesResult}`,
      narration: borrow
        ? `いちのくらいは じゅうから かりて ${onesResult}`
        : `いちのくらいは ${p.onesA}ひく${p.onesB}で ${onesResult}`,
      data: { tens: 0, ones: onesResult, carry: borrow },
    },
    {
      kind: 'placeValue',
      caption: borrow
        ? `じゅうの くらい: ${p.tensA}－1－${p.tensB}＝${tensResult}`
        : `じゅうの くらい: ${p.tensA}－${p.tensB}＝${tensResult}`,
      narration: `じゅうのくらいは ${tensResult}`,
      data: { tens: tensResult, ones: 0 },
      quiz: {
        prompt: `のこりは ぜんぶで いくつ？`,
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
