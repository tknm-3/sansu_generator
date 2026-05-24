import { describe, it, expect } from 'vitest';
import { sceneFor } from './problemScene';

describe('sceneFor', () => {
  it('addition は combine を返す', () => {
    const s = sceneFor('addition', { a: 3, b: 4, choices: [] }, '🐱');
    expect(s).toEqual({ kind: 'combine', emoji: '🐱', a: 3, b: 4 });
  });
  it('subtraction は takeAway を返す (total=a, remove=b)', () => {
    const s = sceneFor('subtraction', { a: 7, b: 2, choices: [] }, '🍎');
    expect(s).toEqual({ kind: 'takeAway', emoji: '🍎', total: 7, remove: 2 });
  });
  it('big-addition は placeValue を返す (両オペランドの桁)', () => {
    const s = sceneFor('big-addition', { a: 23, b: 45, onesA: 3, tensA: 2, onesB: 5, tensB: 4, choices: [] }, '🍪');
    expect(s).toEqual({ kind: 'placeValue', aTens: 2, aOnes: 3, bTens: 4, bOnes: 5 });
  });
  it('big-subtraction は placeValue を返す', () => {
    const s = sceneFor('big-subtraction', { a: 58, b: 23, onesA: 8, tensA: 5, onesB: 3, tensB: 2, choices: [] }, '⭐');
    expect(s).toEqual({ kind: 'placeValue', aTens: 5, aOnes: 8, bTens: 2, bOnes: 3 });
  });
  it('未知の unitId は null', () => {
    expect(sceneFor('xyz', { a: 1, b: 1 }, '🍎')).toBeNull();
  });
});
