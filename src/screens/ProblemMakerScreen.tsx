import { useState } from 'react';
import { motion } from 'framer-motion';
import { TEMPLATES, fillTemplate, type ProblemType, type Template, type TemplateFilled } from '../lib/problemTemplates';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';
import { goalsForType, type Goal } from '../lib/problemGoals';

const MY_PROBLEMS_KEY = 'math-app:myProblems';

interface Props {
  characterName: string;
  onMake: (problem: TemplateFilled) => void;
  onExit: () => void;
}

export function ProblemMakerScreen({ characterName: _characterName, onMake, onExit }: Props) {
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null);
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [step, setStep] = useState<'op' | 'mode' | 'goalPick' | 'select' | 'fill' | 'preview'>('op');
  const [op, setOp] = useState<ProblemType | null>(null);
  const [mode, setMode] = useState<'free' | 'goal'>('free');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [missed, setMissed] = useState(false);

  function handleConfirm() {
    if (!selectedTpl) return;
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const filled = fillTemplate(selectedTpl, { a, b, emoji });
    const existing = loadJson<TemplateFilled[]>(MY_PROBLEMS_KEY, []);
    saveJson(MY_PROBLEMS_KEY, [...existing, filled]);
    playSfx('levelup');
    speakJa(`もんだい できた！ ${filled.questionText}`);
    onMake(filled);
  }

  const OPS: { type: ProblemType; label: string; mark: string; color: string }[] = [
    { type: 'addition', label: 'たしざん', mark: '➕', color: 'bg-sky-400 shadow-[0_4px_0_#0369a1]' },
    { type: 'subtraction', label: 'ひきざん', mark: '➖', color: 'bg-orange-400 shadow-[0_4px_0_#c2410c]' },
    { type: 'multiplication', label: 'かけざん', mark: '✖️', color: 'bg-purple-400 shadow-[0_4px_0_#7e22ce]' },
    { type: 'division', label: 'わりざん', mark: '➗', color: 'bg-green-500 shadow-[0_4px_0_#15803d]' },
  ];

  if (step === 'op') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どの けいさんに する？</h1>
        <div className="grid grid-cols-2 gap-4">
          {OPS.map((o) => (
            <motion.button
              key={o.type}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setOp(o.type);
                setStep('mode');
              }}
              className={`flex h-32 w-40 flex-col items-center justify-center rounded-2xl text-white ${o.color} active:translate-y-1`}
            >
              <span className="text-5xl">{o.mark}</span>
              <span className="mt-2 text-xl font-bold">{o.label}</span>
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={onExit} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'mode') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どう つくる？</h1>
        <button type="button"
          onClick={() => { setMode('free'); setStep('select'); }}
          className="w-64 rounded-2xl bg-sky-400 px-6 py-5 text-xl font-bold text-white shadow-[0_4px_0_#0369a1] active:translate-y-1">
          じゆうに つくる
        </button>
        <button type="button"
          onClick={() => { setMode('goal'); setStep('goalPick'); }}
          className="w-64 rounded-2xl bg-orange-400 px-6 py-5 text-xl font-bold text-white shadow-[0_4px_0_#c2410c] active:translate-y-1">
          おだいに ちょうせん
        </button>
        <button type="button" onClick={() => setStep('op')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'goalPick' && op) {
    const goals = goalsForType(op);
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どの おだい に する？</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {goals.map((g) => (
            <button key={g.id} type="button"
              onClick={() => { setGoal(g); setStep('select'); }}
              className="w-56 rounded-2xl border-2 border-orange-200 bg-white p-4 text-center shadow-md">
              <div className="text-lg font-bold text-orange-700">{g.label}</div>
              <div className="mt-2 text-xs text-amber-700 whitespace-pre-line">{g.prompt}</div>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setStep('mode')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'select') {
    const list = TEMPLATES.filter((t) => t.type === op);
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どの ばめんに する？</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {list.map((tpl) => {
            const example = fillTemplate(tpl, {
              a: tpl.sampleA,
              b: tpl.sampleB,
              emoji: tpl.emojiOptions[0],
            });
            return (
              <motion.button
                key={tpl.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setSelectedTpl(tpl);
                  setA(tpl.sampleA);
                  setB(tpl.sampleB);
                  setEmojiIdx(0);
                  setStep('fill');
                }}
                className="w-56 rounded-2xl border-2 border-green-200 bg-white p-4 text-center shadow-md"
              >
                <div className="text-3xl">{tpl.emojiOptions[0]}</div>
                <div className="mt-1 text-base font-bold text-green-800">{tpl.title}</div>
                <div className="mt-2 text-xs text-amber-700 whitespace-pre-line">{example.questionText}</div>
              </motion.button>
            );
          })}
        </div>
        <button type="button" onClick={() => setStep('op')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'fill' && selectedTpl) {
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const preview = fillTemplate(selectedTpl, { a, b, emoji });
    const satisfied = !goal || goal.validate(a, b, preview.answer);
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">かずを きめよう！</h1>
        {mode === 'goal' && goal && (
          <div className="rounded-2xl bg-orange-100 px-4 py-2 text-center text-base font-bold text-orange-800 whitespace-pre-line">
            おだい: {goal.prompt}
          </div>
        )}
        <div className="flex gap-3">
          {selectedTpl.emojiOptions.map((e, i) => (
            <button key={e} type="button" onClick={() => setEmojiIdx(i)}
              className={`rounded-xl p-2 text-3xl ${emojiIdx === i ? 'bg-green-200 ring-2 ring-green-500' : 'bg-white'}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-900">かず①:</span>
          <button type="button" onClick={() => { setMissed(false); setA((v) => Math.max(selectedTpl.aRange[0], v - 1)); }} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
          <span className="text-3xl font-bold text-amber-900">{a}</span>
          <button type="button" onClick={() => { setMissed(false); setA((v) => Math.min(selectedTpl.aRange[1], v + 1)); }} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-900">かず②:</span>
          <button type="button" onClick={() => { setMissed(false); setB((v) => Math.max(selectedTpl.bRange[0], v - 1)); }} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
          <span className="text-3xl font-bold text-amber-900">{b}</span>
          <button type="button" onClick={() => { setMissed(false); setB((v) => Math.min(selectedTpl.bRange[1], v + 1)); }} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
        </div>
        <div className="rounded-2xl bg-white p-4 text-xl font-bold text-amber-900 shadow">
          {preview.questionText}
        </div>
        <button type="button" onClick={() => speakJa(preview.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
        {missed && goal && (
          <p className="text-base font-bold text-orange-600 whitespace-pre-line text-center max-w-xs">{goal.hint}</p>
        )}
        <button type="button"
          onClick={() => {
            if (mode === 'goal' && !satisfied) {
              setMissed(true);
              speakJa(goal!.hint);
              playSfx('wrong');
              return;
            }
            setMissed(false);
            setStep('preview');
          }}
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32]">
          これで かんせい！
        </button>
        <button type="button" onClick={() => setStep(mode === 'goal' ? 'goalPick' : 'select')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'preview' && selectedTpl) {
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const filled = fillTemplate(selectedTpl, { a, b, emoji });
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-8">
        <div className="text-5xl">📝</div>
        <p className="text-xl font-bold text-green-800">もんだい できたよ！</p>
        <div className="rounded-2xl bg-white p-6 text-2xl font-bold text-amber-900 shadow-lg text-center">
          {filled.questionText}
        </div>
        <button type="button" onClick={() => speakJa(filled.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
        <p className="text-amber-700">ママ・パパに ちょうせんしよう！</p>
        <button type="button" onClick={handleConfirm}
          className="rounded-2xl bg-orange-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#e65100]">
          ちょうせん！
        </button>
        <button type="button" onClick={() => setStep('fill')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  return null;
}
