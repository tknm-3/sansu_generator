// 「ぴったりはめよう」「タングラム」で つかう パズルの データ。
// ピースを ドラッグして、お手本の シルエット（スロット）に かさねると はまる。

export type FitShape =
  | { type: 'poly'; points: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; rx?: number };

export interface FitPiece {
  id: string;
  color: string;
  /** ピースの ローカル びょうが ボックス（px） */
  w: number;
  h: number;
  shape: FitShape;
  /** ばんめんでの ばしょ（ローカルボックスの ひだりうえ） */
  x: number;
  y: number;
  /** はめるときに ひつような かいてんかく（度）。0 のときは かいてん なし */
  targetRotation?: 0 | 90 | 180 | 270;
}

export interface FitPuzzle {
  id: string;
  title: string;
  boardW: number;
  boardH: number;
  pieces: FitPiece[];
}

const BLUE = '#60a5fa';
const GREEN = '#34d399';
const ORANGE = '#fb923c';
const PURPLE = '#a78bfa';
const YELLOW = '#fbbf24';
const RED = '#f87171';
const BROWN = '#b45309';
const TEAL = '#2dd4bf';
const PINK = '#f472b6';

// ── 「ぴったりはめよう」やさしい（3ピース） ──
const FIT_EASY: FitPuzzle[] = [
  {
    id: 'house',
    title: 'おうちを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'body', color: BLUE, w: 110, h: 90, x: 65, y: 110, shape: { type: 'rect', x: 0, y: 0, w: 110, h: 90 } },
      { id: 'roof', color: ORANGE, w: 110, h: 62, x: 65, y: 50, shape: { type: 'poly', points: '0,62 55,0 110,62' } },
      { id: 'door', color: PURPLE, w: 34, h: 46, x: 103, y: 154, shape: { type: 'rect', x: 0, y: 0, w: 34, h: 46, rx: 4 } },
    ],
  },
  {
    id: 'tree',
    title: 'きを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'trunk', color: BROWN, w: 34, h: 60, x: 103, y: 158, shape: { type: 'rect', x: 0, y: 0, w: 34, h: 60, rx: 3 } },
      { id: 'leaf-lo', color: GREEN, w: 140, h: 80, x: 50, y: 90, shape: { type: 'poly', points: '0,80 70,0 140,80' } },
      { id: 'leaf-hi', color: TEAL, w: 110, h: 70, x: 65, y: 30, shape: { type: 'poly', points: '0,70 55,0 110,70' } },
    ],
  },
  {
    id: 'fish',
    title: 'おさかなを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'fbody', color: BLUE, w: 130, h: 80, x: 70, y: 60, shape: { type: 'circle', cx: 65, cy: 40, r: 40 } },
      { id: 'tail', color: TEAL, w: 55, h: 80, x: 22, y: 60, shape: { type: 'poly', points: '55,0 55,80 0,40' } },
      { id: 'fin', color: GREEN, w: 60, h: 45, x: 105, y: 18, shape: { type: 'poly', points: '0,45 60,45 30,0' } },
    ],
  },
];

// ── 「ぴったりはめよう」むずかしい（4〜5ピース） ──
const FIT_HARD: FitPuzzle[] = [
  {
    id: 'car',
    title: 'くるまを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'cbody', color: RED, w: 180, h: 50, x: 30, y: 100, shape: { type: 'rect', x: 0, y: 0, w: 180, h: 50, rx: 8 } },
      { id: 'cabin', color: YELLOW, w: 90, h: 45, x: 70, y: 58, shape: { type: 'poly', points: '20,0 70,0 90,45 0,45' } },
      { id: 'wheelL', color: '#374151', w: 44, h: 44, x: 56, y: 140, shape: { type: 'circle', cx: 22, cy: 22, r: 22 } },
      { id: 'wheelR', color: '#374151', w: 44, h: 44, x: 150, y: 140, shape: { type: 'circle', cx: 22, cy: 22, r: 22 } },
    ],
  },
  {
    id: 'face',
    title: 'かおを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'head', color: YELLOW, w: 160, h: 160, x: 40, y: 40, shape: { type: 'circle', cx: 80, cy: 80, r: 78 } },
      { id: 'eyeL', color: '#374151', w: 26, h: 26, x: 84, y: 95, shape: { type: 'circle', cx: 13, cy: 13, r: 13 } },
      { id: 'eyeR', color: '#374151', w: 26, h: 26, x: 130, y: 95, shape: { type: 'circle', cx: 13, cy: 13, r: 13 } },
      { id: 'mouth', color: RED, w: 80, h: 30, x: 80, y: 150, shape: { type: 'poly', points: '0,0 80,0 40,30' } },
    ],
  },
];

// ── 「タングラム」やさしい（4ピース） ──
const TANGRAM_EASY: FitPuzzle[] = [
  {
    id: 'square4',
    title: 'ましかくを つくろう',
    boardW: 200,
    boardH: 200,
    pieces: [
      { id: 't-top', color: BLUE, w: 180, h: 90, x: 10, y: 10, shape: { type: 'poly', points: '0,0 180,0 90,90' } },
      { id: 't-bottom', color: GREEN, w: 180, h: 90, x: 10, y: 100, shape: { type: 'poly', points: '0,0 180,0 90,90' }, targetRotation: 180 },
      { id: 't-left', color: ORANGE, w: 90, h: 180, x: 10, y: 10, shape: { type: 'poly', points: '0,0 0,180 90,90' } },
      { id: 't-right', color: PURPLE, w: 90, h: 180, x: 100, y: 10, shape: { type: 'poly', points: '0,0 0,180 90,90' }, targetRotation: 180 },
    ],
  },
  {
    id: 'arrow',
    title: 'やじるしを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'a-tip', color: ORANGE, w: 90, h: 120, x: 120, y: 30, shape: { type: 'poly', points: '0,0 0,120 90,60' } },
      { id: 'a-up', color: BLUE, w: 60, h: 60, x: 60, y: 30, shape: { type: 'poly', points: '0,0 60,0 60,60' } },
      { id: 'a-stem', color: GREEN, w: 60, h: 40, x: 20, y: 70, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 40 } },
      { id: 'a-down', color: PURPLE, w: 60, h: 60, x: 60, y: 110, shape: { type: 'poly', points: '0,0 60,0 60,60' }, targetRotation: 180 },
    ],
  },
];

// ── 「タングラム」むずかしい（5〜6ピース） ──
const TANGRAM_HARD: FitPuzzle[] = [
  {
    id: 'rocket',
    title: 'ロケットを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'r-nose', color: RED, w: 70, h: 50, x: 85, y: 24, shape: { type: 'poly', points: '0,50 35,0 70,50' } },
      { id: 'r-body', color: BLUE, w: 70, h: 90, x: 85, y: 74, shape: { type: 'rect', x: 0, y: 0, w: 70, h: 90 } },
      { id: 'r-win', color: YELLOW, w: 36, h: 36, x: 102, y: 96, shape: { type: 'circle', cx: 18, cy: 18, r: 18 } },
      { id: 'r-finL', color: GREEN, w: 45, h: 60, x: 40, y: 104, shape: { type: 'poly', points: '45,0 45,60 0,60' } },
      { id: 'r-finR', color: GREEN, w: 45, h: 60, x: 155, y: 104, shape: { type: 'poly', points: '0,0 0,60 45,60' } },
      { id: 'r-flame', color: ORANGE, w: 50, h: 42, x: 95, y: 164, shape: { type: 'poly', points: '0,42 25,0 50,42' }, targetRotation: 180 },
    ],
  },
  {
    id: 'boat',
    title: 'ヨットを つくろう',
    boardW: 240,
    boardH: 232,
    pieces: [
      { id: 'b-sailL', color: PINK, w: 70, h: 110, x: 50, y: 20, shape: { type: 'poly', points: '70,0 70,110 0,110' } },
      { id: 'b-sailR', color: PURPLE, w: 60, h: 110, x: 125, y: 20, shape: { type: 'poly', points: '0,0 60,0 60,110' }, targetRotation: 180 },
      { id: 'b-hull', color: BLUE, w: 180, h: 50, x: 30, y: 150, shape: { type: 'poly', points: '0,0 180,0 150,50 30,50' } },
      { id: 'b-wave', color: TEAL, w: 200, h: 24, x: 20, y: 200, shape: { type: 'rect', x: 0, y: 0, w: 200, h: 24, rx: 10 } },
    ],
  },
];

export function getPuzzles(variant: 'fit' | 'tangram', hard: boolean): FitPuzzle[] {
  if (variant === 'fit') return hard ? FIT_HARD : FIT_EASY;
  return hard ? TANGRAM_HARD : TANGRAM_EASY;
}
