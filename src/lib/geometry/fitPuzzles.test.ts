import { describe, it, expect } from 'vitest';
import { getPuzzles, silhouetteKey } from './fitPuzzles';

describe('silhouetteKey', () => {
  it('おおきなさんかく：3つの かどの さんかくは おなじ かたち（いれかえ かのう）', () => {
    const bt = getPuzzles('tangram', false).find((p) => p.id === 'bigtriangle')!;
    const top = bt.pieces.find((p) => p.id === 'bt-top')!;
    const left = bt.pieces.find((p) => p.id === 'bt-left')!;
    const right = bt.pieces.find((p) => p.id === 'bt-right')!;
    const mid = bt.pieces.find((p) => p.id === 'bt-mid')!;

    const k = (p: typeof top) => silhouetteKey(p.shape, p.w, p.h, p.targetRotation ?? 0);
    expect(k(top)).toBe(k(left));
    expect(k(top)).toBe(k(right));
    // まんなかの ぎゃくむき さんかくは べつの かたち
    expect(k(mid)).not.toBe(k(top));
  });

  it('おなじ かたちでも かいてんで シルエットが かわると かぎも かわる', () => {
    const tri = { type: 'poly', points: '50,0 0,90 100,90' } as const;
    expect(silhouetteKey(tri, 100, 90, 0)).not.toBe(silhouetteKey(tri, 100, 90, 180));
  });

  it('くるまの タイヤ（おなじ えん）は いれかえ かのう', () => {
    const car = getPuzzles('fit', true).find((p) => p.id === 'car')!;
    const l = car.pieces.find((p) => p.id === 'wheelL')!;
    const r = car.pieces.find((p) => p.id === 'wheelR')!;
    expect(silhouetteKey(l.shape, l.w, l.h, 0)).toBe(silhouetteKey(r.shape, r.w, r.h, 0));
  });
});
