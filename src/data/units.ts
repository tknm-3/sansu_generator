export type Category = 'sansu' | 'katachi';

export interface UnitMeta {
  id: string;
  category: Category;
  title: string;
  grade: string;
  curriculum: string;
  emoji: string;
}

export const UNITS: UnitMeta[] = [
  {
    id: 'make-ten',
    category: 'sansu',
    title: '10をつくる',
    grade: '年長〜小1',
    curriculum: '小1：10の合成・分解、加法の素地',
    emoji: '🔟',
  },
  {
    id: 'addition',
    category: 'sansu',
    title: 'たしざん',
    grade: '小1',
    curriculum: '小1：加法（1位数±1位数）',
    emoji: '➕',
  },
  {
    id: 'subtraction',
    category: 'sansu',
    title: 'ひきざん',
    grade: '小1',
    curriculum: '小1：減法（1位数±1位数）',
    emoji: '➖',
  },
  {
    id: 'cherry-calc',
    category: 'sansu',
    title: 'さくらんぼ計算',
    grade: '小1〜小2',
    curriculum: '小1：繰り上がりのある加法',
    emoji: '🍒',
  },
  {
    id: 'big-addition',
    category: 'sansu',
    title: '二桁のたしざん',
    grade: '小2',
    curriculum: '小2：加法（2位数）、繰り上がり',
    emoji: '🔢',
  },
  {
    id: 'big-subtraction',
    category: 'sansu',
    title: '二桁のひきざん',
    grade: '小2',
    curriculum: '小2：減法（2位数）、繰り下がり',
    emoji: '🔣',
  },
  {
    id: 'multiplication',
    category: 'sansu',
    title: 'かけ算',
    grade: '小2〜小3',
    curriculum: '小2：乗法の意味、九九',
    emoji: '✖️',
  },
  {
    id: 'division',
    category: 'sansu',
    title: 'わり算',
    grade: '小3',
    curriculum: '小3：除法、余りのある除法',
    emoji: '➗',
  },
  {
    id: 'word-addition',
    category: 'sansu',
    title: 'ぴったり？（たしざん）',
    grade: '年長〜小1',
    curriculum: '小1：たしざんを使った文章題、過不足の比較',
    emoji: '🤔',
  },
  {
    id: 'word-subtraction',
    category: 'sansu',
    title: 'ぴったり？（ひきざん）',
    grade: '年長〜小1',
    curriculum: '小1：ひきざんを使った文章題、過不足の比較',
    emoji: '💭',
  },
  // ── 図形カテゴリ ──
  {
    id: 'shape-rotation',
    category: 'katachi',
    title: 'くるっとまわしたら？',
    grade: '年長〜小1',
    curriculum: 'メンタルローテーション：回転・反転後の形を予想する',
    emoji: '🔄',
  },
  {
    id: 'shape-compose',
    category: 'katachi',
    title: 'かたちをあわせると？',
    grade: '年長〜小2',
    curriculum: '図形の合成・分解：ピースを組み合わせて形を作る',
    emoji: '🧩',
  },
  {
    id: 'shape-viewpoint',
    category: 'katachi',
    title: 'うえから見ると？',
    grade: '年長〜小2',
    curriculum: '視点取得：積み木の立体を真上から見た図を選ぶ',
    emoji: '🏗️',
  },
];

export function getUnit(id: string): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getUnitsByCategory(category: Category): UnitMeta[] {
  return UNITS.filter((u) => u.category === category);
}
