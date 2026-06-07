import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  /** 数直線の右端（0〜max） */
  max: number;
  /** おく べき 数（こたえ） */
  target: number;
  /** マーカー絵文字（カエル） */
  marker: string;
  /** こどもが おいた 数（まだなら null） */
  placed: number | null;
  /** 採点後（true で こたえの いちと くらべて 見せる） */
  reveal: boolean;
  /** 線を タップ/ドラッグして 数を おいたとき */
  onPlace: (value: number) => void;
}

interface Tick { n: number; major: boolean }

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
 * 配置式の数直線。「{target} は どこ?」を こども自身が 線の上を タップ/ドラッグして おく。
 * 読み取り式より 推定力(number line estimation)を 直接 きたえられる（Siegler）。
 * 採点後は こどもの マーカーと こたえの いちを ならべて見せ、ちかさを 実感させる。
 */
export function NumberLinePlacement({ max, target, marker, placed, reveal, onPlace }: Props) {
  const [dragging, setDragging] = useState(false);
  const pct = (n: number) => `${(n / max) * 100}%`;
  const ticks = ticksFor(max);

  function valueFromClientX(clientX: number, el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(frac * max);
  }

  function handlePointer(e: React.PointerEvent<HTMLDivElement>, commit: boolean) {
    if (reveal) return;
    const v = valueFromClientX(e.clientX, e.currentTarget);
    onPlace(v);
    if (commit) setDragging(false);
  }

  return (
    <div className="select-none px-3 pt-3 pb-1">
      {/* こどもが おいた カエル（プレビュー） */}
      <div className="relative mx-2">
        <div className="relative h-10 z-10">
          {placed !== null && (
            <motion.div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ bottom: 0 }}
              animate={{ left: pct(placed) }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span className="text-3xl leading-none drop-shadow">{marker}</span>
            </motion.div>
          )}
          {/* 採点後は こたえの いちを みどりで 見せる */}
          {reveal && (
            <motion.div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ bottom: 0 }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, left: pct(target) }}
            >
              <span className="mb-0.5 inline-block rounded-md bg-emerald-500 px-1.5 text-sm font-black text-white">
                {target}
              </span>
              <span className="text-2xl leading-none opacity-80">📍</span>
            </motion.div>
          )}
        </div>

        {/* タップ/ドラッグ できる 線（あたり判定を 広くとる） */}
        <div
          role="slider"
          aria-label="すうちょくせんに カエルを おく"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={placed ?? 0}
          className={`relative h-8 -my-2.5 flex items-center ${reveal ? '' : 'cursor-pointer'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => { setDragging(true); handlePointer(e, false); }}
          onPointerMove={(e) => { if (dragging) handlePointer(e, false); }}
          onPointerUp={(e) => handlePointer(e, true)}
          onPointerLeave={() => setDragging(false)}
        >
          <div className="relative h-3 w-full rounded-full" style={{ background: 'linear-gradient(90deg,#bfe3ff,#7ec0ff)' }}>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-lg">🪷</span>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-lg">🏁</span>
          </div>
        </div>

        {/* 目盛り */}
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
