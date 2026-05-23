import { describe, it, expect } from 'vitest';
import { pickNextSkill, type SkillWeight } from '../../../src/lib/challenge/spacedRepetition';
import type { MasteryMap } from '../../../src/lib/mastery';

const now = 1_000_000;
const DAY = 86_400_000;

describe('pickNextSkill', () => {
  const skills: SkillWeight[] = [
    { skillId: 'addition', weight: 1 },
    { skillId: 'subtraction', weight: 1 },
    { skillId: 'cherry-calc', weight: 1 },
  ];

  it('picks from skills list', () => {
    const map: MasteryMap = {};
    const result = pickNextSkill(map, skills, now);
    expect(skills.map((s) => s.skillId)).toContain(result);
  });

  it('prioritizes skill not seen recently', () => {
    const map: MasteryMap = {
      addition: { correct: 5, wrong: 0, lastAt: now - DAY * 10 },
      subtraction: { correct: 5, wrong: 0, lastAt: now - DAY },
      'cherry-calc': { correct: 5, wrong: 0, lastAt: now - DAY * 5 },
    };
    const result = pickNextSkill(map, skills, now, () => 0);
    expect(result).toBe('addition');
  });

  it('returns first skill when map is empty', () => {
    const result = pickNextSkill({}, skills, now, () => 0);
    expect(skills.map((s) => s.skillId)).toContain(result);
  });
});
