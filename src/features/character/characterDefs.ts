import { getUnitStampCount, type StampEntry } from '../rewards/stamps';

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  unitId: string | null; // null = 最初から解放
  unlockStamps: number;  // その単元で必要なスタンプ数
  description: string;
}

export const CHARACTER_DEFS: CharacterDef[] = [
  { id: 'usagi',    name: 'うさぎ',      emoji: '🐰', unitId: null,              unlockStamps: 0, description: 'さいしょから いっしょにいる なかま' },
  { id: 'hiyoko',   name: 'ひよこ',      emoji: '🐥', unitId: 'make-ten',        unlockStamps: 3, description: '「10をつくる」を がんばって なかまに！' },
  { id: 'kuma',     name: 'くま',        emoji: '🐻', unitId: 'addition',        unlockStamps: 3, description: '「たしざん」を がんばって なかまに！' },
  { id: 'neko',     name: 'ねこ',        emoji: '🐱', unitId: 'subtraction',     unlockStamps: 3, description: '「ひきざん」を がんばって なかまに！' },
  { id: 'panda',    name: 'パンダ',      emoji: '🐼', unitId: 'cherry-calc',     unlockStamps: 3, description: '「さくらんぼ計算」を がんばって なかまに！' },
  { id: 'hamster',  name: 'はむちゃん',  emoji: '🐹', unitId: 'big-addition',    unlockStamps: 3, description: '「二桁のたしざん」を がんばって なかまに！' },
  { id: 'frog',     name: 'かえる',      emoji: '🐸', unitId: 'big-subtraction', unlockStamps: 3, description: '「二桁のひきざん」を がんばって なかまに！' },
  { id: 'fox',      name: 'きつね',      emoji: '🦊', unitId: 'multiplication',  unlockStamps: 3, description: '「かけ算」を がんばって なかまに！' },
  { id: 'tiger',    name: 'とら',        emoji: '🐯', unitId: 'division',        unlockStamps: 3, description: '「わり算」を がんばって なかまに！' },
];

export function getUnlockedDefs(history: StampEntry[]): CharacterDef[] {
  return CHARACTER_DEFS.filter((c) => {
    if (c.unitId === null) return true;
    return getUnitStampCount(history, c.unitId) >= c.unlockStamps;
  });
}

export function getLockedDefs(history: StampEntry[]): CharacterDef[] {
  return CHARACTER_DEFS.filter((c) => {
    if (c.unitId === null) return false;
    return getUnitStampCount(history, c.unitId) < c.unlockStamps;
  });
}
