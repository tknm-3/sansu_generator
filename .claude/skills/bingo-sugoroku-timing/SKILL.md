---
name: bingo-sugoroku-timing
description: ビンゴすごろく（BingoSugorokuUnit）の演出・タイマー・読み上げ（speakJa）まわりを直すときの注意点。「サイコロが動かない」「コマが進まない」「読み上げと演出の順番」「タイマーが消える」「setTimeout が止まる」等のときに使う。timerRef の使い回しによるバグを未然に防ぐ。
---

# ビンゴすごろくの演出・タイマーの罠（bingo-sugoroku-timing）

対象: `src/screens/BingoSugorokuUnit.tsx`、`src/features/speech/tts.ts`（`speakJa`）。

## いちばんの罠: `timerRef.current` を保険タイマーと演出タイマーで共有しない

`BingoSugorokuUnit` は `timerRef`（単一の `useRef`）を **複数の演出の setTimeout に使い回す**:
サイコロの出目アニメ（`doRoll`）・コマ移動（`animateMove`）・ボーナス演出・読み上げ前の保険タイマー、など。
1つしか無いので「いま走っている演出のタイマー」を順々に上書きしていく前提になっている。

ここで **読み上げ（speakJa）の onEnd コールバックの中で `clearTimeout(timerRef.current)` をしてはいけない**。
理由（実際に踏んだバグ・#102 マージ後に「最初のサイコロを振った後コマが動かない」）:

1. `handleRoll` で保険タイマー `setTimeout(beginRoll, 2500)` を回し、同時に煽りセリフを `speakJa` で読み上げる。
2. 煽りセリフが2.5秒を超えると、読み上げ中に保険タイマーが先に発火 → `beginRoll()` が走り、
   サイコロ演出（`doRoll`）が次々と **同じ `timerRef.current`** に setTimeout を格納していく。
3. その後で読み上げが終わると onEnd コールバックが `clearTimeout(timerRef.current)` を実行し、
   **進行中の `doRoll` タイマーを誤って消す** → 出目が確定せず、コマも動かない。

### 正しいやり方

読み上げの保険タイマーは **`timerRef` と共有せず、専用のローカル変数**で持つ。
onEnd コールバックではそのローカル変数だけを clear する。`beginRoll` は `started` フラグで二重起動を防ぐ。

```ts
let started = false;
const beginRoll = () => { if (started) return; started = true; /* doRoll は timerRef を使う */ };
const fallbackTimer = setTimeout(beginRoll, 2500);   // ← timerRef.current ではなくローカル
speakJa(preRollSpeech, () => {
  clearTimeout(fallbackTimer);                        // ← timerRef は触らない
  beginRoll();
});
```

## なぜテストで気づけなかったか（再発防止）

- `speakJa` は TTS 非対応環境（jsdom／Vitest など）では **その場で同期的に onEnd を呼ぶ**。
  そのため保険タイマーと読み上げが競合せず、ユニットテストではバグが顕在化しない。
- 実機（音声あり）で、かつ **読み上げが保険タイマーの待ち時間（2.5秒）を超えたとき** だけ起きる。
- 「振る前の読み上げ」を長文化（現在地・リーチ・ボーナス番号を足す等）すると2.5秒を超えやすくなる。
  読み上げ文を長くする変更と、保険タイマーまわりの変更は**セットで疑う**。
- 演出が「途中で止まる」系のバグは、まず `timerRef.current` を**誰がいつ上書き／clear しているか**を追う。

## 読み上げと演出の順番（設計意図）

- 煽りセリフは「言い切ってから出目を確定」したい（出目が先に出ると煽りが間に合わない）。
  そのため `speakJa` の onEnd で出目アニメを始め、TTS が来ない場合に備えて保険タイマーで救う二段構え。
- `animateMove` も「声が先・コマが後」を保つため `SPEAK_LEAD_MS` だけ遅らせてからコマを動かす。
  読み上げ系をいじるときはこの順序を壊さない。
