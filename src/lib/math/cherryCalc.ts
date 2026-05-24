import type { ExplainStep } from './explain';

export interface Decomposition {
  a: number;
  b: number;
  split: number;
  carry: number;
  ten: number;
  answer: number;
}

export interface CarryProblem {
  a: number;
  b: number;
  choices: number[];
}

export function decompose(a: number, b: number): Decomposition {
  const split = 10 - a;
  return {
    a,
    b,
    split,
    carry: b - split,
    ten: 10,
    answer: a + b,
  };
}

export function generateCarryProblem(rng: () => number = Math.random): CarryProblem {
  let a: number, b: number;
  do {
    a = Math.floor(rng() * 4) + 6;
    b = Math.floor(rng() * 8) + 2;
  } while (a + b <= 10 || a + b > 18);
  const answer = a + b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 8) + 11;
    if (c !== answer) choices.add(c);
  }
  return { a, b, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkCarry(p: CarryProblem, chosen: number): boolean {
  return chosen === p.a + p.b;
}

export function explainCherry(p: CarryProblem): ExplainStep[] {
  const dec = decompose(p.a, p.b);
  return [
    {
      kind: 'cherryBranch',
      caption: `${p.b}を ${dec.split}と ${dec.carry}に わけよう\n${p.a}＋${dec.split}で 10`,
      narration: `${p.b}を ${dec.split}と ${dec.carry}に わけて まず 10をつくる`,
      data: { b: p.b, split: dec.split, carry: dec.carry },
    },
    {
      kind: 'equation',
      caption: '10と のこりで…',
      narration: `10たす${dec.carry}で ${dec.answer}`,
      data: { text: `10 ＋ ${dec.carry} ＝ ${dec.answer}` },
    },
  ];
}
