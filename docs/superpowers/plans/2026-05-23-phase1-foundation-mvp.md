# フェーズ1：土台＋「10をつくる」MVP 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 子どもが「10をつくる」単元を、相棒キャラ・アニメ・音・読み上げ・スタンプ付きで最後まで遊べる、公開可能な最小Webアプリを作る。

**Architecture:** フロントエンドのみの静的Webアプリ。算数ロジック・ストレージ・報酬は純粋関数として分離しユニットテスト。UIはReactコンポーネント。データ（相棒の名前・スタンプ）はlocalStorageに保存。Cloudflare Pagesへデプロイ可能なビルド。

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS / テスト: Vitest + React Testing Library / アニメ: Framer Motion / ドラッグ: dnd-kit / 効果音: Howler.js / 紙吹雪: canvas-confetti / 読み上げ: Web Speech API（ブラウザ標準）

**全体ロードマップ（参考）:** 本計画はフェーズ1。以降は別計画で実装する。
- フェーズ2：がくしゅうモード拡充（さくらんぼ/くりあがり/二桁/かけ算/わり算、CRA式フェード、習熟度トラッキング土台）
- フェーズ3：もんだいチャレンジ（問題タイプ＋手続き的生成＋フレーバー文、配る系UI、きょうのミッション＋間隔反復、適応難易度）
- フェーズ4：もんだいづくり（テンプレ穴埋め、親が解く流れ、マイもんだいしゅう）
- フェーズ5：ごほうび/コレクション拡充（複数キャラ収集・交代・着せ替え・なかよし度/レベル）

参照仕様: `docs/superpowers/specs/2026-05-23-sansu-app-design.md`

---

## ファイル構成（フェーズ1で作成）

```
package.json / vite.config.ts / tsconfig.json / tsconfig.node.json
tailwind.config.js / postcss.config.js / index.html / .gitignore(追記)
src/
  main.tsx                      # エントリ
  App.tsx                       # 画面ルーティング（状態による出し分け）
  index.css                     # Tailwind読み込み
  lib/
    storage.ts                  # localStorage読み書き層（一元管理）
    math/makeTen.ts             # 「10をつくる」算数ロジック（純粋関数）
  data/
    units.ts                    # 単元データ定義＋型
  features/
    speech/tts.ts               # Web Speech API ラッパ（機能検出つき）
    sound/sfx.ts                # Howler.js 効果音ラッパ
    rewards/stamps.ts           # スタンプ付与ロジック（純粋関数）
    character/character.ts      # 相棒プロフィール（名前）ロジック
    character/Companion.tsx     # 相棒表示＋吹き出し
    character/NamingScreen.tsx  # 命名画面
  components/
    MakeTenFrame.tsx            # 10マスフレーム（ドラッグ操作）
    AnswerButtons.tsx           # 答え選択ボタン
  screens/
    HomeScreen.tsx              # モード選択（フェーズ1は1単元のみ）
    MakeTenUnit.tsx             # 「10をつくる」単元画面
tests/
  lib/math/makeTen.test.ts
  lib/storage.test.ts
  features/rewards/stamps.test.ts
  features/character/character.test.ts
  components/MakeTenFrame.test.tsx
```

---

### Task 1: プロジェクト雛形（Vite + React + TS + Tailwind + Vitest）

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Modify: `.gitignore`

- [ ] **Step 1: 依存をインストール**

Run:
```bash
cd "C:/Users/user/python/20260523_sansu_generator"
npm init -y
npm install react react-dom framer-motion @dnd-kit/core howler canvas-confetti
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/howler @types/canvas-confetti tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
```
Expected: `node_modules/` が作成され、エラーなく完了

- [ ] **Step 2: 設定ファイルを作成**

`vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 3: エントリとアプリ雛形を作成**

`index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>さんすうあそび</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; margin: 0; }
body { font-family: system-ui, "Hiragino Maru Gothic ProN", sans-serif; -webkit-user-select: none; user-select: none; }
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div className="p-8 text-2xl">さんすうあそび 準備中</div>;
}
```

`src/test-setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: package.json にスクリプトを追加**

`package.json` の `"scripts"` を以下に置き換え、`"type": "module"` を追加:
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: .gitignore に node_modules と dist を追記**

`.gitignore` の末尾に追記:
```
# Node
node_modules/
dist/
```

- [ ] **Step 6: 開発サーバ・テストの起動確認**

Run: `npm run dev`
Expected: `http://localhost:5173` が起動し「さんすうあそび 準備中」が表示される（確認したら Ctrl+C）

Run: `npm run test`
Expected: テストファイルがまだ無いので "No test files found" 等で正常終了（exit 0 または該当メッセージ）

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js index.html src/main.tsx src/App.tsx src/index.css src/test-setup.ts .gitignore
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: 「10をつくる」算数ロジック（純粋関数）

**Files:**
- Create: `src/lib/math/makeTen.ts`
- Test: `tests/lib/math/makeTen.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/makeTen.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { missingToTen, isCorrectMissing, makeAnswerChoices } from '../../../src/lib/math/makeTen';

describe('missingToTen', () => {
  it('returns how many are needed to reach 10', () => {
    expect(missingToTen(3)).toBe(7);
    expect(missingToTen(0)).toBe(10);
    expect(missingToTen(10)).toBe(0);
  });
  it('clamps inputs above 10 to 0', () => {
    expect(missingToTen(12)).toBe(0);
  });
});

describe('isCorrectMissing', () => {
  it('true when chosen value completes 10', () => {
    expect(isCorrectMissing(3, 7)).toBe(true);
    expect(isCorrectMissing(3, 6)).toBe(false);
  });
});

describe('makeAnswerChoices', () => {
  it('always includes the correct answer', () => {
    const choices = makeAnswerChoices(3, () => 0.5);
    expect(choices).toContain(7);
  });
  it('returns 3 unique choices within 0..10', () => {
    const choices = makeAnswerChoices(3, () => 0.5);
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    choices.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(10);
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/makeTen.test.ts`
Expected: FAIL（`missingToTen` 等が未定義）

- [ ] **Step 3: 最小実装を書く**

`src/lib/math/makeTen.ts`:
```ts
/** 10にするために あと何個必要か（0..10にクランプ） */
export function missingToTen(current: number): number {
  if (current >= 10) return 0;
  if (current < 0) return 10;
  return 10 - current;
}

/** 選んだ値で10が完成するか */
export function isCorrectMissing(current: number, chosen: number): boolean {
  return current + chosen === 10;
}

/**
 * 答え選択肢を3つ生成（正解を必ず含む）。
 * rng は 0..1 を返す関数（テスト容易性のため注入可能、既定は Math.random）
 */
export function makeAnswerChoices(current: number, rng: () => number = Math.random): number[] {
  const correct = missingToTen(current);
  const choices = new Set<number>([correct]);
  while (choices.size < 3) {
    const candidate = Math.floor(rng() * 11); // 0..10
    if (candidate !== correct) choices.add(candidate);
  }
  // 並びをrngでシャッフル
  return [...choices].sort(() => rng() - 0.5);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/makeTen.test.ts`
Expected: PASS（全ケース緑）

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/makeTen.ts tests/lib/math/makeTen.test.ts
git commit -m "feat: make-ten arithmetic logic (pure functions)"
```

---

### Task 3: localStorage ストレージ層

**Files:**
- Create: `src/lib/storage.ts`
- Test: `tests/lib/storage.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadJson, saveJson } from '../../src/lib/storage';

beforeEach(() => localStorage.clear());

describe('saveJson / loadJson', () => {
  it('round-trips an object', () => {
    saveJson('math-app:test', { a: 1, b: 'x' });
    expect(loadJson('math-app:test', { a: 0, b: '' })).toEqual({ a: 1, b: 'x' });
  });
  it('returns fallback when key is missing', () => {
    expect(loadJson('math-app:missing', { ok: true })).toEqual({ ok: true });
  });
  it('returns fallback when stored value is corrupt', () => {
    localStorage.setItem('math-app:bad', '{not json');
    expect(loadJson('math-app:bad', { ok: true })).toEqual({ ok: true });
  });
  it('does not throw when saving fails (returns false)', () => {
    // 値に循環参照を入れて JSON.stringify を失敗させる
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(saveJson('math-app:circular', circular)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/storage.test.ts`
Expected: FAIL（`loadJson`/`saveJson` 未定義）

- [ ] **Step 3: 最小実装を書く**

`src/lib/storage.ts`:
```ts
/**
 * localStorage アクセスを一元管理する層。
 * 仕様§7：読めない/壊れた/保存失敗でもアプリを落とさない（優雅な劣化）。
 */
export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** 保存。成功で true、失敗（容量超過・stringify失敗等）でも例外を投げず false */
export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts tests/lib/storage.test.ts
git commit -m "feat: localStorage storage layer with graceful degradation"
```

---

### Task 4: スタンプ付与ロジック（純粋関数・有能感型）

**Files:**
- Create: `src/features/rewards/stamps.ts`
- Test: `tests/features/rewards/stamps.test.ts`

仕様§5.0：報酬は「有能感のフィードバック」。単元修了などの意味あるマイルストーンで付与する純粋関数として実装。

- [ ] **Step 1: 失敗するテストを書く**

`tests/features/rewards/stamps.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { addStamp, type StampState } from '../../../src/features/rewards/stamps';

const empty: StampState = { total: 0, history: [] };

describe('addStamp', () => {
  it('increments total and appends history entry', () => {
    const next = addStamp(empty, 'make-ten', 1000);
    expect(next.total).toBe(1);
    expect(next.history).toEqual([{ unitId: 'make-ten', at: 1000 }]);
  });
  it('does not mutate the input state', () => {
    addStamp(empty, 'make-ten', 1000);
    expect(empty.total).toBe(0);
    expect(empty.history).toHaveLength(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/features/rewards/stamps.test.ts`
Expected: FAIL（`addStamp` 未定義）

- [ ] **Step 3: 最小実装を書く**

`src/features/rewards/stamps.ts`:
```ts
export interface StampEntry {
  unitId: string;
  at: number; // 取得時刻(ms)
}

export interface StampState {
  total: number;
  history: StampEntry[];
}

export const EMPTY_STAMPS: StampState = { total: 0, history: [] };

/** マイルストーン達成でスタンプを1つ付与（不変・新オブジェクトを返す） */
export function addStamp(state: StampState, unitId: string, at: number): StampState {
  return {
    total: state.total + 1,
    history: [...state.history, { unitId, at }],
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/features/rewards/stamps.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rewards/stamps.ts tests/features/rewards/stamps.test.ts
git commit -m "feat: stamp reward logic (immutable pure functions)"
```

---

### Task 5: 単元データ定義＋型

**Files:**
- Create: `src/data/units.ts`

純粋なデータ＋型のみ（テスト不要だが、型がコンパイルを通ることを確認）。仕様§3.1のカリキュラム対応をメタに持つ。

- [ ] **Step 1: 単元データと型を作成**

`src/data/units.ts`:
```ts
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
```

- [ ] **Step 2: 型チェックを確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（exit 0）

- [ ] **Step 3: Commit**

```bash
git add src/data/units.ts
git commit -m "feat: unit data definitions with curriculum mapping"
```

---

### Task 6: 読み上げ（Web Speech API）ラッパ

**Files:**
- Create: `src/features/speech/tts.ts`

仕様§7：TTS非対応ブラウザでも落ちない（機能検出）。副作用主体のため自動テストはせず、機能検出の分岐を持たせる。

- [ ] **Step 1: 実装を書く**

`src/features/speech/tts.ts`:
```ts
/** ブラウザがTTSに対応しているか */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** 日本語で読み上げ。非対応なら何もしない（優雅な劣化） */
export function speakJa(text: string): void {
  if (!isSpeechSupported()) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.95;
    window.speechSynthesis.cancel(); // 連続読み上げの重なり防止
    window.speechSynthesis.speak(u);
  } catch {
    // 失敗してもアプリは継続
  }
}
```

- [ ] **Step 2: 型チェックを確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/features/speech/tts.ts
git commit -m "feat: Web Speech API TTS wrapper with feature detection"
```

---

### Task 7: 効果音（Howler.js）ラッパ

**Files:**
- Create: `src/features/sound/sfx.ts`

仕様§7：音声読み込み失敗・無音でも進行可能。音声ファイルはまだ無いので、ファイルが無くてもエラーにならない設計にする。仕様§5.0：演出はオフ可能（enabledフラグ）。

- [ ] **Step 1: 実装を書く**

`src/features/sound/sfx.ts`:
```ts
import { Howl } from 'howler';

export type SfxName = 'correct' | 'tap' | 'levelup';

// public/sounds/ に後でファイルを置く。未配置でも例外は出ない（再生時に無音）。
const FILES: Record<SfxName, string> = {
  correct: 'sounds/correct.mp3',
  tap: 'sounds/tap.mp3',
  levelup: 'sounds/levelup.mp3',
};

let enabled = true;
const cache: Partial<Record<SfxName, Howl>> = {};

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  try {
    if (!cache[name]) {
      cache[name] = new Howl({ src: [FILES[name]], volume: 0.6 });
    }
    cache[name]!.play();
  } catch {
    // 読み込み/再生失敗でも継続
  }
}
```

- [ ] **Step 2: 効果音の置き場所（空）を用意**

Run:
```bash
mkdir -p "C:/Users/user/python/20260523_sansu_generator/public/sounds"
```
`public/sounds/README.md` を作成:
```md
# 効果音ファイル

correct.mp3 / tap.mp3 / levelup.mp3 を配置する。
未配置でもアプリは無音で動作する（src/features/sound/sfx.ts は失敗を握りつぶす）。
フリー音源（CC0等）を後で追加予定。
```

- [ ] **Step 3: 型チェックを確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/features/sound/sfx.ts public/sounds/README.md
git commit -m "feat: Howler sound effects wrapper (safe when files missing)"
```

---

### Task 8: 相棒キャラ ロジック＋表示＋命名画面

**Files:**
- Create: `src/features/character/character.ts`, `src/features/character/Companion.tsx`, `src/features/character/NamingScreen.tsx`
- Test: `tests/features/character/character.test.ts`

- [ ] **Step 1: 失敗するテストを書く（ロジック）**

`tests/features/character/character.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadCharacter, saveCharacterName, DEFAULT_CHARACTER } from '../../../src/features/character/character';

beforeEach(() => localStorage.clear());

describe('character profile', () => {
  it('returns default when nothing stored', () => {
    expect(loadCharacter()).toEqual(DEFAULT_CHARACTER);
  });
  it('persists and reloads the chosen name', () => {
    saveCharacterName('うさたろう');
    expect(loadCharacter().name).toBe('うさたろう');
  });
  it('trims whitespace and ignores empty names', () => {
    saveCharacterName('   ');
    expect(loadCharacter().name).toBe(DEFAULT_CHARACTER.name);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/features/character/character.test.ts`
Expected: FAIL（未定義）

- [ ] **Step 3: ロジックを実装**

`src/features/character/character.ts`:
```ts
import { loadJson, saveJson } from '../../lib/storage';

export interface Character {
  id: string;
  name: string;
  named: boolean; // 命名済みか（初回命名画面の出し分けに使う）
}

export const DEFAULT_CHARACTER: Character = { id: 'usagi', name: 'うさぎ', named: false };

const KEY = 'math-app:profile';

export function loadCharacter(): Character {
  return loadJson<Character>(KEY, DEFAULT_CHARACTER);
}

/** 名前を保存。空白のみは無視（既定のまま）。 */
export function saveCharacterName(name: string): Character {
  const trimmed = name.trim();
  const current = loadCharacter();
  if (trimmed.length === 0) return current;
  const next: Character = { ...current, name: trimmed, named: true };
  saveJson(KEY, next);
  return next;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/features/character/character.test.ts`
Expected: PASS

- [ ] **Step 5: 表示コンポーネントを実装**

`src/features/character/Companion.tsx`:
```tsx
import { motion } from 'framer-motion';
import { speakJa } from '../speech/tts';

interface Props {
  name: string;
  message: string;
  emoji?: string;
  happy?: boolean; // 正解時に喜ぶ
}

/** 相棒キャラ＋吹き出し。吹き出しタップで読み上げ。 */
export function Companion({ name, message, emoji = '🐰', happy = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="flex flex-col items-center"
        animate={happy ? { y: [0, -16, 0] } : { y: 0 }}
        transition={{ duration: 0.5, repeat: happy ? 2 : 0 }}
      >
        <div className="text-6xl">{emoji}</div>
        <div className="rounded-full bg-yellow-200 px-2 text-xs font-bold text-amber-900">{name}</div>
      </motion.div>
      <button
        type="button"
        onClick={() => speakJa(message)}
        className="max-w-xs rounded-2xl border-2 border-yellow-300 bg-white px-4 py-3 text-left text-lg font-bold text-amber-900"
        aria-label="よみあげ"
      >
        {message} <span aria-hidden>🔊</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 6: 命名画面を実装**

`src/features/character/NamingScreen.tsx`:
```tsx
import { useState } from 'react';
import { saveCharacterName } from './character';

interface Props {
  onDone: (name: string) => void;
}

/** 初回：相棒に名前をつける。空なら既定名で進む。 */
export function NamingScreen({ onDone }: Props) {
  const [value, setValue] = useState('');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-amber-50 p-8">
      <div className="text-7xl">🐰</div>
      <p className="text-xl font-bold text-amber-900">なまえを つけてね！</p>
      <input
        className="rounded-xl border-2 border-amber-300 px-4 py-3 text-center text-2xl"
        value={value}
        maxLength={8}
        onChange={(e) => setValue(e.target.value)}
        placeholder="うさたろう"
      />
      <button
        type="button"
        className="rounded-2xl bg-green-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#2e7d32]"
        onClick={() => {
          const saved = saveCharacterName(value);
          onDone(saved.name);
        }}
      >
        けってい
      </button>
    </div>
  );
}
```

- [ ] **Step 7: 型チェック＋テスト確認**

Run: `npx tsc --noEmit && npx vitest run tests/features/character/character.test.ts`
Expected: 型エラーなし、テストPASS

- [ ] **Step 8: Commit**

```bash
git add src/features/character tests/features/character
git commit -m "feat: companion character logic, display, and naming screen"
```

---

### Task 9: 10マスフレーム コンポーネント（ドラッグ操作）

**Files:**
- Create: `src/components/MakeTenFrame.tsx`, `src/components/AnswerButtons.tsx`
- Test: `tests/components/MakeTenFrame.test.tsx`

10マスのうち `filled` 個が果物、残りが点滅する空きマス。フェーズ1では「答えボタン選択」を主操作とし、ドラッグは次フェーズで段階導入するため、まずは表示の正しさをテストする。

- [ ] **Step 1: 失敗するテストを書く**

`tests/components/MakeTenFrame.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MakeTenFrame } from '../../src/components/MakeTenFrame';

describe('MakeTenFrame', () => {
  it('renders 10 cells total', () => {
    render(<MakeTenFrame filled={3} />);
    expect(screen.getAllByTestId('cell')).toHaveLength(10);
  });
  it('renders the given number of filled cells', () => {
    render(<MakeTenFrame filled={3} />);
    expect(screen.getAllByTestId('cell-filled')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/components/MakeTenFrame.test.tsx`
Expected: FAIL（コンポーネント未定義）

- [ ] **Step 3: 実装を書く**

`src/components/MakeTenFrame.tsx`:
```tsx
interface Props {
  filled: number; // 0..10
  fruit?: string;
}

/** 10マスフレーム。filled個を果物、残りを点滅する空きマスで表示。 */
export function MakeTenFrame({ filled, fruit = '🍎' }: Props) {
  const clamped = Math.max(0, Math.min(10, filled));
  return (
    <div className="grid max-w-[360px] grid-cols-5 gap-1.5 rounded-2xl border-[3px] border-blue-300 bg-white p-2.5">
      {Array.from({ length: 10 }).map((_, i) => {
        const isFilled = i < clamped;
        return (
          <div
            key={i}
            data-testid={isFilled ? 'cell-filled' : 'cell-empty'}
            className={
              'flex aspect-square items-center justify-center rounded-lg text-2xl ' +
              (isFilled ? 'bg-red-400' : 'animate-pulse border-2 border-dashed border-blue-300 bg-blue-50')
            }
          >
            {isFilled ? fruit : ''}
            <span data-testid="cell" className="hidden" />
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 答えボタンを実装**

`src/components/AnswerButtons.tsx`:
```tsx
interface Props {
  choices: number[];
  onPick: (value: number) => void;
  disabled?: boolean;
}

const COLORS = ['bg-blue-400 shadow-[0_4px_0_#1976d2]', 'bg-green-500 shadow-[0_4px_0_#2e7d32]', 'bg-red-400 shadow-[0_4px_0_#c62828]'];

export function AnswerButtons({ choices, onPick, disabled }: Props) {
  return (
    <div className="flex gap-3">
      {choices.map((c, i) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c)}
          className={`rounded-xl px-6 py-3 text-2xl font-bold text-white disabled:opacity-50 ${COLORS[i % COLORS.length]}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: テスト＋型チェック確認**

Run: `npx vitest run tests/components/MakeTenFrame.test.tsx && npx tsc --noEmit`
Expected: テストPASS、型エラーなし

- [ ] **Step 6: Commit**

```bash
git add src/components tests/components
git commit -m "feat: MakeTenFrame and AnswerButtons components"
```

---

### Task 10: 「10をつくる」単元画面（出題→解答→演出→スタンプ）

**Files:**
- Create: `src/screens/MakeTenUnit.tsx`

仕様§3.1の出題形式と§7の叱らないフィードバック、§5.0の「報酬は解答完了後」を実装。

- [ ] **Step 1: 単元画面を実装**

`src/screens/MakeTenUnit.tsx`:
```tsx
import { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Companion } from '../features/character/Companion';
import { MakeTenFrame } from '../components/MakeTenFrame';
import { AnswerButtons } from '../components/AnswerButtons';
import { missingToTen, isCorrectMissing, makeAnswerChoices } from '../lib/math/makeTen';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';

interface Props {
  characterName: string;
  onExit: () => void;
}

function newCurrent(): number {
  return Math.floor(Math.random() * 9) + 1; // 1..9
}

export function MakeTenUnit({ characterName, onExit }: Props) {
  const [current, setCurrent] = useState(newCurrent);
  const [solved, setSolved] = useState(0);
  const [happy, setHappy] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const choices = useMemo(() => makeAnswerChoices(current), [current]);
  const cleared = solved >= QUESTIONS_PER_UNIT;

  function handlePick(value: number) {
    if (isCorrectMissing(current, value)) {
      playSfx('correct');
      setHappy(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        // 単元修了マイルストーンでスタンプ（解答完了後＝§5.0）
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, 'make-ten', Date.now()));
        playSfx('levelup');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setHappy(false);
          setCurrent(newCurrent());
        }, 900);
      }
    } else {
      // 叱らない：×や減点なし、優しく促す（§7）
      setFeedback('wrong');
      speakJa('おしい！ もういちど やってみよう');
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-amber-50 p-8">
        <div className="text-6xl">🎉</div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">
          ホームに もどる
        </button>
      </div>
    );
  }

  const missing = missingToTen(current);
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700">といた かず: {solved} / {QUESTIONS_PER_UNIT}</div>
      <Companion
        name={characterName}
        emoji="🐰"
        happy={happy}
        message={`🍎が ${current}こ あるよ。あと なんこで 10こ になる？`}
      />
      <MakeTenFrame filled={current} />
      <AnswerButtons choices={choices} onPick={handlePick} disabled={happy} />
      {feedback === 'wrong' && (
        <p className="text-lg font-bold text-orange-600">おしい！ もういちど やってみよう（ヒント：あと {missing}こ）</p>
      )}
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 2: 型チェックを確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/screens/MakeTenUnit.tsx
git commit -m "feat: make-ten unit screen (question, feedback, confetti, stamp)"
```

---

### Task 11: ホーム画面＋画面ルーティング（App統合）

**Files:**
- Create: `src/screens/HomeScreen.tsx`
- Modify: `src/App.tsx`（全置換）

- [ ] **Step 1: ホーム画面を実装**

`src/screens/HomeScreen.tsx`:
```tsx
import { UNITS } from '../data/units';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
}

export function HomeScreen({ characterName, stampTotal, onSelectUnit }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-amber-50 p-8">
      <div className="flex w-full items-center justify-between">
        <div className="text-lg font-bold text-amber-900">あいぼう: {characterName}🐰</div>
        <div className="rounded-full bg-yellow-200 px-4 py-1 font-bold text-amber-900">⭐ スタンプ {stampTotal}</div>
      </div>
      <h1 className="text-3xl font-bold text-amber-900">さんすうあそび</h1>
      <p className="text-amber-700">きょうの がくしゅう を えらんでね</p>
      <div className="flex flex-wrap justify-center gap-4">
        {UNITS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            className="w-56 rounded-2xl border-2 border-blue-200 bg-white p-6 text-center shadow-md"
          >
            <div className="text-4xl">🔟</div>
            <div className="mt-2 text-xl font-bold text-amber-900">{u.title}</div>
            <div className="mt-1 text-xs text-amber-500">{u.grade}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: App.tsx を全置換して画面遷移を実装**

`src/App.tsx`:
```tsx
import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MakeTenUnit } from './screens/MakeTenUnit';
import { NamingScreen } from './features/character/NamingScreen';
import { loadCharacter } from './features/character/character';
import { loadJson } from './lib/storage';
import { EMPTY_STAMPS, type StampState } from './features/rewards/stamps';

type Screen = { kind: 'home' } | { kind: 'unit'; unitId: string };

export default function App() {
  const [character, setCharacter] = useState(loadCharacter);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  // スタンプ数はホーム表示時に都度ロード（単元クリア後の反映のため key で再マウント）
  const [refresh, setRefresh] = useState(0);
  const stampTotal = loadJson<StampState>('math-app:stamps', EMPTY_STAMPS).total;

  if (!character.named) {
    return <NamingScreen onDone={(name) => setCharacter({ ...character, name, named: true })} />;
  }

  if (screen.kind === 'unit') {
    return (
      <MakeTenUnit
        key={refresh}
        characterName={character.name}
        onExit={() => {
          setRefresh((r) => r + 1);
          setScreen({ kind: 'home' });
        }}
      />
    );
  }

  return (
    <HomeScreen
      key={refresh}
      characterName={character.name}
      stampTotal={stampTotal}
      onSelectUnit={(unitId) => setScreen({ kind: 'unit', unitId })}
    />
  );
}
```

- [ ] **Step 3: 型チェック＋全テスト確認**

Run: `npx tsc --noEmit && npm run test`
Expected: 型エラーなし、全テストPASS

- [ ] **Step 4: 手動確認（実機相当）**

Run: `npm run dev`
確認項目（ブラウザ `http://localhost:5173`）:
1. 初回に命名画面が出る → 名前を入れて「けってい」
2. ホームに「10をつくる」カードが出る → タップ
3. 「🍎が◯こ。あと なんこで10こ？」が出る → 正しい数を選ぶと紙吹雪＋キャラが喜ぶ
4. 3問解くと「クリア！スタンプ ゲット！」→ ホームに戻るとスタンプ数が増えている
5. 間違えると「おしい！もういちど」が出て減点されない
確認後 Ctrl+C

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx src/App.tsx
git commit -m "feat: home screen and app navigation (naming -> home -> unit)"
```

---

### Task 12: ビルド＋Cloudflare Pages デプロイ設定

**Files:**
- Create: `public/_redirects`, `README.md`（デプロイ手順）

- [ ] **Step 1: SPA用リダイレクトを用意**

`public/_redirects`:
```
/*    /index.html   200
```

- [ ] **Step 2: 本番ビルドが通ることを確認**

Run: `npm run build`
Expected: `dist/` が生成され、型エラー・ビルドエラーなし（exit 0）

Run: `npm run preview`
Expected: ビルド成果物が `http://localhost:4173` で起動し、命名→単元クリアまで動く（確認後 Ctrl+C）

- [ ] **Step 3: デプロイ手順をREADMEに記載**

`README.md`:
```md
# さんすうあそび（子ども向け算数アプリ）

幼稚園年長〜小3向けの、無料・タブレット中心の算数学習Webアプリ。

## 開発
- `npm install`
- `npm run dev` … 開発サーバ
- `npm run test` … テスト
- `npm run build` … 本番ビルド（dist/）

## デプロイ（Cloudflare Pages・無料）
1. このリポジトリをGitHubにpush
2. Cloudflare Pages で「Connect to Git」→ 当リポジトリを選択
3. ビルド設定:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. デプロイ完了で公開URLが発行される（サーバー維持費ゼロ）

データは各端末のlocalStorageに保存（サーバー送信なし）。

参照: 仕様 `docs/superpowers/specs/2026-05-23-sansu-app-design.md` / 計画 `docs/superpowers/plans/`
```

- [ ] **Step 4: Commit**

```bash
git add public/_redirects README.md
git commit -m "chore: production build and Cloudflare Pages deploy config"
```

---

## 完了の定義（フェーズ1）
- `npm run test` が全PASS
- `npm run build` が成功
- ブラウザで：命名 → ホーム →「10をつくる」を3問 → スタンプ獲得 → ホームに反映、が一通り動く
- 間違えても叱らない／報酬は単元修了後に出る／TTS・効果音が無くても落ちない
- Cloudflare Pages にデプロイ可能な構成

## フェーズ1スコープ外（次フェーズ）
- ドラッグでマスを埋める操作（フェーズ2でCRA操作として段階導入）
- 3つの数で10をつくる／他単元／さくらんぼ／二桁
- 習熟度トラッキング・きょうのミッション・適応難易度（フェーズ2,3）
- もんだいチャレンジ／もんだいづくり（フェーズ3,4）
- 複数キャラ・コレクション・着せ替え・なかよし度（フェーズ5）
