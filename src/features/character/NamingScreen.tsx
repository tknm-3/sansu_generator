import { useState } from 'react';
import { saveCharacterName } from './character';

interface Props {
  onDone: (name: string) => void;
}

/** 初回：相棒に名前をつける。空なら既定名で進む。 */
export function NamingScreen({ onDone }: Props) {
  const [value, setValue] = useState('');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-amber-50 p-8">
      <div className="text-7xl">🐰</div>
      <p className="text-xl font-bold text-amber-900">なまえを つけてね！</p>
      <input
        className="rounded-xl border-2 border-amber-300 px-4 py-3 text-center text-2xl"
        value={value}
        maxLength={8}
        onChange={(e) => setValue(e.target.value)}
        placeholder="うさたろう"
      />
      <button
        type="button"
        className="rounded-2xl bg-green-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#2e7d32]"
        onClick={() => {
          const saved = saveCharacterName(value);
          onDone(saved.name);
        }}
      >
        けってい
      </button>
    </div>
  );
}
