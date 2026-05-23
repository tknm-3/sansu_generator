import { motion } from 'framer-motion';

interface Props {
  filled: number;
  fruit?: string;
  flash?: boolean;
}

export function MakeTenFrame({ filled, fruit = '🍎', flash = false }: Props) {
  const clamped = Math.max(0, Math.min(10, filled));
  return (
    <div
      className={
        'grid max-w-[380px] grid-cols-5 gap-2 rounded-2xl border-[3px] p-3 transition-colors duration-300 ' +
        (flash ? 'border-yellow-400 bg-yellow-100' : 'border-blue-300 bg-white')
      }
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const isFilled = i < clamped;
        return (
          <motion.div
            key={i}
            data-testid={isFilled ? 'cell-filled' : 'cell-empty'}
            initial={false}
            animate={
              isFilled
                ? { scale: [0.7, 1.15, 1], opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={isFilled ? { type: 'spring', stiffness: 400, damping: 12 } : {}}
            className={
              'flex aspect-square items-center justify-center rounded-xl text-2xl select-none ' +
              (isFilled
                ? flash
                  ? 'bg-yellow-300'
                  : 'bg-red-100 shadow-inner'
                : 'animate-pulse border-2 border-dashed border-blue-300 bg-blue-50')
            }
          >
            {isFilled ? fruit : ''}
            <span data-testid="cell" className="hidden" />
          </motion.div>
        );
      })}
    </div>
  );
}
