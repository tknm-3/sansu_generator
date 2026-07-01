import { motion } from 'framer-motion';
import { RIKA_UNITS } from '../lib/rika/units';
import { CHARACTER_DEFS } from '../features/character/characterDefs';
import { loadJson } from '../lib/storage';
import { EMPTY_STAMPS, STAMP_KEY, getUnitStampCount, type StampState } from '../features/rewards/stamps';
import type { RikaUnitId } from '../lib/rika/types';

interface Props {
  characterName: string;
  characterId: string;
  onSelectUnit: (unitId: RikaUnitId) => void;
  onBack: () => void;
}

// ── りかランド の ホーム（けんきゅうじょ）──
// テーマ別 5単元を えらぶ。とった スタンプ数を 単元ごとに 🏅 で見せて リプレイ動機にする。
export function RikaHomeScreen({ characterName, characterId, onSelectUnit, onBack }: Props) {
  const charEmoji = CHARACTER_DEFS.find((d) => d.id === characterId)?.emoji ?? '🔬';
  const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-emerald-200 via-teal-100 to-sky-50 p-6">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onBack} className="rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-emerald-700">
          ← もどる
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{charEmoji}</span>
          <span className="font-bold text-emerald-900">{characterName}</span>
        </div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-3xl font-bold text-emerald-800"
      >
        🔬 りか けんきゅうじょ
      </motion.h1>
      <p className="font-bold text-emerald-600">どれで しらべる？</p>

      <div className="grid w-full max-w-md grid-cols-1 gap-4">
        {RIKA_UNITS.map((u, i) => {
          const got = getUnitStampCount(stamps.history, u.stampId);
          return (
            <motion.button
              key={u.id}
              type="button"
              onClick={() => onSelectUnit(u.id)}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.09, type: 'spring', stiffness: 220 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-4 rounded-3xl border-4 border-white bg-gradient-to-br ${u.theme.grad} p-4 text-left shadow-lg`}
              style={{ boxShadow: `0 5px 0 ${u.theme.shadow}` }}
            >
              <span className="text-5xl drop-shadow-sm">{u.emoji}</span>
              <span className="flex-1">
                <span className="block text-xl font-bold text-white drop-shadow">{u.title}</span>
                <span className="block text-sm font-bold text-white/90">{u.blurb}</span>
              </span>
              {got > 0 && (
                <span className="flex flex-col items-center rounded-2xl bg-white/80 px-2 py-1 text-emerald-700">
                  <span className="text-lg leading-none">🏅</span>
                  <span className="text-xs font-bold leading-none">{got}</span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
