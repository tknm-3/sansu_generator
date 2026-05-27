export interface FoldProblem {
  id: string;
  questionLabel: string;
  /** ① おる まえの かみ（おりめと「どう おるか」の やじるし つき） */
  beforeSvg: string;
  /** 2かいおりの ばあい、1かいめの あと・2かいめの まえ */
  intermediarySvg?: string;
  /** ② おって きった ところ */
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

// ── おる まえの ず（「どう おるか」の やじるし つき）────────────────
const ARROW = '#16a34a';
// やじるしの あたまを えがく marker（おなじ ずに 1つだけ ひつよう）
const arrowDefs =
  `<defs><marker id="fa" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">` +
  `<path d="M0.5,0.5 L8.5,4.5 L0.5,8.5 L3,4.5 z" fill="${ARROW}"/></marker></defs>`;
const foldArrow = (d: string) =>
  `<path d="${d}" fill="none" stroke="${ARROW}" stroke-width="2.5" stroke-linecap="round" marker-end="url(#fa)"/>`;
// たいらな（おる まえの）かみ
const flat = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P}" stroke="${PS}" stroke-width="2" rx="2"/>`;

// たてに おる（みぎを ひだりへ）
const BEFORE_VFOLD = [
  arrowDefs,
  flat(48, 24, 90, 66),
  fl(93, 18, 93, 96),
  foldArrow('M120 16 Q93 -6 66 16'),
  tx(90, 108, 'みぎを ひだりに おる', 11),
].join('');

// よこに おる（したを うえへ）
const BEFORE_HFOLD = [
  arrowDefs,
  flat(50, 16, 80, 76),
  fl(45, 54, 135, 54),
  foldArrow('M40 80 Q15 47 40 24'),
  tx(90, 108, 'したを うえに おる', 11),
].join('');

// 2かい おる ① たてに おる（1かいめだけ）
const BEFORE_DOUBLE_STEP1 = [
  arrowDefs,
  flat(50, 14, 80, 80),
  fl(90, 10, 90, 98),
  foldArrow('M120 12 Q92 -8 66 12'),
  tx(90, 108, 'まず たてに おる', 11),
].join('');

// 2かい おる ② 1かいめの あと（よこに おる まえ）
const AFTER_VFOLD_BEFORE_HFOLD = [
  arrowDefs,
  fbr(68, 12, 44, 82),    // うしろの かみ（すこし はみだして みせる）
  flat(72, 16, 40, 78),   // まえの かみ
  fl(64, 55, 116, 55),    // よこの おりめ（2かいめ）
  foldArrow('M68 82 Q44 58 68 28'),
  tx(90, 108, 'つぎに よこに おる', 11),
].join('');

// かくに おる（かどを かどへ ななめに）
const BEFORE_DIAG = [
  arrowDefs,
  `<polygon points="50,22 122,22 122,94 50,94" fill="${P}" stroke="${PS}" stroke-width="2"/>`,
  fl(50, 94, 122, 22),
  foldArrow('M64 33 Q98 52 110 80'),
  tx(90, 108, 'かくを かくに おる', 11),
].join('');

// Question SVG viewBox: "0 0 180 110"
// Choice SVG viewBox:   "0 0 80 80"

const RAW: Omit<FoldProblem, 'answerIndex'>[] = [
  // Easy 1: vertical fold, cut from fold edge center → center rect hole
  {
    id: 'fold-v-center',
    hard: false,
    beforeSvg: BEFORE_VFOLD,
    questionLabel: 'おって きったよ。ひらいたら どんな あな？',
    foldSvg: [
      fbr(80, 15, 60, 80),
      pr(20, 15, 60, 80),
      fl(80, 10, 80, 100),
      cutr(72, 48, 16, 14),
      tx(90, 12, 'たてに おりました', 12),
      tx(80, 68, '✂️', 16),
      tx(50, 58, 'おもて'),
      tx(110, 58, 'うら'),
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
    beforeSvg: BEFORE_HFOLD,
    questionLabel: 'おって きったよ。ひらいたら どんな あな？',
    foldSvg: [
      fbr(15, 60, 80, 45),
      pr(15, 15, 80, 45),
      fl(10, 60, 110, 60),
      cutr(47, 52, 16, 16),
      tx(90, 12, 'よこに おりました', 12),
      tx(55, 68, '✂️', 16),
      tx(55, 42, 'おもて'),
      tx(30, 82, 'うら'),
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
    beforeSvg: BEFORE_VFOLD,
    questionLabel: 'おって かどを きったよ。ひらいたら？',
    foldSvg: [
      fbr(80, 15, 60, 80),
      pr(20, 15, 60, 80),
      fl(80, 10, 80, 100),
      `<polygon points="68,15 80,15 80,28" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      `<polygon points="68,95 80,95 80,82" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(90, 12, 'たてに おりました', 12),
      tx(50, 58, 'おもて'),
      tx(110, 58, 'うら'),
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
  // Easy 4: vertical fold, cut away from fold (middle of front) → 2 symmetric side holes
  {
    id: 'fold-v-edge',
    hard: false,
    beforeSvg: BEFORE_VFOLD,
    questionLabel: 'おって きったよ。ひらいたら どんな あな？',
    foldSvg: [
      fbr(80, 15, 60, 80),
      pr(20, 15, 60, 80),
      fl(80, 10, 80, 100),
      cutr(34, 48, 16, 14),
      tx(90, 12, 'たてに おりました', 12),
      tx(42, 45, '✂️', 14),
      tx(50, 88, 'おもて'),
      tx(110, 58, 'うら'),
    ].join(''),
    choices: [
      { svg: pr(5, 5, 70, 70) + hr(14, 31, 16, 16) + hr(50, 31, 16, 16) }, // correct: 2 symmetric side holes
      { svg: pr(5, 5, 70, 70) + hr(27, 31, 16, 16) },                      // wrong: center hole
      { svg: pr(5, 5, 70, 70) + hr(14, 31, 16, 16) },                      // wrong: 1 hole
      { svg: pr(5, 5, 70, 70) + hr(14, 10, 16, 14) + hr(50, 10, 16, 14) }, // wrong: 2 top holes
    ],
  },
  // Easy 5: vertical fold, triangle cut on fold edge → center diamond hole
  {
    id: 'fold-v-tri',
    hard: false,
    beforeSvg: BEFORE_VFOLD,
    questionLabel: 'おって おりめを きったよ。ひらいたら どんな あな？',
    foldSvg: [
      fbr(80, 15, 60, 80),
      pr(20, 15, 60, 80),
      fl(80, 10, 80, 100),
      `<polygon points="80,46 66,57 80,68" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(90, 12, 'たてに おりました', 12),
      tx(45, 84, 'おもて'),
      tx(110, 58, 'うら'),
    ].join(''),
    choices: [
      { // correct: diamond hole at center
        svg: pr(5, 5, 70, 70)
          + `<polygon points="40,27 53,40 40,53 27,40" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { // wrong: triangle on one side only
        svg: pr(5, 5, 70, 70)
          + `<polygon points="40,27 53,40 40,53" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { svg: pr(5, 5, 70, 70) + hr(28, 28, 24, 24) },                      // wrong: square center hole
      { svg: pr(5, 5, 70, 70) + hr(8, 31, 14, 18) + hr(58, 31, 14, 18) },  // wrong: 2 side holes
    ],
  },
  // Hard 1: double fold (vertical + horizontal), corner cut → 4 corner holes
  {
    id: 'fold-double',
    hard: true,
    beforeSvg: BEFORE_DOUBLE_STEP1,
    intermediarySvg: AFTER_VFOLD_BEFORE_HFOLD,
    questionLabel: '2かい おって かどを きったよ。ひらいたら？',
    foldSvg: [
      pr(55, 25, 60, 60),
      fl(55, 25, 55, 85),
      fl(55, 85, 115, 85),
      `<polygon points="107,25 115,25 115,33" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(88, 18, '2かい おりました', 12),
    ].join(''),
    choices: [
      { svg: pr(5, 5, 70, 70) + hc(15, 15, 9) + hc(55, 15, 9) + hc(15, 55, 9) + hc(55, 55, 9) }, // correct: 4 corner holes
      { svg: pr(5, 5, 70, 70) + hc(35, 35, 13) },                                                   // wrong: center hole
      { svg: pr(5, 5, 70, 70) + hc(55, 15, 9) },                                                    // wrong: 1 hole
      { svg: pr(5, 5, 70, 70) + hc(15, 15, 9) + hc(55, 55, 9) },                                   // wrong: diagonal 2 holes
    ],
  },
  // Hard 2: diagonal fold, cut on fold edge center → 1 diamond hole at fold center
  {
    id: 'fold-diag',
    hard: true,
    beforeSvg: BEFORE_DIAG,
    questionLabel: 'かくに おって まんなかを きったよ。ひらいたら？',
    foldSvg: [
      `<polygon points="20,90 90,90 20,20" fill="${FB}" stroke="${FBS}" stroke-width="1.5" stroke-dasharray="4,3"/>`,
      `<polygon points="20,90 90,20 90,90" fill="${P}" stroke="${PS}" stroke-width="2"/>`,
      fl(20, 90, 90, 20),
      `<polygon points="55,55 67,55 55,67" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(90, 14, 'かくに おりました', 12),
      tx(35, 45, 'うら'),
      tx(72, 82, 'おもて'),
    ].join(''),
    choices: [
      { // correct: 1 diamond hole at diagonal center
        svg: pr(5, 5, 70, 70)
          + `<polygon points="25,40 40,25 55,40 40,55" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { // wrong: 2 separate diamond holes along diagonal
        svg: pr(5, 5, 70, 70)
          + `<polygon points="20,35 35,20 50,35 35,50" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="35,50 50,35 65,50 50,65" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { svg: pr(5, 5, 70, 70) + hr(23, 23, 34, 34) }, // wrong: center square hole
      { // wrong: corner triangle hole
        svg: pr(5, 5, 70, 70)
          + `<polygon points="5,5 25,5 5,25" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
    ],
  },
  // Hard 3: double fold, cut the inner (center) corner → 1 center hole
  {
    id: 'fold-quarter-center',
    hard: true,
    beforeSvg: BEFORE_DOUBLE_STEP1,
    intermediarySvg: AFTER_VFOLD_BEFORE_HFOLD,
    questionLabel: '2かい おって まんなかの かどを きったよ。ひらいたら？',
    foldSvg: [
      pr(55, 25, 60, 60),
      fl(55, 25, 55, 85),
      fl(55, 85, 115, 85),
      `<polygon points="55,73 67,85 55,85" fill="${CUT}" stroke="${CUTS}" stroke-width="1.5"/>`,
      tx(88, 18, '2かい おりました', 12),
    ].join(''),
    choices: [
      { // correct: 1 center diamond hole
        svg: pr(5, 5, 70, 70)
          + `<polygon points="40,20 58,40 40,60 22,40" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
      },
      { svg: pr(5, 5, 70, 70) + hc(15, 15, 9) + hc(55, 15, 9) + hc(15, 55, 9) + hc(55, 55, 9) }, // wrong: 4 corner holes
      { svg: pr(5, 5, 70, 70) + hc(15, 15, 9) },                                                  // wrong: 1 corner hole
      { svg: pr(5, 5, 70, 70) + hr(8, 31, 14, 16) + hr(58, 31, 14, 16) },                         // wrong: 2 side holes
    ],
  },
  // Hard 4: diagonal fold, cut off the fold → 2 holes symmetric across the diagonal
  {
    id: 'fold-diag-edge',
    hard: true,
    beforeSvg: BEFORE_DIAG,
    questionLabel: 'かくに おって おりめの ちかくを きったよ。ひらいたら？',
    foldSvg: [
      `<polygon points="20,90 90,90 20,20" fill="${FB}" stroke="${FBS}" stroke-width="1.5" stroke-dasharray="4,3"/>`,
      `<polygon points="20,90 90,20 90,90" fill="${P}" stroke="${PS}" stroke-width="2"/>`,
      fl(20, 90, 90, 20),
      cutr(66, 66, 14, 14),
      tx(90, 14, 'かくに おりました', 12),
      tx(35, 45, 'うら'),
      tx(78, 84, 'おもて'),
    ].join(''),
    choices: [
      { svg: pr(5, 5, 70, 70) + hr(44, 22, 16, 16) + hr(22, 44, 16, 16) }, // correct: 2 holes symmetric across diagonal
      { svg: pr(5, 5, 70, 70) + hr(32, 32, 16, 16) },                      // wrong: 1 center hole on diagonal
      { svg: pr(5, 5, 70, 70) + hr(44, 22, 16, 16) },                      // wrong: 1 hole
      { // wrong: 2 diamonds along the diagonal
        svg: pr(5, 5, 70, 70)
          + `<polygon points="20,35 35,20 50,35 35,50" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`
          + `<polygon points="35,50 50,35 65,50 50,65" fill="${HL}" stroke="${HLS}" stroke-width="1.5" stroke-dasharray="4,2"/>`,
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
