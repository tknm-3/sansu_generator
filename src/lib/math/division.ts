import type { ExplainStep } from './explain';

export interface DivisionProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  choices: number[];
}

export interface DivisionOptions {
  /** わる数（人数）の さいだい（きほん 8）。5の段までなら 5 */
  maxDivisor?: number;
  /** こたえ（しょう）の さいだい（きほん 9）。5の段までなら 5 */
  maxQuotient?: number;
}

export function generateDivision(
  rng: () => number = Math.random,
  withRemainder = false,
  options: DivisionOptions = {},
): DivisionProblem {
  const maxDivisor = options.maxDivisor ?? 8;
  const maxQuotient = options.maxQuotient ?? 9;
  const divisor = Math.floor(rng() * (maxDivisor - 1)) + 2;
  const quotient = Math.floor(rng() * (maxQuotient - 1)) + 2;
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

export function explainDivision(p: DivisionProblem, emoji: string): ExplainStep[] {
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.dividend}こ\nあるよ`,
      narration: `${emoji}が ${p.dividend}こ あるよ`,
      data: { emoji, count: p.dividend },
    },
    {
      kind: 'groups',
      caption: `${p.divisor}人に おなじ かずずつ\nわけてみよう`,
      narration: `${p.divisor}人に おなじ かずずつ わけるよ`,
      data: { emoji, perGroup: p.quotient, groups: p.divisor },
      quiz: {
        prompt: 'ひとり なんこ もらえる？',
        choices: p.choices,
        answer: p.quotient,
      },
    },
    {
      kind: 'equation',
      caption: 'しきに すると…',
      narration: `${p.dividend}わる${p.divisor}は ${p.quotient}`,
      data: { text: `${p.dividend}÷${p.divisor} ＝ ${p.quotient}` },
    },
  ];
}
