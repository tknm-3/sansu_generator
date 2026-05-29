import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { ProgrammingGrid } from '../components/programming/ProgrammingGrid';
import { useProgramRunner } from '../components/programming/useProgramRunner';
import { HintBanner } from '../components/programming/HintBanner';
import {
  buildHint,
  flatten,
  isCleared,
  samePos,
  solve,
  DIR_ARROW,
  type Command,
  type Dir,
  type Level,
  type Pos,
  type RunResult,
} from '../lib/programming/engine';
import { MAKER_SIZES } from '../lib/programming/levels';

const ARROWS: Dir[] = ['up', 'left', 'down', 'right'];
type Tool = 'wall' | 'start' | 'goal' | 'erase';

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'wall', label: 'かべ', icon: '🧱' },
  { id: 'start', label: 'スタート', icon: '🏁' },
  { id: 'goal', label: 'ゴール', icon: '🐟' },
  { id: 'erase', label: 'けす', icon: '🧽' },
];

export function ArrowMakerUnit({ characterId, onExit }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const [size, setSize] = useState(4);
  const [phase, setPhase] = useState<'build' | 'play'>('build');
  const [tool, setTool] = useState<Tool>('wall');
  const [start, setStart] = useState<Pos>({ r: 0, c: 0 });
  const [goal, setGoal] = useState<Pos>({ r: 3, c: 3 });
  const [walls, setWalls] = useState<Pos[]>([]);
  const [buildMsg, setBuildMsg] = useState<string | null>(null);

  // あそぶ用
  const [commands, setCommands] = useState<Command[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => { setBgmTrack('arrow-sequence'); }, []);

  function chooseSize(s: number) {
    playSfx('tap');
    setSize(s);
    setStart({ r: 0, c: 0 });
    setGoal({ r: s - 1, c: s - 1 });
    setWalls([]);
    setBuildMsg(null);
  }

  const level: Level = useMemo(
    () => ({ id: 'maker', rows: size, cols: size, start, goal, walls, optimal: 0, maxSlots: size * size, goalEmoji: '🐟' }),
    [size, start, goal, walls],
  );

  function handleCellClick(pos: Pos) {
    if (phase !== 'build') return;
    playSfx('tap');
    setBuildMsg(null);
    if (tool === 'start') {
      if (samePos(pos, goal)) return;
      setStart(pos);
      setWalls((w) => w.filter((x) => !samePos(x, pos)));
    } else if (tool === 'goal') {
      if (samePos(pos, start)) return;
      setGoal(pos);
      setWalls((w) => w.filter((x) => !samePos(x, pos)));
    } else if (tool === 'wall') {
      if (samePos(pos, start) || samePos(pos, goal)) return;
      setWalls((w) => (w.some((x) => samePos(x, pos)) ? w : [...w, pos]));
    } else {
      setWalls((w) => w.filter((x) => !samePos(x, pos)));
    }
  }

  function startPlay() {
    const sol = solve(level);
    if (!sol) {
      const msg = 'この めいろは ゴールに いけないみたい。かべを へらしてみよう！';
      setBuildMsg(msg);
      speakJa(msg);
      return;
    }
    playSfx('levelup');
    setCommands([]);
    setAttempts(0);
    setHint(null);
    setWon(false);
    setLocked(false);
    setPhase('play');
  }

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speakJa('やった！ じぶんの めいろを クリアしたね！');
      setHint(null);
      setWon(true);
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
  const maxSlots = level.maxSlots ?? 25;
  const canAdd = flatLen < maxSlots && !runner.playing && !locked;

  function addMove(dir: Dir) {
    if (!canAdd) return;
    playSfx('tap');
    setCommands((c) => [...c, { kind: 'move', dir }]);
    setHint(null);
  }

  // ───── つくる がめん ─────
  if (phase === 'build') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-teal-100 to-amber-50 p-5">
        <div className="flex w-full max-w-sm items-center justify-between">
          <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-teal-700">
            ← やめる
          </button>
          <span className="text-sm font-bold text-teal-700">じぶんで めいろを つくろう</span>
        </div>

        <div className="flex gap-2">
          {MAKER_SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => chooseSize(s.size)}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${size === s.size ? 'bg-teal-500 text-white' : 'bg-white text-teal-600'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <ProgrammingGrid level={level} charEmoji={charEmoji} charPos={start} onCellClick={handleCellClick} />

        <div className="grid grid-cols-4 gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { playSfx('tap'); setTool(t.id); }}
              className={`flex flex-col items-center rounded-2xl px-3 py-2 text-xs font-bold ${tool === t.id ? 'bg-teal-500 text-white' : 'bg-white text-teal-600'}`}
            >
              <span className="text-2xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-amber-500">マスを タップして めいろを つくってね</p>

        {buildMsg && <HintBanner charEmoji={charEmoji} message={buildMsg} />}

        <button
          type="button"
          onClick={startPlay}
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_5px_0_#15803d] active:translate-y-1"
        >
          ▶ あそぶ
        </button>
      </div>
    );
  }

  // ───── あそぶ がめん ─────
  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-teal-100 to-amber-50 p-5">
      <div className="flex w-full max-w-sm items-center justify-between">
        <button type="button" onClick={() => { playSfx('tap'); setPhase('build'); runner.reset(); }} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-teal-700">
          ← つくりなおす
        </button>
        <span className="text-sm font-bold text-teal-700">じぶんの めいろ</span>
      </div>

      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-lg font-bold text-teal-900">
        {charEmoji} を {level.goalEmoji} まで はこぼう！
      </motion.h2>

      <ProgrammingGrid
        level={level}
        charEmoji={charEmoji}
        charPos={runner.charPos}
        trail={runner.trail}
        blockedCell={runner.blockedCell}
      />

      <div className="flex min-h-[52px] w-full max-w-sm flex-wrap items-center gap-1 rounded-2xl border-2 border-dashed border-teal-300 bg-white/60 p-2">
        {commands.length === 0 ? (
          <span className="px-2 text-sm text-teal-300">ここに やじるしが ならぶよ</span>
        ) : (
          commands.map((cmd, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (!runner.playing && !locked) { playSfx('tap'); setCommands((c) => c.filter((_, j) => j !== i)); } }}
              className="rounded-lg bg-teal-400 px-2 py-1 text-lg font-bold text-white shadow-[0_2px_0_#0f766e]"
            >
              {cmd.kind === 'move' ? DIR_ARROW[cmd.dir] : '🔁'}
            </button>
          ))
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ARROWS.map((dir) => (
          <motion.button
            key={dir}
            type="button"
            onClick={() => addMove(dir)}
            whileTap={{ scale: 0.9 }}
            disabled={!canAdd}
            className="h-14 w-14 rounded-2xl bg-teal-400 text-2xl font-bold text-white shadow-[0_4px_0_#0f766e] disabled:opacity-40"
          >
            {DIR_ARROW[dir]}
          </motion.button>
        ))}
      </div>

      <div className="flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={() => { if (!runner.playing && !locked && commands.length) { playSfx('tap'); setHint(null); runner.play(commands); } }}
          disabled={runner.playing || locked || commands.length === 0}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40"
        >
          ▶ スタート
        </button>
        <button
          type="button"
          onClick={() => { if (!runner.playing && !locked && commands.length) { playSfx('tap'); runner.step(commands); } }}
          disabled={runner.playing || locked || commands.length === 0}
          className="rounded-2xl bg-sky-400 px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#0369a1] active:translate-y-1 disabled:opacity-40"
        >
          👣 1コマ
        </button>
        <button
          type="button"
          onClick={() => { if (!locked) { playSfx('tap'); runner.reset(); setHint(null); } }}
          disabled={locked}
          className="rounded-2xl bg-amber-400 px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1 disabled:opacity-40"
        >
          ↺
        </button>
      </div>

      {won && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-teal-700">🎉 クリア！</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { playSfx('tap'); setPhase('build'); runner.reset(); }} className="rounded-2xl bg-teal-500 px-5 py-3 font-bold text-white shadow-[0_4px_0_#0f766e]">
              べつの めいろを つくる
            </button>
            <button type="button" onClick={onExit} className="rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white shadow-[0_4px_0_#b45309]">
              ホームへ
            </button>
          </div>
        </motion.div>
      )}

      {hint && !won && <HintBanner charEmoji={charEmoji} message={hint} />}
    </div>
  );
}
