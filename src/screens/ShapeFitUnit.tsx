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
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { getPuzzles, type FitPiece } from '../lib/geometry/fitPuzzles';

const PUZZLES_PER_UNIT = 2;
const SNAP_THRESHOLD = 52; // この きょりより ちかければ はまる（px）

interface Props {
  variant: 'fit' | 'tangram';
  characterName: string;
  characterId: string;
  hard?: boolean;
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

function PieceShape({ piece, gray = false }: { piece: FitPiece; gray?: boolean }) {
  const fill = gray ? '#eef2f7' : piece.color;
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

function TrayPiece({ piece }: { piece: FitPiece }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: piece.id });
  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    touchAction: 'none',
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    cursor: 'grab',
    filter: isDragging ? 'drop-shadow(0 8px 8px rgba(0,0,0,0.25))' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <PieceShape piece={piece} />
    </div>
  );
}

export function ShapeFitUnit({ variant, hard = false, onExit }: Props) {
  const skillId = variant === 'fit' ? 'shape-fit' : 'shape-tangram';

  const queue = useMemo(() => {
    const list = shuffle(getPuzzles(variant, hard));
    const out = [...list];
    while (out.length < PUZZLES_PER_UNIT && list.length > 0) out.push(list[out.length % list.length]);
    return out.slice(0, PUZZLES_PER_UNIT);
  }, [variant, hard]);

  const [pIdx, setPIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [missed, setMissed] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  useEffect(() => { setBgmTrack(skillId); }, [skillId]);

  const puzzle = queue[pIdx];
  const trayOrder = useMemo(() => shuffle(puzzle.pieces.map((p) => p.id)), [puzzle.id]);
  const cleared = solvedPuzzles >= PUZZLES_PER_UNIT;

  function handleDragEnd(e: DragEndEvent) {
    const pieceId = String(e.active.id);
    const piece = puzzle.pieces.find((p) => p.id === pieceId);
    const r = e.active.rect.current.translated;
    const board = boardRef.current?.getBoundingClientRect();
    if (!piece || !r || !board) return;

    const dropCx = r.left + r.width / 2 - board.left;
    const dropCy = r.top + r.height / 2 - board.top;
    const targetCx = piece.x + piece.w / 2;
    const targetCy = piece.y + piece.h / 2;
    const dist = Math.hypot(dropCx - targetCx, dropCy - targetCy);

    if (dist > SNAP_THRESHOLD) {
      playSfx('wrong');
      setMissed(true);
      setTimeout(() => setMissed(false), 700);
      return;
    }

    playSfx('correct');
    const next = [...placed, pieceId];
    setPlaced(next);

    if (next.length === puzzle.pieces.length) {
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
          setPlaced([]);
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
        <button type="button" onClick={onExit} className="rounded-2xl bg-teal-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#00695c] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  const trayPieces = trayOrder
    .filter((id) => !placed.includes(id))
    .map((id) => puzzle.pieces.find((p) => p.id === id)!);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-emerald-100 to-teal-50 p-6">
      <div className="self-stretch flex items-center justify-between">
        <span className="text-sm text-teal-700 font-bold">パズル: {solvedPuzzles} / {PUZZLES_PER_UNIT}</span>
        {hard && <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-bold text-white">🔥 むずかしい</span>}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-teal-900 text-center"
      >
        {puzzle.title}
      </motion.h2>
      <p className="text-sm text-teal-600 font-bold">ピースを ドラッグして ぴったり はめよう！</p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={boardRef}
          className="relative rounded-3xl bg-white shadow-lg"
          style={{ width: puzzle.boardW, height: puzzle.boardH }}
        >
          {puzzle.pieces.map((p) => (
            <div key={p.id} className="absolute" style={{ left: p.x, top: p.y }}>
              <PieceShape piece={p} gray={!placed.includes(p.id)} />
            </div>
          ))}
        </div>

        <div className="mt-2 flex min-h-[110px] w-full max-w-sm flex-wrap items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-teal-300 bg-white/60 p-4">
          {trayPieces.length === 0 ? (
            <span className="text-teal-500 font-bold">できた！🎉</span>
          ) : (
            trayPieces.map((p) => <TrayPiece key={p.id} piece={p} />)
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
