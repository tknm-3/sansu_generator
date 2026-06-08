import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

// ── 「おなじ どれ？」（2〜3さい向け）──
// 見本と おなじ ものを 下から えらぶ（分類・属性のマッチング）。数の前の 論理の素地。

const ITEMS = ['🍎', '🍌', '🍓', '⭐', '🌸', '🐶', '🐱', '🚗', '🎈', '🔵', '🔺', '🟩', '🦋', '🐟'];
const TOTAL_ROUNDS = 4;
const SPEAK_RATE = 0.7;

interface Q { target: string; options: string[] }

function makeQ(prevTarget?: string): Q {
  const pool = ITEMS.filter((x) => x !== prevTarget);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const others = ITEMS.filter((x) => x !== target).sort(() => Math.random() - 0.5).slice(0, 2);
  const options = [target, ...others].sort(() => Math.random() - 0.5);
  return { target, options };
}

interface Props {
  characterName: string;
  onExit: () => void;
}

export function MatchSameUnit({ characterName, onExit }: Props) {
  const [round, setRound] = useState(0);
  const [q, setQ] = useState<Q>(() => makeQ());
  const [status, setStatus] = useState<'asking' | 'right' | 'done'>('asking');
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
    if (status === 'asking') speakJa('おなじ どれ？', undefined, { rate: SPEAK_RATE });
  }, [q, status]);

  function handlePick(item: string) {
    if (status !== 'asking') return;
    if (item === q.target) {
      playSfx('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speakJa('おなじ！ せいかい！', undefined, { rate: SPEAK_RATE });
      setStatus('right');
      later(next, 1500);
    } else {
      playSfx('wrong');
      speakJa('うーん、うえと おなじ ものを さがしてみよう。', undefined, { rate: SPEAK_RATE });
    }
  }

  function next() {
    if (round + 1 >= TOTAL_ROUNDS) {
      setStatus('done');
      playSfx('fanfare');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
      saveJson(STAMP_KEY, addStamp(state, 'match-same', Date.now()));
      speakJa(`${characterName}、ぜんぶ できたね！`, undefined, { rate: SPEAK_RATE });
    } else {
      setRound((r) => r + 1);
      setQ((prev) => makeQ(prev.target));
      setStatus('asking');
    }
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRound(0);
    setQ(makeQ());
    setStatus('asking');
  }

  return (
    <div className="flex h-screen flex-col items-center gap-5 bg-gradient-to-b from-indigo-200 via-violet-100 to-amber-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-indigo-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-indigo-800">おなじ どれ？</h1>
        <span className="w-16" />
      </div>

      {status === 'done' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-7xl">
            🎉
          </motion.div>
          <p className="text-2xl font-bold text-indigo-800">ぜんぶ できたね！</p>
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
        <>
          {/* 見本 */}
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-base font-bold text-indigo-600">これと…</p>
            <motion.div
              key={`t-${round}`}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-indigo-300 bg-white text-7xl shadow-md"
            >
              {q.target}
            </motion.div>
          </div>

          <p className="mt-2 text-lg font-bold text-indigo-700">おなじ どれ？</p>

          {/* 選択肢 3つ */}
          <div className="mt-auto mb-8 flex gap-4">
            {q.options.map((item, i) => (
              <motion.button
                key={`${round}-${i}`}
                type="button"
                onClick={() => handlePick(item)}
                disabled={status !== 'asking'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={status === 'asking' ? { scale: 0.92 } : undefined}
                className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-white/80 text-6xl shadow-[0_5px_0_#c7d2fe]"
              >
                {item}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
