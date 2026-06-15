import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { WORLDS } from '../lib/kotoba/worlds';
import { generateQuestion, type GenOpts } from '../lib/kotoba/generate';
import type { MojiQuestion, WorldDef } from '../lib/kotoba/types';
import { isWorldUnlocked, isWorldCleared, worldSparkles, recordWorldClear } from '../lib/kotoba/progress';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';

interface Props {
  characterName: string;
  characterId?: string;
  onExit: () => void;
}

const Q_PER_WORLD = 5;

/** 世界の lineIds から 1問つくる。腕試し世界は ランダムに メカを選ぶ */
function buildQuestions(world: WorldDef): MojiQuestion[] {
  const opts: GenOpts = world.difficulty ?? {};
  const qs: MojiQuestion[] = [];
  for (let i = 0; i < Q_PER_WORLD; i++) {
    const line = world.lineIds[Math.floor(Math.random() * world.lineIds.length)];
    qs.push(generateQuestion(line, undefined, opts));
  }
  return qs;
}

function sparkleStr(n: number): string {
  return n > 0 ? '✨'.repeat(n) : '・・・';
}

export function MojiGearUnit({ onExit }: Props) {
  const [phase, setPhase] = useState<'hub' | 'play' | 'result'>('hub');
  const [world, setWorld] = useState<WorldDef | null>(null);
  const [questions, setQuestions] = useState<MojiQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  function startWorld(w: WorldDef) {
    setWorld(w);
    setQuestions(buildQuestions(w));
    setQi(0);
    setMistakes(0);
    setPhase('play');
  }

  function onAnswered(correct: boolean) {
    if (!correct) {
      setMistakes((m) => m + 1);
      return;
    }
    if (qi + 1 >= questions.length) {
      const sparkles = Math.max(1, 3 - mistakes);
      if (world) recordWorldClear(world.id, sparkles);
      setPhase('result');
    } else {
      setQi((i) => i + 1);
    }
  }

  if (phase === 'play' && world) {
    return (
      <PlayScreen
        key={qi}
        world={world}
        question={questions[qi]}
        index={qi}
        total={questions.length}
        onAnswered={onAnswered}
        onQuit={() => setPhase('hub')}
      />
    );
  }

  if (phase === 'result' && world) {
    const sparkles = Math.max(1, 3 - mistakes);
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b ${world.tint} p-8`}>
        <div className="text-7xl">{world.emoji}</div>
        <h2 className="text-3xl font-bold text-amber-900">クリア！</h2>
        <div className="text-2xl">{world.friend} が よろこんでいる！</div>
        <div className="text-5xl">{sparkleStr(sparkles)}</div>
        <div className="flex gap-4">
          <button type="button" onClick={() => startWorld(world)} className="rounded-2xl bg-amber-500 px-6 py-3 text-xl font-bold text-white shadow" style={{ boxShadow: '0 4px 0 #b45309' }}>もういちど</button>
          <button type="button" onClick={() => setPhase('hub')} className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-amber-700 shadow" style={{ boxShadow: '0 4px 0 #d6d3d1' }}>ちずへ</button>
        </div>
      </div>
    );
  }

  // ── ハブ（本棚＝旅の地図）──
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onExit} className="rounded-full bg-white px-4 py-2 font-bold text-amber-700 shadow">← もどる</button>
          <h1 className="text-2xl font-bold text-amber-900">もじギア・ファクトリー</h1>
        </div>
        <p className="mb-4 text-center text-sm text-amber-700">IF-くんと いろんな せかいへ！</p>
        <div className="grid grid-cols-2 gap-3">
          {WORLDS.map((w, i) => {
            const unlocked = isWorldUnlocked(i);
            const cleared = isWorldCleared(w.id);
            return (
              <motion.button
                key={w.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && startWorld(w)}
                whileTap={unlocked ? { scale: 0.95 } : undefined}
                className={`relative rounded-2xl bg-gradient-to-br ${w.tint} p-4 text-center shadow ${unlocked ? '' : 'opacity-40 grayscale'}`}
                style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.12)' }}
              >
                <div className="text-4xl">{unlocked ? w.emoji : '🔒'}</div>
                <div className="mt-1 text-sm font-bold text-stone-700">{w.name}</div>
                {cleared && <div className="text-xs">{sparkleStr(worldSparkles(w.id))}</div>}
                {i >= 10 && <div className="absolute right-1 top-1 text-xs">⭐じょうきゅう</div>}
              </motion.button>
            );
          })}
        </div>
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

  const answerStr = useMemo(() => {
    if (question.mode !== 'build') return '';
    return (question.answer as number[]).map((i) => question.choices[i].label).join('');
  }, [question]);

  // 入室時に お題を よみあげる
  useEffect(() => {
    speakJa(`${question.prompt}。${question.speak}`);
  }, [question]);

  function finishCorrect() {
    if (done) return;
    setDone(true);
    playSfx('correct');
    speakJa(question.speak);
    setTimeout(() => onAnswered(true), 700);
  }

  function handleChoose(i: number) {
    if (done) return;
    if (i === (question.answer as number)) {
      finishCorrect();
    } else {
      playSfx('wrong');
      setWrong(i);
      setHint('んん？ もういちど きいて、よく みてみよう。');
      onAnswered(false);
      setTimeout(() => setWrong(null), 500);
    }
  }

  function handlePlace(i: number) {
    if (done || placed.includes(i)) return;
    playSfx('tap');
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === question.choices.length) {
      const built = next.map((k) => question.choices[k].label).join('');
      if (built === answerStr) {
        finishCorrect();
      } else {
        playSfx('wrong');
        setHint('んん？ じゅんばんを かえて みよう。');
        onAnswered(false);
        setTimeout(() => setPlaced([]), 700);
      }
    }
  }

  return (
    <div className={`flex min-h-screen flex-col items-center bg-gradient-to-b ${world.tint} p-6`}>
      <div className="mb-2 flex w-full max-w-md items-center justify-between">
        <button type="button" onClick={onQuit} className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-stone-600">やめる</button>
        <div className="text-sm font-bold text-stone-600">{index + 1} / {total}</div>
      </div>

      <div className="mt-4 text-2xl">{world.emoji} {world.friend}</div>
      <button
        type="button"
        onClick={() => speakJa(question.speak)}
        className="mt-4 flex flex-col items-center rounded-3xl bg-white/80 px-8 py-4 shadow"
      >
        {question.pictureEmoji && <span className="text-7xl">{question.pictureEmoji}</span>}
        <span className="mt-2 text-base font-bold text-stone-500">🔊 もういちど きく</span>
      </button>
      <p className="mt-4 text-xl font-bold text-stone-800">{question.prompt}</p>

      {question.mode === 'choose' ? (
        <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
          {question.choices.map((c, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => handleChoose(i)}
              animate={wrong === i ? { x: [0, -8, 8, -8, 0] } : {}}
              className="rounded-2xl bg-white px-4 py-5 text-3xl font-bold text-stone-800 shadow"
              style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.12)' }}
            >
              {c.emoji && <span className="mr-1 text-4xl">{c.emoji}</span>}
              {c.label}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="mt-6 w-full max-w-md">
          <div className="mb-4 flex justify-center gap-2">
            {question.choices.map((_, slot) => (
              <div key={slot} className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-dashed border-stone-300 bg-white/50 text-3xl font-bold text-stone-800">
                {placed[slot] != null ? question.choices[placed[slot]].label : ''}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {question.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                disabled={placed.includes(i)}
                onClick={() => handlePlace(i)}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold shadow ${placed.includes(i) ? 'bg-stone-200 text-stone-300' : 'bg-amber-400 text-white'}`}
                style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.12)' }}
              >
                {c.label}
              </button>
            ))}
          </div>
          {placed.length > 0 && !done && (
            <div className="mt-3 text-center">
              <button type="button" onClick={() => setPlaced([])} className="rounded-full bg-white/80 px-4 py-1 text-sm font-bold text-stone-600">↺ やりなおす</button>
            </div>
          )}
        </div>
      )}

      {hint && !done && <p className="mt-5 text-base font-bold text-rose-500">{hint}</p>}
      {done && <p className="mt-5 text-2xl font-bold text-emerald-600">カチッ！ せいかい！</p>}
    </div>
  );
}
