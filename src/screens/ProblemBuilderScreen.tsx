import { useState } from 'react';
import { motion } from 'framer-motion';
import { ItemTray } from '../components/ItemTray';
import { ProblemVisual } from '../components/ProblemVisual';
import {
  BUILDERS,
  buildAddition,
  buildSubtraction,
  buildBigAddition,
  buildPittari,
  pittariVerdict,
  buildMultiplication,
  buildDivision,
  type BuilderDef,
  type BuilderKind,
  type PittariVerdict,
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

function randomTarget(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** かけ算のお題に使う「2〜6 のかけ算で作れる」答え */
const MUL_TARGETS = [6, 8, 9, 10, 12, 15, 16, 20, 24] as const;

const PITTARI_GOALS: { verdict: PittariVerdict; text: string }[] = [
  { verdict: 'ぴったり', text: 'ぴったり はいるように つくろう！' },
  { verdict: 'あまる', text: 'かごが あまるように つくろう！' },
  { verdict: 'たりない', text: 'かごに はいりきらないように つくろう！' },
];

/** 目標を達成できているかを示す小さなフィードバック帯 */
function GoalStatus({ reached, text }: { reached: boolean; text: string }) {
  return (
    <div
      className={`rounded-xl px-4 py-2 text-sm font-bold ${
        reached ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : 'bg-white text-amber-700'
      }`}
    >
      {reached ? '✓ ' : ''}
      {text}
    </div>
  );
}

function GoalBanner({ icon = '🎯', text, onShuffle }: { icon?: string; text: string; onShuffle?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-2xl bg-amber-100 px-6 py-3 text-center text-2xl font-bold text-amber-900 shadow ring-2 ring-amber-300">
        {icon} {text}
      </div>
      {onShuffle && (
        <button type="button" onClick={onShuffle} className="text-sm font-bold text-amber-600 underline">
          ほかの おだいに する 🔀
        </button>
      )}
    </div>
  );
}

function AddBuilder({ def, onComplete, onBack }: { def: BuilderDef; onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [target, setTarget] = useState(() => randomTarget(5, 10));
  const emoji = def.emojiOptions[emojiIdx];

  return (
    <div className={SCREEN_BG}>
      <GoalBanner text={`ぜんぶで ${target}こ に なるように つくろう！`} onShuffle={() => setTarget(randomTarget(5, 10))} />
      <EmojiPalette options={def.emojiOptions} idx={emojiIdx} onPick={setEmojiIdx} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ItemTray emoji={emoji} count={a} max={9} onChange={setA} accent="border-sky-300 bg-sky-50" />
        <span className="text-4xl font-bold text-amber-700">＋</span>
        <ItemTray emoji={emoji} count={b} max={9} onChange={setB} accent="border-orange-300 bg-orange-50" />
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
  const [target, setTarget] = useState(() => randomTarget(1, 5));
  const emoji = def.emojiOptions[emojiIdx];
  const safeRemove = Math.min(remove, total);

  return (
    <div className={SCREEN_BG}>
      <GoalBanner text={`${target}こ のこるように バイバイしよう！`} onShuffle={() => setTarget(randomTarget(1, 5))} />
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
  const [target, setTarget] = useState(() => randomTarget(4, 8) * 10);
  const total = (tensA * 10 + onesA) + (tensB * 10 + onesB);

  return (
    <div className={SCREEN_BG}>
      <GoalBanner text={`こたえが ${target}より おおきく なるように つくろう！`} onShuffle={() => setTarget(randomTarget(4, 8) * 10)} />
      <p className="text-xs text-amber-600">🟧＝10のまとまり ／ 🟦＝ばら</p>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-bold text-sky-700">かず①</span>
        <div className="flex items-start gap-2">
          <ItemTray emoji="🟧" count={tensA} max={9} onChange={setTensA} accent="border-sky-300 bg-sky-50" />
          <ItemTray emoji="🟦" count={onesA} max={9} onChange={setOnesA} accent="border-sky-200 bg-white" />
        </div>
      </div>
      <span className="text-3xl font-bold text-amber-700">＋</span>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-bold text-orange-700">かず②</span>
        <div className="flex items-start gap-2">
          <ItemTray emoji="🟧" count={tensB} max={9} onChange={setTensB} accent="border-orange-300 bg-orange-50" />
          <ItemTray emoji="🟦" count={onesB} max={9} onChange={setOnesB} accent="border-orange-200 bg-white" />
        </div>
      </div>
      <GoalStatus reached={total > target} text={`いまは こたえが ${total}`} />
      <CompleteButton onClick={() => onComplete(buildBigAddition(tensA, onesA, tensB, onesB))} />
      <BackLink onClick={onBack} />
    </div>
  );
}

function MulBuilder({ def, onComplete, onBack }: { def: BuilderDef; onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [groups, setGroups] = useState(3);
  const [perGroup, setPerGroup] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [target, setTarget] = useState(() => randomChoice(MUL_TARGETS));
  const emoji = def.emojiOptions[emojiIdx];
  const total = groups * perGroup;

  return (
    <div className={SCREEN_BG}>
      <GoalBanner text={`ぜんぶで ${target}こ に なるように つくろう！`} onShuffle={() => setTarget(randomChoice(MUL_TARGETS))} />
      <EmojiPalette options={def.emojiOptions} idx={emojiIdx} onPick={setEmojiIdx} />
      <p className="text-sm font-bold text-amber-700">1さらに のせる かず</p>
      <ItemTray emoji={emoji} count={perGroup} max={6} onChange={setPerGroup} accent="border-pink-300 bg-pink-50" />
      <Stepper
        label="おさらの かず"
        value={groups}
        onMinus={() => setGroups((v) => Math.max(1, v - 1))}
        onPlus={() => setGroups((v) => Math.min(6, v + 1))}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: groups }).map((_, g) => (
          <div key={g} className="flex flex-wrap justify-center gap-0.5 rounded-full border-2 border-pink-200 bg-white p-1.5 max-w-[5rem]">
            {Array.from({ length: perGroup }).map((_, i) => (
              <span key={i} className="text-base">{emoji}</span>
            ))}
          </div>
        ))}
      </div>
      <GoalStatus reached={total === target} text={`いまは ぜんぶで ${total}こ`} />
      <CompleteButton onClick={() => onComplete(buildMultiplication(groups, perGroup, emoji))} />
      <BackLink onClick={onBack} />
    </div>
  );
}

function DivBuilder({ def, onComplete, onBack }: { def: BuilderDef; onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [total, setTotal] = useState(7);
  const [groups, setGroups] = useState(2);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [target, setTarget] = useState(() => randomTarget(1, 2));
  const emoji = def.emojiOptions[emojiIdx];
  const per = Math.floor(total / groups);
  const remainder = total % groups;

  return (
    <div className={SCREEN_BG}>
      <GoalBanner text={`あまりが ${target}こ に なるように つくろう！`} onShuffle={() => setTarget(randomTarget(1, 2))} />
      <EmojiPalette options={def.emojiOptions} idx={emojiIdx} onPick={setEmojiIdx} />
      <p className="text-sm font-bold text-amber-700">ぜんぶの かず</p>
      <ItemTray emoji={emoji} count={total} max={12} onChange={setTotal} accent="border-teal-300 bg-teal-50" />
      <Stepper
        label="なんにんで"
        value={groups}
        onMinus={() => setGroups((v) => Math.max(1, v - 1))}
        onPlus={() => setGroups((v) => Math.min(6, v + 1))}
      />
      <GoalStatus reached={remainder === target} text={`いまは 1にん ${per}こ、あまり ${remainder}こ`} />
      <CompleteButton onClick={() => onComplete(buildDivision(total, groups, emoji))} />
      <BackLink onClick={onBack} />
    </div>
  );
}

function PittariBuilder({ def, onComplete, onBack }: { def: BuilderDef; onComplete: (p: TemplateFilled) => void; onBack: () => void }) {
  const [items, setItems] = useState(4);
  const [capacity, setCapacity] = useState(5);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [goal, setGoal] = useState(() => randomChoice(PITTARI_GOALS));
  const emoji = def.emojiOptions[emojiIdx];
  const verdict = pittariVerdict(items, capacity);

  return (
    <div className={SCREEN_BG}>
      <GoalBanner icon="🧺" text={goal.text} onShuffle={() => setGoal(randomChoice(PITTARI_GOALS))} />
      <EmojiPalette options={def.emojiOptions} idx={emojiIdx} onPick={setEmojiIdx} />
      <p className="text-sm font-bold text-amber-700">かごの 大きさを きめて、{emoji}を いれよう</p>
      <ItemTray emoji={emoji} count={items} max={12} onChange={setItems} accent="border-green-300 bg-green-50" />
      <Stepper
        label="かごの 大きさ"
        value={capacity}
        onMinus={() => setCapacity((v) => Math.max(1, v - 1))}
        onPlus={() => setCapacity((v) => Math.min(12, v + 1))}
      />
      <GoalStatus reached={verdict === goal.verdict} text={`いまは「${verdict}」`} />
      <CompleteButton onClick={() => onComplete(buildPittari(items, capacity, emoji))} />
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
    if (kind === 'mul') return <MulBuilder def={def} onComplete={handleComplete} onBack={back} />;
    if (kind === 'div') return <DivBuilder def={def} onComplete={handleComplete} onBack={back} />;
    if (kind === 'pittari') return <PittariBuilder def={def} onComplete={handleComplete} onBack={back} />;
    return <BigAddBuilder onComplete={handleComplete} onBack={back} />;
  }

  if (step === 'preview' && draft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gradient-to-b from-green-100 to-amber-50 p-8">
        <div className="text-5xl">📝</div>
        <p className="text-xl font-bold text-green-800">もんだい できたよ！</p>
        {draft.scene && <ProblemVisual scene={draft.scene} />}
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
