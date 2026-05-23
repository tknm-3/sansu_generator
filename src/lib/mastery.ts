import { loadJson, saveJson } from './storage';

export interface SkillRecord {
  correct: number;
  wrong: number;
  lastAt: number;
}

export type MasteryMap = Record<string, SkillRecord>;

const KEY = 'math-app:mastery';

export function loadMastery(): MasteryMap {
  return loadJson<MasteryMap>(KEY, {});
}

export function saveMastery(m: MasteryMap): void {
  saveJson(KEY, m);
}

export function recordAnswer(
  map: MasteryMap,
  skillId: string,
  correct: boolean,
  at: number,
): MasteryMap {
  const prev = map[skillId] ?? { correct: 0, wrong: 0, lastAt: 0 };
  return {
    ...map,
    [skillId]: {
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      lastAt: at,
    },
  };
}

export function getMasteryLevel(map: MasteryMap, skillId: string): 0 | 1 | 2 | 3 {
  const r = map[skillId];
  if (!r) return 0;
  const total = r.correct + r.wrong;
  const acc = total === 0 ? 0 : r.correct / total;
  if (r.correct >= 10 && acc >= 0.8) return 3;
  if (r.correct >= 5 && acc >= 0.7) return 2;
  if (r.correct >= 1 && acc >= 0.6) return 1;
  return 0;
}

export function getSkillForReview(
  map: MasteryMap,
  candidates: string[],
): string | null {
  if (candidates.length === 0) return null;
  const known = candidates.filter((s) => map[s]);
  if (known.length === 0) return candidates[0];
  return known.sort((a, b) => (map[a]?.lastAt ?? 0) - (map[b]?.lastAt ?? 0))[0];
}
