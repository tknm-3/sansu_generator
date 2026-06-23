import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { generateRika } from '../lib/rika/generate';
import type { RikaQuestion } from '../lib/rika/types';

// ── りかランド 🔬（なかまわけ・なかまはずれ）──
// 絵を 見て「きまり」を 見つけ、あう/あわない 1つを えらぶ。観察→分類の 理科の素地。
// 既存の baby ユニット（MatchSame）の タップUI・ごほうび演出に そろえる。

const TOTAL_ROUNDS = 6;
const SPEAK_RATE = 0.8;

interface Props {
  characterName: string;
  characterId?: string;
  onExit: () => void;
}

export function RikaLandUnit({ characterName, onExit }: Props) {
  const [round, setRound] = useState(0);
  const [q, setQ] = useState<RikaQuestion>(() => generateRika());
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

  // 新しい問題が 出たら prompt を 読み上げる（字が読めない子のため）
  useEffect(() => {
    if (status === 'asking') speakJa(q.speak, undefined, { rate: SPEAK_RATE });
  }, [q, status]);

  function handlePick(index: number) {
    if (status !== 'asking') return;
    if (index === q.answer) {
      playSfx('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speakJa('せいかい！', undefined, { rate: SPEAK_RATE });
      setStatus('right');
      later(next, 1400);
    } else {
      playSfx('wrong');
      speakJa('もういちど よく みてみよう！', undefined, { rate: SPEAK_RATE });
    }
  }

  function next() {
    if (round + 1 >= TOTAL_ROUNDS) {
      setStatus('done');
      playSfx('fanfare');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
      saveJson(STAMP_KEY, addStamp(state, 'rika-land', Date.now()));
      speakJa(`${characterName}、はかせ みたいだね！`, undefined, { rate: SPEAK_RATE });
    } else {
      setRound((r) => r + 1);
      setQ(generateRika());
      setStatus('asking');
    }
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRound(0);
    setQ(generateRika());
    setStatus('asking');
  }

  return (
    <div className="flex h-screen flex-col items-center gap-4 bg-gradient-to-b from-lime-200 via-emerald-100 to-amber-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-emerald-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-emerald-800">りかランド 🔬</h1>
        <span className="text-sm font-bold text-emerald-600">{Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
      </div>

      {status === 'done' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-7xl">
            🔬
          </motion.div>
          <p className="text-2xl font-bold text-emerald-800">はかせ みたいだね！</p>
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
          {/* お題（きまり） */}
          <motion.div
            key={`p-${round}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 rounded-2xl bg-white/80 px-5 py-3 text-center text-xl font-bold text-emerald-800 shadow"
          >
            {q.prompt}
          </motion.div>

          {/* 選択肢 4つ（2×2） */}
          <div className="mt-auto mb-10 grid grid-cols-2 gap-4">
            {q.choices.map((c, i) => (
              <motion.button
                key={`${round}-${i}`}
                type="button"
                onClick={() => handlePick(i)}
                disabled={status !== 'asking'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                whileTap={status === 'asking' ? { scale: 0.92 } : undefined}
                className={`flex h-28 w-28 items-center justify-center rounded-3xl border-4 bg-white/90 text-6xl shadow-[0_5px_0_#a7f3d0] ${
                  status === 'right' && i === q.answer ? 'border-emerald-400' : 'border-white'
                }`}
              >
                {c.emoji}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
