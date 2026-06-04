import type { Player } from './types';

export const BINGO_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
] as const;

function squareToCell(n: number) {
  const rfb = Math.floor((n - 1) / 10);
  const c   = (n - 1) % 10;
  return { row: 9 - rfb, col: rfb % 2 === 0 ? c : 9 - c };
}

export const BOARD_GRID: number[][] = (() => {
  const g = Array.from({ length: 10 }, () => Array<number>(10).fill(0));
  for (let n = 1; n <= 100; n++) {
    const { row, col } = squareToCell(n);
    g[row][col] = n;
  }
  return g;
})();

/**
 * ボーナスマスは「キリ番」（10, 20, … 90）に固定する。
 * 10とびのまとまり＝ベンチマークを目印にすることで、数の大小判断・数直線推定の
 * 足場になる（Siegler & Booth 2004 ほか。docs/sugoroku-number-learning-design.md 参照）。
 * ゴール(100)は別扱いなので含めない。
 */
export function generateBonusSquares(): number[] {
  const squares: number[] = [];
  for (let n = 10; n <= 90; n += 10) squares.push(n);
  return squares;
}

/** キリ番（10とび）かどうか。数直線バーや盤の強調・読み上げに使う */
export function isLandmark(n: number): boolean {
  return n > 0 && n < 100 && n % 10 === 0;
}

/**
 * ビンゴボーナスで進むマス数（5〜10 のランダム）。
 * 何ビンゴ（列数）でも1回分。複数列が同時に揃っても進むのは 5〜10 マスのみ。
 */
export function rollBonusSteps(rng: () => number = Math.random): number {
  return 5 + Math.floor(rng() * 6); // 5..10
}

// ── ボーナスマスのミニ問題（B: 大小比較 / D: 数直線推定） ──────────────────────

/** 数直線推定で「正解」とみなす許容差（0〜100 のうち ±この値）。やさしめに広く取る */
export const NUMBERLINE_TOLERANCE = 8;

export type BonusQuiz =
  | { kind: 'compare'; a: number; b: number; answer: number }   // 大きいのはどっち？
  | { kind: 'numberline'; target: number; tolerance: number };  // ◯◯はどのへん？

/** 大小比較の問題を1つ作る。a≠b で answer は大きいほう（提案B）。
 * b は a からのオフセットで作るため、rng が定数でも必ず a≠b になりループしない。 */
export function makeCompareQuiz(rng: () => number = Math.random): BonusQuiz {
  const a = 1 + Math.floor(rng() * 99);            // 1..99
  const offset = 1 + Math.floor(rng() * 98);       // 1..98
  const b = ((a - 1 + offset) % 99) + 1;           // 1..99 かつ必ず a と異なる
  return { kind: 'compare', a, b, answer: Math.max(a, b) };
}

/** 数直線推定の問題を1つ作る（提案D） */
export function makeNumberLineQuiz(rng: () => number = Math.random): BonusQuiz {
  const target = 1 + Math.floor(rng() * 99);
  return { kind: 'numberline', target, tolerance: NUMBERLINE_TOLERANCE };
}

/** ボーナスマスで出す問題をランダムに作る（B と D を半々で） */
export function makeBonusQuiz(rng: () => number = Math.random): BonusQuiz {
  return rng() < 0.5 ? makeCompareQuiz(rng) : makeNumberLineQuiz(rng);
}

/** 数直線推定の正誤判定。target と guess の差が許容内なら正解 */
export function isNumberLineCorrect(target: number, guess: number, tolerance: number): boolean {
  return Math.abs(target - guess) <= tolerance;
}

export function getNewBingos(player: Player): number[] {
  return BINGO_LINES.flatMap((line, i) => {
    if (player.doneLines.includes(i)) return [];
    return line.every(j => player.checked[j]) ? [i] : [];
  });
}

export function getReachNumbers(player: Player): number[] {
  const res = new Set<number>();
  BINGO_LINES.forEach((line, i) => {
    if (player.doneLines.includes(i)) return;
    const unchecked = line.filter(j => !player.checked[j]);
    if (unchecked.length === 1) res.add(player.numbers[unchecked[0]]);
  });
  return [...res].sort((a, b) => a - b);
}

/** マスを踏んで全員のビンゴカードに反映。どのカードセルが光ったかも返す */
export function markBingoNumber(
  square: number,
  ps: Player[],
): { updated: Player[]; flashMap: Map<number, Set<number>> } {
  const flashMap = new Map<number, Set<number>>();
  const updated = ps.map((p, pi) => {
    const idx = p.numbers.indexOf(square);
    if (idx === -1) return p;
    const newChecked = [...p.checked];
    newChecked[idx] = true;
    const set = flashMap.get(pi) ?? new Set<number>();
    set.add(idx);
    flashMap.set(pi, set);
    return { ...p, checked: newChecked };
  });
  return { updated, flashMap };
}

export interface BingoEvent { playerIdx: number; count: number }

/** 全プレイヤーのビンゴ達成をまとめてチェック */
export function processAllBingos(
  ps: Player[],
): { updated: Player[]; events: BingoEvent[] } {
  let updated = ps;
  const events: BingoEvent[] = [];
  ps.forEach((_, i) => {
    const newLines = getNewBingos(updated[i]);
    if (newLines.length > 0) {
      updated = updated.map((pl, j) =>
        j === i ? { ...pl, doneLines: [...pl.doneLines, ...newLines] } : pl,
      );
      events.push({ playerIdx: i, count: newLines.length });
    }
  });
  return { updated, events };
}

/** 各マスにビンゴカードを持つプレイヤーのインデックスリストを返す */
export function buildSquareOwnerMap(players: Player[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  players.forEach((p, pi) => {
    p.numbers.forEach(n => {
      const arr = map.get(n) ?? [];
      arr.push(pi);
      map.set(n, arr);
    });
  });
  return map;
}
