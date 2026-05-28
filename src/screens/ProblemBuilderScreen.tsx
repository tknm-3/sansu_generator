import { useState } from 'react';
import { motion } from 'framer-motion';
import { ItemTray } from '../components/ItemTray';
import { SceneView } from '../components/SceneView';
import {
  BUILDERS,
  buildAddition,
  buildSubtraction,
  buildBigAddition,
  type BuilderDef,
  type BuilderKind,
} from '../lib/problemBuilder';
import type { TemplateFilled } from '../lib/problemTemplates';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import { loadJson, saveJson } from '../lib/storage';

const MY_PROBLEMS_KEY = 'math-app:myProblems';

interface Props {
  characterName: string;
  onMake: (problem: TemplateFilled) => void;
  onExit: () => void;
}

const SCREEN_BG = 'flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-green-100 to-amber-50 p-6';

function EmojiPalette({ options, idx, onPick }: { options: string[]; idx: number; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((e, i) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(i)}
          className={`rounded-xl p-2 text-3xl ${idx === i ? 'bg-green-200 ring-2 ring-green-500' : 'bg-white'}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 font-bold text-amber-900">{label}</span>
      <button type="button" onClick={onMinus} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">−</button>
      <span className="w-10 text-center text-3xl font-bold text-amber-900">{value}</span>
      <button type="button" onClick={onPlus} className="rounded-xl bg-gray-200 px-4 py-2 text-xl font-bold">＋</button>
    </div>
  );
}

function CompleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32] active:translate-y-1"
    >
      これで かんせい！
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-amber-600 underline">もどる</button>
  );
}

function AddBuilder({ def, onComplete, onBack }: { def: BuilderDef; onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const emoji = def.emojiOptions[emojiIdx];

  return (
    <div className={SCREEN_BG}>
      <h1 className="text-2xl font-bold text-green-800">{emoji}を おいて つくろう！</h1>
      <EmojiPalette options={def.emojiOptions} idx={emojiIdx} onPick={setEmojiIdx} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ItemTray emoji={emoji} count={a} max={9} onChange={setA} accent="border-sky-300 bg-sky-50" />
        <span className="text-4xl font-bold text-amber-700">＋</span>
        <ItemTray emoji={emoji} count={b} max={9} onChange={setB} accent="border-orange-300 bg-orange-50" />
      </div>
      <div className="rounded-2xl bg-white px-6 py-3 text-3xl font-bold text-amber-900 shadow">
        {a} ＋ {b} ＝ {a + b}
      </div>
      <CompleteButton onClick={() => onComplete(buildAddition(a, b, emoji))} />
      <BackLink onClick={onBack} />
    </div>
  );
}

function SubBuilder({ def, onComplete, onBack }: { def: BuilderDef; onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [total, setTotal] = useState(5);
  const [remove, setRemove] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const emoji = def.emojiOptions[emojiIdx];
  const safeRemove = Math.min(remove, total);

  return (
    <div className={SCREEN_BG}>
      <h1 className="text-2xl font-bold text-green-800">{emoji}を おいて バイバイ！</h1>
      <EmojiPalette options={def.emojiOptions} idx={emojiIdx} onPick={setEmojiIdx} />
      <ItemTray
        emoji={emoji}
        count={total}
        max={10}
        onChange={(n) => { setTotal(n); if (remove > n) setRemove(n); }}
        faded={safeRemove}
        accent="border-orange-300 bg-orange-50"
      />
      <Stepper
        label="バイバイ"
        value={safeRemove}
        onMinus={() => setRemove((v) => Math.max(0, v - 1))}
        onPlus={() => setRemove((v) => Math.min(total, v + 1))}
      />
      <div className="rounded-2xl bg-white px-6 py-3 text-3xl font-bold text-amber-900 shadow">
        {total} − {safeRemove} ＝ {total - safeRemove}
      </div>
      <CompleteButton onClick={() => onComplete(buildSubtraction(total, safeRemove, emoji))} />
      <BackLink onClick={onBack} />
    </div>
  );
}

function BigAddBuilder({ onComplete, onBack }: { onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [tensA, setTensA] = useState(1);
  const [onesA, setOnesA] = useState(2);
  const [tensB, setTensB] = useState(1);
  const [onesB, setOnesB] = useState(3);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;

  return (
    <div className={SCREEN_BG}>
      <h1 className="text-2xl font-bold text-green-800">10のまとまりを おこう！</h1>
      <p className="text-xs text-amber-600">🟧＝10のまとまり ／ 🟦＝ばら</p>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-bold text-sky-700">かず① ＝ {a}</span>
        <div className="flex items-start gap-2">
          <ItemTray emoji="🟧" count={tensA} max={9} onChange={setTensA} accent="border-sky-300 bg-sky-50" />
          <ItemTray emoji="🟦" count={onesA} max={9} onChange={setOnesA} accent="border-sky-200 bg-white" />
        </div>
      </div>
      <span className="text-3xl font-bold text-amber-700">＋</span>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-bold text-orange-700">かず② ＝ {b}</span>
        <div className="flex items-start gap-2">
          <ItemTray emoji="🟧" count={tensB} max={9} onChange={setTensB} accent="border-orange-300 bg-orange-50" />
          <ItemTray emoji="🟦" count={onesB} max={9} onChange={setOnesB} accent="border-orange-200 bg-white" />
        </div>
      </div>
      <div className="rounded-2xl bg-white px-6 py-3 text-2xl font-bold text-amber-900 shadow">
        {a} ＋ {b} ＝ {a + b}
      </div>
      <CompleteButton onClick={() => onComplete(buildBigAddition(tensA, onesA, tensB, onesB))} />
      <BackLink onClick={onBack} />
    </div>
  );
}

export function ProblemBuilderScreen({ characterName: _characterName, onMake, onExit }: Props) {
  const [step, setStep] = useState<'pick' | 'build' | 'preview'>('pick');
  const [kind, setKind] = useState<BuilderKind | null>(null);
  const [draft, setDraft] = useState<TemplateFilled | null>(null);

  function handleComplete(problem: TemplateFilled) {
    setDraft(problem);
    setStep('preview');
    playSfx('tap');
  }

  function handleConfirm() {
    if (!draft) return;
    const existing = loadJson<TemplateFilled[]>(MY_PROBLEMS_KEY, []);
    saveJson(MY_PROBLEMS_KEY, [...existing, draft]);
    playSfx('levelup');
    speakJa(`もんだい できた！ ${draft.questionText}`);
    onMake(draft);
  }

  if (step === 'pick') {
    return (
      <div className={SCREEN_BG}>
        <h1 className="text-2xl font-bold text-green-800">どんな もんだいを つくる？</h1>
        <div className="grid grid-cols-1 gap-4">
          {BUILDERS.map((b) => (
            <motion.button
              key={b.kind}
              type="button"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => { setKind(b.kind); setStep('build'); }}
              className={`flex w-72 items-center gap-4 rounded-2xl px-5 py-4 text-left text-white ${b.color} active:translate-y-1`}
            >
              <span className="text-4xl">{b.mark}</span>
              <span>
                <span className="block text-xl font-bold">{b.label}</span>
                <span className="block text-sm text-white/80">{b.desc}</span>
              </span>
            </motion.button>
          ))}
        </div>
        <BackLink onClick={onExit} />
      </div>
    );
  }

  if (step === 'build' && kind) {
    const def = BUILDERS.find((x) => x.kind === kind)!;
    const back = () => setStep('pick');
    if (kind === 'add') return <AddBuilder def={def} onComplete={handleComplete} onBack={back} />;
    if (kind === 'sub') return <SubBuilder def={def} onComplete={handleComplete} onBack={back} />;
    return <BigAddBuilder onComplete={handleComplete} onBack={back} />;
  }

  if (step === 'preview' && draft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gradient-to-b from-green-100 to-amber-50 p-8">
        <div className="text-5xl">📝</div>
        <p className="text-xl font-bold text-green-800">もんだい できたよ！</p>
        {draft.scene && <SceneView scene={draft.scene} />}
        <div className="rounded-2xl bg-white p-5 text-2xl font-bold text-amber-900 shadow-lg text-center whitespace-pre-line">
          {draft.questionText}
        </div>
        <button type="button" onClick={() => speakJa(draft.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
        <p className="text-amber-700">ママ・パパに ちょうせんしよう！</p>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-2xl bg-orange-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#e65100] active:translate-y-1"
        >
          ちょうせん！
        </button>
        <BackLink onClick={() => setStep('build')} />
      </div>
    );
  }

  return null;
}
