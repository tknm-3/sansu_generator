import { motion } from 'framer-motion';
import { UNITS } from '../data/units';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
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

export function HomeScreen({ characterName, stampTotal, onSelectUnit }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
      <div className="flex w-full items-center justify-between">
        <div className="text-lg font-bold text-amber-900">あいぼう: {characterName}</div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.9, 1.05, 1] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-full bg-yellow-200 px-4 py-1 font-bold text-amber-900 shadow-sm"
        >
          ⭐ スタンプ {stampTotal}
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-amber-900 drop-shadow-sm"
      >
        さんすうあそび
      </motion.h1>
      <p className="text-amber-700">きょうの がくしゅう を えらんでね</p>

      <div className="flex flex-wrap justify-center gap-5">
        {UNITS.map((u, index) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-52 rounded-2xl border-2 border-blue-200 bg-white p-6 text-center shadow-lg"
          >
            <div className="text-5xl">{UNIT_EMOJIS[u.id] ?? '📚'}</div>
            <div className="mt-2 text-xl font-bold text-amber-900">{u.title}</div>
            <div className="mt-1 text-xs text-amber-500">{u.grade}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
