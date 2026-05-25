import { useState } from 'react';
import { motion } from 'framer-motion';
import { CHARACTER_DEFS } from './characterDefs';
import { getUnitStampCount, type StampEntry } from '../rewards/stamps';
import { UNITS } from '../../data/units';
import { getCharName } from './character';

interface Props {
  charId: string;
  stampHistory: StampEntry[];
  activeCharId: string;
  characterNames: Record<string, string>;
  onSelect: (charId: string) => void;
  onNameChange: (charId: string, name: string) => void;
  onClose: () => void;
}

export function CharacterDetail({ charId, stampHistory, activeCharId, characterNames, onSelect, onNameChange, onClose }: Props) {
  const def = CHARACTER_DEFS.find((c) => c.id === charId)!;
  const unit = def.unitId ? UNITS.find((u) => u.id === def.unitId) : null;
  const unitStamps = def.unitId ? getUnitStampCount(stampHistory, def.unitId) : 0;
  const isActive = activeCharId === charId;

  const currentName = getCharName(charId, characterNames);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  function handleEditStart() {
    setNameInput(currentName);
    setEditing(true);
  }

  function handleSaveName() {
    onNameChange(charId, nameInput);
    setEditing(false);
  }

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

      {editing ? (
        <div className="flex flex-col items-center gap-3">
          <input
            className="rounded-xl border-2 border-amber-300 px-4 py-2 text-center text-2xl w-48"
            value={nameInput}
            maxLength={8}
            autoFocus
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={def.name}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveName}
              className="rounded-xl bg-green-500 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#2e7d32]"
            >
              けってい
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl bg-gray-300 px-5 py-2 text-lg font-bold text-gray-700"
            >
              もどる
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold text-purple-800">{currentName}</h1>
          <button
            type="button"
            onClick={handleEditStart}
            className="text-sm text-purple-500 underline"
          >
            なまえをかえる
          </button>
        </div>
      )}

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
