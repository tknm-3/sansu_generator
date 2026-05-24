import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { PlaceValueBlocks } from './PlaceValueBlocks';
import { GroupsVisual } from './GroupsVisual';
import { CherryBranch } from './CherryBranch';
import { speakJa } from '../features/speech/tts';
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

export function StepExplainer({ steps, problem, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index >= steps.length - 1;

  useEffect(() => {
    if (step) speakJa(step.narration);
  }, [step]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-sky-100/95 to-amber-50/95 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-amber-700">どうして そうなる？</span>
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
          className="flex justify-center"
        >
          <StepBody step={step} />
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-4">
        {!isLast ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0] active:translate-y-1 transition-all"
          >
            つぎへ ▶
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32] active:translate-y-1 transition-all"
          >
            わかった！
          </button>
        )}
        <button type="button" onClick={onClose} className="text-sm text-amber-600 underline">
          とじる
        </button>
      </div>
    </div>
  );
}
