import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

// ── 「ぴったり おいて」（2〜3さい向け）──
// おさら 3枚に クッキーを 1つずつ おく（タップで 1枚ずつ）。1対1対応と「ぜんぶで さん」の基数性。

const PLATES = 3;
const NUM_WORDS = ['', 'いち', 'に', 'さん'];
const SPEAK_RATE = 0.7;

interface Props {
  characterName: string;
  onExit: () => void;
}

export function PairPlaceUnit({ characterName, onExit }: Props) {
  const [placed, setPlaced] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    speakJa('おさらに クッキーを 1つずつ おいてね。', undefined, { rate: SPEAK_RATE });
  }, []);

  function handleTap() {
    if (placed >= PLATES || done) return;
    const next = placed + 1;
    setPlaced(next);
    playSfx('tap');
    if (next >= PLATES) {
      later(finish, 450);
    } else {
      speakJa(NUM_WORDS[next], undefined, { rate: SPEAK_RATE });
    }
  }

  function finish() {
    setDone(true);
    playSfx('fanfare');
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
    saveJson(STAMP_KEY, addStamp(state, 'pair-place', Date.now()));
    speakJa(`さん！ ぴったり！ おさらと おなじ かずだね、${characterName}！`, undefined, { rate: SPEAK_RATE });
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaced(0);
    setDone(false);
  }

  const remaining = PLATES - placed;

  return (
    <div className="flex h-screen flex-col items-center gap-6 bg-gradient-to-b from-amber-200 via-orange-100 to-rose-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-orange-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-orange-800">ぴったり おいて</h1>
        <span className="w-16" />
      </div>

      {/* おさら（3枚）。クッキーが のったら ぽんっと出る */}
      <div className="mt-4 flex justify-center gap-4">
        {Array.from({ length: PLATES }).map((_, i) => (
          <div key={i} className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-inner">
            <span className="text-4xl opacity-40">🍽️</span>
            {placed > i && (
              <motion.span
                initial={{ scale: 0, y: -30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 12 }}
                className="absolute text-5xl"
              >
                🍪
              </motion.span>
            )}
          </div>
        ))}
      </div>

      {done ? (
        <div className="mt-auto flex flex-col items-center gap-5 pb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-3xl font-bold text-orange-800">
            🎉 ぴったり！
          </motion.div>
          <motion.button
            type="button"
            onClick={replay}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-amber-400 px-10 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#b45309] active:translate-y-1"
          >
            🔁 もういちど！
          </motion.button>
        </div>
      ) : (
        <div className="mt-auto flex flex-col items-center gap-3 pb-8">
          <p className="text-base font-bold text-orange-700">クッキーを タップして おさらに おこう</p>
          {/* のこりの クッキーの 山（タップで 1枚ずつ おく） */}
          <motion.button
            type="button"
            onClick={handleTap}
            whileTap={{ scale: 0.94 }}
            className="flex min-h-24 min-w-64 flex-wrap items-center justify-center gap-1 rounded-3xl bg-amber-300/70 p-4 shadow-[0_5px_0_#d97706] active:translate-y-1"
          >
            {Array.from({ length: remaining }).map((_, i) => (
              <span key={i} className="text-5xl">🍪</span>
            ))}
          </motion.button>
        </div>
      )}
    </div>
  );
}
