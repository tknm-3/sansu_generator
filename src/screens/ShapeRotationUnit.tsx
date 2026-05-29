import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { ShapeSvg } from '../components/shapes/ShapeSvg';
import { ShapeHintGate } from '../components/ShapeHintGate';
import { generateRotationProblem, type RotationProblem } from '../lib/geometry/rotation';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-rotation';

interface Props {
  characterName: string;
  characterId: string;
  hard?: boolean;
  onExit: () => void;
}

export function ShapeRotationUnit({ hard = false, onExit }: Props) {
  const [problem, setProblem] = useState<RotationProblem>(() => generateRotationProblem(hard));
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [showAnswer, setShowAnswer] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const processing = useRef(false);
  useEffect(() => { setBgmTrack(SKILL_ID); }, []);

  const cleared = solved >= QUESTIONS_PER_UNIT;

  function registerCorrect() {
    processing.current = true;
    playSfx('correct');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    const next = solved + 1;
    setSolved(next);
    setFeedback('none');
    setReviewing(false);
    if (next >= QUESTIONS_PER_UNIT) {
      saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
      playSfx('fanfare');
      speakJa('クリア！ よくできたね！');
    } else {
      setTimeout(() => {
        setProblem(generateRotationProblem(hard));
        setShowAnswer(false);
        setDemoDone(false);
        processing.current = false;
      }, 900);
    }
  }

  function handlePick(idx: number) {
    if (processing.current || showAnswer) return;
    processing.current = true;
    playSfx('tap');
    if (idx === problem.answerIndex) {
      registerCorrect();
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setReviewing(true);
      speakJa('おしい！ いっしょに かんがえてみよう');
      processing.current = false;
    }
  }

  function handleShowDemo() {
    if (showAnswer) return;
    setDemoDone(false);
    setShowAnswer(true);
    playSfx('tap');
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
      <div className="self-stretch flex items-center justify-between">
        <span className="text-sm text-teal-700 font-bold">といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        {hard && <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-bold text-white">🔥 むずかしい</span>}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-teal-900 text-center"
      >
        {problem.transform.flipX ? 'うらがえしたら どのかたち？' : 'まわしたら どのかたち？'}
      </motion.h2>

      <div className="rounded-3xl bg-white shadow-lg p-6 flex flex-col items-center gap-3 w-full max-w-sm">
        <div className="rounded-xl bg-amber-100 px-4 py-2 text-center">
          <p className="text-lg font-bold text-amber-800">{problem.rotationLabel}</p>
        </div>

        <div className="flex items-center gap-6 mt-2">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-teal-600 font-bold">まえ</p>
            <ShapeSvg shapeId={problem.shapeId} transform={{ rotate: 0, flipX: false }} size={90} color="#f59e0b" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">➡️</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-teal-600 font-bold">あと</p>
            {showAnswer ? (
              demoDone ? (
                <ShapeSvg shapeId={problem.shapeId} transform={problem.transform} size={90} color="#34d399" />
              ) : (
                <motion.div
                  initial={{ rotate: 0, scaleX: 1 }}
                  animate={{ rotate: problem.transform.rotate, scaleX: problem.transform.flipX ? -1 : 1 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  onAnimationComplete={() => setDemoDone(true)}
                >
                  <ShapeSvg shapeId={problem.shapeId} transform={{ rotate: 0, flipX: false }} size={90} color="#34d399" />
                </motion.div>
              )
            ) : (
              <div className="w-24 h-24 rounded-2xl border-4 border-dashed border-teal-300 flex items-center justify-center text-teal-400 text-3xl">？</div>
            )}
          </div>
        </div>

        {!showAnswer && (
          <button
            type="button"
            onClick={handleShowDemo}
            className="mt-2 rounded-2xl bg-amber-400 px-5 py-2 text-base font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1"
          >
            {problem.transform.flipX ? '🪞 うらがえして みる（おてほん）' : '🔄 まわして みる（おてほん）'}
          </button>
        )}
      </div>

      <p className="text-teal-700 font-bold">どれになる？</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-teal-200 p-4 flex items-center justify-center shadow-md"
          >
            <ShapeSvg shapeId={problem.shapeId} transform={choice} size={70} color="#60a5fa" />
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

      {reviewing && (
        <ShapeHintGate
          message={`${problem.transform.flipX ? 'かがみに うつすと、ひだりと みぎが いれかわるよ。' : 'まわすと、かたちの むきが かわるよ。'}\n「${problem.rotationLabel}」を あたまの なかで やってみよう。`}
          context={
            <div className="rounded-3xl bg-white shadow px-6 py-4 flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-teal-600 font-bold">まえ</p>
                <ShapeSvg shapeId={problem.shapeId} transform={{ rotate: 0, flipX: false }} size={80} color="#f59e0b" />
              </div>
              <span className="text-2xl">➡️</span>
              <div className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">{problem.rotationLabel}</div>
            </div>
          }
          count={problem.choices.length}
          answerIndex={problem.answerIndex}
          renderChoice={(idx) => <ShapeSvg shapeId={problem.shapeId} transform={problem.choices[idx]} size={64} color="#60a5fa" />}
          onSolved={registerCorrect}
        />
      )}
    </div>
  );
}
