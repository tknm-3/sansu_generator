import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { setBgmTrack } from '../features/sound/bgm';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, getUnitStampCount, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { getPuzzles, silhouetteKey, type FitPiece, type FitShape } from '../lib/geometry/fitPuzzles';
import { pickPuzzles, rememberPuzzles, puzzleRank } from '../lib/geometry/fitSession';

const PUZZLES_PER_UNIT = 3;
const SNAP_THRESHOLD = 52;
// じょうきゅう（もっとむずかしい）で つかう「同色」。色の てがかりを なくして 形で かんがえさせる。
const MONO_COLOR = '#5b9bd5';
// さいきん だした パズルIDを おぼえておく localStorage キーの あたま（skillId・なんいど ごと）
const RECENT_KEY_PREFIX = 'math-app:fit-recent:';

interface Props {
  variant: 'fit' | 'tangram';
  characterName: string;
  characterId: string;
  hard?: boolean;
  /** tangram の「もっとむずかしい」モード（共通7ピース・同色・うらがえし あり） */
  expert?: boolean;
  onExit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PieceShape({ piece, gray = false, mono = false }: { piece: FitPiece; gray?: boolean; mono?: boolean }) {
  const fill = gray ? '#eef2f7' : mono ? MONO_COLOR : piece.color;
  const stroke = gray ? '#94a3b8' : 'white';
  const dash = gray ? '5 4' : undefined;
  const s = piece.shape;
  return (
    <svg
      width={piece.w}
      height={piece.h}
      viewBox={`0 0 ${piece.w} ${piece.h}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {s.type === 'poly' && (
        <polygon points={s.points} fill={fill} stroke={stroke} strokeWidth={2.5} strokeDasharray={dash} strokeLinejoin="round" />
      )}
      {s.type === 'circle' && (
        <circle cx={s.cx} cy={s.cy} r={s.r} fill={fill} stroke={stroke} strokeWidth={2.5} strokeDasharray={dash} />
      )}
      {s.type === 'rect' && (
        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} fill={fill} stroke={stroke} strokeWidth={2.5} strokeDasharray={dash} />
      )}
    </svg>
  );
}

function renderSilhouetteShape(s: FitShape) {
  if (s.type === 'poly') return <polygon points={s.points} fill="#dde3ec" stroke="#dde3ec" strokeWidth={4} strokeLinejoin="round" />;
  if (s.type === 'circle') return <circle cx={s.cx} cy={s.cy} r={s.r} fill="#dde3ec" stroke="#dde3ec" strokeWidth={4} />;
  return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} fill="#dde3ec" stroke="#dde3ec" strokeWidth={4} />;
}

function TrayPiece({
  piece,
  rotation,
  flipped = false,
  mono = false,
  canFlip = false,
  onRotate,
  onFlip,
}: {
  piece: FitPiece;
  rotation: number;
  flipped?: boolean;
  mono?: boolean;
  canFlip?: boolean;
  onRotate: () => void;
  onFlip?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: piece.id });
  const outerStyle: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    touchAction: 'none',
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={outerStyle} {...listeners} {...attributes} className="relative">
      {/* 内側だけ 回転・反転。ドラッグ位置の判定はアウター基準なので中心は変わらない */}
      <div
        onClick={(e) => { e.stopPropagation(); onRotate(); }}
        style={{
          transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
          transformOrigin: '50% 50%',
          display: 'inline-block',
          filter: isDragging ? 'drop-shadow(0 8px 8px rgba(0,0,0,0.25))' : undefined,
          cursor: 'pointer',
        }}
      >
        <PieceShape piece={piece} mono={mono} />
      </div>
      {canFlip && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFlip?.(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2 -top-2 rounded-full bg-white shadow px-1.5 py-0.5 text-xs leading-none border border-teal-300"
          title="うらがえす"
        >
          🔁
        </button>
      )}
    </div>
  );
}

export function ShapeFitUnit({ variant, hard = false, expert = false, onExit }: Props) {
  const skillId = variant === 'fit' ? 'shape-fit' : 'shape-tangram';
  // じょうきゅう（もっとむずかしい）は tangram だけ。同色・うらがえし・共通7ピース。
  const isExpert = variant === 'tangram' && expert;

  // なんいど ごとに りれきを わけて、さいきん だしていない パズルを ゆうせんして だす。
  const recentKey = `${RECENT_KEY_PREFIX}${skillId}${isExpert ? ':expert' : hard ? ':hard' : ''}`;
  const queue = useMemo(() => {
    const all = getPuzzles(variant, hard, isExpert);
    const recent = loadJson<string[]>(recentKey, []);
    return pickPuzzles(all, recent, PUZZLES_PER_UNIT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, hard, isExpert, recentKey]);

  // この セットで だした パズルを りれきに きろく（ぜんたいの だいたい はんぶんを おぼえる）。
  useEffect(() => {
    const all = getPuzzles(variant, hard, isExpert);
    const recent = loadJson<string[]>(recentKey, []);
    const keep = Math.max(PUZZLES_PER_UNIT, Math.floor(all.length / 2));
    saveJson(recentKey, rememberPuzzles(recent, queue.map((p) => p.id), keep));
  }, [queue, recentKey, variant, hard, isExpert]);

  const [pIdx, setPIdx] = useState(0);
  // スロットID → そこに はまっている ピースID。
  // 見た目が おなじ（silhouetteKey が おなじ）ピースは どの スロットにも はめられる。
  const [placement, setPlacement] = useState<Record<string, string>>({});
  const [pieceRotations, setPieceRotations] = useState<Record<string, number>>({});
  // ピースID → よこ反転（うらがえし）しているか。じょうきゅうモード用。
  const [pieceFlips, setPieceFlips] = useState<Record<string, boolean>>({});
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [missed, setMissed] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setBgmTrack(skillId); }, [skillId]);
  useEffect(() => { setPieceRotations({}); setPlacement({}); setPieceFlips({}); }, [pIdx]);

  const puzzle = queue[pIdx];
  const trayOrder = useMemo(() => shuffle(puzzle.pieces.map((p) => p.id)), [puzzle.id]);
  const cleared = solvedPuzzles >= PUZZLES_PER_UNIT;
  const usedPieceIds = useMemo(() => new Set(Object.values(placement)), [placement]);

  // これまでの クリアかいすう から「ランク（しょうごう）」を だして、すすんでる かんじを みせる。
  const rank = useMemo(() => {
    const clears = getUnitStampCount(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS).history, skillId);
    return { clears, ...puzzleRank(clears) };
  }, [skillId, solvedPuzzles]);

  function rotatepiece(id: string) {
    setPieceRotations((prev) => ({ ...prev, [id]: ((prev[id] ?? 0) + 90) % 360 }));
  }

  function flipPiece(id: string) {
    setPieceFlips((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleDragEnd(e: DragEndEvent) {
    const pieceId = String(e.active.id);
    const piece = puzzle.pieces.find((p) => p.id === pieceId);
    const r = e.active.rect.current.translated;
    const board = boardRef.current?.getBoundingClientRect();
    if (!piece || !r || !board) return;

    const dropCx = r.left + r.width / 2 - board.left;
    const dropCy = r.top + r.height / 2 - board.top;
    const currentRot = ((pieceRotations[pieceId] ?? 0) + 360) % 360;
    const currentFlip = pieceFlips[pieceId] ?? false;
    const pieceKey = silhouetteKey(piece.shape, piece.w, piece.h, currentRot, currentFlip);

    // まだ うまっていない スロットのうち、見た目が おなじで いちばん ちかいものを さがす。
    let bestSlot: FitPiece | null = null;
    let bestDist = Infinity;
    for (const slot of puzzle.pieces) {
      if (placement[slot.id] !== undefined) continue;
      const slotKey = silhouetteKey(slot.shape, slot.w, slot.h, slot.targetRotation ?? 0, slot.targetFlip ?? false);
      if (slotKey !== pieceKey) continue;
      const dist = Math.hypot(dropCx - (slot.x + slot.w / 2), dropCy - (slot.y + slot.h / 2));
      if (dist < bestDist) {
        bestDist = dist;
        bestSlot = slot;
      }
    }

    if (!bestSlot || bestDist > SNAP_THRESHOLD) {
      playSfx('wrong');
      setMissed(true);
      setTimeout(() => setMissed(false), 700);
      return;
    }

    playSfx('correct');
    const next = { ...placement, [bestSlot.id]: pieceId };
    setPlacement(next);

    if (Object.keys(next).length === puzzle.pieces.length) {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      const done = solvedPuzzles + 1;
      setTimeout(() => {
        playSfx('fanfare');
        setSolvedPuzzles(done);
        if (done >= PUZZLES_PER_UNIT) {
          saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), skillId, Date.now()));
          speakJa('クリア！ よくできたね！');
        } else {
          speakJa('できた！ つぎの パズル！');
          setPIdx((i) => i + 1);
          setPlacement({});
          setPieceRotations({});
        }
      }, 750);
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-emerald-200 to-teal-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-teal-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white/70 px-6 py-3"
        >
          <span className="text-xl font-bold text-teal-800">{rank.emoji} {rank.label}</span>
          <span className="text-sm font-bold text-teal-600">これまで {rank.clears} かい クリア！</span>
          {rank.toNext > 0 && (
            <span className="text-xs font-bold text-orange-500">あと {rank.toNext} かいで つぎの ランク！</span>
          )}
        </motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-teal-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#00695c] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  const trayPieces = trayOrder
    .filter((id) => !usedPieceIds.has(id))
    .map((id) => puzzle.pieces.find((p) => p.id === id)!);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-emerald-100 to-teal-50 p-6">
      <div className="self-stretch flex items-center justify-between">
        <span className="text-sm text-teal-700 font-bold">パズル: {solvedPuzzles} / {PUZZLES_PER_UNIT}</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-teal-700" title={`これまで ${rank.clears} かい クリア`}>
            {rank.emoji} {rank.label}
          </span>
          {isExpert
            ? <span className="rounded-full bg-violet-500 px-3 py-1 text-xs font-bold text-white">💎 もっとむずかしい</span>
            : hard && <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-bold text-white">🔥 むずかしい</span>}
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-teal-900 text-center"
      >
        {puzzle.title}
      </motion.h2>
      <p className="text-sm text-teal-600 font-bold">
        ドラッグして はめよう！
        {variant === 'tangram' && <span className="ml-1 text-orange-500">タップで かいてん 🔄</span>}
        {isExpert && <span className="ml-1 text-violet-500">🔁で うらがえし</span>}
      </p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={boardRef}
          className="relative rounded-3xl bg-white shadow-lg overflow-hidden"
          style={{ width: puzzle.boardW, height: puzzle.boardH }}
        >
          {variant === 'tangram' ? (
            <>
              {/* シルエット：全ピースを同色で描いて境界線を消す */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={puzzle.boardW}
                height={puzzle.boardH}
                style={{ display: 'block' }}
              >
                {puzzle.pieces.map((p) => {
                  const rot = p.targetRotation ?? 0;
                  return (
                    <g
                      key={p.id}
                      transform={`rotate(${rot}, ${p.x + p.w / 2}, ${p.y + p.h / 2})`}
                    >
                      <g transform={`translate(${p.x}, ${p.y})`}>
                        <g transform={p.targetFlip ? `translate(${p.w},0) scale(-1,1)` : undefined}>
                          {renderSilhouetteShape(p.shape)}
                        </g>
                      </g>
                    </g>
                  );
                })}
              </svg>
              {/* はめたピースをカラーで上書き（スロットの いちに、はめた ピースの いろで）*/}
              {Object.entries(placement).map(([slotId, pieceId]) => {
                const slot = puzzle.pieces.find((pp) => pp.id === slotId)!;
                const piece = puzzle.pieces.find((pp) => pp.id === pieceId)!;
                const rot = pieceRotations[pieceId] ?? 0;
                const flip = pieceFlips[pieceId] ?? false;
                const left = slot.x + slot.w / 2 - piece.w / 2;
                const top = slot.y + slot.h / 2 - piece.h / 2;
                return (
                  <div
                    key={slotId}
                    className="absolute"
                    style={{
                      left,
                      top,
                      transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`,
                      transformOrigin: `${piece.w / 2}px ${piece.h / 2}px`,
                    }}
                  >
                    <PieceShape piece={piece} mono={isExpert} />
                  </div>
                );
              })}
            </>
          ) : (
            /* ぴったりはめよう：個別スロットを点線で表示 */
            puzzle.pieces.map((slot) => {
              const placedPieceId = placement[slot.id];
              const placedPiece = placedPieceId
                ? puzzle.pieces.find((pp) => pp.id === placedPieceId)!
                : null;
              return (
                <div key={slot.id} className="absolute" style={{ left: slot.x, top: slot.y }}>
                  <PieceShape
                    piece={placedPiece ? { ...slot, color: placedPiece.color } : slot}
                    gray={!placedPiece}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="mt-2 flex min-h-[110px] w-full max-w-sm flex-wrap items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-teal-300 bg-white/60 p-4">
          {trayPieces.length === 0 ? (
            <span className="text-teal-500 font-bold">できた！🎉</span>
          ) : (
            trayPieces.map((p) => (
              <TrayPiece
                key={p.id}
                piece={p}
                rotation={pieceRotations[p.id] ?? 0}
                flipped={pieceFlips[p.id] ?? false}
                mono={isExpert}
                canFlip={isExpert}
                onRotate={() => rotatepiece(p.id)}
                onFlip={() => flipPiece(p.id)}
              />
            ))
          )}
        </div>
      </DndContext>

      <AnimatePresence>
        {missed && (
          <motion.p
            key="m"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }}
            exit={{ opacity: 0 }}
            className="text-lg font-bold text-orange-600"
          >
            おしい！ もうすこし！
          </motion.p>
        )}
      </AnimatePresence>

      <button type="button" onClick={onExit} className="mt-1 text-sm text-teal-600 underline">やめる</button>
    </div>
  );
}
