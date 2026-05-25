import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { generateViewpointProblem, type ViewpointProblem } from '../lib/geometry/viewpoint';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-viewpoint';

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

function IsometricView({ svg }: { svg: string }) {
  return (
    <svg
      width={200}
      height={140}
      viewBox="0 0 200 140"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function TopView({ svg }: { svg: string }) {
  return (
    <svg
      width={90}
      height={90}
      viewBox="0 0 120 120"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function ShapeViewpointUnit({ onExit }: Props) {
  const [problem, setProblem] = useState<ViewpointProblem>(() => generateViewpointProblem());
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
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
          setProblem(generateViewpointProblem());
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
        {problem.questionLabel}
      </motion.h2>

      {/* 等角投影図 */}
      <div className="rounded-3xl bg-white shadow-lg px-6 py-4 flex flex-col items-center gap-2">
        <p className="text-xs text-teal-500 font-bold">つみ木のかたち（ななめから）</p>
        <IsometricView svg={problem.isoSvg} />
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl">👁️</span>
          <span className="text-sm text-teal-600 font-bold">↑ うえから みると？</span>
        </div>
      </div>

      <p className="text-teal-700 font-bold">どれ？</p>

      {/* 4択 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.topViewChoices.map((svg, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-teal-200 p-3 flex items-center justify-center shadow-md"
          >
            <TopView svg={svg} />
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
