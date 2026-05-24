import { motion } from 'framer-motion';
import { UNITS } from '../data/units';
import { hasMissionToday } from './MissionScreen';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
  onStartChallenge: () => void;
  onStartMission: () => void;
  onStartMaker: () => void;
  onOpenCollection: () => void;
  onOpenStampBook?: () => void;
  onOpenProgress: () => void;
}

const UNIT_EMOJIS: Record<string, string> = {
  'make-ten': '🔟',
  'addition': '➕',
  'subtraction': '➖',
  'cherry-calc': '🍒',
  'big-addition': '🔢',
  'big-subtraction': '🔣',
  'multiplication': '✖️',
  'division': '➗',
};

export function HomeScreen({
  characterName,
  stampTotal,
  onSelectUnit,
  onStartChallenge,
  onStartMission,
  onStartMaker,
  onOpenCollection,
  onOpenStampBook,
  onOpenProgress,
}: Props) {
  const missionDone = hasMissionToday();

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6 overflow-y-auto">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onOpenCollection} className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-amber-900">{characterName}</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onOpenProgress}
            className="rounded-2xl bg-amber-400 px-6 py-3 text-lg font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1">
            📅 がんばりカレンダー
          </button>
          <motion.button
            type="button"
            onClick={onOpenStampBook}
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-full bg-yellow-200 px-4 py-1 font-bold text-amber-900 shadow-sm"
          >
            ⭐ スタンプ {stampTotal}
          </motion.button>
        </div>
      </div>

      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-amber-900">
        さんすうあそび
      </motion.h1>

      <motion.button
        type="button"
        onClick={onStartMission}
        disabled={missionDone}
        whileTap={missionDone ? undefined : { scale: 0.96 }}
        whileHover={missionDone ? undefined : { scale: 1.03 }}
        className={`w-full max-w-sm rounded-2xl p-4 text-center shadow-lg font-bold transition-all ${
          missionDone
            ? 'bg-gray-200 text-gray-500 cursor-default'
            : 'bg-yellow-400 text-yellow-900 shadow-[0_4px_0_#f9a825]'
        }`}
      >
        <div className="text-2xl">🌟</div>
        <div className="text-lg">{missionDone ? 'きょうの ミッション クリア済み！' : 'きょうの ミッション をやろう！'}</div>
      </motion.button>

      <div className="flex gap-4 w-full max-w-sm">
        <motion.button
          type="button"
          onClick={onStartChallenge}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className="flex-1 rounded-2xl bg-purple-500 p-4 text-center text-white font-bold shadow-[0_4px_0_#6a1b9a]"
        >
          <div className="text-2xl">⚔️</div>
          <div>チャレンジ</div>
        </motion.button>
        <motion.button
          type="button"
          onClick={onStartMaker}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className="flex-1 rounded-2xl bg-green-500 p-4 text-center text-white font-bold shadow-[0_4px_0_#2e7d32]"
        >
          <div className="text-2xl">✏️</div>
          <div>もんだいづくり</div>
        </motion.button>
      </div>

      <p className="text-amber-700 font-bold">がくしゅう</p>
      <div className="flex flex-wrap justify-center gap-4">
        {UNITS.map((u, index) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-40 rounded-2xl border-2 border-blue-200 bg-white p-4 text-center shadow-md"
          >
            <div className="text-4xl">{UNIT_EMOJIS[u.id] ?? '📚'}</div>
            <div className="mt-1 text-base font-bold text-amber-900">{u.title}</div>
            <div className="mt-0.5 text-xs text-amber-500">{u.grade}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
