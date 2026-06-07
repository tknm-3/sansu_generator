import { describe, it, expect, beforeEach } from 'vitest';
import {
  isZoneUnlocked,
  zoneStatus,
  zoneFrontier,
  recordZoneClear,
  ZONE_LOOKAHEAD,
} from './progress';

const ZONES = ['z0', 'z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'];

beforeEach(() => {
  localStorage.clear();
});

describe('isZoneUnlocked（実績に応じた さきどりアンロック）', () => {
  it('はじめての子は さいしょの章だけ あそべる（ガイド）', () => {
    expect(isZoneUnlocked(0, ZONES)).toBe(true);
    expect(isZoneUnlocked(1, ZONES)).toBe(false);
    expect(isZoneUnlocked(3, ZONES)).toBe(false);
  });

  it('実績ができると フロンティア＋さきどりぶん まで ひらく', () => {
    recordZoneClear('z0', true, 3); // フロンティア=1
    expect(isZoneUnlocked(1, ZONES)).toBe(true); // つづき
    expect(isZoneUnlocked(1 + ZONE_LOOKAHEAD, ZONES)).toBe(true); // さきどり上限
    expect(isZoneUnlocked(2 + ZONE_LOOKAHEAD, ZONES)).toBe(false); // それより先は ロック
  });

  it('途中まで進んだ子は それより手前の章を いつでも あそべる（やりなおし）', () => {
    recordZoneClear('z0', true, 3);
    recordZoneClear('z1', true, 3);
    recordZoneClear('z2', true, 3); // フロンティア=3
    expect(isZoneUnlocked(0, ZONES)).toBe(true);
    expect(isZoneUnlocked(1, ZONES)).toBe(true);
    expect(isZoneUnlocked(3 + ZONE_LOOKAHEAD, ZONES)).toBe(true);
  });

  it('クリア済みの章は 窓の外でも あそべる（とばして先をクリアした場合）', () => {
    recordZoneClear('z6', true, 3); // 先の章をクリア済み
    expect(isZoneUnlocked(6, ZONES)).toBe(true);
  });
});

describe('zoneStatus（ハブの 4じょうたい）', () => {
  it('クリア済みは cleared', () => {
    recordZoneClear('z0', true, 3);
    expect(zoneStatus(0, ZONES)).toBe('cleared');
  });

  it('つぎに よむ つづきは current、その先の さきどりは new', () => {
    recordZoneClear('z0', true, 3); // フロンティア=1
    expect(zoneFrontier(ZONES)).toBe(1);
    expect(zoneStatus(1, ZONES)).toBe('current'); // つづき
    expect(zoneStatus(2, ZONES)).toBe('new'); // さきどり（まだ）
  });

  it('ひらいていない章は locked', () => {
    recordZoneClear('z0', true, 3);
    expect(zoneStatus(2 + ZONE_LOOKAHEAD, ZONES)).toBe('locked');
  });

  it('はじめての子は さいしょが current、つぎは locked', () => {
    expect(zoneStatus(0, ZONES)).toBe('current');
    expect(zoneStatus(1, ZONES)).toBe('locked');
  });
});
