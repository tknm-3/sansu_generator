import { useState } from 'react';
import { motion } from 'framer-motion';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { playSfx } from '../features/sound/sfx';
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  DIFFICULTY_EMOJI,
  UNLOCK_THRESHOLD,
  getClears,
  isUnlocked,
  type Difficulty,
} from '../lib/programming/progress';

interface Props {
  characterName: string;
  characterId: string;
  onPlay: (unitId: string, difficulty: Difficulty) => void;
  onMaker: () => void;
  onOpenCollection: () => void;
  onBack: () => void;
}

const UNITS = [
  { id: 'arrow-sequence', title: 'やじるしロボット', emoji: '🤖', desc: 'やじるしを ならべて すすもう', hasDifficulty: true },
  { id: 'arrow-debug', title: 'まちがいを なおそう', emoji: '🔧', desc: 'へんな やじるしを なおそう', hasDifficulty: true },
  { id: 'arrow-adventure', title: 'ぼうけんしよう', emoji: '🎁', desc: 'たからばこを とって ゴールへ！', hasDifficulty: true },
  { id: 'arrow-branch', title: 'もしも ロボット', emoji: '🔀', desc: 'もし〜なら で みちを えらぼう', hasDifficulty: true },
  { id: 'arrow-maker', title: 'めいろを つくろう', emoji: '🧩', desc: 'じぶんで めいろを つくる', hasDifficulty: false },
];

export function ProgrammingHomeScreen({ characterName, characterId, onPlay, onMaker, onOpenCollection, onBack }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐰';
  const [picking, setPicking] = useState<string | null>(null);

  function selectUnit(unit: (typeof UNITS)[number]) {
    playSfx('tap');
    if (!unit.hasDifficulty) {
      onMaker();
    } else {
      setPicking(unit.id);
    }
  }

  if (picking) {
    const unit = UNITS.find((u) => u.id === picking)!;
    return (
      <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-indigo-200 to-amber-50 p-6">
        <div className="flex w-full max-w-sm items-center justify-between">
          <button type="button" onClick={() => { playSfx('tap'); setPicking(null); }} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-indigo-700">
            ← もどる
          </button>
          <span className="font-bold text-indigo-900">{unit.emoji} {unit.title}</span>
        </div>
        <p className="text-lg font-bold text-indigo-900">むずかしさを えらんでね</p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {DIFFICULTIES.map((diff) => {
            const unlocked = isUnlocked(unit.id, diff);
            const clears = getClears(unit.id, diff);
            const prev: Difficulty = diff === 'normal' ? 'easy' : 'normal';
            const prevClears = getClears(unit.id, prev);
            return (
              <motion.button
                key={diff}
                type="button"
                disabled={!unlocked}
                onClick={() => { if (unlocked) { playSfx('tap'); onPlay(unit.id, diff); } }}
                whileTap={unlocked ? { scale: 0.96 } : undefined}
                className={`flex items-center justify-between rounded-2xl p-4 text-left shadow-md ${
                  unlocked ? 'bg-white' : 'bg-gray-200'
                }`}
              >
                <div>
                  <div className={`text-xl font-bold ${unlocked ? 'text-indigo-900' : 'text-gray-400'}`}>
                    {DIFFICULTY_EMOJI[diff]} {DIFFICULTY_LABEL[diff]}
                  </div>
                  {unlocked ? (
                    <div className="text-xs text-indigo-500">クリア {clears}かい</div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      🔒 {DIFFICULTY_LABEL[prev]}を あと {Math.max(0, UNLOCK_THRESHOLD - prevClears)}かい クリアで ひらくよ
                    </div>
                  )}
                </div>
                {unlocked && <span className="text-2xl">▶</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 overflow-y-auto bg-gradient-to-b from-indigo-200 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onBack} className="rounded-xl bg-white/60 px-3 py-2 text-sm font-bold text-indigo-700">
          ← もどる
        </button>
        <button type="button" onClick={onOpenCollection} className="flex items-center gap-2">
          <span className="text-2xl">{charEmoji}</span>
          <span className="font-bold text-indigo-900">{characterName}</span>
        </button>
      </div>

      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-indigo-900">
        プログラミング
      </motion.h1>
      <p className="text-sm font-bold text-indigo-600">やじるしで {charEmoji} を うごかそう！</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {UNITS.map((u, i) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => selectUnit(u)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-lg"
          >
            <span className="text-5xl">{u.emoji}</span>
            <div>
              <div className="text-xl font-bold text-indigo-900">{u.title}</div>
              <div className="text-sm text-indigo-500">{u.desc}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
