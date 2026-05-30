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
import {
  buildHint,
  buildPraise,
  flatten,
  isCleared,
  isPerfect,
  solve,
  DIR_ARROW,
  DIR_LABEL,
  type Command,
  type Dir,
  type RunResult,
} from '../lib/programming/engine';
import { SEQUENCE_LEVELS, pickLevels } from '../lib/programming/levels';
import {
  addClear,
  didUnlockNext,
  DIFFICULTY_LABEL,
  DIFFICULTY_EMOJI,
  type Difficulty,
} from '../lib/programming/progress';

const UNIT_ID = 'arrow-sequence';
const QUESTIONS = 3;
const ARROWS: Dir[] = ['up', 'left', 'down', 'right'];

interface Props {
  characterName: string;
  characterId: string;
  difficulty: Difficulty;
  onExit: () => void;
  onAgain: () => void;
}

export function ArrowSequenceUnit({ characterId, difficulty, onExit, onAgain }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const [levels] = useState(() => pickLevels(SEQUENCE_LEVELS[difficulty], QUESTIONS));
  const [idx, setIdx] = useState(0);
  const [commands, setCommands] = useState<Command[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [unlockedNext, setUnlockedNext] = useState(false);
  const [locked, setLocked] = useState(false); // 成功演出ちゅうは そうさ ロック

  const level = levels[idx];

  useEffect(() => { setBgmTrack('arrow-sequence'); }, []);

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const perfect = isPerfect(level, result);
      if (perfect) setPerfectCount((p) => p + 1);
      speakJa(buildPraise(perfect));
      setHint(null);
      window.setTimeout(() => {
        if (idx + 1 >= QUESTIONS) {
          const after = addClear(UNIT_ID, difficulty);
          setUnlockedNext(didUnlockNext(difficulty, after));
          playSfx('fanfare');
          setCleared(true);
        } else {
          setIdx((i) => i + 1);
          setCommands([]);
          setAttempts(0);
          setLocked(false);
        }
      }, 1300);
    } else {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      const h = buildHint(level, result, nextAttempt);
      setHint(h);
      speakJa(h);
    }
  }

  const runner = useProgramRunner(level, handleFinish);

  const flatLen = flatten(commands).length;
  const maxSlots = level.maxSlots ?? 12;
  const canAdd = flatLen < maxSlots && !runner.playing && !locked;

  function addMove(dir: Dir) {
    if (!canAdd) return;
    playSfx('tap');
    setCommands((c) => [...c, { kind: 'move', dir }]);
    setHint(null);
  }

  function removeAt(i: number) {
    if (runner.playing || locked) return;
    playSfx('tap');
    setCommands((c) => c.filter((_, j) => j !== i));
  }

  function handleStart() {
    if (runner.playing || locked || commands.length === 0) return;
    playSfx('tap');
    setHint(null);
    runner.play(commands);
  }

  function handleStep() {
    if (runner.playing || locked || commands.length === 0) return;
    playSfx('tap');
    runner.step(commands);
  }

  function handleReset() {
    if (locked) return;
    playSfx('tap');
    runner.reset();
    setHint(null);
  }

  function handleClearAll() {
    if (runner.playing || locked) return;
    playSfx('tap');
    setCommands([]);
    runner.reset();
    setHint(null);
  }

  function showMoreHint() {
    const sol = solve(level);
    if (sol && sol.length > 0) {
      const msg = `さいしょは 「${DIR_LABEL[sol[0]]}」から はじめると いいかも！`;
      setHint(msg);
      speakJa(msg);
    }
  }

  if (cleared) {
    const next: Difficulty | undefined = difficulty === 'easy' ? 'normal' : difficulty === 'normal' ? 'hard' : undefined;
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
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-orange-100 to-amber-50 p-5">
      <div className="flex w-full max-w-sm items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-orange-700">
          ← やめる
        </button>
        <span className="text-sm font-bold text-orange-700">といた かず: {idx} / {QUESTIONS}</span>
        <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-bold text-white">
          {DIFFICULTY_EMOJI[difficulty]} {DIFFICULTY_LABEL[difficulty]}
        </span>
      </div>

      <motion.h2 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-lg font-bold text-orange-900">
        {charEmoji} を {level.goalEmoji ?? '🐟'} まで はこぼう！
      </motion.h2>
      {level.prompt && <p className="text-sm font-bold text-amber-600">{level.prompt}</p>}

      <ProgrammingGrid
        level={level}
        charEmoji={charEmoji}
        charPos={runner.charPos}
        trail={runner.trail}
        collected={runner.collected}
        blockedCell={runner.blockedCell}
      />

      {/* くみたてた やじるし */}
      <div className="flex min-h-[52px] w-full max-w-sm flex-wrap items-center gap-1 rounded-2xl border-2 border-dashed border-orange-300 bg-white/60 p-2">
        {commands.length === 0 ? (
          <span className="px-2 text-sm text-orange-300">ここに やじるしが ならぶよ</span>
        ) : (
          commands.map((cmd, i) => (
            <button
              key={i}
              type="button"
              onClick={() => removeAt(i)}
              className="rounded-lg bg-orange-400 px-2 py-1 text-lg font-bold text-white shadow-[0_2px_0_#c2410c]"
            >
              {cmd.kind === 'move' ? DIR_ARROW[cmd.dir] : `🔁${DIR_ARROW[cmd.body[0]]}×${cmd.times}`}
            </button>
          ))
        )}
      </div>
      <p className="text-xs text-amber-500">やじるしを タップすると けせるよ（のこり {maxSlots - flatLen}）</p>

      {/* やじるしパレット */}
      <div className="grid grid-cols-4 gap-2">
        {ARROWS.map((dir) => (
          <motion.button
            key={dir}
            type="button"
            onClick={() => addMove(dir)}
            whileTap={{ scale: 0.9 }}
            disabled={!canAdd}
            className="h-14 w-14 rounded-2xl bg-orange-400 text-2xl font-bold text-white shadow-[0_4px_0_#c2410c] disabled:opacity-40"
          >
            {DIR_ARROW[dir]}
          </motion.button>
        ))}
      </div>

      {level.allowLoop && <LoopBuilder disabled={!canAdd} onAdd={(cmd) => { if (canAdd) { playSfx('tap'); setCommands((c) => [...c, cmd]); setHint(null); } }} />}

      {/* そうさボタン */}
      <div className="flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={runner.playing || locked || commands.length === 0}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40"
        >
          ▶ スタート
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={runner.playing || locked || commands.length === 0}
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
        <button
          type="button"
          onClick={handleClearAll}
          disabled={runner.playing || locked || commands.length === 0}
          className="rounded-2xl bg-rose-300 px-3 py-3 text-base font-bold text-white shadow-[0_4px_0_#9f1239] active:translate-y-1 disabled:opacity-40"
          title="やじるしを ぜんぶ けす"
        >
          🗑️
        </button>
      </div>

      {hint && (
        <HintBanner
          charEmoji={charEmoji}
          message={hint}
          onMoreHint={showMoreHint}
          moreHintLabel="さいしょの 1マス"
        />
      )}
    </div>
  );
}

function LoopBuilder({ onAdd, disabled }: { onAdd: (cmd: Command) => void; disabled: boolean }) {
  const [dir, setDir] = useState<Dir>('right');
  const [times, setTimes] = useState(2);
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl bg-purple-100 p-2">
      <p className="text-xs font-bold text-purple-700">🔁 ループ箱（おなじ むきを まとめる）</p>
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-4 gap-1">
          {ARROWS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDir(d)}
              className={`h-9 w-9 rounded-lg text-lg font-bold ${dir === d ? 'bg-purple-500 text-white' : 'bg-white text-purple-600'}`}
            >
              {DIR_ARROW[d]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setTimes((t) => Math.max(2, t - 1))} className="h-8 w-8 rounded-lg bg-white text-lg font-bold text-purple-600">－</button>
          <span className="w-6 text-center text-lg font-bold text-purple-800">{times}</span>
          <button type="button" onClick={() => setTimes((t) => Math.min(5, t + 1))} className="h-8 w-8 rounded-lg bg-white text-lg font-bold text-purple-600">＋</button>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAdd({ kind: 'repeat', times, body: [dir] })}
          className="rounded-xl bg-purple-500 px-3 py-2 text-sm font-bold text-white shadow-[0_3px_0_#6b21a8] disabled:opacity-40"
        >
          ＋ついか
        </button>
      </div>
    </div>
  );
}
