import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  emoji: string;
  count: number;
  max: number;
  onChange: (next: number) => void;
  /** 末尾から何個を「とった（半透明）」表示にするか */
  faded?: number;
  /** 枠の色クラス（例: 'border-sky-300 bg-sky-50'） */
  accent?: string;
}

/**
 * タップで絵文字を置いたり取ったりするトレイ。
 * 埋まっているマスをタップで1つ減らし、空きマスをタップで1つ増やす。
 */
export function ItemTray({ emoji, count, max, onChange, faded = 0, accent = 'border-amber-300 bg-amber-50' }: Props) {
  const cols = Math.min(5, Math.max(3, max <= 6 ? 3 : 5));
  return (
    <div className={`grid gap-1.5 rounded-2xl border-2 border-dashed p-3 ${accent}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < count;
        const isFaded = i >= count - faded && filled;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(filled ? count - 1 : i + 1)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition-colors ${
              filled ? 'bg-white shadow-sm' : 'bg-black/5'
            }`}
            aria-label={filled ? 'とる' : 'おく'}
          >
            <AnimatePresence mode="wait">
              {filled ? (
                <motion.span
                  key="on"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={isFaded ? 'opacity-30 grayscale' : ''}
                >
                  {emoji}
                </motion.span>
              ) : (
                <motion.span key="off" className="text-base text-black/20">＋</motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
