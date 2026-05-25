import { motion } from 'framer-motion';
import { CHARACTER_DEFS } from './characterDefs';
import { getUnitStampCount, type StampEntry } from '../rewards/stamps';
import { UNITS } from '../../data/units';

interface Props {
  charId: string;
  stampHistory: StampEntry[];
  activeCharId: string;
  onSelect: (charId: string) => void;
  onClose: () => void;
}

export function CharacterDetail({ charId, stampHistory, activeCharId, onSelect, onClose }: Props) {
  const def = CHARACTER_DEFS.find((c) => c.id === charId)!;
  const unit = def.unitId ? UNITS.find((u) => u.id === def.unitId) : null;
  const unitStamps = def.unitId ? getUnitStampCount(stampHistory, def.unitId) : 0;
  const isActive = activeCharId === charId;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-purple-100 to-amber-50 p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="text-9xl"
      >
        {def.emoji}
      </motion.div>

      <h1 className="text-3xl font-bold text-purple-800">{def.name}</h1>
      <p className="text-center text-lg text-amber-700 max-w-xs">{def.description}</p>

      {unit && (
        <div className="rounded-2xl bg-white p-4 shadow-md w-full max-w-xs text-center">
          <p className="text-sm text-amber-600 font-bold">かいほうじょうけん</p>
          <p className="mt-1 text-base font-bold text-amber-900">
            「{unit.title}」を {def.unlockStamps}かい クリア
          </p>
          <div className="mt-3 h-4 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (unitStamps / def.unlockStamps) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-4 rounded-full bg-yellow-400"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{unitStamps} / {def.unlockStamps}</p>
        </div>
      )}

      <motion.button
        type="button"
        whileTap={isActive ? undefined : { scale: 0.95 }}
        whileHover={isActive ? undefined : { scale: 1.04 }}
        onClick={() => !isActive && onSelect(charId)}
        disabled={isActive}
        className={`rounded-2xl px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0] ${
          isActive
            ? 'bg-yellow-400 shadow-yellow-600 cursor-default'
            : 'bg-purple-500 shadow-purple-800'
        }`}
      >
        {isActive ? '✓ えらんでいる' : 'メインキャラにする'}
      </motion.button>

      <button type="button" onClick={onClose} className="text-sm text-purple-600 underline">
        もどる
      </button>
    </div>
  );
}
