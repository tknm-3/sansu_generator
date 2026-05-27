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
  {
    id: 'flower',
    title: 'おはなを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'fl-stem', color: GREEN, w: 24, h: 92, x: 108, y: 128, shape: { type: 'rect', x: 0, y: 0, w: 24, h: 92, rx: 6 } },
      { id: 'fl-petals', color: PINK, w: 120, h: 120, x: 60, y: 28, shape: { type: 'circle', cx: 60, cy: 60, r: 58 } },
      { id: 'fl-center', color: YELLOW, w: 50, h: 50, x: 95, y: 63, shape: { type: 'circle', cx: 25, cy: 25, r: 24 } },
    ],
  },
  {
    id: 'mountain',
    title: 'やまを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'mt-sun', color: YELLOW, w: 56, h: 56, x: 28, y: 28, shape: { type: 'circle', cx: 28, cy: 28, r: 27 } },
      { id: 'mt-base', color: GREEN, w: 200, h: 110, x: 20, y: 110, shape: { type: 'poly', points: '0,110 100,0 200,110' } },
      { id: 'mt-snow', color: '#e0f2fe', w: 60, h: 34, x: 90, y: 110, shape: { type: 'poly', points: '30,0 0,34 60,34' } },
    ],
  },
  {
    id: 'duck',
    title: 'あひるを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'dk-body', color: YELLOW, w: 120, h: 90, x: 40, y: 90, shape: { type: 'circle', cx: 60, cy: 45, r: 45 } },
      { id: 'dk-head', color: YELLOW, w: 62, h: 62, x: 138, y: 48, shape: { type: 'circle', cx: 31, cy: 31, r: 31 } },
      { id: 'dk-beak', color: ORANGE, w: 34, h: 24, x: 196, y: 68, shape: { type: 'poly', points: '0,0 34,12 0,24' } },
    ],
  },
  {
    id: 'snowman',
    title: 'ゆきだるまを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'sn-bottom', color: '#e0f2fe', w: 96, h: 96, x: 72, y: 130, shape: { type: 'circle', cx: 48, cy: 48, r: 47 } },
      { id: 'sn-top', color: '#e0f2fe', w: 70, h: 70, x: 85, y: 64, shape: { type: 'circle', cx: 35, cy: 35, r: 34 } },
      { id: 'sn-hat', color: PURPLE, w: 54, h: 24, x: 93, y: 44, shape: { type: 'rect', x: 0, y: 0, w: 54, h: 24, rx: 4 } },
    ],
  },
  {
    id: 'icecream',
    title: 'アイスを つくろう',
    boardW: 200,
    boardH: 240,
    pieces: [
      { id: 'ic-cone', color: ORANGE, w: 72, h: 84, x: 64, y: 120, shape: { type: 'poly', points: '0,0 72,0 36,84' } },
      { id: 'ic-scoop', color: PINK, w: 72, h: 72, x: 64, y: 50, shape: { type: 'circle', cx: 36, cy: 36, r: 35 } },
      { id: 'ic-cherry', color: RED, w: 26, h: 26, x: 87, y: 34, shape: { type: 'circle', cx: 13, cy: 13, r: 13 } },
    ],
  },
  {
    id: 'cat',
    title: 'ねこを つくろう',
    boardW: 240,
    boardH: 220,
    pieces: [
      { id: 'ct-head', color: ORANGE, w: 120, h: 120, x: 60, y: 72, shape: { type: 'circle', cx: 60, cy: 60, r: 58 } },
      { id: 'ct-earL', color: ORANGE, w: 52, h: 50, x: 64, y: 40, shape: { type: 'poly', points: '0,50 52,50 26,0' } },
      { id: 'ct-earR', color: ORANGE, w: 52, h: 50, x: 124, y: 40, shape: { type: 'poly', points: '0,50 52,50 26,0' } },
    ],
  },
  {
    id: 'sailboat',
    title: 'ヨットを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'sb-hull', color: BLUE, w: 160, h: 40, x: 40, y: 132, shape: { type: 'poly', points: '0,0 160,0 130,40 30,40' } },
      { id: 'sb-sail', color: RED, w: 90, h: 104, x: 96, y: 28, shape: { type: 'poly', points: '0,104 90,104 90,0' } },
      { id: 'sb-flag', color: YELLOW, w: 40, h: 22, x: 96, y: 8, shape: { type: 'poly', points: '0,0 0,22 40,11' } },
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
  {
    id: 'butterfly',
    title: 'ちょうちょを つくろう',
    boardW: 240,
    boardH: 220,
    pieces: [
      { id: 'bf-body', color: BROWN, w: 20, h: 110, x: 110, y: 55, shape: { type: 'rect', x: 0, y: 0, w: 20, h: 110, rx: 8 } },
      { id: 'bf-wingTL', color: PINK, w: 90, h: 60, x: 20, y: 50, shape: { type: 'circle', cx: 45, cy: 30, r: 30 } },
      { id: 'bf-wingTR', color: PINK, w: 90, h: 60, x: 130, y: 50, shape: { type: 'circle', cx: 45, cy: 30, r: 30 } },
      { id: 'bf-wingBL', color: PURPLE, w: 80, h: 54, x: 25, y: 108, shape: { type: 'circle', cx: 40, cy: 27, r: 27 } },
      { id: 'bf-wingBR', color: PURPLE, w: 80, h: 54, x: 135, y: 108, shape: { type: 'circle', cx: 40, cy: 27, r: 27 } },
    ],
  },
  {
    id: 'robot',
    title: 'ロボットを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'rb-head', color: TEAL, w: 80, h: 60, x: 80, y: 20, shape: { type: 'rect', x: 0, y: 0, w: 80, h: 60, rx: 8 } },
      { id: 'rb-eye', color: YELLOW, w: 40, h: 20, x: 100, y: 40, shape: { type: 'rect', x: 0, y: 0, w: 40, h: 20, rx: 10 } },
      { id: 'rb-body', color: BLUE, w: 110, h: 90, x: 65, y: 85, shape: { type: 'rect', x: 0, y: 0, w: 110, h: 90, rx: 6 } },
      { id: 'rb-armL', color: PURPLE, w: 24, h: 70, x: 36, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 24, h: 70, rx: 8 } },
      { id: 'rb-armR', color: PURPLE, w: 24, h: 70, x: 180, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 24, h: 70, rx: 8 } },
    ],
  },
  {
    id: 'train',
    title: 'でんしゃを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'tr-body', color: RED, w: 180, h: 70, x: 30, y: 80, shape: { type: 'rect', x: 0, y: 0, w: 180, h: 70, rx: 8 } },
      { id: 'tr-winL', color: YELLOW, w: 40, h: 30, x: 50, y: 95, shape: { type: 'rect', x: 0, y: 0, w: 40, h: 30, rx: 4 } },
      { id: 'tr-winR', color: YELLOW, w: 40, h: 30, x: 110, y: 95, shape: { type: 'rect', x: 0, y: 0, w: 40, h: 30, rx: 4 } },
      { id: 'tr-wheelL', color: '#374151', w: 40, h: 40, x: 55, y: 150, shape: { type: 'circle', cx: 20, cy: 20, r: 20 } },
      { id: 'tr-wheelR', color: '#374151', w: 40, h: 40, x: 145, y: 150, shape: { type: 'circle', cx: 20, cy: 20, r: 20 } },
    ],
  },
  {
    id: 'truck',
    title: 'トラックを つくろう',
    boardW: 240,
    boardH: 200,
    pieces: [
      { id: 'tk-cargo', color: BLUE, w: 110, h: 60, x: 20, y: 75, shape: { type: 'rect', x: 0, y: 0, w: 110, h: 60, rx: 6 } },
      { id: 'tk-cab', color: ORANGE, w: 60, h: 45, x: 130, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 45, rx: 6 } },
      { id: 'tk-win', color: YELLOW, w: 34, h: 24, x: 143, y: 97, shape: { type: 'rect', x: 0, y: 0, w: 34, h: 24, rx: 3 } },
      { id: 'tk-wheelL', color: '#374151', w: 40, h: 40, x: 45, y: 140, shape: { type: 'circle', cx: 20, cy: 20, r: 20 } },
      { id: 'tk-wheelR', color: '#374151', w: 40, h: 40, x: 150, y: 140, shape: { type: 'circle', cx: 20, cy: 20, r: 20 } },
    ],
  },
  {
    id: 'rabbit',
    title: 'うさぎを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'rb2-body', color: PINK, w: 120, h: 110, x: 60, y: 118, shape: { type: 'circle', cx: 60, cy: 55, r: 54 } },
      { id: 'rb2-head', color: PINK, w: 88, h: 88, x: 76, y: 62, shape: { type: 'circle', cx: 44, cy: 44, r: 43 } },
      { id: 'rb2-earL', color: PINK, w: 22, h: 58, x: 94, y: 14, shape: { type: 'rect', x: 0, y: 0, w: 22, h: 58, rx: 11 } },
      { id: 'rb2-earR', color: PINK, w: 22, h: 58, x: 126, y: 14, shape: { type: 'rect', x: 0, y: 0, w: 22, h: 58, rx: 11 } },
      { id: 'rb2-nose', color: RED, w: 18, h: 18, x: 111, y: 100, shape: { type: 'circle', cx: 9, cy: 9, r: 9 } },
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
  {
    id: 'bigtriangle',
    title: 'おおきな さんかくを つくろう',
    boardW: 200,
    boardH: 180,
    pieces: [
      { id: 'bt-top', color: BLUE, w: 100, h: 90, x: 50, y: 0, shape: { type: 'poly', points: '50,0 0,90 100,90' } },
      { id: 'bt-left', color: GREEN, w: 100, h: 90, x: 0, y: 90, shape: { type: 'poly', points: '0,90 50,0 100,90' } },
      { id: 'bt-right', color: ORANGE, w: 100, h: 90, x: 100, y: 90, shape: { type: 'poly', points: '0,90 50,0 100,90' } },
      { id: 'bt-mid', color: PURPLE, w: 100, h: 90, x: 50, y: 90, shape: { type: 'poly', points: '0,0 100,0 50,90' } },
    ],
  },
  {
    id: 'diamond',
    title: 'ダイヤを つくろう',
    boardW: 200,
    boardH: 200,
    pieces: [
      { id: 'dm-tr', color: BLUE, w: 90, h: 90, x: 100, y: 10, shape: { type: 'poly', points: '0,0 90,90 0,90' } },
      { id: 'dm-br', color: GREEN, w: 90, h: 90, x: 100, y: 100, shape: { type: 'poly', points: '90,0 0,90 0,0' } },
      { id: 'dm-bl', color: ORANGE, w: 90, h: 90, x: 10, y: 100, shape: { type: 'poly', points: '90,90 0,0 90,0' } },
      { id: 'dm-tl', color: PURPLE, w: 90, h: 90, x: 10, y: 10, shape: { type: 'poly', points: '90,0 0,90 90,90' } },
    ],
  },
  {
    id: 'pinwheel',
    title: 'かざぐるまを つくろう',
    boardW: 200,
    boardH: 200,
    pieces: [
      { id: 'pw-tl', color: BLUE, w: 100, h: 100, x: 0, y: 0, shape: { type: 'poly', points: '0,0 100,0 0,100' } },
      { id: 'pw-tr', color: GREEN, w: 100, h: 100, x: 100, y: 0, shape: { type: 'poly', points: '0,0 100,0 100,100' } },
      { id: 'pw-br', color: ORANGE, w: 100, h: 100, x: 100, y: 100, shape: { type: 'poly', points: '100,0 100,100 0,100' } },
      { id: 'pw-bl', color: PURPLE, w: 100, h: 100, x: 0, y: 100, shape: { type: 'poly', points: '0,0 0,100 100,100' } },
    ],
  },
  {
    id: 'trapezoid',
    title: 'だいけいを つくろう',
    boardW: 200,
    boardH: 120,
    pieces: [
      { id: 'tz-left', color: BLUE, w: 60, h: 100, x: 0, y: 10, shape: { type: 'poly', points: '60,0 60,100 0,100' } },
      { id: 'tz-midL', color: GREEN, w: 40, h: 100, x: 60, y: 10, shape: { type: 'rect', x: 0, y: 0, w: 40, h: 100 } },
      { id: 'tz-midR', color: ORANGE, w: 40, h: 100, x: 100, y: 10, shape: { type: 'rect', x: 0, y: 0, w: 40, h: 100 } },
      { id: 'tz-right', color: PURPLE, w: 60, h: 100, x: 140, y: 10, shape: { type: 'poly', points: '0,0 0,100 60,100' } },
    ],
  },
  {
    id: 'window',
    title: 'まどを つくろう',
    boardW: 200,
    boardH: 200,
    pieces: [
      { id: 'wd-tl', color: BLUE, w: 90, h: 90, x: 10, y: 10, shape: { type: 'rect', x: 0, y: 0, w: 90, h: 90 } },
      { id: 'wd-tr', color: GREEN, w: 90, h: 90, x: 100, y: 10, shape: { type: 'rect', x: 0, y: 0, w: 90, h: 90 } },
      { id: 'wd-bl', color: ORANGE, w: 90, h: 90, x: 10, y: 100, shape: { type: 'rect', x: 0, y: 0, w: 90, h: 90 } },
      { id: 'wd-br', color: PURPLE, w: 90, h: 90, x: 100, y: 100, shape: { type: 'rect', x: 0, y: 0, w: 90, h: 90 } },
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
      { id: 'r-bodyTop', color: BLUE, w: 70, h: 45, x: 85, y: 74, shape: { type: 'rect', x: 0, y: 0, w: 70, h: 45 } },
      { id: 'r-bodyBottom', color: TEAL, w: 70, h: 45, x: 85, y: 119, shape: { type: 'rect', x: 0, y: 0, w: 70, h: 45 } },
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
  {
    id: 'cross',
    title: 'プラスを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'cr-mid', color: BLUE, w: 60, h: 60, x: 90, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 60 } },
      { id: 'cr-top', color: RED, w: 60, h: 60, x: 90, y: 30, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 60 } },
      { id: 'cr-bottom', color: GREEN, w: 60, h: 60, x: 90, y: 150, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 60 } },
      { id: 'cr-left', color: ORANGE, w: 60, h: 60, x: 30, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 60 } },
      { id: 'cr-right', color: PURPLE, w: 60, h: 60, x: 150, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 60 } },
    ],
  },
  {
    id: 'crown',
    title: 'おうかんを つくろう',
    boardW: 240,
    boardH: 160,
    pieces: [
      { id: 'cw-baseL', color: YELLOW, w: 90, h: 50, x: 30, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 90, h: 50, rx: 4 } },
      { id: 'cw-baseR', color: ORANGE, w: 90, h: 50, x: 120, y: 90, shape: { type: 'rect', x: 0, y: 0, w: 90, h: 50, rx: 4 } },
      { id: 'cw-spikeL', color: RED, w: 60, h: 60, x: 30, y: 30, shape: { type: 'poly', points: '0,60 30,0 60,60' } },
      { id: 'cw-spikeM', color: PINK, w: 60, h: 70, x: 90, y: 20, shape: { type: 'poly', points: '0,70 30,0 60,70' } },
      { id: 'cw-spikeR', color: RED, w: 60, h: 60, x: 150, y: 30, shape: { type: 'poly', points: '0,60 30,0 60,60' } },
    ],
  },
  {
    id: 'cat-tangram',
    title: 'ねこを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'ctt-earL', color: RED, w: 40, h: 30, x: 80, y: 30, shape: { type: 'poly', points: '0,30 40,30 0,0' } },
      { id: 'ctt-earR', color: PURPLE, w: 40, h: 30, x: 120, y: 30, shape: { type: 'poly', points: '0,30 40,30 40,0' } },
      { id: 'ctt-head', color: ORANGE, w: 80, h: 70, x: 80, y: 60, shape: { type: 'rect', x: 0, y: 0, w: 80, h: 70, rx: 8 } },
      { id: 'ctt-body', color: BLUE, w: 110, h: 80, x: 65, y: 130, shape: { type: 'rect', x: 0, y: 0, w: 110, h: 80, rx: 10 } },
      { id: 'ctt-tail', color: GREEN, w: 48, h: 22, x: 175, y: 150, shape: { type: 'rect', x: 0, y: 0, w: 48, h: 22, rx: 10 } },
    ],
  },
  {
    id: 'house-tangram',
    title: 'おうちを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'ht-roofL', color: RED, w: 80, h: 70, x: 40, y: 30, shape: { type: 'poly', points: '0,70 80,0 80,70' } },
      { id: 'ht-roofR', color: ORANGE, w: 80, h: 70, x: 120, y: 30, shape: { type: 'poly', points: '0,70 0,0 80,70' } },
      { id: 'ht-wallL', color: BLUE, w: 60, h: 90, x: 40, y: 100, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 90 } },
      { id: 'ht-wallR', color: GREEN, w: 60, h: 90, x: 140, y: 100, shape: { type: 'rect', x: 0, y: 0, w: 60, h: 90 } },
      { id: 'ht-header', color: YELLOW, w: 40, h: 50, x: 100, y: 100, shape: { type: 'rect', x: 0, y: 0, w: 40, h: 50 } },
    ],
  },
  {
    id: 'star-tangram',
    title: 'ほしを つくろう',
    boardW: 240,
    boardH: 240,
    pieces: [
      { id: 'st-center', color: YELLOW, w: 80, h: 80, x: 80, y: 80, shape: { type: 'rect', x: 0, y: 0, w: 80, h: 80 } },
      { id: 'st-top', color: ORANGE, w: 80, h: 60, x: 80, y: 20, shape: { type: 'poly', points: '0,60 40,0 80,60' } },
      { id: 'st-bottom', color: ORANGE, w: 80, h: 60, x: 80, y: 160, shape: { type: 'poly', points: '0,0 80,0 40,60' } },
      { id: 'st-left', color: RED, w: 60, h: 80, x: 20, y: 80, shape: { type: 'poly', points: '60,0 60,80 0,40' } },
      { id: 'st-right', color: RED, w: 60, h: 80, x: 160, y: 80, shape: { type: 'poly', points: '0,0 0,80 60,40' } },
    ],
  },
];

export function getPuzzles(variant: 'fit' | 'tangram', hard: boolean): FitPuzzle[] {
  if (variant === 'fit') return hard ? FIT_HARD : FIT_EASY;
  return hard ? TANGRAM_HARD : TANGRAM_EASY;
}

// ピースを w×h ボックスの中心まわりに rot 度（0/90/180/270）かいてんしたあと、
// 中心を げんてんにした シルエットの「かたち」を あらわす かぎ もじれつ を つくる。
// おなじ かぎ なら 見た目（はめたときの シルエット）が おなじ。
// → おなじ かぎ どうしの ピースは どの スロットに はめても せいかい にできる。
export function silhouetteKey(shape: FitShape, w: number, h: number, rotDeg: number): string {
  const rot = ((Math.round(rotDeg / 90) * 90) % 360 + 360) % 360;
  const cx = w / 2;
  const cy = h / 2;
  // 中心きじゅんの (dx, dy) を rot かいてんした ざひょう（中心きじゅんのまま）を かえす
  const rotate = (px: number, py: number): [number, number] => {
    const dx = px - cx;
    const dy = py - cy;
    switch (rot) {
      case 90: return [-dy, dx];
      case 180: return [-dx, -dy];
      case 270: return [dy, -dx];
      default: return [dx, dy];
    }
  };
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const fmt = (p: [number, number]) => `${r1(p[0])},${r1(p[1])}`;

  if (shape.type === 'circle') {
    const c = rotate(shape.cx, shape.cy);
    return `C|${r1(shape.r)}|${fmt(c)}`;
  }
  let corners: Array<[number, number]>;
  let tag: string;
  if (shape.type === 'rect') {
    corners = [
      [shape.x, shape.y],
      [shape.x + shape.w, shape.y],
      [shape.x + shape.w, shape.y + shape.h],
      [shape.x, shape.y + shape.h],
    ];
    tag = `R|${shape.rx ?? 0}`;
  } else {
    corners = shape.points
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [px, py] = pair.split(',').map(Number);
        return [px, py] as [number, number];
      });
    tag = 'P';
  }
  const pts = corners
    .map((c) => rotate(c[0], c[1]))
    .map(fmt)
    .sort();
  return `${tag}|${pts.join(' ')}`;
}
