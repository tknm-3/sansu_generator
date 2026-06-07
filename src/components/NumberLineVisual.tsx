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

interface Tick { n: number; major: boolean }

/** 目盛りを返す。majorStep ごとに数字ラベルを付け、minorStep ごとに細かい目盛りを打つ。 */
function ticksFor(max: number): Tick[] {
  const majorStep = max <= 20 ? 5 : 10;
  const minorStep = max <= 20 ? 1 : 5;
  const ticks: Tick[] = [];
  for (let n = 0; n <= max + 0.001; n += minorStep) {
    const r = Math.round(n);
    ticks.push({ n: r, major: r % majorStep === 0 });
  }
  return ticks;
}

/**
 * 戦闘用の数直線（0→max）。カエル🐸が線のどこに立っているかを見て「いくつ?」を当てる。
 * 「位置＝量」で読み取る線形メンタルナンバーラインを育てる。
 * パッと見で読めるよう、定規のように 細かい目盛り＋カエルから真下への ガイド線を引く。
 */
export function NumberLineVisual({ max, target, marker, reveal }: Props) {
  const pct = (n: number) => `${(n / max) * 100}%`;
  const ticks = ticksFor(max);

  return (
    <div className="select-none px-3 pt-3 pb-1">
      <div className="relative mx-2">
        {/* カエルから 真下への ガイド線（どの目盛りの上か 一目で わかる） */}
        <div
          className="pointer-events-none absolute z-0 border-l-2 border-dashed border-rose-400/80"
          style={{ left: pct(target), top: 32, height: 46, transform: 'translateX(-50%)' }}
        />

        {/* マーカー（カエル） */}
        <div className="relative h-10 z-10">
          <motion.div
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ bottom: 0 }}
            initial={{ left: pct(target), y: -8, opacity: 0 }}
            animate={{ left: pct(target), y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          >
            {reveal && (
              <span className="mb-0.5 inline-block rounded-md bg-emerald-500 px-1.5 text-sm font-black text-white">
                {target}
              </span>
            )}
            <span className="text-3xl leading-none drop-shadow">{marker}</span>
            {!reveal && <span className="-mt-1 text-lg font-black text-rose-500">？</span>}
          </motion.div>
        </div>

        {/* 線本体 */}
        <div className="relative h-3 rounded-full" style={{ background: 'linear-gradient(90deg,#bfe3ff,#7ec0ff)' }}>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-lg">🪷</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-lg">🏁</span>
        </div>

        {/* 目盛り（major にだけ数字ラベル、minor は細かい線） */}
        <div className="relative h-6 mt-0.5">
          {ticks.map(({ n, major }) => (
            <div key={n} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pct(n) }}>
              <span className={major ? 'w-[3px] h-2.5 rounded-full bg-sky-600' : 'w-px h-1.5 rounded-full bg-sky-300'} />
              {major && (
                <span className={`mt-0.5 leading-none font-bold ${n === 0 || n === max || n === max / 2 ? 'text-[12px] text-sky-800' : 'text-[11px] text-sky-600'}`}>{n}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
