import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

// ── 「なんびき かな？」（2〜3さい向け）──
// 動物が 1〜3匹 ふわっと出る → パッと見て いくつか えらぶ（サビタイジング・数唱）。

const ANIMALS = ['🐰', '🐶', '🐱', '🐸', '🐼', '🦊', '🐯', '🐨', '🐹', '🐥'];
const TOTAL_ROUNDS = 4;
const SPEAK_RATE = 0.7;

interface Q { count: number; emoji: string; options: number[] }

function makeQ(prevCount?: number): Q {
  let count = 1 + Math.floor(Math.random() * 3);
  if (count === prevCount) count = (count % 3) + 1; // 同じ数が つづかないように
  const emoji = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const options = [1, 2, 3].sort(() => Math.random() - 0.5);
  return { count, emoji, options };
}

// 「いっぴき / にひき / さんびき」の よみ
function hikiWord(n: number): string {
  return n === 1 ? 'いっぴき' : n === 2 ? 'にひき' : 'さんびき';
}

interface Props {
  characterName: string;
  onExit: () => void;
}

export function CountAnimalsUnit({ characterName, onExit }: Props) {
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

  // あたらしい問題が 出たら「なんびき いるかな？」と きく
  useEffect(() => {
    if (status === 'asking') speakJa('なんびき いるかな？', undefined, { rate: SPEAK_RATE });
  }, [q, status]);

  function handlePick(n: number) {
    if (status !== 'asking') return;
    if (n === q.count) {
      playSfx('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speakJa(`${hikiWord(q.count)}！ せいかい！`, undefined, { rate: SPEAK_RATE });
      setStatus('right');
      later(next, 1700);
    } else {
      playSfx('wrong');
      speakJa('もういちど、ゆびで さして かぞえてみよう。', undefined, { rate: SPEAK_RATE });
    }
  }

  function next() {
    if (round + 1 >= TOTAL_ROUNDS) {
      setStatus('done');
      playSfx('fanfare');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
      saveJson(STAMP_KEY, addStamp(state, 'count-animals', Date.now()));
      speakJa(`${characterName}、ぜんぶ できたね！ おうちのひとと いっしょに かぞえてみよう！`, undefined, { rate: SPEAK_RATE });
    } else {
      setRound((r) => r + 1);
      setQ((prev) => makeQ(prev.count));
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
    <div className="flex h-screen flex-col items-center gap-4 bg-gradient-to-b from-emerald-200 via-teal-100 to-amber-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-teal-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-teal-800">なんびき かな？</h1>
        <span className="w-16" />
      </div>

      {status === 'done' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-7xl">
            🎉
          </motion.div>
          <p className="text-2xl font-bold text-teal-800">ぜんぶ できたね！</p>
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
          <p className="text-lg font-bold text-teal-700">なんびき いるかな？</p>
          {/* 動物が ふわっと出る */}
          <div className="flex flex-1 flex-wrap items-center justify-center gap-3 px-4">
            {Array.from({ length: q.count }).map((_, i) => (
              <motion.span
                key={`${round}-${i}`}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: i * 0.25, type: 'spring', stiffness: 260 }}
                className="text-7xl"
              >
                {q.emoji}
              </motion.span>
            ))}
          </div>

          {/* ●ドットの 選択肢（パッと見て いくつ） */}
          <div className="mb-6 flex gap-4">
            {q.options.map((n) => (
              <motion.button
                key={n}
                type="button"
                onClick={() => handlePick(n)}
                disabled={status !== 'asking'}
                whileTap={status === 'asking' ? { scale: 0.92 } : undefined}
                className="flex h-24 w-24 items-center justify-center gap-1.5 rounded-3xl border-4 border-white bg-white/80 shadow-[0_5px_0_#5eead4]"
              >
                {Array.from({ length: n }).map((_, i) => (
                  <span key={i} className="h-5 w-5 rounded-full bg-teal-500" />
                ))}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
