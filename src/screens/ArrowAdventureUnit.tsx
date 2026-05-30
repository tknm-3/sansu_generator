import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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

// ───────────────────────── 羊皮紙の世界観（Vellum Frontier）─────────────────────────
// デザイン哲学は design/adventure-philosophy.md を参照。
// 一枚の手描き宝地図として、蛇行トレイル・封蝋スタンプ・霧（fog of war）で 旅を表現する。

/** 羊皮紙のグラデーション背景 */
const PARCHMENT = 'radial-gradient(125% 85% at 50% -10%, #fbf3df 0%, #f1e3c2 46%, #e7d3a8 100%)';
/** セピアの輪郭色 */
const SEPIA = '#7a5a3a';

/** 紙の繊維グレイン＋焼け縁ヴィネット（地図ぜんたいに かさねる） */
function ParchmentTexture() {
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply" style={{ opacity: 0.1 }} aria-hidden>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 90px 22px rgba(120,80,30,.34), inset 0 0 22px 6px rgba(90,55,20,.22)' }}
        aria-hidden
      />
    </>
  );
}

/** 方位磁針 */
function Compass({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="44" fill="rgba(255,255,255,.35)" stroke={SEPIA} strokeWidth="2" />
      <circle cx="50" cy="50" r="37" fill="none" stroke={SEPIA} strokeWidth="1" opacity="0.45" />
      <polygon points="50,12 57,50 50,46 43,50" fill="#b9472f" />
      <polygon points="50,88 43,50 50,54 57,50" fill={SEPIA} />
      <text x="50" y="25" fontSize="11" textAnchor="middle" fill={SEPIA} fontWeight="700">N</text>
    </svg>
  );
}

/** リボン状の見出し帯 */
function Ribbon({ children, width = 250 }: { children: ReactNode; width?: number }) {
  return (
    <div className="relative" style={{ width }}>
      <span className="absolute left-[-8px] top-3 h-5 w-5 rotate-45 bg-[#7e2a1a]" aria-hidden />
      <span className="absolute right-[-8px] top-3 h-5 w-5 rotate-45 bg-[#7e2a1a]" aria-hidden />
      <div
        className="relative rounded-md border px-3 py-2 text-center font-bold tracking-widest text-[#fbe6c9]"
        style={{
          background: 'linear-gradient(#b9472f,#9c3622)',
          borderColor: 'rgba(110,30,18,.6)',
          boxShadow: '0 3px 0 rgba(110,30,18,.5), inset 0 1px 0 rgba(255,255,255,.18)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

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

// 地図レイアウトの 寸法（一枚の宝地図として 縦に スクロールする）
const MAP_W = 340; // 地図の 内側はば（px・中央ぞろえ）
const LANES = [58, 170, 282]; // 蛇行する 横レーン（px）
const SERP = [0, 1, 2, 1]; // レーンの 行き来パターン
const STOP_STEP = 96; // 停留所どうしの 縦かんかく
const HEADER_H = 60; // ゾーン見出しの 高さ
const REGION_TINT: Record<string, string> = {
  forest: 'rgba(96,140,80,.26)',
  valley: 'rgba(124,98,160,.24)',
  desert: 'rgba(196,150,70,.26)',
  zombie: 'rgba(110,140,86,.26)',
  castle: 'rgba(96,116,150,.26)',
};

interface StopNode {
  q: AdventureQuest;
  i: number;
  x: number;
  y: number;
  cleared: boolean;
  perfect: boolean;
  unlocked: boolean;
  isFrontier: boolean;
}
interface ZoneBand {
  zone: AdventureZone;
  status: ZoneStatus;
  top: number;
  bottom: number;
}

/** 宝地図の トレイル線（蛇行する S字カーブ）を つくる */
function trailPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
  }
  return d;
}

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

  // ゾーンを じゅんに たどり、停留所を 蛇行トレイル上に ならべる。
  // cleared / current ゾーンは 停留所を みせ、next / locked は 霧の むこうに かくす。
  const layout = useMemo(() => {
    const grouped = ADVENTURE_ZONES.map((zone) => ({
      zone,
      quests: ADVENTURE_QUEST.map((q, i) => ({ q, i })).filter(({ q }) => q.zoneId === zone.id),
    }));

    const nodes: StopNode[] = [];
    const bands: ZoneBand[] = [];
    const trail: { x: number; y: number }[] = [];
    const mist: { zone: AdventureZone; status: ZoneStatus }[] = [];

    let y = 16;
    let stopN = 0;
    for (const { zone, quests } of grouped) {
      const status = getZoneStatus(zone.id);
      if (status === 'next' || status === 'locked') {
        mist.push({ zone, status });
        continue;
      }
      const bandTop = y;
      y += HEADER_H;
      for (const { q, i } of quests) {
        const x = LANES[SERP[stopN % SERP.length]];
        const cy = y + 36;
        const rec = getQuestCleared(q.id);
        nodes.push({
          q,
          i,
          x,
          y: cy,
          cleared: isQuestCleared(q.id),
          perfect: !!rec?.perfect,
          unlocked: i <= frontier,
          isFrontier: i === frontier,
        });
        trail.push({ x, y: cy });
        y += STOP_STEP;
        stopN++;
      }
      bands.push({ zone, status, top: bandTop, bottom: y });
      y += 6;
    }

    const mistTop = y;
    const totalHeight = y + (mist.length ? 190 : 28);
    return { nodes, bands, trail, mist, mistTop, totalHeight };
  }, [frontier]);

  return (
    <div className="relative flex min-h-screen flex-col items-center" style={{ background: PARCHMENT }}>
      <ParchmentTexture />

      {/* ヘッダー：もどる・方位磁針 */}
      <div className="relative z-10 flex w-full max-w-md items-center justify-between px-4 pr-16 pt-4">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border-[1.5px] px-3 py-2 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.5)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}
        >
          ← もどる
        </button>
        <Compass />
      </div>

      {/* タイトル・リボン */}
      <div className="relative z-10 mt-1 flex flex-col items-center">
        <Ribbon width={250}>
          <span className="text-xl">ぼうけんの ちず</span>
        </Ribbon>
      </div>

      {/* 進捗＝距離の目盛り */}
      <div className="relative z-10 mt-3 w-[300px]">
        <div className="flex justify-between text-[10px] tracking-[0.18em]" style={{ color: '#8a6b45' }}>
          <span>START</span>
          <span>・・・・・・</span>
          <span>CASTLE</span>
        </div>
        <div
          className="mt-0.5 h-2.5 overflow-hidden rounded-md border"
          style={{ background: 'rgba(123,90,58,.18)', borderColor: 'rgba(123,90,58,.3)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg,#c9802f,#e0a94b)' }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 60 }}
          />
        </div>
        <p className="mt-1 text-center text-xs font-bold" style={{ color: SEPIA }}>
          {summary.clearedCount} / {summary.total} もん ふみは {percent}%
          {summary.perfectCount > 0 && <span className="ml-1 text-[#b9472f]">💎×{summary.perfectCount}</span>}
        </p>
      </div>

      {/* 宝地図ぜんたい */}
      <div className="relative z-10 mt-3 mb-6" style={{ width: MAP_W, height: layout.totalHeight }}>
        {/* 地方の 色あい（region tint）*/}
        {layout.bands.map(({ zone, top, bottom }) => (
          <div
            key={`tint-${zone.id}`}
            className="absolute left-0 right-0 rounded-[40px]"
            style={{
              top: top - 4,
              height: bottom - top + 8,
              background: `radial-gradient(70% 60% at 50% 40%, ${REGION_TINT[zone.id] ?? 'rgba(123,90,58,.2)'}, transparent 72%)`,
            }}
            aria-hidden
          />
        ))}

        {/* 蛇行トレイル */}
        <svg className="pointer-events-none absolute inset-0" width={MAP_W} height={layout.totalHeight} aria-hidden>
          <path d={trailPath(layout.trail)} fill="none" stroke={SEPIA} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="2 12" opacity={0.7} />
        </svg>

        {/* ゾーン見出し（リボン小）*/}
        {layout.bands.map(({ zone, status, top }) => (
          <div key={`head-${zone.id}`} className="absolute left-0 right-0 flex items-center justify-center" style={{ top, height: HEADER_H }}>
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm"
              style={{
                background: status === 'current' ? 'rgba(255,247,224,.92)' : 'rgba(255,255,255,.55)',
                borderColor: 'rgba(123,90,58,.4)',
              }}
            >
              <span className="text-xl">{zone.emoji}</span>
              <span className="text-sm font-bold" style={{ color: SEPIA }}>{zone.name}</span>
              {status === 'cleared' && <span className="text-sm">🏁</span>}
            </div>
          </div>
        ))}

        {/* 停留所（封蝋スタンプ）*/}
        {layout.nodes.map((n) => (
          <MapStop key={n.q.id} node={n} charEmoji={charEmoji} onSelect={onSelect} />
        ))}

        {/* 霧（fog of war）— つぎの ゾーン予告＋未踏 */}
        {layout.mist.length > 0 && (
          <div
            className="absolute left-0 right-0 flex flex-col items-center gap-2 rounded-[40px] pt-8"
            style={{
              top: layout.mistTop,
              height: 190,
              background: 'linear-gradient(transparent, rgba(232,216,184,.78) 38%, rgba(225,208,176,.96))',
            }}
          >
            {layout.mist.map(({ zone, status }) =>
              status === 'next' ? (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.55, 0.85, 0.55] }}
                  transition={{ repeat: Infinity, duration: 2.4 }}
                  className="flex items-center gap-2 rounded-full border border-dashed px-4 py-2"
                  style={{ borderColor: 'rgba(123,90,58,.5)', background: 'rgba(255,255,255,.4)' }}
                >
                  <span className="text-2xl">{zone.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold" style={{ color: SEPIA }}>つぎは… {zone.name}！</div>
                    <div className="text-[10px]" style={{ color: '#9a7c54' }}>{zone.tagline}</div>
                  </div>
                </motion.div>
              ) : (
                <span key={zone.id} className="text-2xl tracking-[0.3em]" style={{ color: 'rgba(123,90,58,.35)' }}>？？？</span>
              ),
            )}
          </div>
        )}
      </div>

      <p className="relative z-10 -mt-3 pb-4 text-[10px] tracking-widest" style={{ color: '#9a7c54' }}>
        ⭐クリア　💎ぴったり賞　🧭いまここ　🌫️きりのむこう
      </p>
    </div>
  );
}

/** トレイル上の 停留所（封蝋スタンプ）。状態で みためが かわる */
function MapStop({ node, charEmoji, onSelect }: { node: StopNode; charEmoji: string; onSelect: (index: number) => void }) {
  const { i, x, y, cleared, perfect, unlocked, isFrontier } = node;
  // 封蝋の みため
  let sealStyle: CSSProperties;
  let content: ReactNode;
  if (cleared) {
    sealStyle = {
      background: 'radial-gradient(circle at 35% 30%, #e7c46a, #b9472f)',
      color: '#fff3d6',
      borderColor: '#7e2a1a',
      boxShadow: '0 3px 0 rgba(90,55,20,.35), inset 0 2px 4px rgba(255,255,255,.3)',
    };
    content = perfect ? '💎' : '⭐';
  } else if (isFrontier) {
    sealStyle = {
      background: 'radial-gradient(circle at 35% 30%, #fff7e0, #e0a94b)',
      color: '#6b4f30',
      borderColor: '#9c6a2a',
      boxShadow: '0 0 0 6px rgba(224,169,75,.32), 0 3px 0 rgba(90,55,20,.4)',
    };
    content = '🧭';
  } else if (unlocked) {
    sealStyle = {
      background: 'radial-gradient(circle at 35% 30%, #fbf3df, #e7d3a8)',
      color: SEPIA,
      borderColor: 'rgba(90,55,20,.5)',
      boxShadow: '0 3px 0 rgba(90,55,20,.3), inset 0 2px 4px rgba(255,255,255,.3)',
    };
    content = i + 1;
  } else {
    sealStyle = {
      background: 'rgba(231,211,168,.6)',
      color: 'rgba(123,90,58,.5)',
      borderColor: 'rgba(123,90,58,.3)',
    };
    content = '🔒';
  }

  return (
    <motion.button
      type="button"
      disabled={!unlocked}
      onClick={() => onSelect(i)}
      whileTap={unlocked ? { scale: 0.9 } : undefined}
      className="absolute flex items-center justify-center"
      style={{ left: x, top: y, width: 56, height: 56, transform: 'translate(-50%,-50%)' }}
      title={`もんだい ${i + 1}`}
    >
      {/* いまここ：旅人（キャラ）が 停留所の うえに 立つ */}
      {isFrontier && (
        <motion.span
          className="absolute text-3xl"
          style={{ top: -30, filter: 'drop-shadow(0 2px 1px rgba(0,0,0,.3))' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          {charEmoji}
        </motion.span>
      )}
      <motion.span
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold"
        style={sealStyle}
        animate={isFrontier ? { scale: [1, 1.09, 1] } : {}}
        transition={isFrontier ? { repeat: Infinity, duration: 1.5 } : {}}
      >
        {content}
      </motion.span>
    </motion.button>
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
    <div className="relative flex min-h-screen flex-col items-center gap-4 p-5" style={{ background: PARCHMENT }}>
      <ParchmentTexture />

      {/* ヘッダー：ちずへ もどる・進度・地方の しるし */}
      <div className="relative z-10 flex w-full max-w-sm items-center justify-between pr-12">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-[1.5px] px-3 py-2 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.5)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}
        >
          ← ちずへ
        </button>
        <span className="text-sm font-bold" style={{ color: SEPIA }}>もんだい {index + 1} / {ADVENTURE_QUEST.length}</span>
        <span className={`rounded-full ${accent.chip} px-2.5 py-1 text-xs font-bold text-white shadow-sm`}>
          {zone.emoji} {zone.name}
        </span>
      </div>

      {/* クエスト見出し（探検ノートの 一枚）*/}
      <div className="relative z-10 flex flex-col items-center">
        <Ribbon width={270}>
          <span className="text-base">
            {charEmoji} を {quest.goalEmoji ?? '🏠'} まで はこぼう！
          </span>
        </Ribbon>
        {quest.prompt && (
          <p className="mt-2 text-center text-sm font-bold" style={{ color: SEPIA }}>📜 {quest.prompt}</p>
        )}
      </div>

      {/* 盤面＝現地の みとりず（羊皮紙の フレームに ピン留め）*/}
      <div
        className="relative z-10 rounded-2xl border-2 p-2 shadow-md"
        style={{ borderColor: 'rgba(123,90,58,.45)', background: 'rgba(255,250,235,.5)' }}
      >
        <span className="absolute left-1.5 top-1.5 text-xs">📍</span>
        <span className="absolute right-1.5 top-1.5 text-xs">📌</span>
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
      </div>

      {/* くみたてた やじるし */}
      <div
        className="relative z-10 flex min-h-[52px] w-full max-w-sm flex-wrap items-center gap-1 rounded-2xl border-2 border-dashed p-2"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}>
        {commands.length === 0 ? (
          <span className="px-2 text-sm" style={{ color: 'rgba(123,90,58,.5)' }}>ここに やじるしが ならぶよ</span>
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
      <p className="relative z-10 text-xs" style={{ color: '#9a7c54' }}>やじるしを タップすると けせるよ（のこり {maxSlots - flatLen}）</p>

      {/* やじるしパレット＝旅の どうぐばこ */}
      <div
        className="relative z-10 flex flex-col items-center gap-2 rounded-2xl border-2 p-3"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}
      >
        <span className="text-xs font-bold" style={{ color: SEPIA }}>🧰 どうぐばこ（やじるし）</span>
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
      </div>

      {/* そうさボタン */}
      <div className="relative z-10 flex w-full max-w-sm gap-2">
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
        <div className="relative z-10 w-full max-w-sm">
          <HintBanner
            charEmoji={charEmoji}
            message={hint}
            onMoreHint={showMoreHint}
            moreHintLabel="さいしょの 1マス"
          />
        </div>
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
