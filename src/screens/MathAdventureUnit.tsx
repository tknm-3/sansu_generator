import { useEffect, useCallback, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { BattleButtons } from '../components/BattleButtons';
import { ShapeSvg } from '../components/shapes/ShapeSvg';
import { ComposeSvg, PatternSequence, PatternIcon, SpatialScene } from '../components/shapes/ShapeVisuals';
import { GroupsVisual } from '../components/GroupsVisual';
import { NumberLineVisual } from '../components/NumberLineVisual';
import { NumberLinePlacement } from '../components/NumberLinePlacement';
import { TenFrameSum } from '../components/TenFrameSum';
import { EstimatePile } from '../components/EstimatePile';
import { DivideVisual } from '../components/DivideVisual';
import { StepExplainer } from '../components/StepExplainer';
import { MATH_ADVENTURE_ZONES, getZone } from '../lib/adventure/zones';
import { generateMap, getNode } from '../lib/adventure/mapGen';
import { generateBattleQuestion } from '../lib/adventure/adapters';
import {
  makeInitialRun,
  saveRun,
  clearRun,
  recordZoneClear,
  zoneStatus,
  calcSparkles,
  loadHistory,
} from '../lib/adventure/progress';
import type { AdventureMap, RunState, BattleQuestion, MapNode } from '../lib/adventure/types';

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const PAPER = 'radial-gradient(125% 85% at 50% -10%, #fbf3df 0%, #f1e3c2 46%, #e7d3a8 100%)';
const SEPIA = '#7a5a3a';
const ZONE_IDS = MATH_ADVENTURE_ZONES.map((z) => z.id);

function LibraryTexture() {
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply" style={{ opacity: 0.08 }} aria-hidden>
        <filter id="lib-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lib-grain)" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 80px 20px rgba(120,80,30,.30), inset 0 0 20px 5px rgba(90,55,20,.18)' }}
        aria-hidden
      />
    </>
  );
}

function Ribbon({ children, width = 260 }: { children: ReactNode; width?: number }) {
  return (
    <div className="relative" style={{ width }}>
      <span className="absolute left-[-7px] top-3 h-4 w-4 rotate-45 bg-[#7e2a1a]" aria-hidden />
      <span className="absolute right-[-7px] top-3 h-4 w-4 rotate-45 bg-[#7e2a1a]" aria-hidden />
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

// ─── Hub (本棚) ────────────────────────────────────────────────────────────────

function HubScreen({ characterName, charEmoji, onSelectZone, onBack }: {
  characterName: string;
  charEmoji: string;
  onSelectZone: (zoneIndex: number) => void;
  onBack: () => void;
}) {
  const history = loadHistory();
  const clearedCount = history.zones.length;
  const total = MATH_ADVENTURE_ZONES.length;
  const percent = Math.round((clearedCount / total) * 100);

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: PAPER }}>
      <LibraryTexture />
      <div className="relative z-10 flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-[1.5px] px-3 py-2 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.5)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}
        >
          ← もどる
        </button>
        <span className="text-sm font-bold" style={{ color: SEPIA }}>
          🔖 {clearedCount} / {total}さつ
        </span>
      </div>

      <div className="relative z-10 mt-3 flex flex-col items-center gap-1 px-4">
        <Ribbon width={300}>
          <span className="text-lg">📚 ふしぎな だいとしょかん</span>
        </Ribbon>
        <p className="mt-1 text-sm font-bold" style={{ color: '#9a7c54' }}>
          {charEmoji} {characterName}さん、ようこそ！
        </p>
        <p className="text-xs font-bold" style={{ color: SEPIA }}>
          えほんを えらんで ぼうけんに でかけよう
        </p>
      </div>

      <div className="relative z-10 mt-3 px-6 w-full max-w-md mx-auto">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold" style={{ color: SEPIA }}>
          <span>🗺️ よんだ えほん</span>
          <span>{clearedCount}/{total}さつ・{percent}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border"
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

      <div className="relative z-10 mt-4 flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {MATH_ADVENTURE_ZONES.map((zone, i) => {
            const status = zoneStatus(i, ZONE_IDS);
            const unlocked = status !== 'locked';
            const isCurrent = status === 'current';
            const isNew = status === 'new';
            return (
              <motion.button
                key={zone.id}
                type="button"
                disabled={!unlocked}
                onClick={() => { playSfx('tap'); onSelectZone(i); }}
                whileTap={unlocked ? { scale: 0.94 } : {}}
                animate={isCurrent ? { scale: [1, 1.03, 1] } : {}}
                transition={isCurrent ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
                className="relative rounded-2xl p-4 pt-5 text-left overflow-hidden"
                style={{
                  background: unlocked
                    ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.9), rgba(255,245,220,.8))'
                    : 'rgba(231,211,168,.5)',
                  border: isCurrent
                    ? '2px solid #d98a1f'
                    : isNew
                      ? '2px dashed #2f9e74'
                      : `2px solid ${unlocked ? 'rgba(123,90,58,.45)' : 'rgba(123,90,58,.2)'}`,
                  boxShadow: isCurrent
                    ? '0 0 0 3px rgba(217,138,31,.35), 0 3px 0 rgba(90,55,20,.25)'
                    : isNew
                      ? '0 0 0 3px rgba(47,158,116,.28), 0 3px 0 rgba(90,55,20,.2)'
                      : unlocked
                        ? '0 3px 0 rgba(90,55,20,.25), inset 0 1px 0 rgba(255,255,255,.6)'
                        : 'none',
                  // クリア済みは すこし おちつかせ、まだの章を めだたせる
                  opacity: !unlocked ? 0.55 : status === 'cleared' ? 0.82 : 1,
                }}
              >
                <div className="text-3xl mb-1">{unlocked ? zone.emoji : '🔒'}</div>
                <div className="text-xs font-bold leading-tight" style={{ color: SEPIA }}>{zone.name}</div>
                {zone.tagline && unlocked && (
                  <div className="mt-0.5 text-[10px]" style={{ color: '#9a7c54' }}>{zone.tagline}</div>
                )}
                {/* じょうたいバッジ：よんだ✓ / つづき👉 / まだ🆕 が 一目で わかる */}
                {status === 'cleared' && (
                  <span
                    className="absolute top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                    style={{ background: '#9a7c54' }}
                  >
                    ✓ よんだ
                  </span>
                )}
                {isCurrent && (
                  <motion.span
                    className="absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow"
                    style={{ background: '#d98a1f' }}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    👉 つづき
                  </motion.span>
                )}
                {isNew && (
                  <>
                    {/* 左上に めだつ おびバッジ＋ぴょこぴょこ */}
                    <motion.span
                      className="absolute -left-7 top-2 rotate-[-30deg] px-7 py-0.5 text-[10px] font-extrabold text-white shadow"
                      style={{ background: '#2f9e74' }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      🆕 まだ
                    </motion.span>
                    <motion.span
                      className="absolute bottom-1.5 right-1.5 text-base"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ✨
                    </motion.span>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

const MAP_W = 320;
const MAP_H = 440;

const NODE_KIND_EMOJI: Record<string, string> = {
  battle: '⚔️', treasure: '🎁', rest: '⛺', boss: '👑', mimic: '🎭',
};

const SCATTER: { x: number; y: number; s: number }[] = [
  { x: 60, y: 55, s: 22 }, { x: 260, y: 75, s: 18 }, { x: 30, y: 190, s: 20 },
  { x: 295, y: 210, s: 16 }, { x: 160, y: 165, s: 18 }, { x: 80, y: 335, s: 20 },
  { x: 240, y: 355, s: 22 }, { x: 160, y: 400, s: 16 }, { x: 140, y: 38, s: 14 },
];

function nodePos(node: MapNode, maxLayer: number): { x: number; y: number } {
  const padTop = 44;
  const padBot = 44;
  const y = MAP_H - padBot - (node.layer / maxLayer) * (MAP_H - padTop - padBot);
  const x = node.branch === -1 ? MAP_W / 2 : node.branch === 0 ? MAP_W * 0.28 : MAP_W * 0.72;
  return { x, y };
}

function trailD(fp: { x: number; y: number }, tp: { x: number; y: number }): string {
  const my = (fp.y + tp.y) / 2;
  return `M ${fp.x} ${fp.y} C ${fp.x} ${my} ${tp.x} ${my} ${tp.x} ${tp.y}`;
}

function MapScreen({ map, run, zone, charEmoji, onSelectNode, onBack }: {
  map: AdventureMap;
  run: RunState;
  zone: ReturnType<typeof getZone>;
  charEmoji: string;
  onSelectNode: (nodeId: string) => void;
  onBack: () => void;
}) {
  const { nodes } = map;
  const maxLayer = Math.max(...nodes.map((n) => n.layer));
  const tint = zone.tint ?? 'rgba(123,90,58,.20)';

  const edges: { from: MapNode; to: MapNode }[] = [];
  for (const n of nodes) {
    for (const nextId of n.nextIds) {
      const to = nodes.find((m) => m.id === nextId);
      if (to) edges.push({ from: n, to });
    }
  }

  function isReachable(nodeId: string): boolean {
    const isCurrent = run.currentNodeId === nodeId;
    if (isCurrent && !run.visitedIds.includes(nodeId)) return true;
    const cur = nodes.find((n) => n.id === run.currentNodeId);
    return !!cur && run.visitedIds.includes(cur.id) && cur.nextIds.includes(nodeId);
  }

  const pawnNode = nodes.find((n) => n.id === run.currentNodeId) ?? nodes[0];
  const pawnP = nodePos(pawnNode, maxLayer);

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: PAPER }}>
      <LibraryTexture />
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pr-16">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-[1.5px] px-3 py-2 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.5)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}
        >
          ← としょかん
        </button>
        <div className="flex gap-1 shrink-0">
          {Array.from({ length: run.maxHp }).map((_, i) => (
            <span key={i} className={i < run.hp ? 'text-xl' : 'text-xl opacity-25'}>❤️</span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-3 flex flex-col items-center px-4">
        <Ribbon width={270}>
          <span className="text-base">{zone.emoji} {zone.name}</span>
        </Ribbon>
        {zone.tagline && (
          <p className="mt-1 text-[11px] font-bold" style={{ color: '#9a7c54' }}>{zone.tagline}</p>
        )}
        {zone.story && (
          <div
            className="mt-2 max-w-sm rounded-xl border px-3 py-2 text-center text-xs font-bold leading-relaxed w-full"
            style={{ background: 'rgba(255,250,235,.65)', borderColor: 'rgba(123,90,58,.3)', color: '#6b4f30', whiteSpace: 'pre-line' }}
          >
            📖 {zone.story}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-3 mx-auto" style={{ width: MAP_W, height: MAP_H }}>
        <div
          className="absolute inset-0 rounded-[28px] border-2"
          style={{
            borderColor: 'rgba(123,90,58,.4)',
            background: `radial-gradient(85% 75% at 50% 35%, ${tint}, rgba(255,250,235,.5) 82%)`,
          }}
        />
        {zone.wall && SCATTER.map((s, i) => (
          <span
            key={i}
            className="pointer-events-none absolute select-none"
            style={{ left: s.x, top: s.y, fontSize: s.s, opacity: 0.18, transform: 'translate(-50%,-50%)' }}
            aria-hidden
          >
            {zone.wall}
          </span>
        ))}
        <svg className="pointer-events-none absolute inset-0" width={MAP_W} height={MAP_H} aria-hidden>
          {edges.map(({ from, to }, i) => {
            const fp = nodePos(from, maxLayer);
            const tp = nodePos(to, maxLayer);
            const bothVisited = run.visitedIds.includes(from.id) && run.visitedIds.includes(to.id);
            return (
              <path
                key={i}
                d={trailD(fp, tp)}
                fill="none"
                stroke={bothVisited ? '#b9472f' : SEPIA}
                strokeWidth={bothVisited ? 3 : 2}
                strokeLinecap="round"
                strokeDasharray={bothVisited ? undefined : '2 10'}
                opacity={0.5}
              />
            );
          })}
        </svg>
        {nodes.map((node) => {
          const { x, y } = nodePos(node, maxLayer);
          const visited = run.visitedIds.includes(node.id);
          const isCurrent = run.currentNodeId === node.id;
          const reachable = isReachable(node.id);

          let sealStyle: CSSProperties;
          let content: ReactNode;
          if (visited && !isCurrent) {
            sealStyle = {
              background: 'radial-gradient(circle at 35% 30%, #e7c46a, #b9472f)',
              color: '#fff3d6',
              borderColor: '#7e2a1a',
              boxShadow: '0 3px 0 rgba(90,55,20,.35)',
            };
            content = '✅';
          } else if (reachable) {
            sealStyle = {
              background: 'radial-gradient(circle at 35% 30%, #fff7e0, #e0a94b)',
              color: '#6b4f30',
              borderColor: '#9c6a2a',
              boxShadow: '0 0 0 5px rgba(224,169,75,.28), 0 3px 0 rgba(90,55,20,.4)',
            };
            content = NODE_KIND_EMOJI[node.kind];
          } else {
            sealStyle = {
              background: 'rgba(231,211,168,.5)',
              color: 'rgba(123,90,58,.4)',
              borderColor: 'rgba(123,90,58,.22)',
            };
            content = '🔒';
          }

          return (
            <motion.button
              key={node.id}
              type="button"
              disabled={!reachable}
              onClick={() => { if (reachable) { playSfx('tap'); onSelectNode(node.id); } }}
              whileTap={reachable ? { scale: 0.88 } : {}}
              className="absolute flex items-center justify-center"
              style={{ left: x, top: y, width: 52, height: 52, transform: 'translate(-50%,-50%)' }}
            >
              <motion.span
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-xl font-bold"
                style={sealStyle}
                animate={reachable && !visited ? { scale: [1, 1.07, 1] } : {}}
                transition={reachable && !visited ? { repeat: Infinity, duration: 1.6 } : {}}
              >
                {content}
              </motion.span>
            </motion.button>
          );
        })}

        <motion.div
          className="pointer-events-none absolute z-10"
          style={{ transform: 'translate(-50%,-100%)' }}
          animate={{ left: pawnP.x, top: pawnP.y + 4 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          <motion.span
            className="block text-3xl"
            style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.35))' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            {charEmoji}
          </motion.span>
        </motion.div>
      </div>

      <p className="relative z-10 mt-2 pb-4 text-center text-[10px] tracking-wider" style={{ color: '#9a7c54' }}>
        ✅クリア済み　⚔️バトル　⛺やすみ(HP+1)　🎁たからばこ　👑ラスボス
      </p>
    </div>
  );
}

// ─── Battle ───────────────────────────────────────────────────────────────────

/** 図形選択肢を 2×2 グリッドのSVGボタンで描く（回転・くみあわせ・つぎはどれ で共用）。*/
function ShapeChoiceGrid({ count, answerIndex, chosen, locked, onPick, children }: {
  count: number;
  answerIndex: number;
  chosen: number | null;
  locked: boolean;
  onPick: (index: number) => void;
  children: (idx: number) => ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {Array.from({ length: count }).map((_, idx) => {
        const isChosenCorrect = chosen === idx && idx === answerIndex;
        const isChosenWrong = chosen === idx && idx !== answerIndex;
        const isAnswer = chosen !== null && idx === answerIndex;
        let borderColor = 'rgba(123,90,58,.35)';
        if (isChosenCorrect || isAnswer) borderColor = '#16a34a';
        else if (isChosenWrong) borderColor = '#dc2626';
        return (
          <motion.button
            key={idx}
            type="button"
            disabled={locked}
            onClick={() => onPick(idx)}
            whileTap={!locked ? { scale: 0.92 } : {}}
            className="rounded-2xl p-3 flex items-center justify-center"
            style={{
              background: isChosenCorrect || isAnswer ? 'rgba(220,252,231,.9)' : isChosenWrong ? 'rgba(254,226,226,.9)' : 'rgba(255,250,235,.92)',
              border: `2.5px solid ${borderColor}`,
              boxShadow: '0 3px 0 rgba(90,55,20,.2)',
            }}
          >
            {children(idx)}
          </motion.button>
        );
      })}
    </div>
  );
}

function BattleScreen({ question, run, node, zone, onCorrect, onWrong, onBack }: {
  question: BattleQuestion;
  run: RunState;
  node: MapNode;
  zone: ReturnType<typeof getZone>;
  onCorrect: () => void;
  onWrong: () => void;
  onBack: () => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  // 配置式（数直線）用: こどもが おいた 数
  const [placed, setPlaced] = useState<number | null>(null);

  const handlePick = useCallback((index: number) => {
    if (locked) return;
    setChosen(index);
    setLocked(true);
    if (index === question.answerIndex) {
      playSfx('correct');
      setTimeout(onCorrect, 900);
    } else {
      playSfx('wrong');
      setTimeout(onWrong, 900);
    }
  }, [locked, question.answerIndex, onCorrect, onWrong]);

  const isPlacement = question.visual?.kind === 'number-line' && !!question.visual.placement;

  const handlePlace = useCallback((value: number) => {
    if (locked || question.visual?.kind !== 'number-line') return;
    const { target, max } = question.visual;
    setPlaced(value);
    setLocked(true);
    // ちかさで 合否: max の 8%以内（さいてい 2）なら せいかい
    const tol = Math.max(2, Math.round(max * 0.08));
    if (Math.abs(value - target) <= tol) {
      playSfx('correct');
      setTimeout(onCorrect, 1300);
    } else {
      playSfx('wrong');
      setTimeout(onWrong, 1300);
    }
  }, [locked, question.visual, onCorrect, onWrong]);

  const isCorrect = chosen === question.answerIndex;
  const isWrong = chosen !== null && !isCorrect;
  const nodeLabel = node.kind === 'boss' ? '👑 ラスボス！' : NODE_KIND_EMOJI[node.kind];

  return (
    <div className="relative min-h-screen flex flex-col items-center" style={{ background: PAPER }}>
      <LibraryTexture />
      <header className="relative z-10 w-full flex items-center justify-between px-4 pt-4 pr-16">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { playSfx('tap'); onBack(); }}
            className="rounded-xl border-[1.5px] px-2.5 py-1.5 text-sm font-bold shrink-0"
            style={{ background: 'rgba(255,255,255,.6)', borderColor: 'rgba(123,90,58,.35)', color: '#6b4f30' }}
            aria-label="マップに もどる"
          >
            ← マップ
          </button>
          <span
            className="text-sm font-bold px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,.65)', color: SEPIA, border: '1px solid rgba(123,90,58,.3)' }}
          >
            {zone.emoji} {nodeLabel}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          {Array.from({ length: run.maxHp }).map((_, i) => (
            <span key={i} className={i < run.hp ? 'text-xl' : 'text-xl opacity-25'}>❤️</span>
          ))}
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-5 w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.promptText}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl p-6 text-center shadow-md"
            style={{
              background: 'rgba(255,250,235,.92)',
              border: '2px solid rgba(123,90,58,.4)',
              boxShadow: '0 4px 0 rgba(90,55,20,.2), inset 0 1px 0 rgba(255,255,255,.7)',
            }}
          >
            {question.visual?.kind === 'equation' && (
              <div className="text-4xl font-bold mb-2" style={{ color: SEPIA }}>{question.visual.text}</div>
            )}
            {question.visual?.kind === 'objects' && (() => {
              const v = question.visual;
              return (
                <div className="mb-2">
                  <div className="text-3xl mb-1 flex flex-wrap justify-center gap-0.5">
                    {Array.from({ length: Math.min(v.count, 25) }).map((_, i) => (
                      <span key={i}>{v.emoji}</span>
                    ))}
                  </div>
                  {v.count > 25 && <div className="text-lg" style={{ color: SEPIA }}>（{v.count}こ）</div>}
                  {v.equationText && (
                    <div className="text-3xl font-bold mt-1" style={{ color: SEPIA }}>{v.equationText}</div>
                  )}
                </div>
              );
            })()}
            {question.visual?.kind === 'groups' && (() => {
              const v = question.visual;
              return (
                <div className="mb-2 flex flex-col items-center gap-2">
                  <GroupsVisual emoji={v.emoji} perGroup={v.perGroup} groups={v.groups} />
                  {v.equationText && (
                    <div className="text-3xl font-bold" style={{ color: SEPIA }}>{v.equationText}</div>
                  )}
                </div>
              );
            })()}
            {question.visual?.kind === 'word' && (
              <div className="text-base text-left leading-relaxed whitespace-pre-line" style={{ color: SEPIA }}>
                {question.visual.text}
              </div>
            )}
            {question.visual?.kind === 'shape-rotation' && (() => {
              const v = question.visual;
              return (
                <div className="flex items-center gap-3 justify-center mb-1">
                  <ShapeSvg shapeId={v.shapeId} transform={{ rotate: 0, flipX: false }} size={70} color="#f59e0b" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">➡️</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,250,235,.9)', color: SEPIA }}>{v.rotationLabel}</span>
                  </div>
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl" style={{ borderColor: 'rgba(123,90,58,.4)', color: 'rgba(123,90,58,.5)' }}>？</div>
                </div>
              );
            })()}
            {question.visual?.kind === 'shape-compose' && (
              <div className="flex justify-center mb-1">
                <ComposeSvg svg={question.visual.questionSvg} size={170} />
              </div>
            )}
            {question.visual?.kind === 'shape-pattern' && (
              <div className="mb-1">
                <PatternSequence sequence={question.visual.sequence} iconSize={36} />
              </div>
            )}
            {question.visual?.kind === 'shape-spatial' && (
              <div className="flex justify-center mb-1 overflow-x-auto">
                <SpatialScene objects={question.visual.objects} />
              </div>
            )}
            {question.visual?.kind === 'number-line' && (
              <div className="mb-1">
                {question.visual.placement ? (
                  <NumberLinePlacement
                    max={question.visual.max}
                    target={question.visual.target}
                    marker={question.visual.marker}
                    placed={placed}
                    reveal={placed !== null}
                    onPlace={handlePlace}
                  />
                ) : (
                  <NumberLineVisual
                    max={question.visual.max}
                    target={question.visual.target}
                    marker={question.visual.marker}
                    reveal={chosen !== null && isCorrect}
                  />
                )}
              </div>
            )}
            {question.visual?.kind === 'estimate-pile' && (
              <div className="mb-2 flex justify-center">
                <EstimatePile emoji={question.visual.emoji} count={question.visual.count} />
              </div>
            )}
            {question.visual?.kind === 'divide' && (
              <div className="mb-2 flex justify-center">
                <DivideVisual
                  emoji={question.visual.emoji}
                  dividend={question.visual.dividend}
                  divisor={question.visual.divisor}
                  quotient={question.visual.quotient}
                  remainder={question.visual.remainder}
                  reveal={chosen !== null}
                />
              </div>
            )}
            {question.visual?.kind === 'ten-frame-sum' && (
              <div className="mb-2 flex justify-center">
                <TenFrameSum
                  a={question.visual.a}
                  b={question.visual.b}
                  emojiA={question.visual.emojiA}
                  emojiB={question.visual.emojiB}
                  answered={chosen !== null}
                  taken={question.visual.taken}
                />
              </div>
            )}
            {!question.visual && (
              <div className="text-2xl font-bold" style={{ color: SEPIA }}>{question.promptText}</div>
            )}
            {question.visual && (
              <div className="text-lg mt-2 font-bold" style={{ color: '#9a7c54' }}>{question.promptText}</div>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {chosen !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {isCorrect ? '🎉 せいかい！' : (question.visual?.kind === 'shape-rotation' || question.visual?.kind === 'shape-pattern' ? 'これが こたえ！' : `こたえは ${question.choices[question.answerIndex]} だよ`)}
            </motion.div>
          )}
          {isPlacement && placed !== null && question.visual?.kind === 'number-line' && (() => {
            const { target, max } = question.visual;
            const diff = Math.abs(placed - target);
            const ok = diff <= Math.max(2, Math.round(max * 0.08));
            const txt = diff <= Math.max(1, Math.round(max * 0.02))
              ? '🎯 ぴったり！'
              : ok ? '✨ おしい！ せいかい！' : `もうすこし！ ${target}は ここ📍`;
            return (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-bold ${ok ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {txt}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {(() => {
          const v = question.visual;
          // 配置式は 線の上で こたえるので 選択肢ボタンは 出さない
          if (isPlacement) return null;
          const gridProps = {
            answerIndex: question.answerIndex,
            chosen,
            locked,
            onPick: handlePick,
          };
          if (v?.kind === 'shape-rotation' && question.choiceTransforms) {
            const transforms = question.choiceTransforms;
            return (
              <ShapeChoiceGrid count={transforms.length} {...gridProps}>
                {(idx) => <ShapeSvg shapeId={v.shapeId} transform={transforms[idx]} size={64} color="#60a5fa" />}
              </ShapeChoiceGrid>
            );
          }
          if (v?.kind === 'shape-compose') {
            return (
              <ShapeChoiceGrid count={v.choiceSvgs.length} {...gridProps}>
                {(idx) => <ComposeSvg svg={v.choiceSvgs[idx]} size={120} />}
              </ShapeChoiceGrid>
            );
          }
          if (v?.kind === 'shape-pattern') {
            return (
              <ShapeChoiceGrid count={v.choiceItems.length} {...gridProps}>
                {(idx) => <PatternIcon item={v.choiceItems[idx]} size={48} />}
              </ShapeChoiceGrid>
            );
          }
          return (
            <BattleButtons
              choices={question.choices}
              onPick={handlePick}
              disabled={locked}
              correctIndex={chosen !== null ? question.answerIndex : undefined}
              wrongIndex={isWrong ? chosen! : undefined}
            />
          );
        })()}
      </div>
    </div>
  );
}

// ─── Hint ────────────────────────────────────────────────────────────────────

function HintScreen({ question, run, zone, onRetry }: {
  question: BattleQuestion;
  run: RunState;
  zone: ReturnType<typeof getZone>;
  onRetry: () => void;
}) {
  const hasSteps = question.explainSteps.length > 0;

  if (hasSteps) {
    return (
      <div className="relative min-h-screen" style={{ background: PAPER }}>
        <LibraryTexture />
        <div className="relative z-10">
          <StepExplainer
            gate
            steps={question.explainSteps}
            problem={question.promptText}
            onClose={onRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={{ background: PAPER }}>
      <LibraryTexture />
      <div className="relative z-10 flex gap-1">
        {Array.from({ length: run.maxHp }).map((_, i) => (
          <span key={i} className={i < run.hp ? 'text-xl' : 'text-xl opacity-25'}>❤️</span>
        ))}
      </div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 text-6xl"
      >
        🤔
      </motion.div>
      <div
        className="relative z-10 rounded-3xl p-5 text-center max-w-sm w-full"
        style={{ background: 'rgba(255,250,235,.92)', border: '2px solid rgba(123,90,58,.4)', boxShadow: '0 4px 0 rgba(90,55,20,.2)' }}
      >
        <p className="text-base font-bold mb-1" style={{ color: '#9a7c54' }}>{zone.emoji} {question.promptText}</p>
        <p className="text-lg font-bold" style={{ color: SEPIA }}>
          こたえは <span className="text-2xl">{question.choices[question.answerIndex]}</span> だよ！
        </p>
      </div>
      <motion.button
        type="button"
        onClick={onRetry}
        whileTap={{ scale: 0.94 }}
        className="relative z-10 rounded-2xl py-4 px-8 text-xl font-bold text-[#fbe6c9]"
        style={{ background: 'linear-gradient(#b9472f,#9c3622)', boxShadow: '0 4px 0 rgba(90,30,10,.4)' }}
      >
        もう一回 チャレンジ！
      </motion.button>
    </div>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────

function ResultScreen({ run, zoneName, zoneEmoji, charEmoji, onContinue, onHub }: {
  run: RunState;
  zoneName: string;
  zoneEmoji: string;
  charEmoji: string;
  onContinue: () => void;
  onHub: () => void;
}) {
  const sparkles = calcSparkles(run.maxHp, run.hp);
  const perfect = sparkles === 3;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-5 p-6" style={{ background: PAPER }}>
      <LibraryTexture />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="relative z-10 text-7xl"
      >
        {perfect ? '🏆' : '🎊'}
      </motion.div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="text-3xl">{charEmoji}</span>
        <Ribbon width={290}>
          <span className="text-base">{zoneEmoji} {zoneName} よみおわり！</span>
        </Ribbon>
      </div>
      <div className="relative z-10 flex gap-2 text-4xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: i < sparkles ? 1 : 0.5 }}
            transition={{ delay: i * 0.2 }}
            className={i < sparkles ? '' : 'opacity-25'}
          >
            ✨
          </motion.span>
        ))}
      </div>
      {perfect && (
        <p className="relative z-10 font-bold text-lg" style={{ color: '#b9472f' }}>
          💎 ぴったり賞！ ノーミスで よみきった！
        </p>
      )}
      <div className="relative z-10 flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-2xl py-4 text-xl font-bold text-[#fbe6c9] shadow-lg"
          style={{ background: 'linear-gradient(#b9472f,#9c3622)', boxShadow: '0 4px 0 rgba(90,30,10,.4)' }}
        >
          つぎの えほんへ →
        </button>
        <button
          type="button"
          onClick={onHub}
          className="rounded-2xl py-3 text-lg font-bold shadow"
          style={{ background: 'rgba(255,250,235,.9)', border: '2px solid rgba(123,90,58,.4)', color: SEPIA }}
        >
          としょかんに もどる
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type View = 'hub' | 'map' | 'battle' | 'hint' | 'result';

export function MathAdventureUnit({ characterName, characterId, onExit }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const [view, setView] = useState<View>('hub');
  const [zoneIndex, setZoneIndex] = useState(0);
  const [map, setMap] = useState<AdventureMap | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);

  useEffect(() => { setBgmTrack('home'); }, []);

  const currentZone = MATH_ADVENTURE_ZONES[zoneIndex];

  function startZone(idx: number) {
    const zone = MATH_ADVENTURE_ZONES[idx];
    const newMap = generateMap(zone);
    const newRun = makeInitialRun(zone.id, newMap.startId);
    setZoneIndex(idx);
    setMap(newMap);
    setRun(newRun);
    setView('map');
  }

  function enterNode(nodeId: string) {
    if (!map || !run) return;
    const node = getNode(map, nodeId);

    if (node.kind === 'rest') {
      const healed: RunState = {
        ...run, currentNodeId: nodeId,
        visitedIds: [...run.visitedIds, nodeId],
        hp: Math.min(run.maxHp, run.hp + 1),
      };
      setRun(healed);
      saveRun(healed);
      return;
    }

    if (node.kind === 'treasure') {
      const updated: RunState = {
        ...run, currentNodeId: nodeId,
        visitedIds: [...run.visitedIds, nodeId],
      };
      setRun(updated);
      saveRun(updated);
      return;
    }

    const withCurrent: RunState = { ...run, currentNodeId: nodeId };
    const zone = getZone(node.zoneId);
    const unitId = zone.unitIds[Math.floor(Math.random() * zone.unitIds.length)];
    const q = generateBattleQuestion(unitId);
    setQuestion(q);
    setActiveNode(node);
    setRun(withCurrent);
    saveRun(withCurrent);
    setView('battle');
  }

  function handleCorrect() {
    if (!run || !activeNode || !map) return;
    const updated: RunState = { ...run, visitedIds: [...run.visitedIds, activeNode.id] };
    if (activeNode.kind === 'boss') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      playSfx('fanfare');
      const sparkles = calcSparkles(updated.maxHp, updated.hp);
      recordZoneClear(currentZone.id, sparkles === 3, sparkles);
      clearRun();
      setRun(updated);
      setView('result');
    } else {
      setRun(updated);
      saveRun(updated);
      setView('map');
    }
  }

  function handleWrong() {
    if (!run || !activeNode) return;
    const updated: RunState = { ...run, hp: Math.max(0, run.hp - 1) };
    setRun(updated);
    saveRun(updated);
    setView('hint');
  }

  if (view === 'hub') {
    return (
      <HubScreen
        characterName={characterName}
        charEmoji={charEmoji}
        onSelectZone={startZone}
        onBack={onExit}
      />
    );
  }

  if (view === 'map' && map && run) {
    return (
      <MapScreen
        map={map}
        run={run}
        zone={currentZone}
        charEmoji={charEmoji}
        onSelectNode={enterNode}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'battle' && question && run && activeNode) {
    return (
      <BattleScreen
        question={question}
        run={run}
        node={activeNode}
        zone={currentZone}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
        onBack={() => setView('map')}
      />
    );
  }

  if (view === 'hint' && question && run) {
    return (
      <HintScreen
        question={question}
        run={run}
        zone={currentZone}
        onRetry={() => setView('battle')}
      />
    );
  }

  if (view === 'result' && run) {
    return (
      <ResultScreen
        run={run}
        zoneName={currentZone.name}
        zoneEmoji={currentZone.emoji}
        charEmoji={charEmoji}
        onContinue={() => {
          const next = zoneIndex + 1;
          if (next < MATH_ADVENTURE_ZONES.length) startZone(next);
          else setView('hub');
        }}
        onHub={() => setView('hub')}
      />
    );
  }

  return null;
}
