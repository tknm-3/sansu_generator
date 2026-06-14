import { motion } from 'framer-motion';

interface Props {
  /** こうかの しゅるいと まいすう（おおきい じゅんに ならべる） */
  coins: { value: number; count: number }[];
}

// こうかの 見ため（おおきさ・いろ）。日本の こうかに ちかい いろ。
const COIN_STYLE: Record<number, { size: number; bg: string; ring: string; fg: string }> = {
  500: { size: 52, bg: '#d9b44a', ring: '#b8902f', fg: '#5a4410' },
  100: { size: 46, bg: '#cfd3d6', ring: '#a7adb2', fg: '#3a3f44' },
  50: { size: 42, bg: '#dfe3e6', ring: '#b6bbc0', fg: '#3a3f44' },
  10: { size: 44, bg: '#c8884a', ring: '#a16a30', fg: '#4a2e10' },
  5: { size: 40, bg: '#d7b85a', ring: '#b0903a', fg: '#4a3a10' },
  1: { size: 36, bg: '#e4e7ea', ring: '#bfc4c9', fg: '#4a4f54' },
};

function Coin({ value, idx }: { value: number; idx: number }) {
  const s = COIN_STYLE[value] ?? COIN_STYLE[10];
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: s.size,
        height: s.size,
        background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${s.bg})`,
        border: `3px solid ${s.ring}`,
        color: s.fg,
        boxShadow: '0 2px 3px rgba(0,0,0,.25)',
        fontSize: value >= 100 ? 13 : 14,
        lineHeight: 1,
      }}
    >
      {value}
    </motion.div>
  );
}

/**
 * ねだん パッと: こうかを しゅるいごとに ならべて 見せる。
 * 「100が ２まい、10が ３まい…」と かたまりで よんで ごうけいを かんがえる（位取り・暗算）。
 */
export function CoinsVisual({ coins }: Props) {
  let n = 0;
  return (
    <div className="flex flex-col items-center gap-2">
      {coins.map((c) => (
        <div key={c.value} className="flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: c.count }).map((_, i) => (
            <Coin key={i} value={c.value} idx={n++} />
          ))}
        </div>
      ))}
    </div>
  );
}
