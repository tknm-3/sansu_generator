/**
 * 「ぼうけんしよう」特別モードの 問題集データ。
 * 1問目から じゅんばんに むずかしくなる 問題を、テーマごとの ゾーン（1ゾーン=6問）に わけている。
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
import type { BranchCommand } from './branch';
import type { RelCommand } from './relativeEngine';

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

/**
 * 分岐（もしも）1ルールの 穴埋め設定。
 * imi:「<sensor> に すすめなかったら <thenDir>、すすめたら <elseDir>」。
 * （sensor の むきに かべ／そとが あると thenDir、なければ elseDir へ うごく）
 */
export interface AdventureBranchRule {
  sensor: Dir;
  thenDir: Dir;
  elseDir: Dir;
  /** true = こどもが うめる あな（省略すると false＝さいしょから みえている） */
  holeSensor?: boolean;
  holeThen?: boolean;
  holeElse?: boolean;
}

/**
 * 冒険モードの 分岐（もしも）問題 の 穴埋め設定。
 * 1つ以上の フェーズ（くりかえし×ルール1つ）を じゅんに 実行する。
 * フェーズが 1つなら くもの てんごく、2つなら つきの 冒険（もしを 2つ くみあわせる）。
 */
export interface AdventureBranchFill {
  phases: { loopTimes: number; rule: AdventureBranchRule }[];
}

/** branchFill から 正解の 分岐プログラム（または 穴を さしかえた プログラム）を つくる */
export function buildBranchProgram(
  fill: AdventureBranchFill,
  override?: (phaseIdx: number, rule: AdventureBranchRule) => { sensor: Dir; thenDir: Dir; elseDir: Dir },
): BranchCommand[] {
  return fill.phases.map((ph, i) => {
    const v = override ? override(i, ph.rule) : ph.rule;
    const ifCmd: BranchCommand = {
      kind: 'if',
      cond: { kind: 'wall', dir: v.sensor },
      then: [{ kind: 'move', dir: v.thenDir }],
      else: [{ kind: 'move', dir: v.elseDir }],
    };
    return { kind: 'repeat', times: ph.loopTimes, body: [ifCmd] } as BranchCommand;
  });
}

/** 問題集の 1問。Level に ゾーン所属と 検証用の解を そえたもの */
export interface AdventureQuest extends Level {
  zoneId: string;
  /** 検証・ヒント用の 解の一例（なければ solve() で 検証する） */
  solution?: Dir[];
  /** 問題の しゅるい。'branch'=もしも穴埋め、'relative'=そうたい方向。なければ 矢印ならべ */
  kind?: 'branch' | 'relative';
  /** kind==='branch' のときの 穴埋め設定 */
  branchFill?: AdventureBranchFill;
  /** kind==='relative' の 検証用 解（そうたい方向の 命令れつ。ループも ふくめられる） */
  relSolution?: RelCommand[];
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
    tagline: '☁️に すすめない とき…どっちへ いく？',
    story: 'そらに うかぶ くもが かべに なっているよ。\n「もしも すすめない なら…」の ルールで かしこく すすもう！',
    wall: '☁️', wallName: 'くも', tile: 'bg-sky-50', wallTile: 'bg-sky-200', board: 'bg-sky-200/70',
  },
  {
    id: 'moon',
    name: 'つきの 冒険ゾーン',
    emoji: '🌙',
    bg: 'from-indigo-950 to-slate-900',
    accent: 'indigo',
    tagline: 'もしを 2つ くみあわせて つきへ いこう',
    story: 'うちゅうの くらやみに 🌑いわが うかんでいる。\n「すすめなかったら…」の ルールを くみあわせて、つきを めざそう！',
    wall: '🌑', wallName: 'いわ', tile: 'bg-indigo-950', wallTile: 'bg-slate-700', board: 'bg-slate-800/80',
  },
  {
    id: 'snow',
    name: 'ゆきのゾーン',
    emoji: '❄️',
    bg: 'from-sky-100 to-slate-50',
    accent: 'sky',
    tagline: 'キャラの むきが きじゅん！「みぎ」は どっち？',
    story: 'まっしろな ゆきの くに。\nキャラクターが むいている ほうを きじゅんに、まえへ すすんだり むきを かえたりして てっぺんを めざそう！',
    wall: '❄️', wallName: 'ゆき', tile: 'bg-sky-50', wallTile: 'bg-sky-200', board: 'bg-sky-100/80',
  },
  {
    id: 'tower',
    name: 'うずまきの とう',
    emoji: '🌀',
    bg: 'from-indigo-100 to-purple-50',
    accent: 'indigo',
    tagline: 'おなじ のぼりを くりかえして てっぺんへ！',
    story: 'ぐるぐる まわる ふしぎな とう。\nおなじ うごきを 🔁ループ箱で まとめると、ながい みちも すくない ブロックで のぼれるよ。',
    wall: '🧱', tile: 'bg-indigo-50', wallTile: 'bg-indigo-200', board: 'bg-indigo-200/70',
  },
  {
    id: 'crystal',
    name: 'すいしょうの どうくつ',
    emoji: '💎',
    bg: 'from-purple-100 to-fuchsia-50',
    accent: 'violet',
    tagline: 'まがる 坑道を ループと やじるしで すすもう',
    story: 'きらきら ひかる すいしょうの どうくつ。\nまっすぐは 🔁ループ箱で まとめ、まがりかどは やじるしで。すいしょう💎を ひろって でぐちへ！',
    wall: '🪨', tile: 'bg-purple-50', wallTile: 'bg-purple-300', board: 'bg-purple-200/70',
  },
  {
    id: 'fog',
    name: 'きりの まよいもり',
    emoji: '🌫️',
    bg: 'from-emerald-100 to-slate-100',
    accent: 'emerald',
    tagline: 'さきが みえない… もしの ルールで かしこく',
    story: 'きりで さきが みえない まよいの もり。\n「もしも すすめない なら…」の ルールを 1つ きめれば、どんな みちでも すすめるよ。きのこ🍄を あつめよう！',
    wall: '🌫️', wallName: 'きり', tile: 'bg-emerald-50', wallTile: 'bg-slate-300', board: 'bg-emerald-200/60',
  },
  {
    id: 'sea',
    name: 'かいていの しんでん',
    emoji: '🔱',
    bg: 'from-cyan-100 to-teal-50',
    accent: 'sky',
    tagline: 'むきを かえながら しんでんを すすもう',
    story: 'うみの そこに ねむる ふるい しんでん。\nキャラの むき を きじゅんに「まえ・みぎむき・ひだりむき」で つうろを すすみ、たからを てに いれよう！',
    wall: '🪸', wallName: 'さんご', tile: 'bg-cyan-50', wallTile: 'bg-teal-200', board: 'bg-cyan-200/70',
  },
  {
    id: 'rloop_a',
    name: 'まわれ！ きじちょう',
    emoji: '🔄',
    bg: 'from-lime-100 to-teal-50',
    accent: 'lime',
    tagline: 'ループで めいれいを まとめて らくらく クリア！',
    story: 'くるくると まわる きじちょうに やってきた。\nおなじ めいれいを ループに まとめると\nすくない めいれいで すすめるよ！',
    wall: '🌿', tile: 'bg-lime-50', wallTile: 'bg-lime-200', board: 'bg-lime-100/80',
  },
  {
    id: 'rloop_b',
    name: 'そうたいループ だいみゃく',
    emoji: '🌀',
    bg: 'from-violet-100 to-purple-50',
    accent: 'violet',
    tagline: 'ループの なかに まがりかどを くみこもう！',
    story: 'ぐるぐると つながる だいみゃくへ ようこそ。\nループの なかに「まがる」めいれいを くみこんで\nふくざつな みちも かんたんに あらわそう！',
    wall: '🍃', tile: 'bg-violet-50', wallTile: 'bg-violet-200', board: 'bg-violet-100/80',
  },
];

const GEM = '🎁';
const HOME = '🏠';
const ACORN = '🌰';
const SQUIRREL = '🐿️';
const FUEL = '🛸';
const MOON = '🌙';
const MOUNTAIN = '🏔️';
const SNOWMAN = '☃️';
const CROWN = '👑';
const CRYSTAL = '💎';
const MUSHROOM = '🍄';
const COTTAGE = '🏡';
const SHELL = '🐚';
const TRIDENT = '🔱';

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
  // ☁️が かべ。「<むき> に すすめなかったら…」の ルールを 穴埋めで えらんで ゴールへ。
  // ステージごとに 正解の むきが かわる（おなじ こたえの 丸おぼえでは 解けない）。
  // 穴の かず: 1 → 1 → 1 → 2 → 2 → 3（全穴・ボス）と だんだん ふえる。
  // 盤面は すべて「正解 1とおりだけ クリア・最短一致」を adventure.test.ts で検証ずみ。
  {
    id: 'adv-q37', zoneId: 'kumo', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 2)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'どっちに すすめないか しらべよう「[？] に すすめなかったら ↓、すすめたら →」',
  },
  {
    id: 'adv-q38', zoneId: 'kumo', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(2, 0)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'すすめなかったら どっちへ？「↓ に すすめなかったら [？]、すすめたら ↓」',
  },
  {
    id: 'adv-q39', zoneId: 'kumo', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 0),
    walls: [r(0, 1)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'left', thenDir: 'down', elseDir: 'left', holeElse: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'すすめるとき どっちへ？「← に すすめなかったら ↓、すすめたら [？]」',
  },
  {
    id: 'adv-q40', zoneId: 'kumo', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(3, 0)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'up', thenDir: 'right', elseDir: 'up', holeSensor: true, holeThen: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: 'うえへ のぼろう！「[？] に すすめなかったら [？]、すすめたら ↑」',
  },
  {
    id: 'adv-q41', zoneId: 'kumo', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 2)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true, holeElse: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: 'すすめないとき・すすめるとき！「→ に すすめなかったら [？]、すすめたら [？]」',
  },
  {
    id: 'adv-q42', zoneId: 'kumo', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 1), r(2, 4)], goalEmoji: '⭐',
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeSensor: true, holeThen: true, holeElse: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: 'ぜんぶ うめてゴール！「[？] に すすめなかったら [？]、すすめたら [？]」',
  },

  // ─── 🌙 つきの 冒険ゾーン（adv-q43〜adv-q48）───
  // 🌑が かべ。「<むき>に すすめなかったら…」の ルールを 穴埋め。
  // 後半は ルールを 2つ くみあわせる（2フェーズ）。穴は だんだん ふえる。
  // optimal は フェーズの loopTimes の ごうけい（さいごの 1手で ゴール）。
  {
    id: 'adv-q43', zoneId: 'moon', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 2), r(1, 2)], gemEmoji: FUEL, goalEmoji: MOON,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'みぎに すすめなかったら ↓「[？] に すすめなかったら ↓、すすめたら →」',
  },
  {
    id: 'adv-q44', zoneId: 'moon', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(1, 0), r(1, 1)], gemEmoji: FUEL, goalEmoji: MOON,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'したに すすめなかったら どっちへ？「↓ に すすめなかったら [？]、すすめたら ↓」',
  },
  {
    id: 'adv-q45', zoneId: 'moon', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 2), r(1, 2)], gems: [r(2, 3)], gemEmoji: FUEL, goalEmoji: MOON,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true, holeThen: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: '🛸ねんりょうを とって ゴールへ「[？] に すすめなかったら [？]、すすめたら →」',
  },
  {
    id: 'adv-q46', zoneId: 'moon', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 0), r(1, 1), r(0, 3), r(3, 3), r(4, 3)], gemEmoji: FUEL, goalEmoji: MOON,
    kind: 'branch',
    branchFill: { phases: [
      { loopTimes: 4, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeSensor: true } },
      { loopTimes: 4, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right' } },
    ] },
    optimal: 8, maxSlots: 8,
    prompt: 'もしを 2つ くみあわせよう！まえの ルールの あなを うめてね',
  },
  {
    id: 'adv-q47', zoneId: 'moon', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 0), r(1, 1), r(3, 3), r(4, 3)], gems: [r(0, 2)], gemEmoji: FUEL, goalEmoji: MOON,
    kind: 'branch',
    branchFill: { phases: [
      { loopTimes: 4, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true } },
      { loopTimes: 4, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true } },
    ] },
    optimal: 8, maxSlots: 8,
    prompt: '🛸を とりながら もしを 2つ！2つの あなを うめよう',
  },
  {
    id: 'adv-q48', zoneId: 'moon', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(1, 0), r(1, 1), r(1, 2), r(0, 4), r(4, 4), r(5, 4)], gems: [r(0, 3)], gemEmoji: FUEL, goalEmoji: MOON,
    kind: 'branch',
    branchFill: { phases: [
      { loopTimes: 5, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeSensor: true, holeThen: true } },
      { loopTimes: 5, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true } },
    ] },
    optimal: 10, maxSlots: 10,
    prompt: '🌙つきの ボス！もしを 2つ くみあわせて ねんりょうを とろう',
  },

  // ─── ❄️ ゆきのゾーン（adv-q49〜adv-q54）───
  // そうたい方向（キャラの むき が きじゅん）。まえへ／みぎをむく／ひだりをむく で すすむ。
  // optimal は そうたい命令の かず（まわる も 1手）。relSolution で 検証する。
  {
    id: 'adv-q49', zoneId: 'snow', rows: 4, cols: 1, start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: MOUNTAIN, gemEmoji: SNOWMAN,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward'],
    optimal: 3, maxSlots: 5,
    prompt: 'まえへ すすむと どこへ いく？',
  },
  {
    id: 'adv-q50', zoneId: 'snow', rows: 3, cols: 3, start: r(2, 0), goal: r(0, 1), startFacing: 'up',
    walls: [], goalEmoji: MOUNTAIN, gemEmoji: SNOWMAN,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'turn_right', 'forward'],
    optimal: 4, maxSlots: 6,
    prompt: 'まがりかどで みぎを むいて すすもう',
  },
  {
    id: 'adv-q51', zoneId: 'snow', rows: 3, cols: 4, start: r(0, 0), goal: r(2, 3), startFacing: 'right',
    walls: [], goalEmoji: MOUNTAIN, gemEmoji: SNOWMAN,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'turn_right', 'forward', 'forward'],
    optimal: 6, maxSlots: 8,
    prompt: 'みぎへ すすんでから したへ まがろう',
  },
  {
    id: 'adv-q52', zoneId: 'snow', rows: 4, cols: 4, start: r(1, 1), goal: r(3, 3), startFacing: 'right',
    walls: [r(1, 2)], goalEmoji: MOUNTAIN, gemEmoji: SNOWMAN,
    kind: 'relative',
    relSolution: ['turn_right', 'forward', 'forward', 'turn_left', 'forward', 'forward'],
    optimal: 6, maxSlots: 8,
    prompt: 'まえが ふさがってる！べつの みちで いこう',
  },
  {
    id: 'adv-q53', zoneId: 'snow', rows: 4, cols: 4, start: r(1, 1), goal: r(3, 3), startFacing: 'up',
    walls: [], gems: [r(0, 3)], goalEmoji: MOUNTAIN, gemEmoji: SNOWMAN,
    kind: 'relative',
    relSolution: ['forward', 'turn_right', 'forward', 'forward', 'turn_right', 'forward', 'forward', 'forward'],
    optimal: 8, maxSlots: 10,
    prompt: '☃️ゆきだるまを とってから ゴールへ！',
  },
  {
    id: 'adv-q54', zoneId: 'snow', rows: 4, cols: 5, start: r(3, 0), goal: r(0, 4), startFacing: 'up',
    walls: [r(3, 2)], gems: [r(2, 1)], goalEmoji: MOUNTAIN, gemEmoji: SNOWMAN,
    kind: 'relative',
    relSolution: ['forward', 'turn_right', 'forward', 'forward', 'forward', 'forward', 'turn_left', 'forward', 'forward'],
    optimal: 9, maxSlots: 12,
    prompt: '❄️ボス！☃️ゆきだるまを とって てっぺんの ゴールへ',
  },

  // ─── 🌀 うずまきの とう（adv-q55〜adv-q60）───
  // loopOnly。ながい みちを すくない ループ箱（おなじ むき×2〜5）で のぼる。
  // 「少ないブロックで 長い道」を 体験させる ねらい。optimal は solve() の 実測値。
  {
    id: 'adv-q55', zoneId: 'tower', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: CROWN,
    prompt: 'うえ4かい、みぎ4かい。🔁ループ2こで のぼろう',
  },
  {
    id: 'adv-q56', zoneId: 'tower', rows: 5, cols: 5, start: r(4, 4), goal: r(0, 0),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: CROWN,
    prompt: 'うえ と ひだりを 🔁ループで まとめよう',
  },
  {
    id: 'adv-q57', zoneId: 'tower', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [], optimal: 10, maxSlots: 14, allowLoop: true, loopOnly: true, goalEmoji: CROWN,
    prompt: 'たかい とう！うえ5かい、みぎ5かい（🔁だけ）',
  },
  {
    id: 'adv-q58', zoneId: 'tower', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [], gems: [r(5, 5)], gemEmoji: GEM, optimal: 10, maxSlots: 14, allowLoop: true, loopOnly: true, goalEmoji: CROWN,
    prompt: 'みぎの たからばこ🎁を とってから のぼろう（🔁だけ）',
  },
  {
    id: 'adv-q59', zoneId: 'tower', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 0),
    walls: [], gems: [r(5, 5)], gemEmoji: GEM, optimal: 15, maxSlots: 18, allowLoop: true, loopOnly: true, goalEmoji: CROWN,
    prompt: 'みぎ→うえ→ひだり。3つの ループで ぐるっと のぼろう',
  },
  {
    id: 'adv-q60', zoneId: 'tower', rows: 6, cols: 6, start: r(5, 0), goal: r(5, 5),
    walls: [], gems: [r(0, 0), r(0, 5)], gemEmoji: GEM, optimal: 15, maxSlots: 20, allowLoop: true, loopOnly: true, goalEmoji: CROWN,
    prompt: '🌀とうの ボス！たからばこ2つを とって ぐるっと いっしゅう（🔁だけ）',
  },

  // ─── 💎 すいしょうの どうくつ（adv-q61〜adv-q66）───
  // allowLoop（ループ箱＋ふつうの矢印）。まがる 坑道を かべ(🪨)を よけて すすみ、
  // すいしょう💎を ひろって でぐちへ。optimal は solve() の 実測値。
  {
    id: 'adv-q61', zoneId: 'crystal', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(2, 2), r(3, 3)], gems: [r(0, 4)], gemEmoji: CRYSTAL,
    optimal: 8, maxSlots: 16, allowLoop: true, goalEmoji: HOME,
    prompt: 'すいしょう💎を とってから でぐちへ',
  },
  {
    id: 'adv-q62', zoneId: 'crystal', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(2, 1), r(2, 3)], gems: [r(2, 2)], gemEmoji: CRYSTAL,
    optimal: 8, maxSlots: 14, allowLoop: true, goalEmoji: HOME,
    prompt: 'まんなかの すいしょう💎を とおって',
  },
  {
    id: 'adv-q63', zoneId: 'crystal', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 2), r(1, 2), r(2, 2)], gems: [r(4, 0)], gemEmoji: CRYSTAL,
    optimal: 8, maxSlots: 16, allowLoop: true, goalEmoji: HOME,
    prompt: 'かべを まわって したの すいしょう💎へ',
  },
  {
    id: 'adv-q64', zoneId: 'crystal', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(2, 2), r(2, 3), r(3, 2), r(3, 3)], gems: [r(0, 5)], gemEmoji: CRYSTAL,
    optimal: 10, maxSlots: 18, allowLoop: true, goalEmoji: HOME,
    prompt: 'まんなかの おおきな いわを よけて すすもう',
  },
  {
    id: 'adv-q65', zoneId: 'crystal', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(2, 0), r(2, 1), r(2, 2), r(2, 3)], gems: [r(5, 5)], gemEmoji: CRYSTAL,
    optimal: 10, maxSlots: 18, allowLoop: true, goalEmoji: HOME,
    prompt: 'よこの いわを まわりこんで すいしょう💎へ',
  },
  {
    id: 'adv-q66', zoneId: 'crystal', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(1, 1), r(1, 2), r(3, 3), r(3, 4)], gems: [r(0, 5), r(5, 0)], gemEmoji: CRYSTAL,
    optimal: 20, maxSlots: 26, allowLoop: true, goalEmoji: HOME,
    prompt: '💎どうくつの ボス！すいしょう2つを とって でぐちへ',
  },

  // ─── 🌫️ きりの まよいもり（adv-q67〜adv-q72）───
  // もしも穴埋め（くりかえし×ルール）。きりで さきが みえない＝1つの ルールで どんな
  // かべでも すすめる「もし」の うれしさ。盤面は くも／つきゾーンの 検証ずみ配置を ベースに、
  // きのこ🍄あつめ を くわえた もの。穴の 一意解は adventure.test.ts が 自動検証する。
  {
    id: 'adv-q67', zoneId: 'fog', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 2)], goalEmoji: COTTAGE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'どっちに すすめないか しらべよう「[？] に すすめなかったら ↓、すすめたら →」',
  },
  {
    id: 'adv-q68', zoneId: 'fog', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(2, 0)], goalEmoji: COTTAGE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'すすめなかったら どっちへ？「↓ に すすめなかったら [？]、すすめたら ↓」',
  },
  {
    id: 'adv-q69', zoneId: 'fog', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 2), r(1, 2)], gems: [r(2, 3)], gemEmoji: MUSHROOM, goalEmoji: COTTAGE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true, holeThen: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: '🍄きのこを とって おうちへ「[？] に すすめなかったら [？]、すすめたら →」',
  },
  {
    id: 'adv-q70', zoneId: 'fog', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 0),
    walls: [r(0, 1)], goalEmoji: COTTAGE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'left', thenDir: 'down', elseDir: 'left', holeElse: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'すすめるとき どっちへ？「← に すすめなかったら ↓、すすめたら [？]」',
  },
  {
    id: 'adv-q71', zoneId: 'fog', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 0), r(1, 1), r(3, 3), r(4, 3)], gems: [r(0, 2)], gemEmoji: MUSHROOM, goalEmoji: COTTAGE,
    kind: 'branch',
    branchFill: { phases: [
      { loopTimes: 4, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true } },
      { loopTimes: 4, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true } },
    ] },
    optimal: 8, maxSlots: 8,
    prompt: '🍄を とりながら もしを 2つ！2つの あなを うめよう',
  },
  {
    id: 'adv-q72', zoneId: 'fog', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(1, 0), r(1, 1), r(1, 2), r(0, 4), r(4, 4), r(5, 4)], gems: [r(0, 3)], gemEmoji: MUSHROOM, goalEmoji: COTTAGE,
    kind: 'branch',
    branchFill: { phases: [
      { loopTimes: 5, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeSensor: true, holeThen: true } },
      { loopTimes: 5, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true } },
    ] },
    optimal: 10, maxSlots: 10,
    prompt: '🌫️もりの ボス！もしを 2つ くみあわせて きのこを とろう',
  },

  // ─── 🔱 かいていの しんでん（adv-q73〜adv-q78）───
  // そうたい方向（キャラの むき が きじゅん）＋ かべ(🪸)＋ たからあつめ。ゆきゾーンの 一歩先。
  // relSolution は solveRelative() の 最短解、optimal は その手数（adventure.test.ts で検証）。
  {
    id: 'adv-q73', zoneId: 'sea', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: TRIDENT, gemEmoji: SHELL,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward'],
    optimal: 3, maxSlots: 6,
    prompt: 'まえへ すすんで しんでんを のぼろう',
  },
  {
    id: 'adv-q74', zoneId: 'sea', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [], goalEmoji: TRIDENT, gemEmoji: SHELL,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'turn_right', 'forward', 'forward', 'forward'],
    optimal: 7, maxSlots: 9,
    prompt: 'うえまで いったら みぎを むいて すすもう',
  },
  {
    id: 'adv-q75', zoneId: 'sea', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [r(2, 2)], goalEmoji: TRIDENT, gemEmoji: SHELL,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'forward', 'turn_right', 'forward', 'forward', 'forward', 'forward'],
    optimal: 9, maxSlots: 12,
    prompt: 'さんご🪸を よけて てっぺんへ',
  },
  {
    id: 'adv-q76', zoneId: 'sea', rows: 5, cols: 5, start: r(4, 1), goal: r(0, 3), startFacing: 'up',
    walls: [r(2, 2)], gems: [r(2, 1)], goalEmoji: TRIDENT, gemEmoji: SHELL,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'forward', 'turn_right', 'forward', 'forward'],
    optimal: 7, maxSlots: 12,
    prompt: '🐚かいがらを とってから しんでんへ',
  },
  {
    id: 'adv-q77', zoneId: 'sea', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4), startFacing: 'right',
    walls: [r(1, 2), r(2, 2)], gems: [r(4, 4)], goalEmoji: TRIDENT, gemEmoji: SHELL,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'forward', 'turn_left', 'forward', 'forward', 'forward', 'forward'],
    optimal: 9, maxSlots: 14,
    prompt: '🐚を とって さんごを まわりこもう',
  },
  {
    id: 'adv-q78', zoneId: 'sea', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5), startFacing: 'up',
    walls: [r(3, 3)], gems: [r(0, 0), r(0, 3)], goalEmoji: TRIDENT, gemEmoji: SHELL,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'forward', 'forward', 'turn_right', 'forward', 'forward', 'forward', 'forward', 'forward'],
    optimal: 11, maxSlots: 20,
    prompt: '🔱しんでんの ボス！かいがら2つを とって たからへ',
  },

  // ─── 🔄 まわれ！ きじちょう（adv-q79〜adv-q84）そうたい × ループ 入門 ───
  {
    id: 'adv-q79', zoneId: 'rloop_a', rows: 4, cols: 1,
    start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: ['forward'] }],
    optimal: 1, maxSlots: 2,
    prompt: 'おなじ めいれいを ループに まとめよう！',
  },
  {
    id: 'adv-q80', zoneId: 'rloop_a', rows: 1, cols: 5,
    start: r(0, 0), goal: r(0, 4), startFacing: 'right',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 4, body: ['forward'] }],
    optimal: 1, maxSlots: 2,
    prompt: 'よこに すすむ ループを つかおう',
  },
  {
    id: 'adv-q81', zoneId: 'rloop_a', rows: 4, cols: 4,
    start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 3, body: ['forward'] },
    ],
    optimal: 3, maxSlots: 4,
    prompt: 'のぼって まがって また すすもう',
  },
  {
    id: 'adv-q82', zoneId: 'rloop_a', rows: 4, cols: 4,
    start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [], gems: [r(0, 0)], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 3, body: ['forward'] },
    ],
    optimal: 3, maxSlots: 4,
    prompt: '⭐を とおりながら ゴールへ！',
  },
  {
    id: 'adv-q83', zoneId: 'rloop_a', rows: 4, cols: 4,
    start: r(3, 1), goal: r(3, 3), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 2, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 2, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 5, maxSlots: 6,
    prompt: 'コの字に まわって ゴール！',
  },
  {
    id: 'adv-q84', zoneId: 'rloop_a', rows: 6, cols: 6,
    start: r(5, 0), goal: r(0, 5), startFacing: 'up',
    walls: [], gems: [r(2, 0)], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 5, body: ['forward'] },
      'turn_left',
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 5, maxSlots: 6,
    prompt: 'Z字に すすんで ⭐も ひろおう！',
  },

  // ─── 🌀 そうたいループ だいみゃく（adv-q85〜adv-q90）ループ本体に まがりかど ───
  {
    id: 'adv-q85', zoneId: 'rloop_b', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 3), startFacing: 'right',
    walls: [], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: ['forward', 'turn_right', 'forward', 'turn_left'] }],
    optimal: 1, maxSlots: 2,
    prompt: 'かいだんのように すすむ ループを つくろう！',
  },
  {
    id: 'adv-q86', zoneId: 'rloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(4, 4), startFacing: 'right',
    walls: [], gems: [r(2, 2)], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 4, body: ['forward', 'turn_right', 'forward', 'turn_left'] }],
    optimal: 1, maxSlots: 2,
    prompt: '💫を ひろいながら かいだんを すすもう',
  },
  {
    id: 'adv-q87', zoneId: 'rloop_b', rows: 4, cols: 7,
    start: r(0, 0), goal: r(3, 6), startFacing: 'right',
    walls: [], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: ['forward', 'forward', 'turn_right', 'forward', 'turn_left'] }],
    optimal: 1, maxSlots: 2,
    prompt: 'ジグザグに すすむ みちを ループで あらわそう',
  },
  {
    id: 'adv-q88', zoneId: 'rloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(4, 4), startFacing: 'down',
    walls: [], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 2, body: ['forward', 'forward', 'turn_left', 'forward', 'forward', 'turn_right'] }],
    optimal: 1, maxSlots: 2,
    prompt: 'L字を くりかえして ゴールへ！',
  },
  {
    id: 'adv-q89', zoneId: 'rloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(2, 4), startFacing: 'right',
    walls: [], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 2, body: ['forward', 'turn_right', 'forward', 'turn_left'] },
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 2, maxSlots: 3,
    prompt: '2つの ループを くみあわせよう',
  },
  {
    id: 'adv-q90', zoneId: 'rloop_b', rows: 6, cols: 6,
    start: r(5, 0), goal: r(0, 5), startFacing: 'up',
    walls: [], gems: [r(3, 2)], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward', 'turn_right', 'forward', 'turn_left'] },
      { kind: 'loop', times: 2, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 4, maxSlots: 5,
    prompt: 'かいだん＋まっすぐで ゴールへ！ 💫も わすれずに',
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
