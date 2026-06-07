import { motion } from 'framer-motion';

interface Props {
  /** 数直線の右端（0〜max） */
  max: number;
  /** マーカー（カエル）が立つ数 */
  target: number;
  /** マーカー絵文字 */
  marker: string;
  /** こたえを表示するか（正解後に true にすると数字が出る） */
  reveal?: boolean;
}

/** 目盛り（ベンチマーク）の数を返す。0・まんなか・max を強調する。 */
function ticksFor(max: number): { n: number; major: boolean }[] {
  // 10きざみ（max が大きいときは間引く）
  const step = max <= 20 ? max / 4 : 10;
  const ticks: { n: number; major: boolean }[] = [];
  for (let n = 0; n <= max + 0.001; n += step) {
    const rounded = Math.round(n);
    ticks.push({ n: rounded, major: rounded === 0 || rounded === max || rounded === max / 2 });
  }
  return ticks;
}

/**
 * 戦闘用の数直線（0→max）。カエル🐸が線のどこに立っているかを見て「いくつ?」を当てる。
 * 数を「位置＝量」で読み取る線形メンタルナンバーラインを育てる（理数センス本命）。
 * すごろくの NumberLineBar とは別物（単一マーカー・可変max・推定向けに目盛りを間引く）。
 */
export function NumberLineVisual({ max, target, marker, reveal }: Props) {
  const pct = (n: number) => `${(n / max) * 100}%`;
  const ticks = ticksFor(max);

  return (
    <div className="px-4 pt-6 pb-1 select-none">
      {/* マーカー（カエル） */}
      <div className="relative h-10">
        <motion.div
          className="absolute -translate-x-1/2 flex flex-col items-center"
          style={{ bottom: 0 }}
          initial={{ left: pct(target), y: -8, opacity: 0 }}
          animate={{ left: pct(target), y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          {reveal && (
            <span className="mb-0.5 inline-block rounded-md bg-emerald-500 px-1.5 text-xs font-black text-white">
              {target}
            </span>
          )}
          <span className="text-2xl leading-none drop-shadow">{marker}</span>
          {!reveal && <span className="-mt-1 text-base font-black text-rose-500">？</span>}
        </motion.div>
      </div>

      {/* 線本体 */}
      <div className="relative h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg,#bfe3ff,#7ec0ff)' }}>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-base">🪷</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-base">🏁</span>
      </div>

      {/* 目盛り（0・まんなか・max を強調） */}
      <div className="relative h-5 mt-0.5">
        {ticks.map(({ n, major }) => (
          <div key={n} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pct(n) }}>
            <span className={major ? 'w-0.5 h-2 rounded-full bg-sky-600' : 'w-0.5 h-1.5 rounded-full bg-sky-400'} />
            <span className={`leading-none font-bold ${major ? 'text-[11px] text-sky-800' : 'text-[10px] text-sky-500'}`}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
