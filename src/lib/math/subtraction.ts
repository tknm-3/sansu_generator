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
