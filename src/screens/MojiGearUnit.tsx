import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { WORLDS } from '../lib/kotoba/worlds';
import { generateQuestion } from '../lib/kotoba/generate';
import type { MojiQuestion, WorldDef } from '../lib/kotoba/types';
import { worldStatus, worldSparkles, recordWorldClear, loadKotobaHistory, worldFrontier } from '../lib/kotoba/progress';
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

// ハブの 章（毎回 下まで スクロールせず、上級へ 一発で とべるように）。範囲は WORLDS の index。
const CHAPTERS: { label: string; start: number; end: number }[] = [
  { label: 'きほん', start: 0, end: 10 }, // 1〜10 教材
  { label: 'おうよう', start: 10, end: 18 }, // 11〜18 腕試し
  { label: 'ながい・ばんめ', start: 18, end: 24 }, // 19〜24 長語・位置
  { label: 'たつじん', start: 24, end: WORLDS.length }, // 25〜 操作系・上級
];

function chapterOf(index: number): number {
  const ci = CHAPTERS.findIndex((c) => index >= c.start && index < c.end);
  return ci < 0 ? CHAPTERS.length - 1 : ci;
}

export function MojiGearUnit({ onExit }: Props) {
  const [phase, setPhase] = useState<'hub' | 'intro' | 'play' | 'result'>('hub');
  const [world, setWorld] = useState<WorldDef | null>(null);
  const [adaptive, setAdaptive] = useState<Adaptive | null>(null);
  const [question, setQuestion] = useState<MojiQuestion | null>(null);
  const [qi, setQi] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0); // れんぞく せいかい（即時・前向き強化）
  // ハブを 開いたら 「いまここ」の章を ひらく（毎回 スクロールしない）
  const [chapter, setChapter] = useState(() => chapterOf(Math.min(worldFrontier(), WORLDS.length - 1)));
  const total = loadKotobaHistory().totalSparkles;

  function nextQuestion(w: WorldDef, a: Adaptive): MojiQuestion {
    const line = w.lineIds[Math.floor(Math.random() * w.lineIds.length)];
    // 世界の difficulty は §8の適応ノブを「上書き」する（design §13）。
    // ＝「ながい ことば」ゾーン等は difficulty.minMora/maxMora を a.opts() より あとに 置く。
    return generateQuestion(line, undefined, { ...a.opts(), ...(w.difficulty ?? {}) });
  }

  function openWorld(w: WorldDef) {
    setWorld(w);
    setPhase('intro');
  }

  function beginPlay() {
    if (!world) return;
    const a = makeAdaptive(world.startLevel ?? 1);
    setAdaptive(a);
    setQuestion(nextQuestion(world, a));
    setQi(0);
    setMistakes(0);
    setCombo(0);
    setPhase('play');
  }

  function onAnswered(correct: boolean) {
    if (!world || !adaptive || !question) return;
    recordAttempt(question.lineId, correct);
    adaptive.record(correct);
    if (!correct) {
      setMistakes((m) => m + 1);
      setCombo(0);
      return;
    }
    setCombo((c) => c + 1);
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
        combo={combo}
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

        <div className="mb-2 flex flex-col items-center">
          <IfKun mood="idle" size={84} />
          <h1 className="mt-1 text-2xl font-black text-amber-900 drop-shadow-sm">もじギア・ファクトリー</h1>
          <p className="text-sm font-bold text-amber-700">すきな せかいを えらんでね！</p>
        </div>

        {/* 章タブ（ここで 行き先を きりかえ＝スクロールを へらす） */}
        <div className="mb-3 flex flex-wrap justify-center gap-1.5">
          {CHAPTERS.map((c, ci) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setChapter(ci)}
              className={`rounded-full px-3 py-1 text-xs font-black shadow transition ${ci === chapter ? 'bg-amber-500 text-white' : 'bg-white/90 text-amber-700'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* じょうたいの みかた（はんれい） */}
        <div className="mb-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-stone-500">
          <span>✅ クリア</span>
          <span>📍 いまここ</span>
          <span>▶ あそべる</span>
          <span>🔒 まだ</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: CHAPTERS[chapter].end - CHAPTERS[chapter].start }, (_, k) => CHAPTERS[chapter].start + k).map((i) => {
            const w = WORLDS[i];
            const status = worldStatus(i);
            const locked = status === 'locked';
            const cleared = status === 'cleared';
            const current = status === 'current';
            return (
              <motion.button
                key={w.id}
                type="button"
                disabled={locked}
                onClick={() => !locked && openWorld(w)}
                whileTap={locked ? undefined : { scale: 0.95 }}
                whileHover={locked ? undefined : { y: -3 }}
                animate={current ? { scale: [1, 1.04, 1] } : {}}
                transition={current ? { duration: 1.6, repeat: Infinity } : {}}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${w.tint} p-4 text-center shadow-lg ${locked ? 'opacity-50 grayscale' : ''} ${current ? 'ring-4 ring-amber-400' : ''}`}
                style={{ boxShadow: '0 5px 0 rgba(120,90,50,0.25)' }}
              >
                {/* じょうたいバッジ（みぎうえ） */}
                {cleared && <div className="absolute right-1 top-1 text-lg">✅</div>}
                {current && <div className="absolute right-1 top-1 rounded-full bg-amber-400 px-2 text-[10px] font-black text-white">📍いまここ</div>}
                {status === 'new' && <div className="absolute right-1 top-1 rounded-full bg-white/80 px-2 text-[10px] font-bold text-emerald-600">▶</div>}
                {i >= 10 && !locked && <div className="absolute left-1 top-1 rounded-full bg-white/70 px-1.5 text-[10px] font-bold text-violet-600">⭐</div>}

                <div className="text-5xl drop-shadow">{locked ? '🔒' : w.emoji}</div>
                <div className="mt-1 text-sm font-black text-stone-700">{w.name}</div>
                <div className="text-[11px] font-bold text-stone-500">{locked ? 'まだ ひらかない' : w.friend}</div>
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
  const perfect = mistakes === 0;
  useEffect(() => {
    playSfx('fanfare');
    speakJa(perfect ? `パーフェクト！ ${world.friend} が だいよろこび！` : `クリア！ ${world.friend} が よろこんでいるよ`);
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    const t = setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 } }), 400);
    return () => clearTimeout(t);
  }, [world]);
  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b ${world.tint} p-8`}>
      <GearBackground opacity={0.12} />
      <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-8xl drop-shadow-lg">{world.emoji}</motion.div>
      <IfKun mood="happy" size={120} />
      <h2 className="text-4xl font-black text-amber-900 drop-shadow">{perfect ? 'パーフェクト！' : 'クリア！'}</h2>
      {perfect && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="rounded-full bg-orange-100 px-5 py-1 text-lg font-black text-orange-600 shadow">
          🌟 ノーミス れんぞく！
        </motion.div>
      )}
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
  combo: number;
  onAnswered: (correct: boolean) => void;
  onQuit: () => void;
}

// れんぞく数で もりあがる ことば＋絵（即時・前向きな ごほうび）
function comboBanner(n: number): { emoji: string; text: string } | null {
  if (n < 2) return null;
  if (n === 2) return { emoji: '🔥', text: '2れんぞく！' };
  if (n === 3) return { emoji: '🔥', text: '3れんぞく！すごい！' };
  if (n === 4) return { emoji: '⚡', text: '4れんぞく！てんさい！' };
  return { emoji: '🌟', text: `${n}れんぞく！パーフェクト！` };
}

function PlayScreen({ world, question, index, total, combo, onAnswered, onQuit }: PlayProps) {
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

  // しじ（prompt）→ お題の語、の順で よみあげる。
  // 置換/添加/位置 などは prompt に たいせつな じょうほう（かえる音・たす音・さがす音）が
  // あるので、まだ 字が よめない子にも 音で つたわるように 先に prompt を 読む。
  function readAll() {
    const inst = question.prompt.replace(/[「」『』]/g, ' ');
    speakJa(inst, () => readWord());
  }

  // 入室時に しじ→お題を よみあげる
  useEffect(() => {
    const t = setTimeout(readAll, 350);
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
        {combo >= 2 && (
          <motion.div
            key={combo}
            initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
            className="rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-600 shadow"
          >
            🔥 {combo} れんぞく
          </motion.div>
        )}
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
      <button type="button" onClick={readAll} className="relative z-10 mt-3 flex flex-col items-center rounded-3xl border-4 border-amber-300 bg-white/90 px-10 py-4 shadow-lg">
        {question.pictureEmoji && <span className="text-7xl drop-shadow">{question.pictureEmoji}</span>}
        <div className="mt-2 flex items-end gap-1.5">
          {question.mora.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <motion.span animate={lit === i ? { scale: [1, 1.8, 1], backgroundColor: '#f59e0b' } : {}} transition={{ duration: 0.4 }}
                className={`inline-block h-3 w-3 rounded-full bg-amber-200 ${question.highlightIndex === i ? 'ring-4 ring-amber-500 ring-offset-1' : ''}`} />
              {question.highlightIndex != null && (
                <span className={`text-[10px] font-black ${question.highlightIndex === i ? 'text-amber-600' : 'text-stone-300'}`}>{i + 1}</span>
              )}
            </div>
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
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative z-10 mt-5 flex flex-col items-center gap-1">
            <p className="text-3xl font-black text-emerald-600 drop-shadow">カチッ！ せいかい！</p>
            {(() => {
              const b = comboBanner(combo + 1);
              return b ? (
                <motion.p animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.5 }} className="text-2xl font-black text-orange-500 drop-shadow">
                  {b.emoji} {b.text}
                </motion.p>
              ) : null;
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
