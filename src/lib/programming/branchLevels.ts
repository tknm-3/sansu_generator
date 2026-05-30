/**
 * 分岐（じょうけん）単元「もしも ロボット」の レベル定義（難易度別）。
 * 中心の ルールは「もし みぎが かべ なら → した、そうでなければ → みぎ」。
 * これを くりかえし箱で まわすと、かべの かたちが ちがっても おなじ
 * プログラムで ゴールに たどりつける（＝分岐の うれしさ）。
 *
 * 難易度で「じゆうど」が あがっていく:
 *  - easy   … もし文と やじるしが もう ならんでいて、もし文の むきだけ あな（fill）。
 *             そこを うめるだけ。ふつうの やじるしでは 解けない（＝分岐に しゅうちゅう）。
 *  - normal … もし文を じぶんで くみたてて くりかえす（やじるし単独は なし）。
 *  - hard   … やじるし・もし文・くりかえしを じゆうに くみあわせる。
 *
 * 各レベルの answer は そのルールを はしらせて ゴールに とどく（branch.test.ts で検証）。
 */
import type { Dir, Level } from './engine';
import type { BranchCommand } from './branch';

/** 分岐単元の 難易度（スペシャルは なし。やさしい順に じゆうどが あがる） */
export type BranchDifficulty = 'easy' | 'normal' | 'hard';

const p = (r: number, c: number) => ({ r, c });

/** 「もし <dir> が かべ なら then、そうでなければ else」の ルールカード */
function ifWall(dir: Dir, then: BranchCommand[], els: BranchCommand[]): BranchCommand {
  return { kind: 'if', cond: { kind: 'wall', dir }, then, else: els };
}

/** みぎが かべ なら した、そうでなければ みぎ（階段おり） */
const RULE_RIGHT_ELSE_DOWN: BranchCommand = ifWall(
  'right',
  [{ kind: 'move', dir: 'down' }],
  [{ kind: 'move', dir: 'right' }],
);

/** ルールを times回 くりかえす プログラム */
const loopRule = (times: number, rule: BranchCommand = RULE_RIGHT_ELSE_DOWN): BranchCommand[] => [
  { kind: 'repeat', times, body: [rule] },
];

/**
 * かんたん（穴埋め）モードの 設定。
 * もし文と くりかえしは もう くまれていて、3つの むき（センサー／かべのとき／
 * そうでないとき）だけが あなに なっている。ここを うめると 答えに なる。
 */
export interface FillConfig {
  /** 固定の くりかえし回数 */
  loopTimes: number;
  /** 正解の むき（あなを ぜんぶ うめると これに なる） */
  sensor: Dir;
  thenDir: Dir;
  elseDir: Dir;
}

export interface BranchLevel extends Level {
  /** おてほん（検証・ヒント用）の 正解プログラム */
  answer: BranchCommand[];
  /** かんたん（穴埋め）モードのときの 設定。なければ くみたてモード */
  fill?: FillConfig;
}

// ───────── かんたん：もし文の むきだけ うめる（同じ 1ルールで 形が ちがっても解ける）─────────
const BRANCH_EASY: BranchLevel[] = [
  {
    id: 'br-e1', rows: 3, cols: 3, start: p(0, 0), goal: p(2, 2),
    walls: [], optimal: 4, allowLoop: true, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'あなを うめよう！「もし みぎが かべ なら ↓」',
    fill: { loopTimes: 4, sensor: 'right', thenDir: 'down', elseDir: 'right' },
    answer: loopRule(4),
  },
  {
    id: 'br-e2', rows: 4, cols: 4, start: p(0, 0), goal: p(3, 3),
    walls: [p(0, 2)], optimal: 4, allowLoop: true, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'おなじ うめかたで いけるよ。かべに あたったら ↓',
    fill: { loopTimes: 6, sensor: 'right', thenDir: 'down', elseDir: 'right' },
    answer: loopRule(6),
  },
  {
    id: 'br-e3', rows: 4, cols: 4, start: p(0, 0), goal: p(3, 3),
    walls: [p(0, 1)], optimal: 4, allowLoop: true, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'はじめから かべ。でも うめかたは おなじ！',
    fill: { loopTimes: 6, sensor: 'right', thenDir: 'down', elseDir: 'right' },
    answer: loopRule(6),
  },
];

// ───────── ふつう：もし文を じぶんで くみたてて くりかえす ─────────
const BRANCH_NORMAL: BranchLevel[] = [
  {
    id: 'br-n1', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 2), p(1, 2), p(2, 4)], optimal: 4, allowLoop: true, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'もし文を 1つ つくって、🔁で さいごまで',
    answer: loopRule(8),
  },
  {
    id: 'br-n2', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 1), p(1, 3)], optimal: 4, allowLoop: true, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'くりかえす かいすうも かんがえてみよう',
    answer: loopRule(8),
  },
  {
    id: 'br-n3', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 2), p(1, 4)], optimal: 4, allowLoop: true, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'かべを 見て すすむ むきを えらぼう',
    answer: loopRule(8),
  },
];

// ───────── むずかしい：やじるし・もし文・くりかえしを じゆうに くみあわせる ─────────
const BRANCH_HARD: BranchLevel[] = [
  {
    id: 'br-h1', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 2), p(1, 2), p(2, 4)], optimal: 8, allowLoop: true, maxSlots: 10, goalEmoji: '🐟',
    prompt: 'やじるしも もし文も つかえるよ。じゆうに ゴールへ',
    answer: loopRule(8),
  },
  {
    id: 'br-h2', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 1), p(1, 3)], optimal: 8, allowLoop: true, maxSlots: 10, goalEmoji: '🐟',
    prompt: 'じぶんの すきな くみかたで いこう',
    answer: loopRule(8),
  },
  {
    id: 'br-h3', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 3), p(2, 1), p(3, 3)], optimal: 8, allowLoop: true, maxSlots: 10, goalEmoji: '🐟',
    prompt: 'かべが おおい！ もし文で じゅんびよく よけよう',
    answer: loopRule(8),
  },
];

export const BRANCH_LEVELS: Record<BranchDifficulty, BranchLevel[]> = {
  easy: BRANCH_EASY,
  normal: BRANCH_NORMAL,
  hard: BRANCH_HARD,
};
