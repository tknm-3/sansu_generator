import type { WorldDef } from './types';

// もじギア・ファクトリーの世界（§7・§13）。
// 1〜10 は教材（lineIds が1つ）、11〜13 は腕試し（lineIds が複数）。
// アンロックは配列順の直線。新しい世界は「末尾に追加」する（途中挿入しない）。

export const WORLDS: WorldDef[] = [
  {
    id: 'zoo',
    name: 'どうぶつえん',
    emoji: '🦁',
    friend: 'くまの えんちょう',
    story: 'たいへん！ オリが あかないの。\nどうぶつの ことばで たすけてね！',
    tint: 'from-emerald-100 to-lime-100',
    lineIds: ['count-mora'],
  },
  {
    id: 'sweets',
    name: 'おかしのくに',
    emoji: '🍰',
    friend: 'おかしの コック',
    story: 'おかしを やきたいの。\nさいしょの おとで オーブンを つけて！',
    tint: 'from-pink-100 to-orange-100',
    lineIds: ['first-mora'],
  },
  {
    id: 'space',
    name: 'うちゅう',
    emoji: '🚀',
    friend: 'うちゅうじん',
    story: 'ロケットの ねんりょうは ことば！\nおしりの おとを つなげて はっしゃ！',
    tint: 'from-indigo-200 to-slate-200',
    lineIds: ['last-mora'],
  },
  {
    id: 'sea',
    name: 'うみ',
    emoji: '🌊',
    friend: 'たこ',
    story: 'おなじ おとの さかなを\nあつめて おくれ〜！',
    tint: 'from-sky-100 to-cyan-100',
    lineIds: ['match-sound'],
  },
  {
    id: 'ghost',
    name: 'おばけやしき',
    emoji: '👻',
    friend: 'こわかわ おばけ',
    story: 'もじを ならべて\nおばけの なまえを よんでね〜',
    tint: 'from-purple-200 to-fuchsia-100',
    lineIds: ['build-word'],
  },
  {
    id: 'vehicle',
    name: 'のりもの きち',
    emoji: '🚒',
    friend: 'しょうぼうし',
    story: 'ルールカードを みて\nしゅつどう する ギアを えらんで！',
    tint: 'from-red-100 to-amber-100',
    lineIds: ['rule-card'],
  },
  {
    id: 'garden',
    name: 'ひみつの にわ',
    emoji: '🌸',
    friend: 'ようせい',
    story: 'おとを ひとつ ぬくと\nべつの はなが さくよ',
    tint: 'from-lime-100 to-rose-100',
    lineIds: ['delete-mora'],
  },
  {
    id: 'dino',
    name: 'きょうりゅうの しま',
    emoji: '🦕',
    friend: 'あかちゃん きょうりゅう',
    story: 'NOTくんが きた！\nことばが さかさまに なっちゃう！',
    tint: 'from-green-200 to-teal-100',
    lineIds: ['reverse-word'],
  },
  {
    id: 'circus',
    name: 'サーカス',
    emoji: '🎪',
    friend: 'ピエロ',
    story: 'キラキラの とくべつ ギア！\nだくてんや ちいさい じに ちゅうい',
    tint: 'from-rose-200 to-yellow-100',
    lineIds: ['special-mora'],
  },
  {
    id: 'factory',
    name: 'IF-くん だいこうじょう',
    emoji: '🤖',
    friend: 'みんな',
    story: 'さいごの だいこうじょう！\nぜんぶの ちからで うごかそう！',
    tint: 'from-amber-200 to-yellow-200',
    lineIds: ['if-factory'],
  },
  // ── 11〜13: ボスのあとに ひらく 上級の せかい（腕試し・組み合わせ）──
  {
    id: 'island',
    name: 'なぞなぞ アイランド',
    emoji: '🏝️',
    friend: 'なぞなぞマスター',
    story: 'たからの なぞなぞ！\nいろんな もんだいを といてね',
    tint: 'from-yellow-100 to-sky-100',
    lineIds: ['count-mora', 'first-mora', 'last-mora', 'match-sound'],
  },
  {
    id: 'amusement',
    name: 'ことばの ゆうえんち',
    emoji: '🎡',
    friend: 'あんない係ロボ',
    story: 'アトラクションごとに\nちがう ギアの おしごと！',
    tint: 'from-fuchsia-100 to-cyan-100',
    lineIds: ['match-sound', 'build-word', 'delete-mora'],
  },
  {
    id: 'tower',
    name: 'さかさま タワー',
    emoji: '🌌',
    friend: 'なかよし NOTくん',
    story: 'のぼるほど さかさま！\nいちばん むずかしい たびだよ',
    tint: 'from-violet-300 to-indigo-200',
    lineIds: ['reverse-word', 'special-mora', 'rule-card'],
    difficulty: { special: true },
  },
];

export function getWorld(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.id === id);
}
