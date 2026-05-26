import { getUnitStampCount, type StampEntry } from '../rewards/stamps';

export type CharacterCategory = 'sansu' | 'katachi';

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  unitId: string | null; // null = 最初から解放
  unlockStamps: number;  // その単元で必要なスタンプ数
  maxLevel: number;      // 最大レベル（1 = パワーアップなし）
  description: string;
  category: CharacterCategory;
}

export const CHARACTER_DEFS: CharacterDef[] = [
  // ── さんすうキャラ ──
  { id: 'usagi',     name: 'うさぎ',      emoji: '🐰', unitId: null,                 unlockStamps: 0, maxLevel: 1, description: 'さいしょから いっしょにいる なかま',              category: 'sansu' },
  { id: 'hiyoko',    name: 'ひよこ',      emoji: '🐥', unitId: 'make-ten',           unlockStamps: 3, maxLevel: 3, description: '「10をつくる」を がんばって なかまに！',           category: 'sansu' },
  { id: 'kuma',      name: 'くま',        emoji: '🐻', unitId: 'addition',           unlockStamps: 3, maxLevel: 3, description: '「たしざん」を がんばって なかまに！',             category: 'sansu' },
  { id: 'neko',      name: 'ねこ',        emoji: '🐱', unitId: 'subtraction',        unlockStamps: 3, maxLevel: 3, description: '「ひきざん」を がんばって なかまに！',             category: 'sansu' },
  { id: 'panda',     name: 'パンダ',      emoji: '🐼', unitId: 'cherry-calc',        unlockStamps: 3, maxLevel: 3, description: '「さくらんぼ計算」を がんばって なかまに！',       category: 'sansu' },
  { id: 'hamster',   name: 'はむちゃん',  emoji: '🐹', unitId: 'big-addition',       unlockStamps: 3, maxLevel: 3, description: '「二桁のたしざん」を がんばって なかまに！',       category: 'sansu' },
  { id: 'frog',      name: 'かえる',      emoji: '🐸', unitId: 'big-subtraction',    unlockStamps: 3, maxLevel: 3, description: '「二桁のひきざん」を がんばって なかまに！',       category: 'sansu' },
  { id: 'fox',       name: 'きつね',      emoji: '🦊', unitId: 'multiplication',     unlockStamps: 3, maxLevel: 3, description: '「かけ算」を がんばって なかまに！',               category: 'sansu' },
  { id: 'tiger',     name: 'とら',        emoji: '🐯', unitId: 'division',           unlockStamps: 3, maxLevel: 3, description: '「わり算」を がんばって なかまに！',               category: 'sansu' },
  { id: 'lion',      name: 'ライオン',    emoji: '🦁', unitId: 'word-multiplication', unlockStamps: 3, maxLevel: 3, description: '「ぴったり？かけ算」を がんばって なかまに！',    category: 'sansu' },
  { id: 'wolf',      name: 'おおかみ',    emoji: '🐺', unitId: 'word-division',      unlockStamps: 3, maxLevel: 3, description: '「ぴったり？わり算」を がんばって なかまに！',    category: 'sansu' },
  // ── かたちキャラ ──
  { id: 'penguin',   name: 'ペンギン',    emoji: '🐧', unitId: null,                 unlockStamps: 0, maxLevel: 1, description: 'かたちの せかいへ ようこそ！',                     category: 'katachi' },
  { id: 'owl',       name: 'ふくろう',    emoji: '🦉', unitId: 'shape-rotation',     unlockStamps: 3, maxLevel: 3, description: '「くるっとまわしたら？」を がんばって なかまに！',   category: 'katachi' },
  { id: 'beaver',    name: 'ビーバー',    emoji: '🦫', unitId: 'shape-compose',      unlockStamps: 3, maxLevel: 3, description: '「かたちをあわせると？」を がんばって なかまに！',   category: 'katachi' },
  { id: 'elephant',  name: 'ぞう',        emoji: '🐘', unitId: 'shape-viewpoint',    unlockStamps: 3, maxLevel: 3, description: '「うえから見ると？」を がんばって なかまに！',       category: 'katachi' },
  { id: 'butterfly', name: 'ちょうちょ',  emoji: '🦋', unitId: 'shape-fold',         unlockStamps: 3, maxLevel: 3, description: '「おりがみをひらくと？」を がんばって なかまに！',   category: 'katachi' },
  { id: 'peacock',   name: 'くじゃく',    emoji: '🦚', unitId: 'shape-pattern',      unlockStamps: 3, maxLevel: 3, description: '「つぎはどれ？」を がんばって なかまに！',           category: 'katachi' },
  { id: 'bee',       name: 'みつばち',    emoji: '🐝', unitId: 'shape-spatial',      unlockStamps: 3, maxLevel: 3, description: '「どこにいる？」を がんばって なかまに！',           category: 'katachi' },
  { id: 'raccoon',   name: 'アライグマ',  emoji: '🦝', unitId: 'shape-fit',          unlockStamps: 3, maxLevel: 3, description: '「ぴったりはめよう」を がんばって なかまに！',       category: 'katachi' },
  { id: 'unicorn',   name: 'ユニコーン',  emoji: '🦄', unitId: 'shape-tangram',      unlockStamps: 3, maxLevel: 3, description: '「タングラム」を がんばって なかまに！',             category: 'katachi' },
];

/** スタンプ数からキャラクターのレベルを計算する（0=未解放, 1〜maxLevel） */
export function getCharLevel(stamps: number, def: CharacterDef): number {
  if (def.unitId === null) return 1;
  if (stamps < def.unlockStamps) return 0;
  return Math.min(def.maxLevel, Math.floor(stamps / def.unlockStamps));
}

/** 次のレベルアップに必要な残りスタンプ数（maxLevelなら0） */
export function getStampsToNextLevel(stamps: number, def: CharacterDef): number {
  const level = getCharLevel(stamps, def);
  if (level >= def.maxLevel) return 0;
  return (level + 1) * def.unlockStamps - stamps;
}

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
