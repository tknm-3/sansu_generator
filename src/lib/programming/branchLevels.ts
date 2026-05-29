/**
 * 分岐（じょうけん）単元の レベル定義（難易度別）。
 * 中心の ルールは「もし みぎが かべ なら → した、そうでなければ → みぎ」。
 * これを くりかえし箱で まわすと、かべの かたちが ちがっても おなじ
 * プログラムで ゴールに たどりつける（＝分岐の うれしさ）。
 *
 * 各レベルの goal は、そのルールを はしらせて たどりつく セルに してあるので、
 * かならず クリアできる（branch.test.ts で 検証している）。
 */
import type { Difficulty } from './progress';
import type { Level } from './engine';
import type { BranchCommand } from './branch';

const p = (r: number, c: number) => ({ r, c });

/** 「もし <dir> が かべ なら then、そうでなければ else」の ルールカード */
function ifWall(dir: 'up' | 'down' | 'left' | 'right', then: BranchCommand[], els: BranchCommand[]): BranchCommand {
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

export interface BranchLevel extends Level {
  /** おてほん（検証・ヒント用）の 正解プログラム */
  answer: BranchCommand[];
}

const BRANCH_EASY: BranchLevel[] = [
  {
    id: 'br-e1', rows: 3, cols: 3, start: p(0, 0), goal: p(2, 2),
    walls: [], optimal: 4, allowLoop: true, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'みぎが いけなく なったら した。ルールで すすもう',
    answer: loopRule(4),
  },
  {
    id: 'br-e2', rows: 4, cols: 4, start: p(0, 0), goal: p(3, 3),
    walls: [p(0, 2)], optimal: 4, allowLoop: true, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'かべに あたったら した。おなじ ルールで いけるよ',
    answer: loopRule(6),
  },
  {
    id: 'br-e3', rows: 4, cols: 4, start: p(0, 0), goal: p(3, 3),
    walls: [p(0, 1)], optimal: 4, allowLoop: true, maxSlots: 6, goalEmoji: '🐟',
    prompt: 'はじめから かべ。「もし〜なら」で した へ',
    answer: loopRule(6),
  },
];

const BRANCH_NORMAL: BranchLevel[] = [
  {
    id: 'br-n1', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 2), p(1, 2), p(2, 4)], optimal: 4, allowLoop: true, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'なんども まがる みち。おなじ ルールで さいごまで',
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

const BRANCH_HARD: BranchLevel[] = [
  {
    id: 'br-h1', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 2), p(1, 2), p(2, 4)], gems: [p(2, 2)],
    optimal: 4, allowLoop: true, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'ほし⭐も とおって ゴールへ。ルールで いけるかな？',
    answer: loopRule(8),
  },
  {
    id: 'br-h2', rows: 5, cols: 5, start: p(0, 0), goal: p(4, 4),
    walls: [p(0, 1), p(1, 3)], gems: [p(2, 3)],
    optimal: 4, allowLoop: true, maxSlots: 8, goalEmoji: '🐟',
    prompt: 'みちの とちゅうの ほし⭐も わすれずに',
    answer: loopRule(8),
  },
];

export const BRANCH_LEVELS: Record<Difficulty, BranchLevel[]> = {
  easy: BRANCH_EASY,
  normal: BRANCH_NORMAL,
  hard: BRANCH_HARD,
};
