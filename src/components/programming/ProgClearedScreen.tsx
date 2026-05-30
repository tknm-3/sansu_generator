import { motion } from 'framer-motion';
import { DIFFICULTY_LABEL, type Difficulty } from '../../lib/programming/progress';

interface Props {
  difficulty: Difficulty;
  perfectCount: number;
  /** この単元プレイで つぎの難易度が あらたに ひらいたか */
  unlockedNext: boolean;
  nextDifficulty?: Difficulty;
  onExit: () => void;
  onAgain: () => void;
}

export function ProgClearedScreen({
  difficulty,
  perfectCount,
  unlockedNext,
  nextDifficulty,
  onExit,
  onAgain,
}: Props) {
  const isSuperhard = difficulty === 'superhard';
  return (
    <div className={`flex min-h-screen flex-col items-center justify-center gap-5 p-8 ${isSuperhard ? 'bg-gradient-to-b from-yellow-200 to-amber-50' : 'bg-gradient-to-b from-orange-200 to-amber-50'}`}>
      {isSuperhard ? (
        <>
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: [0, 1.3, 1], rotate: ['-15deg', '10deg', '0deg'] }}
            className="text-8xl"
          >
            🎁
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl"
          >
            💎✨
          </motion.div>
        </>
      ) : (
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">
          🎉
        </motion.div>
      )}
      <p className="text-2xl font-bold text-orange-700">
        {isSuperhard ? '🎁 たからばこ ゲット！' : 'クリア！ スタンプ ゲット！'}
      </p>
      <p className="text-base font-bold text-amber-700">{DIFFICULTY_LABEL[difficulty]} をクリアしたよ</p>
      {perfectCount > 0 && (
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="rounded-full bg-yellow-300 px-4 py-1 text-lg font-bold text-amber-900"
        >
          🏆 ぴったり賞 ×{perfectCount}
        </motion.p>
      )}
      {unlockedNext && nextDifficulty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white px-5 py-3 text-center shadow-md"
        >
          <p className="text-lg font-bold text-orange-600">
            🔓 「{DIFFICULTY_LABEL[nextDifficulty]}」が あそべるように なったよ！
          </p>
        </motion.div>
      )}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-2xl bg-orange-400 px-6 py-4 text-xl font-bold text-white shadow-[0_5px_0_#c2410c] active:translate-y-1"
        >
          🔁 もういちど
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl bg-amber-500 px-6 py-4 text-xl font-bold text-white shadow-[0_5px_0_#b45309] active:translate-y-1"
        >
          ホームへ
        </button>
      </div>
    </div>
  );
}
