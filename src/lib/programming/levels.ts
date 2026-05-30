/**
 * 矢印ならべ単元・デバッグ単元の レベル定義（難易度別）。
 * すべての座標は r=行（うえが0）, c=列（ひだりが0）。
 * 解けることは levels.test.ts で検証している。
 */
import type { Difficulty } from './progress';
import type { Dir, Level } from './engine';

const r = (row: number, col: number) => ({ r: row, c: col });

// ───────────────────────── 矢印ならべ ─────────────────────────

const SEQUENCE_EASY: Level[] = [
  {
    id: 'seq-e1', rows: 3, cols: 3, start: r(0, 0), goal: r(0, 2),
    walls: [], optimal: 2, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'まっすぐ みぎへ すすもう',
  },
  {
    id: 'seq-e2', rows: 3, cols: 3, start: r(2, 1), goal: r(0, 1),
    walls: [], optimal: 2, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'うえまで のぼろう',
  },
  {
    id: 'seq-e3', rows: 3, cols: 3, start: r(0, 0), goal: r(2, 2),
    walls: [r(1, 1)], optimal: 4, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'まんなかの かべを よけて いこう',
  },
  {
    id: 'seq-e4', rows: 3, cols: 3, start: r(2, 0), goal: r(0, 2),
    walls: [r(1, 1)], optimal: 4, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'ななめの ゴールまで はこぼう',
  },
  {
    id: 'seq-e5', rows: 3, cols: 3, start: r(0, 0), goal: r(2, 1),
    walls: [], optimal: 3, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'した と みぎで ゴールへ',
  },
];

const SEQUENCE_NORMAL: Level[] = [
  {
    id: 'seq-n1', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(1, 1), r(2, 2), r(1, 3)], optimal: 6, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'かべを よけて はしっこを とおろう',
  },
  {
    id: 'seq-n2', rows: 4, cols: 4, start: r(0, 0), goal: r(0, 3),
    walls: [r(0, 1), r(0, 2)], optimal: 5, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'かべが あるよ。まわりみちを かんがえよう',
  },
  {
    id: 'seq-n3', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 0),
    walls: [r(1, 1), r(2, 2)], optimal: 6, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'ひだりした まで はこぼう',
  },
  {
    id: 'seq-n4', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(2, 1), r(1, 2)], optimal: 6, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'みぎうえの ゴールへ',
  },
];

const SEQUENCE_HARD: Level[] = [
  {
    id: 'seq-h1', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(3, 3), r(1, 3), r(3, 1)],
    gems: [r(2, 2)], optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: '🐟',
    prompt: 'ほし⭐を とおってから ゴールへ',
  },
  {
    id: 'seq-h2', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 1), r(2, 2), r(2, 3)],
    gems: [r(0, 4)], optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: '🐟',
    prompt: 'うえの ほし⭐を とおってから ゴールへ',
  },
  {
    id: 'seq-h3', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 0),
    walls: [], optimal: 4, maxSlots: 12, allowLoop: true, goalEmoji: '🐟',
    prompt: 'おなじ むきが つづくよ。ループ箱が べんり！',
  },
  {
    id: 'seq-h4', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 2), r(2, 2), r(3, 2)],
    gems: [r(4, 0)], optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: '🐟',
    prompt: 'したの ほし⭐を とおってから ゴールへ',
  },
];

// ───────────────────────── デバッグ ─────────────────────────
// buggy = 最初から入っている まちがいを含む列。solution = 正解の一例。
// スロット数は buggy.length 固定で、向きを直して クリアする。

const DEBUG_EASY: Level[] = [
  {
    id: 'dbg-e1', rows: 3, cols: 4, start: r(1, 0), goal: r(1, 3),
    walls: [], optimal: 3, goalEmoji: '🐟', maxChanges: 1,
    buggy: ['right', 'up', 'right'],
    solution: ['right', 'right', 'right'],
    prompt: 'まっすぐ ゴールへ いきたいのに…',
  },
  {
    id: 'dbg-e2', rows: 4, cols: 3, start: r(0, 1), goal: r(3, 1),
    walls: [], optimal: 3, goalEmoji: '🐟', maxChanges: 1,
    buggy: ['down', 'left', 'down'],
    solution: ['down', 'down', 'down'],
    prompt: 'したへ おりたいのに よこに ずれちゃう',
  },
  {
    id: 'dbg-e3', rows: 3, cols: 4, start: r(2, 0), goal: r(0, 3),
    walls: [], optimal: 5, goalEmoji: '🐟', maxChanges: 1,
    buggy: ['up', 'down', 'right', 'right', 'right'],
    solution: ['up', 'up', 'right', 'right', 'right'],
    prompt: 'ゴールは みぎうえ。どこが へん？',
  },
];

const DEBUG_NORMAL: Level[] = [
  {
    id: 'dbg-n1', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [], optimal: 6, goalEmoji: '🐟', maxChanges: 2,
    buggy: ['right', 'left', 'right', 'down', 'up', 'down'],
    solution: ['right', 'right', 'right', 'down', 'down', 'down'],
    prompt: 'みぎした まで いきたいよ。2かしょ へん',
  },
  {
    id: 'dbg-n2', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(2, 1)], optimal: 6, goalEmoji: '🐟', maxChanges: 2,
    buggy: ['up', 'up', 'left', 'right', 'right', 'right'],
    solution: ['up', 'up', 'up', 'right', 'right', 'right'],
    prompt: 'みぎうえへ。どこを なおす？',
  },
  {
    id: 'dbg-n3', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 0),
    walls: [], optimal: 6, goalEmoji: '🐟', maxChanges: 2,
    buggy: ['down', 'right', 'down', 'left', 'down', 'left'],
    solution: ['down', 'left', 'down', 'left', 'down', 'left'],
    prompt: 'ひだりした へ。かいだんを おりよう',
  },
];

const DEBUG_HARD: Level[] = [
  {
    id: 'dbg-h1', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 0), r(2, 4)], gems: [r(2, 2)], optimal: 8, goalEmoji: '🐟', maxChanges: 2,
    buggy: ['right', 'down', 'down', 'down', 'down', 'right', 'right', 'right'],
    solution: ['right', 'right', 'down', 'down', 'down', 'down', 'right', 'right'],
    prompt: 'ほし⭐を とおってゴールへ いきたいよ',
  },
  {
    id: 'dbg-h2', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(3, 3)], gems: [r(0, 4)], optimal: 8, goalEmoji: '🐟', maxChanges: 3,
    buggy: ['right', 'right', 'right', 'left', 'down', 'down', 'down', 'down'],
    solution: ['right', 'right', 'right', 'right', 'down', 'down', 'down', 'down'],
    prompt: 'うえの ほし⭐を とおってゴールへ',
  },
];

// ───────────────────────── ぼうけんしよう ─────────────────────────

const ADVENTURE_EASY: Level[] = [
  {
    id: 'adv-e1', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [], gems: [r(1, 2)], gemEmoji: '🎁', optimal: 6, maxSlots: 10, goalEmoji: '🏠',
    prompt: 'たからばこ🎁を とってから おうちへ！',
  },
  {
    id: 'adv-e2', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(1, 1)], gems: [r(2, 3)], gemEmoji: '🎁', optimal: 6, maxSlots: 10, goalEmoji: '🏠',
    prompt: 'かべを よけて たからばこ🎁を とろう',
  },
  {
    id: 'adv-e3', rows: 4, cols: 5, start: r(0, 0), goal: r(3, 4),
    walls: [], gems: [r(0, 4), r(3, 0)], gemEmoji: '🎁', optimal: 10, maxSlots: 14, goalEmoji: '🏠',
    prompt: 'たからばこが 2つ！ どちらも とろう',
  },
];

const ADVENTURE_NORMAL: Level[] = [
  {
    id: 'adv-n1', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(1, 1), r(2, 2)],
    gems: [r(0, 3)], gemEmoji: '🎁',
    zombies: [{ kind: 'fixed', pos: r(2, 3) }],
    optimal: 8, maxSlots: 12, goalEmoji: '🏠',
    prompt: 'ゾンビ🧟を さけて たからばこを とろう',
  },
  {
    id: 'adv-n2', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [],
    gems: [r(1, 1)], gemEmoji: '🎁',
    zombies: [{ kind: 'fixed', pos: r(1, 3) }, { kind: 'fixed', pos: r(3, 2) }],
    optimal: 6, maxSlots: 12, goalEmoji: '🏠',
    prompt: 'ゾンビが 2ひき！ みちを よく かんがえよう',
  },
  {
    id: 'adv-n3', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 1), r(2, 3)],
    gems: [r(2, 2)], gemEmoji: '🎁',
    zombies: [{ kind: 'fixed', pos: r(0, 4) }, { kind: 'fixed', pos: r(4, 0) }],
    optimal: 8, maxSlots: 14, goalEmoji: '🏠',
    prompt: 'まんなかの たからばこ🎁を めざそう',
  },
];

const ADVENTURE_HARD: Level[] = [
  {
    id: 'adv-h1', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 0), r(2, 4)],
    gems: [r(0, 4)], gemEmoji: '🎁',
    zombies: [{ kind: 'patrol', pos: r(2, 2), path: [r(2, 3), r(2, 2), r(2, 1)] }],
    optimal: 10, maxSlots: 14, allowLoop: true, goalEmoji: '🏠',
    prompt: 'ゾンビが おうふく！ タイミングを みきわめよう',
  },
  {
    id: 'adv-h2', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(1, 2), r(3, 2)],
    gems: [r(2, 0), r(2, 4)], gemEmoji: '🎁',
    zombies: [{ kind: 'patrol', pos: r(0, 0), path: [r(1, 0), r(2, 0), r(1, 0)] }],
    optimal: 12, maxSlots: 16, allowLoop: true, goalEmoji: '🏠',
    prompt: 'たからばこを 2つ とってゴールへ！',
  },
  {
    id: 'adv-h3', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(3, 3)],
    gems: [r(0, 4)], gemEmoji: '🎁',
    zombies: [{ kind: 'chase', pos: r(4, 0) }],
    optimal: 10, maxSlots: 14, goalEmoji: '🏠',
    prompt: 'ゾンビが おいかけてくる！ にげながら たからばこを とれ！',
  },
];

// superhard は いちばん むずかしい hard の問題を 流用する（未定義による クラッシュを ふせぐ）
export const ADVENTURE_LEVELS: Record<Difficulty, Level[]> = {
  easy: ADVENTURE_EASY,
  normal: ADVENTURE_NORMAL,
  hard: ADVENTURE_HARD,
  superhard: ADVENTURE_HARD,
};

export const SEQUENCE_LEVELS: Record<Difficulty, Level[]> = {
  easy: SEQUENCE_EASY,
  normal: SEQUENCE_NORMAL,
  hard: SEQUENCE_HARD,
  superhard: SEQUENCE_HARD,
};

export const DEBUG_LEVELS: Record<Difficulty, Level[]> = {
  easy: DEBUG_EASY,
  normal: DEBUG_NORMAL,
  hard: DEBUG_HARD,
  superhard: DEBUG_HARD,
};

/** プールから n問 ランダムに選ぶ（足りなければ くりかえし使う） */
export function pickLevels(pool: Level[], n: number): Level[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const out: Level[] = [];
  for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}

/** 自分で作る単元の グリッドサイズ選択肢 */
export const MAKER_SIZES: { id: Difficulty; label: string; size: number }[] = [
  { id: 'easy', label: 'ちいさい', size: 3 },
  { id: 'normal', label: 'ふつう', size: 4 },
  { id: 'hard', label: 'おおきい', size: 5 },
];

export type { Dir };
