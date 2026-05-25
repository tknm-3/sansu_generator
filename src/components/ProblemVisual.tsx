import { motion } from 'framer-motion';
import { PlaceValueBlocks } from './PlaceValueBlocks';
import type { ProblemScene } from '../lib/problemScene';

interface Props {
  scene: ProblemScene | null;
}

function Pile({ emoji, count, startDelay = 0 }: { emoji: string; count: number; startDelay?: number }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center rounded-lg border-2 border-amber-200 p-2 max-w-[8rem]">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: startDelay + i * 0.04, type: 'spring' }}
          className="text-2xl"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

export function ProblemVisual({ scene }: Props) {
  if (!scene) return null;

  if (scene.kind === 'combine') {
    return (
      <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-2 justify-center max-w-md">
        <Pile emoji={scene.emoji} count={scene.a} />
        <span className="text-xl font-bold text-amber-700">と</span>
        <Pile emoji={scene.emoji} count={scene.b} startDelay={scene.a * 0.04} />
      </div>
    );
  }

  if (scene.kind === 'takeAway') {
    return (
      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-1 justify-center max-w-xs">
        {Array.from({ length: scene.total }).map((_, i) => {
          const removed = i >= scene.total - scene.remove;
          return (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              className="relative text-2xl"
            >
              <span className={removed ? 'opacity-30' : ''}>{scene.emoji}</span>
              {removed && (
                <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold">
                  ✕
                </span>
              )}
            </motion.span>
          );
        })}
      </div>
    );
  }

  // placeValue
  return (
    <div className="flex flex-col items-center gap-2">
      <PlaceValueBlocks tens={scene.aTens} ones={scene.aOnes} />
      <PlaceValueBlocks tens={scene.bTens} ones={scene.bOnes} />
    </div>
  );
}
