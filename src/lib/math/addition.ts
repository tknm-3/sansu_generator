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
