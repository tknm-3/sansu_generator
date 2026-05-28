import { describe, it, expect } from 'vitest';
import { buildAddition, buildSubtraction, buildBigAddition } from './problemBuilder';

describe('buildAddition', () => {
  it('こたえと scene を combine で返す', () => {
    const p = buildAddition(3, 2, '🍎');
    expect(p.type).toBe('addition');
    expect(p.answer).toBe(5);
    expect(p.scene).toEqual({ kind: 'combine', emoji: '🍎', a: 3, b: 2 });
    expect(p.hint).toContain('かぞえ');
  });
});

describe('buildSubtraction', () => {
  it('のこりと takeAway scene を返す', () => {
    const p = buildSubtraction(8, 3, '🍪');
    expect(p.type).toBe('subtraction');
    expect(p.answer).toBe(5);
    expect(p.scene).toEqual({ kind: 'takeAway', emoji: '🍪', total: 8, remove: 3 });
  });
});

describe('buildBigAddition', () => {
  it('桁から a,b を組み立て placeValue を返す', () => {
    const p = buildBigAddition(2, 3, 1, 4); // 23 + 14
    expect(p.a).toBe(23);
    expect(p.b).toBe(14);
    expect(p.answer).toBe(37);
    expect(p.scene).toEqual({ kind: 'placeValue', aTens: 2, aOnes: 3, bTens: 1, bOnes: 4 });
  });
});
