import type { PatternItem, ShapeType, ColorKey } from '../../lib/geometry/pattern';
import type { SceneObj } from '../../lib/geometry/spatial';

// かたち単元・としょかんバトルで共通して使う図形ビジュアル。
// 「図形の問題のところ」と同じ見た目を としょかんモードでも使えるよう、ここに一元化する。

// ── かたちをあわせる（compose）: 生SVGコンテンツをそのまま描画 ──
export function ComposeSvg({ svg, size = 120 }: { svg: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 200 120"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ── つぎはどれ（pattern）: 1つの図形アイコン ──
const COLOR_MAP: Record<ColorKey, string> = {
  red: '#f87171',
  blue: '#60a5fa',
  yellow: '#fbbf24',
  green: '#34d399',
};

function starPoints(cx: number, cy: number, outerR: number, innerR: number, pts: number): string {
  const arr: string[] = [];
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    arr.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return arr.join(' ');
}

export function PatternIcon({ item, size = 44 }: { item: PatternItem; size?: number }) {
  const fill = COLOR_MAP[item.color];
  const c = size / 2;
  const r = size / 2 - 3;
  const shapeEl = (() => {
    switch (item.shape as ShapeType) {
      case 'circle':
        return <circle cx={c} cy={c} r={r} fill={fill} stroke="white" strokeWidth="2" />;
      case 'triangle':
        return <polygon points={`${c},3 ${size - 3},${size - 3} 3,${size - 3}`} fill={fill} stroke="white" strokeWidth="2" />;
      case 'square':
        return <rect x="3" y="3" width={size - 6} height={size - 6} rx="3" fill={fill} stroke="white" strokeWidth="2" />;
      case 'star':
        return <polygon points={starPoints(c, c, r, r * 0.42, 5)} fill={fill} stroke="white" strokeWidth="2" />;
    }
  })();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {shapeEl}
    </svg>
  );
}

// ── つぎはどれ（pattern）: 並び（？を含む）を横に表示 ──
export function PatternSequence({ sequence, iconSize = 40 }: { sequence: (PatternItem | null)[]; iconSize?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {sequence.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          {item ? (
            <div className="rounded-xl bg-white shadow border border-purple-100 p-1.5">
              <PatternIcon item={item} size={iconSize} />
            </div>
          ) : (
            <div
              className="rounded-xl border-4 border-dashed border-purple-300 flex items-center justify-center text-purple-400 text-2xl font-bold"
              style={{ width: iconSize + 16, height: iconSize + 16 }}
            >
              ？
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── どこにいる（spatial）: グリッドに絵文字を配置 ──
const CELL = 72;
const PAD = 16;
const OBJ_R = 26;

export function SpatialScene({ objects }: { objects: SceneObj[] }) {
  const cols = Math.max(...objects.map((o) => o.col)) + 1;
  const rows = Math.max(...objects.map((o) => o.row)) + 1;
  const w = cols * CELL + PAD * 2;
  const h = rows * CELL + PAD * 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={PAD + c * CELL}
            y={PAD + r * CELL}
            width={CELL}
            height={CELL}
            fill="#f0fdf4"
            stroke="#86efac"
            strokeWidth="1.5"
            rx="8"
          />
        ))
      )}
      {objects.map((obj) => {
        const cx = PAD + obj.col * CELL + CELL / 2;
        const cy = PAD + obj.row * CELL + CELL / 2;
        return (
          <g key={obj.name}>
            <circle cx={cx} cy={cy} r={OBJ_R} fill="white" stroke="#6ee7b7" strokeWidth="2" />
            <text x={cx} y={cy + 2} fontSize="22" textAnchor="middle" dominantBaseline="middle">
              {obj.emoji}
            </text>
            <text x={cx} y={cy + OBJ_R + 11} fontSize="10" textAnchor="middle" fill="#374151" fontFamily="sans-serif">
              {obj.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
