import { motion } from 'framer-motion';

interface Props {
  emoji: string;
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  /** こたえた あと（true）は かごに わけて「あまり」を 見せる */
  reveal: boolean;
}

const BASKET = '🧺';

/**
 * あまりのある わりざんを 目で見て わかるように する。
 * - こたえる まえ: わける まえの 山 ＋「なん人(かご)で わけるか」
 * - こたえた あと: かごに おなじ かずずつ わけて、のこった「あまり」を 赤わくで 強調
 */
export function DivideVisual({ emoji, dividend, divisor, quotient, remainder, reveal }: Props) {
  if (!reveal) {
    const showCount = Math.min(dividend, 30);
    return (
      <div className="bg-white rounded-2xl shadow p-3 flex flex-col items-center gap-2 max-w-xs">
        <div className="flex flex-wrap gap-0.5 justify-center text-2xl" style={{ maxWidth: '15rem' }}>
          {Array.from({ length: showCount }).map((_, i) => (
            <span key={i}>{emoji}</span>
          ))}
        </div>
        {dividend > 30 && (
          <div className="text-sm font-bold text-amber-700">（{dividend}こ）</div>
        )}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-xl">{BASKET.repeat(divisor)}</span>
        </div>
        <div className="text-xs font-bold text-amber-700">
          この {divisor}つに おなじ かずずつ わけると…？
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-3 flex flex-col items-center gap-2 max-w-xs">
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: divisor }).map((_, gi) => (
          <div key={gi} className="flex flex-col items-center gap-0.5">
            <span className="text-base">{BASKET}</span>
            <div className="flex flex-wrap gap-0.5 justify-center rounded-lg border-2 border-amber-200 p-1" style={{ maxWidth: '4.5rem' }}>
              {Array.from({ length: quotient }).map((_, ii) => (
                <motion.span
                  key={ii}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (gi * quotient + ii) * 0.02, type: 'spring' }}
                  className="text-base"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {remainder > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mt-1 flex flex-col items-center gap-0.5 rounded-xl border-2 border-red-400 bg-red-50 px-2 py-1"
        >
          <div className="flex flex-wrap gap-0.5 justify-center text-base" style={{ maxWidth: '8rem' }}>
            {Array.from({ length: remainder }).map((_, i) => (
              <span key={i}>{emoji}</span>
            ))}
          </div>
          <div className="text-xs font-bold text-red-500">あまり {remainder}こ</div>
        </motion.div>
      )}
    </div>
  );
}
