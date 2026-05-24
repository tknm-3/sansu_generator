import { motion } from 'framer-motion';

interface Props {
  tens: number;
  ones: number;
  carry?: boolean;
}

export function PlaceValueBlocks({ tens, ones, carry }: Props) {
  return (
    <div className="flex items-end justify-center gap-8 bg-white rounded-2xl shadow p-4 select-none">
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {Array.from({ length: tens }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              className="w-3 h-16 rounded bg-blue-400 origin-bottom"
            />
          ))}
        </div>
        <span className="text-xs text-blue-600 font-bold">じゅう</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-wrap gap-1 max-w-[7rem] justify-center">
          {Array.from({ length: ones }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              className="w-4 h-4 rounded-full bg-orange-400"
            />
          ))}
        </div>
        <span className="text-xs text-orange-600 font-bold">いち</span>
      </div>
      {carry && <span className="text-2xl">➡️🔟</span>}
    </div>
  );
}
