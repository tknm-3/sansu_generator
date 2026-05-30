/**
 * 分岐（じょうけん）単元の エンジン。
 * 「もし <むき> が かべ なら → こっち、そうでなければ → あっち」という
 * ルールカードを 実行する。矢印ならべと ちがい、ロボットが その場の かべを
 * 見て すすむ むきを じぶんで えらぶ（＝分岐）。
 *
 * 既存の engine.ts には てを いれず、ここに 独立した インタプリタを もつ。
 * Level / Pos / Dir / RunResult などの 型は engine.ts と 共有する。
 */
import {
  samePos,
  type Dir,
  type Level,
  type Pos,
  type RunResult,
} from './engine';

/** 「<dir> の となりが かべ／そと（すすめない）か」をみる じょうけん */
export type Cond = { kind: 'wall'; dir: Dir };

/** 分岐単元の 命令：うごく・もし〜なら・くりかえす */
export type BranchCommand =
  | { kind: 'move'; dir: Dir }
  | { kind: 'if'; cond: Cond; then: BranchCommand[]; else: BranchCommand[] }
  | { kind: 'repeat'; times: number; body: BranchCommand[] };

const DELTA: Record<Dir, Pos> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

function posKey(p: Pos): string {
  return `${p.r},${p.c}`;
}

/** むげんループ（くりかえし箱の いれすぎ）で とまらないための ほけん */
const MAX_STEPS = 300;

/** プログラム中の 命令の かず（move / if / repeat を 1つずつ かぞえる） */
export function countNodes(cmds: BranchCommand[]): number {
  let n = 0;
  for (const c of cmds) {
    n += 1;
    if (c.kind === 'if') n += countNodes(c.then) + countNodes(c.else);
    else if (c.kind === 'repeat') n += countNodes(c.body);
  }
  return n;
}

/**
 * 分岐プログラムを 実行して、軌跡と けっかを かえす。
 * ゴールは 「みちの とちゅうで 一度でも ふんだら クリア」あつかいにして、
 * くりかえし回数を すこし おおく しても 失敗に ならないようにしている。
 */
export function runBranch(level: Level, program: BranchCommand[]): RunResult {
  const path: Pos[] = [level.start];
  let cur = level.start;
  let blocked = false;
  let blockedCell: Pos | null = null;
  let steps = 0;

  const gemKeys = new Set((level.gems ?? []).map(posKey));

  const inBounds = (p: Pos) =>
    p.r >= 0 && p.r < level.rows && p.c >= 0 && p.c < level.cols;
  const isWall = (p: Pos) => level.walls.some((w) => samePos(w, p));
  const blockedAt = (p: Pos, d: Dir): boolean => {
    const n: Pos = { r: p.r + DELTA[d].r, c: p.c + DELTA[d].c };
    return !inBounds(n) || isWall(n);
  };

  const evalCond = (c: Cond): boolean =>
    c.kind === 'wall' ? blockedAt(cur, c.dir) : false;

  // 命令列を じゅんに 実行。かべに あたるか 手数ぎれで false（中断）。
  function exec(cmds: BranchCommand[]): boolean {
    for (const cmd of cmds) {
      if (blocked || steps >= MAX_STEPS) return false;
      if (cmd.kind === 'move') {
        const next: Pos = { r: cur.r + DELTA[cmd.dir].r, c: cur.c + DELTA[cmd.dir].c };
        if (!inBounds(next) || isWall(next)) {
          blocked = true;
          blockedCell = inBounds(next) ? next : null;
          return false;
        }
        cur = next;
        path.push(cur);
        steps += 1;
      } else if (cmd.kind === 'if') {
        if (!exec(evalCond(cmd.cond) ? cmd.then : cmd.else)) return false;
      } else {
        for (let i = 0; i < cmd.times; i++) {
          if (!exec(cmd.body)) return false;
        }
      }
    }
    return true;
  }

  exec(program);

  // ゴールを 一度でも ふんで、そこまでに ほしを ぜんぶ とれていたら クリア
  const collected = new Set<string>();
  let reachedGoal = false;
  for (const p of path) {
    if (gemKeys.has(posKey(p))) collected.add(posKey(p));
    if (samePos(p, level.goal) && collected.size === gemKeys.size) {
      reachedGoal = true;
      break;
    }
  }
  const missedGems = gemKeys.size - collected.size;

  return {
    path,
    blockedStep: blocked ? steps : -1,
    blockedCell,
    reachedGoal,
    collectedAll: missedGems === 0,
    missedGems,
    steps,
    finalPos: cur,
    hitZombieStep: -1,
    zombiePaths: [],
  };
}

function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

/**
 * 分岐単元の 前向きヒント。「まちがい」と いわず、
 * 「もし〜なら」で かべを よける 発想を そっと あと押しする。
 * wall は しょうがいぶつの よびな（既定「かべ」、くものてんごくは「くも」など）。
 */
export function buildBranchHint(level: Level, result: RunResult, attempt: number, wall = 'かべ'): string {
  if (result.blockedStep >= 0) {
    if (attempt <= 1) {
      return `${wall}に あたって とまっちゃった！\n「もし まえに すすめない なら…」の ルールで よけられるかな？`;
    }
    return `すすむ さきに ${wall}が あるみたい。\nすすめない ときは べつの むきへ いく ルールに してみよう。`;
  }
  if (result.missedGems > 0) {
    return `ほしを あと ${result.missedGems}こ とおりたいね。\nほしを とおる みちを かんがえてみよう。`;
  }
  const dist = manhattan(result.finalPos, level.goal);
  if (dist > 0) {
    if (attempt <= 1) {
      return `ゴールまで まだ とどいてないよ。\nくりかえす かいすうを ふやしてみる？`;
    }
    return `ゴールは いまの ばしょから どっちの むきかな？\nルールの むきを 見なおしてみよう。`;
  }
  return 'おしい！ もういちど ルールを みなおしてみよう。';
}
