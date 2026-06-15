import { motion } from 'framer-motion';

function Gear({ cx, cy, r, color, dur, dir = 1, teeth = 10 }: {
  cx: number; cy: number; r: number; color: string; dur: number; dir?: 1 | -1; teeth?: number;
}) {
  return (
    <motion.g
      animate={{ rotate: 360 * dir }}
      transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {Array.from({ length: teeth }).map((_, i) => (
        <rect
          key={i}
          x={cx - r * 0.16}
          y={cy - r - r * 0.18}
          width={r * 0.32}
          height={r * 0.36}
          rx={r * 0.06}
          fill={color}
          transform={`rotate(${(360 / teeth) * i} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" opacity="0.35" />
    </motion.g>
  );
}

/** 工場のふんいきを出す、ゆっくり回る歯車の背景（うすく敷く） */
export function GearBackground({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <svg
      className="pointer-events-none fixed inset-0 h-full w-full"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
      aria-hidden
    >
      <Gear cx={60} cy={90} r={48} color="#b08d57" dur={18} teeth={11} />
      <Gear cx={150} cy={130} r={30} color="#7a5a3a" dur={12} dir={-1} teeth={9} />
      <Gear cx={350} cy={250} r={56} color="#cbd5e1" dur={22} dir={-1} teeth={12} />
      <Gear cx={40} cy={520} r={40} color="#94a3b8" dur={16} teeth={10} />
      <Gear cx={330} cy={640} r={46} color="#b08d57" dur={20} teeth={11} />
      <Gear cx={210} cy={720} r={28} color="#7a5a3a" dur={10} dir={-1} teeth={8} />
    </svg>
  );
}
