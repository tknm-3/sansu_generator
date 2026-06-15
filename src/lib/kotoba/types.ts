// もじギア・ファクトリー（ことば単元）の型定義。
// 設計: design/moji-gear-factory.md / design/moji-gear-philosophy.md

/** 10 メカニクス（学びの単位）。世界はこれを組み合わせて作る（§13） */
export type LineId =
  | 'count-mora' // 1 モーラを数える
  | 'first-mora' // 2 語頭音
  | 'last-mora' // 3 語尾音（しりとり）
  | 'match-sound' // 4 音の同定
  | 'build-word' // 5 文字合成（順に並べる）
  | 'rule-card' // 6 IF-THEN 切替
  | 'delete-mora' // 7 音の削除
  | 'reverse-word' // 8 逆唱
  | 'special-mora' // 9 特殊音節
  | 'if-factory'; // 10 合体ボス

export type WordCat = 'food' | 'animal' | 'vehicle' | 'nature' | 'thing';

/** 語辞書の1件。モーラ列は手で持つ（自動分解はミスるため・§4） */
export interface WordItem {
  id: string;
  display: string; // 絵文字
  reading: string; // ひらがな読み（TTS）
  mora: string[]; // モーラ列（拗音「きゃ」は1要素）
  category: WordCat;
  difficulty: 1 | 2 | 3;
  special?: SpecialKind[]; // 特殊音節の印
}

export type SpecialKind = 'voiced' | 'semivoiced' | 'youon' | 'choon' | 'sokuon';

/** 世界（ライン）。lineIds が1つ＝教材、複数＝腕試し（§13） */
export interface WorldDef {
  id: string;
  name: string; // こども向けの名前（ひらがな）
  emoji: string;
  friend: string; // 住人
  story: string; // 入口の2〜3行
  tint: string; // 背景色（tailwind の from 色など）
  lineIds: LineId[]; // 既存メカニクスのプール
  difficulty?: {
    minMora?: number;
    maxMora?: number;
    ruleCount?: number;
    special?: boolean;
  };
}

/** 1問の選択肢 */
export interface MojiChoice {
  label: string; // 表示テキスト（数字 or 文字 or 絵文字 or 語）
  emoji?: string; // 絵で見せたいとき
}

/**
 * 生成された1問。画面はこの形だけ描けばよい。
 * - mode 'choose': choices から1つ選ぶ（answer は index）
 * - mode 'build' : choices を answer の順に並べる（answer は index 配列）
 */
export interface MojiQuestion {
  lineId: LineId;
  mode: 'choose' | 'build';
  prompt: string; // ひらがなの ひとことガイド（音声でも読む）
  speak: string; // TTS で読む語（reading）
  mora: string[]; // お題の語の モーラ列（1拍ずつ読み・光の粒の演出用）
  pictureEmoji?: string; // お題の絵
  choices: MojiChoice[];
  answer: number | number[];
}
