import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── 定数 ────────────────────────────────────────────────────────────────────

const BINGO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

const PLAYER_STYLES = [
  { bg: 'bg-orange-400',   border: 'border-orange-500',   token: '#f97316', light: 'bg-orange-50',   text: 'text-orange-700',   ring: 'ring-orange-400'   },
  { bg: 'bg-sky-500',      border: 'border-sky-600',      token: '#0284c7', light: 'bg-sky-50',      text: 'text-sky-700',      ring: 'ring-sky-400'      },
  { bg: 'bg-emerald-500',  border: 'border-emerald-600',  token: '#059669', light: 'bg-emerald-50',  text: 'text-emerald-700',  ring: 'ring-emerald-400'  },
  { bg: 'bg-pink-500',     border: 'border-pink-600',     token: '#db2777', light: 'bg-pink-50',     text: 'text-pink-700',     ring: 'ring-pink-400'     },
];

const DICE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const CHARACTERS = ['🐶', '🐱', '🐰', '🐸', '🦊', '🐼', '🐨', '🐯', '🦁', '🐻'];
const DEFAULT_CHARACTERS = ['🐶', '🐱', '🐰', '🐸'];

const DEFAULT_NAMES    = ['こども', 'パパ', 'ママ', 'ゲスト'];
const DEFAULT_NUMBERS  = [
  [3, 15, 27, 42, 56, 63, 71, 85, 94],
  [7, 18, 33, 48, 52, 67, 74, 81, 99],
  [11, 24, 38, 45, 59, 68, 76, 83, 96],
  [5, 22, 31, 44, 57, 69, 78, 87, 93],
];

// ── 型 ─────────────────────────────────────────────────────────────────────

interface Player {
  name: string;
  numbers: number[];   // 3×3 の 9マス
  checked: boolean[];  // どのマスに穴が開いたか
  position: number;    // 0=スタート前, 1-100
  doneLines: number[]; // ビンゴ達成済みライン番号
  character: string;   // コマのキャラクター絵文字
}

// ── ボード計算 ──────────────────────────────────────────────────────────────

function squareToCell(n: number): { row: number; col: number } {
  const rfb = Math.floor((n - 1) / 10);
  const c   = (n - 1) % 10;
  return { row: 9 - rfb, col: rfb % 2 === 0 ? c : 9 - c };
}

const BOARD_GRID: number[][] = (() => {
  const g: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let n = 1; n <= 100; n++) {
    const { row, col } = squareToCell(n);
    g[row][col] = n;
  }
  return g;
})();

function getNewBingos(player: Player): number[] {
  return BINGO_LINES.flatMap((line, i) => {
    if (player.doneLines.includes(i)) return [];
    return line.every(j => player.checked[j]) ? [i] : [];
  });
}

function getReachNumbers(player: Player): number[] {
  const res = new Set<number>();
  BINGO_LINES.forEach((line, i) => {
    if (player.doneLines.includes(i)) return;
    const unchecked = line.filter(j => !player.checked[j]);
    if (unchecked.length === 1) res.add(player.numbers[unchecked[0]]);
  });
  return [...res].sort((a, b) => a - b);
}

// ── 数字選択ピッカー ─────────────────────────────────────────────────────────

function NumberPicker({
  selected,
  onToggle,
}: {
  selected: Set<number>;
  onToggle: (n: number) => void;
}) {
  const MAX = 9;
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
      {Array.from({ length: 100 }, (_, i) => i + 1).map(n => {
        const isSel = selected.has(n);
        const disabled = !isSel && selected.size >= MAX;
        return (
          <button
            key={n}
            type="button"
            onClick={() => !disabled && onToggle(n)}
            className={`
              aspect-square text-xs font-bold rounded transition-all select-none
              ${isSel
                ? 'bg-orange-400 text-white ring-2 ring-orange-600 scale-110 z-10 relative'
                : disabled
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white hover:bg-amber-100 text-gray-600 border border-gray-200'}
            `}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ── ビンゴカード表示 ─────────────────────────────────────────────────────────

function BingoCardDisplay({
  player,
  styleIdx,
  isCurrent,
  flashSquares,
}: {
  player: Player;
  styleIdx: number;
  isCurrent: boolean;
  flashSquares: Set<number>;
}) {
  const s = PLAYER_STYLES[styleIdx % PLAYER_STYLES.length];
  const reach = getReachNumbers(player);
  const isReach = reach.length > 0;
  const bingoCount = player.doneLines.length;

  return (
    <div className={`
      rounded-2xl p-2 border-2 transition-all
      ${isCurrent ? `${s.border} shadow-md` : 'border-gray-200'}
      ${isReach ? 'ring-2 ring-yellow-400' : ''}
      ${s.light}
    `}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${s.bg} flex-shrink-0`} />
          <span className="font-bold text-sm text-gray-800 truncate">{player.name}</span>
          {isCurrent && <span className="text-xs bg-yellow-300 text-yellow-800 rounded px-1 flex-shrink-0">▶</span>}
        </div>
        <div className="flex items-center gap-1">
          {bingoCount > 0 && (
            <span className="text-xs font-bold text-purple-600">🎉×{bingoCount}</span>
          )}
          <span className={`text-xs font-bold ${s.text}`}>
            {player.position === 0 ? 'スタート' : `${player.position}マス`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0.5">
        {player.numbers.map((n, i) => {
          const isChecked = player.checked[i];
          const isFlash = flashSquares.has(i);
          return (
            <motion.div
              key={i}
              animate={isFlash ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.35 }}
              className={`
                aspect-square flex items-center justify-center text-sm font-extrabold rounded
                ${isChecked
                  ? `${s.bg} text-white shadow-sm`
                  : 'bg-white text-gray-800 border border-gray-200'}
                ${isFlash ? 'ring-2 ring-yellow-400' : ''}
              `}
            >
              {n}
            </motion.div>
          );
        })}
      </div>

      {isReach && (
        <div className="mt-1.5 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-lg p-1 text-center leading-tight">
          🎯 {reach.slice(0, 3).join(' か ')} でビンゴ！
        </div>
      )}
    </div>
  );
}

// ── メインコンポーネント ─────────────────────────────────────────────────────

interface Props {
  onExit: () => void;
}

type Phase = 'setup-count' | 'setup-cards' | 'game' | 'gameover';

export function BingoSugorokuUnit({ onExit }: Props) {
  // ── セットアップ状態 ──
  const [phase, setPhase] = useState<Phase>('setup-count');
  const [playerCount, setPlayerCount] = useState(3);
  const [setupIdx, setSetupIdx] = useState(0);
  const [editName, setEditName] = useState('');
  const [editNumbers, setEditNumbers] = useState<Set<number>>(new Set());
  const [editCharacter, setEditCharacter] = useState<string>(CHARACTERS[0]);

  // ── ゲーム状態 ──
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [diceShaking, setDiceShaking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showBingo, setShowBingo] = useState<{ name: string; count: number } | null>(null);
  const [flashCards, setFlashCards] = useState<Map<number, Set<number>>>(new Map());
  const [highlightSquare, setHighlightSquare] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── セットアップ 開始 ──────────────────────────────────────────────────────

  function startSetupCard(idx: number) {
    setEditName(DEFAULT_NAMES[idx] ?? `プレイヤー${idx + 1}`);
    setEditNumbers(new Set(DEFAULT_NUMBERS[idx] ?? []));
    setEditCharacter(DEFAULT_CHARACTERS[idx] ?? CHARACTERS[idx % CHARACTERS.length]);
    setSetupIdx(idx);
    setPhase('setup-cards');
  }

  function confirmCard() {
    if (editNumbers.size !== 9) return;
    const sorted = [...editNumbers].sort((a, b) => a - b);
    const newPlayer: Player = {
      name: editName || DEFAULT_NAMES[setupIdx] || `プレイヤー${setupIdx + 1}`,
      numbers: sorted,
      checked: Array(9).fill(false),
      position: 0,
      doneLines: [],
      character: editCharacter,
    };

    setPlayers(prev => {
      const next = [...prev];
      next[setupIdx] = newPlayer;
      return next;
    });

    if (setupIdx + 1 < playerCount) {
      startSetupCard(setupIdx + 1);
    } else {
      setPhase('game');
    }
  }

  // ── ゲームロジック ────────────────────────────────────────────────────────

  const markNumber = useCallback((square: number, ps: Player[]): Player[] => {
    const flash = new Map<number, Set<number>>();
    const next = ps.map((p, pi) => {
      const idx = p.numbers.indexOf(square);
      if (idx === -1) return p;
      const newChecked = [...p.checked];
      newChecked[idx] = true;
      const set = flash.get(pi) ?? new Set<number>();
      set.add(idx);
      flash.set(pi, set);
      return { ...p, checked: newChecked };
    });
    setFlashCards(flash);
    setTimeout(() => setFlashCards(new Map()), 600);
    return next;
  }, []);

  function processBingo(ps: Player[], idx: number): { updated: Player[]; newCount: number } {
    const p = ps[idx];
    const newLines = getNewBingos(p);
    if (newLines.length === 0) return { updated: ps, newCount: 0 };
    const next = ps.map((pl, i) =>
      i === idx ? { ...pl, doneLines: [...pl.doneLines, ...newLines] } : pl
    );
    return { updated: next, newCount: newLines.length };
  }

  const animateMove = useCallback((
    ps: Player[],
    pIdx: number,
    from: number,
    to: number,
    onComplete: (finalPlayers: Player[]) => void,
  ) => {
    let current = from;
    let state = ps;

    function step() {
      current = Math.min(current + 1, to);
      setHighlightSquare(current);
      state = state.map((p, i) =>
        i === pIdx ? { ...p, position: current } : p
      );
      setPlayers([...state]);

      if (current < to) {
        timerRef.current = setTimeout(step, 350);
      } else {
        timerRef.current = setTimeout(() => {
          setHighlightSquare(null);
          onComplete(state);
        }, 500);
      }
    }

    timerRef.current = setTimeout(step, 100);
  }, []);

  function handleRoll() {
    if (isAnimating || phase !== 'game') return;
    setIsAnimating(true);
    setDiceShaking(true);

    // サイコロ演出: 速度に緩急をつけて全部で20回
    const ROLL_TOTAL = 20;
    const getDelay = (i: number) => i < 8 ? 55 : i < 14 ? 100 : 170;

    const doRoll = (i: number) => {
      setDiceValue(Math.ceil(Math.random() * 6));
      if (i < ROLL_TOTAL - 1) {
        timerRef.current = setTimeout(() => doRoll(i + 1), getDelay(i));
      } else {
        const roll = Math.ceil(Math.random() * 6);
        setDiceValue(roll);
        setDiceShaking(false);

        const p = players[currentIdx];
        const from = p.position;
        const to   = Math.min(from + roll, 100);

        animateMove(players, currentIdx, from, to, (movedPlayers) => {
          // 着地マスを全員のカードに反映
          const marked = markNumber(to, movedPlayers);
          const { updated, newCount } = processBingo(marked, currentIdx);
          setPlayers(updated);

          if (newCount > 0) {
            // ビンゴ演出 → ボーナス10マス
            setShowBingo({ name: updated[currentIdx].name, count: newCount });
            timerRef.current = setTimeout(() => {
              setShowBingo(null);
              const bonus = Math.min(updated[currentIdx].position + newCount * 10, 100);
              animateMove(updated, currentIdx, updated[currentIdx].position, bonus, (afterBonus) => {
                const marked2 = markNumber(bonus, afterBonus);
                const { updated: updated2 } = processBingo(marked2, currentIdx);
                setPlayers(updated2);
                checkGameOver(updated2, bonus);
              });
            }, 2200);
          } else {
            checkGameOver(updated, to);
          }
        });
      }
    };
    doRoll(0);
  }

  function checkGameOver(ps: Player[], pos: number) {
    if (pos >= 100) {
      setWinner(ps[currentIdx].name);
      setPhase('gameover');
      setIsAnimating(false);
    } else {
      setCurrentIdx(i => (i + 1) % ps.length);
      setIsAnimating(false);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── セットアップ画面: 人数選択 ───────────────────────────────────────────

  if (phase === 'setup-count') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-rose-100 to-orange-50 p-6">
        <button
          type="button"
          onClick={onExit}
          className="absolute top-4 left-4 rounded-xl bg-white/60 px-3 py-2 text-gray-600 font-bold text-sm"
        >
          ← もどる
        </button>

        <div className="text-6xl">🎲</div>
        <h1 className="text-3xl font-bold text-rose-800">ビンゴすごろく</h1>
        <p className="text-gray-600 text-center">100マスのすごろく＋ビンゴで<br />ドキドキ たいけつ！</p>

        <div className="rounded-3xl bg-white p-8 shadow-xl w-full max-w-sm">
          <h2 className="text-xl font-bold text-center text-gray-700 mb-6">何人でやる？</h2>
          <div className="flex gap-4 justify-center mb-6">
            {[2, 3, 4].map(n => (
              <motion.button
                key={n}
                type="button"
                onClick={() => setPlayerCount(n)}
                whileTap={{ scale: 0.9 }}
                className={`
                  w-20 h-20 rounded-2xl text-3xl font-bold border-4 transition-all
                  ${playerCount === n
                    ? 'bg-rose-400 text-white border-rose-600 shadow-lg'
                    : 'bg-gray-50 text-gray-600 border-gray-200'}
                `}
              >
                {n}人
              </motion.button>
            ))}
          </div>
          <motion.button
            type="button"
            onClick={() => startSetupCard(0)}
            whileTap={{ scale: 0.95 }}
            className="w-full rounded-2xl bg-rose-500 py-4 text-xl font-bold text-white shadow-[0_4px_0_#be123c]"
          >
            つぎへ →
          </motion.button>
        </div>
      </div>
    );
  }

  // ── セットアップ画面: カード作成 ─────────────────────────────────────────

  if (phase === 'setup-cards') {
    const s = PLAYER_STYLES[setupIdx % PLAYER_STYLES.length];
    const sorted = [...editNumbers].sort((a, b) => a - b);
    return (
      <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-rose-100 to-orange-50 p-4 overflow-y-auto">
        <div className="flex items-center gap-3 w-full max-w-lg">
          <span className={`w-8 h-8 rounded-full ${s.bg} flex-shrink-0`} />
          <h2 className="text-xl font-bold text-gray-700">
            プレイヤー {setupIdx + 1} / {playerCount}：カード作り
          </h2>
        </div>

        {/* 名前入力 */}
        <div className="w-full max-w-lg">
          <label className="block text-sm font-bold text-gray-600 mb-1">なまえ</label>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-lg font-bold focus:border-rose-400 outline-none"
            maxLength={8}
          />
        </div>

        {/* キャラクター選択 */}
        <div className="w-full max-w-lg">
          <p className="text-sm font-bold text-gray-600 mb-2">コマのキャラクターをえらんでね</p>
          <div className="grid grid-cols-5 gap-2">
            {CHARACTERS.map(c => (
              <motion.button
                key={c}
                type="button"
                onClick={() => setEditCharacter(c)}
                whileTap={{ scale: 0.85 }}
                className={`
                  aspect-square text-3xl flex items-center justify-center rounded-2xl border-4 transition-all
                  ${editCharacter === c
                    ? 'border-rose-500 bg-rose-100 shadow-md scale-110'
                    : 'border-transparent bg-gray-50 hover:bg-amber-50'}
                `}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 数字ピッカー */}
        <div className="w-full max-w-lg">
          <p className="text-sm font-bold text-gray-600 mb-2">
            すきな数字を 9つ えらんでね
            <span className={`ml-2 font-bold ${editNumbers.size === 9 ? 'text-emerald-600' : 'text-rose-500'}`}>
              （{editNumbers.size} / 9）
            </span>
          </p>
          <NumberPicker selected={editNumbers} onToggle={n => {
            setEditNumbers(prev => {
              const next = new Set(prev);
              if (next.has(n)) next.delete(n); else if (next.size < 9) next.add(n);
              return next;
            });
          }} />
        </div>

        {/* プレビュー */}
        {editNumbers.size > 0 && (
          <div className="w-full max-w-lg">
            <p className="text-sm font-bold text-gray-600 mb-2">えらんだ数字（カードのプレビュー）</p>
            <div className="grid grid-cols-3 gap-1 max-w-[150px]">
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  className={`
                    aspect-square flex items-center justify-center text-sm font-bold rounded-lg
                    ${sorted[i] != null ? `${s.bg} text-white` : 'bg-gray-100 text-gray-300'}
                  `}
                >
                  {sorted[i] ?? '？'}
                </div>
              ))}
            </div>
          </div>
        )}

        <motion.button
          type="button"
          onClick={confirmCard}
          disabled={editNumbers.size !== 9}
          whileTap={editNumbers.size === 9 ? { scale: 0.95 } : undefined}
          className={`
            w-full max-w-lg rounded-2xl py-4 text-xl font-bold text-white transition-all
            ${editNumbers.size === 9
              ? 'bg-rose-500 shadow-[0_4px_0_#be123c] cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          {setupIdx + 1 < playerCount ? 'つぎのひとへ →' : 'ゲームスタート！🎲'}
        </motion.button>
      </div>
    );
  }

  // ── ゲームオーバー画面 ───────────────────────────────────────────────────

  if (phase === 'gameover') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-8xl"
        >
          🏆
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-amber-800 text-center"
        >
          {winner} の かち！
        </motion.h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {players.map((p, i) => (
            <div key={i} className={`rounded-2xl p-4 ${PLAYER_STYLES[i % PLAYER_STYLES.length].light} border-2 ${PLAYER_STYLES[i % PLAYER_STYLES.length].border}`}>
              <div className="font-bold text-gray-700">{p.name}</div>
              <div className="text-2xl font-bold text-gray-800">{p.position}マス</div>
              <div className="text-sm text-purple-600">ビンゴ {p.doneLines.length}回</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <motion.button
            type="button"
            onClick={() => {
              setPlayers([]);
              setCurrentIdx(0);
              setDiceValue(null);
              setWinner(null);
              setPhase('setup-count');
            }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-rose-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#be123c]"
          >
            もう1かい！
          </motion.button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-2xl bg-white px-6 py-4 text-lg font-bold text-gray-600 border-2 border-gray-200"
          >
            おわり
          </button>
        </div>
      </div>
    );
  }

  // ── ゲーム画面 ──────────────────────────────────────────────────────────

  const current = players[currentIdx];
  const currentStyle = PLAYER_STYLES[currentIdx % PLAYER_STYLES.length];

  // プレイヤーがいる升目のマップ (square → playerIdx[])
  const playerPositions = new Map<number, number[]>();
  players.forEach((p, i) => {
    if (p.position > 0) {
      const arr = playerPositions.get(p.position) ?? [];
      arr.push(i);
      playerPositions.set(p.position, arr);
    }
  });

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-sky-100 to-rose-50 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-1 bg-white/70 border-b border-gray-200">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white/60 px-3 py-1.5 text-gray-600 font-bold text-sm"
        >
          ← もどる
        </button>
        <span className="font-bold text-gray-700 text-sm">🎲 ビンゴすごろく</span>
        <div className="w-20" />
      </div>

      {/* メインエリア */}
      <div className="flex flex-1 min-h-0 p-2 gap-2">
        {/* 左: すごろく盤 */}
        <div className="flex flex-col flex-[2] min-w-0">
          <div className="flex-1 min-h-0 rounded-2xl bg-white shadow-inner overflow-hidden p-1">
            <div
              className="w-full h-full"
              style={{ display: 'grid', gridTemplateRows: 'repeat(10, 1fr)', gridTemplateColumns: 'repeat(10, 1fr)', gap: '1px' }}
            >
              {BOARD_GRID.flatMap((row, ri) =>
                row.map((n, ci) => {
                  const isMultOf10 = n % 10 === 0;
                  const isZorome   = n > 10 && n < 100 && Math.floor(n / 10) === n % 10;
                  const isGoal     = n === 100;
                  const players_here = playerPositions.get(n) ?? [];
                  const isHighlight = highlightSquare === n;

                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`
                        relative flex flex-col items-center justify-center rounded text-center overflow-hidden
                        ${isGoal    ? 'bg-yellow-300 border-2 border-yellow-500'
                          : isMultOf10 ? 'bg-amber-100 border border-amber-300'
                          : isZorome   ? 'bg-violet-50 border border-violet-200'
                          : 'bg-white border border-gray-100'}
                        ${isHighlight ? 'ring-2 ring-rose-500 z-10' : ''}
                      `}
                    >
                      <span className={`
                        leading-none font-bold select-none
                        ${isGoal ? 'text-yellow-700 text-[11px]' : isMultOf10 ? 'text-amber-700 text-[10px]' : isZorome ? 'text-violet-600 text-[10px]' : 'text-gray-600 text-[9px] font-extrabold'}
                      `}>
                        {isGoal ? '🏁' : n}
                      </span>

                      {/* プレイヤーコマ */}
                      {players_here.length > 0 && (
                        <div className="absolute inset-0 flex flex-wrap items-end justify-center pb-0.5 gap-px">
                          {players_here.map(pi => (
                            <motion.div
                              key={pi}
                              initial={{ scale: 0, y: -4 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              className="text-[11px] leading-none flex-shrink-0 drop-shadow"
                            >
                              {players[pi]?.character ?? '🐶'}
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {isZorome && !isGoal && (
                        <span className="text-[6px] absolute top-0 right-0 leading-none">⭐</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 右: ビンゴカード */}
        <div className="flex flex-col flex-1 min-w-0 gap-2 overflow-y-auto">
          {players.map((p, i) => (
            <BingoCardDisplay
              key={i}
              player={p}
              styleIdx={i}
              isCurrent={i === currentIdx}
              flashSquares={flashCards.get(i) ?? new Set()}
            />
          ))}
        </div>
      </div>

      {/* 下部コントロールバー */}
      <div className={`
        flex items-center justify-between px-4 py-2 border-t border-gray-200
        ${currentStyle.light}
      `}>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full ${currentStyle.bg} flex-shrink-0`} />
          <span className="font-bold text-gray-700">{current?.name} のばん</span>
        </div>

        <motion.div
          className="text-7xl leading-none select-none"
          animate={diceShaking
            ? { rotate: [-12, 12, -10, 10, -6, 6, 0], scale: [1, 1.25, 1.1, 1.25, 1.1, 1.2, 1] }
            : diceValue
              ? { scale: [1.4, 1], rotate: [0, 0] }
              : {}}
          transition={{ duration: diceShaking ? 0.18 : 0.3 }}
        >
          {diceValue ? DICE_FACE[diceValue] : '🎲'}
        </motion.div>

        <motion.button
          type="button"
          onClick={handleRoll}
          disabled={isAnimating}
          whileTap={!isAnimating ? { scale: 0.93 } : undefined}
          className={`
            rounded-2xl px-6 py-3 text-xl font-bold text-white transition-all
            ${isAnimating
              ? 'bg-gray-300 cursor-not-allowed'
              : `${currentStyle.bg} shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1`}
          `}
        >
          {isAnimating ? '…' : 'サイコロをふる！'}
        </motion.button>
      </div>

      {/* ビンゴ演出オーバーレイ */}
      <AnimatePresence>
        {showBingo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50"
          >
            <motion.div
              initial={{ scale: 0.3, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.3 }}
              transition={{ type: 'spring', stiffness: 250 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="text-7xl mb-3">🎉</div>
              <div className="text-4xl font-bold text-rose-600 mb-2">ビンゴ！</div>
              <div className="text-xl font-bold text-gray-700 mb-1">{showBingo.name}</div>
              <div className="text-lg text-emerald-600 font-bold">
                ＋{showBingo.count * 10}マス ボーナス！
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
