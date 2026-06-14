import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

// ── 「どっちが おおい？」（2〜3さい向け）──
// ふたつの おさらの 点を パッと見て、おおい ほうを タップ（近似数システム ANS）。
// 数えずに「だいたい おおい/すくない」を 直感で くらべる。むずかしさは ふたつの数の
// ひりつ で きめる（ちかい数ほど むずかしい）。研究: ANS の鋭さが のちの算数力を予測。

const TOTAL_ROUNDS = 4;
const SPEAK_RATE = 0.7;
const DOT_COLORS = ['#f97316', '#3b82f6']; // だいだい / あお の おさら

// ラウンドごとの「すくない:おおい」ペア候補。うしろほど ひりつが ちかい＝むずかしい。
const PAIRS: Array<Array<[number, number]>> = [
  [[4, 8], [3, 6], [4, 7]], // round0: だいたい 2ばい
  [[6, 9], [4, 7], [6, 10]], // round1
  [[6, 8], [7, 9], [5, 7]], // round2
  [[8, 10], [9, 11], [7, 9]], // round3: ちかい数
];

interface Dot { x: number; y: number; r: number }
interface Side { count: number; dots: Dot[]; color: string }
interface Q { left: Side; right: Side; moreSide: 'left' | 'right' }

// おさら（円）の なかに 点を ランダムに 散らす（数えにくく＝直感でくらべる）。
function scatter(count: number): Dot[] {
  const dots: Dot[] = [];
  let guard = 0;
  while (dots.length < count && guard < 400) {
    guard++;
    const r = 7 + Math.random() * 3; // 点の大きさを 少しだけ ばらつかせる
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.random() * (40 - r);
    const x = 50 + Math.cos(ang) * rad;
    const y = 50 + Math.sin(ang) * rad;
    if (dots.every((d) => Math.hypot(d.x - x, d.y - y) > d.r + r + 1)) {
      dots.push({ x, y, r });
    }
  }
  return dots;
}

function makeQ(round: number): Q {
  const cands = PAIRS[Math.min(round, PAIRS.length - 1)];
  const [few, many] = cands[Math.floor(Math.random() * cands.length)];
  const moreSide: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
  const leftCount = moreSide === 'left' ? many : few;
  const rightCount = moreSide === 'left' ? few : many;
  return {
    left: { count: leftCount, dots: scatter(leftCount), color: DOT_COLORS[0] },
    right: { count: rightCount, dots: scatter(rightCount), color: DOT_COLORS[1] },
    moreSide,
  };
}

interface Props {
  characterName: string;
  onExit: () => void;
}

export function CompareMoreUnit({ characterName, onExit }: Props) {
  const [round, setRound] = useState(0);
  const [q, setQ] = useState<Q>(() => makeQ(0));
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

  // あたらしい問題が 出たら「どっちが おおい？」と きく
  useEffect(() => {
    if (status === 'asking') speakJa('どっちが おおい？', undefined, { rate: SPEAK_RATE });
  }, [q, status]);

  const sides = useMemo(() => ([
    { key: 'left' as const, side: q.left },
    { key: 'right' as const, side: q.right },
  ]), [q]);

  function handlePick(key: 'left' | 'right') {
    if (status !== 'asking') return;
    if (key === q.moreSide) {
      playSfx('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speakJa('こっちが おおいね！ せいかい！', undefined, { rate: SPEAK_RATE });
      setStatus('right');
      later(next, 1700);
    } else {
      playSfx('wrong');
      speakJa('もういちど、どっちが おおいか みくらべてみよう。', undefined, { rate: SPEAK_RATE });
    }
  }

  function next() {
    if (round + 1 >= TOTAL_ROUNDS) {
      setStatus('done');
      playSfx('fanfare');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
      saveJson(STAMP_KEY, addStamp(state, 'compare-more', Date.now()));
      speakJa(`${characterName}、ぜんぶ できたね！ おうちでも どっちが おおいか くらべてみよう！`, undefined, { rate: SPEAK_RATE });
    } else {
      const nextRound = round + 1;
      setRound(nextRound);
      setQ(makeQ(nextRound));
      setStatus('asking');
    }
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRound(0);
    setQ(makeQ(0));
    setStatus('asking');
  }

  return (
    <div className="flex h-screen flex-col items-center gap-4 bg-gradient-to-b from-sky-200 via-indigo-100 to-amber-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-indigo-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-indigo-800">どっちが おおい？</h1>
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
          <p className="text-lg font-bold text-indigo-700">おおい ほうを タップ！</p>
          <div className="flex flex-1 items-center justify-center gap-4 px-2">
            {sides.map(({ key, side }) => (
              <motion.button
                key={`${round}-${key}`}
                type="button"
                onClick={() => handlePick(key)}
                disabled={status !== 'asking'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220 }}
                whileTap={status === 'asking' ? { scale: 0.94 } : undefined}
                className={`relative aspect-square w-[44vw] max-w-[280px] rounded-full border-[6px] bg-white/80 shadow-[0_6px_0_#a5b4fc] ${
                  status === 'right' && key === q.moreSide ? 'border-amber-400' : 'border-white'
                }`}
              >
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  {side.dots.map((d, i) => (
                    <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={side.color} />
                  ))}
                </svg>
                {status === 'right' && key === q.moreSide && (
                  <span className="absolute -right-2 -top-2 text-4xl">⭕️</span>
                )}
              </motion.button>
            ))}
          </div>
          <span className="mb-4 text-sm font-bold text-indigo-500">かぞえなくても いいよ。パッと みて えらぼう。</span>
        </>
      )}
    </div>
  );
}
