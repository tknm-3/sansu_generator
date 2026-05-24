export type ExplainStepKind =
  | 'objects'      // 具体物（emoji を個数分ならべる）
  | 'groups'       // かたまり（perGroup 個ずつ groups 列）
  | 'placeValue'   // 位ブロック（十の位・一の位）
  | 'cherryBranch' // さくらんぼ分解
  | 'equation';    // 式（抽象）

export interface ExplainStep {
  kind: ExplainStepKind;
  caption: string; // 画面に出す短い説明（ひらがな）
  narration: string; // 読み上げ用テキスト
  data: Record<string, unknown>; // kind ごとの描画データ
}

// kind ごとの data の形（描画側で参照する）
export interface ObjectsData {
  emoji: string;
  count: number;
}
export interface GroupsData {
  emoji: string;
  perGroup: number;
  groups: number;
}
export interface PlaceValueData {
  tens: number;
  ones: number;
  carry?: boolean;
}
export interface CherryBranchData {
  b: number;
  split: number;
  carry: number;
}
export interface EquationData {
  text: string;
}
