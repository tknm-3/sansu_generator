import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { PlaceValueBlocks } from './PlaceValueBlocks';
import { GroupsVisual } from './GroupsVisual';
import { CherryBranch } from './CherryBranch';
import { speakJa } from '../features/speech/tts';
import { playSfx } from '../features/sound/sfx';
import type {
  ExplainStep,
  ObjectsData,
  GroupsData,
  PlaceValueData,
  CherryBranchData,
  EquationData,
} from '../lib/math/explain';

interface Props {
  steps: ExplainStep[];
  problem: string;
  onClose: () => void;
  /**
   * true のとき「スキップできないヒント」モード。
   * 間違えたあとに自動で開き、手順の小問題を解かないと先に進めない。
   * 「とじる」リンクは表示せず、最後まで進んで初めて閉じられる。
   */
  gate?: boolean;
}

function StepBody({ step }: { step: ExplainStep }) {
  switch (step.kind) {
    case 'objects': {
      const d = step.data as unknown as ObjectsData;
      return (
        <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-1 justify-center max-w-xs">
          {Array.from({ length: d.count }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              className="text-2xl"
            >
              {d.emoji}
            </motion.span>
          ))}
        </div>
      );
    }
    case 'groups': {
      const d = step.data as unknown as GroupsData;
      return <GroupsVisual emoji={d.emoji} perGroup={d.perGroup} groups={d.groups} />;
    }
    case 'placeValue': {
      const d = step.data as unknown as PlaceValueData;
      return <PlaceValueBlocks tens={d.tens} ones={d.ones} carry={d.carry} />;
    }
    case 'cherryBranch': {
      const d = step.data as unknown as CherryBranchData;
      return (
        <div className="bg-white rounded-2xl shadow p-4">
          <CherryBranch b={d.b} split={d.split} carry={d.carry} visible />
        </div>
      );
    }
    case 'equation': {
      const d = step.data as unknown as EquationData;
      return (
        <div className="rounded-3xl bg-white shadow-lg px-8 py-5 text-4xl font-bold text-amber-900">
          {d.text}
        </div>
      );
    }
  }
}

/** 手順の途中で出す小問題（ヒント問題）パネル */
function StepQuizPanel({
  prompt,
  choices,
  answer,
  solved,
  onSolved,
}: {
  prompt: string;
  choices: number[];
  answer: number;
  solved: boolean;
  onSolved: () => void;
}) {
  const [wrong, setWrong] = useState(false);

  function pick(value: number) {
    if (solved) return;
    playSfx('tap');
    if (value === answer) {
      playSfx('correct');
      setWrong(false);
      onSolved();
      speakJa('せいかい！');
    } else {
      playSfx('wrong');
      setWrong(true);
      speakJa('もういちど かんがえてみよう');
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-amber-800 text-center">{prompt}</p>
      <div className="flex gap-3">
        {choices.map((c) => {
          const isAnswer = solved && c === answer;
          return (
            <motion.button
              key={c}
              type="button"
              disabled={solved}
              onClick={() => pick(c)}
              whileTap={{ scale: 0.9 }}
              className={`rounded-2xl px-6 py-3 text-2xl font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-colors disabled:opacity-100 ${
                isAnswer ? 'bg-green-500' : 'bg-blue-400'
              }`}
            >
              {c}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {solved ? (
          <motion.p key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base font-bold text-green-600">
            ⭕ せいかい！
          </motion.p>
        ) : wrong ? (
          <motion.p
            key="ng"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
            className="text-base font-bold text-orange-600"
          >
            もういちど かんがえてみよう
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function StepExplainer({ steps, problem, onClose, gate = false }: Props) {
  const [index, setIndex] = useState(0);
  const [quizSolved, setQuizSolved] = useState(false);
  const step = steps[index];
  const isLast = index >= steps.length - 1;
  // quiz があるステップは、正解するまで先に進めない
  const blocked = !!step?.quiz && !quizSolved;

  useEffect(() => {
    setQuizSolved(false);
    if (step) speakJa(step.quiz ? step.quiz.prompt : step.narration);
  }, [step]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-sky-100/95 to-amber-50/95 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-amber-700">
          {gate ? 'いっしょに かんがえよう' : 'どうして そうなる？'}
        </span>
        <StepIndicator total={steps.length} current={index} />
      </div>
      <div className="rounded-2xl bg-amber-100 px-5 py-2 text-2xl font-bold text-amber-900">
        {problem}
      </div>
      <p className="text-xl font-bold text-amber-900 text-center whitespace-pre-line max-w-sm">
        {step.caption}
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-4"
        >
          <StepBody step={step} />
          {step.quiz && (
            <StepQuizPanel
              prompt={step.quiz.prompt}
              choices={step.quiz.choices}
              answer={step.quiz.answer}
              solved={quizSolved}
              onSolved={() => setQuizSolved(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-4">
        {!isLast ? (
          <button
            type="button"
            disabled={blocked}
            onClick={() => setIndex((i) => i + 1)}
            className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0] active:translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"
          >
            つぎへ ▶
          </button>
        ) : (
          <button
            type="button"
            disabled={blocked}
            onClick={onClose}
            className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32] active:translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"
          >
            {gate ? 'もういちど やってみる！' : 'わかった！'}
          </button>
        )}
        {!gate && (
          <button type="button" onClick={onClose} className="text-sm text-amber-600 underline">
            とじる
          </button>
        )}
      </div>
    </div>
  );
}
