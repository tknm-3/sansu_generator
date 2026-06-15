import type { WordItem } from './types';

// もじギア・ファクトリーの語辞書（§4）。
// モーラ列は手で確定（拗音「きゃ」は1要素、長音「ー」も1モーラ）。
// 絵文字の読みは tts.ts の EMOJI_READINGS にも足してある（読み上げ用）。

export const WORDS: WordItem[] = [
  // ── たべもの ──
  { id: 'ringo', display: '🍎', reading: 'りんご', mora: ['り', 'ん', 'ご'], category: 'food', difficulty: 2 },
  { id: 'mikan', display: '🍊', reading: 'みかん', mora: ['み', 'か', 'ん'], category: 'food', difficulty: 2 },
  { id: 'budou', display: '🍇', reading: 'ぶどう', mora: ['ぶ', 'ど', 'う'], category: 'food', difficulty: 2, special: ['voiced'] },
  { id: 'ichigo', display: '🍓', reading: 'いちご', mora: ['い', 'ち', 'ご'], category: 'food', difficulty: 2, special: ['voiced'] },
  { id: 'banana', display: '🍌', reading: 'ばなな', mora: ['ば', 'な', 'な'], category: 'food', difficulty: 2, special: ['voiced'] },
  { id: 'suika', display: '🍉', reading: 'すいか', mora: ['す', 'い', 'か'], category: 'food', difficulty: 2 },
  { id: 'donut', display: '🍩', reading: 'どーなつ', mora: ['ど', 'ー', 'な', 'つ'], category: 'food', difficulty: 3, special: ['voiced', 'choon'] },
  { id: 'cookie', display: '🍪', reading: 'くっきー', mora: ['く', 'っ', 'き', 'ー'], category: 'food', difficulty: 3, special: ['sokuon', 'choon'] },
  { id: 'ame', display: '🍭', reading: 'あめ', mora: ['あ', 'め'], category: 'food', difficulty: 1 },
  { id: 'cake', display: '🍰', reading: 'けーき', mora: ['け', 'ー', 'き'], category: 'food', difficulty: 2, special: ['choon'] },
  { id: 'ninjin', display: '🥕', reading: 'にんじん', mora: ['に', 'ん', 'じ', 'ん'], category: 'food', difficulty: 3, special: ['voiced'] },
  { id: 'kuri', display: '🌰', reading: 'くり', mora: ['く', 'り'], category: 'food', difficulty: 1 },
  { id: 'pan', display: '🍞', reading: 'ぱん', mora: ['ぱ', 'ん'], category: 'food', difficulty: 1, special: ['semivoiced'] },
  { id: 'tamago', display: '🥚', reading: 'たまご', mora: ['た', 'ま', 'ご'], category: 'food', difficulty: 2, special: ['voiced'] },

  // ── いきもの ──
  { id: 'neko', display: '🐱', reading: 'ねこ', mora: ['ね', 'こ'], category: 'animal', difficulty: 1 },
  { id: 'inu', display: '🐶', reading: 'いぬ', mora: ['い', 'ぬ'], category: 'animal', difficulty: 1 },
  { id: 'kaeru', display: '🐸', reading: 'かえる', mora: ['か', 'え', 'る'], category: 'animal', difficulty: 2 },
  { id: 'panda', display: '🐼', reading: 'ぱんだ', mora: ['ぱ', 'ん', 'だ'], category: 'animal', difficulty: 2, special: ['semivoiced', 'voiced'] },
  { id: 'kitsune', display: '🦊', reading: 'きつね', mora: ['き', 'つ', 'ね'], category: 'animal', difficulty: 2 },
  { id: 'koala', display: '🐨', reading: 'こあら', mora: ['こ', 'あ', 'ら'], category: 'animal', difficulty: 2 },
  { id: 'lion', display: '🦁', reading: 'らいおん', mora: ['ら', 'い', 'お', 'ん'], category: 'animal', difficulty: 3 },
  { id: 'tora', display: '🐯', reading: 'とら', mora: ['と', 'ら'], category: 'animal', difficulty: 1 },
  { id: 'sakana', display: '🐟', reading: 'さかな', mora: ['さ', 'か', 'な'], category: 'animal', difficulty: 2 },
  { id: 'zou', display: '🐘', reading: 'ぞう', mora: ['ぞ', 'う'], category: 'animal', difficulty: 1, special: ['voiced'] },
  { id: 'usagi', display: '🐰', reading: 'うさぎ', mora: ['う', 'さ', 'ぎ'], category: 'animal', difficulty: 2, special: ['voiced'] },
  { id: 'tako', display: '🐙', reading: 'たこ', mora: ['た', 'こ'], category: 'animal', difficulty: 1 },
  { id: 'kani', display: '🦀', reading: 'かに', mora: ['か', 'に'], category: 'animal', difficulty: 1 },
  { id: 'hiyoko', display: '🐤', reading: 'ひよこ', mora: ['ひ', 'よ', 'こ'], category: 'animal', difficulty: 2 },

  // ── のりもの ──
  { id: 'kuruma', display: '🚗', reading: 'くるま', mora: ['く', 'る', 'ま'], category: 'vehicle', difficulty: 2 },
  { id: 'basu', display: '🚌', reading: 'ばす', mora: ['ば', 'す'], category: 'vehicle', difficulty: 1, special: ['voiced'] },
  { id: 'densha', display: '🚃', reading: 'でんしゃ', mora: ['で', 'ん', 'しゃ'], category: 'vehicle', difficulty: 2, special: ['voiced', 'youon'] },
  { id: 'hikouki', display: '✈️', reading: 'ひこうき', mora: ['ひ', 'こ', 'う', 'き'], category: 'vehicle', difficulty: 3 },
  { id: 'fune', display: '⛵', reading: 'ふね', mora: ['ふ', 'ね'], category: 'vehicle', difficulty: 1 },
  { id: 'rocket', display: '🚀', reading: 'ろけっと', mora: ['ろ', 'け', 'っ', 'と'], category: 'vehicle', difficulty: 3, special: ['sokuon'] },
  { id: 'jitensha', display: '🚲', reading: 'じてんしゃ', mora: ['じ', 'て', 'ん', 'しゃ'], category: 'vehicle', difficulty: 3, special: ['voiced', 'youon'] },

  // ── しぜん ──
  { id: 'hana', display: '🌸', reading: 'はな', mora: ['は', 'な'], category: 'nature', difficulty: 1 },
  { id: 'hoshi', display: '⭐', reading: 'ほし', mora: ['ほ', 'し'], category: 'nature', difficulty: 1 },
  { id: 'tsuki', display: '🌙', reading: 'つき', mora: ['つ', 'き'], category: 'nature', difficulty: 1 },
  { id: 'kumo', display: '☁️', reading: 'くも', mora: ['く', 'も'], category: 'nature', difficulty: 1 },
  { id: 'yama', display: '⛰️', reading: 'やま', mora: ['や', 'ま'], category: 'nature', difficulty: 1 },
  { id: 'umi', display: '🌊', reading: 'うみ', mora: ['う', 'み'], category: 'nature', difficulty: 1 },
  { id: 'niji', display: '🌈', reading: 'にじ', mora: ['に', 'じ'], category: 'nature', difficulty: 1, special: ['voiced'] },
  { id: 'ki', display: '🌳', reading: 'き', mora: ['き'], category: 'nature', difficulty: 1 },

  // ── もの ──
  { id: 'fuusen', display: '🎈', reading: 'ふうせん', mora: ['ふ', 'う', 'せ', 'ん'], category: 'thing', difficulty: 3 },
  { id: 'ribbon', display: '🎀', reading: 'りぼん', mora: ['り', 'ぼ', 'ん'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'tokei', display: '⏰', reading: 'とけい', mora: ['と', 'け', 'い'], category: 'thing', difficulty: 2 },
  { id: 'kasa', display: '☂️', reading: 'かさ', mora: ['か', 'さ'], category: 'thing', difficulty: 1 },
  { id: 'hon', display: '📖', reading: 'ほん', mora: ['ほ', 'ん'], category: 'thing', difficulty: 1 },
  { id: 'tsumiki', display: '🧱', reading: 'つみき', mora: ['つ', 'み', 'き'], category: 'thing', difficulty: 2 },
  { id: 'boushi', display: '🎩', reading: 'ぼうし', mora: ['ぼ', 'う', 'し'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'kagi', display: '🔑', reading: 'かぎ', mora: ['か', 'ぎ'], category: 'thing', difficulty: 1, special: ['voiced'] },
];

/** id で引く */
export function getWord(id: string): WordItem | undefined {
  return WORDS.find((w) => w.id === id);
}

/** ひらがな1文字の だいたいの 50音プール（ダミー選択肢用） */
export const KANA_POOL: string[] = [
  'あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ',
  'ら', 'り', 'る', 'れ', 'ろ', 'わ',
];
