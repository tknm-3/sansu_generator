export interface MultiplicationProblem {
  a: number;
  b: number;
  groups: number[];
  choices: number[];
}

export function generateMultiplication(rng: () => number = Math.random): MultiplicationProblem {
  const a = Math.floor(rng() * 8) + 2;
  const b = Math.floor(rng() * 8) + 2;
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
