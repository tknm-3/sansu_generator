import { motion } from 'framer-motion';
import { getUnitsByCategory } from '../data/units';
import { CHARACTER_DEFS } from '../features/character/characterDefs';

interface Props {
  characterName: string;
  characterId: string;
  onSelectUnit: (unitId: string) => void;
  onBack: () => void;
}

// 単元ごとの 大きな絵文字（ホームの ボタン用）
const UNIT_EMOJIS: Record<string, string> = {
  'count-animals': '🐰',
  'dice-walk': '🎲',
  'pair-place': '🍪',
  'match-same': '🔷',
};

export function BabyHomeScreen({ characterName, characterId, onSelectUnit, onBack }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const units = getUnitsByCategory('baby');

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-pink-200 via-rose-100 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onBack} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-rose-700">
          ← もどる
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{charEmoji}</span>
          <span className="font-bold text-rose-900">{characterName}</span>
        </div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-rose-800"
      >
        🧸 ちいさいこ
      </motion.h1>
      <p className="text-rose-600 font-bold">なにして あそぶ？</p>

      <div className="grid w-full max-w-md grid-cols-2 gap-5">
        {units.map((u, i) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 220 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 rounded-3xl border-4 border-white bg-white/80 p-6 shadow-[0_5px_0_#fda4af]"
          >
            <span className="text-6xl">{UNIT_EMOJIS[u.id] ?? '🧸'}</span>
            <span className="text-lg font-bold text-rose-800">{u.title}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
