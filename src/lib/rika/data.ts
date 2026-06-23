import type { RikaGroup } from './types';

// りかランドの「なかま」辞書。
// members = その属性を みたす絵／distractors = 明らかに みたさない絵。
// ・members から 正解を 1つ、distractors から ダミーを 出す＝答えが 一意（あいまいさ無し）。
// ・members と distractors は 重ねない（テスト `members ∩ distractors = ∅` で保証）。
// ・「観察→分類」「予想（うく/じしゃく）」を 同じUIで まぜて 出す。
export const RIKA_GROUPS: RikaGroup[] = [
  {
    id: 'swim',
    prompt: 'みずの なかで およぐ のは どれ？',
    members: ['🐟', '🐠', '🐬', '🦈', '🐙', '🦑', '🐳', '🦭'],
    distractors: ['🐦', '🦋', '🐰', '🚗', '🌳', '🐝', '🦒', '🚲'],
  },
  {
    id: 'fly',
    prompt: 'そらを とぶ のは どれ？',
    members: ['🐦', '🦋', '🐝', '🦅', '🦇', '✈️', '🚁', '🦉'],
    distractors: ['🐟', '🐢', '🐘', '🍎', '🚗', '🐌', '🪨', '👟'],
  },
  {
    id: 'food',
    prompt: 'たべられる のは どれ？',
    members: ['🍎', '🍌', '🍓', '🍞', '🥕', '🍙', '🧀', '🍇'],
    distractors: ['🚗', '📕', '👟', '🪨', '✏️', '🔑', '🧦', '🎈'],
  },
  {
    id: 'vehicle',
    prompt: 'のりもの は どれ？',
    members: ['🚗', '🚌', '✈️', '🚲', '🚂', '🚒', '🚜', '🛵'],
    distractors: ['🐶', '🍎', '🌳', '🧦', '📕', '🐟', '🌸', '🔑'],
  },
  {
    id: 'plant',
    prompt: 'き や はな の なかま は どれ？',
    members: ['🌳', '🌸', '🌻', '🌷', '🌲', '🍄', '🌵', '🌹'],
    distractors: ['🐶', '🚗', '🔑', '⭐', '🐟', '🧸', '🪨', '👟'],
  },
  {
    id: 'float',
    prompt: 'みずに うくのは どれ？',
    members: ['🍎', '🍂', '🦆', '🛟', '🪵', '🛶', '🍃', '🦢'],
    distractors: ['🪨', '🔩', '🗝️', '⚓', '🔨', '🪙', '🧱', '⚙️'],
  },
  {
    id: 'magnet',
    prompt: 'じしゃくに くっつくのは どれ？',
    members: ['🔩', '📎', '🔧', '🔨', '⚙️', '🔗'],
    distractors: ['🧶', '🍎', '📄', '🪵', '🧽', '🎈', '🧦', '🍃'],
  },
];
