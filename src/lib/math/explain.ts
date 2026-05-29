export type ExplainStepKind =
  | 'objects'      // 具体物（emoji を個数分ならべる）
  | 'groups'       // かたまり（perGroup 個ずつ groups 列）
  | 'placeValue'   // 位ブロック（十の位・一の位）
  | 'cherryBranch' // さくらんぼ分解
  | 'equation';    // 式（抽象）

/**
 * 手順の途中で子どもに考えさせる小問題（ヒント問題）。
 * これが付いたステップでは、正しい選択肢を選ぶまで先に進めない。
 * これにより「当てずっぽうの連打」ではなく考え方の各手順を踏ませる。
 */
export interface StepQuiz {
  prompt: string; // 「あと なんこで 10？」などの問いかけ（ひらがな）
  choices: number[]; // 選択肢（正解を必ず含む）
  answer: number; // 正解の値
}

export interface ExplainStep {
  kind: ExplainStepKind;
  caption: string; // 画面に出す短い説明（ひらがな）
  narration: string; // 読み上げ用テキスト
  data: Record<string, unknown>; // kind ごとの描画データ
  quiz?: StepQuiz; // 任意：このステップで解かせる小問題
}

/**
 * ヒント問題の選択肢を3つ生成（正解を必ず含む）。
 * answer の周辺（±2）から作り、負数は除外。足りなければ上方向に決定論的に補う。
 */
export function quizChoices(answer: number, rng: () => number = Math.random): number[] {
  const set = new Set<number>([answer]);
  const pool: number[] = [];
  for (let d = -2; d <= 2; d++) {
    const c = answer + d;
    if (c >= 0 && c !== answer) pool.push(c);
  }
  // シャッフルして近い値から詰める
  pool.sort(() => rng() - 0.5);
  for (const c of pool) {
    if (set.size >= 3) break;
    set.add(c);
  }
  // それでも足りなければ上方向に補う（answer が 0,1 のときなど）
  let next = answer + 3;
  while (set.size < 3) {
    set.add(next);
    next++;
  }
  return [...set].sort(() => rng() - 0.5);
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
