import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJa } from '../../features/speech/tts';
import { playSfx } from '../../features/sound/sfx';
import { PLAYER_STYLES, type Player } from './types';
import { type PredictQuiz } from './logic';

const RESULT_MS = 2200;

interface Props {
  quiz: PredictQuiz | null;
  player: Player | null;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}

function PredictCard({ quiz, player, styleIdx, onAnswer }: {
  quiz: PredictQuiz; player: Player; styleIdx: number; onAnswer: (correct: boolean) => void;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    speakJa(`いま ${quiz.from} マスめ。${quiz.roll} すすむと？`);
  }, [quiz.from, quiz.roll]);

  function pick(value: number) {
    if (chosen !== null) return;
    setChosen(value);
    const correct = value === quiz.target;
    playSfx(correct ? 'correct' : 'wrong');
    speakJa(correct ? 'せいかい！ ボーナスで すすめるよ！' : `${quiz.target} だね`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  return (
    <>
      <div className="text-3xl mb-1">🎲</div>
      <div className="text-base font-bold text-gray-500 mb-2">
        {player.character} {player.name}・ボーナスチャンス！
      </div>

      {/* いまいるマスと出た目をはっきり見せる */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="rounded-xl bg-gray-100 px-3 py-1 text-lg font-bold text-gray-700">
          いま <span className={s.text}>{quiz.from}</span> マスめ
        </span>
        <span className="rounded-xl bg-amber-100 px-3 py-1 text-lg font-bold text-amber-700">
          🎲 {quiz.roll} が でた！
        </span>
      </div>

      <div className="text-2xl font-bold text-gray-800 mb-1">
        {quiz.roll} すすむと どこに とまる？
      </div>
      <div className="text-sm text-gray-400 mb-5">
        {quiz.from} ＋ {quiz.roll} は いくつ？
      </div>

      {/* 4択（たし算の答えを選ぶ） */}
      <div className="grid grid-cols-2 gap-3">
        {quiz.choices.map((n, i) => {
          const isAnswer = n === quiz.target;
          const isChosen = chosen === n;
          const revealed = chosen !== null;
          const cls = !revealed
            ? `bg-white border-2 ${s.border} ${s.text} hover:scale-105`
            : isAnswer
            ? 'bg-emerald-500 text-white border-2 border-emerald-600'
            : isChosen
            ? 'bg-gray-200 text-gray-400 border-2 border-gray-300'
            : 'bg-white text-gray-300 border-2 border-gray-200';
          return (
            <motion.button key={i} type="button" disabled={revealed}
              whileTap={!revealed ? { scale: 0.92 } : undefined} onClick={() => pick(n)}
              className={`rounded-3xl py-6 text-4xl font-black shadow transition-all ${cls}`}>
              {n}
            </motion.button>
          );
        })}
      </div>

      {chosen !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-xl font-bold ${chosen === quiz.target ? 'text-emerald-600' : 'text-orange-500'}`}>
          {chosen === quiz.target ? 'せいかい！🎉 ボーナスで すすめる！' : `おしい！こたえは ${quiz.target}`}
        </motion.div>
      )}
    </>
  );
}

/**
 * 予想ボーナスチャンス。サイコロを振ったあと「いま from マスめ。roll すすむと？」を
 * 4択（たし算 from+roll の答え）で当てる。正解すると親が 3〜5 マス ボーナスで進める。
 * 文言は「まちがい」と言わず後押しする（authoring-problems のルール）。
 */
export function PredictBonusOverlay({ quiz, player, styleIdx, onAnswer }: Props) {
  return (
    <AnimatePresence>
      {quiz && player && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-black/60 z-50 p-4">
          <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-white rounded-3xl p-6 text-center shadow-2xl w-full max-w-md">
            <PredictCard quiz={quiz} player={player} styleIdx={styleIdx} onAnswer={onAnswer} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
