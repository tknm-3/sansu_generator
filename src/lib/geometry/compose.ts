export type ComposeMode = 'compose' | 'decompose';

export interface ComposeProblem {
  mode: ComposeMode;
  questionSvg: string;   // お題のSVGコンテンツ（viewBox 0 0 200 120）
  questionLabel: string;
  choices: { svg: string; label: string }[];
  answerIndex: number;
}

type RawComposeProblem = Omit<ComposeProblem, 'answerIndex'> & { hard: boolean };

// SVGスニペット生成ヘルパー
function tri(x: number, y: number, size: number, color: string) {
  const h = size * 0.866;
  return `<polygon points="${x},${y + h} ${x + size / 2},${y} ${x + size},${y + h}" fill="${color}" stroke="white" stroke-width="2"/>`;
}
function triDown(x: number, y: number, size: number, color: string) {
  const h = size * 0.866;
  return `<polygon points="${x},${y} ${x + size},${y} ${x + size / 2},${y + h}" fill="${color}" stroke="white" stroke-width="2"/>`;
}
function rect(x: number, y: number, w: number, h: number, color: string) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="white" stroke-width="2"/>`;
}

const BLUE = '#60a5fa';
const GREEN = '#34d399';
const ORANGE = '#fb923c';
const PURPLE = '#a78bfa';
const YELLOW = '#fbbf24';

const COMPOSE_QUESTIONS: RawComposeProblem[] = [
  {
    mode: 'compose',
    hard: false,
    questionLabel: '△ ＋ △ をあわせると？',
    questionSvg: `${tri(10, 20, 80, BLUE)}${tri(110, 20, 80, GREEN)}`,
    choices: [
      { label: 'ダイヤ',    svg: `<polygon points="100,10 190,60 100,110 10,60" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
      { label: 'しかくけい', svg: `${rect(30, 20, 140, 80, ORANGE)}` },
      { label: 'さんかくけい', svg: `${tri(30, 10, 140, BLUE)}` },
      { label: 'まる',      svg: `<circle cx="100" cy="60" r="50" fill="${YELLOW}" stroke="white" stroke-width="2"/>` },
    ],
    // answer: ダイヤ（index 0）
  },
  {
    mode: 'compose',
    hard: false,
    questionLabel: '□ ＋ □ をあわせると？',
    questionSvg: `${rect(10, 30, 80, 60, BLUE)}${rect(110, 30, 80, 60, GREEN)}`,
    choices: [
      { label: 'ながしかく', svg: `${rect(10, 30, 180, 60, ORANGE)}` },
      { label: 'さんかくけい', svg: `${tri(10, 10, 180, BLUE)}` },
      { label: 'ダイヤ',    svg: `<polygon points="100,10 190,60 100,110 10,60" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
      { label: 'まる',      svg: `<circle cx="100" cy="60" r="50" fill="${YELLOW}" stroke="white" stroke-width="2"/>` },
    ],
    // answer: ながしかく（index 0）
  },
  {
    mode: 'compose',
    hard: false,
    questionLabel: '□ ＋ △ をあわせると？',
    questionSvg: `${rect(20, 50, 80, 60, BLUE)}${tri(20, 10, 80, GREEN)}`,
    choices: [
      { label: 'おうちのかたち', svg: `${rect(30, 50, 140, 60, BLUE)}${tri(30, 10, 140, GREEN)}` },
      { label: 'ながしかく',    svg: `${rect(10, 20, 180, 80, ORANGE)}` },
      { label: 'ダイヤ',       svg: `<polygon points="100,10 190,60 100,110 10,60" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
      { label: 'さんかくけい',  svg: `${tri(30, 10, 140, YELLOW)}` },
    ],
    // answer: おうちのかたち（index 0）
  },
  {
    mode: 'decompose',
    hard: false,
    questionLabel: 'このかたちは なにでできてる？',
    questionSvg: `${rect(50, 30, 100, 70, BLUE)}${tri(50, -10, 100, GREEN)}`,
    choices: [
      { label: '□ と △',        svg: `${rect(10, 40, 70, 50, BLUE)}${tri(120, 40, 70, GREEN)}` },
      { label: '△ と △',        svg: `${tri(10, 20, 70, BLUE)}${tri(120, 20, 70, GREEN)}` },
      { label: '□ と □',        svg: `${rect(10, 30, 70, 60, BLUE)}${rect(120, 30, 70, 60, GREEN)}` },
      { label: 'まる と △',     svg: `<circle cx="50" cy="60" r="40" fill="${YELLOW}" stroke="white" stroke-width="2"/>${tri(120, 20, 70, GREEN)}` },
    ],
    // answer: □ と △（index 0）
  },
  {
    mode: 'decompose',
    hard: false,
    questionLabel: 'ダイヤは なにでできてる？',
    questionSvg: `<polygon points="100,10 190,60 100,110 10,60" fill="${PURPLE}" stroke="white" stroke-width="2"/>`,
    choices: [
      { label: '△ と △',        svg: `${tri(10, 20, 80, BLUE)}${tri(110, 20, 80, GREEN)}` },
      { label: '□ と □',        svg: `${rect(10, 30, 80, 60, BLUE)}${rect(110, 30, 80, 60, GREEN)}` },
      { label: '□ と △',        svg: `${rect(10, 30, 80, 60, BLUE)}${tri(110, 20, 80, GREEN)}` },
      { label: 'まる と まる',  svg: `<circle cx="55" cy="60" r="40" fill="${YELLOW}" stroke="white" stroke-width="2"/><circle cx="145" cy="60" r="40" fill="${ORANGE}" stroke="white" stroke-width="2"/>` },
    ],
    // answer: △ と △（index 0）
  },

  // ── むずかしい ──
  {
    mode: 'compose',
    hard: true,
    questionLabel: '□ ＋ □ ＋ □ をあわせると？',
    questionSvg: `${rect(15, 35, 50, 50, BLUE)}${rect(75, 35, 50, 50, GREEN)}${rect(135, 35, 50, 50, ORANGE)}`,
    choices: [
      { label: 'ながーいしかく', svg: `${rect(10, 40, 180, 45, PURPLE)}` },
      { label: 'ましかく',      svg: `${rect(60, 20, 80, 80, ORANGE)}` },
      { label: 'L のかたち',    svg: `${rect(30, 20, 45, 80, BLUE)}${rect(30, 60, 130, 40, BLUE)}` },
      { label: 'かいだん',      svg: `${rect(20, 60, 50, 40, BLUE)}${rect(70, 35, 50, 65, BLUE)}${rect(120, 15, 50, 85, BLUE)}` },
    ],
    // answer: ながーいしかく（index 0）
  },
  {
    mode: 'decompose',
    hard: true,
    questionLabel: 'この ながしかくは なにでできてる？',
    questionSvg: `${rect(10, 40, 180, 45, BLUE)}`,
    choices: [
      { label: '□ と □ と □', svg: `${rect(15, 35, 50, 50, BLUE)}${rect(75, 35, 50, 50, GREEN)}${rect(135, 35, 50, 50, ORANGE)}` },
      { label: '□ と □',      svg: `${rect(30, 35, 60, 50, BLUE)}${rect(110, 35, 60, 50, GREEN)}` },
      { label: '△ と △ と △', svg: `${tri(15, 30, 55, BLUE)}${tri(75, 30, 55, GREEN)}${tri(135, 30, 55, ORANGE)}` },
      { label: '△ と □',      svg: `${tri(30, 30, 60, BLUE)}${rect(110, 35, 60, 50, GREEN)}` },
    ],
    // answer: □ と □ と □（index 0）
  },
  {
    mode: 'compose',
    hard: true,
    questionLabel: '△ ＋ □ ＋ △ をあわせると？',
    questionSvg: `${tri(20, 30, 45, BLUE)}${rect(80, 38, 45, 45, GREEN)}${triDown(140, 38, 45, ORANGE)}`,
    choices: [
      { label: 'ロケット', svg: `${tri(70, 8, 60, BLUE)}${rect(70, 40, 60, 50, GREEN)}${triDown(70, 90, 60, ORANGE)}` },
      { label: 'おうち',   svg: `${rect(60, 50, 80, 50, BLUE)}${tri(60, 10, 80, GREEN)}` },
      { label: 'ダイヤ',   svg: `<polygon points="100,10 190,60 100,110 10,60" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
      { label: 'ながしかく', svg: `${rect(10, 35, 180, 50, ORANGE)}` },
    ],
    // answer: ロケット（index 0）
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

let usedEasy: number[] = [];
let usedHard: number[] = [];

export function generateComposeProblem(hard = false): ComposeProblem {
  const pool = COMPOSE_QUESTIONS
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.hard === hard);
  let used = hard ? usedHard : usedEasy;
  if (used.length >= pool.length) {
    used = [];
    if (hard) usedHard = used; else usedEasy = used;
  }
  const available = pool.filter(({ i }) => !used.includes(i));
  const chosen = available[Math.floor(Math.random() * available.length)];
  used.push(chosen.i);
  const q = chosen.q;

  // 選択肢をシャッフル（正解は index 0 なので追跡）
  const choicesWithIdx = q.choices.map((c, i) => ({ ...c, origIdx: i }));
  const shuffled = shuffle(choicesWithIdx);
  const answerIndex = shuffled.findIndex((c) => c.origIdx === 0);

  return {
    mode: q.mode,
    questionSvg: q.questionSvg,
    questionLabel: q.questionLabel,
    choices: shuffled,
    answerIndex,
  };
}
