import { motion } from 'framer-motion';
import { speakJa } from '../speech/tts';
import { CompanionSvg, type FaceExpression } from './CompanionSvg';

interface Props {
  name: string;
  message: string;
  expression?: FaceExpression;
  size?: number;
}

export function Companion({ name, message, expression = 'normal', size = 90 }: Props) {
  const isHappy = expression === 'happy';
  return (
    <div className="flex items-end gap-3">
      <motion.div
        className="flex flex-col items-center"
        animate={
          isHappy
            ? { y: [0, -18, 0, -10, 0], rotate: [0, -8, 8, -4, 0], scale: [1, 1.1, 1] }
            : { y: 0, rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <CompanionSvg expression={expression} size={size} />
        <div className="rounded-full bg-yellow-200 px-2 text-xs font-bold text-amber-900 shadow-sm">{name}</div>
      </motion.div>

      <button
        type="button"
        onClick={() => speakJa(message)}
        className="relative max-w-xs rounded-[20px] border-2 border-yellow-300 bg-white px-4 py-3 text-left text-lg font-bold text-amber-900 shadow-md active:scale-95 transition-transform"
        aria-label="よみあげ"
      >
        <span className="absolute -left-3 bottom-3 h-0 w-0 border-y-[8px] border-r-[12px] border-y-transparent border-r-yellow-300" />
        <span className="absolute -left-[10px] bottom-3 h-0 w-0 border-y-[8px] border-r-[12px] border-y-transparent border-r-white" />
        {message} <span aria-hidden>🔊</span>
      </button>
    </div>
  );
}
