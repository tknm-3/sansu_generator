import { describe, it, expect } from 'vitest';
import {
  buildAddition,
  buildSubtraction,
  buildBigAddition,
  buildPittari,
  pittariVerdict,
  buildMultiplication,
  buildDivision,
} from './problemBuilder';

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

describe('buildMultiplication', () => {
  it('groups × perGroup と groups scene を返す', () => {
    const p = buildMultiplication(3, 4, '🍩');
    expect(p.type).toBe('multiplication');
    expect(p.answer).toBe(12);
    expect(p.scene).toEqual({ kind: 'groups', emoji: '🍩', groups: 3, perGroup: 4 });
  });
});

describe('buildDivision', () => {
  it('わり切れる: floor と shareOut scene、あまり 0 を返す', () => {
    const p = buildDivision(12, 3, '🍪');
    expect(p.type).toBe('division');
    expect(p.answer).toBe(4);
    expect(p.remainder).toBe(0);
    expect(p.scene).toEqual({ kind: 'shareOut', emoji: '🍪', total: 12, groups: 3 });
    expect(p.questionText).not.toContain('あまる');
  });
  it('あまりがある場合は floor と あまりを返し、問題文で あまりを問う', () => {
    const p = buildDivision(7, 2, '🍪');
    expect(p.answer).toBe(3);
    expect(p.remainder).toBe(1);
    expect(p.questionText).toContain('あまる');
  });
});

describe('pittariVerdict / buildPittari', () => {
  it('items === capacity は ぴったり、こたえ 0', () => {
    expect(pittariVerdict(5, 5)).toBe('ぴったり');
    expect(buildPittari(5, 5, '🍎').answer).toBe(0);
  });
  it('items < capacity は あまる、こたえ = capacity - items', () => {
    expect(pittariVerdict(3, 5)).toBe('あまる');
    const p = buildPittari(3, 5, '🍎');
    expect(p.answer).toBe(2);
    expect(p.scene).toEqual({ kind: 'container', emoji: '🍎', items: 3, capacity: 5 });
  });
  it('items > capacity は たりない、こたえ = items - capacity', () => {
    expect(pittariVerdict(7, 4)).toBe('たりない');
    expect(buildPittari(7, 4, '🍎').answer).toBe(3);
  });
});
