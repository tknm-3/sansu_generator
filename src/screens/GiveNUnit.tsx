import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

// ── 「○こ ちょうだい」（2〜3さい向け）──
// 「クッキーを ○こ かごに いれて」と きいて、その数だけ タップで かごへ。
// 数詞（いち・に・さん）を きいて、その数の あつまりを じぶんで つくる
// ＝基数原理（Give-N課題, Wynn 1990/1992）。なんびきかな？（見て数える）の 逆。

const POOL = 6; // おさらに ならぶ クッキーの 数
const TARGETS = [1, 2, 3, 4]; // ラウンドごとの「ちょうだい」の数（だんだん ふえる）
const SPEAK_RATE = 0.7;
const COOKIE = '🍪';

// 「いっこ / にこ / さんこ / よんこ」の よみ
function koWord(n: number): string {
  return n === 1 ? 'いっこ' : n === 2 ? 'にこ' : n === 3 ? 'さんこ' : 'よんこ';
}

interface Props {
  characterName: string;
  onExit: () => void;
}

export function GiveNUnit({ characterName, onExit }: Props) {
  const [round, setRound] = useState(0);
  const [taken, setTaken] = useState(0); // かごに いれた 数
  const [status, setStatus] = useState<'asking' | 'right' | 'done'>('asking');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const target = TARGETS[Math.min(round, TARGETS.length - 1)];

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

  // あたらしい問題が 出たら「クッキーを ○こ ちょうだい」と きく
  useEffect(() => {
    if (status === 'asking') speakJa(`クッキーを ${koWord(target)} ちょうだい`, undefined, { rate: SPEAK_RATE });
  }, [round, status, target]);

  function takeOne() {
    if (status !== 'asking' || taken >= POOL) return;
    playSfx('tap');
    setTaken((t) => t + 1);
  }

  function putBack() {
    if (status !== 'asking' || taken <= 0) return;
    playSfx('tap');
    setTaken((t) => t - 1);
  }

  function check() {
    if (status !== 'asking') return;
    if (taken === target) {
      playSfx('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speakJa(`${koWord(target)}！ せいかい！`, undefined, { rate: SPEAK_RATE });
      setStatus('right');
      later(next, 1700);
    } else if (taken < target) {
      playSfx('wrong');
      speakJa('もう ちょっと いれてみよう。', undefined, { rate: SPEAK_RATE });
    } else {
      playSfx('wrong');
      speakJa('ちょっと おおいみたい。すこし もどしてみよう。', undefined, { rate: SPEAK_RATE });
    }
  }

  function next() {
    if (round + 1 >= TARGETS.length) {
      setStatus('done');
      playSfx('fanfare');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
      saveJson(STAMP_KEY, addStamp(state, 'give-n', Date.now()));
      speakJa(`${characterName}、ぜんぶ できたね！ おやつのとき「○こ ちょうだい」って あそんでみよう！`, undefined, { rate: SPEAK_RATE });
    } else {
      setRound((r) => r + 1);
      setTaken(0);
      setStatus('asking');
    }
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRound(0);
    setTaken(0);
    setStatus('asking');
  }

  return (
    <div className="flex h-screen flex-col items-center gap-3 bg-gradient-to-b from-amber-200 via-orange-100 to-rose-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-orange-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-orange-800">○こ ちょうだい</h1>
        <span className="w-16" />
      </div>

      {status === 'done' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-7xl">
            🎉
          </motion.div>
          <p className="text-2xl font-bold text-orange-800">ぜんぶ できたね！</p>
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
          {/* どれだけ ちょうだい？ おおきな 数字で 提示 */}
          <p className="text-lg font-bold text-orange-700">クッキーを</p>
          <div className="flex items-center gap-2">
            <span className="text-6xl font-black text-orange-600">{target}</span>
            <span className="text-2xl font-bold text-orange-700">こ ちょうだい！</span>
          </div>

          {/* かご：いれた クッキー（タップで もどす） */}
          <div className="relative flex min-h-[110px] w-full max-w-md flex-wrap content-center items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-orange-300 bg-white/60 p-3">
            <span className="absolute left-4 text-4xl opacity-70">🧺</span>
            {taken === 0 ? (
              <span className="text-sm font-bold text-orange-400">ここに いれてね</span>
            ) : (
              Array.from({ length: taken }).map((_, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={putBack}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 280 }}
                  className="text-5xl"
                >
                  {COOKIE}
                </motion.button>
              ))
            )}
          </div>

          {/* おさら：のこりの クッキー（タップで かごへ） */}
          <p className="text-sm font-bold text-orange-500">おさらの クッキーを タップ</p>
          <div className="flex flex-1 flex-wrap content-start items-center justify-center gap-2 px-2">
            {Array.from({ length: POOL - taken }).map((_, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={takeOne}
                disabled={status !== 'asking'}
                whileTap={status === 'asking' ? { scale: 0.88 } : undefined}
                className="text-6xl"
              >
                {COOKIE}
              </motion.button>
            ))}
          </div>

          <motion.button
            type="button"
            onClick={check}
            disabled={status !== 'asking' || taken === 0}
            whileTap={{ scale: 0.95 }}
            className="mb-4 rounded-full bg-emerald-400 px-10 py-3 text-2xl font-bold text-white shadow-[0_5px_0_#047857] active:translate-y-1 disabled:opacity-40"
          >
            できた！
          </motion.button>
        </>
      )}
    </div>
  );
}
