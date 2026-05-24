import { describe, it, expect } from 'vitest';
import { SCENARIOS, pickScenario } from '../../src/data/scenarios';

const UNIT_IDS = [
  'make-ten',
  'addition',
  'subtraction',
  'cherry-calc',
  'big-addition',
  'big-subtraction',
  'multiplication',
  'division',
];

describe('SCENARIOS', () => {
  it('has at least one scenario for every unit', () => {
    for (const id of UNIT_IDS) {
      expect(SCENARIOS[id]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('every build() returns a non-empty string', () => {
    for (const id of UNIT_IDS) {
      for (const sc of SCENARIOS[id]) {
        expect(sc.build({ a: 3, b: 2 }).length).toBeGreaterThan(0);
        expect(sc.emoji.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('pickScenario', () => {
  it('returns a scenario for a known unit', () => {
    const sc = pickScenario('multiplication', () => 0);
    expect(sc).toBe(SCENARIOS['multiplication'][0]);
  });
});
