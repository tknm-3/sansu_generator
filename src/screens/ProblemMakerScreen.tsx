import { useState } from 'react';
import { motion } from 'framer-motion';
import { TEMPLATES, fillTemplate, type Template, type TemplateFilled } from '../lib/problemTemplates';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';

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
  const [step, setStep] = useState<'select' | 'fill' | 'preview'>('select');

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

  if (step === 'select') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">もんだいを えらんでね！</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {TEMPLATES.map((tpl) => (
            <motion.button
              key={tpl.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedTpl(tpl);
                setA(tpl.aRange[0] + 1);
                setB(tpl.bRange[0]);
                setEmojiIdx(0);
                setStep('fill');
              }}
              className="w-48 rounded-2xl border-2 border-green-200 bg-white p-4 text-center shadow-md"
            >
              <div className="text-3xl">{tpl.emojiOptions[0]}</div>
              <div className="mt-1 text-sm font-bold text-green-800">{tpl.textPattern.slice(0, 20)}…</div>
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={onExit} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }

  if (step === 'fill' && selectedTpl) {
    const emoji = selectedTpl.emojiOptions[emojiIdx % selectedTpl.emojiOptions.length];
    const preview = fillTemplate(selectedTpl, { a, b, emoji });
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">かずを きめよう！</h1>
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
          <button type="button" onClick={() => setA((v) => Math.max(selectedTpl.aRange[0], v - 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
          <span className="text-3xl font-bold text-amber-900">{a}</span>
          <button type="button" onClick={() => setA((v) => Math.min(selectedTpl.aRange[1], v + 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-900">かず②:</span>
          <button type="button" onClick={() => setB((v) => Math.max(selectedTpl.bRange[0], v - 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
          <span className="text-3xl font-bold text-amber-900">{b}</span>
          <button type="button" onClick={() => setB((v) => Math.min(selectedTpl.bRange[1], v + 1))} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
        </div>
        <div className="rounded-2xl bg-white p-4 text-xl font-bold text-amber-900 shadow">
          {preview.questionText}
        </div>
        <button type="button" onClick={() => speakJa(preview.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
        <button type="button" onClick={() => setStep('preview')}
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32]">
          これで かんせい！
        </button>
        <button type="button" onClick={() => setStep('select')} className="text-sm text-amber-600 underline">もどる</button>
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
