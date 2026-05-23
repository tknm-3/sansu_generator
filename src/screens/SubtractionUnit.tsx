import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateSubtraction, checkSubtraction, type SubtractionProblem } from '../lib/math/subtraction';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'subtraction';
const FOODS = ['🍎', '🍊', '🍇', '🍓', '🍌'];

interface Props {
  characterName: string;
  onExit: () => void;
}

export function SubtractionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<SubtractionProblem>(() => generateSubtraction());
  const [food] = useState(() => FOODS[Math.floor(Math.random() * FOODS.length)]);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkSubtraction(problem, value);
    saveMastery(recordAnswer(loadMastery(), SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => { setExpression('normal'); setProblem(generateSubtraction()); processing.current = false; }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど やってみよう');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  const answer = problem.a - problem.b;
  const message = `${food}が ${problem.a}こ あります。${problem.b}こ たべたら のこりは？`;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion name={characterName} expression={expression} message={message} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
        {problem.a} － {problem.b} ＝ ？
      </div>
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <div className="text-6xl">{food.repeat(Math.max(0, answer))}</div>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
