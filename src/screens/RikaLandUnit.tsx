import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { generateRika } from '../lib/rika/generate';
import { getRikaUnit } from '../lib/rika/units';
import type { RikaQuestion, RikaUnitId } from '../lib/rika/types';

// ── りかランド 🔬（単元別）──
// 観察→分類(classify/odd)、そだつ順(sequence)、予想→たしかめ(predict) を 同じタップUIに 乗せる。
// predict は Predict-Observe-Explain＝予想して 結果を みて 理由を きく（まちがっても せめない）。

const TOTAL_ROUNDS = 6;
const SPEAK_RATE = 0.8;

interface Props {
  unitId: RikaUnitId;
  characterName: string;
  characterId?: string;
  onExit: () => void;
}

export function RikaLandUnit({ unitId, characterName, onExit }: Props) {
  const unit = getRikaUnit(unitId);
  const [round, setRound] = useState(0);
  const [q, setQ] = useState<RikaQuestion>(() => generateRika(undefined, undefined, unitId));
  const [status, setStatus] = useState<'asking' | 'right' | 'reveal' | 'done'>('asking');
  const [picked, setPicked] = useState<number[]>([]); // sequence: タップ済み choice index 列
  const [predicted, setPredicted] = useState<number | null>(null); // predict: えらんだ予想
  const [combo, setCombo] = useState(0); // れんぞく せいかい
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

  function win() {
    playSfx('correct');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    speakJa('せいかい！', undefined, { rate: SPEAK_RATE });
    setCombo((c) => c + 1);
    setStatus('right');
    later(next, 1400);
  }

  // ── 予想（POE）: 予想を えらぶ → 結果を みせる → 理由を いう → つぎへ ──
  function handlePredict(index: number) {
    if (status !== 'asking') return;
    setPredicted(index);
    setStatus('reveal');
    const correct = index === q.answer;
    if (correct) {
      playSfx('correct');
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setCombo((c) => c + 1);
      speakJa('あたり！', () => later(() => q.reason && speakJa(q.reason, undefined, { rate: SPEAK_RATE }), 100), {
        rate: SPEAK_RATE,
      });
    } else {
      playSfx('wrong');
      setCombo(0);
      // まちがっても せめない：みてみよう→りゆう
      speakJa('あれれ、みてみて！', () => later(() => q.reason && speakJa(q.reason, undefined, { rate: SPEAK_RATE }), 100), {
        rate: SPEAK_RATE,
      });
    }
    later(next, 2600);
  }

  function handlePick(index: number) {
    if (status !== 'asking') return;
    if (q.kind === 'predict') return; // predict は ボタンで handlePredict
    // そだつ じゅんばん: さいしょ から じゅんに タップ
    if (q.kind === 'sequence' && q.order) {
      if (picked.includes(index)) return;
      const expected = q.order[picked.length];
      if (index === expected) {
        const np = [...picked, index];
        setPicked(np);
        if (np.length === q.order.length) win();
        else playSfx('correct');
      } else {
        playSfx('wrong');
        setCombo(0);
        speakJa('うーん、さいしょ から じゅんばんに さがしてみよう！', undefined, { rate: SPEAK_RATE });
      }
      return;
    }
    // なかまわけ／なかまはずれ: 1つ えらぶ
    if (index === q.answer) {
      win();
    } else {
      playSfx('wrong');
      setCombo(0);
      speakJa('もういちど よく みてみよう！', undefined, { rate: SPEAK_RATE });
    }
  }

  function next() {
    if (round + 1 >= TOTAL_ROUNDS) {
      setStatus('done');
      playSfx('fanfare');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      const state = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
      saveJson(STAMP_KEY, addStamp(state, unit.stampId, Date.now()));
      speakJa(`${characterName}、はかせ みたいだね！`, undefined, { rate: SPEAK_RATE });
    } else {
      setRound((r) => r + 1);
      setQ(generateRika(undefined, undefined, unitId));
      setPicked([]);
      setPredicted(null);
      setStatus('asking');
    }
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRound(0);
    setQ(generateRika(undefined, undefined, unitId));
    setPicked([]);
    setPredicted(null);
    setCombo(0);
    setStatus('asking');
  }

  const t = unit.theme;

  return (
    <div className={`flex h-screen flex-col items-center gap-4 bg-gradient-to-b ${t.grad} p-4`}>
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onExit} className={`rounded-xl bg-white/70 px-3 py-2 text-sm font-bold ${t.textBtn}`}>
          ← もどる
        </button>
        <h1 className={`text-xl font-bold ${t.text}`}>
          {unit.emoji} {unit.title}
        </h1>
        <span className={`text-sm font-bold ${t.textSoft}`}>
          {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
        </span>
      </div>

      {/* すすみぐあいの ドット＋コンボ */}
      <div className="flex w-full max-w-sm items-center justify-between px-1">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${(status === 'done' || i < round || (i === round && status !== 'asking')) ? t.dot : 'bg-white/70'}`}
            />
          ))}
        </div>
        {combo >= 2 && status !== 'done' && (
          <motion.span
            key={combo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-full bg-amber-400 px-3 py-0.5 text-sm font-bold text-white shadow"
          >
            🔥 {combo}れんぞく！
          </motion.span>
        )}
      </div>

      {status === 'done' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-7xl">
            {unit.emoji}
          </motion.div>
          <p className={`text-2xl font-bold ${t.text}`}>はかせ みたいだね！</p>
          <motion.button
            type="button"
            onClick={replay}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-amber-400 px-10 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#b45309] active:translate-y-1"
          >
            🔁 もういちど！
          </motion.button>
        </div>
      ) : q.kind === 'predict' ? (
        <PredictView q={q} status={status} predicted={predicted} theme={t} onPredict={handlePredict} />
      ) : (
        <>
          {/* お題（きまり／じゅんばん） */}
          <motion.div
            key={`p-${round}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-2 rounded-2xl bg-white/80 px-5 py-3 text-center text-xl font-bold ${t.text} shadow`}
          >
            {q.prompt}
          </motion.div>
          {q.kind === 'sequence' && (
            <p className={`text-sm font-bold ${t.textSoft}`}>さいしょ から じゅんに タップしてね</p>
          )}

          {/* 選択肢（classify/odd は 2×2、sequence は タップ順に ばんごうが つく） */}
          <div className="mt-auto mb-10 grid grid-cols-2 gap-4">
            {q.choices.map((c, i) => {
              const pickedPos = picked.indexOf(i);
              const isPicked = pickedPos >= 0;
              const highlight = q.kind === 'sequence' ? isPicked : status === 'right' && i === q.answer;
              return (
                <motion.button
                  key={`${round}-${i}`}
                  type="button"
                  onClick={() => handlePick(i)}
                  disabled={status !== 'asking' || isPicked}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileTap={status === 'asking' && !isPicked ? { scale: 0.92 } : undefined}
                  className={`relative flex h-28 w-28 items-center justify-center rounded-3xl border-4 bg-white/90 text-6xl shadow-[0_5px_0_#a7f3d0] ${
                    highlight ? t.border : 'border-white'
                  } ${isPicked ? 'opacity-70' : ''}`}
                >
                  {c.emoji}
                  {q.kind === 'sequence' && isPicked && (
                    <span className={`absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full ${t.dot} text-lg font-bold text-white shadow`}>
                      {pickedPos + 1}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── 予想ビュー（POE）──
// まんなかに しらべる もの → 2択で 予想 → 結果アニメ（うく=うえへ／しずむ=したへ 等）→ りゆう。
function PredictView({
  q,
  status,
  predicted,
  theme,
  onPredict,
}: {
  q: RikaQuestion;
  status: 'asking' | 'right' | 'reveal' | 'done';
  predicted: number | null;
  theme: { text: string; border: string };
  onPredict: (index: number) => void;
}) {
  const revealing = status === 'reveal';
  const correct = predicted === q.answer;
  const positive = q.answer === 0; // labels[0]=うく/くっつく
  // 結果アニメ: うく/くっつく=うえ(-70)へ、しずむ/つかない=した(70)へ
  const revealY = revealing ? (positive ? -70 : 70) : 0;

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <motion.div
        key={`p-${q.itemEmoji}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-2 rounded-2xl bg-white/80 px-5 py-3 text-center text-xl font-bold ${theme.text} shadow`}
      >
        {q.prompt}
      </motion.div>

      {/* しらべる ゾーン（したはん分に みずめん／じしゃく面の イメージ） */}
      <div className="relative mt-6 flex h-56 w-64 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white/50 shadow-inner">
        {/* めん（うえ 1/3 から した） */}
        <div className="pointer-events-none absolute inset-x-0 top-1/3 bottom-0 bg-sky-200/40" />
        <div className="pointer-events-none absolute inset-x-0 top-1/3 h-1 bg-sky-300/60" />
        <motion.div
          animate={{ y: revealY, rotate: revealing && !positive ? [0, -8, 8, 0] : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          className="z-10 text-7xl drop-shadow"
        >
          {q.itemEmoji}
        </motion.div>
        {/* 結果バッジ */}
        {revealing && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-gray-700 shadow"
          >
            {q.labels?.[q.answer]}
          </motion.span>
        )}
      </div>

      {/* 予想ボタン（reveal 中は 予想＝◯、正解＝わく）or りゆう */}
      {revealing ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-5 flex flex-col items-center gap-2 px-4 text-center"
        >
          <span className={`text-lg font-bold ${correct ? 'text-emerald-600' : 'text-amber-600'}`}>
            {correct ? '🎉 あたり！' : '👀 みてみて！'}
          </span>
          <span className={`rounded-2xl bg-white/85 px-4 py-2 text-base font-bold ${theme.text} shadow`}>{q.reason}</span>
        </motion.div>
      ) : (
        <div className="mt-auto mb-10 flex w-full max-w-sm gap-4">
          {q.labels?.map((label, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => onPredict(i)}
              disabled={status !== 'asking'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.94 }}
              className={`flex-1 rounded-3xl border-4 border-white bg-white/90 px-3 py-5 text-xl font-bold ${theme.text} shadow-[0_5px_0_#a7f3d0]`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
