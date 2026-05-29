import { motion } from 'framer-motion';

interface Props {
  /** うごく キャラの 絵文字（キャラが はなしている ふうに） */
  charEmoji: string;
  message: string;
  /** もっと くわしい ヒント（さいしょの 1マスなど）。あれば ボタンを 出す */
  onMoreHint?: () => void;
  moreHintLabel?: string;
}

/**
 * まちがいを せめない、前向きな ヒントの ふきだし。
 * 「バツ」ではなく キャラが いっしょに かんがえてくれる ように 見せる。
 */
export function HintBanner({ charEmoji, message, onMoreHint, moreHintLabel = 'ヒントを もっと' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-sm items-start gap-3 rounded-2xl border-2 border-sky-200 bg-white p-3 shadow-md"
    >
      <motion.span
        className="text-3xl"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {charEmoji}
      </motion.span>
      <div className="flex-1">
        <p className="whitespace-pre-line text-sm font-bold text-sky-900">{message}</p>
        {onMoreHint && (
          <button
            type="button"
            onClick={onMoreHint}
            className="mt-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700"
          >
            💡 {moreHintLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
