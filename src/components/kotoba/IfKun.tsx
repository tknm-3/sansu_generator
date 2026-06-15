import { motion } from 'framer-motion';

export type IfMood = 'idle' | 'happy' | 'think' | 'eat';

interface Props {
  mood?: IfMood;
  size?: number;
}

/**
 * もじギア・ファクトリーの主役ロボ「IF-くん」。
 * まんまる・ひとつ目・歯車のアンテナ。表情で きもちを つたえる。
 */
export function IfKun({ mood = 'idle', size = 96 }: Props) {
  const happy = mood === 'happy';
  const eat = mood === 'eat';
  const think = mood === 'think';

  // ひとつ目の 形を きもちで かえる
  const eyeScaleY = happy ? 0.55 : eat ? 0.7 : 1;
  const mouthPath = happy
    ? 'M 38 70 Q 50 82 62 70' // にっこり
    : eat
    ? 'M 44 70 Q 50 80 56 70' // ぱくっ（ちいさい o）
    : think
    ? 'M 42 73 L 58 73' // むむ…（まっすぐ）
    : 'M 42 72 Q 50 78 58 72'; // ふつう

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={
        happy
          ? { rotate: [0, -6, 6, -4, 0], y: [0, -6, 0] }
          : eat
          ? { scale: [1, 1.08, 1] }
          : { y: [0, -3, 0] }
      }
      transition={
        happy
          ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.3 }
          : eat
          ? { duration: 0.4 }
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      }
      role="img"
      aria-label="IF-くん"
    >
      {/* アンテナの歯車 */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50px 14px' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="48" y="4" width="4" height="6" rx="1" fill="#f59e0b"
            transform={`rotate(${i * 45} 50 14)`} />
        ))}
        <circle cx="50" cy="14" r="5" fill="#fbbf24" />
      </motion.g>
      <line x1="50" y1="18" x2="50" y2="28" stroke="#9ca3af" strokeWidth="3" />

      {/* からだ（まんまる・メタル） */}
      <circle cx="50" cy="58" r="36" fill="url(#ifBody)" stroke="#94a3b8" strokeWidth="3" />
      <defs>
        <radialGradient id="ifBody" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
      </defs>

      {/* ほっぺ（うれしいとき）*/}
      {happy && (
        <>
          <circle cx="30" cy="64" r="5" fill="#fda4af" opacity="0.8" />
          <circle cx="70" cy="64" r="5" fill="#fda4af" opacity="0.8" />
        </>
      )}

      {/* ひとつ目 */}
      <g transform={`translate(50 48) scale(1 ${eyeScaleY}) translate(-50 -48)`}>
        <circle cx="50" cy="48" r="16" fill="#fff" stroke="#64748b" strokeWidth="2" />
        <circle cx="50" cy="48" r="8" fill="#0ea5e9" />
        <circle cx="46" cy="44" r="3" fill="#fff" />
      </g>

      {/* くち */}
      <path d={mouthPath} stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* て */}
      <circle cx="14" cy="60" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="86" cy="60" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
    </motion.svg>
  );
}
