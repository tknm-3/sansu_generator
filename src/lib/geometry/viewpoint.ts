export interface ViewpointProblem {
  id: string;
  questionLabel: string;
  isoSvg: string;         // 等角投影の3D風SVG
  topViewChoices: string[]; // 4択：真上から見た図のSVG
  answerIndex: number;
}

// 等角投影のブロック1個を描くヘルパー（左上原点・等角座標系）
// ix: 列, iy: 行, iz: 高さ（0=床）
function isoBlock(ix: number, iy: number, iz: number, color = '#60a5fa'): string {
  const TW = 30; // タイルの半幅
  const TH = 17; // タイルの半高さ（投影）
  const BH = 22; // ブロックの高さ（画面上）
  const cx = 100 + (ix - iy) * TW;
  const cy = 60 + (ix + iy) * TH - iz * BH;

  // 上面
  const top = [
    [cx,      cy - TH],
    [cx + TW, cy],
    [cx,      cy + TH],
    [cx - TW, cy],
  ].map((p) => p.join(',')).join(' ');

  // 右面
  const right = [
    [cx + TW, cy],
    [cx,      cy + TH],
    [cx,      cy + TH + BH],
    [cx + TW, cy + BH],
  ].map((p) => p.join(',')).join(' ');

  // 左面
  const left = [
    [cx,      cy + TH],
    [cx - TW, cy],
    [cx - TW, cy + BH],
    [cx,      cy + TH + BH],
  ].map((p) => p.join(',')).join(' ');

  const dark = shadeColor(color, -30);
  const darker = shadeColor(color, -55);

  return [
    `<polygon points="${top}" fill="${color}" stroke="white" stroke-width="1.5"/>`,
    `<polygon points="${right}" fill="${dark}" stroke="white" stroke-width="1.5"/>`,
    `<polygon points="${left}" fill="${darker}" stroke="white" stroke-width="1.5"/>`,
  ].join('');
}

function shadeColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 真上から見た図（マス目）を生成
function topViewGrid(cells: [number, number][]): string {
  const SIZE = 28;
  const PAD = 4;
  const parts: string[] = [];
  cells.forEach(([cx, cy]) => {
    const x = PAD + cx * SIZE;
    const y = PAD + cy * SIZE;
    parts.push(`<rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" fill="#60a5fa" stroke="white" stroke-width="2" rx="3"/>`);
  });
  return parts.join('');
}

// 誤答用グリッド
function wrongGrid1(): string { return topViewGrid([[0,0],[1,0],[2,0],[1,1]]); }
function wrongGrid2(): string { return topViewGrid([[0,0],[0,1],[1,1]]); }
function wrongGrid3(): string { return topViewGrid([[0,0],[1,0],[1,1],[1,2]]); }
function wrongGrid4(): string { return topViewGrid([[0,0],[0,1],[0,2],[1,0]]); }
function wrongGrid5(): string { return topViewGrid([[0,0],[1,0],[0,1]]); }

export const VIEWPOINT_PROBLEMS: ViewpointProblem[] = [
  {
    id: 'vp-line3',
    questionLabel: 'うえから みると どれ？',
    isoSvg: [
      isoBlock(0, 0, 0),
      isoBlock(1, 0, 0),
      isoBlock(2, 0, 0),
    ].join(''),
    topViewChoices: [
      topViewGrid([[0,0],[1,0],[2,0]]),       // 正解: 横3列
      topViewGrid([[0,0],[0,1],[0,2]]),        // 縦3列
      topViewGrid([[0,0],[1,0],[1,1]]),        // L字
      topViewGrid([[0,0],[1,0],[2,0],[3,0]]),  // 横4列
    ],
    answerIndex: 0,
  },
  {
    id: 'vp-l2',
    questionLabel: 'うえから みると どれ？',
    isoSvg: [
      isoBlock(0, 0, 0),
      isoBlock(1, 0, 0),
      isoBlock(1, 1, 0),
    ].join(''),
    topViewChoices: [
      topViewGrid([[0,0],[1,0],[1,1]]),         // 正解: L字
      topViewGrid([[0,0],[1,0],[2,0]]),          // 横3
      topViewGrid([[0,0],[0,1],[1,1]]),          // 逆L
      topViewGrid([[0,0],[1,0],[1,1],[1,2]]),    // T字
    ],
    answerIndex: 0,
  },
  {
    id: 'vp-stack2',
    questionLabel: 'うえから みると どれ？',
    isoSvg: [
      isoBlock(0, 0, 0),
      isoBlock(0, 0, 1),  // 2段積み
      isoBlock(1, 0, 0),
    ].join(''),
    topViewChoices: [
      topViewGrid([[0,0],[1,0]]),              // 正解: 横2（上から見ると2段が1マスに重なる）
      topViewGrid([[0,0],[1,0],[2,0]]),         // 横3
      topViewGrid([[0,0],[0,1]]),              // 縦2
      wrongGrid1(),
    ],
    answerIndex: 0,
  },
  {
    id: 'vp-t3',
    questionLabel: 'うえから みると どれ？',
    isoSvg: [
      isoBlock(0, 0, 0),
      isoBlock(1, 0, 0),
      isoBlock(2, 0, 0),
      isoBlock(1, 1, 0),
    ].join(''),
    topViewChoices: [
      topViewGrid([[0,0],[1,0],[2,0],[1,1]]),  // 正解: T字
      topViewGrid([[0,0],[1,0],[2,0],[3,0]]),  // 横4
      wrongGrid2(),
      wrongGrid3(),
    ],
    answerIndex: 0,
  },
  {
    id: 'vp-l3',
    questionLabel: 'うえから みると どれ？',
    isoSvg: [
      isoBlock(0, 0, 0),
      isoBlock(1, 0, 0),
      isoBlock(2, 0, 0),
      isoBlock(2, 1, 0),
    ].join(''),
    topViewChoices: [
      topViewGrid([[0,0],[1,0],[2,0],[2,1]]),  // 正解: L字(長)
      topViewGrid([[0,0],[1,0],[2,0],[1,1]]),  // T字
      wrongGrid4(),
      wrongGrid5(),
    ],
    answerIndex: 0,
  },
];

let usedIndices: number[] = [];

export function generateViewpointProblem(): ViewpointProblem {
  if (usedIndices.length >= VIEWPOINT_PROBLEMS.length) usedIndices = [];
  const available = VIEWPOINT_PROBLEMS.map((_, i) => i).filter((i) => !usedIndices.includes(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);

  const p = VIEWPOINT_PROBLEMS[idx];
  // 選択肢をシャッフル（正解はanswerIndex=0として定義済み）
  const choicesWithOrigIdx = p.topViewChoices.map((svg, i) => ({ svg, origIdx: i }));
  const shuffled = shuffleArr(choicesWithOrigIdx);
  const answerIndex = shuffled.findIndex((c) => c.origIdx === p.answerIndex);

  return {
    ...p,
    topViewChoices: shuffled.map((c) => c.svg),
    answerIndex,
  };
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
