import { describe, expect, it } from 'vitest';
import { getPuzzles, type FitPiece, type FitShape } from './fitPuzzles';

// タングラムは全ピースを 1まいの シルエットに とうごうして 見せるので、
// ピースが かさなると「どこに はめるか」が わからなくなる。
// → タングラムの パズルでは ピースどうしが かさならないことを ほしょうする。

type Pt = [number, number];

function circlePoly(cx: number, cy: number, r: number, n = 32): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function shapeLocalPoly(s: FitShape): Pt[] {
  if (s.type === 'poly') {
    return s.points
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(',').map(Number) as Pt);
  }
  if (s.type === 'rect') {
    return [
      [s.x, s.y],
      [s.x + s.w, s.y],
      [s.x + s.w, s.y + s.h],
      [s.x, s.y + s.h],
    ];
  }
  return circlePoly(s.cx, s.cy, s.r);
}

function worldPoly(p: FitPiece): Pt[] {
  const local = shapeLocalPoly(p.shape);
  const cx = p.w / 2;
  const cy = p.h / 2;
  const rot = (((p.targetRotation ?? 0) % 360) + 360) % 360;
  const rotate = (px: number, py: number): Pt => {
    const dx = px - cx;
    const dy = py - cy;
    let rx = dx;
    let ry = dy;
    if (rot === 90) { rx = -dy; ry = dx; }
    else if (rot === 180) { rx = -dx; ry = -dy; }
    else if (rot === 270) { rx = dy; ry = -dx; }
    return [cx + rx, cy + ry];
  };
  return local.map(([px, py]) => {
    const [rx, ry] = rotate(px, py);
    return [p.x + rx, p.y + ry] as Pt;
  });
}

function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

const area = (poly: Pt[]) => Math.abs(signedArea(poly));

// すべての ピースが とつ形なので、とつ×とつの こうさは Sutherland-Hodgman で もとまる。
function clip(subject: Pt[], clipper: Pt[]): Pt[] {
  const cl = signedArea(clipper) < 0 ? [...clipper].reverse() : clipper;
  let output = subject;
  for (let i = 0; i < cl.length; i++) {
    const a = cl[i];
    const b = cl[(i + 1) % cl.length];
    const input = output;
    output = [];
    const inside = (p: Pt) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
    const intersect = (p1: Pt, p2: Pt): Pt => {
      const d1 = (b[0] - a[0]) * (p1[1] - a[1]) - (b[1] - a[1]) * (p1[0] - a[0]);
      const d2 = (b[0] - a[0]) * (p2[1] - a[1]) - (b[1] - a[1]) * (p2[0] - a[0]);
      const t = d1 / (d1 - d2);
      return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
    };
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      if (inside(cur)) {
        if (!inside(prev)) output.push(intersect(prev, cur));
        output.push(cur);
      } else if (inside(prev)) {
        output.push(intersect(prev, cur));
      }
    }
    if (output.length === 0) break;
  }
  return output;
}

describe('tangram pieces do not overlap', () => {
  for (const hard of [false, true]) {
    for (const pz of getPuzzles('tangram', hard)) {
      it(`${pz.id} (${hard ? 'hard' : 'easy'})`, () => {
        const polys = pz.pieces.map((p) => ({ id: p.id, poly: worldPoly(p) }));
        for (let i = 0; i < polys.length; i++) {
          for (let j = i + 1; j < polys.length; j++) {
            const inter = clip(polys[i].poly, polys[j].poly);
            const ov = inter.length >= 3 ? area(inter) : 0;
            expect(
              ov,
              `${pz.id}: ${polys[i].id} と ${polys[j].id} が ${ov.toFixed(0)}px² かさなっています`,
            ).toBeLessThan(25);
          }
        }
      });
    }
  }
});
