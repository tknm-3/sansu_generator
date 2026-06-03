/**
 * 相対方向（むき）単元の エンジン。雪のゾーンで つかう。
 *
 * これまでの 矢印（↑↓←→）は 画面を みる じぶん基準の「ぜったい方向」。
 * このエンジンは キャラクターが むいている むき を 基準にした「そうたい方向」を つかう。
 *   - FORWARD     … いま むいている むきへ 1マス すすむ
 *   - TURN_RIGHT  … その場で 時計まわりに 90°（うごかない）
 *   - TURN_LEFT   … その場で 反時計まわりに 90°（うごかない）
 *
 * 回転規則（時計まわり = TURN_RIGHT）: up → right → down → left → up
 *
 * engine.ts には てを いれず、ここに 独立した インタプリタと BFS ソルバーを もつ。
 * Level / Pos / Dir / RunResult などの 型は engine.ts と 共有する。
 */
import { samePos, type Dir, type Level, type Pos, type RunResult } from './engine';

/** 相対方向の 命令 */
export type RelDir = 'forward' | 'turn_right' | 'turn_left';

/** ループ命令（N回 くりかえす） */
export type RelLoop = { kind: 'loop'; times: number; body: RelDir[] };

/** そうたい方向の 命令（1ステップ または ループ）*/
export type RelCommand = RelDir | RelLoop;

/** ループを ふくむ 命令列を フラットな RelDir[] に ひらく */
export function flattenRel(cmds: RelCommand[]): RelDir[] {
  const out: RelDir[] = [];
  for (const c of cmds) {
    if (typeof c === 'string') out.push(c);
    else for (let i = 0; i < c.times; i++) out.push(...c.body);
  }
  return out;
}

export const REL_LABEL: Record<RelDir, string> = {
  forward: 'まえへ',
  turn_right: 'みぎをむく',
  turn_left: 'ひだりをむく',
};

/** こども向けの アイコン（まわるカーブ矢印・まえへの矢印）*/
export const REL_ICON: Record<RelDir, string> = {
  forward: '⬆️',
  turn_right: '↪️',
  turn_left: '↩️',
};

const DELTA: Record<Dir, Pos> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

/** 時計まわりの ならび。turn_right で +1、turn_left で -1 */
const CW: Dir[] = ['up', 'right', 'down', 'left'];

export function turnRight(d: Dir): Dir {
  return CW[(CW.indexOf(d) + 1) % 4];
}
export function turnLeft(d: Dir): Dir {
  return CW[(CW.indexOf(d) + 3) % 4];
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

/**
 * 相対方向プログラムを 実行して 軌跡と けっかを かえす。
 * path は 各命令のあとの いち（むきだけ かわる ときも 同じ いちを つむ）。
 * facings は path と そろえた「そのときの むき」（スプライト描画用）。
 * steps は 実行した 命令の かず（まわる も 1手と かぞえる）。
 */
export function runRelative(level: Level, cmds: RelCommand[]): RunResult & { facings: Dir[] } {
  const startFacing: Dir = level.startFacing ?? 'up';
  const path: Pos[] = [level.start];
  const facings: Dir[] = [startFacing];
  let cur = level.start;
  let facing = startFacing;
  let blocked = false;
  let blockedCell: Pos | null = null;
  let steps = 0;

  const gemKeys = new Set((level.gems ?? []).map(posKey));
  const collected = new Set<string>();
  if (gemKeys.has(posKey(cur))) collected.add(posKey(cur));

  for (const cmd of flattenRel(cmds)) {
    if (cmd === 'turn_right') {
      facing = turnRight(facing);
    } else if (cmd === 'turn_left') {
      facing = turnLeft(facing);
    } else {
      const next: Pos = { r: cur.r + DELTA[facing].r, c: cur.c + DELTA[facing].c };
      if (!inBounds(level, next) || isWall(level, next)) {
        blocked = true;
        blockedCell = inBounds(level, next) ? next : null;
        steps += 1;
        // とまった むき／いちも つんでおく（描画のため）
        path.push(cur);
        facings.push(facing);
        break;
      }
      cur = next;
      if (gemKeys.has(posKey(cur))) collected.add(posKey(cur));
    }
    steps += 1;
    path.push(cur);
    facings.push(facing);
  }

  const missedGems = gemKeys.size - collected.size;
  return {
    path,
    facings,
    blockedStep: blocked ? steps : -1,
    blockedCell,
    reachedGoal: samePos(cur, level.goal) && !blocked,
    collectedAll: missedGems === 0,
    missedGems,
    steps,
    finalPos: cur,
    hitZombieStep: -1,
    zombiePaths: [],
  };
}

/**
 * 相対方向の 最短プログラム（すべての ほしを とおって ゴール）を BFS で さがす。
 * 状態は {pos, facing, あつめた ほしの mask}。見つからなければ null。
 */
export function solveRelative(level: Level): RelDir[] | null {
  const startFacing: Dir = level.startFacing ?? 'up';
  const gems = level.gems ?? [];
  const gemIndex = new Map(gems.map((g, i) => [posKey(g), i]));
  const allMask = (1 << gems.length) - 1;

  function maskAt(p: Pos, mask: number): number {
    const idx = gemIndex.get(posKey(p));
    return idx === undefined ? mask : mask | (1 << idx);
  }

  const startMask = maskAt(level.start, 0);
  const startKey = `${posKey(level.start)}|${startFacing}|${startMask}`;
  const queue: { pos: Pos; facing: Dir; mask: number; path: RelDir[] }[] = [
    { pos: level.start, facing: startFacing, mask: startMask, path: [] },
  ];
  const seen = new Set<string>([startKey]);

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (samePos(node.pos, level.goal) && node.mask === allMask) {
      return node.path;
    }
    const moves: RelDir[] = ['forward', 'turn_right', 'turn_left'];
    for (const m of moves) {
      let pos = node.pos;
      let facing = node.facing;
      let mask = node.mask;
      if (m === 'turn_right') facing = turnRight(facing);
      else if (m === 'turn_left') facing = turnLeft(facing);
      else {
        const next: Pos = { r: pos.r + DELTA[facing].r, c: pos.c + DELTA[facing].c };
        if (!inBounds(level, next) || isWall(level, next)) continue;
        pos = next;
        mask = maskAt(pos, mask);
      }
      const key = `${posKey(pos)}|${facing}|${mask}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ pos, facing, mask, path: [...node.path, m] });
    }
  }
  return null;
}
