import type { MasteryMap } from '../mastery';

export interface SkillWeight {
  skillId: string;
  weight: number;
}

/**
 * スキルリストから次に出題するスキルを選ぶ。
 * lastAt が最も古いスキルを優先。rng はテスト注入用。
 */
export function pickNextSkill(
  map: MasteryMap,
  skills: SkillWeight[],
  now: number,
  rng: () => number = Math.random,
): string {
  if (skills.length === 0) return '';

  const scored = skills.map(({ skillId }) => {
    const r = map[skillId];
    const lastAt = r?.lastAt ?? 0;
    const staleness = now - lastAt;
    return { skillId, staleness };
  });

  scored.sort((a, b) => b.staleness - a.staleness);

  const topN = Math.min(2, scored.length);
  const pick = Math.floor(rng() * topN);
  return scored[pick].skillId;
}
