# フェーズ3〜5：チャレンジ・もんだいづくり・コレクション 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** もんだいチャレンジモード（間隔反復・きょうのミッション）、もんだいづくりモード（テンプレ穴埋め・親が解く）、コレクション拡充（複数キャラ・着せ替え・なかよし度）を実装する。

**Architecture:** チャレンジは `problemGen.ts` + `spacedRepetition.ts` の純粋関数層の上に `ChallengeMode.tsx` を載せる。もんだいづくりは `problemTemplates.ts` でテンプレートを定義し `ProblemMakerScreen.tsx` で穴埋めUI を提供する。コレクションは既存の character/stamps 層を拡張する。

**Tech Stack:** React 19 + TypeScript + Vite / framer-motion / Tailwind CSS / Vitest

参照仕様: `docs/superpowers/specs/2026-05-24-sound-visual-phase2-design.md` §4, §5, §6

前提: フェーズ2計画（`2026-05-24-phase2-learning-mode.md`）が完了していること。

---

## ファイル構成

```
src/
  lib/
    challenge/
      problemGen.ts          [新規] 問題タイプ定義 + 手続き的生成
      spacedRepetition.ts    [新規] 間隔反復で次の出題スキルを選ぶ純粋関数
    problemTemplates.ts      [新規] もんだいづくり用テンプレート定義
  screens/
    ChallengeMode.tsx        [新規] もんだいチャレンジ（問題出題・解答UI）
    MissionScreen.tsx        [新規] きょうのミッション（ホームに表示）
    ProblemMakerScreen.tsx   [新規] もんだいづくり（テンプレ穴埋め）
    ParentSolveScreen.tsx    [新規] 親が解く → 子どもが◯つけ
    StampBook.tsx            [新規] スタンプ帳画面
  features/
    character/
      CharacterCollection.tsx [新規] なかま図鑑（シルエット → 解放）
      characterDefs.ts        [新規] キャラクター種別定義（うさぎ、ひよこ等）
      characterLevel.ts       [修正] レベル・なかよし度ロジック追加
  data/
    units.ts                 [修正] SKILL_IDS 一覧エクスポートを追加
  App.tsx                   [修正] チャレンジ・ミッション・もんだいづくり・図鑑ルーティング追加
  screens/HomeScreen.tsx    [修正] ミッション表示エリア・モードボタン追加
tests/
  lib/challenge/problemGen.test.ts
  lib/challenge/spacedRepetition.test.ts
  lib/problemTemplates.test.ts
  features/character/characterLevel.test.ts
```

---

### Task 1: スペースドリピテーション（spacedRepetition.ts）

**Files:**
- Create: `src/lib/challenge/spacedRepetition.ts`
- Test: `tests/lib/challenge/spacedRepetition.test.ts`

習熟度マップから「次に出すべきスキル」を選ぶ純粋関数。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/challenge/spacedRepetition.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pickNextSkill, type SkillWeight } from '../../../src/lib/challenge/spacedRepetition';
import type { MasteryMap } from '../../../src/lib/mastery';

const now = 1_000_000;
const DAY = 86_400_000;

describe('pickNextSkill', () => {
  const skills: SkillWeight[] = [
    { skillId: 'addition', weight: 1 },
    { skillId: 'subtraction', weight: 1 },
    { skillId: 'cherry-calc', weight: 1 },
  ];

  it('picks from skills list', () => {
    const map: MasteryMap = {};
    const result = pickNextSkill(map, skills, now);
    expect(skills.map((s) => s.skillId)).toContain(result);
  });

  it('prioritizes skill not seen recently', () => {
    const map: MasteryMap = {
      addition: { correct: 5, wrong: 0, lastAt: now - DAY * 10 }, // 古い
      subtraction: { correct: 5, wrong: 0, lastAt: now - DAY },    // 新しい
      'cherry-calc': { correct: 5, wrong: 0, lastAt: now - DAY * 5 },
    };
    // 最も古い addition が選ばれるはず（決定論的に確認）
    const result = pickNextSkill(map, skills, now, () => 0);
    expect(result).toBe('addition');
  });

  it('returns first skill when map is empty', () => {
    const result = pickNextSkill({}, skills, now, () => 0);
    expect(skills.map((s) => s.skillId)).toContain(result);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/challenge/spacedRepetition.test.ts`
Expected: FAIL

- [ ] **Step 3: spacedRepetition.ts を実装する**

`src/lib/challenge/spacedRepetition.ts`:
```ts
import type { MasteryMap } from '../mastery';

export interface SkillWeight {
  skillId: string;
  weight: number; // 1..3 ほど。高いほど出題頻度が上がる（将来用）
}

/**
 * スキルリストから次に出題するスキルを選ぶ。
 * lastAt が最も古いスキルを優先。rng は 0..1 を返す（テスト注入用）。
 */
export function pickNextSkill(
  map: MasteryMap,
  skills: SkillWeight[],
  now: number,
  rng: () => number = Math.random,
): string {
  if (skills.length === 0) return '';

  // lastAt のスコアを計算（知らないスキルは優先度最高 = Infinity）
  const scored = skills.map(({ skillId }) => {
    const r = map[skillId];
    const lastAt = r?.lastAt ?? 0;
    const staleness = now - lastAt; // ms（大きいほど古い = 優先）
    return { skillId, staleness };
  });

  // staleness 降順でソート
  scored.sort((a, b) => b.staleness - a.staleness);

  // 上位 2 つからランダムに選ぶ（同順位が多い時の分散用）
  const topN = Math.min(2, scored.length);
  const pick = Math.floor(rng() * topN);
  return scored[pick].skillId;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/challenge/spacedRepetition.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/challenge/spacedRepetition.ts tests/lib/challenge/spacedRepetition.test.ts
git commit -m "feat: spaced repetition skill picker (pure functions, TDD)"
```

---

### Task 2: 問題生成（problemGen.ts）

**Files:**
- Create: `src/lib/challenge/problemGen.ts`
- Test: `tests/lib/challenge/problemGen.test.ts`

全スキルをカバーする統一的な問題生成インターフェース。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/challenge/problemGen.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateProblem, checkAnswer, ALL_SKILL_IDS, type Problem } from '../../../src/lib/challenge/problemGen';

describe('generateProblem', () => {
  it('generates a problem for each skill', () => {
    for (const skillId of ALL_SKILL_IDS) {
      const p = generateProblem(skillId);
      expect(p.skillId).toBe(skillId);
      expect(p.choices).toHaveLength(3);
      expect(p.choices).toContain(p.answer);
    }
  });
});

describe('checkAnswer', () => {
  it('returns true for correct choice', () => {
    const p = generateProblem('addition');
    expect(checkAnswer(p, p.answer)).toBe(true);
  });
  it('returns false for wrong choice', () => {
    const p = generateProblem('addition');
    const wrong = p.choices.find((c) => c !== p.answer)!;
    expect(checkAnswer(p, wrong)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/challenge/problemGen.test.ts`
Expected: FAIL

- [ ] **Step 3: problemGen.ts を実装する**

`src/lib/challenge/problemGen.ts`:
```ts
import { generateAddition } from '../math/addition';
import { generateSubtraction } from '../math/subtraction';
import { missingToTen, makeAnswerChoices } from '../math/makeTen';
import { generateCarryProblem } from '../math/cherryCalc';
import { generateBigAddition } from '../math/bigAddition';
import { generateBigSubtraction } from '../math/bigSubtraction';
import { generateMultiplication } from '../math/multiplication';
import { generateDivision } from '../math/division';

export const ALL_SKILL_IDS = [
  'make-ten',
  'addition',
  'subtraction',
  'cherry-calc',
  'big-addition',
  'big-subtraction',
  'multiplication',
  'division',
] as const;

export type SkillId = (typeof ALL_SKILL_IDS)[number];

export interface Problem {
  skillId: string;
  questionText: string;
  answer: number;
  choices: number[];
  emoji?: string;
}

const FLAVOR_ANIMALS = ['🐱', '🐶', '🐸', '🐼', '🦊', '🐨', '🦁', '🐯'];
const FLAVOR_FOODS = ['🍎', '🍊', '🍇', '🍓', '🍌', '🍩', '🍪', '🍭'];

function rndFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProblem(skillId: string): Problem {
  switch (skillId as SkillId) {
    case 'make-ten': {
      const current = Math.floor(Math.random() * 9) + 1;
      const answer = missingToTen(current);
      const choices = makeAnswerChoices(current);
      return {
        skillId,
        questionText: `${rndFrom(FLAVOR_FOODS)}が ${current}こ。あと なんこで 10こ？`,
        answer,
        choices,
        emoji: rndFrom(FLAVOR_FOODS),
      };
    }
    case 'addition': {
      const p = generateAddition();
      return {
        skillId,
        questionText: `${rndFrom(FLAVOR_ANIMALS)}が ${p.a}ひき。${p.b}ひき きたよ。ぜんぶで？`,
        answer: p.a + p.b,
        choices: p.choices,
        emoji: rndFrom(FLAVOR_ANIMALS),
      };
    }
    case 'subtraction': {
      const p = generateSubtraction();
      return {
        skillId,
        questionText: `${rndFrom(FLAVOR_FOODS)}が ${p.a}こ。${p.b}こ たべたら？`,
        answer: p.a - p.b,
        choices: p.choices,
        emoji: rndFrom(FLAVOR_FOODS),
      };
    }
    case 'cherry-calc': {
      const p = generateCarryProblem();
      return {
        skillId,
        questionText: `さくらんぼで ${p.a} ＋ ${p.b} ＝ ？`,
        answer: p.a + p.b,
        choices: p.choices,
        emoji: '🍒',
      };
    }
    case 'big-addition': {
      const p = generateBigAddition();
      return {
        skillId,
        questionText: `${p.a} ＋ ${p.b} ＝ ？`,
        answer: p.a + p.b,
        choices: p.choices,
      };
    }
    case 'big-subtraction': {
      const p = generateBigSubtraction();
      return {
        skillId,
        questionText: `${p.a} ー ${p.b} ＝ ？`,
        answer: p.a - p.b,
        choices: p.choices,
      };
    }
    case 'multiplication': {
      const p = generateMultiplication();
      return {
        skillId,
        questionText: `${p.a} × ${p.b} ＝ ？`,
        answer: p.a * p.b,
        choices: p.choices,
        emoji: '✖️',
      };
    }
    case 'division': {
      const p = generateDivision();
      return {
        skillId,
        questionText: `${p.dividend} ÷ ${p.divisor} ＝ ？`,
        answer: p.quotient,
        choices: p.choices,
        emoji: '➗',
      };
    }
    default: {
      const p = generateAddition();
      return {
        skillId,
        questionText: `${p.a} ＋ ${p.b} ＝ ？`,
        answer: p.a + p.b,
        choices: p.choices,
      };
    }
  }
}

export function checkAnswer(p: Problem, chosen: number): boolean {
  return chosen === p.answer;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/challenge/problemGen.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/challenge/problemGen.ts tests/lib/challenge/problemGen.test.ts
git commit -m "feat: unified problem generator for all skill types"
```

---

### Task 3: もんだいチャレンジモード（ChallengeMode.tsx）

**Files:**
- Create: `src/screens/ChallengeMode.tsx`

間隔反復でスキルを選び、問題を出題する画面。10問セット。

- [ ] **Step 1: ChallengeMode.tsx を実装する**

`src/screens/ChallengeMode.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateProblem, checkAnswer, ALL_SKILL_IDS, type Problem } from '../lib/challenge/problemGen';
import { pickNextSkill, type SkillWeight } from '../lib/challenge/spacedRepetition';
import { loadMastery, saveMastery, recordAnswer } from '../lib/mastery';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

const QUESTIONS_PER_SESSION = 10;
const STAMP_KEY = 'math-app:stamps';

const SKILL_WEIGHTS: SkillWeight[] = ALL_SKILL_IDS.map((id) => ({ skillId: id, weight: 1 }));

interface Props {
  characterName: string;
  onExit: () => void;
}

function nextProblem(): Problem {
  const mastery = loadMastery();
  const skillId = pickNextSkill(mastery, SKILL_WEIGHTS, Date.now());
  return generateProblem(skillId);
}

export function ChallengeMode({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<Problem>(() => nextProblem());
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = answered >= QUESTIONS_PER_SESSION;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const isCorrect = checkAnswer(problem, value);
    const mastery = loadMastery();
    saveMastery(recordAnswer(mastery, problem.skillId, isCorrect, Date.now()));
    if (isCorrect) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      const nextAnswered = answered + 1;
      const nextCorrect = correct + 1;
      setAnswered(nextAnswered);
      setCorrect(nextCorrect);
      setFeedback('none');
      if (nextAnswered >= QUESTIONS_PER_SESSION) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, 'challenge', Date.now()));
        playSfx('fanfare');
        speakJa('チャレンジ クリア！ すごい！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setProblem(nextProblem());
          processing.current = false;
        }, 800);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど！');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🏆</motion.div>
        <p className="text-2xl font-bold text-green-700">チャレンジ クリア！</p>
        <p className="text-xl text-amber-800">{correct} / {QUESTIONS_PER_SESSION} せいかい！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-purple-200 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-bold text-amber-700">もんだい {answered + 1} / {QUESTIONS_PER_SESSION}</span>
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">せいかい {correct}</span>
      </div>
      <Companion name={characterName} expression={expression} message={problem.questionText} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-3xl font-bold text-amber-900 text-center">
        {problem.questionText}
      </div>
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/screens/ChallengeMode.tsx
git commit -m "feat: challenge mode with spaced repetition (10 questions)"
```

---

### Task 4: きょうのミッション（MissionScreen.tsx）

**Files:**
- Create: `src/screens/MissionScreen.tsx`

1日1セット（新問題2問＋復習1問）で毎日戻る理由を作る。

- [ ] **Step 1: MissionScreen.tsx を実装する**

`src/screens/MissionScreen.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateProblem, checkAnswer, ALL_SKILL_IDS, type Problem } from '../lib/challenge/problemGen';
import { pickNextSkill, type SkillWeight } from '../lib/challenge/spacedRepetition';
import { loadMastery, saveMastery, recordAnswer } from '../lib/mastery';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

const STAMP_KEY = 'math-app:stamps';
const MISSION_KEY = 'math-app:lastMission';
const MISSION_COUNT = 3; // 新問題2 + 復習1

const SKILL_WEIGHTS: SkillWeight[] = ALL_SKILL_IDS.map((id) => ({ skillId: id, weight: 1 }));

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasMissionToday(): boolean {
  return loadJson<string>(MISSION_KEY, '') === todayStr();
}

interface Props {
  characterName: string;
  onExit: () => void;
}

function buildMission(): Problem[] {
  const mastery = loadMastery();
  const now = Date.now();
  const problems: Problem[] = [];
  const usedSkills = new Set<string>();
  // 新しいスキル2問
  for (let i = 0; i < 2; i++) {
    const skill = pickNextSkill(mastery, SKILL_WEIGHTS.filter((s) => !usedSkills.has(s.skillId)), now);
    usedSkills.add(skill);
    problems.push(generateProblem(skill));
  }
  // 復習1問（最も古いもの）
  const reviewSkill = pickNextSkill(mastery, SKILL_WEIGHTS, now);
  problems.push(generateProblem(reviewSkill));
  return problems;
}

export function MissionScreen({ characterName, onExit }: Props) {
  const [problems] = useState<Problem[]>(() => buildMission());
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = idx >= problems.length;
  const processing = useRef(false);
  const problem = problems[idx];

  function handlePick(value: number) {
    if (processing.current || !problem) return;
    processing.current = true;
    playSfx('tap');
    const isCorrect = checkAnswer(problem, value);
    saveMastery(recordAnswer(loadMastery(), problem.skillId, isCorrect, Date.now()));
    if (isCorrect) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const next = idx + 1;
      const nextCorrect = correctCount + 1;
      setFeedback('none');
      if (next >= problems.length) {
        setIdx(next);
        setCorrectCount(nextCorrect);
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, 'mission', Date.now()));
        saveJson(MISSION_KEY, todayStr());
        playSfx('fanfare');
        speakJa('ミッション クリア！ すごい！');
      } else {
        setTimeout(() => {
          setIdx(next);
          setCorrectCount(nextCorrect);
          setExpression('normal');
          processing.current = false;
        }, 800);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど！');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🌟</motion.div>
        <p className="text-2xl font-bold text-green-700">ミッション クリア！</p>
        <p className="text-xl text-amber-800">{correctCount} / {MISSION_COUNT} せいかい！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-bold text-amber-700">きょうの ミッション {idx + 1} / {MISSION_COUNT}</span>
        <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm font-bold text-amber-800">🌟 ミッション</span>
      </div>
      <Companion name={characterName} expression={expression} message={problem?.questionText ?? ''} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-3xl font-bold text-amber-900 text-center">
        {problem?.questionText}
      </div>
      {problem && <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />}
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/screens/MissionScreen.tsx
git commit -m "feat: daily mission screen (2 new + 1 review, spaced repetition)"
```

---

### Task 5: もんだいテンプレート（problemTemplates.ts）

**Files:**
- Create: `src/lib/problemTemplates.ts`
- Test: `tests/lib/problemTemplates.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/problemTemplates.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { TEMPLATES, fillTemplate, type TemplateFilled } from '../../src/lib/problemTemplates';

describe('TEMPLATES', () => {
  it('has at least 5 templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });
});

describe('fillTemplate', () => {
  it('returns a filled problem with computed answer', () => {
    const tpl = TEMPLATES[0];
    const filled: TemplateFilled = fillTemplate(tpl, { a: 3, b: 4, emoji: '🍎' });
    expect(typeof filled.answer).toBe('number');
    expect(filled.questionText.length).toBeGreaterThan(0);
  });
  it('answer is correct for addition template', () => {
    const addTpl = TEMPLATES.find((t) => t.type === 'addition')!;
    const filled = fillTemplate(addTpl, { a: 5, b: 3, emoji: '🍊' });
    expect(filled.answer).toBe(8);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/problemTemplates.test.ts`
Expected: FAIL

- [ ] **Step 3: problemTemplates.ts を実装する**

`src/lib/problemTemplates.ts`:
```ts
export type ProblemType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface Template {
  id: string;
  type: ProblemType;
  textPattern: string; // {emoji} {a} {b} などのプレースホルダー
  answerFn: (vars: { a: number; b: number }) => number;
  emojiOptions: string[];
  aRange: [number, number]; // [min, max]
  bRange: [number, number];
}

export interface TemplateFilled {
  templateId: string;
  type: ProblemType;
  questionText: string;
  answer: number;
  emoji: string;
  a: number;
  b: number;
}

function fillText(pattern: string, vars: { emoji: string; a: number; b: number }): string {
  return pattern
    .replace('{emoji}', vars.emoji)
    .replace('{a}', String(vars.a))
    .replace('{b}', String(vars.b));
}

export const TEMPLATES: Template[] = [
  {
    id: 'add-animals',
    type: 'addition',
    textPattern: '{emoji}が {a}ひき。{b}ひき やってきた。ぜんぶで なんびき？',
    answerFn: ({ a, b }) => a + b,
    emojiOptions: ['🐱', '🐶', '🐸', '🐼', '🦊'],
    aRange: [1, 9],
    bRange: [1, 9],
  },
  {
    id: 'add-food',
    type: 'addition',
    textPattern: '{emoji}が {a}こ。{b}こ もらった。ぜんぶで？',
    answerFn: ({ a, b }) => a + b,
    emojiOptions: ['🍎', '🍊', '🍩', '🍪', '🍭'],
    aRange: [1, 9],
    bRange: [1, 9],
  },
  {
    id: 'sub-eat',
    type: 'subtraction',
    textPattern: '{emoji}が {a}こ あったよ。{b}こ たべちゃった。のこりは なんこ？',
    answerFn: ({ a, b }) => a - b,
    emojiOptions: ['🍪', '🍬', '🍭', '🍩', '🍰'],
    aRange: [5, 10],
    bRange: [1, 4],
  },
  {
    id: 'sub-lost',
    type: 'subtraction',
    textPattern: '{emoji}が {a}こ あった。{b}こ なくなった。のこりは？',
    answerFn: ({ a, b }) => a - b,
    emojiOptions: ['🔴', '🔵', '⭐', '🎈', '🌸'],
    aRange: [5, 10],
    bRange: [1, 4],
  },
  {
    id: 'mul-groups',
    type: 'multiplication',
    textPattern: '{emoji}が {b}こずつ {a}つの グループ。ぜんぶで なんこ？',
    answerFn: ({ a, b }) => a * b,
    emojiOptions: ['🍩', '⭐', '🎈', '🐟', '🌸'],
    aRange: [2, 5],
    bRange: [2, 5],
  },
  {
    id: 'div-share',
    type: 'division',
    textPattern: '{emoji}が {a}こ。{b}にんで わけると 1にん なんこ？',
    answerFn: ({ a, b }) => Math.floor(a / b),
    emojiOptions: ['🍪', '🍬', '🍭', '🍩', '🍰'],
    aRange: [6, 20],
    bRange: [2, 5],
  },
];

export function fillTemplate(
  tpl: Template,
  vars: { a: number; b: number; emoji: string },
): TemplateFilled {
  const answer = tpl.answerFn(vars);
  return {
    templateId: tpl.id,
    type: tpl.type,
    questionText: fillText(tpl.textPattern, vars),
    answer,
    emoji: vars.emoji,
    a: vars.a,
    b: vars.b,
  };
}

export function randomFillTemplate(tpl: Template, rng: () => number = Math.random): TemplateFilled {
  const a = Math.floor(rng() * (tpl.aRange[1] - tpl.aRange[0] + 1)) + tpl.aRange[0];
  const b = Math.floor(rng() * (tpl.bRange[1] - tpl.bRange[0] + 1)) + tpl.bRange[0];
  const emoji = tpl.emojiOptions[Math.floor(rng() * tpl.emojiOptions.length)];
  return fillTemplate(tpl, { a, b, emoji });
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/problemTemplates.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/problemTemplates.ts tests/lib/problemTemplates.test.ts
git commit -m "feat: problem templates for maker mode (TDD)"
```

---

### Task 6: もんだいづくり画面（ProblemMakerScreen + ParentSolveScreen）

**Files:**
- Create: `src/screens/ProblemMakerScreen.tsx`
- Create: `src/screens/ParentSolveScreen.tsx`

- [ ] **Step 1: ProblemMakerScreen.tsx を実装する**

`src/screens/ProblemMakerScreen.tsx`:
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TEMPLATES, fillTemplate, type Template, type TemplateFilled } from '../lib/problemTemplates';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';

const MY_PROBLEMS_KEY = 'math-app:myProblems';

interface Props {
  characterName: string;
  onMake: (problem: TemplateFilled) => void;
  onExit: () => void;
}

export function ProblemMakerScreen({ characterName, onMake, onExit }: Props) {
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null);
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [step, setStep] = useState<'select' | 'fill' | 'preview'>('select');

  function handlePreview() {
    playSfx('tap');
    setStep('preview');
  }

  function handleConfirm() {
    if (!selectedTpl) return;
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const filled = fillTemplate(selectedTpl, { a, b, emoji });
    // localStorage に保存
    const existing = loadJson<TemplateFilled[]>(MY_PROBLEMS_KEY, []);
    saveJson(MY_PROBLEMS_KEY, [...existing, filled]);
    playSfx('levelup');
    speakJa(`もんだい できた！ ${filled.questionText}`);
    onMake(filled);
  }

  if (step === 'select') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">もんだいを えらんでね！</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {TEMPLATES.map((tpl) => (
            <motion.button
              key={tpl.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => { setSelectedTpl(tpl); setA(tpl.aRange[0] + 1); setB(tpl.bRange[0]); setStep('fill'); }}
              className="w-48 rounded-2xl border-2 border-green-200 bg-white p-4 text-center shadow-md"
            >
              <div className="text-3xl">{tpl.emojiOptions[0]}</div>
              <div className="mt-1 text-sm font-bold text-green-800">{tpl.textPattern.slice(0, 20)}…</div>
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={onExit} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'fill' && selectedTpl) {
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const preview = fillTemplate(selectedTpl, { a, b, emoji });
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">かずを きめよう！</h1>
        {/* 絵柄選択 */}
        <div className="flex gap-3">
          {selectedTpl.emojiOptions.map((e, i) => (
            <button key={e} type="button" onClick={() => setEmojiIdx(i)}
              className={`rounded-xl p-2 text-3xl ${emojiIdx === i ? 'bg-green-200 ring-2 ring-green-500' : 'bg-white'}`}>
              {e}
            </button>
          ))}
        </div>
        {/* a 選択 */}
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-900">かず①:</span>
          <button type="button" onClick={() => setA((v) => Math.max(selectedTpl.aRange[0], v - 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
          <span className="text-3xl font-bold text-amber-900">{a}</span>
          <button type="button" onClick={() => setA((v) => Math.min(selectedTpl.aRange[1], v + 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
        </div>
        {/* b 選択 */}
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-900">かず②:</span>
          <button type="button" onClick={() => setB((v) => Math.max(selectedTpl.bRange[0], v - 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
          <span className="text-3xl font-bold text-amber-900">{b}</span>
          <button type="button" onClick={() => setB((v) => Math.min(selectedTpl.bRange[1], v + 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
        </div>
        {/* プレビュー */}
        <div className="rounded-2xl bg-white p-4 text-xl font-bold text-amber-900 shadow">
          {preview.questionText}
        </div>
        <button type="button" onClick={() => speakJa(preview.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
        <button type="button" onClick={handlePreview}
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32]">
          これで かんせい！
        </button>
        <button type="button" onClick={() => setStep('select')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  // preview step
  if (selectedTpl) {
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const filled = fillTemplate(selectedTpl, { a, b, emoji });
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-8">
        <div className="text-5xl">📝</div>
        <p className="text-xl font-bold text-green-800">もんだい できたよ！</p>
        <div className="rounded-2xl bg-white p-6 text-2xl font-bold text-amber-900 shadow-lg text-center">
          {filled.questionText}
        </div>
        <button type="button" onClick={() => speakJa(filled.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
        <p className="text-amber-700">ママ・パパに ちょうせんしよう！</p>
        <button type="button" onClick={handleConfirm}
          className="rounded-2xl bg-orange-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#e65100]">
          ちょうせん！
        </button>
        <button type="button" onClick={() => setStep('fill')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: ParentSolveScreen.tsx を実装する**

`src/screens/ParentSolveScreen.tsx`:
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnswerButtons } from '../components/AnswerButtons';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import type { TemplateFilled } from '../lib/problemTemplates';
import confetti from 'canvas-confetti';

interface Props {
  problem: TemplateFilled;
  characterName: string;
  onDone: () => void;
}

function makeChoices(answer: number): number[] {
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.max(0, answer + Math.floor(Math.random() * 6) - 3);
    if (c !== answer) choices.add(c);
  }
  return [...choices].sort(() => Math.random() - 0.5);
}

export function ParentSolveScreen({ problem, characterName, onDone }: Props) {
  const [choices] = useState(() => makeChoices(problem.answer));
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');

  function handlePick(value: number) {
    if (result !== 'none') return;
    playSfx('tap');
    if (value === problem.answer) {
      playSfx('correct');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      speakJa('せいかい！ すごい！');
      setResult('correct');
    } else {
      playSfx('wrong');
      speakJa('ざんねん！ こたえは…');
      setResult('wrong');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-orange-100 to-amber-50 p-8">
      <div className="text-3xl font-bold text-orange-800">
        {characterName} から ちょうせんじょう！ 📩
      </div>
      <div className="rounded-2xl bg-white p-6 text-2xl font-bold text-amber-900 shadow-lg text-center">
        {problem.questionText}
      </div>
      <button type="button" onClick={() => speakJa(problem.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
      {result === 'none' && <AnswerButtons choices={choices} onPick={handlePick} />}
      {result === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-center">
          <div className="text-5xl">⭕</div>
          <p className="text-2xl font-bold text-green-700">せいかい！ {problem.answer}！</p>
        </motion.div>
      )}
      {result === 'wrong' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="text-5xl">❌</div>
          <p className="text-2xl font-bold text-red-600">こたえは {problem.answer} だったよ！</p>
        </motion.div>
      )}
      {result !== 'none' && (
        <button type="button" onClick={onDone}
          className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0]">
          ホームに もどる
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProblemMakerScreen.tsx src/screens/ParentSolveScreen.tsx
git commit -m "feat: problem maker and parent-solve screens"
```

---

### Task 7: キャラクター定義とコレクション画面

**Files:**
- Create: `src/features/character/characterDefs.ts`
- Create: `src/features/character/CharacterCollection.tsx`

- [ ] **Step 1: characterDefs.ts を実装する**

`src/features/character/characterDefs.ts`:
```ts
export interface CharacterDef {
  id: string;
  name: string;         // デフォルト名
  emoji: string;        // メイン絵文字（シルエット → 解放後表示）
  unlockStamps: number; // 解放に必要なスタンプ数
  description: string;
}

export const CHARACTER_DEFS: CharacterDef[] = [
  { id: 'usagi', name: 'うさぎ', emoji: '🐰', unlockStamps: 0, description: 'さいしょから いっしょにいる なかま' },
  { id: 'hiyoko', name: 'ひよこ', emoji: '🐥', unlockStamps: 5, description: 'スタンプ5こで かわいい ひよこが なかまに！' },
  { id: 'kuma', name: 'くま', emoji: '🐻', unlockStamps: 10, description: 'スタンプ10こで おおきな くまが なかまに！' },
  { id: 'neko', name: 'ねこ', emoji: '🐱', unlockStamps: 20, description: 'スタンプ20こで のんびり ねこが なかまに！' },
  { id: 'panda', name: 'パンダ', emoji: '🐼', unlockStamps: 35, description: 'スタンプ35こで まるまる パンダが なかまに！' },
];

export function getUnlockedDefs(totalStamps: number): CharacterDef[] {
  return CHARACTER_DEFS.filter((c) => totalStamps >= c.unlockStamps);
}

export function getLockedDefs(totalStamps: number): CharacterDef[] {
  return CHARACTER_DEFS.filter((c) => totalStamps < c.unlockStamps);
}
```

- [ ] **Step 2: CharacterCollection.tsx を実装する**

`src/features/character/CharacterCollection.tsx`:
```tsx
import { motion } from 'framer-motion';
import { getUnlockedDefs, getLockedDefs, CHARACTER_DEFS } from './characterDefs';
import { playSfx } from '../sound/sfx';

interface Props {
  totalStamps: number;
  activeCharId: string;
  onSelect: (charId: string) => void;
  onClose: () => void;
}

export function CharacterCollection({ totalStamps, activeCharId, onSelect, onClose }: Props) {
  const unlocked = getUnlockedDefs(totalStamps);
  const locked = getLockedDefs(totalStamps);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-purple-100 to-amber-50 p-6">
      <h1 className="text-2xl font-bold text-purple-800">なかま ずかん</h1>
      <p className="text-amber-700">スタンプ: ⭐ {totalStamps}</p>

      {/* 解放済み */}
      <div className="flex flex-wrap justify-center gap-4">
        {unlocked.map((def) => (
          <motion.button
            key={def.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => { playSfx('tap'); onSelect(def.id); }}
            className={`rounded-2xl p-4 text-center shadow-md w-36 ${
              activeCharId === def.id
                ? 'bg-yellow-200 ring-2 ring-yellow-500 border-2 border-yellow-400'
                : 'bg-white border-2 border-purple-100'
            }`}
          >
            <div className="text-5xl">{def.emoji}</div>
            <div className="mt-1 font-bold text-purple-900">{def.name}</div>
            {activeCharId === def.id && <div className="text-xs text-yellow-700 font-bold">いま えらんでる</div>}
          </motion.button>
        ))}
      </div>

      {/* 未解放（シルエット） */}
      {locked.length > 0 && (
        <>
          <p className="text-sm text-gray-500 font-bold">まだ であっていない なかま…</p>
          <div className="flex flex-wrap justify-center gap-4">
            {locked.map((def) => (
              <div key={def.id} className="rounded-2xl bg-gray-100 p-4 text-center w-36 opacity-60">
                <div className="text-5xl grayscale">❓</div>
                <div className="mt-1 text-sm text-gray-500">スタンプ {def.unlockStamps}こ</div>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={onClose} className="rounded-2xl bg-purple-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#6a1b9a]">
        とじる
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/features/character/characterDefs.ts src/features/character/CharacterCollection.tsx
git commit -m "feat: character definitions and collection screen"
```

---

### Task 8: HomeScreen にモードボタン・ミッション表示を追加

**Files:**
- Modify: `src/screens/HomeScreen.tsx`（全置換）

- [ ] **Step 1: HomeScreen.tsx を全置換する**

`src/screens/HomeScreen.tsx`:
```tsx
import { motion } from 'framer-motion';
import { UNITS } from '../data/units';
import { hasMissionToday } from './MissionScreen';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
  onStartChallenge: () => void;
  onStartMission: () => void;
  onStartMaker: () => void;
  onOpenCollection: () => void;
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

export function HomeScreen({
  characterName,
  stampTotal,
  onSelectUnit,
  onStartChallenge,
  onStartMission,
  onStartMaker,
  onOpenCollection,
}: Props) {
  const missionDone = hasMissionToday();

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6 overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onOpenCollection} className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-amber-900">{characterName}</span>
        </button>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.9, 1.05, 1] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-full bg-yellow-200 px-4 py-1 font-bold text-amber-900 shadow-sm"
        >
          ⭐ スタンプ {stampTotal}
        </motion.div>
      </div>

      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-amber-900">
        さんすうあそび
      </motion.h1>

      {/* きょうのミッション */}
      <motion.button
        type="button"
        onClick={onStartMission}
        disabled={missionDone}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        className={`w-full max-w-sm rounded-2xl p-4 text-center shadow-lg font-bold transition-all ${
          missionDone
            ? 'bg-gray-200 text-gray-500 cursor-default'
            : 'bg-yellow-400 text-yellow-900 shadow-[0_4px_0_#f9a825]'
        }`}
      >
        <div className="text-2xl">🌟</div>
        <div className="text-lg">{missionDone ? 'きょうの ミッション クリア済み！' : 'きょうの ミッション をやろう！'}</div>
      </motion.button>

      {/* モードボタン */}
      <div className="flex gap-4 w-full max-w-sm">
        <motion.button
          type="button"
          onClick={onStartChallenge}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className="flex-1 rounded-2xl bg-purple-500 p-4 text-center text-white font-bold shadow-[0_4px_0_#6a1b9a]"
        >
          <div className="text-2xl">⚔️</div>
          <div>チャレンジ</div>
        </motion.button>
        <motion.button
          type="button"
          onClick={onStartMaker}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className="flex-1 rounded-2xl bg-green-500 p-4 text-center text-white font-bold shadow-[0_4px_0_#2e7d32]"
        >
          <div className="text-2xl">✏️</div>
          <div>もんだいづくり</div>
        </motion.button>
      </div>

      {/* 単元一覧 */}
      <p className="text-amber-700 font-bold">がくしゅう</p>
      <div className="flex flex-wrap justify-center gap-4">
        {UNITS.map((u, index) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-40 rounded-2xl border-2 border-blue-200 bg-white p-4 text-center shadow-md"
          >
            <div className="text-4xl">{UNIT_EMOJIS[u.id] ?? '📚'}</div>
            <div className="mt-1 text-base font-bold text-amber-900">{u.title}</div>
            <div className="mt-0.5 text-xs text-amber-500">{u.grade}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（App.tsx の型エラーは次のタスクで修正）

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: HomeScreen with mission, challenge, and maker mode buttons"
```

---

### Task 9: App.tsx に全モードのルーティングを追加

**Files:**
- Modify: `src/App.tsx`（全置換）

- [ ] **Step 1: App.tsx を全置換する**

`src/App.tsx`:
```tsx
import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MakeTenUnit } from './screens/MakeTenUnit';
import { AdditionUnit } from './screens/AdditionUnit';
import { SubtractionUnit } from './screens/SubtractionUnit';
import { CherryCalcUnit } from './screens/CherryCalcUnit';
import { BigAdditionUnit } from './screens/BigAdditionUnit';
import { BigSubtractionUnit } from './screens/BigSubtractionUnit';
import { MultiplicationUnit } from './screens/MultiplicationUnit';
import { DivisionUnit } from './screens/DivisionUnit';
import { ChallengeMode } from './screens/ChallengeMode';
import { MissionScreen } from './screens/MissionScreen';
import { ProblemMakerScreen } from './screens/ProblemMakerScreen';
import { ParentSolveScreen } from './screens/ParentSolveScreen';
import { CharacterCollection } from './features/character/CharacterCollection';
import { NamingScreen } from './features/character/NamingScreen';
import { loadCharacter, saveCharacterName } from './features/character/character';
import { loadJson } from './lib/storage';
import { EMPTY_STAMPS, type StampState } from './features/rewards/stamps';
import type { TemplateFilled } from './lib/problemTemplates';

type Screen =
  | { kind: 'home' }
  | { kind: 'unit'; unitId: string }
  | { kind: 'challenge' }
  | { kind: 'mission' }
  | { kind: 'maker' }
  | { kind: 'parentSolve'; problem: TemplateFilled }
  | { kind: 'collection' };

export default function App() {
  const [character, setCharacter] = useState(loadCharacter);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [refresh, setRefresh] = useState(0);

  const stamps = loadJson<StampState>('math-app:stamps', EMPTY_STAMPS);
  const stampTotal = stamps.total;

  if (!character.named) {
    return <NamingScreen onDone={(name) => setCharacter({ ...character, name, named: true })} />;
  }

  function handleExit() {
    setRefresh((r) => r + 1);
    setScreen({ kind: 'home' });
  }

  const commonProps = { characterName: character.name, onExit: handleExit };

  if (screen.kind === 'unit') {
    switch (screen.unitId) {
      case 'make-ten':        return <MakeTenUnit key={refresh} {...commonProps} />;
      case 'addition':        return <AdditionUnit key={refresh} {...commonProps} />;
      case 'subtraction':     return <SubtractionUnit key={refresh} {...commonProps} />;
      case 'cherry-calc':     return <CherryCalcUnit key={refresh} {...commonProps} />;
      case 'big-addition':    return <BigAdditionUnit key={refresh} {...commonProps} />;
      case 'big-subtraction': return <BigSubtractionUnit key={refresh} {...commonProps} />;
      case 'multiplication':  return <MultiplicationUnit key={refresh} {...commonProps} />;
      case 'division':        return <DivisionUnit key={refresh} {...commonProps} />;
      default:                return <MakeTenUnit key={refresh} {...commonProps} />;
    }
  }

  if (screen.kind === 'challenge') {
    return <ChallengeMode key={refresh} {...commonProps} />;
  }

  if (screen.kind === 'mission') {
    return <MissionScreen key={refresh} {...commonProps} />;
  }

  if (screen.kind === 'maker') {
    return (
      <ProblemMakerScreen
        key={refresh}
        characterName={character.name}
        onMake={(problem) => setScreen({ kind: 'parentSolve', problem })}
        onExit={handleExit}
      />
    );
  }

  if (screen.kind === 'parentSolve') {
    return (
      <ParentSolveScreen
        problem={screen.problem}
        characterName={character.name}
        onDone={handleExit}
      />
    );
  }

  if (screen.kind === 'collection') {
    return (
      <CharacterCollection
        totalStamps={stampTotal}
        activeCharId={character.id}
        onSelect={(charId) => {
          setCharacter((c) => ({ ...c, id: charId }));
          setScreen({ kind: 'home' });
        }}
        onClose={() => setScreen({ kind: 'home' })}
      />
    );
  }

  return (
    <HomeScreen
      key={refresh}
      characterName={character.name}
      stampTotal={stampTotal}
      onSelectUnit={(unitId) => setScreen({ kind: 'unit', unitId })}
      onStartChallenge={() => setScreen({ kind: 'challenge' })}
      onStartMission={() => setScreen({ kind: 'mission' })}
      onStartMaker={() => setScreen({ kind: 'maker' })}
      onOpenCollection={() => setScreen({ kind: 'collection' })}
    />
  );
}
```

- [ ] **Step 2: 型チェック + 全テスト確認**

Run: `npx tsc --noEmit && npm run test`
Expected: 型エラーなし、全テスト PASS

- [ ] **Step 3: 本番ビルド確認**

Run: `npm run build`
Expected: `dist/` 生成、エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route all modes (challenge, mission, maker, collection) from App.tsx"
```

---

### Task 10: スタンプ帳画面（StampBook.tsx）

**Files:**
- Create: `src/screens/StampBook.tsx`

- [ ] **Step 1: StampBook.tsx を実装する**

`src/screens/StampBook.tsx`:
```tsx
import { motion } from 'framer-motion';
import { loadJson } from '../lib/storage';
import { EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

interface Props {
  onClose: () => void;
}

export function StampBook({ onClose }: Props) {
  const stamps = loadJson<StampState>('math-app:stamps', EMPTY_STAMPS);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
      <h1 className="text-2xl font-bold text-amber-800">スタンプ帳</h1>
      <p className="text-4xl font-bold text-amber-900">⭐ × {stamps.total}</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {Array.from({ length: stamps.total }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: Math.min(i * 0.05, 1), type: 'spring' }}
            className="text-3xl"
          >
            ⭐
          </motion.div>
        ))}
        {stamps.total === 0 && <p className="text-amber-500">もんだいをとくと スタンプが もらえるよ！</p>}
      </div>
      <button type="button" onClick={onClose} className="rounded-2xl bg-amber-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#e65100]">
        とじる
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/screens/StampBook.tsx
git commit -m "feat: stamp book screen"
```

---

### Task 11: 最終動作確認 + ビルド検証

- [ ] **Step 1: 全テスト**

Run: `npm run test`
Expected: 全テスト PASS

- [ ] **Step 2: 本番ビルド**

Run: `npm run build`
Expected: エラーなし、`dist/` 生成

- [ ] **Step 3: 開発サーバで総合動作確認**

Run: `npm run dev`

確認項目:
1. ホーム画面に「きょうのミッション」「チャレンジ」「もんだいづくり」ボタンが表示される
2. きょうのミッション → 3問完走 → クリア → ホームで「クリア済み」になる
3. チャレンジ → 10問完走 → クリア
4. もんだいづくり → テンプレ選択 → 数設定 → 「ちょうせん！」 → 親が解く画面
5. 🐰 をタップ → キャラコレクション（図鑑）が開く
6. 各がくしゅうモード（全8単元）が正常動作する
7. コンソールにエラーが出ていない

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: phase 3-5 complete - challenge, mission, maker, collection"
```

---

## 完了の定義（フェーズ3〜5）

- `npm run test` が全 PASS
- `npm run build` が成功
- 全モード（がくしゅう8単元・チャレンジ・ミッション・もんだいづくり・キャラコレクション）が動作する
- 間隔反復でチャレンジの出題スキルが変化する
- もんだいづくりで作った問題が localStorage に保存され、親が解ける
- スタンプ蓄積でキャラクターが解放される
