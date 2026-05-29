/**
 * プログラミング単元の共通エンジン。
 * 矢印（命令）を順番に実行して、キャラがマスの上をどう動くかを計算する。
 * 画面側はこの結果（軌跡・ぶつかった場所・ゴール到達）を見て描画とヒントを出す。
 */

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Pos {
  r: number; // 行（うえが0）
  c: number; // 列（ひだりが0）
}

/** 命令：1マスうごく矢印か、「○回くりかえす」ループ箱 */
export type Command =
  | { kind: 'move'; dir: Dir }
  | { kind: 'repeat'; times: number; body: Dir[] };

export interface Level {
  id: string;
  rows: number;
  cols: number;
  start: Pos;
  goal: Pos;
  /** すすめないマス（かべ） */
  walls: Pos[];
  /** 通らなければいけない とちゅうの ちず（ほし）。なくてもよい */
  gems?: Pos[];
  /** 最短手数（ぴったり賞の判定に使う） */
  optimal: number;
  /** ループ箱を使えるレベルか */
  allowLoop?: boolean;
  /** 命令スロットの最大数（矢印ならべ単元のトレイ上限） */
  maxSlots?: number;
  /** デバッグ単元で最初から入っている（まちがいを含む）プログラム */
  buggy?: Dir[];
  /** 正解の一例（デバッグ単元の検証・おてほん表示に使う） */
  solution?: Dir[];
  /** ゴールの絵文字（さかな・ほし など）。なければさかな */
  goalEmoji?: string;
  /** この問題のひとことガイド */
  prompt?: string;
}

export const DIR_ARROW: Record<Dir, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

export const DIR_LABEL: Record<Dir, string> = {
  up: 'うえ',
  down: 'した',
  left: 'ひだり',
  right: 'みぎ',
};

const DELTA: Record<Dir, Pos> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

export function samePos(a: Pos, b: Pos): boolean {
  return a.r === b.r && a.c === b.c;
}

function posKey(p: Pos): string {
  return `${p.r},${p.c}`;
}

function inBounds(level: Level, p: Pos): boolean {
  return p.r >= 0 && p.r < level.rows && p.c >= 0 && p.c < level.cols;
}

function isWall(level: Level, p: Pos): boolean {
  return level.walls.some((w) => samePos(w, p));
}

/** ループ箱を展開して、矢印（Dir）のいちれつに変換する */
export function flatten(cmds: Command[]): Dir[] {
  const out: Dir[] = [];
  for (const cmd of cmds) {
    if (cmd.kind === 'move') {
      out.push(cmd.dir);
    } else {
      for (let i = 0; i < cmd.times; i++) out.push(...cmd.body);
    }
  }
  return out;
}

export interface RunResult {
  /** start を ふくむ、各ステップ後の いち */
  path: Pos[];
  /** かべ／そとに ぶつかって とまった ステップ番号（-1なら ぶつからなかった） */
  blockedStep: number;
  /** ぶつかろうとした セル（わくの そとなら null）。ハイライト用 */
  blockedCell: Pos | null;
  /** さいごに ゴールに いるか */
  reachedGoal: boolean;
  /** ほし（gem）を ぜんぶ とおったか */
  collectedAll: boolean;
  /** まだ とおっていない ほしの かず */
  missedGems: number;
  /** 展開後の てかず */
  steps: number;
  /** さいごの いち */
  finalPos: Pos;
}

/** プログラムを実行して、軌跡とけっかを計算する */
export function runProgram(level: Level, cmds: Command[]): RunResult {
  const dirs = flatten(cmds);
  const path: Pos[] = [level.start];
  let cur = level.start;
  let blockedStep = -1;

  const gemKeys = new Set((level.gems ?? []).map(posKey));
  const collected = new Set<string>();
  if (gemKeys.has(posKey(cur))) collected.add(posKey(cur));

  let blockedCell: Pos | null = null;
  for (let i = 0; i < dirs.length; i++) {
    const d = dirs[i];
    const next: Pos = { r: cur.r + DELTA[d].r, c: cur.c + DELTA[d].c };
    if (!inBounds(level, next) || isWall(level, next)) {
      blockedStep = i;
      blockedCell = inBounds(level, next) ? next : null;
      break;
    }
    cur = next;
    path.push(cur);
    if (gemKeys.has(posKey(cur))) collected.add(posKey(cur));
  }

  const missedGems = gemKeys.size - collected.size;
  return {
    path,
    blockedStep,
    blockedCell,
    reachedGoal: samePos(cur, level.goal) && blockedStep === -1,
    collectedAll: missedGems === 0,
    missedGems,
    steps: dirs.length,
    finalPos: cur,
  };
}

/** クリア（ゴール到達かつ ほし全取得）したか */
export function isCleared(result: RunResult): boolean {
  return result.reachedGoal && result.collectedAll;
}

/** 最短手数ちょうどでクリアしたか（ぴったり賞） */
export function isPerfect(level: Level, result: RunResult): boolean {
  return isCleared(result) && result.steps === level.optimal;
}

function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

/**
 * 「まちがい」ではなく、こどもが つぎに かんがえる ヒントを返す。
 * attempt（やりなおした かいすう）が ふえるほど ヒントが こくなる。
 */
export function buildHint(level: Level, result: RunResult, attempt: number): string {
  // 1) かべ・そとに ぶつかった
  if (result.blockedStep >= 0) {
    const stepNo = result.blockedStep + 1;
    if (attempt <= 1) {
      return `${stepNo}ばんめの やじるしで とまっちゃった！\nその まえの まがりかどを よく みてみよう。`;
    }
    return `${stepNo}ばんめの やじるしで かべに あたるよ。\nそこを べつの むきに かえると どうなるかな？`;
  }

  // 2) まだ とおっていない ほしが ある
  if (result.missedGems > 0) {
    return `ほしを あと ${result.missedGems}こ とおりたいね。\nさきに ほしを とおる みちを かんがえてみよう。`;
  }

  // 3) ゴールに とどいていない
  const dist = manhattan(result.finalPos, level.goal);
  if (dist > 0) {
    if (attempt <= 1) {
      return `ゴールまで あと ${dist}マス！ もうすこしだよ。\nさいごの やじるしを たしてみる？`;
    }
    return `ゴールまで あと ${dist}マス。\nゴールは いまの ばしょから どっちの むきかな？`;
  }

  // 4) ゴールは ふんだが ほし／とおりすぎ などで クリア扱いでない
  return 'おしい！ もういちど みちを みなおしてみよう。';
}

/** クリアしたときの ほめことば（ぴったり賞かどうかで変える） */
export function buildPraise(perfect: boolean): string {
  return perfect
    ? 'ぴったりクリア！ いちばん みじかい みちだよ！'
    : 'クリア！ ゴールまで はこべたね！';
}

const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

/**
 * ゴールまでの 最短ルート（すべての ほしを とおる）を BFS で探す。
 * 見つからなければ null。おてほん表示・レベル検証に使う。
 */
export function solve(level: Level): Dir[] | null {
  const gems = level.gems ?? [];
  const gemIndex = new Map(gems.map((g, i) => [posKey(g), i]));
  const allMask = (1 << gems.length) - 1;

  function maskAt(p: Pos, mask: number): number {
    const idx = gemIndex.get(posKey(p));
    return idx === undefined ? mask : mask | (1 << idx);
  }

  const startMask = maskAt(level.start, 0);
  const startState = `${posKey(level.start)}|${startMask}`;
  const queue: { pos: Pos; mask: number; path: Dir[] }[] = [
    { pos: level.start, mask: startMask, path: [] },
  ];
  const seen = new Set<string>([startState]);

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (samePos(node.pos, level.goal) && node.mask === allMask) {
      return node.path;
    }
    for (const d of DIRS) {
      const next: Pos = { r: node.pos.r + DELTA[d].r, c: node.pos.c + DELTA[d].c };
      if (!inBounds(level, next) || isWall(level, next)) continue;
      const mask = maskAt(next, node.mask);
      const key = `${posKey(next)}|${mask}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ pos: next, mask, path: [...node.path, d] });
    }
  }
  return null;
}
