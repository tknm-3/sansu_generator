import type { ExplainStep } from './explain';

export interface BigAdditionProblem {
  a: number;
  b: number;
  onesA: number;
  onesB: number;
  tensA: number;
  tensB: number;
  choices: number[];
}

export function generateBigAddition(
  rng: () => number = Math.random,
  opts: { mixed?: boolean; oneDigitB?: boolean; carry?: boolean } = {},
): BigAdditionProblem {
  // どんな くみあわせの ふたつの かずを つくるか
  const pick = (): [number, number] => {
    // oneDigitB: 2けた(10-49) ＋ 1けた(1-9)
    if (opts.oneDigitB) return [Math.floor(rng() * 40) + 10, Math.floor(rng() * 9) + 1];
    // mixed: 片方2けた(10-49)、もう片方1けた(1-9)
    if (opts.mixed)
      return rng() < 0.5
        ? [Math.floor(rng() * 40) + 10, Math.floor(rng() * 9) + 1]
        : [Math.floor(rng() * 9) + 1, Math.floor(rng() * 40) + 10];
    // きほん: 2けた(10-49) ＋ 2けた(10-49)
    return [Math.floor(rng() * 40) + 10, Math.floor(rng() * 40) + 10];
  };
  let [a, b] = pick();
  // carry が してい されたら「いちの くらいで くりあがる/くりあがらない」を そろえる
  if (opts.carry !== undefined) {
    for (let i = 0; i < 40 && (a % 10) + (b % 10) >= 10 !== opts.carry; i++) {
      [a, b] = pick();
    }
  }
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

export function explainBigAddition(p: BigAdditionProblem): ExplainStep[] {
  const onesSum = p.onesA + p.onesB;
  const carry = onesSum >= 10;
  const tensSum = p.tensA + p.tensB + (carry ? 1 : 0);
  return [
    {
      kind: 'placeValue',
      caption: carry
        ? `いちの くらい: ${p.onesA}＋${p.onesB}＝${onesSum}\n10は じゅうに くりあげ`
        : `いちの くらい: ${p.onesA}＋${p.onesB}＝${onesSum}`,
      narration: `いちのくらいは ${p.onesA}たす${p.onesB}で ${onesSum}`,
      data: { tens: 0, ones: onesSum, carry },
    },
    {
      kind: 'placeValue',
      caption: carry
        ? `じゅうの くらい: ${p.tensA}＋${p.tensB}＋1＝${tensSum}`
        : `じゅうの くらい: ${p.tensA}＋${p.tensB}＝${tensSum}`,
      narration: `じゅうのくらいは あわせて ${tensSum}`,
      data: { tens: tensSum, ones: 0 },
      quiz: {
        prompt: `ぜんぶ あわせると いくつ？`,
        choices: p.choices,
        answer: p.a + p.b,
      },
    },
    {
      kind: 'equation',
      caption: 'ぜんぶ あわせると…',
      narration: `${p.a}たす${p.b}は ${p.a + p.b}`,
      data: { text: `${p.a}＋${p.b} ＝ ${p.a + p.b}` },
    },
  ];
}
