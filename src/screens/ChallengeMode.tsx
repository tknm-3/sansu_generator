import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateProblem, checkAnswer, ALL_SKILL_IDS, type Problem } from '../lib/challenge/problemGen';
import { pickNextSkill, type SkillWeight } from '../lib/challenge/spacedRepetition';
import { loadMastery, saveMastery, recordAnswer } from '../lib/mastery';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

const QUESTIONS_PER_SESSION = 10;
const STAMP_KEY = 'math-app:stamps';

const SKILL_WEIGHTS: SkillWeight[] = ALL_SKILL_IDS.map((id) => ({ skillId: id, weight: 1 }));

interface Props {
  characterName: string;
  onExit: () => void;
}

function nextProblem(): Problem {
  const mastery = loadMastery();
  const skillId = pickNextSkill(mastery, SKILL_WEIGHTS, Date.now());
  return generateProblem(skillId);
}

export function ChallengeMode({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<Problem>(() => nextProblem());
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = answered >= QUESTIONS_PER_SESSION;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const isCorrect = checkAnswer(problem, value);
    saveMastery(recordAnswer(loadMastery(), problem.skillId, isCorrect, Date.now()));
    if (isCorrect) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      const nextAnswered = answered + 1;
      const nextCorrect = correct + 1;
      setAnswered(nextAnswered);
      setCorrect(nextCorrect);
      setFeedback('none');
      if (nextAnswered >= QUESTIONS_PER_SESSION) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), 'challenge', Date.now()));
        playSfx('fanfare');
        speakJa('チャレンジ クリア！ すごい！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setProblem(nextProblem());
          processing.current = false;
        }, 800);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど！');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🏆</motion.div>
        <p className="text-2xl font-bold text-green-700">チャレンジ クリア！</p>
        <p className="text-xl text-amber-800">{correct} / {QUESTIONS_PER_SESSION} せいかい！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-purple-200 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-bold text-amber-700">もんだい {answered + 1} / {QUESTIONS_PER_SESSION}</span>
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">せいかい {correct}</span>
      </div>
      <Companion name={characterName} expression={expression} message={problem.questionText} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-3xl font-bold text-amber-900 text-center">
        {problem.questionText}
      </div>
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
