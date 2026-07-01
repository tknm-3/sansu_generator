// りかランド（理科）の問題型。
// 4メカ = 観察して きまりを見つける「分類(classify)/なかまはずれ(odd-one-out)」、
// そだつ順を ならべる「系列(sequence)」、そして 予想して たしかめる「予想(predict)」。
// predict は Predict-Observe-Explain（予想→観察→理由）＝幼児の科学的思考を育てる
// エビデンスのある型。すべて 既存の タップUIに 乗る（絵を見て えらぶ／2択で予想）。

export type RikaKind = 'classify' | 'odd-one-out' | 'sequence' | 'predict';

// 理科の 単元（テーマ）。ホームで えらぶ。
export type RikaUnitId = 'ikimono' | 'sodatsu' | 'ukishizumu' | 'jishaku' | 'kisetsu';

export interface RikaChoice {
  emoji: string;
}

export interface RikaQuestion {
  kind: RikaKind;
  prompt: string; // ひらがなの ひとことガイド
  speak: string; // 読み上げ（prompt と同じでよい）
  groupId: string; // どの なかま／じゅんばん／予想セット の問題か
  choices: RikaChoice[]; // 絵の選択肢（classify/odd は4つ、sequence は3〜4つ、predict は未使用＝[]）
  answer: number; // classify/odd: 正解index／predict: 正解の予想ボタンindex(0 or 1)／sequence: -1
  order?: number[]; // sequence: さいしょ→さいご の 正しい choice index 列
  // ── predict（予想→たしかめ）専用 ──
  itemEmoji?: string; // まんなかに 大きく見せる「しらべる もの」
  labels?: [string, string]; // 2つの 予想ボタンの文言（例 ['うく 🛟','しずむ ⬇️']）
  reason?: string; // たしかめた あとの ひとこと理由（例「きは かるいから うくよ」）
}

// 「そだつ じゅんばん」用の 系列。stages は さいしょ→さいご の 正しい順（テストで検証）。
export interface RikaSequence {
  id: string;
  unit: RikaUnitId;
  prompt: string; // 「〜 じゅんに ならべて」
  stages: string[]; // 正しい順の 絵（重複なし）
}

// 1つの「なかま」（属性グループ）。
// members = 属性を みたす絵（正解候補）／distractors = 明らかに みたさない絵（ダミー）。
// members と distractors は 重ならない（テストで保証）＝答えが 一意。
export interface RikaGroup {
  id: string;
  unit: RikaUnitId;
  prompt: string; // 「〜は どれ？」（classify 用）
  members: string[];
  distractors: string[];
}

// 予想（predict）の セット。1つの「しらべかた」（例：みずに いれる／じしゃくに ちかづける）。
// items ごとに 結果(positive)と 理由(reason)を もつ。positive=true は labels[0]（うく/くっつく）が正しい。
export interface RikaPredictItem {
  emoji: string;
  positive: boolean; // true = labels[0]（うく/くっつく 等）が正しい
  reason: string; // たしかめた あとの ひとこと（前向きに・りゆうを そえる）
}

export interface RikaPredictSet {
  id: string;
  unit: RikaUnitId;
  prompt: string; // 「みずに いれたら どっち？」など
  labels: [string, string]; // [positive側, negative側] の ボタン文言
  items: RikaPredictItem[];
}
