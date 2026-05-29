import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';

interface Props {
  /** 考え方のことば（この問題タイプの かんがえかた） */
  message: string;
  /** 間違えたときに出す 追いヒント（正解を ハイライト表示する） */
  hintMessage?: string;
  /** お題（問題の文脈）を表示するノード */
  context: ReactNode;
  /** 選択肢の数 */
  count: number;
  /** 正解の index */
  answerIndex: number;
  /** 各選択肢の中身を描画（ボタン枠は ゲート側で つける） */
  renderChoice: (idx: number) => ReactNode;
  /** 正解を選べたとき（＝ヒントの問題を解けたとき）に呼ぶ */
  onSolved: () => void;
  /** 選択肢グリッドの列数（既定2） */
  gridCols?: 2 | 3 | 4;
}

/**
 * 図形系ユニット用の「考え方ヒント＋もういちど解く」ゲート。
 * 間違えたとき自動で開き、考え方を説明したうえで もういちど選ばせる。
 * 正解するまで閉じられないので、当てずっぽうの連打を防ぐ。
 * 1回まちがえると、せいかいを ハイライトして 追いヒントを出す。
 */
export function ShapeHintGate({
  message,
  hintMessage = 'みどりの ⭕ が せいかいだよ。えらんでみよう',
  context,
  count,
  answerIndex,
  renderChoice,
  onSolved,
  gridCols = 2,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);

  function pick(idx: number) {
    if (solved) return;
    playSfx('tap');
    if (idx === answerIndex) {
      playSfx('correct');
      setSolved(true);
      speakJa('せいかい！');
      // 「せいかい」の演出を 少し見せてから 閉じる
      setTimeout(onSolved, 700);
    } else {
      playSfx('wrong');
      setRevealed(true);
      speakJa(hintMessage);
    }
  }

  const colClass = gridCols === 4 ? 'grid-cols-4' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky-100/95 to-amber-50/95 p-6 backdrop-blur-sm overflow-y-auto">
      <span className="text-lg font-bold text-amber-700">いっしょに かんがえよう</span>
      <p className="text-base font-bold text-amber-900 text-center whitespace-pre-line max-w-sm">
        {message}
      </p>
      <div className="flex items-center justify-center">{context}</div>
      <AnimatePresence>
        {revealed && (
          <motion.p
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-bold text-emerald-700 text-center max-w-sm"
          >
            {hintMessage}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="text-teal-700 font-bold">どれが せいかい？</p>
      <div className={`grid ${colClass} gap-3 w-full max-w-sm`}>
        {Array.from({ length: count }).map((_, idx) => {
          const isAnswer = idx === answerIndex;
          const highlight = (revealed || solved) && isAnswer;
          return (
            <motion.button
              key={idx}
              type="button"
              disabled={solved}
              onClick={() => pick(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-2xl border-2 p-3 flex items-center justify-center shadow-md transition-colors ${
                highlight ? 'border-green-500 bg-green-50 ring-4 ring-green-300' : 'border-teal-200 bg-white'
              }`}
            >
              {renderChoice(idx)}
              {highlight && (
                <span className="absolute -top-2 -right-2 text-2xl">⭕</span>
              )}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {solved && (
          <motion.p key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-green-600">
            ⭕ せいかい！ そのちょうし！
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
