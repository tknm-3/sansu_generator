import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { ProgrammingGrid } from '../components/programming/ProgrammingGrid';
import { useProgramRunner } from '../components/programming/useProgramRunner';
import { HintBanner } from '../components/programming/HintBanner';
import { ProgClearedScreen } from '../components/programming/ProgClearedScreen';
import { DIR_ARROW, type Dir, type RunResult } from '../lib/programming/engine';
import {
  runBranch,
  buildBranchHint,
  countNodes,
  type BranchCommand,
} from '../lib/programming/branch';
import { BRANCH_LEVELS, type BranchDifficulty } from '../lib/programming/branchLevels';
import { pickLevels } from '../lib/programming/levels';
import {
  addClear,
  didUnlockNext,
  DIFFICULTY_LABEL,
  DIFFICULTY_EMOJI,
  type Difficulty,
} from '../lib/programming/progress';

const UNIT_ID = 'arrow-branch';
const QUESTIONS = 3;
const ARROWS: Dir[] = ['up', 'left', 'down', 'right'];

interface Props {
  characterName: string;
  characterId: string;
  difficulty: Difficulty;
  onExit: () => void;
  onAgain: () => void;
}

/** 単元の あそびかた（難易度で じゆうどが あがる） */
type Mode = 'fill' | 'guided' | 'free';
function modeOf(difficulty: Difficulty): Mode {
  if (difficulty === 'easy') return 'fill';
  if (difficulty === 'normal') return 'guided';
  return 'free';
}
function branchDiffOf(difficulty: Difficulty): BranchDifficulty {
  if (difficulty === 'easy') return 'easy';
  if (difficulty === 'normal') return 'normal';
  return 'hard';
}

/** if カードを よみやすい もじに する（もし →🧱 なら ↓ / ちがえば →） */
function ruleLabel(cmd: Extract<BranchCommand, { kind: 'if' }>): string {
  const sensor = DIR_ARROW[cmd.cond.dir];
  const then = cmd.then[0]?.kind === 'move' ? DIR_ARROW[cmd.then[0].dir] : '?';
  const els = cmd.else[0]?.kind === 'move' ? DIR_ARROW[cmd.else[0].dir] : '?';
  return `もし${sensor}🧱 ${then}／${els}`;
}

export function ArrowBranchUnit({ characterId, difficulty, onExit, onAgain }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const mode = modeOf(difficulty);
  const branchDiff = branchDiffOf(difficulty);
  const [levels] = useState(() => pickLevels(BRANCH_LEVELS[branchDiff], QUESTIONS));
  const [idx, setIdx] = useState(0);

  // くみたてモード（guided / free）の 状態
  const [items, setItems] = useState<BranchCommand[]>([]);
  const [loopOn, setLoopOn] = useState(mode !== 'free'); // free は トグルで 切替、それ以外は つねにオン
  const [loopTimes, setLoopTimes] = useState(4);

  // ルールカードの 下書き（センサーむき・かべのとき・そうでないとき）
  const [sensor, setSensor] = useState<Dir>('right');
  const [thenDir, setThenDir] = useState<Dir>('down');
  const [elseDir, setElseDir] = useState<Dir>('right');

  // 穴埋めモード（fill）の 状態。null は まだ うめていない あな
  const [fillSensor, setFillSensor] = useState<Dir | null>(null);
  const [fillThen, setFillThen] = useState<Dir | null>(null);
  const [fillElse, setFillElse] = useState<Dir | null>(null);

  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [unlockedNext, setUnlockedNext] = useState(false);
  const [locked, setLocked] = useState(false);

  const level = levels[idx];

  useEffect(() => { setBgmTrack('arrow-sequence'); }, []);

  // ── くみたてた プログラム ──
  const fillReady = fillSensor != null && fillThen != null && fillElse != null;
  const program: BranchCommand[] = (() => {
    if (mode === 'fill') {
      if (!fillReady) return [];
      const rule: BranchCommand = {
        kind: 'if',
        cond: { kind: 'wall', dir: fillSensor },
        then: [{ kind: 'move', dir: fillThen }],
        else: [{ kind: 'move', dir: fillElse }],
      };
      return [{ kind: 'repeat', times: level.fill?.loopTimes ?? 4, body: [rule] }];
    }
    return loopOn ? [{ kind: 'repeat', times: loopTimes, body: items }] : items;
  })();
  const blockCount = countNodes(program);
  const maxBlocks = level.maxSlots ?? 8;
  const hasProgram = mode === 'fill' ? fillReady : items.length > 0;

  function resetBuild() {
    setItems([]);
    setLoopOn(mode !== 'free');
    setLoopTimes(4);
    setFillSensor(null);
    setFillThen(null);
    setFillElse(null);
  }

  function handleFinish(result: RunResult) {
    if (result.reachedGoal && result.collectedAll) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const perfect = blockCount <= level.optimal;
      if (perfect) setPerfectCount((p) => p + 1);
      speakJa(mode === 'fill' ? 'やったね！ あなを うめて ゴールできたね！' : 'クリア！ ロボットが じぶんで みちを えらべたね！');
      setHint(null);
      window.setTimeout(() => {
        if (idx + 1 >= QUESTIONS) {
          const after = addClear(UNIT_ID, difficulty);
          setUnlockedNext(didUnlockNext(difficulty, after));
          playSfx('fanfare');
          setCleared(true);
        } else {
          setIdx((i) => i + 1);
          resetBuild();
          setAttempts(0);
          setLocked(false);
        }
      }, 1300);
    } else {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      const h = buildBranchHint(level, result, nextAttempt);
      setHint(h);
      speakJa(h);
    }
  }

  const runner = useProgramRunner<BranchCommand>(level, handleFinish, runBranch);

  const canEdit = !runner.playing && !locked;

  function addRule() {
    if (!canEdit || blockCount + 3 > maxBlocks) return;
    playSfx('tap');
    setItems((c) => [
      ...c,
      {
        kind: 'if',
        cond: { kind: 'wall', dir: sensor },
        then: [{ kind: 'move', dir: thenDir }],
        else: [{ kind: 'move', dir: elseDir }],
      },
    ]);
    setHint(null);
  }

  function addMove(dir: Dir) {
    if (!canEdit || blockCount + 1 > maxBlocks) return;
    playSfx('tap');
    setItems((c) => [...c, { kind: 'move', dir }]);
    setHint(null);
  }

  function removeAt(i: number) {
    if (!canEdit) return;
    playSfx('tap');
    setItems((c) => c.filter((_, j) => j !== i));
    setHint(null);
  }

  function handleStart() {
    if (!canEdit || !hasProgram) return;
    playSfx('tap');
    setHint(null);
    runner.play(program);
  }
  function handleStep() {
    if (!canEdit || !hasProgram) return;
    playSfx('tap');
    runner.step(program);
  }
  function handleReset() {
    if (locked) return;
    playSfx('tap');
    runner.reset();
    setHint(null);
  }

  function showMoreHint() {
    const msg =
      mode === 'fill'
        ? '「もし みぎ🧱 なら ↓、ちがえば →」に なるように あなを うめてみよう！'
        : 'まずは「もし みぎ🧱 なら ↓、ちがえば →」の ルールを 1つ つくって、🔁で くりかえしてみよう！';
    setHint(msg);
    speakJa(msg);
  }

  if (cleared) {
    // むずかしいの つぎは ないので、ここで とまる
    const NEXT_DIFF: Partial<Record<Difficulty, Difficulty>> = { easy: 'normal', normal: 'hard' };
    const next: Difficulty | undefined = NEXT_DIFF[difficulty];
    return (
      <ProgClearedScreen
        difficulty={difficulty}
        perfectCount={perfectCount}
        unlockedNext={unlockedNext}
        nextDifficulty={next}
        onExit={onExit}
        onAgain={onAgain}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-3 bg-gradient-to-b from-violet-100 to-amber-50 p-5">
      <div className="flex w-full max-w-sm items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-violet-700">
          ← やめる
        </button>
        <span className="text-sm font-bold text-violet-700">といた かず: {idx} / {QUESTIONS}</span>
        <span className="rounded-full bg-violet-400 px-3 py-1 text-xs font-bold text-white">
          {DIFFICULTY_EMOJI[difficulty]} {DIFFICULTY_LABEL[difficulty]}
        </span>
      </div>

      <motion.h2 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-lg font-bold text-violet-900">
        {charEmoji} を {level.goalEmoji ?? '🐟'} まで みちびこう！
      </motion.h2>
      {level.prompt && <p className="text-center text-sm font-bold text-amber-600">{level.prompt}</p>}

      <ProgrammingGrid
        level={level}
        charEmoji={charEmoji}
        charPos={runner.charPos}
        trail={runner.trail}
        collected={runner.collected}
        blockedCell={runner.blockedCell}
      />

      {mode === 'fill' ? (
        /* ── かんたん：もし文の むきだけ うめる ── */
        <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-violet-300 bg-white/70 p-3">
          <p className="mb-2 text-center text-xs font-bold text-violet-500">
            🔁 {level.fill?.loopTimes ?? 4}かい くりかえす：あなを タップして うめよう
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-bold text-violet-800">
            <span>もし</span>
            <BlankDirPicker value={fillSensor} onChange={(d) => { setFillSensor(d); setHint(null); }} disabled={!canEdit} />
            <span>が 🧱 なら</span>
            <BlankDirPicker value={fillThen} onChange={(d) => { setFillThen(d); setHint(null); }} disabled={!canEdit} />
            <span>、ちがえば</span>
            <BlankDirPicker value={fillElse} onChange={(d) => { setFillElse(d); setHint(null); }} disabled={!canEdit} />
          </div>
          <p className="mt-2 text-center text-[11px] text-violet-400">むきは タップで かわるよ（↑→↓←）</p>
        </div>
      ) : (
        <>
          {/* くみたてた プログラム（ループ箱の なか） */}
          <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-violet-300 bg-white/60 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-violet-500">
                {loopOn ? `🔁 ${loopTimes}かい くりかえす：` : 'プログラム：'}
              </span>
              <span className="text-xs text-violet-400">のこり {Math.max(0, maxBlocks - blockCount)}</span>
            </div>
            <div className="flex min-h-[40px] flex-wrap items-center gap-1">
              {items.length === 0 ? (
                <span className="px-2 text-sm text-violet-300">
                  {mode === 'free' ? 'ルールや やじるしを ならべよう' : 'ルールを ならべよう'}
                </span>
              ) : (
                items.map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded-lg bg-violet-500 px-2 py-1 text-sm font-bold text-white shadow-[0_2px_0_#6d28d9]"
                  >
                    {cmd.kind === 'move' ? DIR_ARROW[cmd.dir] : cmd.kind === 'if' ? ruleLabel(cmd) : '🔁'}
                  </button>
                ))
              )}
            </div>
          </div>
          <p className="text-xs text-amber-500">ブロックを タップすると けせるよ</p>

          {/* くりかえし箱の せってい（guided は つねにオン・トグルなし／free は 切替可能） */}
          <div className="flex w-full max-w-sm items-center justify-between gap-2 rounded-2xl bg-violet-100 px-3 py-2">
            {mode === 'free' ? (
              <button
                type="button"
                onClick={() => { if (canEdit) { playSfx('tap'); setLoopOn((v) => !v); } }}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${loopOn ? 'bg-violet-500 text-white' : 'bg-white text-violet-600'}`}
              >
                🔁 くりかえし {loopOn ? 'オン' : 'オフ'}
              </button>
            ) : (
              <span className="text-sm font-bold text-violet-700">🔁 くりかえし</span>
            )}
            {loopOn && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => { if (canEdit) setLoopTimes((t) => Math.max(2, t - 1)); }} className="h-8 w-8 rounded-lg bg-white text-lg font-bold text-violet-600">－</button>
                <span className="w-7 text-center text-lg font-bold text-violet-800">{loopTimes}</span>
                <button type="button" onClick={() => { if (canEdit) setLoopTimes((t) => Math.min(12, t + 1)); }} className="h-8 w-8 rounded-lg bg-white text-lg font-bold text-violet-600">＋</button>
                <span className="ml-1 text-xs font-bold text-violet-500">かい</span>
              </div>
            )}
          </div>

          {/* ルールカード エディタ */}
          <div className="flex w-full max-w-sm flex-col gap-2 rounded-2xl bg-white/80 p-3 shadow-sm">
            <p className="text-center text-xs font-bold text-violet-700">🔀 ルールを つくる</p>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-bold text-violet-800">
              <span>もし</span>
              <DirPicker value={sensor} onChange={setSensor} disabled={!canEdit} />
              <span>が 🧱 なら</span>
              <DirPicker value={thenDir} onChange={setThenDir} disabled={!canEdit} />
              <span>、ちがえば</span>
              <DirPicker value={elseDir} onChange={setElseDir} disabled={!canEdit} />
            </div>
            <button
              type="button"
              onClick={addRule}
              disabled={!canEdit || blockCount + 3 > maxBlocks}
              className="mx-auto rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#6d28d9] disabled:opacity-40"
            >
              ＋ ルールを ついか
            </button>
          </div>

          {/* やじるし（free のみ） */}
          {mode === 'free' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-500">やじるし：</span>
              {ARROWS.map((dir) => (
                <motion.button
                  key={dir}
                  type="button"
                  onClick={() => addMove(dir)}
                  whileTap={{ scale: 0.9 }}
                  disabled={!canEdit || blockCount + 1 > maxBlocks}
                  className="h-10 w-10 rounded-xl bg-violet-300 text-xl font-bold text-white shadow-[0_3px_0_#7c3aed] disabled:opacity-40"
                >
                  {DIR_ARROW[dir]}
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}

      {/* そうさボタン */}
      <div className="flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canEdit || !hasProgram}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40"
        >
          ▶ スタート
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={!canEdit || !hasProgram}
          className="rounded-2xl bg-sky-400 px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#0369a1] active:translate-y-1 disabled:opacity-40"
        >
          👣 1コマ
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={locked}
          className="rounded-2xl bg-amber-400 px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1 disabled:opacity-40"
        >
          ↺
        </button>
      </div>

      {hint && (
        <HintBanner
          charEmoji={charEmoji}
          message={hint}
          onMoreHint={showMoreHint}
          moreHintLabel="ルールの ヒント"
        />
      )}
    </div>
  );
}

function DirPicker({ value, onChange, disabled }: { value: Dir; onChange: (d: Dir) => void; disabled: boolean }) {
  const order: Dir[] = ['up', 'right', 'down', 'left'];
  function cycle() {
    if (disabled) return;
    playSfx('tap');
    const i = order.indexOf(value);
    onChange(order[(i + 1) % order.length]);
  }
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      className="h-9 w-9 rounded-lg bg-violet-200 text-xl font-bold text-violet-800 shadow-[0_2px_0_#a78bfa] disabled:opacity-40"
    >
      {DIR_ARROW[value]}
    </button>
  );
}

/** 穴埋め用の むきピッカー。まだ うめていないときは ？ を 出す */
function BlankDirPicker({ value, onChange, disabled }: { value: Dir | null; onChange: (d: Dir) => void; disabled: boolean }) {
  const order: Dir[] = ['up', 'right', 'down', 'left'];
  function cycle() {
    if (disabled) return;
    playSfx('tap');
    if (value == null) onChange('up');
    else onChange(order[(order.indexOf(value) + 1) % order.length]);
  }
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      className={`h-10 w-10 rounded-lg text-2xl font-bold shadow-[0_2px_0_#a78bfa] disabled:opacity-40 ${
        value == null ? 'bg-amber-200 text-amber-700' : 'bg-violet-200 text-violet-800'
      }`}
    >
      {value == null ? '？' : DIR_ARROW[value]}
    </button>
  );
}
