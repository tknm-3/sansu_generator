import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  ADVENTURE_QUEST,
  ADVENTURE_ZONES,
  getZone,
  type AdventureQuest,
  type AdventureZone,
} from '../lib/programming/adventureLevels';
import {
  addQuestClear,
  getAdventureSummary,
  getQuestCleared,
  getZoneStatus,
  isQuestCleared,
  isQuestUnlocked,
  nextPlayableIndex,
  type ZoneStatus,
} from '../lib/programming/progress';

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

const ARROWS: Dir[] = ['up', 'left', 'down', 'right'];

/** アクセント色（Tailwind を purge から まもるため フルクラスで もつ） */
const ACCENT: Record<string, { chip: string; text: string; ring: string; soft: string; border: string }> = {
  emerald: { chip: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-400', soft: 'bg-emerald-100', border: 'border-emerald-400' },
  violet: { chip: 'bg-violet-500', text: 'text-violet-700', ring: 'ring-violet-400', soft: 'bg-violet-100', border: 'border-violet-400' },
  amber: { chip: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-400', soft: 'bg-amber-100', border: 'border-amber-400' },
  lime: { chip: 'bg-lime-600', text: 'text-lime-700', ring: 'ring-lime-500', soft: 'bg-lime-100', border: 'border-lime-500' },
  indigo: { chip: 'bg-indigo-500', text: 'text-indigo-700', ring: 'ring-indigo-400', soft: 'bg-indigo-100', border: 'border-indigo-400' },
};

export function ArrowAdventureUnit({ characterId, onExit }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  // クリアを localStorage に きろくするので、tick で 読みなおして 再描画する
  const [tick, setTick] = useState(0);
  const [playIndex, setPlayIndex] = useState<number | null>(null);

  useEffect(() => { setBgmTrack('arrow-sequence'); }, []);

  function startQuest(index: number) {
    if (!isQuestUnlocked(index)) return;
    playSfx('tap');
    setPlayIndex(index);
  }

  function handleQuestCleared() {
    // 進捗は addQuestClear 済み。マップに もどして 再描画。
    setPlayIndex(null);
    setTick((t) => t + 1);
  }

  if (playIndex != null) {
    const quest = ADVENTURE_QUEST[playIndex];
    return (
      <AdventurePlay
        key={quest.id}
        quest={quest}
        index={playIndex}
        charEmoji={charEmoji}
        onCleared={handleQuestCleared}
        onBack={() => { playSfx('tap'); setPlayIndex(null); }}
      />
    );
  }

  return (
    <AdventureMap
      key={tick}
      charEmoji={charEmoji}
      onSelect={startQuest}
      onExit={onExit}
    />
  );
}

// ───────────────────────── マップ（ゾーン地図 + 達成度）─────────────────────────

function AdventureMap({
  charEmoji,
  onSelect,
  onExit,
}: {
  charEmoji: string;
  onSelect: (index: number) => void;
  onExit: () => void;
}) {
  const summary = getAdventureSummary();
  const percent = Math.round((summary.clearedCount / summary.total) * 100);
  const frontier = nextPlayableIndex();

  // 問題を ゾーンごとに まとめ、グローバル index も もっておく
  const grouped = useMemo(() => {
    return ADVENTURE_ZONES.map((zone) => ({
      zone,
      quests: ADVENTURE_QUEST.map((q, i) => ({ q, i })).filter(({ q }) => q.zoneId === zone.id),
    }));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-sky-100 to-indigo-50 p-5">
      <div className="flex w-full max-w-md items-center justify-between">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-indigo-700">
          ← もどる
        </button>
        <span className="text-lg font-bold text-indigo-900">🗺️ ぼうけんの ちず</span>
        <span className="w-12" />
      </div>

      {/* 達成度バー */}
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-md">
        <div className="mb-1 flex items-end justify-between">
          <span className="text-sm font-bold text-indigo-700">
            {summary.clearedCount} / {summary.total} もん クリア！
          </span>
          <span className="text-2xl font-bold text-indigo-900">{percent}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-indigo-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 60 }}
          />
        </div>
        {summary.perfectCount > 0 && (
          <p className="mt-2 text-xs font-bold text-amber-600">💎 ぴったり賞 ×{summary.perfectCount}</p>
        )}
      </div>

      {/* ゾーン地図 */}
      <div className="flex w-full max-w-md flex-col gap-3 pb-6">
        {grouped.map(({ zone, quests }) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            quests={quests}
            status={getZoneStatus(zone.id)}
            frontier={frontier}
            charEmoji={charEmoji}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function ZoneCard({
  zone,
  quests,
  status,
  frontier,
  charEmoji,
  onSelect,
}: {
  zone: AdventureZone;
  quests: { q: AdventureQuest; i: number }[];
  status: ZoneStatus;
  frontier: number;
  charEmoji: string;
  onSelect: (index: number) => void;
}) {
  const accent = ACCENT[zone.accent] ?? ACCENT.indigo;

  // まだ ずっと さきの ゾーンは ？？？で かくす（つぎの ゾーンだけ 名前を みせて 予告）
  if (status === 'locked') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/40 p-4 opacity-70">
        <span className="text-3xl grayscale">❓</span>
        <div className="text-sm font-bold text-gray-400">？？？ ゾーン</div>
      </div>
    );
  }

  if (status === 'next') {
    return (
      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 0.8 }}
        className={`flex items-center gap-3 rounded-2xl border-2 border-dashed bg-white/60 p-4 ${accent.border}`}
      >
        <span className="text-4xl">{zone.emoji}</span>
        <div>
          <div className={`text-base font-bold ${accent.text}`}>つぎは… {zone.name}！</div>
          <div className="text-xs text-gray-500">{zone.tagline}</div>
        </div>
      </motion.div>
    );
  }

  // cleared / current は ぜんぶ みせる
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-md ${status === 'current' ? `ring-2 ${accent.ring}` : ''}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-3xl">{zone.emoji}</span>
        <div className="flex-1">
          <div className={`text-base font-bold ${accent.text}`}>{zone.name}</div>
          <div className="text-xs text-gray-500">{zone.tagline}</div>
        </div>
        {status === 'cleared' && <span className="text-xl">✅</span>}
        {status === 'current' && <span className="text-xl">{charEmoji}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {quests.map(({ q, i }) => {
          const cleared = isQuestCleared(q.id);
          const rec = getQuestCleared(q.id);
          const unlocked = i <= frontier;
          const isFrontier = i === frontier;
          const num = i + 1;
          return (
            <motion.button
              key={q.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelect(i)}
              whileTap={unlocked ? { scale: 0.9 } : undefined}
              animate={isFrontier ? { scale: [1, 1.08, 1] } : {}}
              transition={isFrontier ? { repeat: Infinity, duration: 1.4 } : {}}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${
                cleared
                  ? 'bg-amber-300 text-amber-900'
                  : isFrontier
                    ? `${accent.chip} text-white`
                    : unlocked
                      ? accent.soft + ' ' + accent.text
                      : 'bg-gray-200 text-gray-400'
              }`}
              title={`もんだい ${num}`}
            >
              {cleared ? (rec?.perfect ? '💎' : '⭐') : unlocked ? num : '🔒'}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── プレイ（1問を とく）─────────────────────────

function AdventurePlay({
  quest,
  index,
  charEmoji,
  onCleared,
  onBack,
}: {
  quest: AdventureQuest;
  index: number;
  charEmoji: string;
  onCleared: () => void;
  onBack: () => void;
}) {
  const zone = getZone(quest.zoneId);
  const accent = ACCENT[zone.accent] ?? ACCENT.indigo;
  const theme = { wall: zone.wall, tile: zone.tile, wallTile: zone.wallTile, board: zone.board };

  const [commands, setCommands] = useState<Command[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [overlay, setOverlay] = useState<null | { perfect: boolean }>(null);

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      const perfect = isPerfect(quest, result);
      addQuestClear(quest.id, perfect);
      speakJa(buildPraise(perfect));
      setHint(null);
      playSfx('fanfare');
      window.setTimeout(() => setOverlay({ perfect }), 600);
    } else {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      const h = buildHint(quest, result, nextAttempt);
      setHint(h);
      speakJa(h);
    }
  }

  const runner = useProgramRunner(quest, handleFinish);

  const flatLen = flatten(commands).length;
  const maxSlots = quest.maxSlots ?? 16;
  const canAdd = flatLen < maxSlots && !runner.playing && !locked;

  function addMove(dir: Dir) {
    if (!canAdd) return;
    playSfx('tap');
    setCommands((c) => [...c, { kind: 'move', dir }]);
    setHint(null);
  }

  function addLoop(cmd: Command) {
    if (!canAdd) return;
    const add = cmd.kind === 'repeat' ? cmd.body.length * cmd.times : 1;
    if (flatLen + add > maxSlots) return;
    playSfx('tap');
    setCommands((c) => [...c, cmd]);
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
    const sol = quest.solution ?? solve(quest);
    if (sol && sol.length > 0) {
      const msg = `さいしょは 「${DIR_LABEL[sol[0]]}」から はじめると いいかも！`;
      setHint(msg);
      speakJa(msg);
    }
  }

  return (
    <div className={`flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b ${zone.bg} p-5`}>
      <div className="flex w-full max-w-sm items-center justify-between">
        <button type="button" onClick={onBack} className={`rounded-xl bg-white/70 px-3 py-2 text-sm font-bold ${accent.text}`}>
          ← ちずへ
        </button>
        <span className={`text-sm font-bold ${accent.text}`}>もんだい {index + 1} / {ADVENTURE_QUEST.length}</span>
        <span className={`rounded-full ${accent.chip} px-3 py-1 text-xs font-bold text-white`}>
          {zone.emoji} {zone.name}
        </span>
      </div>

      <motion.h2 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`text-center text-lg font-bold ${accent.text}`}>
        {charEmoji} を {quest.goalEmoji ?? '🏠'} まで はこぼう！
      </motion.h2>
      {quest.prompt && <p className={`text-sm font-bold ${accent.text}`}>{quest.prompt}</p>}

      <ProgrammingGrid
        level={quest}
        charEmoji={charEmoji}
        charPos={runner.charPos}
        trail={runner.trail}
        collected={runner.collected}
        blockedCell={runner.blockedCell}
        zombiePositions={runner.zombiePositions}
        theme={theme}
      />

      {/* くみたてた やじるし */}
      <div className="flex min-h-[52px] w-full max-w-sm flex-wrap items-center gap-1 rounded-2xl border-2 border-dashed border-indigo-300 bg-white/60 p-2">
        {commands.length === 0 ? (
          <span className="px-2 text-sm text-indigo-300">ここに やじるしが ならぶよ</span>
        ) : (
          commands.map((cmd, i) => (
            <button
              key={i}
              type="button"
              onClick={() => removeAt(i)}
              className={`rounded-lg ${accent.chip} px-2 py-1 text-lg font-bold text-white shadow-sm`}
            >
              {cmd.kind === 'move' ? DIR_ARROW[cmd.dir] : `🔁${DIR_ARROW[cmd.body[0]]}×${cmd.times}`}
            </button>
          ))
        )}
      </div>
      <p className="text-xs text-indigo-500">やじるしを タップすると けせるよ（のこり {maxSlots - flatLen}）</p>

      {/* やじるしパレット */}
      <div className="grid grid-cols-4 gap-2">
        {ARROWS.map((dir) => (
          <motion.button
            key={dir}
            type="button"
            onClick={() => addMove(dir)}
            whileTap={{ scale: 0.9 }}
            disabled={!canAdd}
            className={`h-14 w-14 rounded-2xl ${accent.chip} text-2xl font-bold text-white shadow-md disabled:opacity-40`}
          >
            {DIR_ARROW[dir]}
          </motion.button>
        ))}
      </div>

      {quest.allowLoop && <LoopBuilder disabled={!canAdd} onAdd={addLoop} />}

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

      <AnimatePresence>
        {overlay && (
          <ClearOverlay quest={quest} perfect={overlay.perfect} onContinue={onCleared} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** クリア演出。ゾーンクリアや「あと○問で つぎのゾーン」を 予告する */
function ClearOverlay({ quest, perfect, onContinue }: { quest: AdventureQuest; perfect: boolean; onContinue: () => void }) {
  // この時点で addQuestClear 済み。ゾーンの のこりを かぞえる。
  const zone = getZone(quest.zoneId);
  const zoneQuests = ADVENTURE_QUEST.filter((q) => q.zoneId === quest.zoneId);
  const remaining = zoneQuests.filter((q) => !isQuestCleared(q.id)).length;
  const zoneIdx = ADVENTURE_ZONES.findIndex((z) => z.id === zone.id);
  const nextZone = ADVENTURE_ZONES[zoneIdx + 1];
  const allDone = ADVENTURE_QUEST.every((q) => isQuestCleared(q.id));

  let preview: string;
  if (allDone) {
    preview = '🎉 ぜんぶの もんだいを クリア！ ぼうけんマスター だ！';
  } else if (remaining === 0) {
    preview = nextZone
      ? `🏁 ${zone.name} クリア！ つぎは ${nextZone.emoji} ${nextZone.name} へ！`
      : `🏁 ${zone.name} クリア！`;
  } else {
    preview = `あと ${remaining}もんで ${zone.emoji} ${zone.name} クリア！`;
  }

  return (
    <motion.div
      className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/40 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">
        {perfect ? '💎' : '🎉'}
      </motion.div>
      <div className="rounded-3xl bg-white px-6 py-5 text-center shadow-xl">
        <p className="text-2xl font-bold text-orange-600">{buildPraise(perfect)}</p>
        {perfect && <p className="mt-1 text-sm font-bold text-amber-600">💎 ぴったり賞 ゲット！</p>}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 text-base font-bold text-indigo-700"
        >
          {preview}
        </motion.p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="rounded-2xl bg-orange-400 px-8 py-4 text-xl font-bold text-white shadow-[0_5px_0_#c2410c] active:translate-y-1"
      >
        🗺️ ちずへ もどる
      </button>
    </motion.div>
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
