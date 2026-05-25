import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { ShapeSvg } from '../components/shapes/ShapeSvg';
import { generateRotationProblem, type RotationProblem } from '../lib/geometry/rotation';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-rotation';

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

export function ShapeRotationUnit({ onExit }: Props) {
  const [problem, setProblem] = useState<RotationProblem>(() => generateRotationProblem());
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [showAnswer, setShowAnswer] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const processing = useRef(false);
  useEffect(() => { setBgmTrack(SKILL_ID); }, []);

  const cleared = solved >= QUESTIONS_PER_UNIT;

  function handlePick(idx: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = idx === problem.answerIndex;
    if (correct) {
      playSfx('correct');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const next = solved + 1;
      setSolved(next);
      setFeedback('none');
      if (next >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setProblem(generateRotationProblem());
          setShowAnswer(false);
          processing.current = false;
        }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      speakJa('おしい！ もういちど やってみよう');
      processing.current = false;
    }
  }

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);
    setShowAnswer(true);
    playSfx('tap');
    setTimeout(() => setSpinning(false), 800);
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-emerald-200 to-teal-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-teal-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-teal-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#00695c] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-emerald-100 to-teal-50 p-6">
      <div className="self-stretch text-sm text-teal-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-teal-900 text-center"
      >
        まわしたら どのかたち？
      </motion.h2>

      {/* お題 */}
      <div className="rounded-3xl bg-white shadow-lg p-6 flex flex-col items-center gap-3 w-full max-w-sm">
        {/* 回転量ラベル（大きく表示） */}
        <div className="rounded-xl bg-amber-100 px-4 py-2 text-center">
          <p className="text-lg font-bold text-amber-800">{problem.rotationLabel}</p>
        </div>

        <div className="flex items-center gap-6 mt-2">
          {/* 元の形 */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-teal-600 font-bold">まえ</p>
            <ShapeSvg shapeId={problem.shapeId} transform={{ rotate: 0, flipX: false }} size={90} color="#f59e0b" />
          </div>

          {/* 矢印 */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">➡️</span>
          </div>

          {/* 回転後 */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-teal-600 font-bold">あと</p>
            <motion.div
              animate={spinning ? { rotate: [0, problem.transform.rotate] } : {}}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              {showAnswer ? (
                <ShapeSvg shapeId={problem.shapeId} transform={problem.transform} size={90} color="#34d399" />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-dashed border-teal-300 flex items-center justify-center text-teal-400 text-3xl">？</div>
              )}
            </motion.div>
          </div>
        </div>

        {/* アニメーションで確かめるボタン */}
        {!showAnswer && (
          <button
            type="button"
            onClick={handleSpin}
            className="mt-2 rounded-2xl bg-amber-400 px-5 py-2 text-base font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1"
          >
            🔄 まわして たしかめる
          </button>
        )}
      </div>

      {/* 4択 */}
      <p className="text-teal-700 font-bold">どれになる？</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-teal-200 p-4 flex flex-col items-center justify-center gap-1 shadow-md"
          >
            <ShapeSvg shapeId={problem.shapeId} transform={choice} size={70} color="#60a5fa" />
            <span className="text-xs text-teal-500 font-bold">
              {choice.rotate === 0 && !choice.flipX ? 'もとのまま' :
               choice.rotate === 90 && !choice.flipX ? '右90度' :
               choice.rotate === 180 && !choice.flipX ? '180度' :
               choice.rotate === 270 && !choice.flipX ? '左90度' :
               choice.flipX ? `${choice.rotate}度+うら` : `${choice.rotate}度`}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p
            key="w"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }}
            exit={{ opacity: 0 }}
            className="text-lg font-bold text-orange-600"
          >
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>

      <button type="button" onClick={onExit} className="mt-2 text-sm text-teal-600 underline">やめる</button>
    </div>
  );
}
