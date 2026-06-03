import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { speakJa } from '../features/speech/tts';
import { PLAYER_STYLES, DICE_FACE, CHARACTERS, DEFAULT_CHARS, DEFAULT_NAMES, generateRandomBingoNumbers, type Player } from './bingo-sugoroku/types';
import { BOARD_GRID, markBingoNumber, processAllBingos, getReachNumbers, generateBonusSquares, buildSquareOwnerMap } from './bingo-sugoroku/logic';
import { BingoCardDisplay } from './bingo-sugoroku/BingoCardDisplay';
import { SetupCountScreen, SetupCardsScreen } from './bingo-sugoroku/SetupScreens';
import { GoalOverlay, BonusIntroOverlay, BonusPickOverlay, BingoOverlay } from './bingo-sugoroku/Overlays';

type Phase = 'setup-count' | 'setup-cards' | 'game' | 'gameover';

interface Props { onExit: () => void }

export function BingoSugorokuUnit({ onExit }: Props) {
  // ── セットアップ状態 ──
  const [phase, setPhase]               = useState<Phase>('setup-count');
  const [playerCount, setPlayerCount]   = useState(3);
  const [setupIdx, setSetupIdx]         = useState(0);
  const [editName, setEditName]         = useState('');
  const [editNumbers, setEditNumbers]   = useState<Set<number>>(new Set());
  const [editCharacter, setEditCharacter] = useState<string>(CHARACTERS[0]);

  // ── ゲーム状態 ──
  const [players, setPlayers]           = useState<Player[]>([]);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [diceValue, setDiceValue]       = useState<number | null>(null);
  const [diceShaking, setDiceShaking]   = useState(false);
  const [isAnimating, setIsAnimating]   = useState(false);
  const [winner, setWinner]             = useState<string | null>(null);
  const [flashCards, setFlashCards]     = useState<Map<number, Set<number>>>(new Map());
  const [movingSquare, setMovingSquare] = useState<number | null>(null);
  const [flashedSquare, setFlashedSquare] = useState<number | null>(null);
  const [bonusSquares, setBonusSquares] = useState<Set<number>>(new Set());

  // ── オーバーレイ状態 ──
  const [showBingo, setShowBingo]       = useState<{ name: string; count: number } | null>(null);
  const [showGoal, setShowGoal]         = useState<{ name: string; character: string } | null>(null);
  const [showBonusIntro, setShowBonusIntro] = useState(false);
  const [choosingBonus, setChoosingBonus]   = useState(false);
  const [bonusPlayerIdx, setBonusPlayerIdx] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── セットアップ ─────────────────────────────────────────────────────────

  function startSetupCard(idx: number) {
    setEditName(DEFAULT_NAMES[idx] ?? `プレイヤー${idx + 1}`);
    setEditNumbers(new Set(generateRandomBingoNumbers()));
    setEditCharacter(DEFAULT_CHARS[idx] ?? CHARACTERS[idx % CHARACTERS.length]);
    setSetupIdx(idx);
    setPhase('setup-cards');
  }

  function confirmCard() {
    if (editNumbers.size !== 8) return;
    const others = [...editNumbers].filter(n => n !== 1).sort((a, b) => a - b);
    const nums = [...others.slice(0,4), 1, ...others.slice(4)];
    const preChecked = Array(9).fill(false);
    preChecked[4] = true;

    const newPlayer: Player = {
      name: editName || DEFAULT_NAMES[setupIdx] || `プレイヤー${setupIdx + 1}`,
      numbers: nums, checked: preChecked, position: 1, doneLines: [],
      character: editCharacter,
    };
    setPlayers(prev => { const next = [...prev]; next[setupIdx] = newPlayer; return next; });
    if (setupIdx + 1 < playerCount) {
      startSetupCard(setupIdx + 1);
    } else {
      setBonusSquares(new Set(generateBonusSquares(5)));
      setPhase('game');
    }
  }

  // ── ゲームロジック ───────────────────────────────────────────────────────

  function applyMark(square: number, ps: Player[]) {
    const { updated, flashMap } = markBingoNumber(square, ps);
    setFlashCards(flashMap);
    setTimeout(() => setFlashCards(new Map()), 700);
    if (flashMap.size > 0) {
      setFlashedSquare(square);
      setTimeout(() => setFlashedSquare(null), 1300);
    }
    return updated;
  }

  const animateMove = useCallback((
    ps: Player[], pIdx: number, from: number, to: number,
    onComplete: (finalPlayers: Player[]) => void,
  ) => {
    let current = from;
    let state = ps;
    function step() {
      current = Math.min(current + 1, to);
      setMovingSquare(current);
      speakJa(String(current));
      state = state.map((p, i) => i === pIdx ? { ...p, position: current } : p);
      setPlayers([...state]);
      if (current < to) {
        timerRef.current = setTimeout(step, 350);
      } else {
        timerRef.current = setTimeout(() => { setMovingSquare(null); onComplete(state); }, 500);
      }
    }
    timerRef.current = setTimeout(step, 100);
  }, []);

  function handleAfterLand(movedPlayers: Player[], square: number, pIdx: number) {
    const before    = movedPlayers;
    const afterMark = applyMark(square, movedPlayers);
    const { updated, events } = processAllBingos(afterMark);
    setPlayers(updated);

    const newReachNames = afterMark
      .filter((p, i) => getReachNumbers(before[i]).length === 0 && getReachNumbers(p).length > 0)
      .map(p => p.name);
    timerRef.current = setTimeout(() => {
      if (events.length > 0) {
        speakJa(events.map(e => updated[e.playerIdx].name + ' ビンゴ').join(' ') + '！');
      } else if (newReachNames.length > 0) {
        speakJa(newReachNames.join(' ') + ' リーチ！');
      }
    }, 300);

    const myBingo = events.find(e => e.playerIdx === pIdx);
    if (myBingo) {
      setShowBingo({ name: updated[pIdx].name, count: myBingo.count });
      timerRef.current = setTimeout(() => {
        setShowBingo(null);
        const bonus = Math.min(updated[pIdx].position + myBingo.count * 10, 100);
        animateMove(updated, pIdx, updated[pIdx].position, bonus, (afterBonus) => {
          const afterMark2 = applyMark(bonus, afterBonus);
          const { updated: u2, events: ev2 } = processAllBingos(afterMark2);
          setPlayers(u2);
          if (ev2.length > 0) setTimeout(() => speakJa(ev2.map(e => u2[e.playerIdx].name + ' ビンゴ').join(' ') + '！'), 300);
          checkBonusOrProceed(u2, bonus, pIdx);
        });
      }, 2200);
    } else {
      checkBonusOrProceed(updated, square, pIdx);
    }
  }

  function handleRoll() {
    if (isAnimating || phase !== 'game') return;
    setIsAnimating(true);
    setDiceShaking(true);
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
        animateMove(players, currentIdx, from, to, mp => handleAfterLand(mp, to, currentIdx));
      }
    };
    doRoll(0);
  }

  function checkBonusOrProceed(ps: Player[], pos: number, pIdx: number) {
    if (bonusSquares.has(pos) && pos < 100) {
      setShowBonusIntro(true);
      setBonusPlayerIdx(pIdx);
      setIsAnimating(false);
      timerRef.current = setTimeout(() => { setShowBonusIntro(false); setChoosingBonus(true); }, 2200);
    } else {
      checkGameOver(ps, pos);
    }
  }

  /** ボーナスマスで選んだビンゴカードのセルをチェックしてビンゴ判定 */
  function handleBonusPick(cellIdx: number) {
    setChoosingBonus(false);
    const pIdx = bonusPlayerIdx ?? currentIdx;
    setBonusPlayerIdx(null);
    setIsAnimating(true);

    const up = players.map((pl, i) => {
      if (i !== pIdx) return pl;
      const newChecked = [...pl.checked];
      newChecked[cellIdx] = true;
      return { ...pl, checked: newChecked };
    });

    // 選んだセルをフラッシュ
    const flashSet = new Set<number>([cellIdx]);
    setFlashCards(new Map([[pIdx, flashSet]]));
    setTimeout(() => setFlashCards(new Map()), 700);

    const { updated, events } = processAllBingos(up);
    setPlayers(updated);

    if (events.length > 0) {
      setTimeout(() => speakJa(events.map(e => updated[e.playerIdx].name + ' ビンゴ').join(' ') + '！'), 300);
      const myBingo = events.find(e => e.playerIdx === pIdx);
      if (myBingo) {
        setShowBingo({ name: updated[pIdx].name, count: myBingo.count });
        timerRef.current = setTimeout(() => {
          setShowBingo(null);
          const bonus = Math.min(updated[pIdx].position + myBingo.count * 10, 100);
          animateMove(updated, pIdx, updated[pIdx].position, bonus, (afterBonus) => {
            const afterMark2 = applyMark(bonus, afterBonus);
            const { updated: u2, events: ev2 } = processAllBingos(afterMark2);
            setPlayers(u2);
            if (ev2.length > 0) setTimeout(() => speakJa(ev2.map(e => u2[e.playerIdx].name + ' ビンゴ').join(' ') + '！'), 300);
            checkGameOver(u2, bonus);
          });
        }, 2200);
        return;
      }
    }

    checkGameOver(updated, updated[pIdx].position);
  }

  function checkGameOver(ps: Player[], pos: number) {
    if (pos >= 100) {
      const w = ps[currentIdx];
      speakJa(`${w.name} ゴール！`);
      setShowGoal({ name: w.name, character: w.character });
      timerRef.current = setTimeout(() => {
        setShowGoal(null); setWinner(w.name); setPhase('gameover'); setIsAnimating(false);
      }, 3000);
    } else {
      setCurrentIdx(i => (i + 1) % ps.length);
      setIsAnimating(false);
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── フェーズ別レンダー ───────────────────────────────────────────────────

  if (phase === 'setup-count') {
    return <SetupCountScreen onExit={onExit} playerCount={playerCount} setPlayerCount={setPlayerCount} onNext={() => startSetupCard(0)} />;
  }
  if (phase === 'setup-cards') {
    return (
      <SetupCardsScreen setupIdx={setupIdx} playerCount={playerCount}
        editName={editName} setEditName={setEditName}
        editNumbers={editNumbers} setEditNumbers={setEditNumbers}
        editCharacter={editCharacter} setEditCharacter={setEditCharacter}
        onConfirm={confirmCard} />
    );
  }
  if (phase === 'gameover') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-8xl">🏆</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-amber-800 text-center">
          {winner} の かち！
        </motion.h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {players.map((p, i) => (
            <div key={i} className={`rounded-2xl p-4 ${PLAYER_STYLES[i % PLAYER_STYLES.length].light} border-2 ${PLAYER_STYLES[i % PLAYER_STYLES.length].border}`}>
              <div className="font-bold text-gray-700">{p.character} {p.name}</div>
              <div className="text-2xl font-bold text-gray-800">{p.position}マス</div>
              <div className="text-sm text-purple-600">ビンゴ {p.doneLines.length}回</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <motion.button type="button" whileTap={{ scale: 0.95 }} className="rounded-2xl bg-rose-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#be123c]"
            onClick={() => { setPlayers([]); setCurrentIdx(0); setDiceValue(null); setWinner(null); setBonusSquares(new Set()); setPhase('setup-count'); }}>
            もう1かい！
          </motion.button>
          <button type="button" onClick={onExit} className="rounded-2xl bg-white px-6 py-4 text-lg font-bold text-gray-600 border-2 border-gray-200">おわり</button>
        </div>
      </div>
    );
  }

  // ── ゲーム画面 ─────────────────────────────────────────────────────────

  const current = players[currentIdx];
  const currentStyle = PLAYER_STYLES[currentIdx % PLAYER_STYLES.length];

  const playerPositions = new Map<number, number[]>();
  players.forEach((p, i) => { if (p.position > 0) { const a = playerPositions.get(p.position) ?? []; a.push(i); playerPositions.set(p.position, a); } });

  // 現在のプレイヤーのリーチ数字 → ボード上でハイライト
  const reachSquares = new Set(current ? getReachNumbers(current) : []);

  // ビンゴカードに含まれるマス → オーナー（プレイヤーインデックス）のリスト
  const squareOwners = buildSquareOwnerMap(players);

  const blocked = isAnimating || showBonusIntro || choosingBonus || !!showGoal;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-sky-100 to-rose-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-white/70 border-b border-gray-200">
        <button type="button" onClick={onExit} className="rounded-xl bg-white/60 px-3 py-1.5 text-gray-600 font-bold text-sm">← もどる</button>
        <span className="font-bold text-gray-700 text-sm">🎲 ビンゴすごろく</span>
        <div className="w-20" />
      </div>

      <div className="flex flex-1 min-h-0 p-2 gap-2">
        {/* すごろく盤 */}
        <div className="flex flex-col flex-[2] min-w-0">
          <div className="flex-1 min-h-0 rounded-2xl bg-white shadow-inner overflow-hidden p-1">
            <div className="w-full h-full" style={{ display:'grid', gridTemplateRows:'repeat(10,1fr)', gridTemplateColumns:'repeat(10,1fr)', gap:'1px' }}>
              {BOARD_GRID.flatMap((row, ri) => row.map((n, ci) => {
                const isGoal      = n === 100;
                const isBonus     = bonusSquares.has(n);
                const playersHere = playerPositions.get(n) ?? [];
                const isMoving    = movingSquare === n;
                const isFlashed   = flashedSquare === n;
                const isReach     = reachSquares.has(n);
                const owners      = squareOwners.get(n) ?? [];

                // チェック済みのオーナーは除外（チェック済みはすでに色がついている）
                const checkedOwners   = owners.filter(pi =>  players[pi]?.checked[players[pi].numbers.indexOf(n)]);

                // 背景色の決定: ゴール > ボーナス > ビンゴマス（オーナー1人） > その他
                let bgClass = 'bg-white border border-gray-200';
                if (isGoal) {
                  bgClass = 'bg-yellow-300 border-2 border-yellow-500';
                } else if (isBonus) {
                  bgClass = 'bg-amber-200 border-2 border-amber-500';
                } else if (owners.length === 1) {
                  const s = PLAYER_STYLES[owners[0] % PLAYER_STYLES.length];
                  bgClass = checkedOwners.length > 0
                    ? `${s.bg} border border-white/30`
                    : `${s.light} border ${s.border}`;
                } else if (owners.length > 1) {
                  bgClass = 'bg-gray-50 border border-gray-300';
                } else if (isReach) {
                  bgClass = 'bg-yellow-50 border border-yellow-300';
                }

                const ringClass = isFlashed
                  ? 'ring-4 ring-yellow-400 z-20'
                  : isMoving
                  ? 'ring-2 ring-rose-400/60 z-10'
                  : '';

                return (
                  <div key={`${ri}-${ci}`} className={`relative flex items-center justify-center rounded text-center overflow-hidden ${bgClass} ${ringClass}`}>
                    {/* マス番号 */}
                    <span className={`leading-none font-black select-none text-[10px]
                      ${isGoal    ? 'text-yellow-800'
                      : isBonus   ? 'text-amber-800'
                      : checkedOwners.length > 0 && owners.length === 1 ? 'text-white'
                      : owners.length === 1 ? PLAYER_STYLES[owners[0] % PLAYER_STYLES.length].text
                      : 'text-gray-700'}`}>
                      {isGoal ? '🏁' : isBonus ? '⭐' : n}
                    </span>

                    {/* 複数オーナーの場合: 下部に小さいカラードット */}
                    {owners.length > 1 && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-px pb-px">
                        {owners.map(pi => (
                          <span key={pi} className={`w-1.5 h-1.5 rounded-full ${PLAYER_STYLES[pi % PLAYER_STYLES.length].bg} ${players[pi]?.checked[players[pi].numbers.indexOf(n)] ? 'opacity-100' : 'opacity-50'}`} />
                        ))}
                      </div>
                    )}

                    {/* リーチ印 */}
                    {isReach && !isGoal && owners.length === 0 && (
                      <span className="text-[5px] absolute bottom-0 left-0 leading-none text-yellow-500">★</span>
                    )}

                    {/* プレイヤーコマ */}
                    {playersHere.length > 0 && (
                      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0">
                        {playersHere.map(pi => (
                          <motion.div key={pi} initial={{ scale:0, y:-6 }} animate={{ scale:1, y:0 }} transition={{ type:'spring', stiffness:400, damping:20 }}
                            className={`leading-none flex-shrink-0 drop-shadow-md ${playersHere.length === 1 ? 'text-[15px]' : 'text-[9px]'}`}>
                            {players[pi]?.character ?? '🐶'}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* ビンゴカード */}
        <div className="flex flex-col flex-1 min-w-0 gap-2 overflow-y-auto">
          {players.map((p, i) => (
            <BingoCardDisplay key={i} player={p} styleIdx={i} isCurrent={i === currentIdx} flashSquares={flashCards.get(i) ?? new Set()} />
          ))}
        </div>
      </div>

      {/* フッター */}
      <div className={`flex items-center justify-between px-4 py-2 border-t border-gray-200 ${currentStyle.light}`}>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full ${currentStyle.bg} flex-shrink-0`} />
          <span className="font-bold text-gray-700">{current?.name} のばん</span>
        </div>
        <motion.div className="text-7xl leading-none select-none"
          animate={diceShaking ? { rotate:[-12,12,-10,10,-6,6,0], scale:[1,1.25,1.1,1.25,1.1,1.2,1] } : diceValue ? { scale:[1.4,1], rotate:[0,0] } : {}}
          transition={{ duration: diceShaking ? 0.18 : 0.3 }}>
          {diceValue ? DICE_FACE[diceValue] : '🎲'}
        </motion.div>
        <motion.button type="button" onClick={handleRoll} disabled={blocked}
          whileTap={!blocked ? { scale: 0.93 } : undefined}
          className={`rounded-2xl px-6 py-3 text-xl font-bold text-white transition-all
            ${blocked ? 'bg-gray-300 cursor-not-allowed' : `${currentStyle.bg} shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1`}`}>
          {isAnimating ? '…' : 'サイコロをふる！'}
        </motion.button>
      </div>

      <GoalOverlay        show={showGoal} />
      <BonusIntroOverlay  show={showBonusIntro} players={players} bonusPlayerIdx={bonusPlayerIdx} />
      <BonusPickOverlay   show={choosingBonus}  players={players} bonusPlayerIdx={bonusPlayerIdx} onPick={handleBonusPick} />
      <BingoOverlay       show={showBingo} />
    </div>
  );
}
