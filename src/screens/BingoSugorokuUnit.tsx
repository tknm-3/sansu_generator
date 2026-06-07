import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { PLAYER_STYLES, DICE_FACE, CHARACTERS, DEFAULT_CHARS, DEFAULT_NAMES, generateRandomBingoNumbers, type Player } from './bingo-sugoroku/types';
import { BOARD_GRID, markBingoNumber, processAllBingos, getReachNumbers, isLandmark, buildSquareOwnerMap, makeBonusQuiz, rollBonusSteps, shouldTriggerLandmarkBonus, makePredictQuiz, shouldTriggerPredictBonus, rollPredictBonusSteps, type BonusQuiz, type PredictQuiz } from './bingo-sugoroku/logic';
import { BingoCardDisplay } from './bingo-sugoroku/BingoCardDisplay';
import { NumberLineBar } from './bingo-sugoroku/NumberLineBar';
import { BonusQuizOverlay } from './bingo-sugoroku/BonusQuiz';
import { PredictBonusOverlay } from './bingo-sugoroku/PredictBonus';
import { SetupCountScreen, SetupCardsScreen } from './bingo-sugoroku/SetupScreens';
import { GoalOverlay, BonusIntroOverlay, BingoOverlay } from './bingo-sugoroku/Overlays';

type Phase = 'setup-count' | 'setup-cards' | 'game' | 'gameover';

interface Props { onExit: () => void }

/**
 * サイコロを振る前に読み上げるセリフを組み立てる。
 * 現在地・到達できるビンゴ番号・ボーナスマス（キリ番）・ゴールを考慮して
 * バリエーションのある「いくつが出ると嬉しいかな？」系の文章を返す。
 */
export function buildPreRollSpeech(
  pos: number,
  reachNums: number[],
  others: { name: string; pos: number }[] = [],
  rng: () => number = Math.random,
): string {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const prefix = pick([
    `いまは ${pos} マスめ。`,
    `${pos} マスめ だよ。`,
    `いま ${pos} マスめ。`,
  ]);

  const dice = [1, 2, 3, 4, 5, 6] as const;
  const goalStep  = dice.find(d => pos + d >= 100);
  const bonusStep = dice.find(d => isLandmark(pos + d));
  const bingoStep = dice.find(d => reachNums.includes(pos + d));
  // 6以内で前の人にぴったり並べる（＝追いつける）目。一番近い前の人を狙う。
  const ahead = others.filter(o => o.pos > pos).sort((a, b) => a.pos - b.pos);
  const catchTarget = ahead.find(o => o.pos - pos <= 6);
  const catchStep = catchTarget ? catchTarget.pos - pos : undefined;

  // ゴールが見えたら最優先で煽る
  if (goalStep !== undefined) {
    return prefix + pick([
      `${goalStep} が でたら ゴール！`,
      `あと ${goalStep} で ゴール！ でるかな？`,
      `${goalStep} を だそう！ ゴールだよ！`,
    ]);
  }

  // 該当する「うれしい目」を全部あつめて、その中からランダムに1つ言う（毎回ちがう煽りに）
  const lines: string[] = [];
  if (bingoStep !== undefined) {
    lines.push(`${bingoStep} が でたら ビンゴの マスが あるよ！`);
    lines.push(`${bingoStep} で ビンゴ！ どきどき！`);
    lines.push(`${bingoStep} が でると ビンゴに ちかづくよ！`);
  }
  if (bonusStep !== undefined) {
    lines.push(`${bonusStep} が でたら ボーナスマス！`);
    lines.push(`${bonusStep} で キリバン！ でるかな？`);
  }
  if (catchStep !== undefined && catchTarget) {
    lines.push(`${catchStep} が でたら ${catchTarget.name} に おいつけるよ！`);
    lines.push(`${catchStep} で ${catchTarget.name} に ならべる！ がんばれ！`);
  }
  if (lines.length > 0) return prefix + pick(lines);

  // なにも目立つ目がなければ ふつうの煽り
  return prefix + pick([
    `いくつが でるかな？`,
    `どきどき！ なにが でるかな？`,
    `いくつ すすめるかな？`,
    `うんめいの サイコロ！`,
    `おおきいめ でるかな？`,
  ]);
}

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

  // ── オーバーレイ状態 ──
  const [showBingo, setShowBingo]       = useState<{ name: string; steps: number } | null>(null);
  const [showGoal, setShowGoal]         = useState<{ name: string; character: string } | null>(null);
  const [showBonusIntro, setShowBonusIntro] = useState(false);
  const [bonusPlayerIdx, setBonusPlayerIdx] = useState<number | null>(null);
  const [quiz, setQuiz]                     = useState<BonusQuiz | null>(null);
  const [predictQuiz, setPredictQuiz]       = useState<PredictQuiz | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 予想ボーナスを各プレイヤーが何回使ったか（ゲームごとにリセット・一人 PREDICT_BONUS_MAX 回まで）
  const predictUsedRef = useRef<number[]>([]);

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
      predictUsedRef.current = Array(playerCount).fill(0); // 予想ボーナス回数をリセット
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
    // 読み上げ開始から視覚移動まで待つ時間。TTS 起動ラグ（~150ms）を吸収して
    // 「声が先、コマが後」の順序を保つ。
    const SPEAK_LEAD_MS = 300;
    // 1マスあたりの合計間隔（読み上げ開始〜次の読み上げ開始）。
    const STEP_MS = 900;
    let current = from;
    let state = ps;
    function step() {
      current = Math.min(current + 1, to);
      // キリ番(50)はベンチマークとして「もう はんぶん！」を添えて量感を後押し（提案C）
      speakJa(current === 50 ? '50。もう はんぶん' : String(current));
      // 読み上げが始まってからコマを視覚的に進める
      setTimeout(() => {
        setMovingSquare(current);
        state = state.map((p, i) => i === pIdx ? { ...p, position: current } : p);
        setPlayers([...state]);
      }, SPEAK_LEAD_MS);
      if (current < to) {
        timerRef.current = setTimeout(step, STEP_MS);
      } else {
        timerRef.current = setTimeout(() => { setMovingSquare(null); onComplete(state); }, SPEAK_LEAD_MS + 600);
      }
    }
    timerRef.current = setTimeout(step, 120);
  }, []);

  /**
   * ビンゴした人を1人ずつボーナスで進める。サイコロを振った本人だけでなく、
   * 共有マスが光って同時にビンゴした他のプレイヤーも順番に進む（issue #95-1）。
   * 進んだ先でさらにビンゴが連鎖したら、その人もキューに積んで続けて処理する。
   * すべて処理し終えたら onDone を呼ぶ。
   */
  const resolveBingoQueue = useCallback((
    ps: Player[], queue: number[], onDone: (finalPlayers: Player[]) => void,
  ) => {
    if (queue.length === 0) { onDone(ps); return; }
    const [pIdx, ...rest] = queue;
    const from  = ps[pIdx].position;
    const steps = rollBonusSteps();              // 5〜10 のランダム（何ビンゴでも1回分）
    const to    = Math.min(from + steps, 100);
    setShowBingo({ name: ps[pIdx].name, steps });
    timerRef.current = setTimeout(() => {
      setShowBingo(null);
      animateMove(ps, pIdx, from, to, (afterBonus) => {
        const afterMark = applyMark(to, afterBonus);
        const { updated, events } = processAllBingos(afterMark);
        setPlayers(updated);
        if (events.length > 0) {
          timerRef.current = setTimeout(() => speakJa(events.map(e => updated[e.playerIdx].name + ' ビンゴ').join(' ') + '！'), 300);
        }
        resolveBingoQueue(updated, [...rest, ...events.map(e => e.playerIdx)], onDone);
      });
    }, 2200);
  }, [animateMove]);

  function handleAfterLand(movedPlayers: Player[], from: number, square: number, pIdx: number) {
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

    // ビンゴした全員をボーナスで進める。サイコロを振った本人を先頭に処理する。
    const bingoIdxs = events.map(e => e.playerIdx);
    const queue = bingoIdxs.includes(pIdx)
      ? [pIdx, ...bingoIdxs.filter(i => i !== pIdx)]
      : bingoIdxs;
    resolveBingoQueue(updated, queue, (finalPlayers) => {
      checkBonusOrProceed(finalPlayers, from, finalPlayers[pIdx].position, pIdx);
    });
  }

  function handleRoll() {
    if (isAnimating || phase !== 'game') return;
    setIsAnimating(true);
    setDiceValue(null);
    setDiceShaking(true);
    playSfx('dice'); // 振り始めと同時に鳴らして、音と見た目をそろえる

    // 煽りセリフは手番が回ってきたときに言い切っているので、待たずに短く振る。
    const ROLL_TOTAL = 12;
    const getDelay = (i: number) => i < 6 ? 45 : i < 10 ? 80 : 130;
    const doRoll = (i: number) => {
      setDiceValue(Math.ceil(Math.random() * 6));
      if (i < ROLL_TOTAL - 1) {
        timerRef.current = setTimeout(() => doRoll(i + 1), getDelay(i));
      } else {
        const roll = Math.ceil(Math.random() * 6);
        setDiceValue(roll);
        setDiceShaking(false);
        const cp = players[currentIdx];
        const from = cp.position;
        const to   = Math.min(from + roll, 100);
        // 出た目で「どこに止まる？」予想ボーナスを抽選（負けてる人ほど起きやすい・一人2回まで）
        const used = predictUsedRef.current[currentIdx] ?? 0;
        if (shouldTriggerPredictBonus(currentIdx, used, players.map(p => p.position), to)) {
          predictUsedRef.current[currentIdx] = used + 1;
          setPredictQuiz(makePredictQuiz(from, roll)); // 移動は予想クイズの回答後に行う
        } else {
          animateMove(players, currentIdx, from, to, mp => handleAfterLand(mp, from, to, currentIdx));
        }
      }
    };
    doRoll(0);
  }

  /**
   * 予想ボーナスクイズの回答後。出た目どおりに進み、正解なら 3〜5 マス余分に進む。
   * （from → from+roll+ボーナス を 1回の移動でつなげて「いっぱい進めた！」感を出す）
   */
  function handlePredictAnswer(correct: boolean) {
    const pq = predictQuiz;
    setPredictQuiz(null);
    if (!pq) return;
    const bonus = correct ? rollPredictBonusSteps() : 0;
    const from  = pq.from;
    const to    = Math.min(from + pq.roll + bonus, 100);
    animateMove(players, currentIdx, from, to, mp => handleAfterLand(mp, from, to, currentIdx));
  }

  function checkBonusOrProceed(ps: Player[], from: number, pos: number, pIdx: number) {
    // キリ番マスのミニ問題を出すか。順位でキャッチアップ補正（びり=必ず/トップ=なし/中間=従来）。
    const trigger = shouldTriggerLandmarkBonus(from, pos, ps.map(p => p.position));
    if (trigger) {
      setShowBonusIntro(true);
      setBonusPlayerIdx(pIdx);
      setIsAnimating(false);
      // 「だれとだれの差」用に、いまのコマ位置・名前・キャラを渡す（実際の盤面で出題）
      const refs = ps.map(p => ({ name: p.name, char: p.character, pos: p.position }));
      timerRef.current = setTimeout(() => { setShowBonusIntro(false); setQuiz(makeBonusQuiz(refs)); }, 2000);
    } else {
      checkGameOver(ps);
    }
  }

  /** ボーナスのミニ問題に答えたあと。正解→ランダムでビンゴマスを塗る、不正解→つぎのひとへ */
  function handleQuizAnswer(correct: boolean) {
    setQuiz(null);
    if (correct) {
      applyBonusBingoMark();
    } else {
      setBonusPlayerIdx(null);
      checkGameOver(players);
    }
  }

  /**
   * ボーナスマスのクイズ正解後。ぬるマスは本人に選ばせず、ランダムで1つ自動で塗る。
   * すでにカードが全部うまっていて ぬるマスが無いときは進めなくなってしまうので、
   * そのときは ビンゴしたのと同じくらい進むボーナス（resolveBingoQueue）にする。
   */
  function applyBonusBingoMark() {
    const pIdx = bonusPlayerIdx ?? currentIdx;
    setBonusPlayerIdx(null);
    setIsAnimating(true);

    // まだ ぬっていないマス（中央フリースペースは最初から true なので自然に除外される）
    const openCells = players[pIdx].numbers
      .map((_, i) => i)
      .filter(i => !players[pIdx].checked[i]);

    // ぬるマスが無い → 進めなくなるので、ビンゴ相当のボーナスで進める（連鎖込み）
    if (openCells.length === 0) {
      resolveBingoQueue(players, [pIdx], (finalPlayers) => checkGameOver(finalPlayers));
      return;
    }

    // 未チェックのマスからランダムに1つ選んで塗る
    const cellIdx = openCells[Math.floor(Math.random() * openCells.length)];

    const up = players.map((pl, i) => {
      if (i !== pIdx) return pl;
      const newChecked = [...pl.checked];
      newChecked[cellIdx] = true;
      return { ...pl, checked: newChecked };
    });

    // 塗ったセルをフラッシュ
    setFlashCards(new Map([[pIdx, new Set<number>([cellIdx])]]));
    setTimeout(() => setFlashCards(new Map()), 700);

    const { updated, events } = processAllBingos(up);
    setPlayers(updated);

    if (events.length > 0) {
      setTimeout(() => speakJa(events.map(e => updated[e.playerIdx].name + ' ビンゴ').join(' ') + '！'), 300);
      // ボーナスマスで揃ったビンゴも全員ボーナスで進める（連鎖込み）。
      const bingoIdxs = events.map(e => e.playerIdx);
      const queue = bingoIdxs.includes(pIdx)
        ? [pIdx, ...bingoIdxs.filter(i => i !== pIdx)]
        : bingoIdxs;
      resolveBingoQueue(updated, queue, (finalPlayers) => checkGameOver(finalPlayers));
      return;
    }

    checkGameOver(updated);
  }

  function checkGameOver(ps: Player[]) {
    // ボーナスで他の人が100に到達することもあるので、本人優先で誰かゴールしていれば勝ち。
    const winnerIdx = ps[currentIdx].position >= 100 ? currentIdx : ps.findIndex(p => p.position >= 100);
    if (winnerIdx !== -1) {
      const w = ps[winnerIdx];
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

  // 手番が回ってきたら、その人の現在地・嬉しい目をすぐ読み上げて期待感を出す。
  // （サイコロを振る前に言い切るので、振ったあとは待たずに出目を出せる。）
  // currentIdx / phase が変わったときだけ読む。players を依存に入れるとコマ移動の
  // たびに読み直してしまうため、あえて currentIdx 時点の値をクロージャで使う。
  useEffect(() => {
    if (phase !== 'game' || winner) return;
    const p = players[currentIdx];
    if (!p) return;
    const others = players.filter((_, i) => i !== currentIdx).map(o => ({ name: o.name, pos: o.position }));
    speakJa(buildPreRollSpeech(p.position, getReachNumbers(p), others));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, phase]);

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
            onClick={() => { setPlayers([]); setCurrentIdx(0); setDiceValue(null); setWinner(null); setQuiz(null); setPredictQuiz(null); setBonusPlayerIdx(null); setPhase('setup-count'); }}>
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

  const blocked = isAnimating || showBonusIntro || !!quiz || !!predictQuiz || !!showGoal;

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
                const isBonus     = isLandmark(n);
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
                    {/* マス番号: コマがいるときは左上に退避、いないときは中央に大きく */}
                    <span className={`
                      leading-none font-black select-none
                      ${playersHere.length > 0
                        ? 'absolute top-0 left-0 px-px text-[8px] z-10'
                        : 'text-xs'}
                      ${isGoal    ? 'text-yellow-900'
                      : isBonus   ? 'text-amber-900'
                      : checkedOwners.length > 0 && owners.length === 1 ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'
                      : 'text-gray-900'}`}>
                      {isGoal ? '🏁' : n}
                    </span>

                    {/* ボーナスマスは星と数字の両方を見せる（星は右上の小バッジ） */}
                    {isBonus && !isGoal && (
                      <span className="absolute top-0 right-0 leading-none text-[8px] z-10 select-none pointer-events-none">⭐</span>
                    )}

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
                      <span className="text-[6px] absolute bottom-0 right-0 leading-none text-yellow-600">★</span>
                    )}

                    {/* プレイヤーコマ */}
                    {playersHere.length > 0 && (
                      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0">
                        {playersHere.map(pi => (
                          <motion.div key={pi} initial={{ scale:0, y:-6 }} animate={{ scale:1, y:0 }} transition={{ type:'spring', stiffness:400, damping:20 }}
                            className={`leading-none flex-shrink-0 drop-shadow-md ${playersHere.length === 1 ? 'text-[20px]' : 'text-[12px]'}`}>
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

      {/* 数直線バー（横一直線で「数が大きい＝右に遠い／バーが長い」を明示） */}
      <NumberLineBar players={players} currentIdx={currentIdx} />

      {/* フッター */}
      <div className={`flex items-center justify-between px-4 py-2 border-t border-gray-200 ${currentStyle.light}`}>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full ${currentStyle.bg} flex-shrink-0`} />
          <span className="font-bold text-gray-700">{current?.name} のばん</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <motion.div className="text-7xl leading-none select-none"
            animate={diceShaking ? { rotate:[-12,12,-10,10,-6,6,0], scale:[1,1.25,1.1,1.25,1.1,1.2,1] } : diceValue ? { scale:[1.4,1], rotate:[0,0] } : {}}
            transition={diceShaking ? { duration: 0.3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}>
            {diceValue ? DICE_FACE[diceValue] : '🎲'}
          </motion.div>
          {/* 出目の数字（つぶ＝量 と 数字＝記号 を結びつける・提案C） */}
          {diceValue && !diceShaking && (
            <span className="text-base font-black text-gray-600 select-none">{diceValue} すすむ</span>
          )}
        </div>
        <motion.button type="button" onClick={handleRoll} disabled={blocked}
          whileTap={!blocked ? { scale: 0.93 } : undefined}
          className={`rounded-2xl px-6 py-3 text-xl font-bold text-white transition-all
            ${blocked ? 'bg-gray-300 cursor-not-allowed' : `${currentStyle.bg} shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1`}`}>
          {isAnimating ? '…' : 'サイコロをふる！'}
        </motion.button>
      </div>

      <GoalOverlay        show={showGoal} />
      <BonusIntroOverlay  show={showBonusIntro} players={players} bonusPlayerIdx={bonusPlayerIdx} />
      <BonusQuizOverlay   quiz={quiz} player={bonusPlayerIdx !== null ? players[bonusPlayerIdx] : null} styleIdx={bonusPlayerIdx ?? 0} onAnswer={handleQuizAnswer} />
      <PredictBonusOverlay quiz={predictQuiz} player={current ?? null} styleIdx={currentIdx} onAnswer={handlePredictAnswer} />
      <BingoOverlay       show={showBingo} />
    </div>
  );
}
