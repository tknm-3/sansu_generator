export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  unlockStamps: number;
  description: string;
}

export const CHARACTER_DEFS: CharacterDef[] = [
  { id: 'usagi', name: 'うさぎ', emoji: '🐰', unlockStamps: 0, description: 'さいしょから いっしょにいる なかま' },
  { id: 'hiyoko', name: 'ひよこ', emoji: '🐥', unlockStamps: 5, description: 'スタンプ5こで かわいい ひよこが なかまに！' },
  { id: 'kuma', name: 'くま', emoji: '🐻', unlockStamps: 10, description: 'スタンプ10こで おおきな くまが なかまに！' },
  { id: 'neko', name: 'ねこ', emoji: '🐱', unlockStamps: 20, description: 'スタンプ20こで のんびり ねこが なかまに！' },
  { id: 'panda', name: 'パンダ', emoji: '🐼', unlockStamps: 35, description: 'スタンプ35こで まるまる パンダが なかまに！' },
];

export function getUnlockedDefs(totalStamps: number): CharacterDef[] {
  return CHARACTER_DEFS.filter((c) => totalStamps >= c.unlockStamps);
}

export function getLockedDefs(totalStamps: number): CharacterDef[] {
  return CHARACTER_DEFS.filter((c) => totalStamps < c.unlockStamps);
}
