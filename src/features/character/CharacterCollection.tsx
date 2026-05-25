import { motion } from 'framer-motion';
import { getUnlockedDefs, getLockedDefs } from './characterDefs';
import { getUnitStampCount, type StampEntry } from '../rewards/stamps';
import { getCharName } from './character';
import { UNITS } from '../../data/units';
import { playSfx } from '../sound/sfx';

interface Props {
  stampHistory: StampEntry[];
  activeCharId: string;
  characterNames: Record<string, string>;
  onOpenDetail: (charId: string) => void;
  onClose: () => void;
}

export function CharacterCollection({ stampHistory, activeCharId, characterNames, onOpenDetail, onClose }: Props) {
  const unlocked = getUnlockedDefs(stampHistory);
  const locked = getLockedDefs(stampHistory);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-purple-100 to-amber-50 p-6">
      <h1 className="text-2xl font-bold text-purple-800">なかま ずかん</h1>

      <div className="flex flex-wrap justify-center gap-4">
        {unlocked.map((def) => (
          <motion.button
            key={def.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => { playSfx('tap'); onOpenDetail(def.id); }}
            className={`rounded-2xl p-4 text-center shadow-md w-36 ${
              activeCharId === def.id
                ? 'bg-yellow-200 ring-2 ring-yellow-500 border-2 border-yellow-400'
                : 'bg-white border-2 border-purple-100'
            }`}
          >
            <div className="text-5xl">{def.emoji}</div>
            <div className="mt-1 font-bold text-purple-900">{getCharName(def.id, characterNames)}</div>
            {activeCharId === def.id && <div className="text-xs text-yellow-700 font-bold">いま えらんでる</div>}
          </motion.button>
        ))}
      </div>

      {locked.length > 0 && (
        <>
          <p className="text-sm text-gray-500 font-bold">まだ であっていない なかま…</p>
          <div className="flex flex-wrap justify-center gap-4">
            {locked.map((def) => {
              const unit = def.unitId ? UNITS.find((u) => u.id === def.unitId) : null;
              const unitStamps = def.unitId ? getUnitStampCount(stampHistory, def.unitId) : 0;
              return (
                <div key={def.id} className="rounded-2xl bg-gray-100 p-4 text-center w-36 opacity-70">
                  <div className="text-5xl grayscale">❓</div>
                  {unit && (
                    <div className="mt-1 text-xs text-gray-500">
                      <div>{unit.title}</div>
                      <div>{unitStamps} / {def.unlockStamps}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button type="button" onClick={onClose} className="rounded-2xl bg-purple-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#6a1b9a]">
        とじる
      </button>
    </div>
  );
}
