import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJa } from '../../features/speech/tts';
import { playSfx } from '../../features/sound/sfx';
import { PLAYER_STYLES, type Player } from './types';
import { isNumberLineCorrect, type BonusQuiz, type QuizPlayerRef } from './logic';

interface Props {
  quiz: BonusQuiz | null;
  player: Player | null;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}

const RESULT_MS = 1900;

// ── 大小比較（提案B） ────────────────────────────────────────────────────────

function CompareQuiz({
  quiz, styleIdx, onAnswer,
}: {
  quiz: Extract<BonusQuiz, { kind: 'compare' }>;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => { speakJa('おおきいのは どっち？'); }, []);

  function pick(value: number) {
    if (chosen !== null) return;
    setChosen(value);
    const correct = value === quiz.answer;
    playSfx(correct ? 'correct' : 'wrong');
    speakJa(correct ? 'せいかい！' : `${quiz.answer} のほうが おおきいよ`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  return (
    <>
      <div className="text-2xl font-bold text-gray-800 mb-4">おおきいのは どっち？</div>
      <div className="flex items-stretch justify-center gap-4">
        {[quiz.a, quiz.b].map((n, i) => {
          const isAnswer = n === quiz.answer;
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
              className={`flex-1 max-w-[8rem] rounded-3xl py-8 text-5xl font-black shadow transition-all ${cls}`}>
              {n}
            </motion.button>
          );
        })}
      </div>
      {chosen !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-xl font-bold ${chosen === quiz.answer ? 'text-emerald-600' : 'text-orange-500'}`}>
          {chosen === quiz.answer ? 'せいかい！🎉' : `${quiz.answer} のほうが おおきいね`}
        </motion.div>
      )}
    </>
  );
}

// ── 数直線推定（提案D） ──────────────────────────────────────────────────────

function NumberLineQuiz({
  quiz, styleIdx, onAnswer,
}: {
  quiz: Extract<BonusQuiz, { kind: 'numberline' }>;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const trackRef = useRef<HTMLButtonElement>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [judged, setJudged] = useState(false);
  const correct = guess !== null && isNumberLineCorrect(quiz.target, guess, quiz.tolerance);

  useEffect(() => { speakJa(`${quiz.target} は どのへん？`); }, [quiz.target]);

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
    speakJa(correct ? 'せいかい！' : `${quiz.target} は ここだよ`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  const pct = (n: number) => `${n}%`;

  return (
    <>
      <div className="text-2xl font-bold text-gray-800 mb-1">
        <span className={`inline-block rounded-lg px-2 ${s.bg} text-white`}>{quiz.target}</span> は どのへん？
      </div>
      <div className="text-sm text-gray-400 mb-5">すうじの ばしょを タップしてね</div>

      <div className="relative pt-7 pb-6 px-1">
        {/* 自分のこたえ（コマ） */}
        {guess !== null && (
          <div className="absolute top-0 -translate-x-1/2" style={{ left: pct(guess) }}>
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
          {guess !== null && (
            <span className={`absolute top-0 left-0 h-full rounded-full ${s.bg} ${judged && !correct ? 'opacity-40' : ''}`}
              style={{ width: pct(guess) }} />
          )}
        </button>

        {/* キリ番の目盛り（目盛線は全部。数字は labels のものだけ＝間引きで難化。0/50/100は強調） */}
        <div className="relative h-7 mt-1">
          {LANDMARKS.map(n => {
            const major = n === 0 || n === 50 || n === 100;
            return (
              <div key={n} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pct(n) }}>
                <span className={major ? 'w-0.5 h-3 rounded-full bg-gray-500' : 'w-0.5 h-2 rounded-full bg-gray-400'} />
                {quiz.labels.includes(n) && (
                  <span className={`mt-0.5 leading-none font-bold ${major ? 'text-sm text-gray-700' : 'text-xs text-gray-500'}`}>{n}</span>
                )}
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
          {correct ? 'せいかい！🎉' : `おしい！${quiz.target} は ⭐ のところ`}
        </motion.div>
      )}
    </>
  );
}

const LANDMARKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// ── どっちに ちかい？（がい数の芽） ─────────────────────────────────────────────

function NearestQuiz({
  quiz, styleIdx, onAnswer,
}: {
  quiz: Extract<BonusQuiz, { kind: 'nearest' }>;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => { speakJa(`${quiz.value} は どっちに ちかい？`); }, [quiz.value]);

  function pick(value: number) {
    if (chosen !== null) return;
    setChosen(value);
    const correct = value === quiz.answer;
    playSfx(correct ? 'correct' : 'wrong');
    speakJa(correct ? 'せいかい！' : `${quiz.answer} のほうが ちかいよ`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  return (
    <>
      <div className="text-2xl font-bold text-gray-800 mb-4">
        <span className={`inline-block rounded-lg px-2 ${s.bg} text-white`}>{quiz.value}</span> は どっちに ちかい？
      </div>
      <div className="flex items-stretch justify-center gap-4">
        {[quiz.low, quiz.high].map((n, i) => {
          const isAnswer = n === quiz.answer;
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
              className={`flex-1 max-w-[8rem] rounded-3xl py-8 text-5xl font-black shadow transition-all ${cls}`}>
              {n}
            </motion.button>
          );
        })}
      </div>
      {chosen !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-xl font-bold ${chosen === quiz.answer ? 'text-emerald-600' : 'text-orange-500'}`}>
          {chosen === quiz.answer ? 'せいかい！🎉' : `${quiz.answer} のほうが ちかいね`}
        </motion.div>
      )}
    </>
  );
}

// ── 10 おおきい/ちいさい かず（位取りの感覚・3択） ──────────────────────────────

function PlusTenQuiz({
  quiz, styleIdx, onAnswer,
}: {
  quiz: Extract<BonusQuiz, { kind: 'plusten' }>;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const [chosen, setChosen] = useState<number | null>(null);
  const word = quiz.delta === 10 ? 'おおきい' : 'ちいさい';

  useEffect(() => { speakJa(`${quiz.base} より 10 ${word} かずは？`); }, [quiz.base, word]);

  function pick(value: number) {
    if (chosen !== null) return;
    setChosen(value);
    const correct = value === quiz.answer;
    playSfx(correct ? 'correct' : 'wrong');
    speakJa(correct ? 'せいかい！' : `${quiz.answer} だよ`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  return (
    <>
      <div className="text-2xl font-bold text-gray-800 mb-4">
        <span className={`inline-block rounded-lg px-2 ${s.bg} text-white`}>{quiz.base}</span> より 10 {word} かずは？
      </div>
      <div className="flex items-stretch justify-center gap-3">
        {quiz.choices.map((n, i) => {
          const isAnswer = n === quiz.answer;
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
              className={`flex-1 max-w-[6rem] rounded-3xl py-6 text-4xl font-black shadow transition-all ${cls}`}>
              {n}
            </motion.button>
          );
        })}
      </div>
      {chosen !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-xl font-bold ${chosen === quiz.answer ? 'text-emerald-600' : 'text-orange-500'}`}>
          {chosen === quiz.answer ? 'せいかい！🎉' : `こたえは ${quiz.answer}`}
        </motion.div>
      )}
    </>
  );
}

// ── だれとだれは なんマス はなれてる？（差・数直線で数える・3択） ──────────────

function PlayerPiece({ p, side }: { p: QuizPlayerRef; side: 'top' | 'bottom' }) {
  // コマ（絵文字）と マス番号フキダシを数直線の pos% に置く。上下にずらして重なりを避ける
  return (
    <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${p.pos}%`, [side === 'top' ? 'bottom' : 'top']: '100%' }}>
      {side === 'bottom' && <span className="block w-0.5 h-2 bg-gray-400" />}
      <span className="text-2xl leading-none drop-shadow">{p.char}</span>
      <span className="text-xs font-bold text-gray-600 leading-none">{p.pos}</span>
      {side === 'top' && <span className="block w-0.5 h-2 bg-gray-400" />}
    </div>
  );
}

function DistanceQuiz({
  quiz, styleIdx, onAnswer,
}: {
  quiz: Extract<BonusQuiz, { kind: 'distance' }>;
  styleIdx: number;
  onAnswer: (correct: boolean) => void;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const [chosen, setChosen] = useState<number | null>(null);
  const pct = (n: number) => `${n}%`;

  useEffect(() => { speakJa(`${quiz.a.name} と ${quiz.b.name} は なんマス はなれてる？`); }, [quiz.a.name, quiz.b.name]);

  function pick(value: number) {
    if (chosen !== null) return;
    setChosen(value);
    const correct = value === quiz.answer;
    playSfx(correct ? 'correct' : 'wrong');
    speakJa(correct ? 'せいかい！' : `${quiz.answer} マス はなれてるよ`);
    setTimeout(() => onAnswer(correct), RESULT_MS);
  }

  return (
    <>
      <div className="text-2xl font-bold text-gray-800 mb-1">
        <span className="text-3xl">{quiz.a.char}</span> と <span className="text-3xl">{quiz.b.char}</span> は
        <br />なんマス はなれてる？
      </div>
      <div className="text-sm text-gray-400 mb-7">すうじを かぞえてみてね</div>

      {/* 2人のコマを置いた数直線。あいだ（差）を色で強調 */}
      <div className="relative pt-9 pb-9 px-1">
        <div className="relative block w-full h-4 rounded-full bg-gray-200">
          <span className="absolute top-0 h-full rounded-full opacity-70"
            style={{ left: pct(quiz.a.pos), width: pct(quiz.b.pos - quiz.a.pos), background: s.hex }} />
          <PlayerPiece p={quiz.a} side="top" />
          <PlayerPiece p={quiz.b} side="bottom" />
        </div>
      </div>

      <div className="flex items-stretch justify-center gap-3">
        {quiz.choices.map((n, i) => {
          const isAnswer = n === quiz.answer;
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
              className={`flex-1 max-w-[6rem] rounded-3xl py-6 text-4xl font-black shadow transition-all ${cls}`}>
              {n}
            </motion.button>
          );
        })}
      </div>
      {chosen !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-xl font-bold ${chosen === quiz.answer ? 'text-emerald-600' : 'text-orange-500'}`}>
          {chosen === quiz.answer ? 'せいかい！🎉' : `${quiz.answer} マス はなれてるね`}
        </motion.div>
      )}
    </>
  );
}

/**
 * ボーナスマスのミニ問題オーバーレイ（提案B: 大小比較 / 提案D: 数直線推定）。
 * 正解すると onAnswer(true)（→ ビンゴマス選択へ）。不正解は onAnswer(false)。
 * 文言は「まちがい」と言わず後押しする（authoring-problems のルール）。
 */
export function BonusQuizOverlay({ quiz, player, styleIdx, onAnswer }: Props) {
  return (
    <AnimatePresence>
      {quiz && player && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-black/60 z-50 p-4">
          <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-white rounded-3xl p-6 text-center shadow-2xl w-full max-w-md">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-base font-bold text-gray-500 mb-3">
              {player.character} {player.name}・ボーナスチャンス！
            </div>
            {quiz.kind === 'compare'    ? <CompareQuiz    quiz={quiz} styleIdx={styleIdx} onAnswer={onAnswer} />
             : quiz.kind === 'nearest'  ? <NearestQuiz    quiz={quiz} styleIdx={styleIdx} onAnswer={onAnswer} />
             : quiz.kind === 'plusten'  ? <PlusTenQuiz    quiz={quiz} styleIdx={styleIdx} onAnswer={onAnswer} />
             : quiz.kind === 'distance' ? <DistanceQuiz   quiz={quiz} styleIdx={styleIdx} onAnswer={onAnswer} />
             :                            <NumberLineQuiz quiz={quiz} styleIdx={styleIdx} onAnswer={onAnswer} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
