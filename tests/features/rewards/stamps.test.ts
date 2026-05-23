import { describe, it, expect } from 'vitest';
import { addStamp, type StampState } from '../../../src/features/rewards/stamps';

const empty: StampState = { total: 0, history: [] };

describe('addStamp', () => {
  it('increments total and appends history entry', () => {
    const next = addStamp(empty, 'make-ten', 1000);
    expect(next.total).toBe(1);
    expect(next.history).toEqual([{ unitId: 'make-ten', at: 1000 }]);
  });
  it('does not mutate the input state', () => {
    addStamp(empty, 'make-ten', 1000);
    expect(empty.total).toBe(0);
    expect(empty.history).toHaveLength(0);
  });
});
