export interface UnitMeta {
  id: string;
  title: string;       // 子ども向け表示名（ひらがな）
  grade: string;       // 対象学年
  curriculum: string;  // 学習指導要領/幼稚園教育要領 対応
}

/** フェーズ1で実装する単元（10をつくる）のみ。以降のフェーズで追加していく。 */
export const UNITS: UnitMeta[] = [
  {
    id: 'make-ten',
    title: '10をつくる',
    grade: '年長〜小1',
    curriculum: '小1：10の合成・分解、加法の素地',
  },
];

export function getUnit(id: string): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}
