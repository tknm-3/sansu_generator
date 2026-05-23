import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { CherryBranch } from '../components/CherryBranch';
import { StepIndicator } from '../components/StepIndicator';
import {
  generateCarryProblem,
  checkCarry,
  decompose,
  type CarryProblem,
} from '../lib/math/cherryCalc';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'cherry-calc';

interface Props {
  characterName: string;
  onExit: () => void;
}

// hint step: 0=none, 1=show branch
type HintStep = 0 | 1;

export function CherryCalcUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<CarryProblem>(() => generateCarryProblem());
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [hintStep, setHintStep] = useState<HintStep>(0);
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  const dec = decompose(problem.a, problem.b);

  function nextProblem() {
    setProblem(generateCarryProblem());
    setHintStep(0);
    setExpression('normal');
    processing.current = false;
  }

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkCarry(problem, value);
    saveMastery(recordAnswer(loadMastery(), SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct');
      setExpression('happy');
      setFeedback('none');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(nextProblem, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      if (hintStep < 1) setHintStep((h) => (h + 1) as HintStep);
      speakJa('おしい！ さくらんぼを みてみよう');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-pink-100 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-pink-100 to-amber-50 p-6">
      <div className="self-stretch flex items-center justify-between text-sm text-amber-700 font-bold">
        <span>といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        <StepIndicator total={QUESTIONS_PER_UNIT} current={solved} />
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={`${problem.a} ＋ ${problem.b} を さくらんぼ計算で とこう！`}
      />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-5 text-5xl font-bold text-pink-900">
        {problem.a} ＋ {problem.b} ＝ ？
      </div>

      <AnimatePresence>
        {hintStep >= 1 && (
          <motion.div
            key="branch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow p-4"
          >
            <p className="text-center text-sm text-pink-600 font-bold mb-2">
              {problem.b} を {dec.split} と {dec.carry} に わけよう
            </p>
            <CherryBranch b={problem.b} split={dec.split} carry={dec.carry} visible />
            <p className="text-center text-sm text-gray-500 mt-2">
              {problem.a} ＋ {dec.split} ＝ 10 ／ 10 ＋ {dec.carry}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />

      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ さくらんぼを つかってみよう！
          </motion.p>
        )}
      </AnimatePresence>

      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
