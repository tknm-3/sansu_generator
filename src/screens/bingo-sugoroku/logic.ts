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

/** 「だれとだれの差」クイズで使うコマ情報（数直線に並べて見せる） */
export interface QuizPlayerRef { name: string; char: string; pos: number }

export type BonusQuiz =
  | { kind: 'compare'; a: number; b: number; answer: number }   // 大きいのはどっち？
  // ◯◯はどのへん？ labels = 目盛りの「数字」を見せるキリ番（目盛線は全部出す・間引きで難化）
  | { kind: 'numberline'; target: number; tolerance: number; labels: number[] }
  // ◯◯ は どっちに ちかい？（がい数の芽。low/high は両どなりのキリ番）
  | { kind: 'nearest'; value: number; low: number; high: number; answer: number }
  // ◯◯ より 10 おおきい/ちいさい かずは？（位取りの感覚・3択）
  | { kind: 'plusten'; base: number; delta: 10 | -10; answer: number; choices: number[] }
  // だれとだれは なんマス はなれてる？（実際のコマ位置の差・数直線で数える・3択）
  // a は数直線で左（pos 小）、b は右（pos 大）。answer = b.pos - a.pos。
  | { kind: 'distance'; a: QuizPlayerRef; b: QuizPlayerRef; answer: number; choices: number[] };

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

/**
 * 「だれとだれは なんマス はなれてる？」の3択を作る（答え＝差）。
 * まちがいの候補は「数えまちがい」(±1〜2) と「位取りまちがい」(±10) を1つずつ混ぜる。
 * 数直線を見て数えれば解けるので、紛らわしくしすぎない。0〜100に収め重複なし。
 */
export function makeDistanceChoices(answer: number, rng: () => number = Math.random): number[] {
  // 位取りずれ（十の位ちがい）。+10 が範囲外になるのは answer>90 のときだけで、その場合 -10 は安全。
  const tenOff = answer + 10 <= 100 ? answer + 10 : answer - 10;
  // 数えずれ。answer と tenOff に被らない近い数から1つ。
  const oneCands = [answer + 1, answer - 1, answer + 2, answer - 2]
    .filter(v => v >= 1 && v <= 100 && v !== answer && v !== tenOff);
  const oneOff = oneCands[Math.floor(rng() * oneCands.length)];
  const cands = [answer, tenOff, oneOff];
  const shift = Math.floor(rng() * 3);                    // 並び順をランダムに
  return cands.map((_, i) => cands[(i + shift) % 3]);
}

/**
 * 「だれとだれは なんマス はなれてる？」を作る（実際のコマ位置の差・提案B/数直線連動）。
 * 位置の異なる2人をランダムに選び、数直線で左(pos小)=a / 右(pos大)=b に並べる。
 * 位置がみんな同じ（差が作れない）ときは null を返す（呼び出し側でほかのタイプにフォールバック）。
 */
export function makeDistanceQuiz(
  players: QuizPlayerRef[], rng: () => number = Math.random,
): Extract<BonusQuiz, { kind: 'distance' }> | null {
  const pairs: [number, number][] = [];
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++)
      if (players[i].pos !== players[j].pos) pairs.push([i, j]);
  if (pairs.length === 0) return null;
  const [i, j] = pairs[Math.floor(rng() * pairs.length)];
  const [a, b] = players[i].pos < players[j].pos ? [players[i], players[j]] : [players[j], players[i]];
  const answer = b.pos - a.pos;
  return { kind: 'distance', a, b, answer, choices: makeDistanceChoices(answer, rng) };
}

/**
 * ボーナスマスで出す問題をランダムに作る（5タイプから・難しめに寄せる）。
 * players（実際のコマ位置）を渡すと「だれとだれの差」も候補に入る。
 * 渡さない／差が作れない（全員同じ位置）ときは従来の4タイプから出す。
 */
export function makeBonusQuiz(
  players?: QuizPlayerRef[], rng: () => number = Math.random,
): BonusQuiz {
  const distance = players ? makeDistanceQuiz(players, rng) : null;
  const r = rng();
  if (distance && r < 0.30) return distance;
  if (r < 0.50) return makeCompareQuiz(rng);
  if (r < 0.65) return makeNearestQuiz(rng);
  if (r < 0.80) return makePlusTenQuiz(rng);
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
 * - 最上位（同着含む）: ぴったり止まれば必ず、通り過ぎただけなら 30%
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
  if (maxPos === minPos) return middleRule();                        // 全員同じ位置
  if (pos === maxPos) return isLandmark(pos) || rng() < 0.3;        // トップ：ぴったりなら必ず、通過のみなら30%
  if (pos === minPos) return true;                                   // びり
  return middleRule();                                               // 中間
}

/** 数直線推定の正誤判定。target と guess の差が許容内なら正解 */
export function isNumberLineCorrect(target: number, guess: number, tolerance: number): boolean {
  return Math.abs(target - guess) <= tolerance;
}

// ── 予想ボーナスチャンス（サイコロ後「どこに止まる？」を数直線で当てる） ──────────

/** 予想ボーナスが一人のゲーム中に起きる最大回数 */
export const PREDICT_BONUS_MAX = 2;
/** 予想クイズで正解とみなす許容差（0〜100 のうち ±この値）。タップ精度を考えてやや広め */
export const PREDICT_BONUS_TOLERANCE = 5;

export interface PredictQuiz {
  from:      number;  // いまいるマス
  roll:      number;  // 出た目
  target:    number;  // 止まるマス（from + roll、最大100）
  tolerance: number;
}

/** 予想ボーナスで余分に進めるマス数（3〜5 のランダム） */
export function rollPredictBonusSteps(rng: () => number = Math.random): number {
  return 3 + Math.floor(rng() * 3); // 3..5
}

/** 「どこに止まる？」予想クイズを作る。target = from + roll（最大100） */
export function makePredictQuiz(from: number, roll: number): PredictQuiz {
  return { from, roll, target: Math.min(from + roll, 100), tolerance: PREDICT_BONUS_TOLERANCE };
}

/**
 * サイコロを振ったあと「どこに止まる？」予想ボーナスを出すか判定。
 * - すでに上限(PREDICT_BONUS_MAX)回 使った人には出さない
 * - ゴール到達(to>=100)では出さない（勝ち確の直前に水を差さない）
 * - 負けている人ほど起きやすい（びり > 中間 > トップ）でキャッチアップを後押し
 */
export function shouldTriggerPredictBonus(
  playerIdx: number, usedCount: number, positions: number[], to: number,
  rng: () => number = Math.random,
): boolean {
  if (usedCount >= PREDICT_BONUS_MAX) return false;
  if (to >= 100) return false;
  const pos = positions[playerIdx];
  const maxPos = Math.max(...positions);
  const minPos = Math.min(...positions);
  if (maxPos === minPos) return rng() < 0.3;   // 全員横並び
  if (pos === minPos)    return rng() < 0.55;  // びり：起きやすい
  if (pos === maxPos)    return rng() < 0.15;  // トップ：起きにくい
  return rng() < 0.3;                          // 中間
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
