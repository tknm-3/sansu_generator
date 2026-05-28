export type ProblemScene =
  | { kind: 'combine'; emoji: string; a: number; b: number }
  | { kind: 'takeAway'; emoji: string; total: number; remove: number }
  | { kind: 'placeValue'; aTens: number; aOnes: number; bTens: number; bOnes: number }
  | { kind: 'container'; emoji: string; items: number; capacity: number };

export function sceneFor(
  unitId: string,
  problem: Record<string, unknown>,
  emoji: string,
): ProblemScene | null {
  const num = (key: string): number => {
    const v = problem[key];
    return typeof v === 'number' ? v : 0;
  };
  switch (unitId) {
    case 'addition':
      return { kind: 'combine', emoji, a: num('a'), b: num('b') };
    case 'subtraction':
      return { kind: 'takeAway', emoji, total: num('a'), remove: num('b') };
    case 'big-addition':
    case 'big-subtraction':
      return { kind: 'placeValue', aTens: num('tensA'), aOnes: num('onesA'), bTens: num('tensB'), bOnes: num('onesB') };
    default:
      return null;
  }
}
