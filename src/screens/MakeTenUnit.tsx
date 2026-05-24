import { useEffect, useMemo, useRef, useState } from 'react';
import { setBgmTrack } from '../features/sound/bgm';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { MakeTenFrame } from '../components/MakeTenFrame';
import { AnswerButtons } from '../components/AnswerButtons';
import { StepExplainer } from '../components/StepExplainer';
import { missingToTen, isCorrectMissing, makeAnswerChoices, explainMakeTen } from '../lib/math/makeTen';
import { pickScenario } from '../data/scenarios';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

const QUESTIONS_PER_UNIT = 3;

interface Props {
  characterName: string;
  onExit: () => void;
}

function newCurrent(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export function MakeTenUnit({ characterName, onExit }: Props) {
  const [current, setCurrent] = useState(newCurrent);
  const [scenario, setScenario] = useState(() => pickScenario('make-ten'));
  const fruit = scenario.emoji;
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [flash, setFlash] = useState(false);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => { setBgmTrack('make-ten'); }, []);
  const choices = useMemo(() => makeAnswerChoices(current), [current]);
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    if (isCorrectMissing(current, value)) {
      playSfx('correct');
      setExpression('happy');
      setFlash(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, 'make-ten', Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setFlash(false);
          setCurrent(newCurrent());
          setScenario(pickScenario('make-ten'));
          processing.current = false;
        }, 900);
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="text-7xl"
        >
          🎉
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-green-700"
        >
          クリア！ スタンプ ゲット！
        </motion.p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          className="text-5xl"
        >
          ⭐
        </motion.div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 active:shadow-none transition-all"
        >
          ホームに もどる
        </button>
      </div>
    );
  }

  const missing = missingToTen(current);
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={scenario.build({ a: current, b: missingToTen(current) })}
      />
      <MakeTenFrame filled={current} fruit={fruit} flash={flash} />
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
      <AnswerButtons choices={choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p
            key="wrong"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-lg font-bold text-orange-600"
          >
            おしい！ もういちど やってみよう（ヒント：あと {missing}こ）
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">
        やめる
      </button>
      {showHint && (<StepExplainer steps={explainMakeTen(current, fruit)} problem={`${current} ＋ ？ ＝ 10`} onClose={() => setShowHint(false)} />)}
    </div>
  );
}
