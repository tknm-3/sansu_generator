import { motion } from 'framer-motion';

export type SizeMode = 'big' | 'small' | 'long' | 'short';

interface Props {
  mode: SizeMode;
  /** くらべる もの。label（いろの なまえ）・size（あいたいの おおきさ 0.4〜1）・color */
  items: { label: string; size: number; color: string }[];
}

/**
 * おおきさくらべ: おおきさ／ながさの ちがう ものを ならべて 見せる。
 * big/small は ましかくの おおきさ、long/short は ぼうの ながさで くらべる。
 * 「いちばん おおきい／ちいさい／ながい／みじかい のは どれ？」を 目で くらべて えらぶ。
 */
export function SizeCompareVisual({ mode, items }: Props) {
  const isLength = mode === 'long' || mode === 'short';
  if (isLength) {
    // よこ ぼう（ながさくらべ）。みぎはしを そろえず ひだり ぞろえで ながさの ちがいを 見せる。
    const maxW = 240;
    return (
      <div className="flex flex-col items-center gap-3">
        {items.map((it, i) => (
          <div key={it.label} className="flex w-full items-center gap-2">
            <span className="w-12 shrink-0 text-right text-sm font-bold" style={{ color: it.color }}>
              {it.label}
            </span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{
                width: Math.round(maxW * it.size),
                height: 24,
                background: it.color,
                borderRadius: 8,
                transformOrigin: 'left',
                boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.15)',
              }}
            />
          </div>
        ))}
      </div>
    );
  }
  // ましかく（おおきさくらべ）。したそろえで ならべる。
  const maxS = 100;
  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      {items.map((it, i) => {
        const s = Math.round(maxS * it.size);
        return (
          <div key={it.label} className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
              style={{
                width: s,
                height: s,
                background: it.color,
                borderRadius: 12,
                boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.15)',
              }}
            />
            <span className="text-sm font-bold" style={{ color: it.color }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}
