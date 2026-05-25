export type ShapeType = 'circle' | 'triangle' | 'square' | 'star';
export type ColorKey = 'red' | 'blue' | 'yellow' | 'green';

export interface PatternItem {
  shape: ShapeType;
  color: ColorKey;
}

export interface PatternProblem {
  sequence: (PatternItem | null)[];
  answer: PatternItem;
  choices: PatternItem[];
  answerIndex: number;
  hard: boolean;
}

const B: ColorKey = 'blue';
const R: ColorKey = 'red';
const Y: ColorKey = 'yellow';
const G: ColorKey = 'green';

const RAW: Omit<PatternProblem, 'answerIndex'>[] = [
  // Easy: shape only (single color, AB pattern)
  {
    hard: false,
    sequence: [
      { shape: 'circle', color: B },
      { shape: 'triangle', color: B },
      { shape: 'circle', color: B },
      { shape: 'triangle', color: B },
      null,
    ],
    answer: { shape: 'circle', color: B },
    choices: [
      { shape: 'circle', color: B },
      { shape: 'triangle', color: B },
      { shape: 'square', color: B },
      { shape: 'star', color: B },
    ],
  },
  // Easy: AAB pattern
  {
    hard: false,
    sequence: [
      { shape: 'square', color: R },
      { shape: 'square', color: R },
      { shape: 'circle', color: R },
      { shape: 'square', color: R },
      { shape: 'square', color: R },
      null,
    ],
    answer: { shape: 'circle', color: R },
    choices: [
      { shape: 'circle', color: R },
      { shape: 'square', color: R },
      { shape: 'triangle', color: R },
      { shape: 'star', color: R },
    ],
  },
  // Easy: ABC pattern
  {
    hard: false,
    sequence: [
      { shape: 'circle', color: Y },
      { shape: 'triangle', color: Y },
      { shape: 'square', color: Y },
      { shape: 'circle', color: Y },
      { shape: 'triangle', color: Y },
      null,
    ],
    answer: { shape: 'square', color: Y },
    choices: [
      { shape: 'square', color: Y },
      { shape: 'circle', color: Y },
      { shape: 'triangle', color: Y },
      { shape: 'star', color: Y },
    ],
  },
  // Hard: color AB pattern (same shape, alternating color)
  {
    hard: true,
    sequence: [
      { shape: 'circle', color: R },
      { shape: 'circle', color: B },
      { shape: 'circle', color: R },
      { shape: 'circle', color: B },
      null,
    ],
    answer: { shape: 'circle', color: R },
    choices: [
      { shape: 'circle', color: R },
      { shape: 'circle', color: B },
      { shape: 'circle', color: Y },
      { shape: 'circle', color: G },
    ],
  },
  // Hard: shape + color AB pattern
  {
    hard: true,
    sequence: [
      { shape: 'square', color: R },
      { shape: 'triangle', color: B },
      { shape: 'square', color: R },
      { shape: 'triangle', color: B },
      null,
    ],
    answer: { shape: 'square', color: R },
    choices: [
      { shape: 'square', color: R },
      { shape: 'triangle', color: B },
      { shape: 'square', color: B },
      { shape: 'triangle', color: R },
    ],
  },
  // Hard: shape + color ABC pattern
  {
    hard: true,
    sequence: [
      { shape: 'circle', color: R },
      { shape: 'square', color: B },
      { shape: 'triangle', color: G },
      { shape: 'circle', color: R },
      { shape: 'square', color: B },
      null,
    ],
    answer: { shape: 'triangle', color: G },
    choices: [
      { shape: 'triangle', color: G },
      { shape: 'circle', color: R },
      { shape: 'triangle', color: B },
      { shape: 'square', color: G },
    ],
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

export function generatePatternProblem(hard = false): PatternProblem {
  const key = hard ? 'hard' : 'easy';
  const pool = RAW.filter((p) => p.hard === hard);
  if (used[key].length >= pool.length) used[key] = [];

  const available = pool.map((_, i) => i).filter((i) => !used[key].includes(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  used[key].push(idx);

  const q = pool[idx];
  const withOrig = q.choices.map((c, i) => ({ ...c, origIdx: i }));
  const shuffled = shuffle(withOrig);
  const answerIndex = shuffled.findIndex((c) => c.origIdx === 0);

  return { ...q, choices: shuffled, answerIndex };
}
