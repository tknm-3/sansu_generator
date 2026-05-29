import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { ShapeHintGate } from '../components/ShapeHintGate';
import { generateComposeProblem, type ComposeProblem } from '../lib/geometry/compose';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-compose';

interface Props {
  characterName: string;
  characterId: string;
  hard?: boolean;
  onExit: () => void;
}

function SvgChoice({ svg, size = 120 }: { svg: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 200 120"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function ShapeComposeUnit({ hard = false, onExit }: Props) {
  const [problem, setProblem] = useState<ComposeProblem>(() => generateComposeProblem(hard));
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [reviewing, setReviewing] = useState(false);
  const processing = useRef(false);
  useEffect(() => { setBgmTrack(SKILL_ID); }, []);

  const cleared = solved >= QUESTIONS_PER_UNIT;

  // 正解時の共通処理（本問・ヒントの両方から呼ぶ）
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
        setProblem(generateComposeProblem(hard));
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
        {problem.questionLabel}
      </motion.h2>

      {/* お題 */}
      <div className="rounded-3xl bg-white shadow-lg px-8 py-5 flex items-center justify-center">
        <SvgChoice svg={problem.questionSvg} size={160} />
      </div>

      <p className="text-teal-700 font-bold">こたえは どれ？</p>

      {/* 4択 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-teal-200 p-3 flex flex-col items-center gap-1 shadow-md"
          >
            <SvgChoice svg={choice.svg} size={110} />
            <span className="text-xs text-teal-700 font-bold">{choice.label}</span>
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
          message={'おだいの かたちを よく みてね。\n2つの かたちを あわせると どの かたちに なるかな？'}
          context={<div className="rounded-3xl bg-white shadow px-6 py-4"><SvgChoice svg={problem.questionSvg} size={150} /></div>}
          count={problem.choices.length}
          answerIndex={problem.answerIndex}
          renderChoice={(idx) => (
            <div className="flex flex-col items-center gap-1">
              <SvgChoice svg={problem.choices[idx].svg} size={96} />
              <span className="text-xs text-teal-700 font-bold">{problem.choices[idx].label}</span>
            </div>
          )}
          onSolved={registerCorrect}
        />
      )}
    </div>
  );
}
