import { motion } from 'framer-motion';
import { PLAYER_STYLES, type Player } from './types';

interface Props {
  players: Player[];
  currentIdx: number;
}

const LANDMARKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * 横一直線の数直線バー（0→100）。蛇行盤とは別に「数が大きい＝右に遠い／バーが長い」を
 * はっきり見せ、線形のメンタルナンバーラインを直接育てる（提案A）。
 * docs/sugoroku-number-learning-design.md 参照。
 */
export function NumberLineBar({ players, currentIdx }: Props) {
  const pct = (n: number) => `${n}%`;
  const current = players[currentIdx];
  const curStyle = PLAYER_STYLES[currentIdx % PLAYER_STYLES.length];

  return (
    <div className="px-3 pt-1 pb-1 bg-white/60">
      <div className="relative h-9">
        {/* プレイヤーのコマ（直線上の位置＝大小） */}
        {players.map((p, i) => (
          <motion.div
            key={i}
            className="absolute -translate-x-1/2"
            style={{ top: i === currentIdx ? -2 : 2, zIndex: i === currentIdx ? 3 : 1 }}
            initial={false}
            animate={{ left: pct(p.position) }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <span className={`block leading-none drop-shadow ${i === currentIdx ? 'text-lg' : 'text-xs opacity-60'}`}>
              {p.character}
            </span>
          </motion.div>
        ))}

        {/* 現在地の数字フキダシ */}
        {current && (
          <motion.div
            className="absolute -translate-x-1/2 z-10 pointer-events-none"
            style={{ bottom: -2 }}
            initial={false}
            animate={{ left: pct(current.position) }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <span className={`inline-block rounded-md px-1.5 text-xs font-black text-white ${curStyle.bg}`}>
              {current.position}
            </span>
          </motion.div>
        )}
      </div>

      {/* 進みバー（数が大きいほど長い＝量の手がかり） */}
      <div className="relative h-2.5 rounded-full bg-gray-200 overflow-hidden">
        {players.map((p, i) => (
          <motion.div
            key={i}
            className={`absolute left-0 top-0 h-full rounded-full ${PLAYER_STYLES[i % PLAYER_STYLES.length].bg} ${i === currentIdx ? 'opacity-90' : 'opacity-25'}`}
            initial={false}
            animate={{ width: pct(p.position) }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={{ zIndex: i === currentIdx ? 2 : 1 }}
          />
        ))}
      </div>

      {/* キリ番の目盛り（ベンチマーク） */}
      <div className="relative h-3 mt-0.5">
        {LANDMARKS.map(n => (
          <div key={n} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pct(n) }}>
            <span className="w-px h-1 bg-gray-300" />
            <span className="text-[8px] leading-none text-gray-400 font-bold">{n === 100 ? '🏁' : n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
