import { describe, it, expect } from 'vitest';
import {
  buildAddition,
  buildSubtraction,
  buildBigAddition,
  buildPittari,
  pittariVerdict,
  buildMultiplication,
  buildDivision,
  ADD_GOALS,
  SUB_GOALS,
  MUL_GOALS,
  DIV_GOALS,
  BIGADD_GOALS,
  type GoalSpec,
} from './problemBuilder';

function goal<S>(goals: GoalSpec<S>[], id: string): GoalSpec<S> {
  const g = goals.find((x) => x.id === id);
  if (!g) throw new Error(`goal not found: ${id}`);
  return g;
}

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

describe('お題（GoalSpec）の達成判定', () => {
  it('たしざん: ぴったり/以上/10をつくる/おなじ かず', () => {
    expect(goal(ADD_GOALS, 'exact').reached({ a: 3, b: 2 }, 5)).toBe(true);
    expect(goal(ADD_GOALS, 'exact').reached({ a: 3, b: 3 }, 5)).toBe(false);
    expect(goal(ADD_GOALS, 'atleast').reached({ a: 4, b: 3 }, 6)).toBe(true);
    expect(goal(ADD_GOALS, 'atleast').reached({ a: 2, b: 2 }, 6)).toBe(false);
    expect(goal(ADD_GOALS, 'maketen').reached({ a: 6, b: 4 }, 10)).toBe(true);
    expect(goal(ADD_GOALS, 'maketen').reached({ a: 5, b: 4 }, 10)).toBe(false);
    expect(goal(ADD_GOALS, 'double').reached({ a: 3, b: 3 }, 0)).toBe(true);
    expect(goal(ADD_GOALS, 'double').reached({ a: 0, b: 0 }, 0)).toBe(false);
    expect(goal(ADD_GOALS, 'double').reached({ a: 3, b: 2 }, 0)).toBe(false);
  });

  it('ひきざん: のこる/ぜんぶ なくなる/以上 のこる/10から', () => {
    expect(goal(SUB_GOALS, 'leave').reached({ total: 8, remove: 3 }, 5)).toBe(true);
    expect(goal(SUB_GOALS, 'empty').reached({ total: 5, remove: 5 }, 0)).toBe(true);
    expect(goal(SUB_GOALS, 'empty').reached({ total: 0, remove: 0 }, 0)).toBe(false);
    expect(goal(SUB_GOALS, 'leaveAtleast').reached({ total: 9, remove: 2 }, 3)).toBe(true);
    expect(goal(SUB_GOALS, 'leaveAtleast').reached({ total: 5, remove: 4 }, 3)).toBe(false);
    expect(goal(SUB_GOALS, 'fromten').reached({ total: 10, remove: 3 }, 7)).toBe(true);
    expect(goal(SUB_GOALS, 'fromten').reached({ total: 8, remove: 1 }, 7)).toBe(false);
  });

  it('かけざん: ぴったり/○こずつ/以上/2ばい', () => {
    expect(goal(MUL_GOALS, 'exact').reached({ groups: 3, perGroup: 4 }, 12)).toBe(true);
    expect(goal(MUL_GOALS, 'pereach').reached({ groups: 3, perGroup: 2 }, 2)).toBe(true);
    expect(goal(MUL_GOALS, 'pereach').reached({ groups: 3, perGroup: 3 }, 2)).toBe(false);
    expect(goal(MUL_GOALS, 'atleast').reached({ groups: 4, perGroup: 4 }, 10)).toBe(true);
    expect(goal(MUL_GOALS, 'double').reached({ groups: 2, perGroup: 3 }, 0)).toBe(true);
    expect(goal(MUL_GOALS, 'double').reached({ groups: 3, perGroup: 3 }, 0)).toBe(false);
  });

  it('わりざん: あまり/あまり なし/○こずつ', () => {
    expect(goal(DIV_GOALS, 'remainder').reached({ total: 7, groups: 2 }, 1)).toBe(true);
    expect(goal(DIV_GOALS, 'remainder').reached({ total: 8, groups: 2 }, 1)).toBe(false);
    expect(goal(DIV_GOALS, 'noremainder').reached({ total: 8, groups: 2 }, 0)).toBe(true);
    expect(goal(DIV_GOALS, 'noremainder').reached({ total: 7, groups: 2 }, 0)).toBe(false);
    expect(goal(DIV_GOALS, 'pereach').reached({ total: 9, groups: 4 }, 2)).toBe(true);
    expect(goal(DIV_GOALS, 'pereach').reached({ total: 12, groups: 4 }, 2)).toBe(false);
  });

  it('2けた: より大きい/以上/より小さい/きりのいい数/位取り', () => {
    expect(goal(BIGADD_GOALS, 'greater').reached({ total: 50 }, 40)).toBe(true);
    expect(goal(BIGADD_GOALS, 'greater').reached({ total: 40 }, 40)).toBe(false);
    expect(goal(BIGADD_GOALS, 'atleast').reached({ total: 40 }, 40)).toBe(true);
    expect(goal(BIGADD_GOALS, 'less').reached({ total: 30 }, 40)).toBe(true);
    expect(goal(BIGADD_GOALS, 'less').reached({ total: 40 }, 40)).toBe(false);
    expect(goal(BIGADD_GOALS, 'round').reached({ total: 40 }, 40)).toBe(true);
    expect(goal(BIGADD_GOALS, 'tensplace').reached({ total: 53 }, 5)).toBe(true);
    expect(goal(BIGADD_GOALS, 'tensplace').reached({ total: 63 }, 5)).toBe(false);
  });
});
