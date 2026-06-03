import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { ShapeHintGate } from '../components/ShapeHintGate';
import { PatternIcon, PatternSequence } from '../components/shapes/ShapeVisuals';
import { generatePatternProblem, type PatternProblem } from '../lib/geometry/pattern';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-pattern';

interface Props {
  characterName: string;
  characterId: string;
  hard?: boolean;
  onExit: () => void;
}

export function ShapePatternUnit({ hard = false, onExit }: Props) {
  const [problem, setProblem] = useState<PatternProblem>(() => generatePatternProblem(hard));
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
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
        setProblem(generatePatternProblem(hard));
        processing.current = false;
      }, 900);
    }
  }

  function handlePick(idx: number) {
    if (processing.current) return;
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

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-purple-200 to-violet-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-purple-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-purple-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#6d28d9] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-purple-100 to-violet-50 p-6">
      <div className="self-stretch flex items-center justify-between text-sm text-purple-700 font-bold">
        <span>といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        {hard && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-600 text-xs font-bold">むずかしい</span>}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-purple-900 text-center"
      >
        ならんでいる かたちを みよう。<br />つぎは どれ？
      </motion.h2>

      <div className="rounded-3xl bg-white shadow-lg px-6 py-5 w-full max-w-sm flex flex-col items-center gap-3">
        <PatternSequence sequence={problem.sequence} />
      </div>

      <p className="text-purple-700 font-bold">「？」に はいるのは どれ？</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-purple-200 p-4 flex items-center justify-center shadow-md"
          >
            <PatternIcon item={choice} size={52} />
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

      <button type="button" onClick={onExit} className="mt-2 text-sm text-purple-600 underline">やめる</button>

      {reviewing && (
        <ShapeHintGate
          message={'まえから じゅんばんに みてみよう。\nおなじ ならびが くりかえして いるよ。\nつぎに くるのは どれかな？'}
          context={<div className="rounded-3xl bg-white shadow px-5 py-4 max-w-sm"><PatternSequence sequence={problem.sequence} /></div>}
          count={problem.choices.length}
          answerIndex={problem.answerIndex}
          renderChoice={(idx) => <PatternIcon item={problem.choices[idx]} size={48} />}
          onSolved={registerCorrect}
        />
      )}
    </div>
  );
}
