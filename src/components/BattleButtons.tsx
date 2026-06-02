import { motion } from 'framer-motion';

interface Props {
  choices: string[];
  onPick: (index: number) => void;
  disabled?: boolean;
  correctIndex?: number;
  wrongIndex?: number;
}

const COLORS = [
  'bg-blue-400 shadow-[0_5px_0_#1565c0] hover:bg-blue-500 active:shadow-none active:translate-y-1',
  'bg-green-500 shadow-[0_5px_0_#2e7d32] hover:bg-green-600 active:shadow-none active:translate-y-1',
  'bg-red-400 shadow-[0_5px_0_#b71c1c] hover:bg-red-500 active:shadow-none active:translate-y-1',
  'bg-yellow-400 shadow-[0_5px_0_#f57f17] hover:bg-yellow-500 active:shadow-none active:translate-y-1',
] as const;

const CORRECT_CLASS = 'bg-emerald-400 shadow-[0_5px_0_#1b5e20] ring-4 ring-emerald-300';
const WRONG_CLASS = 'bg-gray-400 shadow-none opacity-50';

export function BattleButtons({ choices, onPick, disabled, correctIndex, wrongIndex }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
      {choices.map((c, i) => {
        const isCorrect = correctIndex === i;
        const isWrong = wrongIndex === i;
        const colorClass = isCorrect ? CORRECT_CLASS : isWrong ? WRONG_CLASS : COLORS[i % COLORS.length];
        return (
          <motion.button
            key={`${c}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(i)}
            whileTap={{ scale: 0.88, y: 4 }}
            whileHover={disabled ? {} : { scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={`rounded-2xl px-4 py-5 text-2xl font-bold text-white disabled:cursor-not-allowed transition-colors ${colorClass}`}
          >
            {c}
          </motion.button>
        );
      })}
    </div>
  );
}
