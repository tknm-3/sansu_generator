export interface FoldProblem {
  id: string;
  questionLabel: string;
  foldSvg: string;
  choices: { svg: string }[];
  answerIndex: number;
  hard: boolean;
}

const P = '#fef9c3';
const PS = '#d97706';
const FB = '#dbeafe';
const FBS = '#93c5fd';
const CUT = '#fca5a5';
const CUTS = '#ef4444';
const HL = '#e2e8f0';
const HLS = '#94a3b8';

const pr = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P}" stroke="${PS}" stroke-width="2" rx="2"/>`;

const fbr = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${FB}" stroke="${FBS}" stroke-width="1.5" stroke-dasharray="4,3" rx="2"/>`;

const cutr = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${CUT}" stroke="${CUTS}" stroke-width="2"/>`;

const fl = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="6,3"/>`;

const hr = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`;

const hc = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`;

const tx = (x: number, y: number, t: string, size = 10) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="#475569" text-anchor="middle" font-family="sans-serif">${t}</text>`;

// Question SVG viewBox: "0 0 180 110"
// Choice SVG viewBox:   "0 0 80 80"

const RAW: Omit<FoldProblem, 'answerIndex'>[] = [
  // Easy 1: vertical fold, cut from fold edge center → center rect hole
  {
    id: 'fold-v-center',
    hard: false,
    questionLabel: 'おって きったよ。ひらいたら どんな あな？',
    foldSvg: [
      fbr(80, 15, 60, 80),
      pr(20, 15, 60, 80),
      fl(80, 10, 80, 100),
      cutr(72, 48, 16, 14),
      tx(90, 8, 'たてに おりました'),
      tx(80, 68, '✂️', 16),
    ].join(''),
    choices: [
      { svg: pr(5, 5, 70, 70) + hr(27, 29, 26, 22) },           // correct: center hole
      { svg: pr(5, 5, 70, 70) + hr(5, 29, 12, 22) + hr(63, 29, 12, 22) }, // wrong: two side holes
      { svg: pr(5, 5, 70, 70) + hr(27, 5, 26, 14) },            // wrong: top hole
      { svg: pr(5, 5, 70, 70) },                                 // wrong: no hole
    ],
  },
  // Easy 2: horizontal fold, cut from fold edge center → center rect hole
  {
    id: 'fold-h-center',
    hard: false,
    questionLabel: 'おって きったよ。ひらいたら どんな あな？',
    foldSvg: [
      fbr(15, 60, 80, 45),
      pr(15, 15, 80, 45),
      fl(10, 60, 110, 60),
      cutr(47, 52, 16, 16),
      tx(90, 8, 'よこに おりました'),
      tx(55, 68, '✂️', 16),
    ].join(''),
    choices: [
      { svg: pr(5, 5, 70, 70) + hr(22, 27, 26, 26) },           // correct: center hole
      { svg: pr(5, 5, 70, 70) + hr(22, 5, 26, 14) },            // wrong: top hole
      { svg: pr(5, 5, 70, 70) + hr(22, 61, 26, 14) },           // wrong: bottom hole
      { svg: pr(5, 5, 70, 70) + hr(22, 5, 26, 14) + hr(22, 61, 26, 14) }, // wrong: two holes
    ],
  },
  // Easy 3: vertical fold, cut two corners → 4 corner notches
  {
    id: 'fold-v-corner',
    hard: false,
    questionLabel: 'おって かどを きったよ。ひらいたら？',
    foldSvg: [
      fbr(80, 15, 60, 80),
      pr(20, 15, 60, 80),
      fl(80, 10, 80, 100),
      `<polygon points="68,15 80,15 80,28" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      `<polygon points="68,95 80,95 80,82" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(90, 8, 'たてに おりました'),
    ].join(''),
    choices: [
      { // correct: 4 corner triangle notches
        svg: pr(5, 5, 70, 70)
          + `<polygon points="5,5 19,5 5,19" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="75,5 61,5 75,19" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="5,75 19,75 5,61" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="75,75 61,75 75,61" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { // wrong: only 2 corner notches (right side)
        svg: pr(5, 5, 70, 70)
          + `<polygon points="75,5 61,5 75,19" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="75,75 61,75 75,61" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { svg: pr(5, 5, 70, 70) + hr(27, 27, 26, 26) }, // wrong: center hole
      { // wrong: 2 top corners only
        svg: pr(5, 5, 70, 70)
          + `<polygon points="5,5 19,5 5,19" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="75,5 61,5 75,19" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
    ],
  },
  // Hard 1: double fold (vertical + horizontal), corner cut → 4 corner holes
  {
    id: 'fold-double',
    hard: true,
    questionLabel: '2かい おって かどを きったよ。ひらいたら？',
    foldSvg: [
      pr(55, 25, 60, 60),
      fl(55, 25, 55, 85),
      fl(55, 85, 115, 85),
      `<polygon points="107,25 115,25 115,33" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(88, 16, '2かい おりました'),
    ].join(''),
    choices: [
      { svg: pr(5, 5, 70, 70) + hc(15, 15, 9) + hc(55, 15, 9) + hc(15, 55, 9) + hc(55, 55, 9) }, // correct: 4 corner holes
      { svg: pr(5, 5, 70, 70) + hc(35, 35, 13) },                                                   // wrong: center hole
      { svg: pr(5, 5, 70, 70) + hc(55, 15, 9) },                                                    // wrong: 1 hole
      { svg: pr(5, 5, 70, 70) + hc(15, 15, 9) + hc(55, 55, 9) },                                   // wrong: diagonal 2 holes
    ],
  },
  // Hard 2: diagonal fold, cut from hypotenuse midpoint → 2 symmetric diamond holes
  {
    id: 'fold-diag',
    hard: true,
    questionLabel: 'かくに おって まんなかを きったよ。ひらいたら？',
    foldSvg: [
      `<polygon points="20,90 90,90 20,20" fill="${FB}" stroke="${FBS}" stroke-width="1.5" stroke-dasharray="4,3"/>`,
      `<polygon points="20,90 90,20 90,90" fill="${P}" stroke="${PS}" stroke-width="2"/>`,
      fl(20, 90, 90, 20),
      `<polygon points="54,54 66,54 54,66" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(90, 12, 'かくに おりました'),
    ].join(''),
    choices: [
      { // correct: 2 symmetric diamond holes along diagonal
        svg: pr(5, 5, 70, 70)
          + `<polygon points="20,35 35,20 50,35 35,50" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="35,50 50,35 65,50 50,65" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { // wrong: 1 diamond hole
        svg: pr(5, 5, 70, 70)
          + `<polygon points="20,35 35,20 50,35 35,50" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { svg: pr(5, 5, 70, 70) + hr(23, 23, 34, 34) }, // wrong: center square hole
      { // wrong: corner triangle hole
        svg: pr(5, 5, 70, 70)
          + `<polygon points="5,5 25,5 5,25" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
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

const usedIds: Record<string, string[]> = { easy: [], hard: [] };

export function generateFoldProblem(hard = false): FoldProblem {
  const key = hard ? 'hard' : 'easy';
  const pool = RAW.filter((p) => p.hard === hard);
  if (usedIds[key].length >= pool.length) usedIds[key] = [];

  const available = pool.filter((p) => !usedIds[key].includes(p.id));
  const q = available[Math.floor(Math.random() * available.length)];
  usedIds[key].push(q.id);

  const withOrig = q.choices.map((c, i) => ({ ...c, origIdx: i }));
  const shuffled = shuffle(withOrig);
  const answerIndex = shuffled.findIndex((c) => c.origIdx === 0);

  return { ...q, choices: shuffled, answerIndex };
}
