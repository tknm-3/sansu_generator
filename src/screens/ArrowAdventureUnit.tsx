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
  isPerfectByBlocks,
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
  buildBranchProgram,
  getZone,
  type AdventureQuest,
  type AdventureZone,
} from '../lib/programming/adventureLevels';
import { runBranch, buildBranchHint, type BranchCommand } from '../lib/programming/branch';
import { runRelative, solveRelative, REL_ICON, REL_LABEL, type RelDir, type RelCommand, type RelLoop } from '../lib/programming/relativeEngine';
import { expandProc, CALL_ICON, CALL_LABEL, type ProcMainCmd } from '../lib/programming/procEngine';
import {
  addQuestClear,
  currentZoneId,
  getAdventureSummary,
  getQuestCleared,
  getSparkles,
  getZoneStatus,
  isQuestCleared,
  isQuestUnlocked,
  nextPlayableIndex,
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
  orange: { chip: 'bg-orange-500', text: 'text-orange-700', ring: 'ring-orange-400', soft: 'bg-orange-100', border: 'border-orange-400' },
  sky:    { chip: 'bg-sky-500',    text: 'text-sky-700',    ring: 'ring-sky-400',    soft: 'bg-sky-100',    border: 'border-sky-400' },
};

// ───────────────────────── 羊皮紙の世界観（Vellum Frontier）─────────────────────────
// デザイン哲学は design/adventure-philosophy.md を参照。
// RPG のように「まち（ゾーン）」を 1枚ずつ めくって たびする 宝地図として 表現する。

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
  // 直前に クリアした 問題の index。マップで ペンギンを つぎの 宿場へ あるかせる演出に つかう。
  const [justCleared, setJustCleared] = useState<number | null>(null);

  useEffect(() => { setBgmTrack('arrow-sequence'); }, []);

  function startQuest(index: number) {
    if (!isQuestUnlocked(index)) return;
    playSfx('tap');
    setJustCleared(null); // 自分で えらんだら 歩行演出は ださない
    setPlayIndex(index);
  }

  function handleQuestCleared() {
    // 進捗は addQuestClear 済み。クリアした index を おぼえて マップへ もどす。
    setJustCleared(playIndex);
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
      justCleared={justCleared}
      onSelect={startQuest}
      onExit={onExit}
    />
  );
}

// ───────────────────────── 町マップ（ゾーン＝ひとつの まち）─────────────────────────
// RPG のように、ゾーンを ひとつの 「まち」として 1画面に みせる。
// クリアすると ペンギンが つぎの 宿場へ あるいて すすみ、
// まちを ぜんぶ クリアすると ▶（つぎの まち）で 別の まちへ 切りかわる。

const TOWN_W = 320; // まちマップの はば（px）
const TOWN_H = 430; // まちマップの たかさ（px）

// 6つの 宿場（停留所）の ざひょう。曲がりくねった 一本道に そって ならべる。
const STOPS: { x: number; y: number }[] = [
  { x: 64, y: 56 },
  { x: 226, y: 92 },
  { x: 262, y: 196 },
  { x: 96, y: 232 },
  { x: 66, y: 336 },
  { x: 244, y: 372 },
];
// まちの でぐち（つぎの まちへの もん）。道の さいごに おく。
const TOWN_EXIT = { x: 160, y: 416 };

// まちの 雰囲気を だす 装飾絵文字の ちらし位置（zone.wall を うすく まく）
const SCATTER: { x: number; y: number; s: number }[] = [
  { x: 150, y: 38, s: 26 }, { x: 296, y: 140, s: 20 }, { x: 28, y: 150, s: 22 },
  { x: 178, y: 168, s: 18 }, { x: 300, y: 290, s: 24 }, { x: 26, y: 280, s: 20 },
  { x: 170, y: 300, s: 22 }, { x: 124, y: 122, s: 16 }, { x: 250, y: 320, s: 18 },
];

const REGION_TINT: Record<string, string> = {
  forest: 'rgba(96,140,80,.32)',
  valley: 'rgba(124,98,160,.30)',
  desert: 'rgba(196,150,70,.34)',
  zombie: 'rgba(110,150,86,.32)',
  castle: 'rgba(96,116,150,.32)',
  donguri: 'rgba(200,130,60,.32)',
  kumo:    'rgba(80,160,200,.28)',
  moon:    'rgba(70,80,150,.34)',
  snow:    'rgba(150,190,220,.30)',
  tower:   'rgba(120,100,180,.30)',
  crystal: 'rgba(150,90,180,.30)',
  fog:     'rgba(120,150,130,.30)',
  sea:     'rgba(60,150,170,.30)',
  rloop_a: 'rgba(80,160,80,.28)',
  rloop_b: 'rgba(120,90,190,.30)',
  proc_a:  'rgba(220,130,60,.28)',
  proc_b:  'rgba(200,80,100,.28)',
  nloop_a: 'rgba(60,150,130,.28)',
  nloop_b: 'rgba(100,70,180,.30)',
  lake:    'rgba(70,150,200,.30)',
  honey:   'rgba(220,180,60,.30)',
  robot:   'rgba(110,120,160,.30)',
  candy:   'rgba(220,120,170,.30)',
  toy:     'rgba(220,140,90,.28)',
  gemcave:  'rgba(150,90,200,.30)',
  starbase: 'rgba(90,100,200,.30)',
  windmill: 'rgba(70,160,210,.28)',
  craft:    'rgba(220,160,70,.28)',
  lava:     'rgba(230,110,60,.30)',
  beach:    'rgba(220,180,80,.28)',
  flower:   'rgba(210,90,170,.28)',
  rock:     'rgba(120,170,70,.28)',
  night:    'rgba(80,90,170,.30)',
  leaf:     'rgba(90,160,110,.28)',
};

interface TownStop {
  q: AdventureQuest;
  globalIndex: number; // ADVENTURE_QUEST 内の とおし番号
  cleared: boolean;
  perfect: boolean;
  unlocked: boolean;
  isFrontier: boolean;
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

/** ある ゾーンの 6問を とおし番号つきで あつめる */
function stopsOfZone(zoneId: string, frontier: number): TownStop[] {
  return ADVENTURE_QUEST.map((q, i) => ({ q, i }))
    .filter(({ q }) => q.zoneId === zoneId)
    .map(({ q, i }) => {
      const rec = getQuestCleared(q.id);
      return {
        q,
        globalIndex: i,
        cleared: isQuestCleared(q.id),
        perfect: !!rec?.perfect,
        unlocked: i <= frontier,
        isFrontier: i === frontier,
      };
    });
}

function AdventureMap({
  charEmoji,
  justCleared,
  onSelect,
  onExit,
}: {
  charEmoji: string;
  justCleared: number | null;
  onSelect: (index: number) => void;
  onExit: () => void;
}) {
  const summary = getAdventureSummary();
  const percent = Math.round((summary.clearedCount / summary.total) * 100);
  const sparkles = getSparkles();
  const frontier = nextPlayableIndex();
  const curZoneIdx = Math.max(0, ADVENTURE_ZONES.findIndex((z) => z.id === currentZoneId()));

  // クリア直後は その まちを みせる。そうでなければ いま いる まち。
  const initialIdx = useMemo(() => {
    if (justCleared != null) {
      const zid = ADVENTURE_QUEST[justCleared]?.zoneId;
      const idx = ADVENTURE_ZONES.findIndex((z) => z.id === zid);
      if (idx >= 0) return idx;
    }
    return curZoneIdx;
    // マウント時に いちど だけ きめる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [viewIdx, setViewIdx] = useState(initialIdx);
  const [slideDir, setSlideDir] = useState(0); // +1=つぎへ -1=まえへ
  // 歩行演出は クリアした まちを 表示しているときだけ。一度 あるいたら けす。
  const [pendingWalk, setPendingWalk] = useState<number | null>(justCleared);

  const zone = ADVENTURE_ZONES[viewIdx];
  const status = getZoneStatus(zone.id);
  const stops = useMemo(() => stopsOfZone(zone.id, frontier), [zone.id, frontier]);
  const zoneCleared = status === 'cleared';

  // 表示中の まちに クリア宿場が あるときだけ、その ローカル index を わたす
  const walkLocal = (() => {
    if (pendingWalk == null || ADVENTURE_QUEST[pendingWalk]?.zoneId !== zone.id) return null;
    const li = stops.findIndex((s) => s.globalIndex === pendingWalk);
    return li >= 0 ? li : null;
  })();

  // 行き来できるのは 到達ずみ（cleared / current）の まちだけ
  const prevReachable = viewIdx > 0;
  const nextReachable =
    viewIdx + 1 < ADVENTURE_ZONES.length &&
    (getZoneStatus(ADVENTURE_ZONES[viewIdx + 1].id) === 'cleared' ||
      getZoneStatus(ADVENTURE_ZONES[viewIdx + 1].id) === 'current');
  const nextZone = ADVENTURE_ZONES[viewIdx + 1];

  function goTo(target: number) {
    if (target < 0 || target >= ADVENTURE_ZONES.length || target === viewIdx) return;
    const st = getZoneStatus(ADVENTURE_ZONES[target].id);
    if (st !== 'cleared' && st !== 'current') return; // 未到達は いけない
    playSfx('tap');
    setSlideDir(target > viewIdx ? 1 : -1);
    setPendingWalk(null); // 手で うごかしたら 歩行演出は おわり
    setViewIdx(target);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center" style={{ background: PARCHMENT }}>
      <ParchmentTexture />

      {/* ヘッダー：もどる・達成度 */}
      <div className="relative z-10 flex w-full max-w-md items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border-[1.5px] px-3 py-2 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.5)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}
        >
          ← もどる
        </button>
        <span className="text-sm font-bold" style={{ color: SEPIA }}>
          {summary.perfectCount > 0 && <span className="mr-2 text-[#b9472f]">💎{summary.perfectCount}</span>}
          <span title="あつめた きらきら">✨{sparkles}</span>
        </span>
      </div>

      {/* 達成度バー：これまで どのくらい すすんだか */}
      <div className="relative z-10 mt-3 w-full max-w-md px-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold" style={{ color: SEPIA }}>
          <span>🗺️ ぼうけんの しんちょく</span>
          <span>{summary.clearedCount}/{summary.total}もん・{percent}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full border"
          style={{ background: 'rgba(255,255,255,.45)', borderColor: 'rgba(123,90,58,.35)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#e0a23a,#b9472f)' }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* いまの まちの 名まえ＋ものがたり */}
      <div className="relative z-10 mt-3 flex flex-col items-center px-4">
        <Ribbon width={264}>
          <span className="text-lg">{zone.emoji} {zone.name}</span>
        </Ribbon>
        <p className="mt-1.5 text-xs font-bold" style={{ color: '#9a7c54' }}>{zone.tagline}</p>
        <div
          className="mt-2 max-w-md rounded-xl border px-3 py-2 text-center text-xs font-bold leading-relaxed"
          style={{ background: 'rgba(255,250,235,.6)', borderColor: 'rgba(123,90,58,.3)', color: '#6b4f30', whiteSpace: 'pre-line' }}
        >
          📖 {zone.story}
        </div>
      </div>

      {/* ワールド地図：まちの ならび（いま どこに いるか）*/}
      <div className="relative z-10 mt-3 flex flex-wrap justify-center items-end gap-1.5 max-w-xs px-2">
        {ADVENTURE_ZONES.map((z, i) => {
          const st = getZoneStatus(z.id);
          const reached = st === 'cleared' || st === 'current';
          const here = i === viewIdx;
          return (
            <button
              key={z.id}
              type="button"
              disabled={!reached}
              onClick={() => goTo(i)}
              className="flex flex-col items-center"
              title={z.name}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg transition ${here ? 'scale-110' : ''}`}
                style={{
                  background: here ? 'rgba(255,247,224,.95)' : reached ? 'rgba(255,255,255,.6)' : 'rgba(231,211,168,.5)',
                  borderColor: here ? '#b9472f' : 'rgba(123,90,58,.4)',
                  filter: reached ? 'none' : 'grayscale(.7) opacity(.7)',
                }}
              >
                {st === 'locked' ? '🔒' : z.emoji}
              </span>
              <span className="h-3 text-[9px] leading-3" style={{ color: '#b9472f' }}>
                {here ? '▲' : st === 'cleared' ? '🏁' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* まちマップ本体（◀ ▶ で 行き来）*/}
      <div className="relative z-10 mt-2 flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => goTo(viewIdx - 1)}
          disabled={!prevReachable}
          className="rounded-full px-1 py-6 text-2xl disabled:opacity-20"
          style={{ color: SEPIA }}
          aria-label="まえの まち"
        >
          ◀
        </button>
        <div className="relative overflow-hidden" style={{ width: TOWN_W, height: TOWN_H }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <TownBoard
              key={zone.id}
              zone={zone}
              stops={stops}
              charEmoji={charEmoji}
              walkFrom={walkLocal}
              slideDir={slideDir}
              onSelect={onSelect}
              onWalkDone={() => setPendingWalk(null)}
            />
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => goTo(viewIdx + 1)}
          disabled={!nextReachable}
          className="rounded-full px-1 py-6 text-2xl disabled:opacity-20"
          style={{ color: SEPIA }}
          aria-label="つぎの まち"
        >
          ▶
        </button>
      </div>

      {/* まちの じょうたい メッセージ */}
      <div className="relative z-10 mt-1 flex h-9 items-center text-center">
        {zoneCleared ? (
          nextReachable ? (
            <button
              type="button"
              onClick={() => goTo(viewIdx + 1)}
              className="rounded-full px-4 py-1.5 text-sm font-bold text-[#fbe6c9] shadow"
              style={{ background: 'linear-gradient(#b9472f,#9c3622)' }}
            >
              🏁 クリア！ つぎの まち {nextZone?.emoji} へ →
            </button>
          ) : (
            <span className="text-sm font-bold" style={{ color: SEPIA }}>🏁 この まちは クリア！</span>
          )
        ) : status === 'current' ? (
          <span className="text-sm font-bold" style={{ color: SEPIA }}>{charEmoji} いま ここを ぼうけんちゅう！</span>
        ) : null}
      </div>

      <p className="relative z-10 pb-4 text-[10px] tracking-widest" style={{ color: '#9a7c54' }}>
        ⭐クリア　💎ぴったり賞　⛳いまここ　⛩️つぎの まちへ
      </p>
    </div>
  );
}

/** ひとつの まち（ゾーン）の マップ。ペンギンの 現在地と 歩行演出を もつ */
function TownBoard({
  zone,
  stops,
  charEmoji,
  walkFrom,
  slideDir,
  onSelect,
  onWalkDone,
}: {
  zone: AdventureZone;
  stops: TownStop[];
  charEmoji: string;
  walkFrom: number | null;
  slideDir: number;
  onSelect: (index: number) => void;
  onWalkDone: () => void;
}) {
  // ペンギンが ふだん たつ 宿場（最初の 未クリア）。全クリアなら でぐちへ。
  const restPawn = (() => {
    const li = stops.findIndex((s) => !s.cleared);
    return li === -1 ? STOPS.length : li;
  })();

  const [pawnIdx, setPawnIdx] = useState(walkFrom != null ? walkFrom : restPawn);
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    if (walkFrom == null) return;
    setWalking(true);
    const t1 = window.setTimeout(() => { setPawnIdx(walkFrom + 1); playSfx('tap'); }, 500);
    const t2 = window.setTimeout(() => { setWalking(false); onWalkDone(); }, 1700);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    // マウント時に いちど だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pawnPos = pawnIdx >= STOPS.length ? TOWN_EXIT : STOPS[pawnIdx];
  const tint = REGION_TINT[zone.id] ?? 'rgba(123,90,58,.28)';
  const trail = trailPath([...STOPS, TOWN_EXIT]);
  const allCleared = stops.length > 0 && stops.every((s) => s.cleared);

  return (
    <motion.div
      initial={{ opacity: 0, x: slideDir * 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: slideDir * -80, position: 'absolute' }}
      transition={{ type: 'spring', stiffness: 90, damping: 17 }}
      className="left-0 top-0"
      style={{ width: TOWN_W, height: TOWN_H }}
    >
      {/* まちの じめん（テーマ色）*/}
      <div
        className="absolute inset-0 rounded-[34px] border-2"
        style={{
          borderColor: 'rgba(123,90,58,.4)',
          background: `radial-gradient(85% 75% at 50% 35%, ${tint}, rgba(255,250,235,.4) 82%)`,
        }}
      />
      {/* まちの モチーフ（木・サボテン・しろ など）を うすく ちらす */}
      {SCATTER.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute select-none"
          style={{ left: s.x, top: s.y, fontSize: s.s, opacity: 0.26, transform: 'translate(-50%,-50%)' }}
          aria-hidden
        >
          {zone.wall}
        </span>
      ))}
      {/* 道（破線トレイル）*/}
      <svg className="pointer-events-none absolute inset-0" width={TOWN_W} height={TOWN_H} aria-hidden>
        <path d={trail} fill="none" stroke={SEPIA} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 13" opacity={0.55} />
      </svg>
      {/* でぐち（つぎの まちへの もん）*/}
      <div className="absolute flex flex-col items-center" style={{ left: TOWN_EXIT.x, top: TOWN_EXIT.y, transform: 'translate(-50%,-50%)' }}>
        <span className="text-3xl" style={{ filter: allCleared ? 'none' : 'grayscale(.6)', opacity: allCleared ? 1 : 0.55 }}>⛩️</span>
      </div>
      {/* 宿場（封蝋スタンプ）*/}
      {stops.map((s, li) => (
        <MapStop key={s.q.id} stop={s} x={STOPS[li].x} y={STOPS[li].y} onSelect={onSelect} />
      ))}
      {/* ペンギン（いまここ）。クリアすると つぎの 宿場へ あるいて すすむ */}
      <motion.div
        className="pointer-events-none absolute z-10"
        style={{ transform: 'translate(-50%,-100%)' }}
        initial={false}
        animate={{ left: pawnPos.x, top: pawnPos.y + 4 }}
        transition={{ type: 'spring', stiffness: 70, damping: 15 }}
      >
        <motion.span
          className="block text-3xl"
          style={{ filter: 'drop-shadow(0 2px 1px rgba(0,0,0,.3))' }}
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: walking ? 0.4 : 1.4 }}
        >
          {charEmoji}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

/** 宿場（封蝋スタンプ）。状態で みためが かわる */
function MapStop({ stop, x, y, onSelect }: { stop: TownStop; x: number; y: number; onSelect: (index: number) => void }) {
  const { globalIndex, cleared, perfect, unlocked, isFrontier } = stop;
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
    content = '⛳';
  } else if (unlocked) {
    sealStyle = {
      background: 'radial-gradient(circle at 35% 30%, #fbf3df, #e7d3a8)',
      color: SEPIA,
      borderColor: 'rgba(90,55,20,.5)',
      boxShadow: '0 3px 0 rgba(90,55,20,.3), inset 0 2px 4px rgba(255,255,255,.3)',
    };
    content = globalIndex + 1;
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
      onClick={() => onSelect(globalIndex)}
      whileTap={unlocked ? { scale: 0.9 } : undefined}
      className="absolute flex items-center justify-center"
      style={{ left: x, top: y, width: 54, height: 54, transform: 'translate(-50%,-50%)' }}
      title={`もんだい ${globalIndex + 1}`}
    >
      <motion.span
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold"
        style={sealStyle}
        animate={isFrontier ? { scale: [1, 1.08, 1] } : {}}
        transition={isFrontier ? { repeat: Infinity, duration: 1.6 } : {}}
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
  if (quest.kind === 'branch') {
    return <BranchAdventurePlay quest={quest} index={index} charEmoji={charEmoji} onCleared={onCleared} onBack={onBack} />;
  }
  if (quest.kind === 'relative') {
    return <RelativeAdventurePlay quest={quest} index={index} charEmoji={charEmoji} onCleared={onCleared} onBack={onBack} />;
  }
  if (quest.kind === 'proc') {
    return <ProcAdventurePlay quest={quest} index={index} charEmoji={charEmoji} onCleared={onCleared} onBack={onBack} />;
  }

  const zone = getZone(quest.zoneId);
  const accent = ACCENT[zone.accent] ?? ACCENT.indigo;
  const theme = { wall: zone.wall, tile: zone.tile, wallTile: zone.wallTile, board: zone.board };

  const [commands, setCommands] = useState<Command[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [overlay, setOverlay] = useState<null | { perfect: boolean; earned: number }>(null);

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      const perfect = isPerfect(quest, result);
      const earned = addQuestClear(quest.id, perfect);
      speakJa(buildPraise(perfect));
      setHint(null);
      playSfx('fanfare');
      window.setTimeout(() => setOverlay({ perfect, earned }), 600);
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

      {/* やじるしパレット＝旅の どうぐばこ。loopOnly の たには ループ箱だけ つかえる */}
      <div
        className="relative z-10 flex flex-col items-center gap-2 rounded-2xl border-2 p-3"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}
      >
        {quest.loopOnly ? (
          <span className="text-xs font-bold" style={{ color: SEPIA }}>🔁 この たには ループ箱だけで すすむよ</span>
        ) : (
          <>
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
          </>
        )}
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
          <ClearOverlay quest={quest} perfect={overlay.perfect} earned={overlay.earned} onContinue={onCleared} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** 冒険モードの 分岐（もしも）問題 プレイ画面。1つ以上の フェーズ（ルール）を 穴埋めする */
function BranchAdventurePlay({
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
  const accent = ACCENT[zone.accent] ?? ACCENT.sky;
  const theme = { wall: zone.wall, tile: zone.tile, wallTile: zone.wallTile, board: zone.board };
  const wallName = zone.wallName ?? 'かべ';
  const fill = quest.branchFill!;

  type PhaseVals = { sensor: Dir | null; then: Dir | null; else: Dir | null };
  const [vals, setVals] = useState<PhaseVals[]>(() =>
    fill.phases.map((ph) => ({
      sensor: ph.rule.holeSensor ? null : ph.rule.sensor,
      then: ph.rule.holeThen ? null : ph.rule.thenDir,
      else: ph.rule.holeElse ? null : ph.rule.elseDir,
    })),
  );
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [overlay, setOverlay] = useState<null | { perfect: boolean; earned: number }>(null);

  const allFilled = vals.every((v) => v.sensor !== null && v.then !== null && v.else !== null);

  const program = useMemo<BranchCommand[]>(() => {
    if (!allFilled) return [];
    return buildBranchProgram(fill, (i) => ({
      sensor: vals[i].sensor!,
      thenDir: vals[i].then!,
      elseDir: vals[i].else!,
    }));
  }, [allFilled, vals, fill]);

  function setField(pi: number, field: keyof PhaseVals, d: Dir) {
    setVals((vs) => vs.map((v, i) => (i === pi ? { ...v, [field]: d } : v)));
    setHint(null);
  }

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      const perfect = isPerfect(quest, result);
      const earned = addQuestClear(quest.id, perfect);
      speakJa(buildPraise(perfect));
      setHint(null);
      playSfx('fanfare');
      window.setTimeout(() => setOverlay({ perfect, earned }), 600);
    } else {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      const h = buildBranchHint(quest, result, nextAttempt, wallName);
      setHint(h);
      speakJa(h);
    }
  }

  const runner = useProgramRunner<BranchCommand>(quest, handleFinish, runBranch);
  const canEdit = !runner.playing && !locked;

  function handleStart() {
    if (!canEdit || !allFilled) return;
    playSfx('tap');
    setHint(null);
    runner.play(program);
  }

  function handleStep() {
    if (!canEdit || !allFilled) return;
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
    const parts = fill.phases.map((ph) =>
      `「${DIR_ARROW[ph.rule.sensor]}に すすめなかったら ${DIR_ARROW[ph.rule.thenDir]}、すすめたら ${DIR_ARROW[ph.rule.elseDir]}」`,
    );
    const msg = parts.length > 1
      ? `${parts.join(' → つぎに ')} の じゅんに なるように うめてみよう！`
      : `${parts[0]} に なるように うめてみよう！`;
    setHint(msg);
    speakJa(msg);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-4 p-5" style={{ background: PARCHMENT }}>
      <ParchmentTexture />

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

      <div className="relative z-10 flex flex-col items-center">
        <Ribbon width={270}>
          <span className="text-base">{charEmoji} を {quest.goalEmoji ?? '⭐'} まで はこぼう！</span>
        </Ribbon>
        {quest.prompt && (
          <p className="mt-2 text-center text-sm font-bold" style={{ color: SEPIA }}>📜 {quest.prompt}</p>
        )}
      </div>

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
          theme={theme}
        />
      </div>

      {/* もしも ルール 穴埋めUI。フェーズが 2つなら ルールを 2つ ならべる */}
      <div
        className="relative z-10 flex w-full max-w-sm flex-col gap-2 rounded-2xl border-2 border-dashed p-3"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.7)' }}
      >
        <p className="text-center text-xs font-bold" style={{ color: SEPIA }}>
          {fill.phases.length > 1 ? '🔁 2つの ルールを じゅんばんに：' : '🔁'} あなを タップして うめよう
        </p>
        {fill.phases.map((ph, pi) => (
          <div key={pi} className="rounded-xl bg-white/50 px-2 py-2">
            {fill.phases.length > 1 && (
              <p className="mb-1 text-center text-[11px] font-bold" style={{ color: '#9a7c54' }}>
                {pi + 1}つめの ルール（🔁{ph.loopTimes}かい）
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-sm font-bold" style={{ color: SEPIA }}>
              <span>もし</span>
              <BranchBlankPicker
                value={vals[pi].sensor}
                isHole={!!ph.rule.holeSensor}
                onChange={(d) => setField(pi, 'sensor', d)}
                disabled={!canEdit}
                chipClass={accent.chip}
              />
              <span>に すすめなかったら</span>
              <BranchBlankPicker
                value={vals[pi].then}
                isHole={!!ph.rule.holeThen}
                onChange={(d) => setField(pi, 'then', d)}
                disabled={!canEdit}
                chipClass={accent.chip}
              />
              <span>、すすめたら</span>
              <BranchBlankPicker
                value={vals[pi].else}
                isHole={!!ph.rule.holeElse}
                onChange={(d) => setField(pi, 'else', d)}
                disabled={!canEdit}
                chipClass={accent.chip}
              />
            </div>
          </div>
        ))}
        <p className="text-center text-[11px]" style={{ color: 'rgba(123,90,58,.6)' }}>
          ？を タップすると むきが かわるよ（↑→↓←）
        </p>
      </div>

      <div className="relative z-10 flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canEdit || !allFilled}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40"
        >
          ▶ スタート
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={!canEdit || !allFilled}
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
        <div className="relative z-10 w-full max-w-sm">
          <HintBanner
            charEmoji={charEmoji}
            message={hint}
            onMoreHint={showMoreHint}
            moreHintLabel="ルールの ヒント"
          />
        </div>
      )}

      <AnimatePresence>
        {overlay && (
          <ClearOverlay quest={quest} perfect={overlay.perfect} earned={overlay.earned} onContinue={onCleared} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** 冒険モードの そうたい方向（ゆきのゾーン）問題 プレイ画面 */
function RelativeAdventurePlay({
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
  const accent = ACCENT[zone.accent] ?? ACCENT.sky;
  const theme = { wall: zone.wall, tile: zone.tile, wallTile: zone.wallTile, board: zone.board };

  type LoopBuild = { times: number; body: RelCommand[] };
  // 足場プリフィル: 最初から おいてある（こどもは けせない）ループ箱・矢印。のこりを たすだけ。
  const hasPrefill = !!quest.relPrefill;
  const lockedCmdLen = quest.relPrefill?.cmds?.length ?? 0;
  function freshScaffold(): { cmds: RelCommand[]; loop: LoopBuild[] } {
    const cmds = quest.relPrefill?.cmds ? [...quest.relPrefill.cmds] : [];
    const loop = quest.relPrefill?.openLoop
      ? [{ times: quest.relPrefill.openLoop.times, body: [...quest.relPrefill.openLoop.body] }]
      : [];
    return { cmds, loop };
  }
  const [cmds, setCmds] = useState<RelCommand[]>(() => freshScaffold().cmds);
  const [loopStack, setLoopStack] = useState<LoopBuild[]>(() => freshScaffold().loop);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [overlay, setOverlay] = useState<null | { perfect: boolean; earned: number }>(null);

  const maxSlots = quest.maxSlots ?? 12;
  // くりかえしの なかみは トップレベルの枠(maxSlots)とは別の generous な枠で 管理する。
  // loopOnly クエストは maxSlots が「ループ1個ぶん」で小さいので、そこに 縛らない。
  const maxBodyLen = 12;
  const runner = useProgramRunner<RelCommand>(quest, handleFinish, runRelative);
  const canEdit = !runner.playing && !locked;
  const inLoop = loopStack.length > 0;
  const innermost = loopStack[loopStack.length - 1];
  const bodyLen = innermost?.body.length ?? 0;
  const canAdd = canEdit && (inLoop ? bodyLen < maxBodyLen : cmds.length < maxSlots);
  const canAddLoop = canEdit && !!quest.allowLoop && loopStack.length < 2 && (
    loopStack.length === 0 ? cmds.length < maxSlots : bodyLen < maxBodyLen
  );

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      // ぴったり賞（💎）は ならべた ブロック数 === optimal で 判定する。
      // ループ/ネストに まとめると ブロックが へって ダイヤが もらえる（展開後ステップ数では ない）。
      const perfect = isPerfectByBlocks(quest, result, cmds.length);
      const earned = addQuestClear(quest.id, perfect);
      speakJa(buildPraise(perfect));
      setHint(null);
      playSfx('fanfare');
      window.setTimeout(() => setOverlay({ perfect, earned }), 600);
    } else {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      const h = buildRelativeHint(quest, result, nextAttempt);
      setHint(h);
      speakJa(h);
    }
  }

  function addCmd(c: RelDir) {
    if (!canAdd) return;
    playSfx('tap');
    if (inLoop) {
      setLoopStack(stack => {
        const ns = [...stack];
        const last = ns[ns.length - 1];
        ns[ns.length - 1] = { ...last, body: [...last.body, c] };
        return ns;
      });
    } else {
      setCmds(cs => [...cs, c]);
      setHint(null);
    }
  }
  function addLoop(times: number) {
    if (!canAddLoop) return;
    playSfx('tap');
    setLoopStack(stack => [...stack, { times, body: [] }]);
    setHint(null);
  }
  function finishLoop() {
    if (!inLoop) return;
    playSfx('tap');
    setLoopStack(stack => {
      const ns = [...stack];
      const finished = ns.pop()!;
      if (finished.body.length === 0) return ns;
      const loop: RelLoop = { kind: 'loop', times: finished.times, body: finished.body };
      if (ns.length === 0) {
        setCmds(cs => [...cs, loop]);
      } else {
        const last = ns[ns.length - 1];
        ns[ns.length - 1] = { ...last, body: [...last.body, loop] };
      }
      return ns;
    });
  }
  function removeAt(i: number) {
    if (!canEdit || inLoop) return;
    if (i < lockedCmdLen) return; // 足場（最初から ある ぶん）は けせない
    playSfx('tap');
    setCmds(cs => cs.filter((_, j) => j !== i));
  }
  function handleStart() {
    if (!canEdit || cmds.length === 0 || inLoop) return;
    playSfx('tap');
    setHint(null);
    runner.play(cmds);
  }
  function handleStep() {
    if (!canEdit || cmds.length === 0 || inLoop) return;
    playSfx('tap');
    runner.step(cmds);
  }
  function handleReset() {
    if (locked) return;
    playSfx('tap');
    runner.reset();
    // 足場プリフィルが あれば その状態へ もどす（けせない 足場を 失わない）。
    if (hasPrefill) {
      const f = freshScaffold();
      setCmds(f.cmds);
      setLoopStack(f.loop);
    } else {
      setLoopStack([]);
    }
    setHint(null);
  }
  function handleClearAll() {
    if (!canEdit) return;
    playSfx('tap');
    const f = freshScaffold();
    setCmds(f.cmds);
    setLoopStack(f.loop);
    runner.reset();
    setHint(null);
  }
  function showMoreHint() {
    const sol = quest.relSolution ?? solveRelative(quest);
    if (sol && sol.length > 0) {
      const first = sol[0];
      const firstLabel = typeof first === 'string' ? REL_LABEL[first] : `ループ(×${first.times})`;
      const msg = `さいしょは 「${firstLabel}」から はじめると いいかも！`;
      setHint(msg);
      speakJa(msg);
    }
  }

  // 完成した RelCommand の 再帰レンダラー
  function renderRelCmd(c: RelCommand, key: number | string): ReactNode {
    if (typeof c === 'string') {
      return (
        <span key={key} className={`rounded px-1 py-0.5 text-sm font-bold text-white ${accent.chip}`}>
          {REL_ICON[c]}
        </span>
      );
    }
    return (
      <div key={key} className={`flex items-center gap-0.5 rounded-lg border-2 ${accent.border} bg-white/40 px-1 py-0.5`}>
        <span className="text-[9px] font-bold" style={{ color: '#7a5a3a' }}>🔁×{c.times}</span>
        {c.body.map((bc, bi) => renderRelCmd(bc, bi))}
      </div>
    );
  }

  // 組み立て中のループスタックを ネスト表示
  function renderLoopBuilding(depth: number): ReactNode {
    if (depth >= loopStack.length) return null;
    const lv = loopStack[depth];
    const isInnermost = depth === loopStack.length - 1;
    return (
      <div className={`flex flex-wrap items-center gap-0.5 rounded-xl border-2 ring-2 ring-white ring-offset-1 ${accent.border} bg-white/80 px-1.5 py-0.5`}>
        <span className="text-[10px] font-bold mr-0.5" style={{ color: '#7a5a3a' }}>🔁×{lv.times}</span>
        {lv.body.map((bc, bi) => renderRelCmd(bc, bi))}
        {!isInnermost && renderLoopBuilding(depth + 1)}
        {isInnermost && lv.body.length < maxBodyLen && (
          <span className="rounded border border-dashed border-gray-300 px-1 py-0.5 text-sm text-gray-300">？</span>
        )}
      </div>
    );
  }

  const loopDepthLabel = loopStack.length >= 2 ? 'ネストループ' : 'ループ';

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-4 p-5" style={{ background: PARCHMENT }}>
      <ParchmentTexture />

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

      <div className="relative z-10 flex flex-col items-center">
        <Ribbon width={270}>
          <span className="text-base">{charEmoji} を {quest.goalEmoji ?? '🏔️'} まで はこぼう！</span>
        </Ribbon>
        {quest.prompt && (
          <p className="mt-2 text-center text-sm font-bold" style={{ color: SEPIA }}>📜 {quest.prompt}</p>
        )}
        <p className="mt-1 text-center text-[11px] font-bold" style={{ color: '#9a7c54' }}>
          💡 「みぎ」「ひだり」は キャラの めの まえ から みた むき！
        </p>
        {hasPrefill && !locked && (
          <p className="mt-1 text-center text-[11px] font-bold text-violet-700">
            🔧 ループ箱は もう おいてあるよ！ ？の ところに のこりの やじるしを たして「✅ かんりょう」しよう
          </p>
        )}
      </div>

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
          charFacing={runner.charFacing}
          trail={runner.trail}
          collected={runner.collected}
          blockedCell={runner.blockedCell}
          theme={theme}
        />
      </div>

      {/* くみたてた めいれい */}
      <div
        className="relative z-10 flex min-h-[52px] w-full max-w-sm flex-wrap items-center gap-1 rounded-2xl border-2 border-dashed p-2"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}
      >
        {cmds.length === 0 && !inLoop ? (
          <span className="px-2 text-sm" style={{ color: 'rgba(123,90,58,.5)' }}>ここに めいれいが ならぶよ</span>
        ) : (
          <>
            {cmds.map((c, i) => {
              const isLocked = i < lockedCmdLen;
              return (
                <span
                  key={i}
                  onClick={() => removeAt(i)}
                  style={{ cursor: isLocked || inLoop ? 'default' : 'pointer' }}
                  title={isLocked ? 'これは さいしょから あるよ' : undefined}
                  className={isLocked ? 'opacity-90' : undefined}
                >
                  {isLocked && <span className="mr-0.5 text-[9px]">🔒</span>}
                  {renderRelCmd(c, i)}
                </span>
              );
            })}
            {inLoop && renderLoopBuilding(0)}
          </>
        )}
      </div>
      <p className="relative z-10 text-xs" style={{ color: '#9a7c54' }}>
        {inLoop
          ? `${loopDepthLabel}の なかみを えらんでね（のこり ${maxBodyLen - bodyLen}）`
          : `めいれいを タップすると けせるよ（のこり ${maxSlots - cmds.length}）`}
      </p>

      {/* そうたい方向 どうぐばこ */}
      <div
        className="relative z-10 flex flex-col items-center gap-2 rounded-2xl border-2 p-3"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}
      >
        <div className="flex items-center justify-center gap-2">
          {(['turn_left', 'forward', 'turn_right'] as RelDir[]).map((c) => (
            <motion.button
              key={c}
              type="button"
              onClick={() => addCmd(c)}
              whileTap={{ scale: 0.9 }}
              disabled={!canAdd}
              className={`flex h-16 w-20 flex-col items-center justify-center rounded-2xl ${accent.chip} font-bold text-white shadow-md disabled:opacity-40`}
            >
              <span className="text-2xl">{REL_ICON[c]}</span>
              <span className="text-[10px]">{REL_LABEL[c]}</span>
            </motion.button>
          ))}
          {inLoop && (
            <motion.button
              type="button"
              onClick={finishLoop}
              whileTap={{ scale: 0.9 }}
              className="flex h-16 w-20 flex-col items-center justify-center rounded-2xl bg-amber-500 font-bold text-white shadow-md"
            >
              <span className="text-2xl">✅</span>
              <span className="text-[10px]">かんりょう</span>
            </motion.button>
          )}
        </div>
        {canAddLoop && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold" style={{ color: '#9a7c54' }}>
              {loopStack.length >= 1 ? 'ネスト→' : 'ループ→'}
            </span>
            {([2, 3, 4, 5] as const).map((n) => (
              <motion.button
                key={n}
                type="button"
                onClick={() => addLoop(n)}
                whileTap={{ scale: 0.9 }}
                disabled={!canAddLoop}
                className={`flex h-12 w-14 flex-col items-center justify-center rounded-2xl border-2 ${accent.border} ${accent.soft} font-bold ${accent.text} shadow-sm disabled:opacity-40`}
              >
                <span className="text-base">🔁</span>
                <span className="text-[10px]">×{n}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canEdit || cmds.length === 0 || inLoop}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40"
        >
          ▶ スタート
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={!canEdit || cmds.length === 0 || inLoop}
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
          disabled={!canEdit || (cmds.length === 0 && !inLoop)}
          className="rounded-2xl bg-rose-300 px-3 py-3 text-base font-bold text-white shadow-[0_4px_0_#9f1239] active:translate-y-1 disabled:opacity-40"
          title="めいれいを ぜんぶ けす"
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
            moreHintLabel="さいしょの 1つ"
          />
        </div>
      )}

      <AnimatePresence>
        {overlay && (
          <ClearOverlay quest={quest} perfect={overlay.perfect} earned={overlay.earned} onContinue={onCleared} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** そうたい方向単元の 前向きヒント */
function buildRelativeHint(quest: AdventureQuest, result: RunResult, attempt: number): string {
  const isLoop = !!quest.allowLoop;
  if (result.blockedStep >= 0) {
    if (attempt <= 1) {
      return isLoop
        ? `かべに あたって とまっちゃった！\nループの なかみを みなおしてみよう。`
        : `かべに あたって とまっちゃった！\nキャラは いま どっちを むいているかな？`;
    }
    return `すすむ さきに かべが あるよ。\n「みぎをむく」「ひだりをむく」で むきを かえてから すすんでみよう。`;
  }
  const gem = quest.gemEmoji ?? '⭐';
  if (result.missedGems > 0) {
    return `${gem}を あと ${result.missedGems}こ とおりたいね。\n${gem}を とおる みちを かんがえてみよう。`;
  }
  const dist = Math.abs(result.finalPos.r - quest.goal.r) + Math.abs(result.finalPos.c - quest.goal.c);
  if (dist > 0) {
    if (attempt <= 1) {
      return isLoop
        ? `ゴールまで あと ${dist}マス！\nループの かいすうや なかみを たしかめよう。`
        : `ゴールまで あと ${dist}マス！\nキャラの むきを よく みて、まえへ すすもう。`;
    }
    return `ゴールは いまの ばしょから どっちかな？\nさきに むきを かえてから まえへ すすむと いいよ。`;
  }
  return 'おしい！ もういちど みちを みなおしてみよう。';
}

// ─────────────────────── ProcAdventurePlay（てじゅん 単元）───────────────────────

function ProcAdventurePlay({
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
  const accent = ACCENT[zone.accent] ?? ACCENT.amber;
  const theme = { wall: zone.wall, tile: zone.tile, wallTile: zone.wallTile, board: zone.board };

  // proc_b: procMain は fixed。プレイヤーは procBody を きめる
  // proc_a: procDef は fixed。プレイヤーは mainCmds を つくる
  const isProcB = !!quest.procMain;

  // 足場プリフィル（proc_a のみ）: メインプログラムの 先頭を ロックして 最初から おいておく。
  const procPrefill = !isProcB ? quest.procMainPrefill : undefined;
  const lockedMainLen = procPrefill?.length ?? 0;
  const hasProcPrefill = lockedMainLen > 0;
  const [mainCmds, setMainCmds] = useState<ProcMainCmd[]>(() => (procPrefill ? [...procPrefill] : []));
  const [procBody, setProcBody] = useState<RelDir[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [overlay, setOverlay] = useState<null | { perfect: boolean; earned: number }>(null);

  const maxSlots = quest.maxSlots ?? 6;
  const runner = useProgramRunner<RelDir>(quest, handleFinish, runRelative);
  const canEdit = !runner.playing && !locked;

  const activeCmds = isProcB ? procBody : mainCmds;
  const canAdd = activeCmds.length < maxSlots && canEdit;

  function handleFinish(result: RunResult) {
    if (isCleared(result)) {
      setLocked(true);
      playSfx('correct');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      // ぴったり賞（💎）は ならべた ブロック数 === optimal で 判定する。
      // proc_a は main の めいれい数、proc_b は てじゅんの なかみの 数（＝つかった ブロック）。
      const usedBlocks = isProcB ? procBody.length : mainCmds.length;
      const perfect = isPerfectByBlocks(quest, result, usedBlocks);
      const earned = addQuestClear(quest.id, perfect);
      speakJa(buildPraise(perfect));
      setHint(null);
      playSfx('fanfare');
      window.setTimeout(() => setOverlay({ perfect, earned }), 600);
    } else {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      const h = buildProcHint(quest, result, nextAttempt, isProcB);
      setHint(h);
      speakJa(h);
    }
  }

  function addRelDir(c: RelDir) {
    if (!canAdd) return;
    playSfx('tap');
    if (isProcB) setProcBody((cs) => [...cs, c]);
    else setMainCmds((cs) => [...cs, c]);
    setHint(null);
  }
  function addCall() {
    if (!isProcB && canAdd) {
      playSfx('tap');
      setMainCmds((cs) => [...cs, { kind: 'call' }]);
      setHint(null);
    }
  }
  function removeAt(i: number) {
    if (!canEdit) return;
    if (!isProcB && i < lockedMainLen) return; // 足場（最初から ある ぶん）は けせない
    playSfx('tap');
    if (isProcB) setProcBody((cs) => cs.filter((_, j) => j !== i));
    else setMainCmds((cs) => cs.filter((_, j) => j !== i));
  }
  function handleStart() {
    if (!canEdit || activeCmds.length === 0) return;
    playSfx('tap');
    setHint(null);
    const expanded = isProcB
      ? expandProc(quest.procMain!, procBody)
      : expandProc(mainCmds, quest.procDef!);
    runner.play(expanded);
  }
  function handleStep() {
    if (!canEdit || activeCmds.length === 0) return;
    playSfx('tap');
    const expanded = isProcB
      ? expandProc(quest.procMain!, procBody)
      : expandProc(mainCmds, quest.procDef!);
    runner.step(expanded);
  }
  function handleReset() {
    if (locked) return;
    playSfx('tap');
    runner.reset();
    setHint(null);
  }
  function handleClearAll() {
    if (!canEdit) return;
    playSfx('tap');
    if (isProcB) setProcBody([]);
    else setMainCmds(procPrefill ? [...procPrefill] : []); // 足場までは もどす
    runner.reset();
    setHint(null);
  }

  // ── 固定プログラムの レンダリング用ヘルパー ──
  function renderFixedCmds(cmds: ProcMainCmd[]) {
    return cmds.map((c, i) => (
      <span key={i} className={`inline-flex items-center rounded-lg ${accent.chip} px-2 py-1 text-sm font-bold text-white`}>
        {typeof c === 'string' ? REL_ICON[c] : CALL_ICON}
      </span>
    ));
  }

  // ── 編集中のプログラムのレンダリング ──
  function renderActiveCmds() {
    if (activeCmds.length === 0) {
      return <span className="px-2 text-sm" style={{ color: 'rgba(123,90,58,.5)' }}>ここに めいれいを おいてね</span>;
    }
    return activeCmds.map((c, i) => {
      const isLocked = !isProcB && i < lockedMainLen;
      return (
        <button key={i} type="button" onClick={() => removeAt(i)}
          title={isLocked ? 'これは さいしょから あるよ' : undefined}
          className={`rounded-lg ${accent.chip} px-2 py-1 text-lg font-bold text-white shadow-sm ${isLocked ? 'opacity-90' : ''}`}>
          {isLocked && <span className="mr-0.5 text-[9px]">🔒</span>}
          {typeof c === 'string' ? REL_ICON[c] : CALL_ICON}
        </button>
      );
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-4 p-5" style={{ background: PARCHMENT }}>
      <ParchmentTexture />

      <div className="relative z-10 flex w-full max-w-sm items-center justify-between pr-12">
        <button type="button" onClick={onBack}
          className="rounded-xl border-[1.5px] px-3 py-2 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.5)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}>
          ← ちずへ
        </button>
        <span className="text-sm font-bold" style={{ color: SEPIA }}>もんだい {index + 1} / {ADVENTURE_QUEST.length}</span>
        <span className={`rounded-full ${accent.chip} px-2.5 py-1 text-xs font-bold text-white shadow-sm`}>
          {zone.emoji} {zone.name}
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Ribbon width={270}>
          <span className="text-base">{charEmoji} を {quest.goalEmoji ?? '🎯'} まで はこぼう！</span>
        </Ribbon>
        {quest.prompt && (
          <p className="mt-2 text-center text-sm font-bold" style={{ color: SEPIA }}>📜 {quest.prompt}</p>
        )}
        {hasProcPrefill && !locked && (
          <p className="mt-1 text-center text-[11px] font-bold text-orange-700">
            🔧 はじめの ぶんは もう おいてあるよ！ のこりを たして ゴールへ
          </p>
        )}
      </div>

      <div className="relative z-10 rounded-2xl border-2 p-2 shadow-md"
        style={{ borderColor: 'rgba(123,90,58,.45)', background: 'rgba(255,250,235,.5)' }}>
        <ProgrammingGrid level={quest} charEmoji={charEmoji}
          charPos={runner.charPos} charFacing={runner.charFacing}
          trail={runner.trail} collected={runner.collected}
          blockedCell={runner.blockedCell} theme={theme} />
      </div>

      {/* 固定プログラム（proc_a: てじゅん定義 / proc_b: メインプログラム）*/}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border-2 p-2"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}>
        <p className="mb-1 text-[10px] font-bold" style={{ color: '#9a7c54' }}>
          {isProcB ? '📋 メインプログラム（かえられないよ）' : `📦 ${CALL_LABEL} の 中身（かえられないよ）`}
        </p>
        <div className="flex flex-wrap gap-1">
          {isProcB ? renderFixedCmds(quest.procMain!) : quest.procDef!.map((c, i) => (
            <span key={i} className={`inline-flex items-center rounded-lg ${accent.chip} px-2 py-1 text-sm font-bold text-white`}>
              {REL_ICON[c]}
            </span>
          ))}
        </div>
      </div>

      {/* 編集エリア（proc_a: メインプログラム / proc_b: てじゅん本体）*/}
      <div className="relative z-10 flex min-h-[52px] w-full max-w-sm flex-wrap items-center gap-1 rounded-2xl border-2 border-dashed p-2"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}>
        {renderActiveCmds()}
      </div>
      <p className="relative z-10 text-xs" style={{ color: '#9a7c54' }}>
        {isProcB ? `てじゅんの なかみ（のこり ${maxSlots - procBody.length}）` : `メインプログラム（のこり ${maxSlots - mainCmds.length}）`}
        　タップで けせるよ
      </p>

      {/* パレット */}
      <div className="relative z-10 flex flex-col items-center gap-2 rounded-2xl border-2 p-3"
        style={{ borderColor: 'rgba(123,90,58,.4)', background: 'rgba(255,250,235,.55)' }}>
        <div className="flex items-center justify-center gap-2">
          {(['turn_left', 'forward', 'turn_right'] as RelDir[]).map((c) => (
            <motion.button key={c} type="button" onClick={() => addRelDir(c)}
              whileTap={{ scale: 0.9 }} disabled={!canAdd}
              className={`flex h-16 w-20 flex-col items-center justify-center rounded-2xl ${accent.chip} font-bold text-white shadow-md disabled:opacity-40`}>
              <span className="text-2xl">{REL_ICON[c]}</span>
              <span className="text-[10px]">{REL_LABEL[c]}</span>
            </motion.button>
          ))}
          {!isProcB && (
            <motion.button type="button" onClick={addCall}
              whileTap={{ scale: 0.9 }} disabled={!canAdd}
              className={`flex h-16 w-20 flex-col items-center justify-center rounded-2xl bg-amber-500 font-bold text-white shadow-md disabled:opacity-40`}>
              <span className="text-2xl">{CALL_ICON}</span>
              <span className="text-[10px]">{CALL_LABEL}</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-sm gap-2">
        <button type="button" onClick={handleStart}
          disabled={!canEdit || activeCmds.length === 0}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-lg font-bold text-white shadow-[0_4px_0_#15803d] active:translate-y-1 disabled:opacity-40">
          ▶ スタート
        </button>
        <button type="button" onClick={handleStep}
          disabled={!canEdit || activeCmds.length === 0}
          className="rounded-2xl bg-sky-400 px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#0369a1] active:translate-y-1 disabled:opacity-40">
          👣 1コマ
        </button>
        <button type="button" onClick={handleReset} disabled={locked}
          className="rounded-2xl bg-amber-400 px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#b45309] active:translate-y-1 disabled:opacity-40">
          ↺
        </button>
        <button type="button" onClick={handleClearAll}
          disabled={!canEdit || activeCmds.length === 0}
          className="rounded-2xl bg-rose-300 px-3 py-3 text-base font-bold text-white shadow-[0_4px_0_#9f1239] active:translate-y-1 disabled:opacity-40">
          🗑️
        </button>
      </div>

      {hint && (
        <div className="relative z-10 w-full max-w-sm">
          <HintBanner charEmoji={charEmoji} message={hint} />
        </div>
      )}

      <AnimatePresence>
        {overlay && (
          <ClearOverlay quest={quest} perfect={overlay.perfect} earned={overlay.earned} onContinue={onCleared} />
        )}
      </AnimatePresence>
    </div>
  );
}

function buildProcHint(quest: AdventureQuest, result: RunResult, attempt: number, isProcB: boolean): string {
  if (result.blockedStep >= 0) {
    return isProcB
      ? `かべに あたって とまっちゃった！\nてじゅんの なかみを かえてみよう。`
      : `かべに あたって とまっちゃった！\nてじゅんを よびだす ばしょを みなおしてみよう。`;
  }
  const gem = quest.gemEmoji ?? '⭐';
  if (result.missedGems > 0) {
    return `${gem}が まだ とれてないね。\n${gem}を とおるように みちを かんがえよう。`;
  }
  const dist = Math.abs(result.finalPos.r - quest.goal.r) + Math.abs(result.finalPos.c - quest.goal.c);
  if (dist > 0) {
    if (attempt <= 1) {
      return isProcB
        ? `ゴールまで あと ${dist}マス！\nてじゅんが なんマス すすむか かんがえよう。`
        : `ゴールまで あと ${dist}マス！\nてじゅんを よびだす かいすうを かんがえよう。`;
    }
    return `ゴールは いまより ${dist}マス さきだよ。\nてじゅんを うまく つかって とどけてみよう。`;
  }
  return 'おしい！ もういちど かんがえてみよう。';
}

/**
 * 穴埋め用の むきピッカー。
 * isHole=true のとき：まだ うめていなければ ？ を出し、タップで むきを えらべる。
 * isHole=false のとき：固定表示（タップ不可）。
 */
function BranchBlankPicker({
  value,
  isHole,
  onChange,
  disabled,
  chipClass,
}: {
  value: Dir | null;
  isHole: boolean;
  onChange: (d: Dir) => void;
  disabled: boolean;
  chipClass: string;
}) {
  const order: Dir[] = ['up', 'right', 'down', 'left'];
  function cycle() {
    if (disabled || !isHole) return;
    playSfx('tap');
    if (value == null) onChange('up');
    else onChange(order[(order.indexOf(value) + 1) % order.length]);
  }
  if (!isHole) {
    return (
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-2xl font-bold text-white ${chipClass}`}>
        {value != null ? DIR_ARROW[value] : '?'}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      className={`h-10 w-10 rounded-lg text-2xl font-bold shadow-sm disabled:opacity-40 ${
        value == null ? 'bg-amber-200 text-amber-700' : `${chipClass} text-white`
      }`}
    >
      {value == null ? '？' : DIR_ARROW[value]}
    </button>
  );
}

/** クリア演出。ゾーンクリアや「あと○問で つぎのまち」を 予告する */
function ClearOverlay({ quest, perfect, earned, onContinue }: { quest: AdventureQuest; perfect: boolean; earned: number; onContinue: () => void }) {
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
      ? `🏁 ${zone.name} クリア！ つぎは ${nextZone.emoji} ${nextZone.name} へ しゅっぱつ！`
      : `🏁 ${zone.name} クリア！`;
  } else {
    preview = `あと ${remaining}もんで ${zone.emoji} ${zone.name} クリア！`;
  }

  // ぴったり賞 いがいで クリアした問題は、もう いちど とくと ぴったり賞＆きらきらが もらえる
  const replayHint = !perfect
    ? 'もう いちど とくと ✨が ふえるよ。ぴったり賞も ねらってみよう！'
    : 'ぴったりの みちを みつけたね！ ほかの もんだいにも ちょうせんしよう。';

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
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: [0.6, 1.25, 1] }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 text-lg font-bold text-amber-500"
        >
          ✨ +{earned} きらきら ゲット！
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 text-base font-bold text-indigo-700"
        >
          {preview}
        </motion.p>
        <p className="mt-2 text-xs font-bold text-rose-500">{replayHint}</p>
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
