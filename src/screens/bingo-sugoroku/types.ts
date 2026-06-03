export const PLAYER_STYLES = [
  { bg: 'bg-orange-400',  border: 'border-orange-500',  light: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-400',  hex: '#fb923c' },
  { bg: 'bg-sky-500',     border: 'border-sky-600',     light: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-400',     hex: '#0ea5e9' },
  { bg: 'bg-emerald-500', border: 'border-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-400', hex: '#10b981' },
  { bg: 'bg-pink-500',    border: 'border-pink-600',    light: 'bg-pink-50',    text: 'text-pink-700',    ring: 'ring-pink-400',    hex: '#ec4899' },
] as const;

export const DICE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const CHARACTERS    = ['🐶','🐱','🐰','🐸','🦊','🐼','🐨','🐯','🦁','🐻'];
export const DEFAULT_CHARS = ['🐶','🐱','🐰','🐸'];
export const DEFAULT_NAMES = ['こども','パパ','ママ','ゲスト'];

/** 2〜99 からランダムに8つ選んでビンゴカード用の数字リストを返す */
export function generateRandomBingoNumbers(): number[] {
  const pool = Array.from({ length: 98 }, (_, i) => i + 2); // 2〜99
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 8).sort((a, b) => a - b);
}

export interface Player {
  name:      string;
  numbers:   number[];   // 9マス（index 4 = 中央 = 1 固定）
  checked:   boolean[];  // index 4 は最初から true
  position:  number;     // 1-100
  doneLines: number[];
  character: string;
}
