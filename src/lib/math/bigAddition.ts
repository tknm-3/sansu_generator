export interface BigAdditionProblem {
  a: number;
  b: number;
  onesA: number;
  onesB: number;
  tensA: number;
  tensB: number;
  choices: number[];
}

export function generateBigAddition(rng: () => number = Math.random): BigAdditionProblem {
  const a = Math.floor(rng() * 40) + 10;
  const b = Math.floor(rng() * 40) + 10;
  const answer = a + b;
  const onesA = a % 10;
  const tensA = Math.floor(a / 10);
  const onesB = b % 10;
  const tensB = Math.floor(b / 10);
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = answer + (Math.floor(rng() * 10) - 5);
    if (c > 0 && c !== answer) choices.add(c);
  }
  return { a, b, onesA, onesB, tensA, tensB, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkBigAddition(p: BigAdditionProblem, chosen: number): boolean {
  return chosen === p.a + p.b;
}
