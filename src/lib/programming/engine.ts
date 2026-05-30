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

/** ゾンビ（障害物）の定義 */
export type ZombieDef =
  | { kind: 'fixed';   pos: Pos }
  | { kind: 'patrol';  pos: Pos; path: Pos[] }
  | { kind: 'chase';   pos: Pos };

export interface Level {
  id: string;
  rows: number;
  cols: number;
  start: Pos;
  goal: Pos;
  /** すすめないマス（かべ） */
  walls: Pos[];
  /** 通らなければいけない とちゅうの アイテム。なくてもよい */
  gems?: Pos[];
  /** gems の 絵文字。なければ ⭐ */
  gemEmoji?: string;
  /** 最短手数（ぴったり賞の判定に使う） */
  optimal: number;
  /** ループ箱を使えるレベルか */
  allowLoop?: boolean;
  /** ループ箱「だけ」で とくレベルか（ふつうの 1マス矢印を つかわせない）。allowLoop 前提 */
  loopOnly?: boolean;
  /** 命令スロットの最大数（矢印ならべ単元のトレイ上限） */
  maxSlots?: number;
  /** デバッグ単元で最初から入っている（まちがいを含む）プログラム */
  buggy?: Dir[];
  /** デバッグ単元で変更できる矢印の最大数 */
  maxChanges?: number;
  /** 正解の一例（デバッグ単元の検証・おてほん表示に使う） */
  solution?: Dir[];
  /** ゴールの絵文字（さかな・ほし など）。なければさかな */
  goalEmoji?: string;
  /** この問題のひとことガイド */
  prompt?: string;
  /** ゾンビ（障害物）リスト */
  zombies?: ZombieDef[];
  /** 相対方向（ゆきのゾーン）の スタート時の むき。なければ 'up' あつかい */
  startFacing?: Dir;
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
  /** ゾンビに あたった ステップ番号（-1なら あたらなかった） */
  hitZombieStep: number;
  /** 各ステップでの ゾンビの いち（zombies[i][step]） */
  zombiePaths: Pos[][];
  /** そうたい方向単元で、path と そろえた 各ステップでの むき（スプライト描画用） */
  facings?: Dir[];
}

function zombieNextPos(def: ZombieDef, step: number, charPos: Pos): Pos {
  if (def.kind === 'fixed') return def.pos;
  if (def.kind === 'patrol') {
    const pts = [def.pos, ...def.path];
    const cycle = (pts.length - 1) * 2;
    const t = step % cycle;
    return t < pts.length ? pts[t] : pts[cycle - t];
  }
  // chase: マンハッタン距離が縮まる方向へ 1マス
  const diffs: { d: Pos; dist: number }[] = [
    { d: { r: -1, c: 0 }, dist: 0 },
    { d: { r: 1, c: 0 }, dist: 0 },
    { d: { r: 0, c: -1 }, dist: 0 },
    { d: { r: 0, c: 1 }, dist: 0 },
  ].map(({ d }) => {
    const np: Pos = { r: def.pos.r + d.r, c: def.pos.c + d.c };
    return { d, dist: Math.abs(np.r - charPos.r) + Math.abs(np.c - charPos.c) };
  });
  diffs.sort((a, b) => a.dist - b.dist);
  const best = diffs[0].d;
  return { r: def.pos.r + best.r, c: def.pos.c + best.c };
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

  const zombieDefs = level.zombies ?? [];
  // ステップ0 の ゾンビ初期いち
  const zombiePositions: Pos[] = zombieDefs.map((z) => z.pos);
  const zombiePaths: Pos[][] = zombieDefs.map((z) => [z.pos]);
  let hitZombieStep = -1;

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

    // ゾンビを動かす（chaseは移動前のキャラ位置に向かう）
    for (let z = 0; z < zombieDefs.length; z++) {
      const def = zombieDefs[z];
      let newPos: Pos;
      if (def.kind === 'chase') {
        // chaseは今のキャラ位置を追う（1ステップ1マス）
        const zp = zombiePositions[z];
        const dx = cur.c - zp.c;
        const dy = cur.r - zp.r;
        if (Math.abs(dx) >= Math.abs(dy)) {
          newPos = { r: zp.r, c: zp.c + Math.sign(dx) };
        } else {
          newPos = { r: zp.r + Math.sign(dy), c: zp.c };
        }
      } else {
        newPos = zombieNextPos(def, i + 1, cur);
      }
      zombiePositions[z] = newPos;
      zombiePaths[z].push(newPos);
    }

    // ゾンビ衝突チェック
    if (hitZombieStep === -1) {
      for (const zp of zombiePositions) {
        if (samePos(cur, zp)) {
          hitZombieStep = i;
          break;
        }
      }
    }
    if (hitZombieStep !== -1) break;
  }

  const missedGems = gemKeys.size - collected.size;
  return {
    path,
    blockedStep,
    blockedCell,
    reachedGoal: samePos(cur, level.goal) && blockedStep === -1 && hitZombieStep === -1,
    collectedAll: missedGems === 0,
    missedGems,
    steps: dirs.length,
    finalPos: cur,
    hitZombieStep,
    zombiePaths,
  };
}

/** クリア（ゴール到達・ほし全取得・ゾンビ未衝突）したか */
export function isCleared(result: RunResult): boolean {
  return result.reachedGoal && result.collectedAll && result.hitZombieStep === -1;
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
  // 0) ゾンビに あたった
  if (result.hitZombieStep >= 0) {
    const stepNo = result.hitZombieStep + 1;
    if (attempt <= 1) {
      return `${stepNo}ばんめで ゾンビに あたっちゃった！\nゾンビの うごきを よく みてみよう。`;
    }
    return `${stepNo}ばんめで ゾンビと ぶつかるよ。\nゾンビを さけながら すすむ みちを かんがえてみよう！`;
  }

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
 * 見つからなければ null。追跡ゾンビがいるレベルは null を返す。
 */
export function solve(level: Level): Dir[] | null {
  // chase ゾンビは BFS が複雑すぎるので スキップ
  if ((level.zombies ?? []).some((z) => z.kind === 'chase')) return null;

  const gems = level.gems ?? [];
  const gemIndex = new Map(gems.map((g, i) => [posKey(g), i]));
  const allMask = (1 << gems.length) - 1;
  const zombies = level.zombies ?? [];

  function maskAt(p: Pos, mask: number): number {
    const idx = gemIndex.get(posKey(p));
    return idx === undefined ? mask : mask | (1 << idx);
  }

  function zombieKey(step: number): string {
    return zombies.map((z) => posKey(zombieNextPos(z, step, { r: -99, c: -99 }))).join(';');
  }

  function isZombieAt(pos: Pos, step: number): boolean {
    return zombies.some((z) => samePos(zombieNextPos(z, step, pos), pos));
  }

  const startMask = maskAt(level.start, 0);
  const startState = `${posKey(level.start)}|${startMask}|0`;
  const queue: { pos: Pos; mask: number; step: number; path: Dir[] }[] = [
    { pos: level.start, mask: startMask, step: 0, path: [] },
  ];
  const seen = new Set<string>([startState]);

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (samePos(node.pos, level.goal) && node.mask === allMask) {
      return node.path;
    }
    // 無限ループ防止
    if (node.step > level.rows * level.cols * 4) continue;
    for (const d of DIRS) {
      const next: Pos = { r: node.pos.r + DELTA[d].r, c: node.pos.c + DELTA[d].c };
      if (!inBounds(level, next) || isWall(level, next)) continue;
      const nextStep = node.step + 1;
      // ゾンビ衝突チェック
      if (isZombieAt(next, nextStep)) continue;
      const mask = maskAt(next, node.mask);
      const zk = zombies.length > 0 ? `|${zombieKey(nextStep)}` : '';
      const key = `${posKey(next)}|${mask}|${nextStep % 20}${zk}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ pos: next, mask, step: nextStep, path: [...node.path, d] });
    }
  }
  return null;
}
