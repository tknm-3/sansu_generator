import { motion } from 'framer-motion';
import { loadJson } from '../lib/storage';
import { EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

interface Props {
  onClose: () => void;
}

export function StampBook({ onClose }: Props) {
  const stamps = loadJson<StampState>('math-app:stamps', EMPTY_STAMPS);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
      <h1 className="text-2xl font-bold text-amber-800">スタンプ帳</h1>
      <p className="text-4xl font-bold text-amber-900">⭐ × {stamps.total}</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {Array.from({ length: stamps.total }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: Math.min(i * 0.05, 1), type: 'spring' }}
            className="text-3xl"
          >
            ⭐
          </motion.div>
        ))}
        {stamps.total === 0 && <p className="text-amber-500">もんだいをとくと スタンプが もらえるよ！</p>}
      </div>
      <button type="button" onClick={onClose} className="rounded-2xl bg-amber-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#e65100]">
        とじる
      </button>
    </div>
  );
}
