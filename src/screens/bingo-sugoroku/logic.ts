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
  // ◯◯はどのへん？ labels = 目盛りの「数字」を見せるキリ番（目盛線は全部出す・間引きで難化）
  | { kind: 'numberline'; target: number; tolerance: number; labels: number[] }
  // ◯◯ は どっちに ちかい？（がい数の芽。low/high は両どなりのキリ番）
  | { kind: 'nearest'; value: number; low: number; high: number; answer: number }
  // ◯◯ より 10 おおきい/ちいさい かずは？（位取りの感覚・3択）
  | { kind: 'plusten'; base: number; delta: 10 | -10; answer: number; choices: number[] };

/** 大小比較の問題を1つ作る。a≠b で answer は大きいほう（提案B）。
 * b は a からのオフセットで作るため、rng が定数でも必ず a≠b になりループしない。 */
export function makeCompareQuiz(rng: () => number = Math.random): BonusQuiz {
  const a = 1 + Math.floor(rng() * 99);            // 1..99
  const offset = 1 + Math.floor(rng() * 98);       // 1..98
  const b = ((a - 1 + offset) % 99) + 1;           // 1..99 かつ必ず a と異なる
  return { kind: 'compare', a, b, answer: Math.max(a, b) };
}

/** キリ番ラベル候補（0と100は数のアンカーとして必ず表示） */
const INNER_LANDMARKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

/**
 * 数直線推定の問題を1つ作る（提案D）。
 * 目盛線は全キリ番に出すが、「数字ラベル」は 0/100 以外をランダムに間引いて難化する。
 * 許容差は広め（タップミスで外れた感を出さない）に据え置く。
 */
export function makeNumberLineQuiz(rng: () => number = Math.random): BonusQuiz {
  const target = 1 + Math.floor(rng() * 99);
  const labels = [0, 100, ...INNER_LANDMARKS.filter(() => rng() < 0.4)];
  return { kind: 'numberline', target, tolerance: NUMBERLINE_TOLERANCE, labels };
}

/**
 * 「◯◯ は どっちに ちかい？」を作る（がい数＝四捨五入の芽）。
 * 1の位が 0/5 は避け（キリ番ちょうど・等距離を除く）、両どなりのキリ番 low/high を選ばせる。
 * 定数 rng でも棄却ループしないよう、十の位と一の位を直接組み立てる。
 */
export function makeNearestQuiz(rng: () => number = Math.random): BonusQuiz {
  const tens  = 1 + Math.floor(rng() * 8);             // 1..8（low が 10..80）
  const units = [1, 2, 3, 4, 6, 7, 8, 9];              // 0(キリ番) と 5(等距離) は除外
  const u     = units[Math.floor(rng() * units.length)];
  const value = tens * 10 + u;
  const low   = tens * 10;
  const high  = low + 10;
  const answer = value - low < high - value ? low : high;
  return { kind: 'nearest', value, low, high, answer };
}

/**
 * 「◯◯ より 10 おおきい/ちいさい かずは？」を作る（位取りの感覚・3択）。
 * 選択肢は答えの ±10（十の位ちがい）で紛らわしく。定数 rng でも安全に動く。
 */
export function makePlusTenQuiz(rng: () => number = Math.random): BonusQuiz {
  const up: boolean = rng() < 0.5;
  const delta: 10 | -10 = up ? 10 : -10;
  const base = up ? 1 + Math.floor(rng() * 89)        // 1..89  → +10 で 11..99
                  : 11 + Math.floor(rng() * 89);      // 11..99 → -10 で 1..89
  const answer = base + delta;
  let cands = [answer - 10, answer, answer + 10];
  if (answer - 10 < 0)        cands = [answer, answer + 10, answer + 20];
  else if (answer + 10 > 100) cands = [answer - 20, answer - 10, answer];
  const shift = Math.floor(rng() * 3);
  const choices = cands.map((_, i) => cands[(i + shift) % 3]);
  return { kind: 'plusten', base, delta, answer, choices };
}

/** ボーナスマスで出す問題をランダムに作る（4タイプから・難しめに寄せる） */
export function makeBonusQuiz(rng: () => number = Math.random): BonusQuiz {
  const r = rng();
  if (r < 0.25) return makeCompareQuiz(rng);
  if (r < 0.50) return makeNearestQuiz(rng);
  if (r < 0.75) return makePlusTenQuiz(rng);
  return makeNumberLineQuiz(rng);
}

/** 移動範囲 (from, to] に最初に現れるキリ番を返す。なければ null */
export function firstPassedLandmark(from: number, to: number): number | null {
  for (let n = from + 1; n <= to; n++) if (isLandmark(n)) return n;
  return null;
}

/**
 * キリ番（ボーナスマス）のミニ問題を出すか判定。順位でキャッチアップ補正する（ティア制）。
 * - 最下位（同着含む）: キリ番に関与したら必ず発生（びりを後押し）
 * - 最上位（同着含む）: 発生しない（勝ってる人は出さない）
 * - 中間: ぴったり止まれば必ず、通り過ぎただけなら 1/2
 * キリ番を通過も到達もしていない、またはゴール到達時は発生しない。
 * 全員同位置のときは中間ルール扱い。
 */
export function shouldTriggerLandmarkBonus(
  from: number, pos: number, positions: number[], rng: () => number = Math.random,
): boolean {
  if (pos >= 100) return false;
  if (firstPassedLandmark(from, pos) === null) return false;
  const maxPos = Math.max(...positions);
  const minPos = Math.min(...positions);
  const middleRule = () => isLandmark(pos) || rng() < 0.5;
  if (maxPos === minPos) return middleRule();        // 全員同じ位置
  if (pos === maxPos) return false;                  // トップ
  if (pos === minPos) return true;                   // びり
  return middleRule();                               // 中間
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
