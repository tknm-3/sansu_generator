export interface UnitMeta {
  id: string;
  title: string;
  grade: string;
  curriculum: string;
  emoji: string;
}

export const UNITS: UnitMeta[] = [
  {
    id: 'make-ten',
    title: '10をつくる',
    grade: '年長〜小1',
    curriculum: '小1：10の合成・分解、加法の素地',
    emoji: '🔟',
  },
  {
    id: 'addition',
    title: 'たしざん',
    grade: '小1',
    curriculum: '小1：加法（1位数±1位数）',
    emoji: '➕',
  },
  {
    id: 'subtraction',
    title: 'ひきざん',
    grade: '小1',
    curriculum: '小1：減法（1位数±1位数）',
    emoji: '➖',
  },
  {
    id: 'cherry-calc',
    title: 'さくらんぼ計算',
    grade: '小1〜小2',
    curriculum: '小1：繰り上がりのある加法',
    emoji: '🍒',
  },
  {
    id: 'big-addition',
    title: '二桁のたしざん',
    grade: '小2',
    curriculum: '小2：加法（2位数）、繰り上がり',
    emoji: '🔢',
  },
  {
    id: 'big-subtraction',
    title: '二桁のひきざん',
    grade: '小2',
    curriculum: '小2：減法（2位数）、繰り下がり',
    emoji: '🔣',
  },
  {
    id: 'multiplication',
    title: 'かけ算',
    grade: '小2〜小3',
    curriculum: '小2：乗法の意味、九九',
    emoji: '✖️',
  },
  {
    id: 'division',
    title: 'わり算',
    grade: '小3',
    curriculum: '小3：除法、余りのある除法',
    emoji: '➗',
  },
  {
    id: 'word-addition',
    title: 'ぴったり？（たしざん）',
    grade: '年長〜小1',
    curriculum: '小1：たしざんを使った文章題、過不足の比較',
    emoji: '🤔',
  },
  {
    id: 'word-subtraction',
    title: 'ぴったり？（ひきざん）',
    grade: '年長〜小1',
    curriculum: '小1：ひきざんを使った文章題、過不足の比較',
    emoji: '💭',
  },
];

export function getUnit(id: string): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}
