import { describe, it, expect, beforeEach } from 'vitest';
import {
  addQuestClear,
  getSparkles,
  getQuestCleared,
  getAdventureSummary,
  SPARKLE_CLEAR,
  SPARKLE_PERFECT,
} from './progress';
import { ADVENTURE_QUEST } from './adventureLevels';

const Q1 = ADVENTURE_QUEST[0].id;
const Q2 = ADVENTURE_QUEST[1].id;

describe('ぼうけん：きらきら(✨)集め', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('さいしょは きらきら 0', () => {
    expect(getSparkles()).toBe(0);
  });

  it('ふつうクリアで SPARKLE_CLEAR、ぴったりで SPARKLE_PERFECT もらえる', () => {
    expect(addQuestClear(Q1, false)).toBe(SPARKLE_CLEAR);
    expect(getSparkles()).toBe(SPARKLE_CLEAR);
    expect(addQuestClear(Q2, true)).toBe(SPARKLE_PERFECT);
    expect(getSparkles()).toBe(SPARKLE_CLEAR + SPARKLE_PERFECT);
  });

  it('おなじ問題を リプレイすると きらきらが さらに ふえる（リプレイのどうきづけ）', () => {
    addQuestClear(Q1, false);
    addQuestClear(Q1, false);
    addQuestClear(Q1, true);
    expect(getSparkles()).toBe(SPARKLE_CLEAR * 2 + SPARKLE_PERFECT);
  });

  it('ぴったり賞は いちど とれば のこる（あとで ふつうクリアしても きえない）', () => {
    addQuestClear(Q1, true);
    expect(getQuestCleared(Q1)?.perfect).toBe(true);
    addQuestClear(Q1, false);
    expect(getQuestCleared(Q1)?.perfect).toBe(true);
  });

  it('getAdventureSummary は クリア数・ぴったり数を かぞえる（リプレイで 二重カウントしない）', () => {
    addQuestClear(Q1, false);
    addQuestClear(Q1, true); // 同じ問題のリプレイ
    addQuestClear(Q2, false);
    const s = getAdventureSummary();
    expect(s.total).toBe(ADVENTURE_QUEST.length);
    expect(s.clearedCount).toBe(2); // Q1, Q2 の 2問
    expect(s.perfectCount).toBe(1); // Q1 だけ ぴったり
  });
});
