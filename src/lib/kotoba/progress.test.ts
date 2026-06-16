import { describe, it, expect, beforeEach } from 'vitest';
import { WORLDS } from './worlds';
import {
  recordWorldClear, isWorldUnlocked, worldFrontier, worldStatus, WORLD_LOOKAHEAD,
} from './progress';

// localStorage を 毎回 まっさらにして 判定する
beforeEach(() => {
  localStorage.clear();
});

describe('ことば 進捗・解放（としょかんモードと同じ）', () => {
  it('実績なし: さいしょ＋さきどりぶん だけ あそべる', () => {
    expect(isWorldUnlocked(0)).toBe(true);
    expect(isWorldUnlocked(WORLD_LOOKAHEAD)).toBe(true);
    expect(isWorldUnlocked(WORLD_LOOKAHEAD + 1)).toBe(false);
    expect(worldFrontier()).toBe(0);
  });

  it('クリアすると フロンティアが すすむ', () => {
    recordWorldClear(WORLDS[0].id, 3);
    recordWorldClear(WORLDS[1].id, 2);
    expect(worldFrontier()).toBe(2);
    // フロンティア＋さきどり まで あそべる
    expect(isWorldUnlocked(2 + WORLD_LOOKAHEAD)).toBe(true);
    expect(isWorldUnlocked(3 + WORLD_LOOKAHEAD)).toBe(false);
  });

  it('クリア済みは つねに あそべる（やりなおし）', () => {
    recordWorldClear(WORLDS[5].id, 1);
    expect(isWorldUnlocked(5)).toBe(true);
    expect(worldStatus(5)).toBe('cleared');
  });

  it('じょうたいは cleared/current/new/locked に わかれる', () => {
    recordWorldClear(WORLDS[0].id, 3);
    expect(worldStatus(0)).toBe('cleared'); // やった
    expect(worldStatus(1)).toBe('current'); // いまここ
    expect(worldStatus(2)).toBe('new'); // さきどり（あそべる）
    expect(worldStatus(WORLDS.length - 1)).toBe('locked'); // まだ
  });

  it('ベストな きらきらは リプレイで さがらない', () => {
    recordWorldClear(WORLDS[0].id, 1);
    recordWorldClear(WORLDS[0].id, 3);
    recordWorldClear(WORLDS[0].id, 2);
    expect(worldStatus(0)).toBe('cleared');
  });
});
