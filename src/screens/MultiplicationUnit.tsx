import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateMultiplication, checkMultiplication, type MultiplicationProblem } from '../lib/math/multiplication';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'multiplication';
const GROUP_EMOJI = ['🍭', '🌟', '🎈', '🍪', '🎀'];

interface Props {
  characterName: string;
  onExit: () => void;
}

function GroupVisual({ problem, emoji }: { problem: MultiplicationProblem; emoji: string }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 justify-center max-w-xs">
      {Array.from({ length: problem.a }).map((_, gi) => (
        <div key={gi} className="flex gap-1">
          {Array.from({ length: problem.b }).map((_, ii) => (
            <motion.span
              key={ii}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (gi * problem.b + ii) * 0.03, type: 'spring' }}
              className="text-2xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MultiplicationUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<MultiplicationProblem>(() => generateMultiplication());
  const [emoji] = useState(() => GROUP_EMOJI[Math.floor(Math.random() * GROUP_EMOJI.length)]);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkMultiplication(problem, value);
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
        setTimeout(() => { setExpression('normal'); setProblem(generateMultiplication()); processing.current = false; }, 900);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-yellow-100 to-amber-50 p-8">
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
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={`${emoji} が ${problem.b}こ ずつ ${problem.a}グループ。ぜんぶで なんこ？`}
      />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-5 text-5xl font-bold text-amber-900">
        {problem.a} ✕ {problem.b} ＝ ？
      </div>
      <GroupVisual problem={problem} emoji={emoji} />
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
