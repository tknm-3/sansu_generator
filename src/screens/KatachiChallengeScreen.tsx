import { motion } from 'framer-motion';
import { getUnitsByCategory } from '../data/units';
import { loadJson } from '../lib/storage';
import { EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCompletedTodayCount(unitIds: string[]): number {
  const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
  const today = todayStr();
  const done = new Set<string>();
  for (const e of stamps.history) {
    const d = new Date(e.at).toISOString().slice(0, 10);
    if (d === today && unitIds.includes(e.unitId)) {
      done.add(e.unitId);
    }
  }
  return done.size;
}

interface Props {
  onSelectUnit: (unitId: string, hard: boolean) => void;
  onExit: () => void;
}

export function KatachiChallengeScreen({ onSelectUnit, onExit }: Props) {
  const units = getUnitsByCategory('katachi');
  const unitIds = units.map((u) => u.id);
  const completedToday = getCompletedTodayCount(unitIds);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-orange-100 to-amber-50 p-6 overflow-y-auto">
      <div className="self-stretch flex items-center">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white/60 px-3 py-2 text-orange-700 font-bold text-sm"
        >
          ← もどる
        </button>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-orange-900 text-center"
      >
        ⚔️ かたちチャレンジ！
      </motion.h1>

      <div className="rounded-2xl bg-orange-200 px-6 py-3 text-center">
        <p className="text-base font-bold text-orange-900">きょう クリアした かず</p>
        <p className="text-4xl font-bold text-orange-700">{completedToday} <span className="text-xl">こ</span></p>
      </div>

      <p className="text-orange-700 font-bold">🔥 むずかしい もんだいに チャレンジ！</p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {units.map((unit, index) => (
          <motion.button
            key={unit.id}
            type="button"
            onClick={() => onSelectUnit(unit.id, true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-2xl bg-white border-2 border-orange-200 p-4 flex items-center gap-4 shadow-md text-left"
          >
            <span className="text-4xl">{unit.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-orange-900">{unit.title}</p>
              <p className="text-xs text-orange-500">{unit.grade}</p>
            </div>
            <span className="text-2xl">🔥</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
