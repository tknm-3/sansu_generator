import { motion } from 'framer-motion';
import { samePos, type Level, type Pos } from '../../lib/programming/engine';

/** ゾーンの せかいかんに あわせた 盤面の みため */
export interface GridTheme {
  /** かべの 絵文字（なければ レンガ） */
  wall?: string;
  /** ふつうマスの 色クラス */
  tile?: string;
  /** かべマスの 色クラス */
  wallTile?: string;
  /** 盤面背景の 色クラス */
  board?: string;
}

interface Props {
  level: Level;
  /** うごく キャラの 絵文字 */
  charEmoji: string;
  /** いまの キャラの いち（アニメで うごく） */
  charPos: Pos;
  /** とおった あしあと（うすく のこす） */
  trail?: Pos[];
  /** すでに とった ほしの いち */
  collected?: Pos[];
  /** かべに ぶつかった セルを ひからせる */
  blockedCell?: Pos | null;
  /** セルを タップしたとき（自分で作る単元の へんしゅう用） */
  onCellClick?: (pos: Pos) => void;
  /** ゾンビの いち（アニメで うごく） */
  zombiePositions?: Pos[];
  /** ゾーンごとの みため（なければ デフォルト） */
  theme?: GridTheme;
}

function keyOf(p: Pos): string {
  return `${p.r},${p.c}`;
}

export function ProgrammingGrid({
  level,
  charEmoji,
  charPos,
  trail = [],
  collected = [],
  blockedCell = null,
  onCellClick,
  zombiePositions = [],
  theme,
}: Props) {
  // モバイル幅に おさまるように セルサイズを きめる
  const cell = Math.min(Math.floor(300 / level.cols), Math.floor(300 / level.rows), 84);
  const gap = 4;
  const trailKeys = new Set(trail.map(keyOf));
  const collectedKeys = new Set(collected.map(keyOf));
  const gemEmoji = level.gemEmoji ?? '⭐';
  const wallEmoji = theme?.wall ?? '🧱';
  const tileClass = theme?.tile ?? 'bg-lime-100';
  const wallClass = theme?.wallTile ?? 'bg-stone-500';
  const boardClass = theme?.board ?? 'bg-lime-200/70';

  return (
    <div
      className={`relative rounded-2xl ${boardClass} p-2 shadow-inner`}
      style={{ width: level.cols * (cell + gap) + gap, height: level.rows * (cell + gap) + gap }}
    >
      {Array.from({ length: level.rows }).map((_, row) =>
        Array.from({ length: level.cols }).map((__, col) => {
          const pos = { r: row, c: col };
          const isWall = level.walls.some((w) => samePos(w, pos));
          const isGoal = samePos(level.goal, pos);
          const isStart = samePos(level.start, pos);
          const isGem = (level.gems ?? []).some((g) => samePos(g, pos));
          const gemTaken = collectedKeys.has(keyOf(pos));
          const isTrail = trailKeys.has(keyOf(pos));
          const isBlocked = blockedCell != null && samePos(blockedCell, pos);
          return (
            <button
              type="button"
              key={`${row}-${col}`}
              disabled={!onCellClick}
              onClick={onCellClick ? () => onCellClick(pos) : undefined}
              className={`absolute flex items-center justify-center rounded-lg transition-colors ${
                isWall ? wallClass : tileClass
              } ${isBlocked ? 'ring-4 ring-red-400' : ''} ${onCellClick ? 'cursor-pointer' : ''}`}
              style={{
                width: cell,
                height: cell,
                left: gap + col * (cell + gap),
                top: gap + row * (cell + gap),
                fontSize: cell * 0.5,
              }}
            >
              {isWall && wallEmoji}
              {!isWall && isGoal && (level.goalEmoji ?? '🐟')}
              {!isWall && !isGoal && isGem && !gemTaken && gemEmoji}
              {!isWall && !isGoal && !isGem && isStart && (
                <span className="text-xs font-bold text-lime-600">スタート</span>
              )}
              {!isWall && !isGoal && !isGem && !isStart && isTrail && (
                <span className="text-lime-400" style={{ fontSize: cell * 0.3 }}>•</span>
              )}
            </button>
          );
        }),
      )}

      {/* ゾンビ */}
      {zombiePositions.map((zp, i) => (
        <motion.div
          key={`zombie-${i}`}
          className="pointer-events-none absolute flex items-center justify-center"
          style={{ width: cell, height: cell, fontSize: cell * 0.55 }}
          initial={false}
          animate={{
            left: gap + zp.c * (cell + gap),
            top: gap + zp.r * (cell + gap),
          }}
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
        >
          🧟
        </motion.div>
      ))}

      {/* うごく キャラ */}
      <motion.div
        className="pointer-events-none absolute flex items-center justify-center"
        style={{ width: cell, height: cell, fontSize: cell * 0.6 }}
        initial={false}
        animate={{
          left: gap + charPos.c * (cell + gap),
          top: gap + charPos.r * (cell + gap),
        }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
      >
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          {charEmoji}
        </motion.span>
      </motion.div>
    </div>
  );
}
