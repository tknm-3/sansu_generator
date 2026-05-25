import { motion } from 'framer-motion';
import { getUnitsByCategory } from '../data/units';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
  onOpenCollection: () => void;
  onOpenStampBook?: () => void;
  onOpenProgress: () => void;
  onBack: () => void;
}

const UNIT_EMOJIS: Record<string, string> = {
  'shape-rotation': '🔄',
  'shape-compose':  '🧩',
  'shape-viewpoint': '🏗️',
};

const KATACHI_UNITS = getUnitsByCategory('katachi');

export function KatachiHomeScreen({
  characterName,
  stampTotal,
  onSelectUnit,
  onOpenCollection,
  onOpenStampBook,
  onOpenProgress,
  onBack,
}: Props) {
  return (
    <div className="flex h-screen flex-col items-center gap-6 bg-gradient-to-b from-emerald-200 to-teal-50 p-6 overflow-y-auto">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="rounded-xl bg-white/60 px-3 py-2 text-teal-700 font-bold text-sm">
            ← もどる
          </button>
          <button type="button" onClick={onOpenCollection} className="flex items-center gap-2">
            <span className="text-2xl">🐧</span>
            <span className="font-bold text-teal-900">{characterName}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenProgress}
            className="rounded-2xl bg-teal-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#00695c] active:translate-y-0.5"
          >
            📅 カレンダー
          </button>
          <motion.button
            type="button"
            onClick={onOpenStampBook}
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-full bg-emerald-100 px-4 py-1 font-bold text-teal-900 shadow-sm"
          >
            ⭐ スタンプ {stampTotal}
          </motion.button>
        </div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-teal-900"
      >
        🔷 かたちあそび
      </motion.h1>

      <p className="text-teal-700 font-bold">がくしゅう</p>
      <div className="flex flex-wrap justify-center gap-4">
        {KATACHI_UNITS.map((u, index) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-40 rounded-2xl border-2 border-teal-200 bg-white p-4 text-center shadow-md"
          >
            <div className="text-4xl">{UNIT_EMOJIS[u.id] ?? '🔷'}</div>
            <div className="mt-1 text-base font-bold text-teal-900">{u.title}</div>
            <div className="mt-0.5 text-xs text-teal-500">{u.grade}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
