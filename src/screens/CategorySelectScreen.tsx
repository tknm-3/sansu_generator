import { motion } from 'framer-motion';
import type { Category } from '../data/units';

interface Props {
  onSelect: (category: Category) => void;
}

const CATEGORIES = [
  {
    id: 'sansu' as Category,
    label: 'さんすう',
    emoji: '🔢',
    description: 'たしざん・ひきざん・かけざん…',
    bg: 'from-sky-300 to-blue-200',
    shadow: '#1565c0',
    button: 'bg-blue-500',
  },
  {
    id: 'katachi' as Category,
    label: 'かたち',
    emoji: '🔷',
    description: 'まわす・あわせる・うえから見る…',
    bg: 'from-emerald-300 to-teal-200',
    shadow: '#00695c',
    button: 'bg-teal-500',
  },
] as const;

export function CategorySelectScreen({ onSelect }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-violet-100 to-amber-50 p-8">
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-3xl font-bold text-violet-900"
      >
        なにをやる？
      </motion.h1>

      <div className="flex flex-col gap-5 w-full max-w-sm">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 220 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.96 }}
            className={`rounded-3xl bg-gradient-to-br ${cat.bg} p-6 text-left shadow-lg`}
            style={{ boxShadow: `0 5px 0 ${cat.shadow}` }}
          >
            <div className="text-5xl mb-2">{cat.emoji}</div>
            <div className="text-2xl font-bold text-white drop-shadow">{cat.label}</div>
            <div className="mt-1 text-sm text-white/80">{cat.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
