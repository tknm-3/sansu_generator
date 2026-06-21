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
  | 'if-factory' // 10 合体ボス
  | 'middle-mora' // まんなかの音（語中音・発達的に最難の抽出）
  | 'rhyme-match' // おしりが おなじ（押韻マッチ）
  | 'nth-mora' // ○ばんめの音（位置を指定して抽出・first/last/middle の一般化）
  | 'delete-medial' // まんなかの音を ぬく（語中削除・語頭/語尾削除より難しい）
  | 'add-mora' // 音を たす（添加。削除と対の操作系）
  | 'substitute-mora' // 音を おきかえる（置換。削除より上位の操作）
  | 'find-position' // その音は ○ばんめ？（位置同定・nth の逆）
  | 'swap-mora' // さいしょと おしりを いれかえる（転置・spoonerism。WM最大級）
  | 'voice-mora' // てんてん(濁点)を つけると？（清音→濁音の操作・特殊音知識）
  | 'semivoice-mora' // まる(半濁点)を つけると？（は行→ぱ行・かな最難の半濁音）
  | 'odd-one-out' // さいしょ/おしりの おとが ちがう なかまはずれ（音のオドリティ）
  | 'count-target-mora' // その おとは いくつ？（特定音の計数・音韻分析＋計数の合体）
  | 'shiritori-chain' // しりとりに ならべる（語尾→語頭の連鎖・WM最大級）
  | 'anagram'; // ばらばらの もじを ならべて 絵の語を 作る（build-word の上位・足場なし）

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
  startLevel?: number; // 適応難易度の 開始レベル（上級ゾーンは 2〜3 から）
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
  highlightIndex?: number; // 注目させる モーラの位置（nth-mora の「○ばんめ」を 光の粒で 示す）
  choices: MojiChoice[];
  answer: number | number[];
}
