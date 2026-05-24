import type { ProblemType } from './problemTemplates';

export interface Goal {
  id: string;
  type: ProblemType;
  label: string;
  prompt: string;
  validate: (a: number, b: number, answer: number) => boolean;
  hint: string;
}

export const GOALS: Goal[] = [
  {
    id: 'add-make10',
    type: 'addition',
    label: 'こたえを 10に',
    prompt: 'こたえが 10に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 10,
    hint: 'おしい！ ふたつ あわせて 10こに なるように かずを かえてみよう。',
  },
  {
    id: 'sub-left1',
    type: 'subtraction',
    label: 'のこりを 1こに',
    prompt: 'のこりが 1こに なるように つくろう！',
    validate: (a, b) => a - b === 1,
    hint: 'おしい！ のこりが 1こに なるには、1こだけ おおく すればいいよ。',
  },
  {
    id: 'mul-make12',
    type: 'multiplication',
    label: 'こたえを 12に',
    prompt: 'こたえが 12に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 12,
    hint: 'おしい！ 3と 4、2と 6 みたいに かけて 12に なる かずを さがそう。',
  },
  {
    id: 'div-exact',
    type: 'division',
    label: 'ちょうど わける',
    prompt: 'あまりが でないように（ちょうど わけきれるように）つくろう！',
    validate: (a, b) => b !== 0 && a % b === 0,
    hint: 'おしい！ あまりが でちゃった。ちょうど わけられる かずに してみよう。',
  },
];

export function goalsForType(type: ProblemType): Goal[] {
  return GOALS.filter((g) => g.type === type);
}
