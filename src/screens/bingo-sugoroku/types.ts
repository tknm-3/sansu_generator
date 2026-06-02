export const PLAYER_STYLES = [
  { bg: 'bg-orange-400',  border: 'border-orange-500',  light: 'bg-orange-50',  text: 'text-orange-700'  },
  { bg: 'bg-sky-500',     border: 'border-sky-600',     light: 'bg-sky-50',     text: 'text-sky-700'     },
  { bg: 'bg-emerald-500', border: 'border-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700' },
  { bg: 'bg-pink-500',    border: 'border-pink-600',    light: 'bg-pink-50',    text: 'text-pink-700'    },
] as const;

export const DICE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const CHARACTERS    = ['🐶','🐱','🐰','🐸','🦊','🐼','🐨','🐯','🦁','🐻'];
export const DEFAULT_CHARS = ['🐶','🐱','🐰','🐸'];
export const DEFAULT_NAMES = ['こども','パパ','ママ','ゲスト'];

// 8つ選択（中央の 1 は自動追加）
export const DEFAULT_NUMBERS = [
  [3,15,27,42,56,63,71,85],
  [7,18,33,48,52,67,74,81],
  [11,24,38,45,59,68,76,83],
  [5,22,31,44,57,69,78,87],
];

export interface Player {
  name:            string;
  numbers:         number[];   // 9マス（index 4 = 中央 = 1 固定）
  checked:         boolean[];  // index 4 は最初から true
  position:        number;     // 1-100
  doneLines:       number[];
  character:       string;
  bonusUsed:       boolean;
  bonusTriggerPos: number;     // 35〜55 のランダム
}
