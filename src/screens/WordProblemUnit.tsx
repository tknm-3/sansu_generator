import { useEffect, useRef, useState } from 'react';
import { setBgmTrack } from '../features/sound/bgm';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';
import {
  generateWordProblem,
  checkVerdict,
  checkDiff,
  type WordProblem,
  type WordVerdict,
  type WordVariant,
} from '../lib/math/wordProblem';

const QUESTIONS_PER_UNIT = 3;

interface Props {
  variant: WordVariant;
  characterName: string;
  characterId: string;
  onExit: () => void;
}

const VERDICT_BUTTONS: { value: WordVerdict; emoji: string; bg: string }[] = [
  { value: 'ぴったり', emoji: '✅', bg: 'bg-green-500 shadow-[0_4px_0_#166534] hover:bg-green-600' },
  { value: 'あまる',   emoji: '📦', bg: 'bg-orange-400 shadow-[0_4px_0_#9a3412] hover:bg-orange-500' },
  { value: 'たりない', emoji: '😢', bg: 'bg-red-400 shadow-[0_4px_0_#991b1b] hover:bg-red-500' },
];

export function WordProblemUnit({ variant, characterName, characterId, onExit }: Props) {
  const [problem, setProblem] = useState<WordProblem>(() => generateWordProblem(variant));
  const [step, setStep] = useState<'verdict' | 'quantity'>('verdict');
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const processing = useRef(false);
  const skillId = variant;

  useEffect(() => { setBgmTrack('addition'); }, []);

  const cleared = solved >= QUESTIONS_PER_UNIT;

  function nextProblem() {
    setProblem(generateWordProblem(variant));
    setStep('verdict');
    setFeedback('none');
    setExpression('normal');
    processing.current = false;
  }

  function onCorrect(nextSolved: number) {
    playSfx('correct');
    setExpression('happy');
    setFeedback('none');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setSolved(nextSolved);
    if (nextSolved >= QUESTIONS_PER_UNIT) {
      saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), skillId, Date.now()));
      playSfx('fanfare');
      speakJa('クリア！ よくできたね！');
    } else {
      setTimeout(nextProblem, 900);
    }
  }

  function handleVerdictPick(v: WordVerdict) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkVerdict(problem, v);
    saveMastery(recordAnswer(loadMastery(), skillId, correct, Date.now()));
    if (correct) {
      if (problem.verdict === 'ぴったり') {
        onCorrect(solved + 1);
      } else {
        playSfx('correct');
        setExpression('happy');
        setFeedback('none');
        speakJa('そう！ では、なんこ？');
        setTimeout(() => {
          setExpression('normal');
          setStep('quantity');
          processing.current = false;
        }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど かんがえてみよう');
      processing.current = false;
    }
  }

  function handleDiffPick(d: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkDiff(problem, d);
    saveMastery(recordAnswer(loadMastery(), skillId, correct, Date.now()));
    if (correct) {
      onCorrect(solved + 1);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-emerald-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          className="text-5xl"
        >⭐</motion.div>
        <button
          type="button" onClick={onExit}
          className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 transition-all"
        >
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-emerald-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>

      <Companion
        name={characterName}
        characterId={characterId}
        expression={expression}
        message={problem.text}
      />

      {step === 'verdict' && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-xl font-bold text-amber-800">どれかな？</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {VERDICT_BUTTONS.map(({ value, emoji, bg }) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => handleVerdictPick(value)}
                disabled={expression === 'happy'}
                whileTap={{ scale: 0.93, y: 3 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className={`rounded-2xl px-6 py-4 text-xl font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${bg}`}
              >
                {emoji} {value}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {step === 'quantity' && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-xl font-bold text-amber-800">{problem.step2Question}</p>
          <AnswerButtons
            choices={problem.diffChoices}
            onPick={handleDiffPick}
            disabled={expression === 'happy'}
          />
        </div>
      )}

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

      <button type="button" onClick={onExit} className="mt-auto text-sm text-amber-600 underline">
        やめる
      </button>
    </div>
  );
}
