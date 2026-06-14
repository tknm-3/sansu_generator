// タングラム問題の 型と SVGヘルパー（データ・ロジック どちらも ここに 依存させて
// 循環import を さける）。座標は viewBox "0 0 200 120"（ComposeSvg と そろえる）。

export interface TangramProblem {
  questionSvg: string; // お題のSVGコンテンツ
  questionLabel: string;
  choices: { svg: string; label: string }[];
  answerIndex: number;
}

// 正解を origIdx 0 に置いた 生データ。generate でシャッフルする。
export type RawTangram = Omit<TangramProblem, 'answerIndex'>;

const STROKE = 'stroke="white" stroke-width="2"';

/** うえむき さんかく（そこ辺が した、ちょうてんは うえ中央） */
export function triUp(x: number, y: number, w: number, h: number, color: string): string {
  return `<polygon points="${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}" fill="${color}" ${STROKE}/>`;
}
/** したむき さんかく */
export function triDown(x: number, y: number, w: number, h: number, color: string): string {
  return `<polygon points="${x},${y} ${x + w},${y} ${x + w / 2},${y + h}" fill="${color}" ${STROKE}/>`;
}
export function rect(x: number, y: number, w: number, h: number, color: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" ${STROKE}/>`;
}
export function diamond(cx: number, cy: number, rx: number, ry: number, color: string): string {
  return `<polygon points="${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}" fill="${color}" ${STROKE}/>`;
}
/** たりないピースの あな（点線で かたちだけ しめす） */
export function hole(points: string): string {
  return `<polygon points="${points}" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="6 4"/>`;
}

// 色（compose.ts と そろえた やさしい いろ）
export const BLUE = '#60a5fa';
export const GREEN = '#34d399';
export const ORANGE = '#fb923c';
export const PURPLE = '#a78bfa';
export const YELLOW = '#fbbf24';
export const RED = '#f87171';
