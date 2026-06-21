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

  // ── ふやした語（3〜4モーラ・特殊音 多め。般化と難易度のため）──
  { id: 'ushi', display: '🐮', reading: 'うし', mora: ['う', 'し'], category: 'animal', difficulty: 1 },
  { id: 'buta', display: '🐷', reading: 'ぶた', mora: ['ぶ', 'た'], category: 'animal', difficulty: 1, special: ['voiced'] },
  { id: 'kame', display: '🐢', reading: 'かめ', mora: ['か', 'め'], category: 'animal', difficulty: 1 },
  { id: 'hebi', display: '🐍', reading: 'へび', mora: ['へ', 'び'], category: 'animal', difficulty: 1, special: ['voiced'] },
  { id: 'wani', display: '🐊', reading: 'わに', mora: ['わ', 'に'], category: 'animal', difficulty: 1 },
  { id: 'kirin', display: '🦒', reading: 'きりん', mora: ['き', 'り', 'ん'], category: 'animal', difficulty: 2 },
  { id: 'shimauma', display: '🦓', reading: 'しまうま', mora: ['し', 'ま', 'う', 'ま'], category: 'animal', difficulty: 3 },
  { id: 'niwatori', display: '🐔', reading: 'にわとり', mora: ['に', 'わ', 'と', 'り'], category: 'animal', difficulty: 3 },
  { id: 'pengin', display: '🐧', reading: 'ぺんぎん', mora: ['ぺ', 'ん', 'ぎ', 'ん'], category: 'animal', difficulty: 3, special: ['semivoiced', 'voiced'] },

  { id: 'momo', display: '🍑', reading: 'もも', mora: ['も', 'も'], category: 'food', difficulty: 1 },
  { id: 'nashi', display: '🍐', reading: 'なし', mora: ['な', 'し'], category: 'food', difficulty: 1 },
  { id: 'imo', display: '🍠', reading: 'いも', mora: ['い', 'も'], category: 'food', difficulty: 1 },
  { id: 'meron', display: '🍈', reading: 'めろん', mora: ['め', 'ろ', 'ん'], category: 'food', difficulty: 2 },
  { id: 'choko', display: '🍫', reading: 'ちょこ', mora: ['ちょ', 'こ'], category: 'food', difficulty: 1, special: ['youon'] },
  { id: 'ocha', display: '🍵', reading: 'おちゃ', mora: ['お', 'ちゃ'], category: 'food', difficulty: 1, special: ['youon'] },
  { id: 'tamanegi', display: '🧅', reading: 'たまねぎ', mora: ['た', 'ま', 'ね', 'ぎ'], category: 'food', difficulty: 3, special: ['voiced'] },

  { id: 'baiku', display: '🏍️', reading: 'ばいく', mora: ['ば', 'い', 'く'], category: 'vehicle', difficulty: 2, special: ['voiced'] },
  { id: 'patokaa', display: '🚓', reading: 'ぱとかー', mora: ['ぱ', 'と', 'か', 'ー'], category: 'vehicle', difficulty: 3, special: ['semivoiced', 'choon'] },

  { id: 'yuki', display: '❄️', reading: 'ゆき', mora: ['ゆ', 'き'], category: 'nature', difficulty: 1 },
  { id: 'kinoko', display: '🍄', reading: 'きのこ', mora: ['き', 'の', 'こ'], category: 'nature', difficulty: 2 },
  { id: 'himawari', display: '🌻', reading: 'ひまわり', mora: ['ひ', 'ま', 'わ', 'り'], category: 'nature', difficulty: 3 },
  { id: 'kaminari', display: '⚡', reading: 'かみなり', mora: ['か', 'み', 'な', 'り'], category: 'nature', difficulty: 3 },
  { id: 'tulip', display: '🌷', reading: 'ちゅーりっぷ', mora: ['ちゅ', 'ー', 'り', 'っ', 'ぷ'], category: 'nature', difficulty: 3, special: ['youon', 'choon', 'sokuon', 'semivoiced'] },

  { id: 'koma', display: '🪀', reading: 'こま', mora: ['こ', 'ま'], category: 'thing', difficulty: 1 },
  { id: 'taiko', display: '🥁', reading: 'たいこ', mora: ['た', 'い', 'こ'], category: 'thing', difficulty: 2 },
  { id: 'megane', display: '👓', reading: 'めがね', mora: ['め', 'が', 'ね'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'gitaa', display: '🎸', reading: 'ぎたー', mora: ['ぎ', 'た', 'ー'], category: 'thing', difficulty: 2, special: ['voiced', 'choon'] },
  { id: 'kutsushita', display: '🧦', reading: 'くつした', mora: ['く', 'つ', 'し', 'た'], category: 'thing', difficulty: 3 },

  // ── ながい ことば（5〜6モーラ）。文字数の多い お題のバリエーション・般化のため ──
  // いきもの
  { id: 'kyouryuu', display: '🦕', reading: 'きょうりゅう', mora: ['きょ', 'う', 'りゅ', 'う'], category: 'animal', difficulty: 3, special: ['youon'] },
  { id: 'harinezumi', display: '🦔', reading: 'はりねずみ', mora: ['は', 'り', 'ね', 'ず', 'み'], category: 'animal', difficulty: 3, special: ['voiced'] },
  { id: 'kangaroo', display: '🦘', reading: 'かんがるー', mora: ['か', 'ん', 'が', 'る', 'ー'], category: 'animal', difficulty: 3, special: ['voiced', 'choon'] },
  { id: 'flamingo', display: '🦩', reading: 'ふらみんご', mora: ['ふ', 'ら', 'み', 'ん', 'ご'], category: 'animal', difficulty: 3, special: ['voiced'] },
  { id: 'namakemono', display: '🦥', reading: 'なまけもの', mora: ['な', 'ま', 'け', 'も', 'の'], category: 'animal', difficulty: 3 },
  { id: 'hamster', display: '🐹', reading: 'はむすたー', mora: ['は', 'む', 'す', 'た', 'ー'], category: 'animal', difficulty: 3, special: ['choon'] },
  { id: 'katatsumuri', display: '🐌', reading: 'かたつむり', mora: ['か', 'た', 'つ', 'む', 'り'], category: 'animal', difficulty: 3 },
  { id: 'tentoumushi', display: '🐞', reading: 'てんとうむし', mora: ['て', 'ん', 'と', 'う', 'む', 'し'], category: 'animal', difficulty: 3 },
  // たべもの
  { id: 'pineapple', display: '🍍', reading: 'ぱいなっぷる', mora: ['ぱ', 'い', 'な', 'っ', 'ぷ', 'る'], category: 'food', difficulty: 3, special: ['semivoiced', 'sokuon'] },
  { id: 'broccoli', display: '🥦', reading: 'ぶろっこりー', mora: ['ぶ', 'ろ', 'っ', 'こ', 'り', 'ー'], category: 'food', difficulty: 3, special: ['voiced', 'sokuon', 'choon'] },
  { id: 'corn', display: '🌽', reading: 'とうもろこし', mora: ['と', 'う', 'も', 'ろ', 'こ', 'し'], category: 'food', difficulty: 3 },
  { id: 'hamburger', display: '🍔', reading: 'はんばーがー', mora: ['は', 'ん', 'ば', 'ー', 'が', 'ー'], category: 'food', difficulty: 3, special: ['voiced', 'choon'] },
  { id: 'cupcake', display: '🧁', reading: 'かっぷけーき', mora: ['か', 'っ', 'ぷ', 'け', 'ー', 'き'], category: 'food', difficulty: 3, special: ['sokuon', 'semivoiced', 'choon'] },
  { id: 'sandwich', display: '🥪', reading: 'さんどいっち', mora: ['さ', 'ん', 'ど', 'い', 'っ', 'ち'], category: 'food', difficulty: 3, special: ['voiced', 'sokuon'] },
  { id: 'popcorn', display: '🍿', reading: 'ぽっぷこーん', mora: ['ぽ', 'っ', 'ぷ', 'こ', 'ー', 'ん'], category: 'food', difficulty: 3, special: ['semivoiced', 'sokuon', 'choon'] },
  // のりもの
  { id: 'ambulance', display: '🚑', reading: 'きゅうきゅうしゃ', mora: ['きゅ', 'う', 'きゅ', 'う', 'しゃ'], category: 'vehicle', difficulty: 3, special: ['youon'] },
  { id: 'helicopter', display: '🚁', reading: 'へりこぷたー', mora: ['へ', 'り', 'こ', 'ぷ', 'た', 'ー'], category: 'vehicle', difficulty: 3, special: ['semivoiced', 'choon'] },
  { id: 'tractor', display: '🚜', reading: 'とらくたー', mora: ['と', 'ら', 'く', 'た', 'ー'], category: 'vehicle', difficulty: 3, special: ['choon'] },
  // もの
  { id: 'trumpet', display: '🎺', reading: 'とらんぺっと', mora: ['と', 'ら', 'ん', 'ぺ', 'っ', 'と'], category: 'thing', difficulty: 3, special: ['semivoiced', 'sokuon'] },
  { id: 'violin', display: '🎻', reading: 'ばいおりん', mora: ['ば', 'い', 'お', 'り', 'ん'], category: 'thing', difficulty: 3, special: ['voiced'] },
  { id: 'ferriswheel', display: '🎡', reading: 'かんらんしゃ', mora: ['か', 'ん', 'ら', 'ん', 'しゃ'], category: 'thing', difficulty: 3, special: ['youon'] },

  // ── 添加(add-mora)用の みじかい ベース語（あたま/おしりに 1音 たすと 別語に なる）──
  { id: 'ika', display: '🦑', reading: 'いか', mora: ['い', 'か'], category: 'animal', difficulty: 1 },
  { id: 'tai', display: '🐠', reading: 'たい', mora: ['た', 'い'], category: 'animal', difficulty: 1 },
  { id: 'ebi', display: '🦐', reading: 'えび', mora: ['え', 'び'], category: 'animal', difficulty: 1, special: ['voiced'] },
  // ── 絵文字バリエーション追加（おうごん編・般化と 新メカの 燃料）──
  // いきもの
  { id: 'saru', display: '🐵', reading: 'さる', mora: ['さ', 'る'], category: 'animal', difficulty: 1 },
  { id: 'uma', display: '🐴', reading: 'うま', mora: ['う', 'ま'], category: 'animal', difficulty: 1 },
  { id: 'hitsuji', display: '🐑', reading: 'ひつじ', mora: ['ひ', 'つ', 'じ'], category: 'animal', difficulty: 2, special: ['voiced'] },
  { id: 'yagi', display: '🐐', reading: 'やぎ', mora: ['や', 'ぎ'], category: 'animal', difficulty: 1, special: ['voiced'] },
  { id: 'nezumi', display: '🐭', reading: 'ねずみ', mora: ['ね', 'ず', 'み'], category: 'animal', difficulty: 2, special: ['voiced'] },
  { id: 'ari', display: '🐜', reading: 'あり', mora: ['あ', 'り'], category: 'animal', difficulty: 1 },
  { id: 'hachi', display: '🐝', reading: 'はち', mora: ['は', 'ち'], category: 'animal', difficulty: 1 },
  { id: 'chou', display: '🦋', reading: 'ちょう', mora: ['ちょ', 'う'], category: 'animal', difficulty: 2, special: ['youon'] },
  { id: 'fukurou', display: '🦉', reading: 'ふくろう', mora: ['ふ', 'く', 'ろ', 'う'], category: 'animal', difficulty: 3 },
  { id: 'washi', display: '🦅', reading: 'わし', mora: ['わ', 'し'], category: 'animal', difficulty: 1 },
  { id: 'kotori', display: '🐦', reading: 'ことり', mora: ['こ', 'と', 'り'], category: 'animal', difficulty: 2 },
  { id: 'ahiru', display: '🦆', reading: 'あひる', mora: ['あ', 'ひ', 'る'], category: 'animal', difficulty: 2 },
  { id: 'kujira', display: '🐳', reading: 'くじら', mora: ['く', 'じ', 'ら'], category: 'animal', difficulty: 2, special: ['voiced'] },
  { id: 'iruka', display: '🐬', reading: 'いるか', mora: ['い', 'る', 'か'], category: 'animal', difficulty: 2 },
  { id: 'same', display: '🦈', reading: 'さめ', mora: ['さ', 'め'], category: 'animal', difficulty: 1 },
  { id: 'kaba', display: '🦛', reading: 'かば', mora: ['か', 'ば'], category: 'animal', difficulty: 1, special: ['voiced'] },
  { id: 'sai', display: '🦏', reading: 'さい', mora: ['さ', 'い'], category: 'animal', difficulty: 1 },
  { id: 'gorira', display: '🦍', reading: 'ごりら', mora: ['ご', 'り', 'ら'], category: 'animal', difficulty: 2, special: ['voiced'] },
  { id: 'shika', display: '🦌', reading: 'しか', mora: ['し', 'か'], category: 'animal', difficulty: 1 },
  { id: 'risu', display: '🐿️', reading: 'りす', mora: ['り', 'す'], category: 'animal', difficulty: 1 },
  { id: 'hato', display: '🕊️', reading: 'はと', mora: ['は', 'と'], category: 'animal', difficulty: 1 },
  { id: 'kuma', display: '🐻', reading: 'くま', mora: ['く', 'ま'], category: 'animal', difficulty: 1 },
  { id: 'shirokuma', display: '🐻‍❄️', reading: 'しろくま', mora: ['し', 'ろ', 'く', 'ま'], category: 'animal', difficulty: 3 },
  { id: 'kurage', display: '🪼', reading: 'くらげ', mora: ['く', 'ら', 'げ'], category: 'animal', difficulty: 2, special: ['voiced'] },
  { id: 'araiguma', display: '🦝', reading: 'あらいぐま', mora: ['あ', 'ら', 'い', 'ぐ', 'ま'], category: 'animal', difficulty: 3, special: ['voiced'] },
  { id: 'koumori', display: '🦇', reading: 'こうもり', mora: ['こ', 'う', 'も', 'り'], category: 'animal', difficulty: 3 },
  // たべもの
  { id: 'tomato', display: '🍅', reading: 'とまと', mora: ['と', 'ま', 'と'], category: 'food', difficulty: 2 },
  { id: 'nasu', display: '🍆', reading: 'なす', mora: ['な', 'す'], category: 'food', difficulty: 1 },
  { id: 'piiman', display: '🫑', reading: 'ぴーまん', mora: ['ぴ', 'ー', 'ま', 'ん'], category: 'food', difficulty: 3, special: ['semivoiced', 'choon'] },
  { id: 'kyuuri', display: '🥒', reading: 'きゅうり', mora: ['きゅ', 'う', 'り'], category: 'food', difficulty: 2, special: ['youon'] },
  { id: 'sakuranbo', display: '🍒', reading: 'さくらんぼ', mora: ['さ', 'く', 'ら', 'ん', 'ぼ'], category: 'food', difficulty: 3, special: ['voiced'] },
  { id: 'remon', display: '🍋', reading: 'れもん', mora: ['れ', 'も', 'ん'], category: 'food', difficulty: 2 },
  { id: 'aisu', display: '🍦', reading: 'あいす', mora: ['あ', 'い', 'す'], category: 'food', difficulty: 2 },
  { id: 'purin', display: '🍮', reading: 'ぷりん', mora: ['ぷ', 'り', 'ん'], category: 'food', difficulty: 2, special: ['semivoiced'] },
  { id: 'gohan', display: '🍚', reading: 'ごはん', mora: ['ご', 'は', 'ん'], category: 'food', difficulty: 2, special: ['voiced'] },
  { id: 'onigiri', display: '🍙', reading: 'おにぎり', mora: ['お', 'に', 'ぎ', 'り'], category: 'food', difficulty: 3, special: ['voiced'] },
  { id: 'sushi', display: '🍣', reading: 'すし', mora: ['す', 'し'], category: 'food', difficulty: 1 },
  { id: 'ramen', display: '🍜', reading: 'らーめん', mora: ['ら', 'ー', 'め', 'ん'], category: 'food', difficulty: 3, special: ['choon'] },
  { id: 'karee', display: '🍛', reading: 'かれー', mora: ['か', 'れ', 'ー'], category: 'food', difficulty: 2, special: ['choon'] },
  { id: 'chiizu', display: '🧀', reading: 'ちーず', mora: ['ち', 'ー', 'ず'], category: 'food', difficulty: 2, special: ['choon', 'voiced'] },
  { id: 'piza', display: '🍕', reading: 'ぴざ', mora: ['ぴ', 'ざ'], category: 'food', difficulty: 1, special: ['semivoiced', 'voiced'] },
  { id: 'dango', display: '🍡', reading: 'だんご', mora: ['だ', 'ん', 'ご'], category: 'food', difficulty: 2, special: ['voiced'] },
  { id: 'gyouza', display: '🥟', reading: 'ぎょうざ', mora: ['ぎょ', 'う', 'ざ'], category: 'food', difficulty: 3, special: ['voiced', 'youon'] },
  { id: 'oden', display: '🍢', reading: 'おでん', mora: ['お', 'で', 'ん'], category: 'food', difficulty: 2, special: ['voiced'] },
  { id: 'mame', display: '🫘', reading: 'まめ', mora: ['ま', 'め'], category: 'food', difficulty: 1 },
  { id: 'edamame', display: '🫛', reading: 'えだまめ', mora: ['え', 'だ', 'ま', 'め'], category: 'food', difficulty: 3, special: ['voiced'] },
  { id: 'hachimitsu', display: '🍯', reading: 'はちみつ', mora: ['は', 'ち', 'み', 'つ'], category: 'food', difficulty: 3 },
  { id: 'croissant', display: '🥐', reading: 'くろわっさん', mora: ['く', 'ろ', 'わ', 'っ', 'さ', 'ん'], category: 'food', difficulty: 3, special: ['sokuon'] },
  { id: 'waffle', display: '🧇', reading: 'わっふる', mora: ['わ', 'っ', 'ふ', 'る'], category: 'food', difficulty: 3, special: ['sokuon'] },
  // しぜん
  { id: 'taiyou', display: '☀️', reading: 'たいよう', mora: ['た', 'い', 'よ', 'う'], category: 'nature', difficulty: 3 },
  { id: 'tatsumaki', display: '🌪️', reading: 'たつまき', mora: ['た', 'つ', 'ま', 'き'], category: 'nature', difficulty: 3 },
  { id: 'kazan', display: '🌋', reading: 'かざん', mora: ['か', 'ざ', 'ん'], category: 'nature', difficulty: 2, special: ['voiced'] },
  { id: 'ishi', display: '🪨', reading: 'いし', mora: ['い', 'し'], category: 'nature', difficulty: 1 },
  { id: 'happa', display: '🍃', reading: 'はっぱ', mora: ['は', 'っ', 'ぱ'], category: 'nature', difficulty: 2, special: ['sokuon', 'semivoiced'] },
  // もの
  { id: 'piano', display: '🎹', reading: 'ぴあの', mora: ['ぴ', 'あ', 'の'], category: 'thing', difficulty: 2, special: ['semivoiced'] },
  { id: 'robot', display: '🤖', reading: 'ろぼっと', mora: ['ろ', 'ぼ', 'っ', 'と'], category: 'thing', difficulty: 3, special: ['voiced', 'sokuon'] },
  { id: 'kaban', display: '🎒', reading: 'かばん', mora: ['か', 'ば', 'ん'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'kutsu', display: '👟', reading: 'くつ', mora: ['く', 'つ'], category: 'thing', difficulty: 1 },
  { id: 'tebukuro', display: '🧤', reading: 'てぶくろ', mora: ['て', 'ぶ', 'く', 'ろ'], category: 'thing', difficulty: 3, special: ['voiced'] },
  { id: 'hasami', display: '✂️', reading: 'はさみ', mora: ['は', 'さ', 'み'], category: 'thing', difficulty: 2 },
  { id: 'enpitsu', display: '✏️', reading: 'えんぴつ', mora: ['え', 'ん', 'ぴ', 'つ'], category: 'thing', difficulty: 3, special: ['semivoiced'] },
  { id: 'terebi', display: '📺', reading: 'てれび', mora: ['て', 'れ', 'び'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'denwa', display: '📱', reading: 'でんわ', mora: ['で', 'ん', 'わ'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'beru', display: '🔔', reading: 'べる', mora: ['べ', 'る'], category: 'thing', difficulty: 1, special: ['voiced'] },
  { id: 'yubiwa', display: '💍', reading: 'ゆびわ', mora: ['ゆ', 'び', 'わ'], category: 'thing', difficulty: 2, special: ['voiced'] },
  { id: 'boru', display: '⚽', reading: 'ぼーる', mora: ['ぼ', 'ー', 'る'], category: 'thing', difficulty: 2, special: ['voiced', 'choon'] },
  { id: 'present', display: '🎁', reading: 'ぷれぜんと', mora: ['ぷ', 'れ', 'ぜ', 'ん', 'と'], category: 'thing', difficulty: 3, special: ['semivoiced', 'voiced'] },
];

// ── 置き換え(substitute-mora)ペア ──
// base の pos番目(0始まり)の 1音を かえると target に なる。両方とも 実在語＝絵で 出せる。
// pos以外の モーラは 同じ・長さも 同じ（テストで保証）。special は 濁音/拗音など とくべつ音の ペア。
export interface SubPair {
  baseId: string;
  targetId: string;
  pos: number;
  special?: boolean;
}
export const SUBSTITUTE_PAIRS: SubPair[] = [
  // あたま(0)を かえる
  { baseId: 'neko', targetId: 'tako', pos: 0 }, // ねこ→たこ
  { baseId: 'kani', targetId: 'wani', pos: 0 }, // かに→わに
  { baseId: 'kame', targetId: 'ame', pos: 0 }, // かめ→あめ
  { baseId: 'hoshi', targetId: 'ushi', pos: 0 }, // ほし→うし
  { baseId: 'nashi', targetId: 'ushi', pos: 0 }, // なし→うし
  // おしり(1)を かえる
  { baseId: 'kani', targetId: 'kame', pos: 1 }, // かに→かめ
  { baseId: 'kani', targetId: 'kasa', pos: 1 }, // かに→かさ
  { baseId: 'umi', targetId: 'ushi', pos: 1 }, // うみ→うし
  { baseId: 'imo', targetId: 'inu', pos: 1 }, // いも→いぬ
  { baseId: 'kuri', targetId: 'kumo', pos: 1 }, // くり→くも
  // とくべつ音(濁音)に かえる
  { baseId: 'kani', targetId: 'kagi', pos: 1, special: true }, // かに→かぎ
  { baseId: 'kasa', targetId: 'kagi', pos: 1, special: true }, // かさ→かぎ
  { baseId: 'hebi', targetId: 'ebi', pos: 0, special: true }, // へび→えび
];

// ── 添加(add-mora)ペア ──
// base に mora を pos('head'|'tail')に たすと reading(実在語)に なる。
// base は 絵で 出せる みじかい語。reading(target)は 音声で 読む。
export interface AddPair {
  baseId: string;
  mora: string;
  pos: 'head' | 'tail';
  reading: string;
}
export const ADD_PAIRS: AddPair[] = [
  { baseId: 'ika', mora: 'す', pos: 'head', reading: 'すいか' }, // いか→すいか
  { baseId: 'tai', mora: 'こ', pos: 'tail', reading: 'たいこ' }, // たい→たいこ
  { baseId: 'ushi', mora: 'ろ', pos: 'tail', reading: 'うしろ' }, // うし→うしろ
  { baseId: 'neko', mora: 'こ', pos: 'head', reading: 'こねこ' }, // ねこ→こねこ
  { baseId: 'inu', mora: 'こ', pos: 'head', reading: 'こいぬ' }, // いぬ→こいぬ
  { baseId: 'ushi', mora: 'こ', pos: 'head', reading: 'こうし' }, // うし→こうし
  { baseId: 'hana', mora: 'び', pos: 'tail', reading: 'はなび' }, // はな→はなび
  { baseId: 'tsuki', mora: 'み', pos: 'tail', reading: 'つきみ' }, // つき→つきみ
];

// ── しりとり チェーン(shiritori-chain)──
// 3語を しりとり順に ならべる。各語の 語尾モーラ＝つぎの語の 語頭モーラ（テストで保証）。
// すべて 実在語＝絵で 出せる。順番は この配列の とおりが 唯一解。
export const SHIRITORI_CHAINS: string[][] = [
  ['neko', 'koma', 'mame'], // ねこ→こま→まめ
  ['suika', 'kame', 'meron'], // すいか→かめ→めろん
  ['hana', 'nashi', 'shimauma'], // はな→なし→しまうま
  ['kasa', 'same', 'megane'], // かさ→さめ→めがね
  ['nashi', 'shika', 'kani'], // なし→しか→かに
  ['ringo', 'gorira', 'lion'], // りんご→ごりら→らいおん
  ['hato', 'tomato', 'tora'], // はと→とまと→とら
  ['ika', 'kani', 'niwatori'], // いか→かに→にわとり
  ['neko', 'koala', 'lion'], // ねこ→こあら→らいおん
  ['taiko', 'koala', 'lion'], // たいこ→こあら→らいおん
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
