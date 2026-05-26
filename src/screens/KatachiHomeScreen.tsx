import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnitsByCategory, type UnitMeta } from '../data/units';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { hasMissionTodayKatachi } from './KatachiMissionScreen';

interface Props {
  characterName: string;
  characterId: string;
  stampTotal: number;
  onSelectUnit: (unitId: string, hard: boolean) => void;
  onStartMission: () => void;
  onStartChallenge: () => void;
  onOpenCollection: () => void;
  onOpenStampBook?: () => void;
  onOpenProgress: () => void;
  onBack: () => void;
}

const KATACHI_UNITS = getUnitsByCategory('katachi');

export function KatachiHomeScreen({
  characterName,
  characterId,
  stampTotal,
  onSelectUnit,
  onStartMission,
  onStartChallenge,
  onOpenCollection,
  onOpenStampBook,
  onOpenProgress,
  onBack,
}: Props) {
  const characterEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🐧';
  const [pendingUnit, setPendingUnit] = useState<UnitMeta | null>(null);
  const missionDone = hasMissionTodayKatachi();

  function handleUnitClick(unit: UnitMeta) {
    setPendingUnit(unit);
  }

  function handleModeSelect(hard: boolean) {
    if (!pendingUnit) return;
    onSelectUnit(pendingUnit.id, hard);
    setPendingUnit(null);
  }

  return (
    <div className="flex h-screen flex-col items-center gap-6 bg-gradient-to-b from-emerald-200 to-teal-50 p-6 overflow-y-auto">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="rounded-xl bg-white/60 px-3 py-2 text-teal-700 font-bold text-sm">
            ← もどる
          </button>
          <button type="button" onClick={onOpenCollection} className="flex items-center gap-2">
            <span className="text-2xl">{characterEmoji}</span>
            <span className="font-bold text-teal-900">{characterName}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenProgress}
            className="rounded-2xl bg-teal-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#00695c] active:translate-y-0.5"
          >
            📅 カレンダー
          </button>
          <motion.button
            type="button"
            onClick={onOpenStampBook}
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-full bg-emerald-100 px-4 py-1 font-bold text-teal-900 shadow-sm"
          >
            ⭐ スタンプ {stampTotal}
          </motion.button>
        </div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-teal-900"
      >
        🔷 かたちあそび
      </motion.h1>

      <motion.button
        type="button"
        onClick={onStartMission}
        disabled={missionDone}
        whileTap={missionDone ? undefined : { scale: 0.96 }}
        whileHover={missionDone ? undefined : { scale: 1.03 }}
        className={`w-full max-w-sm rounded-2xl p-4 text-center shadow-lg font-bold transition-all ${
          missionDone
            ? 'bg-gray-200 text-gray-500 cursor-default'
            : 'bg-yellow-400 text-yellow-900 shadow-[0_4px_0_#f9a825]'
        }`}
      >
        <div className="text-2xl">🌟</div>
        <div className="text-lg">{missionDone ? 'きょうの ミッション クリア済み！' : 'きょうの ミッション をやろう！'}</div>
      </motion.button>

      <motion.button
        type="button"
        onClick={onStartChallenge}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.04 }}
        className="w-full max-w-sm rounded-2xl bg-orange-500 p-4 text-center text-white font-bold shadow-[0_4px_0_#c2410c]"
      >
        <div className="text-2xl">⚔️</div>
        <div>チャレンジ</div>
      </motion.button>

      <p className="text-teal-700 font-bold">がくしゅう</p>
      <div className="flex flex-wrap justify-center gap-4">
        {KATACHI_UNITS.map((u, index) => (
          <motion.button
            key={u.id}
            type="button"
            onClick={() => handleUnitClick(u)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-40 rounded-2xl border-2 border-teal-200 bg-white p-4 text-center shadow-md"
          >
            <div className="text-4xl">{u.emoji}</div>
            <div className="mt-1 text-base font-bold text-teal-900">{u.title}</div>
            <div className="mt-0.5 text-xs text-teal-500">{u.grade}</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {pendingUnit && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
            onClick={() => setPendingUnit(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280 }}
              className="rounded-3xl bg-white p-6 shadow-2xl w-full max-w-xs flex flex-col items-center gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl">{pendingUnit.emoji}</div>
              <p className="text-xl font-bold text-teal-900 text-center">{pendingUnit.title}</p>
              <p className="text-sm text-teal-600 font-bold">どっちに チャレンジする？</p>

              <button
                type="button"
                onClick={() => handleModeSelect(false)}
                className="w-full rounded-2xl bg-teal-400 py-3 font-bold text-white shadow-[0_4px_0_#0f766e] active:translate-y-1 flex flex-col items-center"
              >
                <span className="text-xl">🌟 ふつう</span>
                {pendingUnit.modeHint && (
                  <span className="text-xs font-bold text-teal-50 mt-0.5">{pendingUnit.modeHint.normal}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect(true)}
                className="w-full rounded-2xl bg-orange-400 py-3 font-bold text-white shadow-[0_4px_0_#c2410c] active:translate-y-1 flex flex-col items-center"
              >
                <span className="text-xl">🔥 むずかしい</span>
                {pendingUnit.modeHint && (
                  <span className="text-xs font-bold text-orange-50 mt-0.5">{pendingUnit.modeHint.hard}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPendingUnit(null)}
                className="text-sm text-teal-500 underline"
              >
                キャンセル
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
