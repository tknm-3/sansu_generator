// りかランド（理科）の問題型。すべて「絵を見て 1つ えらぶ」に そろえる＝既存の
// タップUIに そのまま 乗る。分類(classify)と なかまはずれ(odd-one-out)の2メカで
// 「観察して きまりを 見つける」理科の基礎を 育てる。

export type RikaKind = 'classify' | 'odd-one-out';

export interface RikaChoice {
  emoji: string;
}

export interface RikaQuestion {
  kind: RikaKind;
  prompt: string; // ひらがなの ひとことガイド
  speak: string; // 読み上げ（prompt と同じでよい）
  groupId: string; // どの なかま（グループ）の問題か
  choices: RikaChoice[]; // 絵の選択肢（ふつう4つ）
  answer: number; // 正解の choice index
}

// 1つの「なかま」（属性グループ）。
// members = 属性を みたす絵（正解候補）／distractors = 明らかに みたさない絵（ダミー）。
// members と distractors は 重ならない（テストで保証）＝答えが 一意。
export interface RikaGroup {
  id: string;
  prompt: string; // 「〜は どれ？」（classify 用）
  members: string[];
  distractors: string[];
}
