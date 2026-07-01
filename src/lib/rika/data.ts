import type { RikaGroup, RikaSequence, RikaPredictSet } from './types';

// りかランドの データ辞書。単元(unit)ごとに 出す なかま／系列／予想セットを タグづけする。
// members = その属性を みたす絵／distractors = 明らかに みたさない絵。
// ・members から 正解を 1つ、distractors から ダミーを 出す＝答えが 一意（あいまいさ無し）。
// ・members と distractors は 重ねない（テスト `members ∩ distractors = ∅` で保証）。

// ── いきものかんさつ🐾／きせつ🌤️：なかまわけ・なかまはずれ ──
export const RIKA_GROUPS: RikaGroup[] = [
  // いきもの（観察と分類）
  {
    id: 'swim',
    unit: 'ikimono',
    prompt: 'みずの なかで およぐ のは どれ？',
    members: ['🐟', '🐠', '🐬', '🦈', '🐙', '🦑', '🐳', '🦭'],
    distractors: ['🐦', '🦋', '🐰', '🦒', '🌳', '🐝', '🦁', '🐘'],
  },
  {
    id: 'fly',
    unit: 'ikimono',
    prompt: 'そらを とぶ のは どれ？',
    members: ['🐦', '🦋', '🐝', '🦅', '🦇', '🦉', '🐞', '🦜'],
    distractors: ['🐟', '🐢', '🐘', '🐌', '🐍', '🦈', '🐛', '🦭'],
  },
  {
    id: 'insect',
    unit: 'ikimono',
    prompt: 'むし の なかま は どれ？',
    members: ['🐜', '🐝', '🦋', '🐞', '🦗', '🐛', '🦟', '🪲'],
    distractors: ['🐟', '🐦', '🐰', '🐢', '🐍', '🐸', '🦭', '🐘'],
  },
  {
    id: 'fourlegs',
    unit: 'ikimono',
    prompt: 'あしが 4ほん の どうぶつ は どれ？',
    members: ['🐘', '🦁', '🐕', '🐈', '🐴', '🐮', '🐷', '🦒'],
    distractors: ['🐦', '🐟', '🦋', '🐝', '🐍', '🐙', '🐛', '🦭'],
  },
  {
    id: 'plant',
    unit: 'ikimono',
    prompt: 'き や はな の なかま は どれ？',
    members: ['🌳', '🌸', '🌻', '🌷', '🌲', '🍄', '🌵', '🌹'],
    distractors: ['🐶', '🚗', '🔑', '⭐', '🐟', '🧸', '🪨', '👟'],
  },
  // きせつ・てんき（季節と天気の なかまわけ）
  {
    id: 'summer',
    unit: 'kisetsu',
    prompt: 'なつ の もの は どれ？',
    members: ['🍉', '🏖️', '🍧', '🎆', '🌻', '🏄', '🦟', '🍦'],
    distractors: ['⛄', '🧤', '🎿', '🍂', '🧣', '☃️', '🎄', '🧦'],
  },
  {
    id: 'winter',
    unit: 'kisetsu',
    prompt: 'ふゆ の もの は どれ？',
    members: ['⛄', '🧤', '🎿', '🧣', '☃️', '🎄', '🧦', '❄️'],
    distractors: ['🍉', '🏖️', '🍧', '🌻', '🏄', '🍦', '🌞', '🩴'],
  },
  {
    id: 'rain',
    unit: 'kisetsu',
    prompt: 'あめ の ひ に つかう のは どれ？',
    members: ['☔', '🌂', '👢', '🦆', '💧', '🐌', '🌧️', '🐸'],
    distractors: ['🕶️', '🏖️', '🌻', '⛄', '🎿', '🪁', '🔦', '🧤'],
  },
  // うくしずむ・じしゃく（分類でも 出す。予想と 同じ 対象）
  {
    id: 'float',
    unit: 'ukishizumu',
    prompt: 'みずに うくのは どれ？',
    members: ['🍎', '🍂', '🦆', '🛟', '🪵', '🛶', '🍃', '🦢'],
    distractors: ['🪨', '🔩', '🗝️', '⚓', '🔨', '🪙', '🧱', '⚙️'],
  },
  {
    id: 'magnet',
    unit: 'jishaku',
    prompt: 'じしゃくに くっつくのは どれ？',
    members: ['🔩', '📎', '🔧', '🔨', '⚙️', '🔗', '🪝', '🥫'],
    distractors: ['🧶', '🍎', '📄', '🪵', '🧽', '🎈', '🧦', '🍃'],
  },
];

// ── そだつ じゅんばん（系列・並べ替え）──
// stages は さいしょ→さいご の 正しい順。重複なし（テストで保証）＝順が 一意。
export const RIKA_SEQUENCES: RikaSequence[] = [
  { id: 'chicken', unit: 'sodatsu', prompt: 'たまごから そだつ じゅんに ならべて', stages: ['🥚', '🐣', '🐔'] },
  { id: 'butterfly', unit: 'sodatsu', prompt: 'ちょうちょに なる じゅんに ならべて', stages: ['🥚', '🐛', '🦋'] },
  { id: 'frog', unit: 'sodatsu', prompt: 'かえるに なる じゅんに ならべて', stages: ['🥚', '🐛', '🐸'] },
  { id: 'plant', unit: 'sodatsu', prompt: 'たねから そだつ じゅんに ならべて', stages: ['🌰', '🌱', '🌸'] },
  { id: 'plant4', unit: 'sodatsu', prompt: 'たねから はなが さく じゅんに ならべて', stages: ['🌰', '🌱', '🌿', '🌻'] },
  { id: 'human', unit: 'sodatsu', prompt: 'あかちゃんから おおきく なる じゅんに ならべて', stages: ['👶', '🧒', '🧑'] },
  { id: 'day', unit: 'sodatsu', prompt: 'あさから よるまで じゅんに ならべて', stages: ['🌅', '☀️', '🌇', '🌙'] },
  // きせつ の じゅんばん は kisetsu 単元でも 出す
  { id: 'season', unit: 'kisetsu', prompt: 'はるから じゅんに ならべて', stages: ['🌸', '🌻', '🍁', '⛄'] },
];

// ── 予想（predict）：予想→たしかめ の セット ──
// positive=true は labels[0]（うく／くっつく）が 正しい。理由は 前向きに ひとこと。
export const RIKA_PREDICTS: RikaPredictSet[] = [
  {
    id: 'float',
    unit: 'ukishizumu',
    prompt: 'みずに いれたら…？',
    labels: ['うく 🛟', 'しずむ ⬇️'],
    items: [
      { emoji: '🍎', positive: true, reason: 'りんごは かるいから みずに うくよ！' },
      { emoji: '🪵', positive: true, reason: 'きは みずに うくよ。ふねも きで できてるね！' },
      { emoji: '🦆', positive: true, reason: 'あひるは みずに ういて およぐよ！' },
      { emoji: '🍃', positive: true, reason: 'はっぱは かるくて みずに うくよ！' },
      { emoji: '🛟', positive: true, reason: 'うきわは うくために あるんだね！' },
      { emoji: '🪨', positive: false, reason: 'いしは おもいから しずむよ。' },
      { emoji: '🔩', positive: false, reason: 'きんぞくは おもいから しずむよ。' },
      { emoji: '🔨', positive: false, reason: 'かなづちは おもくて しずむよ。' },
      { emoji: '🗝️', positive: false, reason: 'かぎは きんぞくで しずむよ。' },
      { emoji: '🪙', positive: false, reason: 'コインは ちいさくても しずむよ。' },
    ],
  },
  {
    id: 'magnet',
    unit: 'jishaku',
    prompt: 'じしゃくに ちかづけたら…？',
    labels: ['くっつく 🧲', 'つかない 🙅'],
    items: [
      { emoji: '🔩', positive: true, reason: 'ねじは てつ。じしゃくに くっつくよ！' },
      { emoji: '📎', positive: true, reason: 'クリップは てつ。ぴたっと くっつくよ！' },
      { emoji: '🔧', positive: true, reason: 'スパナは てつで できてる。くっつくよ！' },
      { emoji: '🥫', positive: true, reason: 'かんづめの かんは てつ。くっつくよ！' },
      { emoji: '🪝', positive: true, reason: 'フックは てつ。くっつくよ！' },
      { emoji: '🍎', positive: false, reason: 'りんごは てつじゃない。くっつかないよ。' },
      { emoji: '🧦', positive: false, reason: 'くつしたは ぬの。くっつかないよ。' },
      { emoji: '🪵', positive: false, reason: 'きは てつじゃない。くっつかないよ。' },
      { emoji: '🎈', positive: false, reason: 'ふうせんは ゴム。くっつかないよ。' },
      { emoji: '📄', positive: false, reason: 'かみは てつじゃない。くっつかないよ。' },
    ],
  },
];
