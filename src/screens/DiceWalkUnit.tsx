import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

// ── 「ころころ すすめ！」（2〜3さい向け）──
// サイコロ(1〜3)の数だけ、一直線のマス(1〜10)を1マスずつ進む。進むたびにマスの数字を
// ゆっくり読み上げ、ゴールで「ぜんぶで ●ばんまで すすんだね！」と基数を伝える。
// 線形の数ボード＋数を声に出す体験（Ramani & Siegler）を、タップだけで遊べる入口にした。

const TRACK_LEN = 10;            // マスの数（1..10 の線形ボード）
const DIE_MAX = 3;               // サイコロの目は 1〜3（小さいこ向け）
const STEP_MS = 850;             // 1マス進む間隔（ゆっくり数える）
const ROLL_MS = 700;             // サイコロが ころがる時間
const SPEAK_RATE = 0.7;          // 読み上げ速度（こども向けに ゆっくり）

// マスごとの景色（1..10）。さいごの 10 は ゴールの おうち。
const SCENERY = ['🌷', '🍎', '🦋', '🌟', '🍄', '🐰', '🌈', '🍓', '🎈', '🏠'];
// 止まったマスで「なにに とまったか」を しゃべる用の よみ（絵文字は TTS が 読み飛ばすため）
const SCENERY_NAMES = ['ちゅうりっぷ', 'りんご', 'ちょうちょ', 'おほしさま', 'きのこ', 'うさぎ', 'にじ', 'いちご', 'ふうせん', 'おうち'];
// 数字の よみ（TTS が 数字を 読み飛ばす環境でも 安定して 数えられるように）
const NUM_WORDS = ['', 'いち', 'に', 'さん', 'し', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];

/** サイコロの目をドットで表示（パッと見ていくつ＝サビタイジング） */
function DieFace({ value, rolling }: { value: number; rolling: boolean }) {
  const DOTS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8] };
  const on = new Set(DOTS[value] ?? []);
  return (
    <motion.div
      animate={rolling ? { rotate: [0, -14, 14, -8, 0], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: ROLL_MS / 1000 }}
      className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white p-3 shadow-inner"
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className={`h-5 w-5 rounded-full ${on.has(i) ? 'bg-rose-500' : 'bg-transparent'}`}
        />
      ))}
    </motion.div>
  );
}

interface Props {
  characterId: string;
  characterName: string;
  onExit: () => void;
}

type Phase = 'idle' | 'rolling' | 'walking' | 'goal';

export function DiceWalkUnit({ characterId, characterName, onExit }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const [pos, setPos] = useState(0);       // 0 = スタート、1..10 = マス
  const [die, setDie] = useState(1);        // いま見えている目
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  // 演出用タイマーをまとめて管理（画面を出るときに全部とめる）
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

  // コマが動いたら そのマスが見えるよう 自動スクロール
  useEffect(() => {
    const el = trackRef.current?.children[pos] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [pos]);

  const busy = phase === 'rolling' || phase === 'walking';

  function handleRoll() {
    if (busy || phase === 'goal') return;
    setPhase('rolling');
    playSfx('dice');
    // ゴールを 通りこさない 目にする（＝出た目ぶん ちょうど 進める→ぴったりゴール）
    const remain = TRACK_LEN - pos;
    const max = Math.min(DIE_MAX, remain);
    const value = 1 + Math.floor(Math.random() * max);
    // ころがる演出のあいだ 目を チラチラ変える
    later(() => setDie(1 + Math.floor(Math.random() * DIE_MAX)), ROLL_MS * 0.4);
    later(() => {
      setDie(value);
      speakJa(`${value} つ！`, undefined, { rate: SPEAK_RATE });
      walk(value);
    }, ROLL_MS);
  }

  function walk(steps: number) {
    setPhase('walking');
    const start = pos;
    for (let i = 1; i <= steps; i++) {
      later(() => {
        const next = start + i;
        setPos(next);
        playSfx('tap');
        const isLast = i === steps;
        if (isLast && next >= TRACK_LEN) {
          // ゴール: reachGoal で まとめて しゃべる
          later(reachGoal, 500);
        } else if (isLast) {
          // 止まったマスの 数字＋なにに とまったかを しゃべる
          speakJa(`${NUM_WORDS[next] ?? next} ばん。${SCENERY_NAMES[next - 1]} に とまったよ！`, undefined, { rate: SPEAK_RATE });
          later(() => setPhase('idle'), 250);
        } else {
          // とちゅうの マスは 数字だけ かぞえる
          speakJa(NUM_WORDS[next] ?? String(next), undefined, { rate: SPEAK_RATE });
        }
      }, i * STEP_MS);
    }
  }

  function reachGoal() {
    setPhase('goal');
    playSfx('fanfare');
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    speakJa(`おうちに ついたよ！ ゴール！ ${characterName}、ぜんぶで ${TRACK_LEN} ばんまで すすんだね！`, undefined, { rate: SPEAK_RATE });
    const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
    saveJson(STAMP_KEY, addStamp(state, 'dice-walk', Date.now()));
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPos(0);
    setDie(1);
    setPhase('idle');
  }

  return (
    <div className="flex h-screen flex-col items-center gap-4 bg-gradient-to-b from-sky-200 via-rose-100 to-amber-50 p-4">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-rose-700">
          ← もどる
        </button>
        <h1 className="text-2xl font-bold text-rose-800">ころころ すすめ！</h1>
        <span className="w-16" />
      </div>

      {/* 一直線のマス（線形の数ボード）。コマが 1マスずつ 進む */}
      <div ref={trackRef} className="flex w-full max-w-2xl items-end gap-2 overflow-x-auto py-6 px-1">
        {Array.from({ length: TRACK_LEN + 1 }).map((_, idx) => {
          const here = pos === idx;
          const isStart = idx === 0;
          const isGoal = idx === TRACK_LEN;
          return (
            <div
              key={idx}
              className={`flex shrink-0 flex-col items-center justify-end gap-1 rounded-2xl border-2 px-1 pb-1 pt-2 transition-colors ${
                here ? 'border-rose-400 bg-rose-100' : 'border-white/70 bg-white/50'
              }`}
              style={{ width: 60, height: 96 }}
            >
              <div className="h-9">
                {here && (
                  <motion.div
                    key={pos}
                    initial={{ y: -28, scale: 0.7 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 12 }}
                    className="text-4xl"
                  >
                    {charEmoji}
                  </motion.div>
                )}
              </div>
              <div className="text-2xl">{isStart ? '🚩' : SCENERY[idx - 1]}</div>
              <div className={`text-sm font-bold ${isGoal ? 'text-amber-600' : 'text-rose-700'}`}>
                {isStart ? 'スタート' : idx}
              </div>
            </div>
          );
        })}
      </div>

      {/* サイコロ＆ボタン */}
      <div className="mt-auto flex flex-col items-center gap-4 pb-6">
        <DieFace value={die} rolling={phase === 'rolling'} />
        {phase === 'goal' ? (
          <motion.button
            type="button"
            onClick={replay}
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.08, 1] }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-amber-400 px-10 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#b45309] active:translate-y-1"
          >
            🎉 もういちど！
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleRoll}
            disabled={busy}
            whileTap={busy ? undefined : { scale: 0.94 }}
            animate={busy ? {} : { scale: [1, 1.04, 1] }}
            transition={{ repeat: busy ? 0 : Infinity, duration: 1.4 }}
            className={`rounded-full px-12 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#9f1239] active:translate-y-1 ${
              busy ? 'bg-rose-300' : 'bg-rose-500'
            }`}
          >
            🎲 ころころ ポン！
          </motion.button>
        )}
      </div>
    </div>
  );
}
