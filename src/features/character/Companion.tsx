import { motion } from 'framer-motion';
import { speakJa } from '../speech/tts';

interface Props {
  name: string;
  message: string;
  emoji?: string;
  happy?: boolean; // 正解時に喜ぶ
}

/** 相棒キャラ＋吹き出し。吹き出しタップで読み上げ。 */
export function Companion({ name, message, emoji = '🐰', happy = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="flex flex-col items-center"
        animate={happy ? { y: [0, -16, 0] } : { y: 0 }}
        transition={{ duration: 0.5, repeat: happy ? 2 : 0 }}
      >
        <div className="text-6xl">{emoji}</div>
        <div className="rounded-full bg-yellow-200 px-2 text-xs font-bold text-amber-900">{name}</div>
      </motion.div>
      <button
        type="button"
        onClick={() => speakJa(message)}
        className="max-w-xs rounded-2xl border-2 border-yellow-300 bg-white px-4 py-3 text-left text-lg font-bold text-amber-900"
        aria-label="よみあげ"
      >
        {message} <span aria-hidden>🔊</span>
      </button>
    </div>
  );
}
