# 6つの改善 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ヒント画面の問題表示・がんばりカレンダー・ユニット別BGM・お題付き作問・式の後出し・二桁の式形式表示の6機能を、既存の仕組みに乗せて追加する。

**Architecture:** 純ロジック（日付集計・お題判定）は `src/lib` に純関数として切り出し Vitest でテスト。表示系（StepExplainer・各ユニット・ProgressCalendar・ProblemMaker・BGM）は既存パターンに沿って改修し、dev サーバーで実機確認する。

**Tech Stack:** React 19 + TypeScript + Vite / Tailwind v4 / framer-motion / Web Audio (BGM) / Vitest + @testing-library/react

参照スペック: `docs/superpowers/specs/2026-05-24-four-improvements-design.md`

単体テストの単一ファイル実行: `npx vitest run <path>` / 全テスト: `npm run test` / 型・ビルド: `npm run build`

---

## ファイル構成

新規:
- `src/lib/dateKey.ts` — ms → ローカル日付キー(YYYY-MM-DD)変換（純関数）
- `src/lib/progress.ts` — スタンプ履歴の日別集計・連続日数（純関数）
- `src/screens/ProgressCalendar.tsx` — がんばりカレンダー表示
- `src/lib/problemGoals.ts` — お題定義 + validate（純関数）
- `tests/lib/dateKey.test.ts` / `tests/lib/progress.test.ts` / `tests/lib/problemGoals.test.ts` / `tests/components/StepExplainer.test.tsx`

変更:
- `src/components/StepExplainer.tsx` — `problem` prop 表示（①）
- 8ユニット画面 — `problem` prop 受け渡し（①）＋ うち7ユニットは式の後出し（⑤）
- `src/features/sound/bgm.ts` — TRACKS化 + `setBgmTrack`（③）
- `src/screens/ProblemMakerScreen.tsx` — お題モード（④）
- `src/App.tsx` — `progress` 画面ルーティング（②）
- `src/screens/HomeScreen.tsx` — がんばりカレンダー入口（②）

---

## Phase A — ② がんばりカレンダー

### Task A1: 日付キー変換ヘルパー（純関数）

**Files:**
- Create: `src/lib/dateKey.ts`
- Test: `tests/lib/dateKey.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/dateKey.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { dateKey } from '../../src/lib/dateKey';

describe('dateKey', () => {
  it('ローカル日付を YYYY-MM-DD で返す', () => {
    const d = new Date(2026, 4, 24, 9, 30); // 2026-05-24 09:30 ローカル
    expect(dateKey(d.getTime())).toBe('2026-05-24');
  });
  it('1桁の月日をゼロ埋めする', () => {
    const d = new Date(2026, 0, 3, 0, 0); // 2026-01-03
    expect(dateKey(d.getTime())).toBe('2026-01-03');
  });
});
```

- [ ] **Step 2: テストが落ちることを確認**

Run: `npx vitest run tests/lib/dateKey.test.ts`
Expected: FAIL（`dateKey` 未定義）

- [ ] **Step 3: 最小実装**

`src/lib/dateKey.ts`:
```ts
/** エポックms → ローカルタイムの YYYY-MM-DD 文字列。UTCではなく端末ローカル日付。 */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npx vitest run tests/lib/dateKey.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/dateKey.ts tests/lib/dateKey.test.ts
git commit -m "feat: add local dateKey helper for progress aggregation"
```

### Task A2: 履歴集計と連続日数（純関数）

**Files:**
- Create: `src/lib/progress.ts`
- Test: `tests/lib/progress.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/progress.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { countByDay, currentStreak } from '../../src/lib/progress';
import type { StampEntry } from '../../src/features/rewards/stamps';

function at(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d, 12, 0).getTime();
}

describe('countByDay', () => {
  it('日付ごとのスタンプ数を集計する', () => {
    const history: StampEntry[] = [
      { unitId: 'addition', at: at(2026, 5, 24) },
      { unitId: 'subtraction', at: at(2026, 5, 24) },
      { unitId: 'addition', at: at(2026, 5, 23) },
    ];
    const map = countByDay(history);
    expect(map.get('2026-05-24')).toBe(2);
    expect(map.get('2026-05-23')).toBe(1);
  });
});

describe('currentStreak', () => {
  it('今日から連続でスタンプがある日数を返す', () => {
    const today = at(2026, 5, 24);
    const history: StampEntry[] = [
      { unitId: 'a', at: at(2026, 5, 24) },
      { unitId: 'a', at: at(2026, 5, 23) },
      { unitId: 'a', at: at(2026, 5, 22) },
    ];
    expect(currentStreak(history, today)).toBe(3);
  });
  it('今日やっていなければ0', () => {
    const today = at(2026, 5, 24);
    const history: StampEntry[] = [{ unitId: 'a', at: at(2026, 5, 23) }];
    expect(currentStreak(history, today)).toBe(0);
  });
  it('間が空いたら途切れる', () => {
    const today = at(2026, 5, 24);
    const history: StampEntry[] = [
      { unitId: 'a', at: at(2026, 5, 24) },
      { unitId: 'a', at: at(2026, 5, 22) },
    ];
    expect(currentStreak(history, today)).toBe(1);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認**

Run: `npx vitest run tests/lib/progress.test.ts`
Expected: FAIL（未定義）

- [ ] **Step 3: 最小実装**

`src/lib/progress.ts`:
```ts
import type { StampEntry } from '../features/rewards/stamps';
import { dateKey } from './dateKey';

/** 履歴を日付キー(YYYY-MM-DD) → スタンプ数 の Map に集計する。 */
export function countByDay(history: StampEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of history) {
    const k = dateKey(e.at);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** todayMs を起点に、過去へ連続してスタンプがある日数を数える。 */
export function currentStreak(history: StampEntry[], todayMs: number): number {
  const map = countByDay(history);
  let streak = 0;
  const cursor = new Date(todayMs);
  cursor.setHours(12, 0, 0, 0);
  while (map.has(dateKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npx vitest run tests/lib/progress.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/progress.ts tests/lib/progress.test.ts
git commit -m "feat: add countByDay and currentStreak progress helpers"
```

### Task A3: ProgressCalendar 画面

**Files:**
- Create: `src/screens/ProgressCalendar.tsx`

- [ ] **Step 1: 画面コンポーネントを作成**

`src/screens/ProgressCalendar.tsx`:
```tsx
import { loadJson } from '../lib/storage';
import { EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { countByDay, currentStreak } from '../lib/progress';
import { dateKey } from '../lib/dateKey';

interface Props {
  onClose: () => void;
}

/** 直近14日分の日付(古い→新しい)を返す。 */
function recentDays(todayMs: number, n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(todayMs);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function ProgressCalendar({ onClose }: Props) {
  const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
  const byDay = countByDay(stamps.history);
  const now = Date.now();
  const streak = currentStreak(stamps.history, now);
  const todayCount = byDay.get(dateKey(now)) ?? 0;
  const days = recentDays(now, 14);

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-amber-100 to-sky-50 p-6">
      <h1 className="text-2xl font-bold text-amber-800">がんばり カレンダー</h1>
      <div className="flex gap-4 text-lg font-bold text-amber-700">
        <span>れんぞく {streak}にち</span>
        <span>きょうは {todayCount}こ</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const c = byDay.get(dateKey(d.getTime())) ?? 0;
          return (
            <div key={dateKey(d.getTime())}
              className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white shadow">
              <span className="text-[10px] text-amber-500">{d.getMonth() + 1}/{d.getDate()}</span>
              <span className="text-sm leading-none">{c > 0 ? '🌸'.repeat(Math.min(c, 3)) : ''}</span>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onClose}
        className="mt-4 rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0] active:translate-y-1 transition-all">
        ホームに もどる
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 型・ビルドが通ることを確認**

Run: `npm run build`
Expected: 成功（型エラーなし）

- [ ] **Step 3: コミット**

```bash
git add src/screens/ProgressCalendar.tsx
git commit -m "feat: add ProgressCalendar screen (read-only stamp history view)"
```

### Task A4: ルーティングとホーム入口

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: App.tsx に画面種別とルーティングを追加**

`src/App.tsx` の `type Screen` に追加:
```ts
  | { kind: 'progress' }
```

import 追加（上部の import 群へ）:
```ts
import { ProgressCalendar } from './screens/ProgressCalendar';
```

`screen.kind === 'stampBook'` のブロックの直後に追加:
```tsx
  if (screen.kind === 'progress') {
    return <ProgressCalendar onClose={() => setScreen({ kind: 'home' })} />;
  }
```

`HomeScreen` の呼び出しに prop を追加:
```tsx
      onOpenProgress={() => setScreen({ kind: 'progress' })}
```

- [ ] **Step 2: HomeScreen に入口ボタンを追加**

`src/screens/HomeScreen.tsx` の Props に `onOpenProgress: () => void;` を追加し、スタンプ帳ボタンの近くに同じスタイルで以下を追加:
```tsx
        <button type="button" onClick={onOpenProgress}
          className="rounded-2xl bg-amber-400 px-6 py-3 text-lg font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1">
          📅 がんばりカレンダー
        </button>
```
（既存のボタン群と同じコンテナ内に置くこと。クラスは周囲のボタンに合わせて調整可。）

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 4: 実機確認（dev サーバー）**

`npm run dev` で起動し、ホーム →「📅 がんばりカレンダー」→ 直近14日グリッド・「れんぞく」「きょうは」が表示され、「ホームにもどる」で戻ることを確認。

- [ ] **Step 5: コミット**

```bash
git add src/App.tsx src/screens/HomeScreen.tsx
git commit -m "feat: wire ProgressCalendar into home navigation"
```

---

## Phase B — ④ お題付き作問モード

### Task B1: お題定義と判定（純関数）

**Files:**
- Create: `src/lib/problemGoals.ts`
- Test: `tests/lib/problemGoals.test.ts`

お題は既存テンプレの `aRange`/`bRange` 内で必ず達成可能なものに限定する（詰み防止）。参照: `src/lib/problemTemplates.ts`。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/problemGoals.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { GOALS, goalsForType } from '../../src/lib/problemGoals';

describe('problemGoals', () => {
  it('全演算ぶんのお題がある', () => {
    expect(goalsForType('addition').length).toBeGreaterThan(0);
    expect(goalsForType('subtraction').length).toBeGreaterThan(0);
    expect(goalsForType('multiplication').length).toBeGreaterThan(0);
    expect(goalsForType('division').length).toBeGreaterThan(0);
  });
  it('たし「こたえ10」: 6+4は満たし 6+3は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'add-make10')!;
    expect(g.validate(6, 4, 10)).toBe(true);
    expect(g.validate(6, 3, 9)).toBe(false);
  });
  it('ひき「のこり1」: 5-4は満たし 5-2は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'sub-left1')!;
    expect(g.validate(5, 4, 1)).toBe(true);
    expect(g.validate(5, 2, 3)).toBe(false);
  });
  it('わり「ちょうど」: 12/3は満たし 12/5は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'div-exact')!;
    expect(g.validate(12, 3, 4)).toBe(true);
    expect(g.validate(12, 5, 2)).toBe(false);
  });
  it('かけ「こたえ12」: 3x4は満たし 3x3は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'mul-make12')!;
    expect(g.validate(3, 4, 12)).toBe(true);
    expect(g.validate(3, 3, 9)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認**

Run: `npx vitest run tests/lib/problemGoals.test.ts`
Expected: FAIL（未定義）

- [ ] **Step 3: 最小実装**

`src/lib/problemGoals.ts`:
```ts
import type { ProblemType } from './problemTemplates';

export interface Goal {
  id: string;
  type: ProblemType;
  label: string;   // カードの短い名前
  prompt: string;  // お題の指示文（ひらがな）
  validate: (a: number, b: number, answer: number) => boolean;
  hint: string;    // 満たせなかったときの励まし＋ヒント
}

export const GOALS: Goal[] = [
  {
    id: 'add-make10',
    type: 'addition',
    label: 'こたえを 10に',
    prompt: 'こたえが 10に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 10,
    hint: 'おしい！ ふたつ あわせて 10こに なるように かずを かえてみよう。',
  },
  {
    id: 'sub-left1',
    type: 'subtraction',
    label: 'のこりを 1こに',
    prompt: 'のこりが 1こに なるように つくろう！',
    validate: (a, b) => a - b === 1,
    hint: 'おしい！ のこりが 1こに なるには、1こだけ おおく すればいいよ。',
  },
  {
    id: 'mul-make12',
    type: 'multiplication',
    label: 'こたえを 12に',
    prompt: 'こたえが 12に なるように つくろう！',
    validate: (_a, _b, ans) => ans === 12,
    hint: 'おしい！ 3と 4、2と 6 みたいに かけて 12に なる かずを さがそう。',
  },
  {
    id: 'div-exact',
    type: 'division',
    label: 'ちょうど わける',
    prompt: 'あまりが でないように（ちょうど わけきれるように）つくろう！',
    validate: (a, b) => b !== 0 && a % b === 0,
    hint: 'おしい！ あまりが でちゃった。ちょうど わけられる かずに してみよう。',
  },
];

export function goalsForType(type: ProblemType): Goal[] {
  return GOALS.filter((g) => g.type === type);
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npx vitest run tests/lib/problemGoals.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/problemGoals.ts tests/lib/problemGoals.test.ts
git commit -m "feat: add problem goals with validators for maker challenge mode"
```

### Task B2: ProblemMaker にお題モードを追加

**Files:**
- Modify: `src/screens/ProblemMakerScreen.tsx`

現状フロー: `op`（演算選択）→ `select`（場面）→ `fill`（数字）→ `preview`。お題モードを足す。

- [ ] **Step 1: モードとお題の状態を追加**

import に追加:
```ts
import { goalsForType, type Goal } from '../lib/problemGoals';
```

state に追加（既存 useState 群の下）:
```ts
  const [mode, setMode] = useState<'free' | 'goal'>('free');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [missed, setMissed] = useState(false);
```

- [ ] **Step 2: 演算選択後にモード分岐ステップを挿入**

`step` のユニオン型に `'mode'` と `'goalPick'` を追加:
```ts
  const [step, setStep] = useState<'op' | 'mode' | 'goalPick' | 'select' | 'fill' | 'preview'>('op');
```

`op` ステップのボタン `onClick` を、`setStep('select')` から `setStep('mode')` に変更する。

`op` ステップの描画ブロックの直後に、モード選択画面を追加:
```tsx
  if (step === 'mode') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どう つくる？</h1>
        <button type="button"
          onClick={() => { setMode('free'); setStep('select'); }}
          className="w-64 rounded-2xl bg-sky-400 px-6 py-5 text-xl font-bold text-white shadow-[0_4px_0_#0369a1] active:translate-y-1">
          じゆうに つくる
        </button>
        <button type="button"
          onClick={() => { setMode('goal'); setStep('goalPick'); }}
          className="w-64 rounded-2xl bg-orange-400 px-6 py-5 text-xl font-bold text-white shadow-[0_4px_0_#c2410c] active:translate-y-1">
          おだいに ちょうせん
        </button>
        <button type="button" onClick={() => setStep('op')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'goalPick' && op) {
    const goals = goalsForType(op);
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どの おだい に する？</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {goals.map((g) => (
            <button key={g.id} type="button"
              onClick={() => { setGoal(g); setStep('select'); }}
              className="w-56 rounded-2xl border-2 border-orange-200 bg-white p-4 text-center shadow-md">
              <div className="text-lg font-bold text-orange-700">{g.label}</div>
              <div className="mt-2 text-xs text-amber-700 whitespace-pre-line">{g.prompt}</div>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setStep('mode')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }
```

- [ ] **Step 3: fill ステップにお題表示と判定を組み込む**

`fill` ステップ（`if (step === 'fill' && selectedTpl)`）の中で、`preview` の計算の近くに以下を追加し、お題プロンプト表示と判定付き完成ボタンを入れる。

`preview` を計算している行の下に追加:
```tsx
    const satisfied = !goal || goal.validate(a, b, preview.answer);
```

お題モードのとき、見出し付近にプロンプトを表示（`<h1>` の直後）:
```tsx
        {mode === 'goal' && goal && (
          <div className="rounded-2xl bg-orange-100 px-4 py-2 text-center text-base font-bold text-orange-800 whitespace-pre-line">
            おだい: {goal.prompt}
          </div>
        )}
```

「これで かんせい！」ボタンの `onClick` を差し替える（自由モードは従来どおり preview へ、お題モードは判定）:
```tsx
        <button type="button"
          onClick={() => {
            if (mode === 'goal' && !satisfied) {
              setMissed(true);
              speakJa(goal!.hint);
              playSfx('wrong');
              return;
            }
            setMissed(false);
            setStep('preview');
          }}
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32]">
          これで かんせい！
        </button>
```

「これで かんせい！」ボタンの直前に、ミス時のフィードバックを追加:
```tsx
        {missed && goal && (
          <p className="text-base font-bold text-orange-600 whitespace-pre-line text-center max-w-xs">{goal.hint}</p>
        )}
```

数字を変えたらミス表示を消すため、`setA`/`setB` の各ボタン `onClick` に `setMissed(false);` を併記する（4箇所: −/＋ × かず①/かず②）。例:
```tsx
onClick={() => { setMissed(false); setA((v) => Math.max(selectedTpl.aRange[0], v - 1)); }}
```

- [ ] **Step 4: もどる導線を調整**

`fill` ステップの「もどる」は、お題モードなら `goalPick`、自由モードなら `select` に戻す:
```tsx
        <button type="button"
          onClick={() => setStep(mode === 'goal' ? 'goalPick' : 'select')}
          className="text-sm text-amber-600 underline">もどる</button>
```

- [ ] **Step 5: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 6: 実機確認**

`npm run dev` で、もんだいづくり → 演算 →「おだいに ちょうせん」→ お題選択 → 場面選択 → 数字調整。お題を満たさず「かんせい」を押すと「おしい！」とヒントが出てやり直し、満たすと preview に進み「ちょうせん！」で保護者画面へ遷移することを確認。自由モードが従来どおり動くことも確認。

- [ ] **Step 7: コミット**

```bash
git add src/screens/ProblemMakerScreen.tsx
git commit -m "feat: add goal-based challenge mode to problem maker"
```

---

## Phase C — ⑥ 二桁を式形式に ＋ ① ヒントに問題表示 ＋ ⑤ 式の後出し

⑥でまず二桁ユニットを横式に変え、その後①⑤を適用する。①と⑤は同じ7ユニットを触り、式文字列を共有するため一緒に行う。まず StepExplainer を拡張し、各ユニットで「式文字列を1箇所に定義 → 後出しトグル＋ヒントへ受け渡し」を行う。二桁ユニット（BigAddition/BigSubtraction）は⑥＋⑤＋①をまとめて Task C4 で扱う。

式文字列（ユニットごと）:
| ユニット | formula | ⑤対象 |
|---|---|---|
| AdditionUnit | `` `${problem.a} ＋ ${problem.b} ＝ ？` `` | ○ |
| SubtractionUnit | `` `${problem.a} － ${problem.b} ＝ ？` `` | ○ |
| CherryCalcUnit | `` `${problem.a} ＋ ${problem.b} ＝ ？` `` | ○ |
| MultiplicationUnit | `` `${problem.a} ✕ ${problem.b} ＝ ？` `` | ○ |
| DivisionUnit | `` `${problem.dividend} ÷ ${problem.divisor} ＝ ？` `` | ○ |
| BigAdditionUnit | `` `${problem.a} ＋ ${problem.b} ＝ ？` `` | ○ |
| BigSubtractionUnit | `` `${problem.a} － ${problem.b} ＝ ？` `` | ○ |
| MakeTenUnit | `` `${current} ＋ ？ ＝ 10` `` | ×（式ボックスなし、①のみ） |

### Task C1: StepExplainer に problem 表示を追加

**Files:**
- Modify: `src/components/StepExplainer.tsx`
- Test: `tests/components/StepExplainer.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

`tests/components/StepExplainer.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepExplainer } from '../../src/components/StepExplainer';
import type { ExplainStep } from '../../src/lib/math/explain';

vi.mock('../../src/features/speech/tts', () => ({ speakJa: vi.fn() }));

const steps: ExplainStep[] = [
  { kind: 'equation', caption: 'けいさん', narration: '', data: { text: '5 ＋ 8' } },
];

describe('StepExplainer', () => {
  it('渡した problem を表示する', () => {
    render(<StepExplainer steps={steps} problem="5 ＋ 8 ＝ ？" onClose={() => {}} />);
    expect(screen.getByText('5 ＋ 8 ＝ ？')).toBeTruthy();
  });
});
```

- [ ] **Step 2: テストが落ちることを確認**

Run: `npx vitest run tests/components/StepExplainer.test.tsx`
Expected: FAIL（`problem` prop 未対応）

- [ ] **Step 3: problem prop を追加して表示**

`src/components/StepExplainer.tsx` の `interface Props` を変更:
```tsx
interface Props {
  steps: ExplainStep[];
  problem: string;
  onClose: () => void;
}
```

関数シグネチャを `export function StepExplainer({ steps, problem, onClose }: Props) {` に変更。

見出し行（`<span ...>どうして そうなる？</span>` を含む `<div className="flex items-center gap-3">`）の直後に、問題表示を追加:
```tsx
      <div className="rounded-2xl bg-amber-100 px-5 py-2 text-2xl font-bold text-amber-900">
        {problem}
      </div>
```

- [ ] **Step 4: テスト合格を確認**

Run: `npx vitest run tests/components/StepExplainer.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/StepExplainer.tsx tests/components/StepExplainer.test.tsx
git commit -m "feat: show original problem in StepExplainer hint overlay"
```

### Task C2: MakeTenUnit に problem を渡す（①のみ）

**Files:**
- Modify: `src/screens/MakeTenUnit.tsx`

- [ ] **Step 1: StepExplainer 呼び出しに problem を追加**

`src/screens/MakeTenUnit.tsx` の StepExplainer 行を変更:
```tsx
      {showHint && (<StepExplainer steps={explainMakeTen(current, fruit)} problem={`${current} ＋ ？ ＝ 10`} onClose={() => setShowHint(false)} />)}
```

- [ ] **Step 2: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 3: コミット**

```bash
git add src/screens/MakeTenUnit.tsx
git commit -m "feat: pass problem to hint in MakeTenUnit"
```

### Task C3: 横式ユニット5つに式の後出し（⑤）＋ ヒントへ problem 受け渡し（①）

元から横式ボックスを持つ5ユニットを対象とする（MakeTen は C2、二桁の BigAddition/BigSubtraction は C4 で別途扱う）。各ユニットで同一パターンを適用する。下に AdditionUnit の完全な変更を示し、続けて他4ユニットの差分（formula 文字列・式ボックスの該当行）を列挙する。

**Files:**
- Modify: `src/screens/AdditionUnit.tsx`, `SubtractionUnit.tsx`, `CherryCalcUnit.tsx`, `MultiplicationUnit.tsx`, `DivisionUnit.tsx`

#### 共通パターン（AdditionUnit を例に）

- [ ] **Step 1: showFormula 状態を追加**

`const [showHint, setShowHint] = useState(false);` の下に追加:
```tsx
  const [showFormula, setShowFormula] = useState(false);
```

- [ ] **Step 2: 式文字列を1箇所で定義**

`return (` の直前（`cleared` 判定の後）に追加:
```tsx
  const formula = `${problem.a} ＋ ${problem.b} ＝ ？`;
```

- [ ] **Step 3: 式ボックスを後出しトグルに変更**

既存の式ボックス:
```tsx
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
        {problem.a} ＋ {problem.b} ＝ ？
      </div>
```
を次に置き換える:
```tsx
      {showFormula ? (
        <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
          {formula}
        </div>
      ) : (
        <button type="button"
          onClick={() => { setShowFormula(true); playSfx('tap'); }}
          className="rounded-2xl bg-white/80 px-6 py-3 text-lg font-bold text-amber-700 shadow active:translate-y-0.5">
          🔢 しきを みる
        </button>
      )}
```

- [ ] **Step 4: 次の問題に進むときに showFormula をリセット**

`setProblem(generateAddition())` を呼んでいる箇所（正解後の `setTimeout` 内）に `setShowFormula(false);` を併記:
```tsx
        setTimeout(() => { setExpression('normal'); setShowFormula(false); setProblem(generateAddition()); setScenario(pickScenario('addition')); processing.current = false; }, 900);
```

- [ ] **Step 5: ヒントに problem を渡す（①）**

StepExplainer 行を変更:
```tsx
      {showHint && (<StepExplainer steps={explainAddition(problem, animal)} problem={formula} onClose={() => setShowHint(false)} />)}
```

- [ ] **Step 6: ビルド確認**

Run: `npm run build`
Expected: 成功

#### 他4ユニットの差分

各ユニットで Step 1（showFormula 追加）・Step 4（次問題で `setShowFormula(false)`）・Step 5（StepExplainer に `problem={formula}` 追加）は同様。**異なるのは formula 文字列と式ボックスの中身・色クラス**。下記の通り適用する。

- [ ] **SubtractionUnit.tsx**
  - formula: `const formula = `${problem.a} － ${problem.b} ＝ ？`;`
  - 式ボックス内: `{formula}`（元は `{problem.a} － {problem.b} ＝ ？`、色 `text-amber-900` 維持）
  - StepExplainer: `problem={formula}`（既存 `explainSubtraction(problem, food)` のまま）
  - 次問題リセット: 正解後 `setProblem(...)` の setTimeout に `setShowFormula(false);` 追記

- [ ] **CherryCalcUnit.tsx**
  - formula: `const formula = `${problem.a} ＋ ${problem.b} ＝ ？`;`
  - 式ボックス（色 `text-pink-900`）内を `{formula}` に
  - StepExplainer: `problem={formula}`（`explainCherry(problem)` のまま）
  - 次問題で `setShowFormula(false)`（このユニットの問題切替箇所に併記）

- [ ] **MultiplicationUnit.tsx**
  - formula: `const formula = `${problem.a} ✕ ${problem.b} ＝ ？`;`
  - 式ボックス（色 `text-amber-900`）内を `{formula}` に
  - StepExplainer: `problem={formula}`（`explainMultiplication(problem, emoji)` のまま）
  - 次問題で `setShowFormula(false)`

- [ ] **DivisionUnit.tsx**
  - formula: `const formula = `${problem.dividend} ÷ ${problem.divisor} ＝ ？`;`
  - 式ボックス（色 `text-purple-900`）内を `{formula}` に
  - StepExplainer: `problem={formula}`（`explainDivision(problem, emoji)` のまま）
  - 次問題で `setShowFormula(false)`

- [ ] **Step 7: 5ユニットの実機確認**

`npm run dev` で Addition/Subtraction/CherryCalc/Multiplication/Division を開き、(a) 最初は「🔢 しきを みる」ボタンのみで式が隠れている、(b) 押すと式が出る、(c) 正解して次の問題で再び隠れる、(d) 💡ヒントを開くと上部に式が出ていることを確認。

- [ ] **Step 8: コミット**

```bash
git add src/screens/AdditionUnit.tsx src/screens/SubtractionUnit.tsx src/screens/CherryCalcUnit.tsx src/screens/MultiplicationUnit.tsx src/screens/DivisionUnit.tsx
git commit -m "feat: hide formula behind reveal button and show problem in hints"
```

### Task C4: 二桁ユニットを横式に変更（⑥）＋ 式の後出し（⑤）＋ ヒントへ problem（①）

`BigAdditionUnit` は筆算 `ColumnAddition`、`BigSubtractionUnit` は `ColumnSubtraction` で表示中（参照: 各ファイルの関数定義と本体の `<ColumnAddition problem={problem} />` / `<ColumnSubtraction problem={problem} />`）。これを横式ボックスに置き換え、その横式に⑤（後出しトグル）と①（ヒントに式）を適用する。

**Files:**
- Modify: `src/screens/BigAdditionUnit.tsx`, `src/screens/BigSubtractionUnit.tsx`

#### BigAdditionUnit.tsx

- [ ] **Step 1: 筆算コンポーネントを削除**

`function ColumnAddition({ problem }: { problem: BigAdditionProblem }) { ... }` の関数定義（`return ( ... )` まで）を丸ごと削除する。

- [ ] **Step 2: showFormula 状態を追加**

`const [showHint, setShowHint] = useState(false);` の下に追加:
```tsx
  const [showFormula, setShowFormula] = useState(false);
```

- [ ] **Step 3: 式文字列を定義**

`cleared` 判定の後、`return (` の直前に追加:
```tsx
  const formula = `${problem.a} ＋ ${problem.b} ＝ ？`;
```

- [ ] **Step 4: `<ColumnAddition .../>` を横式トグルに置き換える**

本体の `<ColumnAddition problem={problem} />` を次に置き換える:
```tsx
      {showFormula ? (
        <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
          {formula}
        </div>
      ) : (
        <button type="button"
          onClick={() => { setShowFormula(true); playSfx('tap'); }}
          className="rounded-2xl bg-white/80 px-6 py-3 text-lg font-bold text-amber-700 shadow active:translate-y-0.5">
          🔢 しきを みる
        </button>
      )}
```

- [ ] **Step 5: 次の問題でリセット**

正解後の `setTimeout` 内（`setProblem(generateBigAddition())` がある行）に `setShowFormula(false);` を併記:
```tsx
        setTimeout(() => { setExpression('normal'); setShowFormula(false); setProblem(generateBigAddition()); setScenario(pickScenario('big-addition')); processing.current = false; }, 900);
```

- [ ] **Step 6: ヒントに problem を渡す（①）**

StepExplainer 行を変更:
```tsx
        <StepExplainer steps={explainBigAddition(problem)} problem={formula} onClose={() => setShowHint(false)} />
```

#### BigSubtractionUnit.tsx

- [ ] **Step 7: 同様に変更**

- `function ColumnSubtraction(...) { ... }` の関数定義を丸ごと削除。
- `const [showFormula, setShowFormula] = useState(false);` を追加。
- `return (` の直前に `const formula = `${problem.a} － ${problem.b} ＝ ？`;` を追加。
- 本体の `<ColumnSubtraction problem={problem} />` を Step 4 と同じトグル（式ボックス内は `{formula}`、色 `text-amber-900`）に置き換える。
- 正解後 `setTimeout`（`setProblem(generateBigSubtraction())` の行）に `setShowFormula(false);` を併記。
- StepExplainer を `<StepExplainer steps={explainBigSubtraction(problem)} problem={formula} onClose={() => setShowHint(false)} />` に変更。

- [ ] **Step 8: ビルド確認**

Run: `npm run build`
Expected: 成功（`ColumnAddition`/`ColumnSubtraction` 削除で未使用 import/変数が残っていないこと。`BigAdditionProblem`/`BigSubtractionProblem` 型 import は他で使われていなければ整理）

- [ ] **Step 9: 実機確認**

`npm run dev` で 大きいたしざん／大きいひきざん を開き、筆算ではなく横式（例 `34 ＋ 28 ＝ ？`）で表示されること、「🔢 しきを みる」で出し入れできること、次問題で隠れること、💡ヒントに式が出ること、正誤判定が従来どおり動くことを確認。

- [ ] **Step 10: コミット**

```bash
git add src/screens/BigAdditionUnit.tsx src/screens/BigSubtractionUnit.tsx
git commit -m "feat: show two-digit add/sub as horizontal expression with reveal and hint"
```

---

## Phase D — ③ ユニット別BGM

### Task D1: bgm.ts をトラック化し setBgmTrack を追加

**Files:**
- Modify: `src/features/sound/bgm.ts`

- [ ] **Step 1: Track 型と TRACKS を定義**

`src/features/sound/bgm.ts` の音名定数の下に、既存 `MELODY`/`BASS`/`NOTE` を `Track` にまとめ、複数トラックを定義する。既存のメロディは `home` として温存し、ユニット別に旋律/テンポ/波形を変えた曲を足す:
```ts
export interface Track {
  melody: (number | null)[];
  bass: (number | null)[];
  note: number;
  melodyWave?: OscillatorType;
}

// 既存メロディ（ハ長調・明るい）
const TRACK_HOME: Track = {
  melody: [
    E4, G4, C5, G4, E4, G4, C5, G4,
    F4, A4, D5, A4, F4, A4, D5, C5,
    E4, G4, C5, E5, D5, C5, B4, G4,
    C5, G4, E4, G4, C5, null, C5, null,
  ],
  bass: [C3, F3, C3, G3, C3, F3, C3, C3],
  note: 0.28,
  melodyWave: 'triangle',
};

// たし算系: 弾むテンポ・少し速め
const TRACK_ADD: Track = {
  melody: [
    G4, C5, E5, C5, G4, C5, E5, C5,
    A4, D5, F4, A4, G4, C5, E5, G4,
    E4, G4, C5, G4, F4, A4, D5, A4,
    G4, E4, C5, G4, C5, null, G4, null,
  ],
  bass: [C3, C3, F3, G3, C3, F3, G3, C3],
  note: 0.24,
  melodyWave: 'triangle',
};

// ひき算系: ゆったり・落ち着き
const TRACK_SUB: Track = {
  melody: [
    C5, B4, A4, G4, A4, B4, C5, null,
    G4, A4, B4, C5, B4, A4, G4, null,
    E4, F4, G4, A4, G4, F4, E4, null,
    C5, G4, E4, G4, C5, null, null, null,
  ],
  bass: [C3, G3, A4 / 4, F3, C3, G3, F3, C3],
  note: 0.32,
  melodyWave: 'sine',
};

// かけ算系: リズミカル
const TRACK_MUL: Track = {
  melody: [
    E5, E5, C5, C5, G4, G4, C5, null,
    F4, F4, A4, A4, D5, D5, A4, null,
    G4, C5, E5, C5, G4, C5, E5, null,
    C5, E5, G4, C5, E5, null, C5, null,
  ],
  bass: [C3, C3, F3, F3, G3, G3, C3, C3],
  note: 0.22,
  melodyWave: 'square',
};

// わり算系: 規則的でやさしい
const TRACK_DIV: Track = {
  melody: [
    G4, A4, B4, C5, C5, B4, A4, G4,
    F4, G4, A4, B4, B4, A4, G4, F4,
    E4, F4, G4, A4, A4, G4, F4, E4,
    C5, B4, A4, G4, C5, null, C5, null,
  ],
  bass: [C3, F3, G3, C3, C3, F3, G3, C3],
  note: 0.30,
  melodyWave: 'triangle',
};

const TRACKS: Record<string, Track> = {
  home: TRACK_HOME,
  'make-ten': TRACK_ADD,
  addition: TRACK_ADD,
  'big-addition': TRACK_ADD,
  subtraction: TRACK_SUB,
  'big-subtraction': TRACK_SUB,
  'cherry-calc': TRACK_SUB,
  multiplication: TRACK_MUL,
  division: TRACK_DIV,
};
```
（注: 既存の `const MELODY`/`const BASS`/`const NOTE` 宣言は削除し、上記 TRACKS に置き換える。`A4 / 4` のような不要な式は使わず、必要なら新たな低音定数 A2 等を足してよい。bass は `(number|null)[]`。）

- [ ] **Step 2: 再生エンジンを現在トラック参照に変更**

`let noteIndex = 0;` の近くに現在トラックを保持する変数を追加:
```ts
let current: Track = TRACKS.home;
```

`scheduler()` 内の `MELODY`/`BASS`/`NOTE` 参照を `current.melody`/`current.bass`/`current.note` に置換し、メロディ波形は `current.melodyWave ?? 'triangle'` を使う:
```ts
function scheduler(): void {
  if (!ctx) return;
  while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
    const m = current.melody[noteIndex % current.melody.length];
    if (m != null) playNote(m, nextNoteTime, current.note * 0.9, 0.07, current.melodyWave ?? 'triangle');
    if (noteIndex % 4 === 0) {
      const b = current.bass[Math.floor(noteIndex / 4) % current.bass.length];
      if (b != null) playNote(b, nextNoteTime, current.note * 3.6, 0.05, 'sine');
    }
    nextNoteTime += current.note;
    noteIndex += 1;
  }
}
```

`startBgm()` 内の `nextNoteTime = ac.currentTime + 0.1;` は維持。

- [ ] **Step 3: setBgmTrack を追加**

ファイル末尾に追加:
```ts
let currentTrackId = 'home';

/** 画面に応じてBGMの曲を切り替える。未知IDは home にフォールバック。
 *  同じ曲の再指定は無視（リスタートさせない）。enabled/再生状態は維持。 */
export function setBgmTrack(id: string): void {
  if (id === currentTrackId) return;
  currentTrackId = id;
  current = TRACKS[id] ?? TRACKS.home;
  noteIndex = 0; // 新しい曲の頭から
}
```

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: 成功（未使用変数・型エラーなし）

- [ ] **Step 5: コミット**

```bash
git add src/features/sound/bgm.ts
git commit -m "feat: support per-screen BGM tracks via setBgmTrack"
```

### Task D2: 各画面でトラックを指定

**Files:**
- Modify: 8ユニット画面・`src/App.tsx`（ホーム復帰時）

- [ ] **Step 1: 各ユニットでマウント時にトラック指定**

各ユニット画面の上部 import に追加:
```ts
import { useEffect } from 'react';
import { setBgmTrack } from '../features/sound/bgm';
```
（`useEffect` が既に import 済みなら重複させない。）

各ユニットのコンポーネント関数の本体先頭（state 宣言の後）に追加。`<trackId>` は自分のユニットID:
```tsx
  useEffect(() => { setBgmTrack('<trackId>'); }, []);
```
対応: MakeTenUnit→`'make-ten'`, AdditionUnit→`'addition'`, SubtractionUnit→`'subtraction'`, CherryCalcUnit→`'cherry-calc'`, BigAdditionUnit→`'big-addition'`, BigSubtractionUnit→`'big-subtraction'`, MultiplicationUnit→`'multiplication'`, DivisionUnit→`'division'`。

- [ ] **Step 2: ホーム等に戻ったら home トラックへ**

`src/App.tsx` で、`handleExit` がホームに戻すので、ホーム表示時に home トラックへ戻す。`renderScreen` 内の最後の `HomeScreen` を返す直前は副作用を書けないため、App コンポーネント本体に追加:
```tsx
import { useEffect } from 'react';
import { setBgmTrack } from './features/sound/bgm';
```
`export default function App() {` 直後の state 宣言の下に:
```tsx
  useEffect(() => {
    if (screen.kind === 'home' || screen.kind === 'progress' || screen.kind === 'stampBook' || screen.kind === 'collection') {
      setBgmTrack('home');
    }
  }, [screen.kind]);
```
（challenge/mission/maker は home のままでよい。必要なら後でトラックを足す。）

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 4: 実機確認**

`npm run dev`、BGM をオンにして各ユニットを開くと曲調が変わること、ホームに戻ると home 曲に戻ること、同じユニットを開き直しても曲が頭出しでブツ切れにならない（既に同じ曲なら継続）ことを確認。BGMトグルでオフ→オンも確認。

- [ ] **Step 5: コミット**

```bash
git add src/App.tsx src/screens/MakeTenUnit.tsx src/screens/AdditionUnit.tsx src/screens/SubtractionUnit.tsx src/screens/CherryCalcUnit.tsx src/screens/BigAdditionUnit.tsx src/screens/BigSubtractionUnit.tsx src/screens/MultiplicationUnit.tsx src/screens/DivisionUnit.tsx
git commit -m "feat: switch BGM track per unit screen"
```

---

## 仕上げ

### Task Z1: 全テストとビルド

- [ ] **Step 1: 全テスト実行**

Run: `npm run test`
Expected: 全て PASS

- [ ] **Step 2: 型・本番ビルド**

Run: `npm run build`
Expected: 成功

- [ ] **Step 3: 通し実機確認**

`npm run dev` で、①〜⑥を一通り操作して回帰がないことを確認（既存の正誤判定・スタンプ付与・読み上げ・作問の自由モードが壊れていないこと）。特に二桁ユニットが横式で表示され、筆算コンポーネントの残骸がないこと。

---

## 自己レビュー結果

- **スペック網羅:** ①=C1/C3/C4、②=A1〜A4、③=D1/D2、④=B1/B2、⑤=C3/C4、⑥=C4。全要件にタスクあり。
- **型整合:** `Goal.validate(a,b,answer)`、`Track`、`setBgmTrack(id)`、`dateKey(ms)`、`countByDay/currentStreak` はタスク間で一貫。formula 文字列は①の表・C3・C4で一致。
- **実装順:** ⑥（C4で横式化）は⑤と同じ C4 内で行うため、二桁ユニットは筆算削除→横式→後出し→ヒントの順で一括変更される。
- **既知の注意点:** C4 で `ColumnAddition`/`ColumnSubtraction` 削除後、未使用 import（型 `BigAdditionProblem` 等）が残らないようビルドで確認。BGM の bass は `(number|null)[]` で、低音が要るなら定数（C3/F3/G3 等、必要なら A2 を追加）を使い、計算式（例 `A4/4`）は使わない。`useEffect` は各ファイルで重複 import しない。
