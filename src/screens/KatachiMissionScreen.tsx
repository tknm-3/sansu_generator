import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { getUnitsByCategory } from '../data/units';

const KATACHI_MISSION_KEY = 'math-app:katachiMission';
const MISSION_UNIT_COUNT = 3;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasMissionTodayKatachi(): boolean {
  return loadJson<string>(KATACHI_MISSION_KEY, '') === todayStr();
}

function getTodayMissionUnitIds(): string[] {
  const today = todayStr();
  const units = getUnitsByCategory('katachi');
  const arr = [...units];
  let s = parseInt(today.replace(/-/g, ''), 10);
  for (let i = arr.length - 1; i > 0; i--) {
    s = ((s * 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, MISSION_UNIT_COUNT).map((u) => u.id);
}

function wasCompletedToday(unitId: string): boolean {
  const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
  const today = todayStr();
  return stamps.history.some((e) => {
    const d = new Date(e.at).toISOString().slice(0, 10);
    return e.unitId === unitId && d === today;
  });
}

interface Props {
  onSelectUnit: (unitId: string, hard: boolean) => void;
  onExit: () => void;
}

export function KatachiMissionScreen({ onSelectUnit, onExit }: Props) {
  const todayUnitIds = getTodayMissionUnitIds();
  const allUnits = getUnitsByCategory('katachi');
  const missionUnits = todayUnitIds.map((id) => allUnits.find((u) => u.id === id)!);

  const [checks] = useState(() => todayUnitIds.map(wasCompletedToday));
  const allDone = checks.every(Boolean);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (allDone && !celebrated) {
      setCelebrated(true);
      if (!hasMissionTodayKatachi()) {
        saveJson(KATACHI_MISSION_KEY, todayStr());
        saveJson(
          STAMP_KEY,
          addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), 'katachi-mission', Date.now()),
        );
        playSfx('fanfare');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        speakJa('ミッション クリア！ すごい！');
      }
    }
  }, [allDone, celebrated]);

  if (allDone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-emerald-200 to-teal-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🌟</motion.div>
        <p className="text-2xl font-bold text-teal-700">ミッション クリア！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl bg-teal-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#00695c] active:translate-y-1 transition-all"
        >
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-emerald-100 to-teal-50 p-6">
      <div className="self-stretch flex items-center">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white/60 px-3 py-2 text-teal-700 font-bold text-sm"
        >
          ← もどる
        </button>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-teal-900 text-center"
      >
        🌟 きょうの ミッション
      </motion.h1>
      <p className="text-teal-600 font-bold">３つ やってみよう！</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {missionUnits.map((unit, i) => (
          <motion.div
            key={unit.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-4 flex items-center gap-4 shadow-md ${
              checks[i] ? 'bg-teal-100 border-2 border-teal-400' : 'bg-white border-2 border-teal-200'
            }`}
          >
            <span className="text-4xl">{unit.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-teal-900">{unit.title}</p>
              <p className="text-xs text-teal-500">{unit.grade}</p>
            </div>
            {checks[i] ? (
              <span className="text-3xl">✅</span>
            ) : (
              <button
                type="button"
                onClick={() => onSelectUnit(unit.id, false)}
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#00695c] active:translate-y-0.5"
              >
                はじめる！
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-teal-500 mt-2">
        {checks.filter(Boolean).length} / {MISSION_UNIT_COUNT} クリア
      </p>
    </div>
  );
}
