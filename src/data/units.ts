export type Category = 'sansu' | 'katachi' | 'programming' | 'family' | 'baby';

export interface UnitMeta {
  id: string;
  category: Category;
  title: string;
  grade: string;
  curriculum: string;
  emoji: string;
  /** ふつう／むずかしい で なにが かわるかの こども向け せつめい（ひらがな）。expert は タングラムの「もっとむずかしい」用 */
  modeHint?: { normal: string; hard: string; expert?: string };
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
  {
    id: 'word-multiplication',
    category: 'sansu',
    title: 'ぴったり？（かけ算）',
    grade: '小2〜小3',
    curriculum: '小2：かけ算を使った文章題、グループ×個数と容量の比較',
    emoji: '🔢',
  },
  {
    id: 'word-division',
    category: 'sansu',
    title: 'ぴったり？（わり算）',
    grade: '小3',
    curriculum: '小3：わり算を使った文章題、均等分配の過不足比較',
    emoji: '🔣',
  },
  // ── 図形カテゴリ ──
  {
    id: 'shape-rotation',
    category: 'katachi',
    title: 'くるっとまわしたら？',
    grade: '年長〜小1',
    curriculum: 'メンタルローテーション：回転・反転後の形を予想する',
    emoji: '🔄',
    modeHint: {
      normal: 'みぎに 90ど まわすよ',
      hard: 'いろんな むき＋かがみ（うらがえし）も でるよ',
    },
  },
  {
    id: 'shape-compose',
    category: 'katachi',
    title: 'かたちをあわせると？',
    grade: '年長〜小2',
    curriculum: '図形の合成・分解：ピースを組み合わせて形を作る',
    emoji: '🧩',
    modeHint: {
      normal: '2つの かたちを あわせるよ',
      hard: '3つや にた かたちが でるよ',
    },
  },
  {
    id: 'shape-viewpoint',
    category: 'katachi',
    title: 'うえから みると？',
    grade: '年長〜小2',
    curriculum: '視点取得：積み木の立体を真上から見た図を選ぶ',
    emoji: '🏗️',
    modeHint: {
      normal: 'ひらべったい つみきだよ',
      hard: 'つみきが たかく つみあがるよ',
    },
  },
  {
    id: 'shape-fold',
    category: 'katachi',
    title: 'おりがみをひらくと？',
    grade: '年長〜小2',
    curriculum: '対称・折り紙：折って切った紙を開いた形を予想する',
    emoji: '📄',
    modeHint: {
      normal: '1かい おりたたむよ',
      hard: '2かい おり・ななめおりが でるよ',
    },
  },
  {
    id: 'shape-pattern',
    category: 'katachi',
    title: 'つぎはどれ？',
    grade: '年長〜小2',
    curriculum: 'パターン補完：形・色の繰り返しパターンの続きを選ぶ',
    emoji: '🔁',
    modeHint: {
      normal: 'かたちの くりかえしだよ',
      hard: 'かたち＋いろの くりかえしだよ',
    },
  },
  {
    id: 'shape-spatial',
    category: 'katachi',
    title: 'どこにいる？',
    grade: '年長〜小2',
    curriculum: '空間言語：左右・上下の位置関係を言葉で理解する',
    emoji: '🗺️',
    modeHint: {
      normal: 'ひだり・みぎ だけだよ',
      hard: 'うえ・した も でるよ',
    },
  },
  {
    id: 'shape-fit',
    category: 'katachi',
    title: 'ぴったりはめよう',
    grade: '年長〜小1',
    curriculum: '図形の合成：ピースをドラッグしてシルエットにはめる',
    emoji: '🟦',
    modeHint: {
      normal: 'ピースは 3こだよ',
      hard: 'ピースが ふえるよ',
    },
  },
  {
    id: 'shape-tangram',
    category: 'katachi',
    title: 'タングラム',
    grade: '小1〜小2',
    curriculum: '図形の合成：三角や四角をならべて形を作る',
    emoji: '🔺',
    modeHint: {
      normal: 'やさしい かたちだよ',
      hard: 'ピースが おおい かたちだよ',
      expert: 'おなじ 7まいで・ぜんぶ おなじ いろ・うらがえしも あるよ',
    },
  },
  {
    id: 'arrow-adventure',
    category: 'programming',
    title: 'ぼうけんしよう',
    grade: '小1〜小2',
    curriculum: 'プログラミング総合：問題集モード（ゾーンを じゅんに 解放）。いつでも あそべる',
    emoji: '🗺️',
  },
  // ── ちいさいこ カテゴリ（2〜3さい向け・タップだけ）──
  {
    id: 'count-animals',
    category: 'baby',
    title: 'なんびき かな？',
    grade: '2〜3さい',
    curriculum: '数の素地：1〜3匹をパッと見て数える（サビタイジング・数唱）',
    emoji: '🐰',
  },
  {
    id: 'dice-walk',
    category: 'baby',
    title: 'ころころ すすめ！',
    grade: '2〜3さい',
    curriculum: '数の素地：サイコロの数だけ一直線のマスを進む（数唱・1対1対応・数字認識）。すごろくへの橋渡し',
    emoji: '🎲',
  },
  {
    id: 'pair-place',
    category: 'baby',
    title: 'ぴったり おいて',
    grade: '2〜3さい',
    curriculum: '数の素地：おさらに 1つずつ おく（1対1対応・基数性）',
    emoji: '🍪',
  },
  {
    id: 'match-same',
    category: 'baby',
    title: 'おなじ どれ？',
    grade: '2〜3さい',
    curriculum: '論理の素地：見本と同じものを選ぶ（分類・属性のマッチング）',
    emoji: '🔷',
  },
  {
    id: 'compare-more',
    category: 'baby',
    title: 'どっちが おおい？',
    grade: '2〜3さい',
    curriculum: '数の素地：ふたつの集まりを数えずに直感で比べる（近似数システム ANS）。ひりつで難易度づけ',
    emoji: '⚖️',
  },
  {
    id: 'give-n',
    category: 'baby',
    title: '○こ ちょうだい',
    grade: '2〜3さい',
    curriculum: '数の素地：数詞を聞いてその数の集まりを作る（基数原理・Give-N課題）。見て数えるの逆',
    emoji: '🍪',
  },
  // ── ファミリー カテゴリ ──
  {
    id: 'bingo-sugoroku',
    category: 'family',
    title: 'ビンゴすごろく',
    grade: '年長〜小3',
    curriculum: 'かぞく ゲーム：100マスすごろく＋ビンゴ の ドキドキ たいけつ！',
    emoji: '🎲',
  },
];

export function getUnit(id: string): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getUnitsByCategory(category: Category): UnitMeta[] {
  return UNITS.filter((u) => u.category === category);
}
