import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnswerButtons } from '../components/AnswerButtons';
import { ProblemVisual } from '../components/ProblemVisual';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import type { TemplateFilled } from '../lib/problemTemplates';
import confetti from 'canvas-confetti';

interface Props {
  problem: TemplateFilled;
  characterName: string;
  onDone: () => void;
}

function makeChoices(answer: number): number[] {
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.max(0, answer + Math.floor(Math.random() * 6) - 3);
    if (c !== answer) choices.add(c);
  }
  return [...choices].sort(() => Math.random() - 0.5);
}

export function ParentSolveScreen({ problem, characterName, onDone }: Props) {
  const needRemainder = (problem.remainder ?? 0) > 0;
  const [perChoices] = useState(() => makeChoices(problem.answer));
  const [remChoices] = useState(() => (needRemainder ? makeChoices(problem.remainder!) : []));
  const [stage, setStage] = useState<'per' | 'rem'>('per');
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');

  const answerSummary = needRemainder
    ? `1にん ${problem.answer}こ、あまり ${problem.remainder}こ`
    : `${problem.answer}`;

  function handlePick(value: number) {
    if (result !== 'none') return;
    playSfx('tap');
    const expected = stage === 'per' ? problem.answer : problem.remainder!;
    if (value !== expected) {
      playSfx('wrong');
      speakJa('ざんねん！ こたえは…');
      setResult('wrong');
      return;
    }
    if (needRemainder && stage === 'per') {
      playSfx('correct');
      speakJa('いいね！ つぎは あまりは なんこ？');
      setStage('rem');
      return;
    }
    playSfx('correct');
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    speakJa('せいかい！ すごい！');
    setResult('correct');
  }

  const choices = stage === 'per' ? perChoices : remChoices;
  const subLabel = !needRemainder ? null : stage === 'per' ? '① 1にん なんこ？' : '② あまりは なんこ？';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-orange-100 to-amber-50 p-8">
      <div className="text-3xl font-bold text-orange-800">
        {characterName} から ちょうせんじょう！ 📩
      </div>
      {problem.scene && <ProblemVisual scene={problem.scene} />}
      <div className="rounded-2xl bg-white p-6 text-2xl font-bold text-amber-900 shadow-lg text-center whitespace-pre-line">
        {problem.questionText}
      </div>
      <button type="button" onClick={() => speakJa(problem.questionText)} className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700">🔊 よみあげ</button>
      {result === 'none' && subLabel && (
        <div className="rounded-xl bg-teal-100 px-5 py-2 text-xl font-bold text-teal-800">{subLabel}</div>
      )}
      {result === 'none' && problem.hint && (
        <button type="button" onClick={() => speakJa(problem.hint!)} className="rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-700">💡 ヒント</button>
      )}
      {result === 'none' && <AnswerButtons choices={choices} onPick={handlePick} />}
      {result === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-center">
          <div className="text-5xl">⭕</div>
          <p className="text-2xl font-bold text-green-700">せいかい！ {answerSummary}！</p>
        </motion.div>
      )}
      {result === 'wrong' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="text-5xl">❌</div>
          <p className="text-2xl font-bold text-red-600">こたえは {answerSummary} だったよ！</p>
        </motion.div>
      )}
      {result !== 'none' && (
        <button type="button" onClick={onDone}
          className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0]">
          ホームに もどる
        </button>
      )}
    </div>
  );
}
