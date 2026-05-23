# サウンド・視覚強化 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 現在ほぼ無音・シンプルなビジュアルの状態から、Web Audio API 合成音声と framer-motion アニメーションでリッチな子ども向け体験に引き上げる。

**Architecture:** `sfx.ts` を Web Audio API ベースの `synth.ts` と統合して実際に音が鳴るようにする。`MakeTenFrame` / `AnswerButtons` / `Companion` を framer-motion で強化し、SVG ベースのうさぎキャラクターを追加する。

**Tech Stack:** React 19 + TypeScript + Vite / framer-motion / Web Audio API / canvas-confetti / Tailwind CSS

参照仕様: `docs/superpowers/specs/2026-05-24-sound-visual-phase2-design.md`

---

## ファイル構成

```
src/
  features/sound/
    synth.ts              [新規] Web Audio API 効果音合成（tap/correct/wrong/levelup/fanfare）
    sfx.ts                [修正] synth.ts を優先的に呼び出す
  features/character/
    CompanionSvg.tsx       [新規] SVG うさぎキャラクター（normal/happy/hint 表情）
    Companion.tsx          [修正] CompanionSvg を使う + アニメーション強化
  components/
    MakeTenFrame.tsx       [修正] spring バウンス + 正解フラッシュ + フルーツランダム
    AnswerButtons.tsx      [修正] whileTap スケール + 正解/不正解 フィードバック
  screens/
    MakeTenUnit.tsx        [修正] 視覚強化反映（wrong シェイク、クリア画面スタンプアニメ）
    HomeScreen.tsx         [修正] 背景グラデーション + カードホバーアニメ
tests/
  features/sound/synth.test.ts   [新規]
```

---

### Task 1: Web Audio API 効果音合成（synth.ts）

**Files:**
- Create: `src/features/sound/synth.ts`
- Test: `tests/features/sound/synth.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/features/sound/synth.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';

// jsdom に AudioContext はないのでモック
const mockOscillator = {
  type: 'sine' as OscillatorType,
  frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};
const mockGain = {
  gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
};
const mockCtx = {
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  state: 'running',
  resume: vi.fn(),
};
vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

import { playTone, SynthName } from '../../src/features/sound/synth';

describe('playTone', () => {
  it('tap を再生してもエラーを投げない', () => {
    expect(() => playTone('tap')).not.toThrow();
  });
  it('correct を再生してもエラーを投げない', () => {
    expect(() => playTone('correct')).not.toThrow();
  });
  it('wrong を再生してもエラーを投げない', () => {
    expect(() => playTone('wrong')).not.toThrow();
  });
  it('levelup を再生してもエラーを投げない', () => {
    expect(() => playTone('levelup')).not.toThrow();
  });
  it('fanfare を再生してもエラーを投げない', () => {
    expect(() => playTone('fanfare')).not.toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/features/sound/synth.test.ts`
Expected: FAIL（`playTone` / `SynthName` 未定義）

- [ ] **Step 3: synth.ts を実装する**

`src/features/sound/synth.ts`:
```ts
export type SynthName = 'tap' | 'correct' | 'wrong' | 'levelup' | 'fanfare';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(
  ac: AudioContext,
  freq: number,
  type: OscillatorType,
  startAt: number,
  duration: number,
  volume = 0.3,
): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
}

function playCorrect(ac: AudioContext): void {
  // C5 → E5 → G5 アルペジオ
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => beep(ac, freq, 'sine', ac.currentTime + i * 0.1, 0.15, 0.35));
}

function playWrong(ac: AudioContext): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ac.currentTime);
  osc.frequency.linearRampToValueAtTime(180, ac.currentTime + 0.15);
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.25);
}

function playLevelup(ac: AudioContext): void {
  // C5 → E5 → G5 → C6 上昇
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => beep(ac, freq, 'sine', ac.currentTime + i * 0.12, 0.18, 0.4));
}

function playFanfare(ac: AudioContext): void {
  // C5 E5 G5 の和音を2回 + 上昇ラン
  const chord = [523.25, 659.25, 783.99];
  chord.forEach((f) => beep(ac, f, 'sine', ac.currentTime, 0.3, 0.25));
  chord.forEach((f) => beep(ac, f, 'sine', ac.currentTime + 0.35, 0.3, 0.25));
  [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5].forEach((f, i) =>
    beep(ac, f, 'sine', ac.currentTime + 0.7 + i * 0.08, 0.1, 0.3),
  );
}

export function playTone(name: SynthName): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    switch (name) {
      case 'tap':
        beep(ac, 440, 'sine', ac.currentTime, 0.05, 0.2);
        break;
      case 'correct':
        playCorrect(ac);
        break;
      case 'wrong':
        playWrong(ac);
        break;
      case 'levelup':
        playLevelup(ac);
        break;
      case 'fanfare':
        playFanfare(ac);
        break;
    }
  } catch {
    // 再生失敗でも継続
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/features/sound/synth.test.ts`
Expected: PASS（全5ケース緑）

- [ ] **Step 5: sfx.ts を synth.ts と統合する**

`src/features/sound/sfx.ts` を全置換:
```ts
import { Howl } from 'howler';
import { playTone, type SynthName } from './synth';

export type SfxName = 'correct' | 'tap' | 'levelup' | 'wrong' | 'fanfare';

const FILES: Partial<Record<SfxName, string>> = {
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
  // ファイルが public/sounds/ に存在すれば Howler、なければ synth にフォールバック
  const file = FILES[name];
  if (file) {
    try {
      if (!cache[name]) {
        cache[name] = new Howl({ src: [file], volume: 0.6, preload: false });
      }
      const h = cache[name]!;
      // ファイル未配置の場合はロードエラーになるので synth にフォールバック
      h.on('loaderror', () => {
        delete cache[name];
        playTone(name as SynthName);
      });
      // すでにロード済みなら再生、そうでなければ synth で即鳴らす
      if (h.state() === 'loaded') {
        h.play();
        return;
      }
    } catch {
      // fallthrough to synth
    }
  }
  playTone(name as SynthName);
}
```

- [ ] **Step 6: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 7: Commit**

```bash
git add src/features/sound/synth.ts src/features/sound/sfx.ts tests/features/sound/synth.test.ts
git commit -m "feat: Web Audio API synth for sound effects (tap/correct/wrong/levelup/fanfare)"
```

---

### Task 2: SVG うさぎキャラクター（CompanionSvg.tsx）

**Files:**
- Create: `src/features/character/CompanionSvg.tsx`

`normal` / `happy` / `hint` の3表情を持つ SVG うさぎを描画する React コンポーネント。

- [ ] **Step 1: CompanionSvg.tsx を実装する**

`src/features/character/CompanionSvg.tsx`:
```tsx
export type FaceExpression = 'normal' | 'happy' | 'hint';

interface Props {
  expression?: FaceExpression;
  size?: number;
}

export function CompanionSvg({ expression = 'normal', size = 80 }: Props) {
  const eyes = {
    normal: (
      <>
        <circle cx="38" cy="52" r="4" fill="#333" />
        <circle cx="62" cy="52" r="4" fill="#333" />
        <circle cx="39.5" cy="50.5" r="1.5" fill="white" />
        <circle cx="63.5" cy="50.5" r="1.5" fill="white" />
      </>
    ),
    happy: (
      <>
        {/* 閉じて弧を描く笑い目 */}
        <path d="M34 52 Q38 46 42 52" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M58 52 Q62 46 66 52" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
    hint: (
      <>
        <circle cx="38" cy="52" r="4" fill="#333" />
        <circle cx="62" cy="52" r="4" fill="#333" />
        <circle cx="39.5" cy="50.5" r="1.5" fill="white" />
        <circle cx="63.5" cy="50.5" r="1.5" fill="white" />
        {/* 片方の眉を上げてる */}
        <path d="M56 44 Q62 40 68 43" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  }[expression];

  const mouth = {
    normal: <path d="M43 63 Q50 69 57 63" stroke="#c0392b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    happy: <path d="M40 63 Q50 74 60 63" stroke="#c0392b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    hint: <path d="M43 65 Q50 68 57 65" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />,
  }[expression];

  const cheekColor = expression === 'happy' ? '#ffb3b3' : '#ffd0d0';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* 耳（左） */}
      <ellipse cx="30" cy="22" rx="10" ry="22" fill="#f5c5d0" />
      <ellipse cx="30" cy="22" rx="6" ry="16" fill="#ffaab8" />
      {/* 耳（右） */}
      <ellipse cx="70" cy="22" rx="10" ry="22" fill="#f5c5d0" />
      <ellipse cx="70" cy="22" rx="6" ry="16" fill="#ffaab8" />
      {/* 顔 */}
      <circle cx="50" cy="58" r="34" fill="#fce8ee" />
      {/* ほっぺ */}
      <ellipse cx="28" cy="64" rx="9" ry="6" fill={cheekColor} opacity="0.7" />
      <ellipse cx="72" cy="64" rx="9" ry="6" fill={cheekColor} opacity="0.7" />
      {/* 鼻 */}
      <ellipse cx="50" cy="59" rx="3.5" ry="2.5" fill="#ff8fa3" />
      {/* ひげ（左） */}
      <line x1="16" y1="60" x2="38" y2="62" stroke="#ccc" strokeWidth="1.2" />
      <line x1="16" y1="65" x2="38" y2="64" stroke="#ccc" strokeWidth="1.2" />
      {/* ひげ（右） */}
      <line x1="84" y1="60" x2="62" y2="62" stroke="#ccc" strokeWidth="1.2" />
      <line x1="84" y1="65" x2="62" y2="64" stroke="#ccc" strokeWidth="1.2" />
      {/* 目 */}
      {eyes}
      {/* 口 */}
      {mouth}
    </svg>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/features/character/CompanionSvg.tsx
git commit -m "feat: SVG rabbit character with normal/happy/hint expressions"
```

---

### Task 3: Companion.tsx を SVG キャラクター + 強化アニメーションに更新

**Files:**
- Modify: `src/features/character/Companion.tsx`（全置換）

- [ ] **Step 1: Companion.tsx を更新する**

`src/features/character/Companion.tsx` を全置換:
```tsx
import { motion } from 'framer-motion';
import { speakJa } from '../speech/tts';
import { CompanionSvg, type FaceExpression } from './CompanionSvg';

interface Props {
  name: string;
  message: string;
  expression?: FaceExpression;
  size?: number;
}

export function Companion({ name, message, expression = 'normal', size = 90 }: Props) {
  const isHappy = expression === 'happy';
  return (
    <div className="flex items-end gap-3">
      <motion.div
        className="flex flex-col items-center"
        animate={
          isHappy
            ? { y: [0, -18, 0, -10, 0], rotate: [0, -8, 8, -4, 0], scale: [1, 1.1, 1] }
            : { y: 0, rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <CompanionSvg expression={expression} size={size} />
        <div className="rounded-full bg-yellow-200 px-2 text-xs font-bold text-amber-900 shadow-sm">{name}</div>
      </motion.div>

      {/* 吹き出し（クラウド型） */}
      <button
        type="button"
        onClick={() => speakJa(message)}
        className="relative max-w-xs rounded-[20px] border-2 border-yellow-300 bg-white px-4 py-3 text-left text-lg font-bold text-amber-900 shadow-md active:scale-95 transition-transform"
        aria-label="よみあげ"
      >
        {/* 吹き出しの尾（左下） */}
        <span className="absolute -left-3 bottom-3 h-0 w-0 border-y-[8px] border-r-[12px] border-y-transparent border-r-yellow-300" />
        <span className="absolute -left-[10px] bottom-3 h-0 w-0 border-y-[8px] border-r-[12px] border-y-transparent border-r-white" />
        {message} <span aria-hidden>🔊</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: MakeTenUnit.tsx の `happy` を `expression` に合わせて修正する**

`src/screens/MakeTenUnit.tsx` を開いて次の2か所を修正する。

修正前（28行目付近）:
```tsx
  const [happy, setHappy] = useState(false);
```
修正後:
```tsx
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
```

修正前（Companion 呼び出し部分）:
```tsx
      <Companion
        name={characterName}
        emoji="🐰"
        happy={happy}
        message={`🍎が ${current}こ あるよ。あと なんこで 10こ になる？`}
      />
```
修正後:
```tsx
      <Companion
        name={characterName}
        expression={expression}
        message={`🍎が ${current}こ あるよ。あと なんこで 10こ になる？`}
      />
```

また `setHappy(true)` → `setExpression('happy')` 、`setHappy(false)` → `setExpression('normal')` に置換する。

- [ ] **Step 3: MakeTenUnit.tsx の全文を確認して正確に更新する**

`src/screens/MakeTenUnit.tsx` を全置換:
```tsx
import { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
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
const FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍌'] as const;

interface Props {
  characterName: string;
  onExit: () => void;
}

function newCurrent(): number {
  return Math.floor(Math.random() * 9) + 1;
}

function randomFruit(): string {
  return FRUITS[Math.floor(Math.random() * FRUITS.length)];
}

export function MakeTenUnit({ characterName, onExit }: Props) {
  const [current, setCurrent] = useState(newCurrent);
  const [fruit, setFruit] = useState(randomFruit);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [flash, setFlash] = useState(false);
  const choices = useMemo(() => makeAnswerChoices(current), [current]);
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    if (isCorrectMissing(current, value)) {
      playSfx('correct');
      setExpression('happy');
      setFlash(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, 'make-ten', Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setFlash(false);
          setCurrent(newCurrent());
          setFruit(randomFruit());
          processing.current = false;
        }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど やってみよう');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="text-7xl"
        >
          🎉
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-green-700"
        >
          クリア！ スタンプ ゲット！
        </motion.p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          className="text-5xl"
        >
          ⭐
        </motion.div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 active:shadow-none transition-all"
        >
          ホームに もどる
        </button>
      </div>
    );
  }

  const missing = missingToTen(current);
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={`${fruit}が ${current}こ あるよ。あと なんこで 10こ になる？`}
      />
      <MakeTenFrame filled={current} fruit={fruit} flash={flash} />
      <AnswerButtons choices={choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p
            key="wrong"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-lg font-bold text-orange-600"
          >
            おしい！ もういちど やってみよう（ヒント：あと {missing}こ）
          </motion.p>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={onExit}
        className="mt-4 text-sm text-amber-600 underline"
      >
        やめる
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: Commit**

```bash
git add src/features/character/Companion.tsx src/screens/MakeTenUnit.tsx
git commit -m "feat: SVG companion integration and MakeTenUnit visual enhancement"
```

---

### Task 4: MakeTenFrame 強化（spring バウンス + 正解フラッシュ + フルーツ対応）

**Files:**
- Modify: `src/components/MakeTenFrame.tsx`（全置換）
- Modify: `tests/components/MakeTenFrame.test.tsx`（`flash` prop を追加）

- [ ] **Step 1: テストを更新する（flash prop を追加）**

`tests/components/MakeTenFrame.test.tsx` を全置換:
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
  it('renders flash prop without crashing', () => {
    render(<MakeTenFrame filled={10} flash />);
    expect(screen.getAllByTestId('cell-filled')).toHaveLength(10);
  });
  it('clamps filled above 10', () => {
    render(<MakeTenFrame filled={12} />);
    expect(screen.getAllByTestId('cell-filled')).toHaveLength(10);
  });
});
```

- [ ] **Step 2: テストが通ることを確認（まだ flash prop がないので FAIL する）**

Run: `npx vitest run tests/components/MakeTenFrame.test.tsx`
Expected: FAIL（`flash` prop が無いため型エラー → テスト失敗）

- [ ] **Step 3: MakeTenFrame.tsx を更新する**

`src/components/MakeTenFrame.tsx` を全置換:
```tsx
import { motion } from 'framer-motion';

interface Props {
  filled: number;
  fruit?: string;
  flash?: boolean;
}

export function MakeTenFrame({ filled, fruit = '🍎', flash = false }: Props) {
  const clamped = Math.max(0, Math.min(10, filled));
  return (
    <div
      className={
        'grid max-w-[380px] grid-cols-5 gap-2 rounded-2xl border-[3px] p-3 transition-colors duration-300 ' +
        (flash ? 'border-yellow-400 bg-yellow-100' : 'border-blue-300 bg-white')
      }
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const isFilled = i < clamped;
        return (
          <motion.div
            key={i}
            data-testid={isFilled ? 'cell-filled' : 'cell-empty'}
            initial={false}
            animate={
              isFilled
                ? { scale: [0.7, 1.15, 1], opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={isFilled ? { type: 'spring', stiffness: 400, damping: 12 } : {}}
            className={
              'flex aspect-square items-center justify-center rounded-xl text-2xl select-none ' +
              (isFilled
                ? (flash ? 'bg-yellow-300' : 'bg-red-100 shadow-inner')
                : 'animate-pulse border-2 border-dashed border-blue-300 bg-blue-50')
            }
          >
            {isFilled ? fruit : ''}
            <span data-testid="cell" className="hidden" />
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/components/MakeTenFrame.test.tsx`
Expected: PASS（全4ケース緑）

- [ ] **Step 5: Commit**

```bash
git add src/components/MakeTenFrame.tsx tests/components/MakeTenFrame.test.tsx
git commit -m "feat: MakeTenFrame spring animation and flash effect"
```

---

### Task 5: AnswerButtons 強化（タップアニメーション）

**Files:**
- Modify: `src/components/AnswerButtons.tsx`（全置換）

- [ ] **Step 1: AnswerButtons.tsx を更新する**

`src/components/AnswerButtons.tsx` を全置換:
```tsx
import { motion } from 'framer-motion';

interface Props {
  choices: number[];
  onPick: (value: number) => void;
  disabled?: boolean;
}

const COLORS = [
  'bg-blue-400 shadow-[0_5px_0_#1565c0] hover:bg-blue-500',
  'bg-green-500 shadow-[0_5px_0_#2e7d32] hover:bg-green-600',
  'bg-red-400 shadow-[0_5px_0_#b71c1c] hover:bg-red-500',
] as const;

export function AnswerButtons({ choices, onPick, disabled }: Props) {
  return (
    <div className="flex gap-4">
      {choices.map((c, i) => (
        <motion.button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c)}
          whileTap={{ scale: 0.88, y: 4 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`rounded-2xl px-7 py-4 text-3xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${COLORS[i % COLORS.length]}`}
        >
          {c}
        </motion.button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/components/AnswerButtons.tsx
git commit -m "feat: AnswerButtons spring tap animation"
```

---

### Task 6: HomeScreen 背景グラデーション + カードアニメーション

**Files:**
- Modify: `src/screens/HomeScreen.tsx`（全置換）

- [ ] **Step 1: HomeScreen.tsx を更新する**

`src/screens/HomeScreen.tsx` を全置換:
```tsx
import { motion } from 'framer-motion';
import { UNITS } from '../data/units';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
}

const UNIT_EMOJIS: Record<string, string> = {
  'make-ten': '🔟',
  'addition': '➕',
  'subtraction': '➖',
  'cherry-calc': '🍒',
  'big-addition': '🔢',
  'big-subtraction': '🔣',
  'multiplication': '✖️',
  'division': '➗',
};

export function HomeScreen({ characterName, stampTotal, onSelectUnit }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
      <div className="flex w-full items-center justify-between">
        <div className="text-lg font-bold text-amber-900">あいぼう: {characterName}</div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.9, 1.05, 1] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-full bg-yellow-200 px-4 py-1 font-bold text-amber-900 shadow-sm"
        >
          ⭐ スタンプ {stampTotal}
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-amber-900 drop-shadow-sm"
      >
        さんすうあそび
      </motion.h1>
      <p className="text-amber-700">きょうの がくしゅう を えらんでね</p>

      <div className="flex flex-wrap justify-center gap-5">
        {UNITS.map((u, index) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-52 rounded-2xl border-2 border-blue-200 bg-white p-6 text-center shadow-lg"
          >
            <div className="text-5xl">{UNIT_EMOJIS[u.id] ?? '📚'}</div>
            <div className="mt-2 text-xl font-bold text-amber-900">{u.title}</div>
            <div className="mt-1 text-xs text-amber-500">{u.grade}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック + 全テスト確認**

Run: `npx tsc --noEmit && npm run test`
Expected: 型エラーなし、全テスト PASS

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: HomeScreen gradient background and card animation"
```

---

### Task 7: 動作確認 + ビルド検証

- [ ] **Step 1: 開発サーバで動作確認**

Run: `npm run dev`

確認項目（ブラウザ `http://localhost:5173`）:
1. 背景がグラデーション（空色→アンバー）になっている
2. ホームのユニットカードがホバーで浮き上がる
3. 命名画面から 10をつくるユニットへ進む
4. SVG うさぎキャラクターが表示される
5. 正解時：キャラが跳ねる + MakeTenFrame が黄色フラッシュ + confetti
6. 不正解時：シェイクアニメーションが出る
7. 答えボタンをタップすると押し込みアニメーション
8. 3問クリアでスタンプ演出が表示される
9. ブラウザのコンソールに赤いエラーが出ていない

Ctrl+C で停止

- [ ] **Step 2: 本番ビルド確認**

Run: `npm run build`
Expected: `dist/` が生成され、型エラー・ビルドエラーなし

- [ ] **Step 3: 全テスト確認**

Run: `npm run test`
Expected: 全テスト PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify sound/visual enhancement complete"
```

---

## 完了の定義

- `npm run test` が全 PASS
- `npm run build` が成功
- ブラウザでうさぎ SVG・正解アニメーション・効果音（Web Audio API）が動作する
- 背景グラデーション・カードアニメーション・ボタンアニメーションが確認できる
