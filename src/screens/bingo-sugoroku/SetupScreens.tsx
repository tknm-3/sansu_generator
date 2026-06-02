import { motion } from 'framer-motion';
import { PLAYER_STYLES, CHARACTERS } from './types';

// ── 数字選択ピッカー ────────────────────────────────────────────────────────

function NumberPicker({ selected, onToggle }: { selected: Set<number>; onToggle: (n: number) => void }) {
  const MAX = 8;
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
      {Array.from({ length: 100 }, (_, i) => i + 1).map(n => {
        const isCenter = n === 1;
        const isSel    = selected.has(n);
        const disabled = isCenter || (!isSel && selected.size >= MAX);
        return (
          <button
            key={n} type="button"
            onClick={() => !disabled && onToggle(n)}
            className={`aspect-square text-xs font-bold rounded transition-all select-none
              ${isCenter  ? 'bg-yellow-300 text-yellow-800 ring-2 ring-yellow-500 cursor-default'
              : isSel     ? 'bg-orange-400 text-white ring-2 ring-orange-600 scale-110 z-10 relative'
              : disabled  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              :              'bg-white hover:bg-amber-100 text-gray-600 border border-gray-200'}`}
          >
            {isCenter ? '★' : n}
          </button>
        );
      })}
    </div>
  );
}

// ── カード作成画面 ──────────────────────────────────────────────────────────

export function SetupCardsScreen({
  setupIdx, playerCount,
  editName, setEditName,
  editNumbers, setEditNumbers,
  editCharacter, setEditCharacter,
  onConfirm,
}: {
  setupIdx: number; playerCount: number;
  editName: string; setEditName: (s: string) => void;
  editNumbers: Set<number>; setEditNumbers: React.Dispatch<React.SetStateAction<Set<number>>>;
  editCharacter: string; setEditCharacter: (s: string) => void;
  onConfirm: () => void;
}) {
  const s = PLAYER_STYLES[setupIdx % PLAYER_STYLES.length];
  const others  = [...editNumbers].filter(n => n !== 1).sort((a, b) => a - b);
  const preview = [...others.slice(0,4), -1, ...others.slice(4)]; // -1 = 中央★

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-rose-100 to-orange-50 p-4 overflow-y-auto">
      <div className="flex items-center gap-3 w-full max-w-lg">
        <span className={`w-8 h-8 rounded-full ${s.bg} flex-shrink-0`} />
        <h2 className="text-xl font-bold text-gray-700">プレイヤー {setupIdx + 1} / {playerCount}：カード作り</h2>
      </div>

      <div className="w-full max-w-lg">
        <label className="block text-sm font-bold text-gray-600 mb-1">なまえ</label>
        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} maxLength={8}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-lg font-bold focus:border-rose-400 outline-none" />
      </div>

      <div className="w-full max-w-lg">
        <p className="text-sm font-bold text-gray-600 mb-2">コマのキャラクターをえらんでね</p>
        <div className="grid grid-cols-5 gap-2">
          {CHARACTERS.map(c => (
            <motion.button key={c} type="button" onClick={() => setEditCharacter(c)} whileTap={{ scale: 0.85 }}
              className={`aspect-square text-3xl flex items-center justify-center rounded-2xl border-4 transition-all
                ${editCharacter === c ? 'border-rose-500 bg-rose-100 shadow-md scale-110' : 'border-transparent bg-gray-50 hover:bg-amber-50'}`}>
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg">
        <p className="text-sm font-bold text-gray-600 mb-1">
          すきな数字を 8つ えらんでね
          <span className="text-yellow-700 ml-1">（まんなかは ★ = 1 が自動でつく）</span>
          <span className={`ml-2 font-bold ${editNumbers.size === 8 ? 'text-emerald-600' : 'text-rose-500'}`}>
            （{editNumbers.size} / 8）
          </span>
        </p>
        <NumberPicker selected={editNumbers} onToggle={n => {
          setEditNumbers(prev => {
            const next = new Set(prev);
            if (next.has(n)) next.delete(n); else if (next.size < 8) next.add(n);
            return next;
          });
        }} />
      </div>

      {editNumbers.size > 0 && (
        <div className="w-full max-w-lg">
          <p className="text-sm font-bold text-gray-600 mb-2">カードのプレビュー</p>
          <div className="grid grid-cols-3 gap-1 max-w-[150px]">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`aspect-square flex items-center justify-center text-sm font-bold rounded-lg
                ${preview[i] === -1 ? 'bg-yellow-300 text-yellow-900' : preview[i] != null ? `${s.bg} text-white` : 'bg-gray-100 text-gray-300'}`}>
                {preview[i] === -1 ? '★' : preview[i] ?? '？'}
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.button type="button" onClick={onConfirm} disabled={editNumbers.size !== 8}
        whileTap={editNumbers.size === 8 ? { scale: 0.95 } : undefined}
        className={`w-full max-w-lg rounded-2xl py-4 text-xl font-bold text-white transition-all
          ${editNumbers.size === 8 ? 'bg-rose-500 shadow-[0_4px_0_#be123c] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}>
        {setupIdx + 1 < playerCount ? 'つぎのひとへ →' : 'ゲームスタート！🎲'}
      </motion.button>
    </div>
  );
}

// ── 人数選択画面 ────────────────────────────────────────────────────────────

export function SetupCountScreen({
  onExit, playerCount, setPlayerCount, onNext,
}: {
  onExit: () => void;
  playerCount: number;
  setPlayerCount: (n: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-rose-100 to-orange-50 p-6">
      <button type="button" onClick={onExit} className="absolute top-4 left-4 rounded-xl bg-white/60 px-3 py-2 text-gray-600 font-bold text-sm">← もどる</button>
      <div className="text-6xl">🎲</div>
      <h1 className="text-3xl font-bold text-rose-800">ビンゴすごろく</h1>
      <p className="text-gray-600 text-center">100マスのすごろく＋ビンゴで<br />ドキドキ たいけつ！</p>
      <div className="rounded-3xl bg-white p-8 shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-center text-gray-700 mb-6">何人でやる？</h2>
        <div className="flex gap-4 justify-center mb-6">
          {[2,3,4].map(n => (
            <motion.button key={n} type="button" onClick={() => setPlayerCount(n)} whileTap={{ scale: 0.9 }}
              className={`w-20 h-20 rounded-2xl text-3xl font-bold border-4 transition-all
                ${playerCount === n ? 'bg-rose-400 text-white border-rose-600 shadow-lg' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {n}人
            </motion.button>
          ))}
        </div>
        <motion.button type="button" onClick={onNext} whileTap={{ scale: 0.95 }} className="w-full rounded-2xl bg-rose-500 py-4 text-xl font-bold text-white shadow-[0_4px_0_#be123c]">
          つぎへ →
        </motion.button>
      </div>
    </div>
  );
}
