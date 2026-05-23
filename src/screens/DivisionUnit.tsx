import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateDivision, checkDivision, type DivisionProblem } from '../lib/math/division';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'division';
const SHARE_EMOJI = ['🍬', '🎀', '⭐', '🍪', '🌸'];

interface Props {
  characterName: string;
  onExit: () => void;
}

function ShareVisual({ problem, emoji }: { problem: DivisionProblem; emoji: string }) {
  const groups = Array.from({ length: problem.divisor }, (_, gi) =>
    Array.from({ length: problem.quotient }, (_, ii) => gi * problem.quotient + ii)
  );
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex gap-3 justify-center flex-wrap max-w-sm">
      {groups.map((items, gi) => (
        <div key={gi} className="flex flex-col items-center gap-1">
          <div className="flex gap-1 flex-wrap justify-center">
            {items.map((idx) => (
              <motion.span
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.04, type: 'spring' }}
                className="text-xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
          <span className="text-xs text-gray-500">{gi + 1}人め</span>
        </div>
      ))}
    </div>
  );
}

export function DivisionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<DivisionProblem>(() => generateDivision());
  const [emoji] = useState(() => SHARE_EMOJI[Math.floor(Math.random() * SHARE_EMOJI.length)]);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkDivision(problem, value);
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
        setTimeout(() => { setExpression('normal'); setProblem(generateDivision()); processing.current = false; }, 900);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-purple-100 to-amber-50 p-8">
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
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-purple-100 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={`${emoji} が ${problem.dividend}こ。${problem.divisor}人で わけると ひとり なんこ？`}
      />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-5 text-5xl font-bold text-purple-900">
        {problem.dividend} ÷ {problem.divisor} ＝ ？
      </div>
      <ShareVisual problem={problem} emoji={emoji} />
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
