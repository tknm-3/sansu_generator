import { getUnitStampCount, type StampEntry } from '../rewards/stamps';

export type CharacterCategory = 'sansu' | 'katachi';

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  unitId: string | null; // null = 最初から解放
  unlockStamps: number;  // その単元で必要なスタンプ数
  description: string;
  category: CharacterCategory;
}

export const CHARACTER_DEFS: CharacterDef[] = [
  // ── さんすうキャラ ──
  { id: 'usagi',     name: 'うさぎ',      emoji: '🐰', unitId: null,              unlockStamps: 0, description: 'さいしょから いっしょにいる なかま',            category: 'sansu' },
  { id: 'hiyoko',    name: 'ひよこ',      emoji: '🐥', unitId: 'make-ten',        unlockStamps: 3, description: '「10をつくる」を がんばって なかまに！',         category: 'sansu' },
  { id: 'kuma',      name: 'くま',        emoji: '🐻', unitId: 'addition',        unlockStamps: 3, description: '「たしざん」を がんばって なかまに！',           category: 'sansu' },
  { id: 'neko',      name: 'ねこ',        emoji: '🐱', unitId: 'subtraction',     unlockStamps: 3, description: '「ひきざん」を がんばって なかまに！',           category: 'sansu' },
  { id: 'panda',     name: 'パンダ',      emoji: '🐼', unitId: 'cherry-calc',     unlockStamps: 3, description: '「さくらんぼ計算」を がんばって なかまに！',     category: 'sansu' },
  { id: 'hamster',   name: 'はむちゃん',  emoji: '🐹', unitId: 'big-addition',    unlockStamps: 3, description: '「二桁のたしざん」を がんばって なかまに！',     category: 'sansu' },
  { id: 'frog',      name: 'かえる',      emoji: '🐸', unitId: 'big-subtraction', unlockStamps: 3, description: '「二桁のひきざん」を がんばって なかまに！',     category: 'sansu' },
  { id: 'fox',       name: 'きつね',      emoji: '🦊', unitId: 'multiplication',  unlockStamps: 3, description: '「かけ算」を がんばって なかまに！',             category: 'sansu' },
  { id: 'tiger',     name: 'とら',        emoji: '🐯', unitId: 'division',        unlockStamps: 3, description: '「わり算」を がんばって なかまに！',             category: 'sansu' },
  // ── かたちキャラ ──
  { id: 'penguin',   name: 'ペンギン',    emoji: '🐧', unitId: null,              unlockStamps: 0, description: 'かたちの せかいへ ようこそ！',                       category: 'katachi' },
  { id: 'owl',       name: 'ふくろう',    emoji: '🦉', unitId: 'shape-rotation',  unlockStamps: 3, description: '「くるっとまわしたら？」を がんばって なかまに！',     category: 'katachi' },
  { id: 'beaver',    name: 'ビーバー',    emoji: '🦫', unitId: 'shape-compose',   unlockStamps: 3, description: '「かたちをあわせると？」を がんばって なかまに！',     category: 'katachi' },
  { id: 'elephant',  name: 'ぞう',        emoji: '🐘', unitId: 'shape-viewpoint', unlockStamps: 3, description: '「うえから見ると？」を がんばって なかまに！',         category: 'katachi' },
  { id: 'butterfly', name: 'ちょうちょ',  emoji: '🦋', unitId: 'shape-fold',      unlockStamps: 3, description: '「おりがみをひらくと？」を がんばって なかまに！',     category: 'katachi' },
  { id: 'peacock',   name: 'くじゃく',    emoji: '🦚', unitId: 'shape-pattern',   unlockStamps: 3, description: '「つぎはどれ？」を がんばって なかまに！',             category: 'katachi' },
  { id: 'bee',       name: 'みつばち',    emoji: '🐝', unitId: 'shape-spatial',   unlockStamps: 3, description: '「どこにいる？」を がんばって なかまに！',             category: 'katachi' },
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
