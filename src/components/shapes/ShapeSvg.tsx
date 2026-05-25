import { SHAPE_DEFS } from '../../lib/geometry/rotation';
import type { RotationTransform } from '../../lib/geometry/rotation';

interface Props {
  shapeId: string;
  transform: RotationTransform;
  size?: number;
  color?: string;
}

export function ShapeSvg({ shapeId, transform, size = 80, color = '#60a5fa' }: Props) {
  const def = SHAPE_DEFS.find((s) => s.id === shapeId);
  if (!def) return null;

  const cx = 50;
  const cy = 50;
  const scaleX = transform.flipX ? -1 : 1;
  const transformStr = `rotate(${transform.rotate}, ${cx}, ${cy}) scale(${scaleX}, 1) translate(${transform.flipX ? -100 : 0}, 0)`;

  return (
    <svg width={size} height={size} viewBox={def.viewBox}>
      <g transform={transformStr}>
        <path d={def.path} fill={color} stroke="white" strokeWidth="2" />
      </g>
    </svg>
  );
}
