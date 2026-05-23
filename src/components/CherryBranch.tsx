import { motion } from 'framer-motion';

interface Props {
  b: number;
  split: number;
  carry: number;
  visible: boolean;
}

export function CherryBranch({ b, split, carry, visible }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-200 text-2xl font-bold text-pink-800 border-2 border-pink-400">
        {b}
      </div>
      <svg width="100" height="40" viewBox="0 0 100 40">
        <motion.line
          x1="50" y1="0" x2="20" y2="40"
          stroke="#e91e63" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: visible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.line
          x1="50" y1="0" x2="80" y2="40"
          stroke="#e91e63" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: visible ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
      </svg>
      <div className="flex gap-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: visible ? 1 : 0 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400 text-2xl font-bold text-white border-2 border-red-600"
        >
          {split}
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: visible ? 1 : 0 }}
          transition={{ type: 'spring', delay: 0.45 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400 text-2xl font-bold text-white border-2 border-red-600"
        >
          {carry}
        </motion.div>
      </div>
    </div>
  );
}
