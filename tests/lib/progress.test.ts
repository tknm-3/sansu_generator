import { describe, it, expect } from 'vitest';
import { countByDay, currentStreak } from '../../src/lib/progress';
import type { StampEntry } from '../../src/features/rewards/stamps';

function at(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d, 12, 0).getTime();
}

describe('countByDay', () => {
  it('日付ごとのスタンプ数を集計する', () => {
    const history: StampEntry[] = [
      { unitId: 'addition', at: at(2026, 5, 24) },
      { unitId: 'subtraction', at: at(2026, 5, 24) },
      { unitId: 'addition', at: at(2026, 5, 23) },
    ];
    const map = countByDay(history);
    expect(map.get('2026-05-24')).toBe(2);
    expect(map.get('2026-05-23')).toBe(1);
  });
});

describe('currentStreak', () => {
  it('今日から連続でスタンプがある日数を返す', () => {
    const today = at(2026, 5, 24);
    const history: StampEntry[] = [
      { unitId: 'a', at: at(2026, 5, 24) },
      { unitId: 'a', at: at(2026, 5, 23) },
      { unitId: 'a', at: at(2026, 5, 22) },
    ];
    expect(currentStreak(history, today)).toBe(3);
  });
  it('今日やっていなければ0', () => {
    const today = at(2026, 5, 24);
    const history: StampEntry[] = [{ unitId: 'a', at: at(2026, 5, 23) }];
    expect(currentStreak(history, today)).toBe(0);
  });
  it('間が空いたら途切れる', () => {
    const today = at(2026, 5, 24);
    const history: StampEntry[] = [
      { unitId: 'a', at: at(2026, 5, 24) },
      { unitId: 'a', at: at(2026, 5, 22) },
    ];
    expect(currentStreak(history, today)).toBe(1);
  });
});
