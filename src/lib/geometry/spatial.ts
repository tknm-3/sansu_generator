export interface SceneObj {
  emoji: string;
  name: string;
  col: number;
  row: number;
}

export interface SpatialProblem {
  questionLabel: string;
  objects: SceneObj[];
  question: string;
  choices: string[];
  answerIndex: number;
  hard: boolean;
}

const RAW: Omit<SpatialProblem, 'answerIndex'>[] = [
  // Easy: left/right, 2 objects
  {
    hard: false,
    questionLabel: 'みんなの ばしょを みよう',
    objects: [
      { emoji: '🐱', name: 'ねこ', col: 0, row: 0 },
      { emoji: '🐶', name: 'いぬ', col: 2, row: 0 },
    ],
    question: 'いぬの ひだりに いるのは？',
    choices: ['ねこ', 'いぬ', 'くま', 'うさぎ'],
  },
  {
    hard: false,
    questionLabel: 'みんなの ばしょを みよう',
    objects: [
      { emoji: '🐻', name: 'くま', col: 0, row: 0 },
      { emoji: '🐱', name: 'ねこ', col: 1, row: 0 },
      { emoji: '🐶', name: 'いぬ', col: 2, row: 0 },
    ],
    question: 'ねこの みぎに いるのは？',
    choices: ['いぬ', 'くま', 'ねこ', 'とり'],
  },
  {
    hard: false,
    questionLabel: 'みんなの ばしょを みよう',
    objects: [
      { emoji: '🐦', name: 'とり', col: 0, row: 0 },
      { emoji: '🐰', name: 'うさぎ', col: 1, row: 0 },
      { emoji: '🐟', name: 'さかな', col: 2, row: 0 },
    ],
    question: 'うさぎの ひだりに いるのは？',
    choices: ['とり', 'さかな', 'くま', 'いぬ'],
  },
  // Hard: 2×2 grid, up/down/left/right
  {
    hard: true,
    questionLabel: 'みんなの ばしょを みよう',
    objects: [
      { emoji: '🐱', name: 'ねこ', col: 0, row: 0 },
      { emoji: '🐶', name: 'いぬ', col: 1, row: 0 },
      { emoji: '🐻', name: 'くま', col: 0, row: 1 },
      { emoji: '🐰', name: 'うさぎ', col: 1, row: 1 },
    ],
    question: 'いぬの したに いるのは？',
    choices: ['うさぎ', 'くま', 'ねこ', 'さかな'],
  },
  {
    hard: true,
    questionLabel: 'みんなの ばしょを みよう',
    objects: [
      { emoji: '🐦', name: 'とり', col: 0, row: 0 },
      { emoji: '🐟', name: 'さかな', col: 1, row: 0 },
      { emoji: '🐱', name: 'ねこ', col: 2, row: 0 },
      { emoji: '🐶', name: 'いぬ', col: 0, row: 1 },
      { emoji: '🐻', name: 'くま', col: 1, row: 1 },
      { emoji: '🐰', name: 'うさぎ', col: 2, row: 1 },
    ],
    question: 'くまの うえに いるのは？',
    choices: ['さかな', 'いぬ', 'とり', 'ねこ'],
  },
  {
    hard: true,
    questionLabel: 'みんなの ばしょを みよう',
    objects: [
      { emoji: '🐱', name: 'ねこ', col: 0, row: 0 },
      { emoji: '🐻', name: 'くま', col: 1, row: 0 },
      { emoji: '🐶', name: 'いぬ', col: 0, row: 1 },
      { emoji: '🐰', name: 'うさぎ', col: 1, row: 1 },
    ],
    question: 'くまの ひだりに いるのは？',
    choices: ['ねこ', 'うさぎ', 'いぬ', 'とり'],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const used: Record<string, number[]> = { easy: [], hard: [] };

export function generateSpatialProblem(hard = false): SpatialProblem {
  const key = hard ? 'hard' : 'easy';
  const pool = RAW.filter((p) => p.hard === hard);
  if (used[key].length >= pool.length) used[key] = [];

  const available = pool.map((_, i) => i).filter((i) => !used[key].includes(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  used[key].push(idx);

  const q = pool[idx];
  const withOrig = q.choices.map((c, i) => ({ c, origIdx: i }));
  const shuffled = shuffle(withOrig);
  const answerIndex = shuffled.findIndex((c) => c.origIdx === 0);

  return { ...q, choices: shuffled.map((c) => c.c), answerIndex };
}
