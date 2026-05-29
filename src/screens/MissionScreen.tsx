import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { StepExplainer } from '../components/StepExplainer';
import { generateProblem, checkAnswer, ALL_SKILL_IDS, type Problem } from '../lib/challenge/problemGen';
import { pickNextSkill, type SkillWeight } from '../lib/challenge/spacedRepetition';
import { loadMastery, saveMastery, recordAnswer } from '../lib/mastery';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';

const MISSION_KEY = 'math-app:lastMission';
const MISSION_COUNT = 3;

const SKILL_WEIGHTS: SkillWeight[] = ALL_SKILL_IDS.map((id) => ({ skillId: id, weight: 1 }));

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasMissionToday(): boolean {
  return loadJson<string>(MISSION_KEY, '') === todayStr();
}

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

function buildMission(): Problem[] {
  const mastery = loadMastery();
  const now = Date.now();
  const problems: Problem[] = [];
  const usedSkills = new Set<string>();
  for (let i = 0; i < 2; i++) {
    const remaining = SKILL_WEIGHTS.filter((s) => !usedSkills.has(s.skillId));
    const skill = pickNextSkill(mastery, remaining, now);
    usedSkills.add(skill);
    problems.push(generateProblem(skill));
  }
  const reviewSkill = pickNextSkill(mastery, SKILL_WEIGHTS, now);
  problems.push(generateProblem(reviewSkill));
  return problems;
}

export function MissionScreen({ characterName, characterId, onExit }: Props) {
  const [problems] = useState<Problem[]>(() => buildMission());
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [reviewing, setReviewing] = useState(false);
  const cleared = idx >= problems.length;
  const processing = useRef(false);
  const problem = problems[idx];

  function handlePick(value: number) {
    if (processing.current || !problem) return;
    processing.current = true;
    playSfx('tap');
    const isCorrect = checkAnswer(problem, value);
    saveMastery(recordAnswer(loadMastery(), problem.skillId, isCorrect, Date.now()));
    if (isCorrect) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const next = idx + 1;
      const nextCorrect = correctCount + 1;
      setFeedback('none');
      if (next >= problems.length) {
        setIdx(next);
        setCorrectCount(nextCorrect);
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), 'mission', Date.now()));
        saveJson(MISSION_KEY, todayStr());
        playSfx('fanfare');
        speakJa('ミッション クリア！ すごい！');
      } else {
        setTimeout(() => {
          setIdx(next);
          setCorrectCount(nextCorrect);
          setExpression('normal');
          processing.current = false;
        }, 800);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ いっしょに かんがえてみよう');
      if (problem.explain) setReviewing(true);
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🌟</motion.div>
        <p className="text-2xl font-bold text-green-700">ミッション クリア！</p>
        <p className="text-xl text-amber-800">{correctCount} / {MISSION_COUNT} せいかい！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-yellow-100 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-bold text-amber-700">きょうの ミッション {idx + 1} / {MISSION_COUNT}</span>
        <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm font-bold text-amber-800">🌟 ミッション</span>
      </div>
      <Companion name={characterName} characterId={characterId} expression={expression} message={problem?.questionText ?? ''} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-3xl font-bold text-amber-900 text-center">
        {problem?.questionText}
      </div>
      {problem && <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy' || reviewing} />}
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
      {reviewing && problem?.explain && (
        <StepExplainer
          gate
          steps={problem.explain}
          problem={problem.questionText}
          onClose={() => { setReviewing(false); setFeedback('none'); setExpression('normal'); }}
        />
      )}
    </div>
  );
}
