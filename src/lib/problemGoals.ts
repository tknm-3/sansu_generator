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
  // --- たしざん ---
  {
    id: 'add-make10',
    type: 'addition',
    label: 'こたえを 10に',
    prompt: 'こたえが ちょうど 10に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 10,
    hint: 'おしい！ ふたつ あわせて 10こに なるように かずを かえてみよう。',
  },
  {
    id: 'add-make5',
    type: 'addition',
    label: 'こたえを 5に',
    prompt: 'こたえが ちょうど 5に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 5,
    hint: 'おしい！ あわせて 5に なる かずを さがしてみよう（1と4、2と3 など）。',
  },
  {
    id: 'add-big',
    type: 'addition',
    label: 'こたえを 15いじょうに',
    prompt: 'こたえが 15いじょう に なるように つくろう！',
    validate: (_a, _b, ans) => ans >= 15,
    hint: 'おしい！ もっと おおきい かずを えらんでみよう。',
  },
  {
    id: 'add-same',
    type: 'addition',
    label: 'ふたつの かずを おなじに',
    prompt: 'かず① と かず② を おなじ かずに してみよう！',
    validate: (a, b) => a === b,
    hint: 'おしい！ かず① と かず② を おなじ すうじに してみよう。',
  },
  // --- ひきざん ---
  {
    id: 'sub-left1',
    type: 'subtraction',
    label: 'のこりを 1こに',
    prompt: 'のこりが ちょうど 1こに なるように つくろう！',
    validate: (a, b) => a - b === 1,
    hint: 'おしい！ のこりが 1こに なるには、かず①より 1こ すくない かず②に してみよう。',
  },
  {
    id: 'sub-left5',
    type: 'subtraction',
    label: 'のこりを 5こに',
    prompt: 'のこりが ちょうど 5こに なるように つくろう！',
    validate: (a, b) => a - b === 5,
    hint: 'おしい！ かず① から かず② を ひいて 5に なるように してみよう。',
  },
  {
    id: 'sub-big',
    type: 'subtraction',
    label: 'かず①を おおきく',
    prompt: 'かず① を 8いじょう に してみよう！',
    validate: (a) => a >= 8,
    hint: 'おしい！ かず① を 8、9、10 など もっと おおきく してみよう。',
  },
  // --- かけざん ---
  {
    id: 'mul-make12',
    type: 'multiplication',
    label: 'こたえを 12に',
    prompt: 'こたえが ちょうど 12に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 12,
    hint: 'おしい！ 3と4、2と6、1と12 みたいに かけて 12に なる かずを さがそう。',
  },
  {
    id: 'mul-make20',
    type: 'multiplication',
    label: 'こたえを 20に',
    prompt: 'こたえが ちょうど 20に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 20,
    hint: 'おしい！ 4と5、2と10 みたいに かけて 20に なる かずを さがそう。',
  },
  {
    id: 'mul-big',
    type: 'multiplication',
    label: 'こたえを 16いじょうに',
    prompt: 'こたえが 16いじょう に なるように つくろう！',
    validate: (_a, _b, ans) => ans >= 16,
    hint: 'おしい！ もっと おおきい かずの かけざんに してみよう。',
  },
  // --- わりざん ---
  {
    id: 'div-exact',
    type: 'division',
    label: 'ちょうど わける',
    prompt: 'あまりが でないように（ちょうど わけきれるように）つくろう！',
    validate: (a, b) => b !== 0 && a % b === 0,
    hint: 'おしい！ あまりが でちゃった。ちょうど わけられる かずに してみよう。',
  },
  {
    id: 'div-quotient2',
    type: 'division',
    label: 'こたえを 2に',
    prompt: 'こたえが ちょうど 2に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 2,
    hint: 'おしい！ かず①が かず②の ちょうど 2ばいに なるように してみよう。',
  },
  {
    id: 'div-quotient3',
    type: 'division',
    label: 'こたえを 3に',
    prompt: 'こたえが ちょうど 3に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 3,
    hint: 'おしい！ かず①が かず②の ちょうど 3ばいに なるように してみよう。',
  },
  {
    id: 'div-big-divisor',
    type: 'division',
    label: 'わる かずを おおきく',
    prompt: 'わる かず（かず②）を 4いじょう に してみよう！',
    validate: (_a, b) => b >= 4,
    hint: 'おしい！ かず② を 4か 5に してみよう。',
  },
];

export function goalsForType(type: ProblemType): Goal[] {
  return GOALS.filter((g) => g.type === type);
}

export function randomGoalForType(type: ProblemType): Goal | undefined {
  const list = goalsForType(type);
  if (list.length === 0) return undefined;
  return list[Math.floor(Math.random() * list.length)];
}
