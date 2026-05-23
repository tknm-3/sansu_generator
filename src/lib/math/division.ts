export interface DivisionProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  choices: number[];
}

export function generateDivision(
  rng: () => number = Math.random,
  withRemainder = false,
): DivisionProblem {
  const divisor = Math.floor(rng() * 7) + 2;
  const quotient = Math.floor(rng() * 8) + 2;
  const remainder = withRemainder ? Math.floor(rng() * (divisor - 1)) : 0;
  const dividend = divisor * quotient + remainder;
  const choices = new Set<number>([quotient]);
  while (choices.size < 3) {
    const c = Math.max(1, quotient + (Math.floor(rng() * 6) - 3));
    if (c !== quotient) choices.add(c);
  }
  return {
    dividend,
    divisor,
    quotient,
    remainder,
    choices: [...choices].sort(() => rng() - 0.5),
  };
}

export function checkDivision(p: DivisionProblem, chosen: number): boolean {
  return chosen === p.quotient;
}
