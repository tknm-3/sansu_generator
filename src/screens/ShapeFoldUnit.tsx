import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { generateFoldProblem, type FoldProblem } from '../lib/geometry/fold';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-fold';

interface Props {
  characterName: string;
  characterId: string;
  hard?: boolean;
  onExit: () => void;
}

function SvgView({ svg, viewBox, w, h }: { svg: string; viewBox: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox={viewBox} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

export function ShapeFoldUnit({ hard = false, onExit }: Props) {
  const [problem, setProblem] = useState<FoldProblem>(() => generateFoldProblem(hard));
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const processing = useRef(false);
  useEffect(() => { setBgmTrack(SKILL_ID); }, []);

  const cleared = solved >= QUESTIONS_PER_UNIT;

  function handlePick(idx: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    if (idx === problem.answerIndex) {
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
          setProblem(generateFoldProblem(hard));
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

  const isDouble = !!problem.intermediarySvg;

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-amber-50 to-yellow-50 p-6">
      <div className="self-stretch flex items-center justify-between text-sm text-teal-700 font-bold">
        <span>といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        {hard && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-600 text-xs font-bold">むずかしい</span>}
      </div>

      <motion.h2
        key={problem.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-amber-900 text-center"
      >
        {problem.questionLabel}
      </motion.h2>

      <div className="rounded-3xl bg-white shadow-lg px-4 py-4 flex flex-col items-center gap-3">
        {isDouble ? (
          // 2かいおり: たてに ならべる
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-emerald-600 font-bold">① まず おる</p>
              <SvgView svg={problem.beforeSvg} viewBox="0 0 180 110" w={150} h={92} />
            </div>
            <div className="text-2xl text-amber-400 font-bold">▼</div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-blue-500 font-bold">② つぎに おる</p>
              <SvgView svg={problem.intermediarySvg!} viewBox="0 0 180 110" w={150} h={92} />
            </div>
            <div className="text-2xl text-amber-400 font-bold">▼</div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-amber-500 font-bold">③ おって きった</p>
              <SvgView svg={problem.foldSvg} viewBox="0 0 180 110" w={150} h={92} />
            </div>
          </div>
        ) : (
          // 1かいおり: よこに ならべる
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-emerald-600 font-bold">① こう おる</p>
              <SvgView svg={problem.beforeSvg} viewBox="0 0 180 110" w={150} h={92} />
            </div>
            <div className="text-2xl text-amber-400 font-bold">▶</div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-amber-500 font-bold">② おって きった</p>
              <SvgView svg={problem.foldSvg} viewBox="0 0 180 110" w={150} h={92} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs text-slate-600 bg-white/70 rounded-2xl px-4 py-2 border border-amber-100">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3 rounded-sm inline-block bg-yellow-100 border-2 border-amber-500" />
          おもて
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3 rounded-sm inline-block bg-blue-100 border border-dashed border-blue-300" />
          うら（おった ところ）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3 rounded-sm inline-block bg-red-300 border border-red-500" />
          きった ところ
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,3" />
          </svg>
          おりめ
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="10" viewBox="0 0 22 10">
            <line x1="0" y1="5" x2="16" y2="5" stroke="#16a34a" strokeWidth="2" />
            <polygon points="14,1 22,5 14,9 16,5" fill="#16a34a" />
          </svg>
          おる むき
        </span>
      </div>

      <p className="text-amber-700 font-bold">ひらいたら どれ？</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-amber-200 p-3 flex items-center justify-center shadow-md"
          >
            <SvgView svg={choice.svg} viewBox="0 0 80 80" w={80} h={80} />
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

      <button type="button" onClick={onExit} className="mt-2 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
