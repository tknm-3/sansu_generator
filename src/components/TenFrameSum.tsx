import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  /** さいしょの かたまり（色1） */
  a: number;
  /** つぎの かたまり（色2） */
  b: number;
  emojiA?: string;
  emojiB?: string;
  /** 最初に 見せる ミリ秒（この あと かくれる）。0 なら ずっと 表示 */
  flashMs?: number;
  /** こたえた あとは ずっと 見せる（こたえあわせ用） */
  answered?: boolean;
}

/** 10の枠（5×2）を ならべて a＋b を 色ちがいの かたまりで 見せる。 */
function Frames({ a, b, emojiA, emojiB }: { a: number; b: number; emojiA: string; emojiB: string }) {
  const total = a + b;
  const frameCount = Math.max(1, Math.ceil(total / 10));
  const cells: (string | null)[] = [];
  for (let i = 0; i < frameCount * 10; i++) {
    if (i < a) cells.push(emojiA);
    else if (i < total) cells.push(emojiB);
    else cells.push(null);
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {Array.from({ length: frameCount }).map((_, f) => (
        <div key={f} className="grid grid-cols-5 gap-1 rounded-xl border-[3px] border-sky-300 bg-white p-1.5">
          {cells.slice(f * 10, f * 10 + 10).map((c, i) => (
            <div
              key={i}
              className={
                'flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none ' +
                (c ? 'bg-rose-50' : 'border border-dashed border-sky-200 bg-sky-50/50')
              }
            >
              {c ?? ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * パッとそろばん: 10の枠の a＋b を「一瞬だけ」見せて かくす（フラッシュ）。
 * 出っぱなしだと 1つずつ 数えられて ただの かぞえ算に なるので、瞬間提示で
 * 「5と3で8」と かたまりで よむ 概念的サビタイジング／暗算の自動化を 育てる。
 * タイマーは この インスタンス内の 単一 ref で管理し、問題切替(a,b変化)・アンマウントで
 * 必ず clear する（timerRef 使い回しの 取りこぼしを さける）。
 */
export function TenFrameSum({ a, b, emojiA = '🔴', emojiB = '🟡', flashMs = 1600, answered = false }: Props) {
  const [shown, setShown] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }
  function hideAfter(ms: number) {
    clear();
    timerRef.current = setTimeout(() => setShown(false), ms);
  }

  // 新しい問題（a,b）に なるたび もう一度 フラッシュ
  useEffect(() => {
    if (flashMs <= 0) return;
    setShown(true);
    hideAfter(flashMs);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, flashMs]);

  const visible = shown || answered || flashMs <= 0;

  return (
    <div className="flex flex-col items-center gap-2" style={{ minHeight: 120, justifyContent: 'center' }}>
      {visible ? (
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
          <Frames a={a} b={b} emojiA={emojiA} emojiB={emojiB} />
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={() => { setShown(true); hideAfter(900); }}
          className="flex flex-col items-center gap-1 rounded-2xl border-[3px] border-dashed border-sky-300 bg-sky-50/70 px-8 py-5"
        >
          <span className="text-3xl">🫣</span>
          <span className="text-sm font-bold text-sky-700">おぼえてる？</span>
          <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white">👀 もう1かい みる</span>
        </button>
      )}
    </div>
  );
}
