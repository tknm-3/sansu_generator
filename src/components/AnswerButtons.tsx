import { motion } from 'framer-motion';

interface Props {
  choices: number[];
  onPick: (value: number) => void;
  disabled?: boolean;
}

const COLORS = [
  'bg-blue-400 shadow-[0_5px_0_#1565c0] hover:bg-blue-500',
  'bg-green-500 shadow-[0_5px_0_#2e7d32] hover:bg-green-600',
  'bg-red-400 shadow-[0_5px_0_#b71c1c] hover:bg-red-500',
] as const;

export function AnswerButtons({ choices, onPick, disabled }: Props) {
  return (
    <div className="flex gap-4">
      {choices.map((c, i) => (
        <motion.button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c)}
          whileTap={{ scale: 0.88, y: 4 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`rounded-2xl px-7 py-4 text-3xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${COLORS[i % COLORS.length]}`}
        >
          {c}
        </motion.button>
      ))}
    </div>
  );
}
