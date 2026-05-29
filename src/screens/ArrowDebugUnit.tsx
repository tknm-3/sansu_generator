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
  isCleared,
  isPerfect,
  DIR_ARROW,
  type Command,
  type Dir,
  type RunResult,
} from '../lib/programming/engine';
import { DEBUG_LEVELS, pickLevels } from '../lib/programming/levels';
import {
  addClear,
  didUnlockNext,
  DIFFICULTY_LABEL,
  DIFFICULTY_EMOJI,
  type Difficulty,
} from '../lib/programming/progress';

const UNIT_ID = 'arrow-debug';
const QUESTIONS = 3;
const ARROWS: Dir[] = ['up', 'left', 'down', 'right'];

interface Props {
  characterName: string;
  characterId: string;
  difficulty: Difficulty;
  onExit: () => void;
  onAgain: () => void;
}

const toCommands = (dirs: Dir[]): Command[] => dirs.map((dir) => ({ kind: 'move', dir }));

export function ArrowDebugUnit({ characterId, difficulty, onExit, onAgain }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const [levels] = useState(() => pickLevels(DEBUG_LEVELS[difficulty], QUESTIONS));
  const [idx, setIdx] = useState(0);
  const [commands, setCommands] = useState<Command[]>(() => toCommands(levels[0].buggy ?? []));
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [unlockedNext, setUnlockedNext] = useState(false);
  const [locked, setLocked] = useState(false);

  const level = levels[idx];

  useEffect(() => { setBgmTrack('arrow-sequence'); }, []);

  // 問題が かわったら そのレベルの buggy を よみこむ
  useEffect(() => {
    setCommands(toCommands(level.buggy ?? []));
    setSelected(null);
    setAttempts(0);
    setHint(null);
  }, [level]);

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const perfect = isPerfect(level, result);
      if (perfect) setPerfectCount((p) => p + 1);
      speakJa('なおせた！ ' + buildPraise(perfect));
      setHint(null);
      window.setTimeout(() => {
        if (idx + 1 >= QUESTIONS) {
          const after = addClear(UNIT_ID, difficulty);
          setUnlockedNext(didUnlockNext(difficulty, after));
          playSfx('fanfare');
          setCleared(true);
        } else {
          setIdx((i) => i + 1);
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

  function setDir(dir: Dir) {
    if (selected == null || runner.playing || locked) return;
    playSfx('tap');
    setCommands((c) => c.map((cmd, i) => (i === selected ? { kind: 'move', dir } : cmd)));
    setSelected(null);
    setHint(null);
  }

  function handleStart() {
    if (runner.playing || locked) return;
    playSfx('tap');
    setHint(null);
    runner.play(commands);
  }
  function handleStep() {
    if (runner.playing || locked) return;
    playSfx('tap');
    runner.step(commands);
  }
  function handleReset() {
    if (locked) return;
    playSfx('tap');
    runner.reset();
    setHint(null);
  }
  function resetToBuggy() {
    if (runner.playing || locked) return;
    playSfx('tap');
    setCommands(toCommands(level.buggy ?? []));
    setSelected(null);
    setHint(null);
    runner.reset();
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
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-rose-100 to-amber-50 p-5">
      <div className="flex w-full max-w-sm items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-rose-700">
          ← やめる
        </button>
        <span className="text-sm font-bold text-rose-700">といた かず: {idx} / {QUESTIONS}</span>
        <span className="rounded-full bg-rose-400 px-3 py-1 text-xs font-bold text-white">
          {DIFFICULTY_EMOJI[difficulty]} {DIFFICULTY_LABEL[difficulty]}
        </span>
      </div>

      <motion.h2 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-lg font-bold text-rose-900">
        やじるしを なおして {charEmoji} を {level.goalEmoji ?? '🐟'} まで！
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

      {/* なおす やじるし（タップで えらんで むきを かえる） */}
      <div className="flex min-h-[52px] w-full max-w-sm flex-wrap items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-rose-300 bg-white/60 p-2">
        {commands.map((cmd, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { if (!runner.playing && !locked) { playSfx('tap'); setSelected(i === selected ? null : i); } }}
            className={`rounded-lg px-2 py-1 text-lg font-bold text-white shadow-[0_2px_0_#9f1239] transition-all ${
              selected === i ? 'bg-rose-600 ring-4 ring-rose-300 scale-110' : 'bg-rose-400'
            }`}
          >
            {cmd.kind === 'move' ? DIR_ARROW[cmd.dir] : '🔁'}
          </button>
        ))}
      </div>
      <p className="text-xs text-amber-500">
        {selected == null ? 'なおしたい やじるしを タップしてね' : 'どの むきに する？ ↓からえらんでね'}
      </p>

      {/* むき えらび */}
      <div className="grid grid-cols-4 gap-2">
        {ARROWS.map((dir) => (
          <motion.button
            key={dir}
            type="button"
            onClick={() => setDir(dir)}
            whileTap={{ scale: 0.9 }}
            disabled={selected == null || runner.playing || locked}
            className="h-14 w-14 rounded-2xl bg-rose-400 text-2xl font-bold text-white shadow-[0_4px_0_#9f1239] disabled:opacity-30"
          >
            {DIR_ARROW[dir]}
          </motion.button>
        ))}
      </div>

      <div className="flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={runner.playing || locked}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40"
        >
          ▶ スタート
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={runner.playing || locked}
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
      <button type="button" onClick={resetToBuggy} className="text-xs text-rose-500 underline">
        さいしょの やじるしに もどす
      </button>

      {hint && <HintBanner charEmoji={charEmoji} message={hint} />}
    </div>
  );
}
