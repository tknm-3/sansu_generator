import { describe, it, expect, beforeEach } from 'vitest';
import { WORLDS } from './worlds';
import {
  recordWorldClear, isWorldUnlocked, worldFrontier, worldStatus, WORLD_LOOKAHEAD,
  BOSS_INDEX, ADVANCED_START, isBossCleared,
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
    // きほん（1〜10）の おくのほうは まだ ロック（順番に ひらく）
    expect(worldStatus(BOSS_INDEX)).toBe('locked'); // ライン10（きほん末尾）はまだ
  });

  it('上級（11以降）は 実績なしでも いつでも あそべる', () => {
    // ボス未クリア・実績ゼロでも 上級グループは ぜんぶ あそべる（むずかしいのを すぐ）
    expect(isBossCleared()).toBe(false);
    for (let i = ADVANCED_START; i < WORLDS.length; i++) {
      expect(isWorldUnlocked(i)).toBe(true);
    }
    // 末尾の たつじんゾーンも あそべる（cleared でなく new 表示）
    expect(worldStatus(WORLDS.length - 1)).toBe('new');
  });

  it('きほん（1〜10）は 順番に ひらく（上級開放の えいきょうを うけない）', () => {
    // 実績なしでは さきどりぶん より さきの きほんは ロック
    expect(isWorldUnlocked(WORLD_LOOKAHEAD + 1)).toBe(false);
    expect(isWorldUnlocked(BOSS_INDEX)).toBe(false); // ライン10はまだ
  });

  it('ベストな きらきらは リプレイで さがらない', () => {
    recordWorldClear(WORLDS[0].id, 1);
    recordWorldClear(WORLDS[0].id, 3);
    recordWorldClear(WORLDS[0].id, 2);
    expect(worldStatus(0)).toBe('cleared');
  });
});
