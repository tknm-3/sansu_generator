import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { generateSpatialProblem, type SpatialProblem, type SceneObj } from '../lib/geometry/spatial';

const QUESTIONS_PER_UNIT = 3;
const SKILL_ID = 'shape-spatial';

interface Props {
  characterName: string;
  characterId: string;
  hard?: boolean;
  onExit: () => void;
}

const CELL = 72;
const PAD = 16;
const OBJ_R = 26;

function SceneDisplay({ objects }: { objects: SceneObj[] }) {
  const cols = Math.max(...objects.map((o) => o.col)) + 1;
  const rows = Math.max(...objects.map((o) => o.row)) + 1;
  const w = cols * CELL + PAD * 2;
  const h = rows * CELL + PAD * 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={PAD + c * CELL}
            y={PAD + r * CELL}
            width={CELL}
            height={CELL}
            fill="#f0fdf4"
            stroke="#86efac"
            strokeWidth="1.5"
            rx="8"
          />
        ))
      )}
      {objects.map((obj) => {
        const cx = PAD + obj.col * CELL + CELL / 2;
        const cy = PAD + obj.row * CELL + CELL / 2;
        return (
          <g key={obj.name}>
            <circle cx={cx} cy={cy} r={OBJ_R} fill="white" stroke="#6ee7b7" strokeWidth="2" />
            <text x={cx} y={cy + 2} fontSize="22" textAnchor="middle" dominantBaseline="middle">
              {obj.emoji}
            </text>
            <text x={cx} y={cy + OBJ_R + 11} fontSize="10" textAnchor="middle" fill="#374151" fontFamily="sans-serif">
              {obj.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ShapeSpatialUnit({ hard = false, onExit }: Props) {
  const [problem, setProblem] = useState<SpatialProblem>(() => generateSpatialProblem(hard));
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
          setProblem(generateSpatialProblem(hard));
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-cyan-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-sky-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-sky-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#0369a1] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-sky-100 to-cyan-50 p-6">
      <div className="self-stretch flex items-center justify-between text-sm text-sky-700 font-bold">
        <span>といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        {hard && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-600 text-xs font-bold">むずかしい</span>}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-sky-900 text-center"
      >
        {problem.questionLabel}
      </motion.h2>

      <div className="rounded-3xl bg-white shadow-lg px-4 py-5 flex flex-col items-center gap-3 overflow-x-auto">
        <SceneDisplay objects={problem.objects} />
      </div>

      <p className="text-lg font-bold text-sky-800 text-center">{problem.question}</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {problem.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handlePick(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-white border-2 border-sky-200 py-4 text-xl font-bold text-sky-900 shadow-md"
          >
            {choice}
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

      <button type="button" onClick={onExit} className="mt-2 text-sm text-sky-600 underline">やめる</button>
    </div>
  );
}
