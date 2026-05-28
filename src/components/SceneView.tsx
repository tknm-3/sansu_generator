import { motion } from 'framer-motion';
import type { ProblemScene } from '../lib/problemScene';

interface Props {
  scene: ProblemScene;
}

function ItemGrid({ emoji, count, faded = 0 }: { emoji: string; count: number; faded?: number }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
          className={`text-2xl ${i >= count - faded ? 'opacity-30 grayscale' : ''}`}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

function TenBlock({ count }: { count: number }) {
  // 10のまとまり（縦5×2）
  return (
    <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-amber-200 p-1">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-lg">🟧</span>
      ))}
    </div>
  );
}

/** ProblemScene を絵で表現する。物を動かして作った問題の出題・プレビューで使う。 */
export function SceneView({ scene }: Props) {
  if (scene.kind === 'combine') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/70 p-4">
        <ItemGrid emoji={scene.emoji} count={scene.a} />
        <span className="text-3xl font-bold text-amber-700">＋</span>
        <ItemGrid emoji={scene.emoji} count={scene.b} />
      </div>
    );
  }

  if (scene.kind === 'takeAway') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/70 p-4">
        <ItemGrid emoji={scene.emoji} count={scene.total} faded={scene.remove} />
        <span className="text-sm font-bold text-amber-600">
          {scene.remove}こ バイバイ 👋
        </span>
      </div>
    );
  }

  // placeValue（2けた）
  const tensA = Math.floor(scene.aTens);
  const tensB = Math.floor(scene.bTens);
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/70 p-4">
      <div className="flex items-end gap-1">
        <TenBlock count={tensA} />
        {scene.aOnes > 0 && (
          <div className="grid grid-cols-1 gap-0.5">
            {Array.from({ length: scene.aOnes }).map((_, i) => (
              <span key={i} className="text-lg">🟦</span>
            ))}
          </div>
        )}
      </div>
      <span className="text-3xl font-bold text-amber-700">＋</span>
      <div className="flex items-end gap-1">
        <TenBlock count={tensB} />
        {scene.bOnes > 0 && (
          <div className="grid grid-cols-1 gap-0.5">
            {Array.from({ length: scene.bOnes }).map((_, i) => (
              <span key={i} className="text-lg">🟦</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
