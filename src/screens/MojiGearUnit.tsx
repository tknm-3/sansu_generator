import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { WORLDS } from '../lib/kotoba/worlds';
import { generateQuestion } from '../lib/kotoba/generate';
import type { MojiQuestion, WorldDef } from '../lib/kotoba/types';
import { isWorldUnlocked, isWorldCleared, worldSparkles, recordWorldClear, loadKotobaHistory } from '../lib/kotoba/progress';
import { makeAdaptive, recordAttempt, type Adaptive } from '../lib/kotoba/adaptive';
import { speakJa, speakMoraBreakdown } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { IfKun } from '../components/kotoba/IfKun';
import { GearBackground } from '../components/kotoba/GearBackground';

interface Props {
  characterName: string;
  characterId?: string;
  onExit: () => void;
}

const Q_PER_WORLD = 5;

function sparkleStr(n: number): string {
  return n > 0 ? '✨'.repeat(n) : '・・・';
}

export function MojiGearUnit({ onExit }: Props) {
  const [phase, setPhase] = useState<'hub' | 'intro' | 'play' | 'result'>('hub');
  const [world, setWorld] = useState<WorldDef | null>(null);
  const [adaptive, setAdaptive] = useState<Adaptive | null>(null);
  const [question, setQuestion] = useState<MojiQuestion | null>(null);
  const [qi, setQi] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const total = loadKotobaHistory().totalSparkles;

  function nextQuestion(w: WorldDef, a: Adaptive): MojiQuestion {
    const line = w.lineIds[Math.floor(Math.random() * w.lineIds.length)];
    return generateQuestion(line, undefined, { ...(w.difficulty ?? {}), ...a.opts() });
  }

  function openWorld(w: WorldDef) {
    setWorld(w);
    setPhase('intro');
  }

  function beginPlay() {
    if (!world) return;
    const a = makeAdaptive();
    setAdaptive(a);
    setQuestion(nextQuestion(world, a));
    setQi(0);
    setMistakes(0);
    setPhase('play');
  }

  function onAnswered(correct: boolean) {
    if (!world || !adaptive || !question) return;
    recordAttempt(question.lineId, correct);
    adaptive.record(correct);
    if (!correct) {
      setMistakes((m) => m + 1);
      return;
    }
    if (qi + 1 >= Q_PER_WORLD) {
      const sparkles = Math.max(1, 3 - mistakes);
      recordWorldClear(world.id, sparkles);
      setPhase('result');
    } else {
      setQi((i) => i + 1);
      setQuestion(nextQuestion(world, adaptive));
    }
  }

  if (phase === 'intro' && world) {
    return <IntroScreen world={world} onStart={beginPlay} onBack={() => setPhase('hub')} />;
  }

  if (phase === 'play' && world && question) {
    return (
      <PlayScreen
        key={qi}
        world={world}
        question={question}
        index={qi}
        total={Q_PER_WORLD}
        onAnswered={onAnswered}
        onQuit={() => setPhase('hub')}
      />
    );
  }

  if (phase === 'result' && world) {
    return <ResultScreen world={world} mistakes={mistakes} onAgain={beginPlay} onHub={() => setPhase('hub')} />;
  }

  // ── ハブ（旅の地図）──
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-100 via-amber-50 to-yellow-50 p-5">
      <GearBackground />
      <div className="relative mx-auto max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={onExit} className="rounded-full bg-white/90 px-4 py-2 font-bold text-amber-700 shadow">← もどる</button>
          <div className="rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-amber-600 shadow">✨ {total}</div>
        </div>

        <div className="mb-3 flex flex-col items-center">
          <IfKun mood="idle" size={84} />
          <h1 className="mt-1 text-2xl font-black text-amber-900 drop-shadow-sm">もじギア・ファクトリー</h1>
          <p className="text-sm font-bold text-amber-700">IF-くんと いろんな せかいへ！</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {WORLDS.map((w, i) => {
            const unlocked = isWorldUnlocked(i);
            const cleared = isWorldCleared(w.id);
            return (
              <motion.button
                key={w.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && openWorld(w)}
                whileTap={unlocked ? { scale: 0.95 } : undefined}
                whileHover={unlocked ? { y: -3 } : undefined}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${w.tint} p-4 text-center shadow-lg ${unlocked ? '' : 'opacity-50 grayscale'}`}
                style={{ boxShadow: '0 5px 0 rgba(120,90,50,0.25)' }}
              >
                {i >= 10 && unlocked && <div className="absolute right-1 top-1 rounded-full bg-white/70 px-2 text-[10px] font-bold text-violet-600">⭐じょうきゅう</div>}
                <div className="text-5xl drop-shadow">{unlocked ? w.emoji : '🔒'}</div>
                <div className="mt-1 text-sm font-black text-stone-700">{w.name}</div>
                <div className="text-[11px] font-bold text-stone-500">{unlocked ? w.friend : 'まだ ひらかない'}</div>
                <div className="mt-1 h-4 text-sm">{cleared ? sparkleStr(worldSparkles(w.id)) : ''}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 世界の入口（ものがたり）──
function IntroScreen({ world, onStart, onBack }: { world: WorldDef; onStart: () => void; onBack: () => void }) {
  useEffect(() => {
    speakJa(world.story.replace(/\n/g, '。'));
  }, [world]);
  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b ${world.tint} p-8`}>
      <GearBackground opacity={0.1} />
      <button type="button" onClick={onBack} className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 font-bold text-stone-600 shadow">← ちずへ</button>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-8xl drop-shadow-lg">
        {world.emoji}
      </motion.div>
      <h2 className="text-3xl font-black text-stone-800">{world.name}</h2>
      <div className="flex items-end gap-2">
        <IfKun mood="idle" size={64} />
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="relative max-w-xs rounded-3xl bg-white/95 p-4 text-center text-lg font-bold text-stone-700 shadow-lg"
        >
          <div className="mb-1 text-sm font-black text-amber-600">{world.friend}</div>
          {world.story.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </motion.div>
      </div>
      <motion.button
        type="button" onClick={onStart}
        whileTap={{ scale: 0.95 }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
        className="mt-2 rounded-full bg-amber-500 px-10 py-4 text-2xl font-black text-white shadow-lg"
        style={{ boxShadow: '0 6px 0 #b45309' }}
      >
        ▶ スタート
      </motion.button>
    </div>
  );
}

// ── 結果（クリアの お祝い）──
function ResultScreen({ world, mistakes, onAgain, onHub }: { world: WorldDef; mistakes: number; onAgain: () => void; onHub: () => void }) {
  const sparkles = Math.max(1, 3 - mistakes);
  useEffect(() => {
    playSfx('fanfare');
    speakJa(`クリア！ ${world.friend} が よろこんでいるよ`);
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    const t = setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 } }), 400);
    return () => clearTimeout(t);
  }, [world]);
  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b ${world.tint} p-8`}>
      <GearBackground opacity={0.12} />
      <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-8xl drop-shadow-lg">{world.emoji}</motion.div>
      <IfKun mood="happy" size={120} />
      <h2 className="text-4xl font-black text-amber-900 drop-shadow">クリア！</h2>
      <div className="text-xl font-bold text-stone-700">{world.friend} が よろこんでいる！</div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="text-5xl">{sparkleStr(sparkles)}</motion.div>
      <div className="mt-2 flex gap-4">
        <button type="button" onClick={onAgain} className="rounded-2xl bg-amber-500 px-6 py-3 text-xl font-black text-white shadow" style={{ boxShadow: '0 4px 0 #b45309' }}>もういちど</button>
        <button type="button" onClick={onHub} className="rounded-2xl bg-white px-6 py-3 text-xl font-black text-amber-700 shadow" style={{ boxShadow: '0 4px 0 #d6d3d1' }}>ちずへ</button>
      </div>
    </div>
  );
}

// ── 出題画面 ──
interface PlayProps {
  world: WorldDef;
  question: MojiQuestion;
  index: number;
  total: number;
  onAnswered: (correct: boolean) => void;
  onQuit: () => void;
}

function PlayScreen({ world, question, index, total, onAnswered, onQuit }: PlayProps) {
  const [wrong, setWrong] = useState<number | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const [hint, setHint] = useState('');
  const [done, setDone] = useState(false);
  const [mood, setMood] = useState<'idle' | 'think' | 'eat' | 'happy'>('idle');
  const [lit, setLit] = useState(-1);

  const answerStr = useMemo(() => {
    if (question.mode !== 'build') return '';
    return (question.answer as number[]).map((i) => question.choices[i].label).join('');
  }, [question]);

  function readWord() {
    setLit(-1);
    speakMoraBreakdown(question.speak, question.mora, (i) => setLit(i));
    setTimeout(() => setLit(-1), 500 + question.mora.length * 600);
  }

  // 入室時に お題を 1拍ずつ よみあげる
  useEffect(() => {
    const t = setTimeout(readWord, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  function finishCorrect() {
    if (done) return;
    setDone(true);
    setMood('eat');
    playSfx('correct');
    speakJa('カチッ！');
    setTimeout(() => setMood('happy'), 400);
    setTimeout(() => onAnswered(true), 1000);
  }

  function handleChoose(i: number) {
    if (done) return;
    if (i === (question.answer as number)) {
      finishCorrect();
    } else {
      playSfx('wrong');
      setWrong(i);
      setMood('think');
      setHint('んん？ もういちど きいて、よく みてみよう。');
      onAnswered(false);
      setTimeout(() => { setWrong(null); setMood('idle'); }, 600);
    }
  }

  function handlePlace(i: number) {
    if (done || placed.includes(i)) return;
    playSfx('tap');
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === question.choices.length) {
      const built = next.map((k) => question.choices[k].label).join('');
      if (built === answerStr) finishCorrect();
      else {
        playSfx('wrong');
        setMood('think');
        setHint('んん？ じゅんばんを かえて みよう。');
        onAnswered(false);
        setTimeout(() => { setPlaced([]); setMood('idle'); }, 800);
      }
    }
  }

  return (
    <div className={`relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b ${world.tint} p-5`}>
      <GearBackground opacity={0.1} />
      <div className="relative z-10 mb-1 flex w-full max-w-md items-center justify-between">
        <button type="button" onClick={onQuit} className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-stone-600">やめる</button>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-2 w-6 rounded-full ${i < index ? 'bg-amber-500' : i === index ? 'bg-amber-300' : 'bg-white/60'}`} />
          ))}
        </div>
      </div>

      {/* IF-くんと 相手 */}
      <div className="relative z-10 mt-1 flex items-center gap-2">
        <IfKun mood={mood} size={72} />
        <div className="rounded-2xl bg-white/85 px-3 py-1 text-sm font-bold text-stone-600 shadow">{world.emoji} {world.friend}</div>
      </div>

      {/* お題の絵＝ソケット ＋ 光の粒 */}
      <button type="button" onClick={readWord} className="relative z-10 mt-3 flex flex-col items-center rounded-3xl border-4 border-amber-300 bg-white/90 px-10 py-4 shadow-lg">
        {question.pictureEmoji && <span className="text-7xl drop-shadow">{question.pictureEmoji}</span>}
        <div className="mt-2 flex gap-1.5">
          {question.mora.map((_, i) => (
            <motion.span key={i} animate={lit === i ? { scale: [1, 1.8, 1], backgroundColor: '#f59e0b' } : {}} transition={{ duration: 0.4 }}
              className="inline-block h-3 w-3 rounded-full bg-amber-200" />
          ))}
        </div>
        <span className="mt-1 text-xs font-bold text-stone-400">🔊 もういちど きく</span>
      </button>

      <p className="relative z-10 mt-3 text-xl font-black text-stone-800">{question.prompt}</p>

      {question.mode === 'choose' ? (
        <div className="relative z-10 mt-4 grid w-full max-w-md grid-cols-2 gap-3">
          {question.choices.map((c, i) => (
            <motion.button
              key={i} type="button" onClick={() => handleChoose(i)}
              animate={wrong === i ? { x: [0, -8, 8, -8, 0] } : {}}
              whileTap={{ scale: 0.94 }}
              className="rounded-2xl border-b-4 border-amber-600 bg-gradient-to-b from-amber-300 to-amber-400 px-4 py-5 text-3xl font-black text-white shadow-lg"
            >
              {c.emoji && <span className="mr-1 text-4xl">{c.emoji}</span>}
              {c.label}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="relative z-10 mt-4 w-full max-w-md">
          <div className="mb-4 flex justify-center gap-2">
            {question.choices.map((_, slot) => (
              <div key={slot} className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-dashed border-amber-300 bg-white/60 text-3xl font-black text-stone-800">
                {placed[slot] != null ? question.choices[placed[slot]].label : ''}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {question.choices.map((c, i) => (
              <motion.button
                key={i} type="button" disabled={placed.includes(i)} onClick={() => handlePlace(i)}
                whileTap={{ scale: 0.9 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-b-4 text-3xl font-black shadow-lg ${placed.includes(i) ? 'border-stone-300 bg-stone-200 text-stone-300' : 'border-amber-600 bg-gradient-to-b from-amber-300 to-amber-400 text-white'}`}
              >
                {c.label}
              </motion.button>
            ))}
          </div>
          {placed.length > 0 && !done && (
            <div className="mt-3 text-center">
              <button type="button" onClick={() => setPlaced([])} className="rounded-full bg-white/80 px-4 py-1 text-sm font-bold text-stone-600">↺ やりなおす</button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {hint && !done && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mt-5 text-base font-bold text-rose-500">{hint}</motion.p>
        )}
        {done && (
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative z-10 mt-5 text-3xl font-black text-emerald-600 drop-shadow">カチッ！ せいかい！</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
