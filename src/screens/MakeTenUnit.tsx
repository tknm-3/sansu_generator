import { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Companion } from '../features/character/Companion';
import { MakeTenFrame } from '../components/MakeTenFrame';
import { AnswerButtons } from '../components/AnswerButtons';
import { missingToTen, isCorrectMissing, makeAnswerChoices } from '../lib/math/makeTen';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';

interface Props {
  characterName: string;
  onExit: () => void;
}

function newCurrent(): number {
  return Math.floor(Math.random() * 9) + 1; // 1..9
}

export function MakeTenUnit({ characterName, onExit }: Props) {
  const [current, setCurrent] = useState(newCurrent);
  const [solved, setSolved] = useState(0);
  const [happy, setHappy] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const choices = useMemo(() => makeAnswerChoices(current), [current]);
  const cleared = solved >= QUESTIONS_PER_UNIT;

  function handlePick(value: number) {
    if (isCorrectMissing(current, value)) {
      playSfx('correct');
      setHappy(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, 'make-ten', Date.now()));
        playSfx('levelup');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setHappy(false);
          setCurrent(newCurrent());
        }, 900);
      }
    } else {
      setFeedback('wrong');
      speakJa('おしい！ もういちど やってみよう');
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-amber-50 p-8">
        <div className="text-6xl">🎉</div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">
          ホームに もどる
        </button>
      </div>
    );
  }

  const missing = missingToTen(current);
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700">といた かず: {solved} / {QUESTIONS_PER_UNIT}</div>
      <Companion
        name={characterName}
        emoji="🐰"
        happy={happy}
        message={`🍎が ${current}こ あるよ。あと なんこで 10こ になる？`}
      />
      <MakeTenFrame filled={current} />
      <AnswerButtons choices={choices} onPick={handlePick} disabled={happy} />
      {feedback === 'wrong' && (
        <p className="text-lg font-bold text-orange-600">おしい！ もういちど やってみよう（ヒント：あと {missing}こ）</p>
      )}
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
