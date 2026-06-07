import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from './types';
import { PLAYER_STYLES } from './types';

// ── ゴール演出 ──────────────────────────────────────────────────────────────

export function GoalOverlay({ show }: { show: { name: string; character: string } | null }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400/95 to-orange-500/95 z-50">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 180 }}
            className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1,1.3,1], rotate: [0,20,-20,0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-8xl"
            >
              {show.character}
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-6xl font-bold text-white drop-shadow-lg">
              ゴール！
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-yellow-100">
              {show.name} の かち！
            </motion.div>
            <div className="flex gap-2 text-4xl mt-2">
              {['🎉','🌟','🎊','✨','🎉'].map((e, i) => (
                <motion.span key={i} animate={{ y: [0,-12,0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}>
                  {e}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── ボーナスマス イントロ ──────────────────────────────────────────────────

export function BonusIntroOverlay({
  show, players, bonusPlayerIdx,
}: {
  show: boolean;
  players: Player[];
  bonusPlayerIdx: number | null;
}) {
  const s = bonusPlayerIdx !== null ? PLAYER_STYLES[bonusPlayerIdx % PLAYER_STYLES.length] : null;
  return (
    <AnimatePresence>
      {show && bonusPlayerIdx !== null && s && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-black/60 z-50">
          <motion.div initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.3 }}
            transition={{ type: 'spring', stiffness: 250 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 text-center shadow-2xl">
            <motion.div animate={{ scale: [1,1.2,1], rotate: [0,10,-10,0] }} transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-7xl mb-3">⭐</motion.div>
            <div className="text-4xl font-bold text-white mb-2 drop-shadow">ボーナスマス！</div>
            <div className="text-xl font-bold text-yellow-100 mb-1">{players[bonusPlayerIdx]?.name} の チャンス！</div>
            <div className="text-lg text-white/90 font-bold">クイズに せいかいで ビンゴマスGET！</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── ビンゴ演出 ──────────────────────────────────────────────────────────────

export function BingoOverlay({ show }: { show: { name: string; steps: number } | null }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50">
          <motion.div initial={{ scale: 0.3, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.3 }}
            transition={{ type: 'spring', stiffness: 250 }}
            className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-7xl mb-3">🎉</div>
            <div className="text-4xl font-bold text-rose-600 mb-2">ビンゴ！</div>
            <div className="text-xl font-bold text-gray-700 mb-1">{show.name}</div>
            <div className="text-lg text-emerald-600 font-bold">＋{show.steps}マス ボーナス！</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
