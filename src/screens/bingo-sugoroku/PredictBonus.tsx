import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJa } from '../../features/speech/tts';
import { playSfx } from '../../features/sound/sfx';
import { PLAYER_STYLES, type Player } from './types';
import { isNumberLineCorrect, type PredictQuiz } from './logic';

const LANDMARKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
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
  const trackRef = useRef<HTMLButtonElement>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [judged, setJudged] = useState(false);
  const correct = guess !== null && isNumberLineCorrect(quiz.target, guess, quiz.tolerance);

  useEffect(() => {
    speakJa(`いま ${quiz.from}。${quiz.roll} すすむと どこ？`);
  }, [quiz.from, quiz.roll]);

  function placeFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setGuess(Math.round(frac * 100));
  }

  function confirm() {
    if (guess === null || judged) return;
    setJudged(true);
    playSfx(correct ? 'correct' : 'wrong');
    speakJa(correct ? 'せいかい！ ボーナスで すすめるよ！' : `${quiz.target} だね`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  const pct = (n: number) => `${n}%`;

  return (
    <>
      <div className="text-3xl mb-1">🎲</div>
      <div className="text-base font-bold text-gray-500 mb-2">
        {player.character} {player.name}・ボーナスチャンス！
      </div>

      {/* 今いるマスと出た目をはっきり見せる（要件: 何マスにいて何が出たか表示） */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="rounded-xl bg-gray-100 px-3 py-1 text-lg font-bold text-gray-700">
          いま <span className={`${s.text}`}>{quiz.from}</span> マス
        </span>
        <span className="rounded-xl bg-amber-100 px-3 py-1 text-lg font-bold text-amber-700">
          🎲 {quiz.roll} が でた！
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-800 mb-1">
        {quiz.roll} すすむと どこに とまる？
      </div>
      <div className="text-sm text-gray-400 mb-5">すうじの ばしょを タップしてね</div>

      <div className="relative pt-8 pb-6 px-1">
        {/* 今いるコマ（スタート地点）を数直線に表示 */}
        <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: pct(quiz.from) }}>
          <span className="block text-xl leading-none drop-shadow">{player.character}</span>
          <span className="text-[10px] leading-none font-bold text-gray-400">いま</span>
        </div>
        {/* 自分のこたえ（コマ） */}
        {guess !== null && (
          <div className="absolute top-1 -translate-x-1/2" style={{ left: pct(guess) }}>
            <span className="block text-2xl leading-none drop-shadow">🔻</span>
          </div>
        )}
        {/* 正解の位置（判定後に表示） */}
        {judged && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -translate-x-1/2" style={{ left: pct(quiz.target), bottom: 4 }}>
            <span className="block text-xl leading-none">⭐</span>
          </motion.div>
        )}

        {/* 数直線（クリックで配置） */}
        <button type="button" ref={trackRef} disabled={judged}
          onClick={(e) => !judged && placeFromClientX(e.clientX)}
          className="relative block w-full h-4 rounded-full bg-gray-200 cursor-pointer">
          {/* 今いる位置までを薄く塗る（量感の足場） */}
          <span className="absolute top-0 left-0 h-full rounded-full bg-gray-300" style={{ width: pct(quiz.from) }} />
          {guess !== null && (
            <span className={`absolute top-0 left-0 h-full rounded-full ${s.bg} ${judged && !correct ? 'opacity-40' : ''}`}
              style={{ width: pct(guess) }} />
          )}
        </button>

        {/* キリ番の目盛り（予想は正確さが要るので数字ラベルは全部出す・0/50/100は強調） */}
        <div className="relative h-7 mt-1">
          {LANDMARKS.map(n => {
            const major = n === 0 || n === 50 || n === 100;
            return (
              <div key={n} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pct(n) }}>
                <span className={major ? 'w-0.5 h-3 rounded-full bg-gray-500' : 'w-0.5 h-2 rounded-full bg-gray-400'} />
                <span className={`mt-0.5 leading-none font-bold ${major ? 'text-sm text-gray-700' : 'text-xs text-gray-500'}`}>{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!judged ? (
        <motion.button type="button" disabled={guess === null}
          whileTap={guess !== null ? { scale: 0.95 } : undefined} onClick={confirm}
          className={`mt-2 w-full rounded-2xl py-3 text-xl font-bold text-white transition-all
            ${guess === null ? 'bg-gray-300 cursor-not-allowed' : `${s.bg} shadow-[0_4px_0_rgba(0,0,0,0.2)]`}`}>
          これ！
        </motion.button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-2 text-xl font-bold ${correct ? 'text-emerald-600' : 'text-orange-500'}`}>
          {correct ? 'せいかい！🎉 ボーナスで すすめる！' : `おしい！${quiz.target} に とまるよ`}
        </motion.div>
      )}
    </>
  );
}

/**
 * 予想ボーナスチャンス。サイコロを振ったあと「いま from マス・roll が出た。
 * どこに とまる？」を数直線で当てる。正解すると親が 3〜5 マス ボーナスで進める。
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
