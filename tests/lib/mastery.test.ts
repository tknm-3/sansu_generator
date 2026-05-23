import { describe, it, expect } from 'vitest';
import {
  recordAnswer,
  getMasteryLevel,
  getSkillForReview,
  type MasteryMap,
} from '../../src/lib/mastery';

const emptyMap: MasteryMap = {};
const now = 1000000;

describe('recordAnswer', () => {
  it('correct answer increments correct count', () => {
    const m = recordAnswer(emptyMap, 'addition', true, now);
    expect(m['addition'].correct).toBe(1);
    expect(m['addition'].wrong).toBe(0);
    expect(m['addition'].lastAt).toBe(now);
  });
  it('wrong answer increments wrong count', () => {
    const m = recordAnswer(emptyMap, 'addition', false, now);
    expect(m['addition'].wrong).toBe(1);
  });
  it('does not mutate input', () => {
    recordAnswer(emptyMap, 'addition', true, now);
    expect(emptyMap['addition']).toBeUndefined();
  });
});

describe('getMasteryLevel', () => {
  it('returns 0 for unknown skill', () => {
    expect(getMasteryLevel(emptyMap, 'addition')).toBe(0);
  });
  it('returns 1 with 1-4 correct and accuracy >= 60%', () => {
    let m = emptyMap;
    for (let i = 0; i < 3; i++) m = recordAnswer(m, 'addition', true, now);
    expect(getMasteryLevel(m, 'addition')).toBe(1);
  });
  it('returns 2 with 5-9 correct and accuracy >= 70%', () => {
    let m = emptyMap;
    for (let i = 0; i < 7; i++) m = recordAnswer(m, 'addition', true, now);
    expect(getMasteryLevel(m, 'addition')).toBe(2);
  });
  it('returns 3 with 10+ correct and accuracy >= 80%', () => {
    let m = emptyMap;
    for (let i = 0; i < 12; i++) m = recordAnswer(m, 'addition', true, now);
    expect(getMasteryLevel(m, 'addition')).toBe(3);
  });
});

describe('getSkillForReview', () => {
  it('returns null when no skills exist', () => {
    expect(getSkillForReview(emptyMap, [])).toBeNull();
  });
  it('returns oldest lastAt skill from candidates', () => {
    let m = recordAnswer(emptyMap, 'addition', true, 500);
    m = recordAnswer(m, 'subtraction', true, 1000);
    const skill = getSkillForReview(m, ['addition', 'subtraction']);
    expect(skill).toBe('addition');
  });
});
