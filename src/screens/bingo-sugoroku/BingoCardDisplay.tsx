import { motion } from 'framer-motion';
import type { Player } from './types';
import { PLAYER_STYLES } from './types';
import { getReachNumbers } from './logic';

export function BingoCardDisplay({
  player,
  styleIdx,
  isCurrent,
  flashSquares,
}: {
  player: Player;
  styleIdx: number;
  isCurrent: boolean;
  flashSquares: Set<number>;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const reach = getReachNumbers(player);
  const bingoCount = player.doneLines.length;

  return (
    <div className={`
      rounded-xl p-1.5 border-2 transition-all
      ${isCurrent ? `${s.border} shadow-md` : 'border-gray-200'}
      ${reach.length > 0 ? 'ring-2 ring-yellow-400' : ''}
      ${s.light}
    `}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <span className={`w-2.5 h-2.5 rounded-full ${s.bg} flex-shrink-0`} />
          <span className="font-bold text-xs text-gray-800 truncate">{player.name}</span>
          {isCurrent && <span className="text-xs bg-yellow-300 text-yellow-800 rounded px-0.5 flex-shrink-0">▶</span>}
        </div>
        <div className="flex items-center gap-1">
          {bingoCount > 0 && <span className="text-xs font-bold text-purple-600">🎉×{bingoCount}</span>}
          <span className={`text-xs font-bold ${s.text}`}>{player.position}マス</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px">
        {player.numbers.map((n, i) => {
          const isChecked  = player.checked[i];
          const isFlash    = flashSquares.has(i);
          const isCenter   = i === 4;
          return (
            <motion.div
              key={i}
              animate={isFlash ? { scale: [1, 1.6, 1] } : {}}
              transition={{ duration: 0.45 }}
              className={`
                aspect-square flex items-center justify-center text-xs font-extrabold rounded
                ${isCenter && isChecked ? 'bg-yellow-400 text-yellow-900'
                  : isChecked           ? `${s.bg} text-white`
                  :                       'bg-white text-gray-800 border border-gray-200'}
                ${isFlash ? 'ring-2 ring-yellow-400' : ''}
              `}
            >
              {isCenter ? '★' : n}
            </motion.div>
          );
        })}
      </div>

      {reach.length > 0 && (
        <div className="mt-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded px-1 py-0.5 text-center">
          🎯 {reach.slice(0, 3).join(' か ')} でビンゴ！
        </div>
      )}
    </div>
  );
}
