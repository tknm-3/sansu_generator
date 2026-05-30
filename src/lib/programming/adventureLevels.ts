/**
 * 「ぼうけんしよう」特別モードの 問題集データ。
 * 1問目から じゅんばんに むずかしくなる 約30問を、テーマごとの ゾーンに わけている。
 *
 * 設計ルール（adventure.test.ts で 自動検証）:
 *  - すべての問題で maxSlots >= optimal（やじるしの かずが たりない事故を ふせぐ）
 *  - chase ゾンビは つかわない（solve() で 解けることを 必ず 確認できるように）
 *  - optimal は solve() が かえす 最短手数と 一致（ぴったり賞が とれる）
 *
 * 問題を ふやすときは ADVENTURE_QUEST の うしろに たすだけ。
 * 新ゾーンなら ADVENTURE_ZONES にも 1件 たす（「さいご」を コードで 特別扱いしない）。
 */
import type { Dir, Level, Pos } from './engine';

const r = (row: number, col: number): Pos => ({ r: row, c: col });

/** マップに ならぶ ゾーン（テーマ）の メタ情報 */
export interface AdventureZone {
  id: string;
  /** こども向けの ゾーン名 */
  name: string;
  emoji: string;
  /** マップ背景の グラデーション（Tailwind クラス） */
  bg: string;
  /** ゾーンカードの アクセント色（Tailwind クラス） */
  accent: string;
  /** 次のゾーン予告などに つかう ひとこと */
  tagline: string;
  /** ゾーンに はいったとき みせる みじかい ものがたり（ぜんぶ ひらがな・2〜3行）*/
  story: string;
  /** ── 盤面の みため（ゾーンの せかいかんに あわせる）── */
  /** かべの 絵文字（森なら 木、さばくなら サボテン…） */
  wall: string;
  /** かべの よびな（分岐ヒントで つかう。くもの てんごくなら「くも」。なければ「かべ」） */
  wallName?: string;
  /** ふつうの マスの 色（Tailwind） */
  tile: string;
  /** かべマスの 色（Tailwind） */
  wallTile: string;
  /** 盤面ぜんたいの 背景（Tailwind） */
  board: string;
}

/** 冒険モードの 分岐（もしも）問題 の 穴埋め設定 */
export interface AdventureBranchFill {
  loopTimes: number;
  /** 正解の センサーむき */
  sensor: Dir;
  /** 正解の thenむき */
  thenDir: Dir;
  /** 正解の elseむき */
  elseDir: Dir;
  /** true = こどもが うめる あな（省略すると true あつかい） */
  holeSensor?: boolean;
  holeThen?: boolean;
  holeElse?: boolean;
}

/** 問題集の 1問。Level に ゾーン所属と 検証用の解を そえたもの */
export interface AdventureQuest extends Level {
  zoneId: string;
  /** 検証・ヒント用の 解の一例（なければ solve() で 検証する） */
  solution?: Dir[];
  /** 分岐（もしも）問題の とき 'branch'。なければ 通常の 矢印ならべ */
  kind?: 'branch';
  /** kind==='branch' のときの 穴埋め設定 */
  branchFill?: AdventureBranchFill;
}

export const ADVENTURE_ZONES: AdventureZone[] = [
  {
    id: 'forest',
    name: 'はじまりの もり',
    emoji: '🌳',
    bg: 'from-emerald-100 to-teal-50',
    accent: 'emerald',
    tagline: 'やじるしを ならべて みちを つくろう',
    story: 'ふるい たからの ちずを みつけた！\nやじるしを ならべて、はじまりの もりへ しゅっぱつだ。',
    wall: '🌳', tile: 'bg-emerald-50', wallTile: 'bg-emerald-200', board: 'bg-emerald-200/70',
  },
  {
    id: 'valley',
    name: 'くりかえしの たに',
    emoji: '🔁',
    bg: 'from-violet-100 to-fuchsia-50',
    accent: 'violet',
    tagline: 'おなじ うごきは ループ箱が べんり！',
    story: 'おなじ みちが ずーっと つづく たに。\n「くりかえし」の まほうを つかって すすもう。',
    wall: '🪨', tile: 'bg-violet-50', wallTile: 'bg-violet-200', board: 'bg-violet-200/70',
  },
  {
    id: 'desert',
    name: 'せつやくの さばく',
    emoji: '🧭',
    bg: 'from-amber-100 to-orange-50',
    accent: 'amber',
    tagline: 'やじるしの かずが かぎられているよ',
    story: 'あつい さばくは みずが だいじ。\nやじるしを むだに しないで、いちばん みじかい みちを さがそう。',
    wall: '🌵', tile: 'bg-amber-50', wallTile: 'bg-amber-200', board: 'bg-amber-200/70',
  },
  {
    id: 'zombie',
    name: 'ゾンビの たに',
    emoji: '🧟',
    bg: 'from-lime-100 to-green-50',
    accent: 'lime',
    tagline: 'ゾンビを よけて すすもう',
    story: 'よるの たには ゾンビが うろうろ…\nぶつからないように そっと よけて、たからを あつめよう。',
    wall: '🪦', tile: 'bg-lime-50', wallTile: 'bg-lime-300', board: 'bg-lime-300/70',
  },
  {
    id: 'castle',
    name: 'まほうの しろ',
    emoji: '🏰',
    bg: 'from-sky-100 to-indigo-50',
    accent: 'indigo',
    tagline: 'いままでの ちからを ぜんぶ つかおう！',
    story: 'ついに さいごの まほうの しろ。\nいままで おぼえた ちからを ぜんぶ つかって、おおきな たからを てに いれよう！',
    wall: '🧱', tile: 'bg-slate-100', wallTile: 'bg-slate-400', board: 'bg-slate-300/70',
  },
  {
    id: 'donguri',
    name: 'どんぐりの くに',
    emoji: '🌰',
    bg: 'from-orange-100 to-yellow-50',
    accent: 'orange',
    tagline: 'どんぐりを ひろって りすに わたそう',
    story: 'もりの りすが どんぐりを なくして こまっている。\nどんぐりを ひろって、りすの ところまで とどけよう！',
    wall: '🌲', tile: 'bg-orange-50', wallTile: 'bg-orange-200', board: 'bg-orange-200/70',
  },
  {
    id: 'kumo',
    name: 'くもの てんごく',
    emoji: '☁️',
    bg: 'from-sky-100 to-cyan-50',
    accent: 'sky',
    tagline: 'もしも くもが あったら…どっちに すすむ？',
    story: 'そらに うかぶ くもが かべに なっているよ。\n「もしも くもが あったら…」の ルールで かしこく すすもう！',
    wall: '☁️', wallName: 'くも', tile: 'bg-sky-50', wallTile: 'bg-sky-200', board: 'bg-sky-200/70',
  },
];

const GEM = '🎁';
const HOME = '🏠';
const ACORN = '🌰';
const SQUIRREL = '🐿️';

/**
 * 問題集の 本体。配列の じゅんばん = 出題じゅんばん。
 * optimal は solve() の 実測値に あわせてある（adventure.test.ts で 検証）。
 */
export const ADVENTURE_QUEST: AdventureQuest[] = [
  // ───────── 🌳 はじまりの もり（1〜6）かべ・ながい みち。ループなし ─────────
  {
    id: 'adv-q01', zoneId: 'forest', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [], optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'みぎと したで おうちへ いこう',
  },
  {
    id: 'adv-q02', zoneId: 'forest', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(1, 1), r(2, 2)], optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'かべを よけながら すすもう',
  },
  {
    id: 'adv-q03', zoneId: 'forest', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(1, 2), r(2, 1)], optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'みぎうえの おうちまで はこぼう',
  },
  {
    id: 'adv-q04', zoneId: 'forest', rows: 5, cols: 4, start: r(0, 0), goal: r(4, 3),
    walls: [r(1, 1), r(3, 2)], optimal: 7, maxSlots: 12, goalEmoji: HOME,
    prompt: 'すこし ながい みち。かべに ちゅうい',
  },
  {
    id: 'adv-q05', zoneId: 'forest', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 1), r(2, 2), r(2, 3)], optimal: 8, maxSlots: 12, goalEmoji: HOME,
    prompt: 'かべの きれめを とおって いこう',
  },
  {
    id: 'adv-q06', zoneId: 'forest', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(1, 1), r(1, 2), r(1, 3), r(3, 2), r(3, 3), r(3, 4), r(4, 4)],
    optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: '🌳もりの おくの ボス！ ながい みちを すすもう',
  },

  // ───────── 🔁 くりかえしの たに（7〜12）ループ箱だけで とく（loopOnly）─────────
  // この たには ふつうの 1マス矢印を つかわず、ループ箱（くりかえし）だけで すすむ。
  // 「おなじ うごきは まとめる」を しっかり 体験させる ねらい。
  {
    id: 'adv-q07', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 0),
    walls: [], optimal: 4, maxSlots: 10, allowLoop: true, loopOnly: true, goalEmoji: HOME,
    prompt: 'した を 4かい。🔁ループ箱だけで すすもう',
  },
  {
    id: 'adv-q08', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(0, 4),
    walls: [], optimal: 4, maxSlots: 10, allowLoop: true, loopOnly: true, goalEmoji: HOME,
    prompt: 'みぎへ まっすぐ。🔁ループ箱だけで いこう',
  },
  {
    id: 'adv-q09', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: HOME,
    prompt: 'した4かい と みぎ4かい。🔁ループ2こで いけるね',
  },
  {
    id: 'adv-q10', zoneId: 'valley', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: HOME,
    prompt: 'うえ と みぎを 🔁ループで くりかえそう',
  },
  {
    id: 'adv-q11', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(4, 0)], gemEmoji: GEM, optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: HOME,
    prompt: 'したの たからばこ🎁を とってから おうちへ（🔁だけ）',
  },
  {
    id: 'adv-q12', zoneId: 'valley', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [], gems: [r(5, 0)], gemEmoji: GEM, optimal: 10, maxSlots: 14, allowLoop: true, loopOnly: true, goalEmoji: HOME,
    prompt: '🔁たにの ボス！ したの たからばこ🎁を とってから おうちへ（🔁だけ）',
  },

  // ───────── 🧭 せつやくの さばく（13〜18）やじるしの かず ぴったり ─────────
  {
    id: 'adv-q13', zoneId: 'desert', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [], optimal: 6, maxSlots: 6, allowLoop: true, goalEmoji: HOME,
    prompt: 'やじるしは 6こだけ。むだなく すすもう',
  },
  {
    id: 'adv-q14', zoneId: 'desert', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(1, 1), r(2, 2)], optimal: 6, maxSlots: 6, allowLoop: true, goalEmoji: HOME,
    prompt: 'かべを よけて ぴったり 6こで いこう',
  },
  {
    id: 'adv-q15', zoneId: 'desert', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], optimal: 8, maxSlots: 8, allowLoop: true, goalEmoji: HOME,
    prompt: 'いちばん みじかい みちは どれかな？',
  },
  {
    id: 'adv-q16', zoneId: 'desert', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(2, 2)], gemEmoji: GEM, optimal: 8, maxSlots: 8, allowLoop: true, goalEmoji: HOME,
    prompt: 'まんなかの たからばこ🎁を とおって ぴったりで',
  },
  {
    id: 'adv-q17', zoneId: 'desert', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(2, 2)], optimal: 8, maxSlots: 8, allowLoop: true, goalEmoji: HOME,
    prompt: 'まんなかの かべを よけて みじかく',
  },
  {
    id: 'adv-q18', zoneId: 'desert', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(2, 2), r(3, 3)], optimal: 10, maxSlots: 10, allowLoop: true, goalEmoji: HOME,
    prompt: '🧭さばくの ボス！ おおきな さばくを ぴったり 10こで わたろう',
  },

  // ───────── 🧟 ゾンビの たに（19〜24）ゾンビ回避 ─────────
  {
    id: 'adv-q19', zoneId: 'zombie', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(1, 1), r(2, 2)], gems: [r(0, 3)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(2, 3) }],
    optimal: 12, maxSlots: 14, goalEmoji: HOME,
    prompt: 'ゾンビ🧟を さけて たからばこを とろう',
  },
  {
    id: 'adv-q20', zoneId: 'zombie', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [], gems: [r(1, 1)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(1, 3) }, { kind: 'fixed', pos: r(3, 2) }],
    optimal: 6, maxSlots: 14, goalEmoji: HOME,
    prompt: 'ゾンビが 2ひき。みちを よく みよう',
  },
  {
    id: 'adv-q21', zoneId: 'zombie', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 1), r(2, 3)], gems: [r(2, 2)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(0, 4) }, { kind: 'fixed', pos: r(4, 0) }],
    optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'まんなかの たからばこ🎁を めざそう',
  },
  {
    id: 'adv-q22', zoneId: 'zombie', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 0), r(2, 4)], gems: [r(0, 4)], gemEmoji: GEM,
    zombies: [{ kind: 'patrol', pos: r(2, 2), path: [r(2, 3), r(2, 2), r(2, 1)] }],
    optimal: 12, maxSlots: 16, allowLoop: true, goalEmoji: HOME,
    prompt: 'ゾンビが おうふく！ タイミングを みよう',
  },
  {
    id: 'adv-q23', zoneId: 'zombie', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], zombies: [{ kind: 'patrol', pos: r(2, 2), path: [r(2, 1)] }],
    optimal: 8, maxSlots: 14, allowLoop: true, goalEmoji: HOME,
    prompt: 'よこに うごく ゾンビを やりすごそう',
  },
  {
    id: 'adv-q24', zoneId: 'zombie', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [], gems: [r(2, 2)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(1, 1) }, { kind: 'fixed', pos: r(3, 3) }, { kind: 'fixed', pos: r(4, 4) }],
    optimal: 10, maxSlots: 18, goalEmoji: HOME,
    prompt: '🧟たにの ボス！ ゾンビだらけ。たからばこを とって みぎうえの おうちへ',
  },

  // ───────── 🏰 まほうの しろ（25〜30）ふくごう・そうしあげ ─────────
  {
    id: 'adv-q25', zoneId: 'castle', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(3, 3)], gems: [r(0, 4)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(2, 2) }],
    optimal: 8, maxSlots: 14, allowLoop: true, goalEmoji: HOME,
    prompt: 'かべと ゾンビを よけて たからばこを とろう',
  },
  {
    id: 'adv-q26', zoneId: 'castle', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(4, 0)], gemEmoji: GEM,
    zombies: [{ kind: 'patrol', pos: r(2, 2), path: [r(2, 3), r(2, 2), r(2, 1)] }],
    optimal: 8, maxSlots: 14, allowLoop: true, goalEmoji: HOME,
    prompt: 'うごく ゾンビを みながら たからばこへ',
  },
  {
    id: 'adv-q27', zoneId: 'castle', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(2, 2)], gems: [r(4, 4)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(1, 2) }, { kind: 'fixed', pos: r(3, 2) }],
    optimal: 8, maxSlots: 16, allowLoop: true, goalEmoji: HOME,
    prompt: 'たからばこ🎁を とってから みぎうえへ',
  },
  {
    id: 'adv-q28', zoneId: 'castle', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(3, 3)], gems: [r(2, 2)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(0, 4) }, { kind: 'fixed', pos: r(4, 0) }],
    optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: HOME,
    prompt: 'まんなかの たからばこを とって ぴったりで',
  },
  {
    id: 'adv-q29', zoneId: 'castle', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(2, 0), r(2, 4)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(2, 2) }],
    optimal: 10, maxSlots: 16, allowLoop: true, goalEmoji: HOME,
    prompt: 'たからばこ2つを とって おうちへ',
  },
  {
    id: 'adv-q30', zoneId: 'castle', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [], gems: [r(0, 5), r(5, 0)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(2, 2) }, { kind: 'fixed', pos: r(3, 3) }],
    optimal: 20, maxSlots: 30, allowLoop: true, goalEmoji: HOME,
    prompt: '👑さいごの ぼうけん！ たからばこ2つを ぜんぶ とって おうちへ',
  },

  // ─── どんぐりの くに（adv-q31〜adv-q36）───
  // どんぐり(🌰)を ひろって りす(🐿️)に とどける。かべ(🌲)を よけながら みちを さがそう。
  {
    id: 'adv-q31', zoneId: 'donguri', rows: 4, cols: 4, start: r(2, 0), goal: r(0, 3),
    walls: [r(1, 1)],
    gems: [r(3, 3)], gemEmoji: ACORN, goalEmoji: SQUIRREL,
    optimal: 7, maxSlots: 14,
    prompt: 'どんぐりを ひろって りすに わたそう！',
  },
  {
    id: 'adv-q32', zoneId: 'donguri', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 2),
    walls: [r(1, 2), r(2, 0)],
    gems: [r(0, 3)], gemEmoji: ACORN, goalEmoji: SQUIRREL,
    optimal: 7, maxSlots: 14,
    prompt: 'かべを よけながら どんぐりを とりに いこう',
  },
  {
    id: 'adv-q33', zoneId: 'donguri', rows: 4, cols: 4, start: r(3, 3), goal: r(0, 1),
    walls: [r(2, 2), r(1, 3)],
    gems: [r(3, 0)], gemEmoji: ACORN, goalEmoji: SQUIRREL,
    optimal: 7, maxSlots: 14,
    prompt: 'はじから はじへ！ どんぐりを とってから りすのところへ',
  },
  {
    id: 'adv-q34', zoneId: 'donguri', rows: 5, cols: 5, start: r(2, 0), goal: r(2, 4),
    walls: [r(0, 2), r(1, 3), r(3, 1), r(4, 2)],
    gems: [r(0, 4)], gemEmoji: ACORN, goalEmoji: SQUIRREL,
    optimal: 8, maxSlots: 16,
    prompt: 'うえの どんぐりを とって みぎの りすに とどけよう',
  },
  {
    id: 'adv-q35', zoneId: 'donguri', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 3),
    walls: [r(1, 1), r(2, 3), r(3, 0)],
    gems: [r(4, 0), r(1, 4)], gemEmoji: ACORN, goalEmoji: SQUIRREL,
    optimal: 15, maxSlots: 18, allowLoop: true,
    prompt: 'どんぐりが2つ！ ぜんぶ ひろって りすに わたそう',
  },
  {
    id: 'adv-q36', zoneId: 'donguri', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(1, 2), r(2, 4), r(3, 1), r(4, 3)],
    gems: [r(5, 4), r(2, 1)], gemEmoji: ACORN, goalEmoji: SQUIRREL,
    optimal: 16, maxSlots: 22, allowLoop: true,
    prompt: '🌰🌰2つの どんぐりを あつめて りすに とどける ラストステージ！',
  },

  // ─── くもの てんごく（adv-q37〜adv-q42）───
  // ☁️が かべ。「もしも ☁️が あったら…」の ルールを 穴埋めで えらんで ゴールへ。
  // ステージごとに 正解の むきが かわる（おなじ こたえの 丸おぼえでは 解けない）。
  // 穴の かず: 1 → 1 → 1 → 2 → 2 → 3（全穴・ボス）と だんだん ふえる。
  // 盤面は すべて「正解 1とおりだけ クリア・最短一致」を adventure.test.ts で検証ずみ。
  {
    id: 'adv-q37', zoneId: 'kumo', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 2)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { loopTimes: 6, sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true },
    optimal: 6, maxSlots: 6,
    prompt: 'どっちを しらべる？「もし [？] が ☁️ なら ↓、ちがえば →」',
  },
  {
    id: 'adv-q38', zoneId: 'kumo', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(2, 0)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { loopTimes: 6, sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true },
    optimal: 6, maxSlots: 6,
    prompt: '☁️に あたったら どっちへ？「もし ↓ が ☁️ なら [？]、ちがえば ↓」',
  },
  {
    id: 'adv-q39', zoneId: 'kumo', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 0),
    walls: [r(0, 1)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { loopTimes: 6, sensor: 'left', thenDir: 'down', elseDir: 'left', holeElse: true },
    optimal: 6, maxSlots: 6,
    prompt: '☁️が ないとき どっちへ？「もし ← が ☁️ なら ↓、ちがえば [？]」',
  },
  {
    id: 'adv-q40', zoneId: 'kumo', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(3, 0)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { loopTimes: 8, sensor: 'up', thenDir: 'right', elseDir: 'up', holeSensor: true, holeThen: true },
    optimal: 8, maxSlots: 8,
    prompt: 'うえへ のぼろう！「もし [？] が ☁️ なら [？]、ちがえば ↑」',
  },
  {
    id: 'adv-q41', zoneId: 'kumo', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 2)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { loopTimes: 8, sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true, holeElse: true },
    optimal: 8, maxSlots: 8,
    prompt: '☁️のとき と そうでないとき！「もし → が ☁️ なら [？]、ちがえば [？]」',
  },
  {
    id: 'adv-q42', zoneId: 'kumo', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 1), r(2, 4)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { loopTimes: 8, sensor: 'down', thenDir: 'right', elseDir: 'down', holeSensor: true, holeThen: true, holeElse: true },
    optimal: 8, maxSlots: 8,
    prompt: '☁️を ぜんぶ うめてゴール！「もし [？] が ☁️ なら [？]、ちがえば [？]」',
  },
];

/** ゾーン定義を id で ひく */
export function getZone(zoneId: string): AdventureZone {
  return ADVENTURE_ZONES.find((z) => z.id === zoneId) ?? ADVENTURE_ZONES[0];
}

/** そのゾーンに ぞくする 問題（出題じゅん） */
export function questsInZone(zoneId: string): AdventureQuest[] {
  return ADVENTURE_QUEST.filter((q) => q.zoneId === zoneId);
}

export type { Dir, Level };
