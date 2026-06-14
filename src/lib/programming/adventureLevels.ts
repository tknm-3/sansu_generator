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
import type { ProcMainCmd } from './procEngine';

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
  /** 問題の しゅるい。'branch'=もしも穴埋め、'relative'=そうたい方向、'proc'=てじゅん。なければ 矢印ならべ */
  kind?: 'branch' | 'relative' | 'proc';
  /** kind==='branch' のときの 穴埋め設定 */
  branchFill?: AdventureBranchFill;
  /** kind==='relative' の 検証用 解（そうたい方向の 命令れつ。ループも ふくめられる） */
  relSolution?: RelCommand[];
  /**
   * kind==='relative' の 足場プリフィル（チュートリアル用の 穴埋め）。
   * 最初から おいてある（こどもは けせない）ループ箱・矢印で、のこりを 少し たすだけにする。
   * - `cmds`: 先頭に おく ロック済み トップレベル命令（完成した ループ箱や まがる）。
   * - `openLoop`: relSolution の さいごの ループ箱を「ひらいた まま」で おいておく。
   *   `times` は 固定、`body` の さいしょの ぶんは ロック。こどもは のこりの なかみを たして
   *   「かんりょう」する。`relPrefillIsPrefix` テストで relSolution の 接頭辞だと 保証する。
   */
  relPrefill?: { cmds?: RelCommand[]; openLoop?: { times: number; body: RelCommand[] } };
  /** kind==='proc' のとき: てじゅんの 固定した 中身（proc_a で みせる・proc_b で正解）*/
  procDef?: import('./relativeEngine').RelDir[];
  /** kind==='proc' のとき: 固定した メインプログラム（proc_b で みせる）*/
  procMain?: ProcMainCmd[];
  /** proc_a の 検証用 最適解（メインプログラムの 最短手順。call を ふくむ）*/
  procMainSolution?: ProcMainCmd[];
  /**
   * proc_a の 足場プリフィル: メインプログラムの 先頭を ロックして 最初から おいておく。
   * こどもは のこりを たすだけ。`procMainSolution` の 接頭辞で あること（テストで 保証）。
   */
  procMainPrefill?: ProcMainCmd[];
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
  {
    id: 'proc_a',
    name: 'てじゅんの にわ',
    emoji: '📦',
    bg: 'from-orange-100 to-amber-50',
    accent: 'orange',
    tagline: 'てじゅんを よびだして らくらく すすもう！',
    story: 'きれいに かたちを した にわに やってきた。\nおなじ みちを まとめた「てじゅん」を よびだすと\nみじかい めいれいで ゴールへ たどりつけるよ！',
    wall: '🌸', tile: 'bg-orange-50', wallTile: 'bg-orange-200', board: 'bg-orange-100/80',
  },
  {
    id: 'proc_b',
    name: 'てじゅんの やかた',
    emoji: '🏛️',
    bg: 'from-rose-100 to-pink-50',
    accent: 'amber',
    tagline: 'てじゅんの なかみを かんがえよう！',
    story: 'ふしぎな やかたの まえに たった。\nメインプログラムは もう できあがっている。\nてじゅんの なかみを きめれば ゴールへ たどりつけるよ！',
    wall: '🌺', tile: 'bg-rose-50', wallTile: 'bg-rose-200', board: 'bg-rose-100/80',
  },
  {
    id: 'nloop_a',
    name: 'ループの なかの ループ',
    emoji: '🌀',
    bg: 'from-teal-100 to-cyan-50',
    accent: 'emerald',
    tagline: 'ループを ネストして もっと かしこく！',
    story: 'おなじ もようが くりかえす ふしぎな もり。\nループの なかに ループを いれると\nもっと みじかい めいれいで すすめるよ！',
    wall: '🌊', tile: 'bg-teal-50', wallTile: 'bg-teal-200', board: 'bg-teal-100/80',
  },
  {
    id: 'nloop_b',
    name: 'ネストループ だいとうげ',
    emoji: '🏔️',
    bg: 'from-indigo-100 to-purple-50',
    accent: 'indigo',
    tagline: 'ふくざつな みちを ネストループで せいふく！',
    story: 'おおきな だいとうげが めのまえに たちはだかる。\nネストしたループで パターンを つかみ、\nすくない めいれいで いただきを めざそう！',
    wall: '🪨', tile: 'bg-indigo-50', wallTile: 'bg-indigo-200', board: 'bg-indigo-100/80',
  },
  {
    id: 'lake',
    name: 'きらめく みずうみ',
    emoji: '🌊',
    bg: 'from-cyan-100 to-blue-50',
    accent: 'sky',
    tagline: 'みずうみの ほとりを すすもう',
    story: 'しずかな みずうみに やってきた。\nはすの はを よけて、むこうぎしの おうちを めざそう！',
    wall: '🪷', tile: 'bg-cyan-50', wallTile: 'bg-cyan-200', board: 'bg-cyan-200/70',
  },
  {
    id: 'honey',
    name: 'はちみつの き',
    emoji: '🍯',
    bg: 'from-yellow-100 to-amber-50',
    accent: 'orange',
    tagline: 'おなじ うごきは ループで まとめよう',
    story: 'あまい においの はちみつの き。\nおなじ みちが ずっと つづくよ。🔁ループ箱で くまさんへ とどけよう！',
    wall: '🐝', tile: 'bg-yellow-50', wallTile: 'bg-yellow-200', board: 'bg-yellow-200/70',
  },
  {
    id: 'robot',
    name: 'ロボットこうじょう',
    emoji: '🤖',
    bg: 'from-slate-100 to-zinc-50',
    accent: 'indigo',
    tagline: 'ロボットの むきを かえて すすもう',
    story: 'ぴかぴかの ロボットこうじょう。\nロボットが むいている ほうを きじゅんに、まえへ すすんだり むきを かえたりして ゴールへ！',
    wall: '🚧', tile: 'bg-slate-50', wallTile: 'bg-slate-300', board: 'bg-slate-200/70',
  },
  {
    id: 'candy',
    name: 'おかしの くに',
    emoji: '🍭',
    bg: 'from-pink-100 to-rose-50',
    accent: 'violet',
    tagline: 'すすめない とき どっちへ いく？',
    story: 'あまーい おかしの くに。\nキャンディの かべに すすめない とき、「もしも」の ルールで かしこく すすもう！',
    wall: '🍬', wallName: 'キャンディ', tile: 'bg-pink-50', wallTile: 'bg-pink-200', board: 'bg-pink-200/70',
  },
  {
    id: 'toy',
    name: 'おもちゃ こうじょう',
    emoji: '🎁',
    bg: 'from-rose-100 to-orange-50',
    accent: 'amber',
    tagline: 'てじゅんの なかみを かんがえよう！',
    story: 'たのしい おもちゃ こうじょう。\nメインプログラムは もう できてるよ。\nてじゅんの なかみを きめて、おもちゃを かんせいさせよう！',
    wall: '🧸', tile: 'bg-rose-50', wallTile: 'bg-rose-200', board: 'bg-rose-100/80',
  },
  {
    id: 'gemcave',
    name: 'ほうせきの どうくつ',
    emoji: '💎',
    bg: 'from-purple-100 to-fuchsia-50',
    accent: 'violet',
    tagline: 'ほうせきを ぜんぶ ひろって すすもう',
    story: 'きらきら ひかる ほうせきの どうくつ。\nいわ🪨を よけながら、ほうせき💎を ぜんぶ あつめて おうちへ かえろう！',
    wall: '🪨', tile: 'bg-purple-50', wallTile: 'bg-purple-200', board: 'bg-purple-200/70',
  },
  {
    id: 'starbase',
    name: 'ほしの きち',
    emoji: '🚀',
    bg: 'from-indigo-100 to-blue-50',
    accent: 'indigo',
    tagline: 'ロケットの むきを かえて ほしを あつめよう',
    story: 'うちゅうの ほしの きち。\nロケットが むいている ほうを きじゅんに、ほし⭐を 2つ ひろって ロケット🚀まで すすもう！',
    wall: '☄️', tile: 'bg-indigo-50', wallTile: 'bg-indigo-200', board: 'bg-indigo-200/70',
  },
  {
    id: 'windmill',
    name: 'くるくる ふうしゃ',
    emoji: '🎡',
    bg: 'from-sky-100 to-cyan-50',
    accent: 'sky',
    tagline: 'おなじ うごきは ループで くるくる',
    story: 'かぜが きもちいい ふうしゃの おか。\nおなじ うごきは 🔁ループ箱に まとめて、まとに とどけよう！',
    wall: '🍃', tile: 'bg-sky-50', wallTile: 'bg-sky-200', board: 'bg-sky-200/70',
  },
  {
    id: 'craft',
    name: 'ふしぎな こうぼう',
    emoji: '🔧',
    bg: 'from-amber-100 to-yellow-50',
    accent: 'amber',
    tagline: 'てじゅんの なかみを かんがえよう',
    story: 'どうぐを つくる ふしぎな こうぼう。\nメインプログラムは できてるよ。\nてじゅん(📦)の なかみを きめて、どうぐを かんせいさせよう！',
    wall: '🔩', tile: 'bg-amber-50', wallTile: 'bg-amber-200', board: 'bg-amber-100/80',
  },
  {
    id: 'lava',
    name: 'ようがんの どうくつ',
    emoji: '🌋',
    bg: 'from-orange-100 to-red-50',
    accent: 'orange',
    tagline: 'ようがんを よけて ほうせきを あつめよう',
    story: 'あつい ようがんの どうくつ。\nようがん🔥を よけながら、ほうせき💎を ぜんぶ ひろって おうちへ かえろう！',
    wall: '🔥', tile: 'bg-orange-50', wallTile: 'bg-orange-200', board: 'bg-orange-200/70',
  },
  {
    id: 'beach',
    name: 'すなはまの みち',
    emoji: '🏖️',
    bg: 'from-amber-100 to-yellow-50',
    accent: 'amber',
    tagline: 'なみうちぎわで ほうせきさがし',
    story: 'きらきら ひかる すなはま。\nやしのき🌴を よけて、ほうせき💎を あつめながら すすもう！',
    wall: '🌴', tile: 'bg-amber-50', wallTile: 'bg-amber-200', board: 'bg-amber-100/80',
  },
  {
    id: 'flower',
    name: 'はなばたけ',
    emoji: '🌸',
    bg: 'from-fuchsia-100 to-pink-50',
    accent: 'violet',
    tagline: 'おはなの あいだを すすもう',
    story: 'いいにおいの はなばたけ。\nチューリップ🌷の あいだを とおって、ほうせき💎を ぜんぶ あつめよう！',
    wall: '🌷', tile: 'bg-fuchsia-50', wallTile: 'bg-fuchsia-200', board: 'bg-fuchsia-200/70',
  },
  {
    id: 'rock',
    name: 'いわやまの とりで',
    emoji: '⛰️',
    bg: 'from-lime-100 to-green-50',
    accent: 'lime',
    tagline: 'いわを よけて てっぺんへ',
    story: 'たかい いわやまの とりで。\nおおきな いわ🪨を よけながら、ほうせき💎を ひろって おうちへ！',
    wall: '🪨', tile: 'bg-lime-50', wallTile: 'bg-lime-200', board: 'bg-lime-200/70',
  },
  {
    id: 'night',
    name: 'よぞらの まち',
    emoji: '🌃',
    bg: 'from-indigo-100 to-slate-50',
    accent: 'indigo',
    tagline: 'よるの まちで ほうせきさがし',
    story: 'しずかな よぞらの まち。\nビル🏢の あいだを とおって、ひかる ほうせき💎を あつめよう！',
    wall: '🏢', tile: 'bg-indigo-50', wallTile: 'bg-indigo-200', board: 'bg-indigo-200/70',
  },
  {
    id: 'leaf',
    name: 'おちばの こみち',
    emoji: '🍂',
    bg: 'from-emerald-100 to-teal-50',
    accent: 'emerald',
    tagline: 'おちばの みちを すすもう',
    story: 'あきの おちばの こみち。\nおちば🍂を よけながら、ほうせき💎を ぜんぶ ひろって おうちへ かえろう！',
    wall: '🍂', tile: 'bg-emerald-50', wallTile: 'bg-emerald-200', board: 'bg-emerald-200/70',
  },
  {
    id: 'rainbow',
    name: 'にじの おか',
    emoji: '🌈',
    bg: 'from-violet-100 to-fuchsia-50',
    accent: 'violet',
    tagline: 'やじるしを じゅんばんに ならべよう',
    story: 'あめが あがって にじが でたよ。\nくも☁️を よけながら、ほうせき💎を ひろって おうちへ かえろう！',
    wall: '☁️', tile: 'bg-violet-50', wallTile: 'bg-violet-200', board: 'bg-violet-200/70',
  },
  {
    id: 'mushroom',
    name: 'きのこの もり',
    emoji: '🍄',
    bg: 'from-lime-100 to-green-50',
    accent: 'lime',
    tagline: 'うえ と よこ を じゅんばんに すすもう',
    story: 'おおきな きのこが はえた もり。\nきのこ🍄を よけて、ほうせき💎を ぜんぶ あつめて おうちへ！',
    wall: '🍄', tile: 'bg-lime-50', wallTile: 'bg-lime-200', board: 'bg-lime-200/70',
  },
  {
    id: 'island',
    name: 'たからじまの ぼうけん',
    emoji: '🏝️',
    bg: 'from-amber-100 to-orange-50',
    accent: 'amber',
    tagline: 'まんなかや はじっこの たからを あつめよう',
    story: 'なぞの たからじまに とうちゃく！\nまんなかや すみっこに かくれた ほうせき💎を ぜんぶ ひろって、おうちへ もちかえろう！',
    wall: '🪨', tile: 'bg-amber-50', wallTile: 'bg-amber-200', board: 'bg-amber-100/80',
  },
  {
    id: 'detour',
    name: 'まわりみちの とりで',
    emoji: '🧱',
    bg: 'from-slate-100 to-zinc-50',
    accent: 'indigo',
    tagline: 'まっすぐ いけない！ まわりみちを さがそう',
    story: 'たかい かべの とりで。\nまっすぐ すすめない ところは、ぐるっと まわりみちを かんがえて おうちへ かえろう！',
    wall: '🧱', tile: 'bg-slate-50', wallTile: 'bg-slate-300', board: 'bg-slate-200/70',
  },
  {
    id: 'backtrack',
    name: 'あともどりの どうくつ',
    emoji: '🔦',
    bg: 'from-violet-100 to-purple-50',
    accent: 'violet',
    tagline: 'ゴールと はんたいの たからも とりに いこう',
    story: 'まっくらな どうくつ。\nゴールと はんたいがわに たからが ある！ いちど とおざかって、ひろってから もどろう。',
    wall: '🪨', tile: 'bg-violet-50', wallTile: 'bg-violet-200', board: 'bg-violet-200/70',
  },
  {
    id: 'vault',
    name: 'とじこめられた たから',
    emoji: '🔒',
    bg: 'from-orange-100 to-amber-50',
    accent: 'orange',
    tagline: 'へやに はいって たからを とって でよう',
    story: 'かぎの かかった たからべや。\nせまい いりぐちから はいって、たから💎を とって、また でてくる みちを かんがえよう！',
    wall: '🧱', tile: 'bg-orange-50', wallTile: 'bg-orange-200', board: 'bg-orange-200/70',
  },
  {
    id: 'ghost',
    name: 'おばけの まよいみち',
    emoji: '👻',
    bg: 'from-emerald-100 to-green-50',
    accent: 'emerald',
    tagline: 'おばけ🧟に ぶつからないよう よけて すすもう',
    story: 'ひんやり おばけの まよいみち。\nおばけ🧟に ぶつからないように、ジグザグに よけながら おうちへ かえろう！',
    wall: '🪦', tile: 'bg-emerald-50', wallTile: 'bg-emerald-200', board: 'bg-emerald-200/70',
  },
  {
    id: 'spiral',
    name: 'うずまきの とう',
    emoji: '🌀',
    bg: 'from-sky-100 to-cyan-50',
    accent: 'sky',
    tagline: 'ぐるぐる まいて おくの たからへ',
    story: 'ふしぎな うずまきの とう。\nかべに そって ぐるぐる まわりながら、おくに ある たから💎を めざそう！',
    wall: '🧱', tile: 'bg-sky-50', wallTile: 'bg-sky-300', board: 'bg-sky-200/70',
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
const FISH = '🐟';
const BEAR = '🐻';
const COG = '⚙️';
const BATTERY = '🔋';
const CAKE = '🎂';
const TOYGOAL = '🪀';

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
    optimal: 20, maxSlots: 26, allowLoop: true, goalEmoji: HOME,
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
    optimal: 1, maxSlots: 4,
    relPrefill: { openLoop: { times: 3, body: [] } },
    prompt: 'ループ箱に「まえへ」を いれて、✅かんりょう！',
  },
  {
    id: 'adv-q80', zoneId: 'rloop_a', rows: 1, cols: 5,
    start: r(0, 0), goal: r(0, 4), startFacing: 'right',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 4, body: ['forward'] }],
    optimal: 1, maxSlots: 5,
    relPrefill: { openLoop: { times: 4, body: [] } },
    prompt: 'ループ箱に「まえへ」を いれて、✅かんりょう！',
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
    optimal: 3, maxSlots: 7,
    relPrefill: { cmds: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'], openLoop: { times: 3, body: [] } },
    prompt: 'まがる ところは できてるよ。さいごの ループに「まえへ」を いれてね',
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
    optimal: 3, maxSlots: 7,
    relPrefill: { cmds: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'], openLoop: { times: 3, body: [] } },
    prompt: '⭐を とおる みち！ さいごの ループに「まえへ」を いれてね',
  },
  {
    id: 'adv-q83', zoneId: 'rloop_a', rows: 4, cols: 4,
    start: r(3, 1), goal: r(3, 3), startFacing: 'up',
    // まんなか（3,2）を かべで ふさぐ＝よこ まっすぐ では いけない。のぼって・よこ・おりる の コの字 だけ。
    walls: [r(3, 2)], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 2, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 2, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 5, maxSlots: 9,
    relPrefill: { cmds: [{ kind: 'loop', times: 2, body: ['forward'] }, 'turn_right', { kind: 'loop', times: 2, body: ['forward'] }, 'turn_right'], openLoop: { times: 2, body: [] } },
    prompt: 'コの字の さいご！ ループに「まえへ」を いれて かんりょう',
  },
  {
    id: 'adv-q84', zoneId: 'rloop_a', rows: 6, cols: 6,
    start: r(5, 0), goal: r(0, 5), startFacing: 'up',
    // (1,0) を ふさぐ＝⭐(2,0) より うえに のぼれない。のぼる→よこ→のぼる の Z字 だけ。
    walls: [r(1, 0)], gems: [r(2, 0)], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 5, body: ['forward'] },
      'turn_left',
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 5, maxSlots: 12,
    relPrefill: { cmds: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right', { kind: 'loop', times: 5, body: ['forward'] }, 'turn_left'], openLoop: { times: 2, body: [] } },
    prompt: 'Z字の さいご！ ループに「まえへ」を いれて ⭐も ひろおう',
  },

  // ─── 🌀 そうたいループ だいみゃく（adv-q85〜adv-q90）ループ本体に まがりかど ───
  {
    id: 'adv-q85', zoneId: 'rloop_b', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 3), startFacing: 'right',
    // かいだん の かたちに かべで みちを しぼる（まっすぐ や L字 では いけない）。
    walls: [r(0, 2), r(0, 3), r(1, 0), r(1, 3), r(2, 0), r(2, 1), r(3, 0), r(3, 1), r(3, 2)],
    goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: ['forward', 'turn_right', 'forward', 'turn_left'] }],
    optimal: 1, maxSlots: 12,
    relPrefill: { openLoop: { times: 3, body: ['forward', 'turn_right'] } },
    prompt: 'かいだんの くりかえし！ ？に「まえへ」と「ひだりをむく」を たそう',
  },
  {
    id: 'adv-q86', zoneId: 'rloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(4, 4), startFacing: 'right',
    // かいだん通路。💫(2,2) は かいだんの まんなかの だんに ある。
    walls: [
      r(0, 2), r(0, 3), r(0, 4), r(1, 0), r(1, 3), r(1, 4),
      r(2, 0), r(2, 1), r(2, 4), r(3, 0), r(3, 1), r(3, 2),
      r(4, 0), r(4, 1), r(4, 2), r(4, 3),
    ],
    gems: [r(2, 2)], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 4, body: ['forward', 'turn_right', 'forward', 'turn_left'] }],
    optimal: 1, maxSlots: 16,
    relPrefill: { openLoop: { times: 4, body: ['forward', 'turn_right'] } },
    prompt: '💫を ひろう かいだん！ ？に「まえへ」と「ひだりをむく」を たそう',
  },
  {
    id: 'adv-q87', zoneId: 'rloop_b', rows: 4, cols: 7,
    start: r(0, 0), goal: r(3, 6), startFacing: 'right',
    // ジグザグ通路（よこ2・した1 を くりかえす かたち）に かべで しぼる。
    walls: [
      r(0, 3), r(0, 4), r(0, 5), r(0, 6), r(1, 0), r(1, 1), r(1, 5), r(1, 6),
      r(2, 0), r(2, 1), r(2, 2), r(2, 3), r(3, 0), r(3, 1), r(3, 2), r(3, 3), r(3, 4), r(3, 5),
    ],
    goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: ['forward', 'forward', 'turn_right', 'forward', 'turn_left'] }],
    optimal: 1, maxSlots: 15,
    relPrefill: { openLoop: { times: 3, body: ['forward', 'forward', 'turn_right'] } },
    prompt: 'ジグザグの くりかえし！ ？に「まえへ」と「ひだりをむく」を たそう',
  },
  {
    id: 'adv-q88', zoneId: 'rloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(4, 4), startFacing: 'down',
    // した2・よこ2 の L字 を くりかえす おおきな かいだん通路。
    walls: [
      r(0, 1), r(0, 2), r(0, 3), r(0, 4), r(1, 1), r(1, 2), r(1, 3), r(1, 4),
      r(2, 3), r(2, 4), r(3, 0), r(3, 1), r(3, 3), r(3, 4), r(4, 0), r(4, 1),
    ],
    goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 2, body: ['forward', 'forward', 'turn_left', 'forward', 'forward', 'turn_right'] }],
    optimal: 1, maxSlots: 12,
    relPrefill: { openLoop: { times: 2, body: ['forward', 'forward', 'turn_left', 'forward'] } },
    prompt: 'おおきな かいだん！ ？に「まえへ」と「みぎをむく」を たそう',
  },
  {
    id: 'adv-q89', zoneId: 'rloop_b', rows: 3, cols: 5,
    start: r(0, 0), goal: r(2, 4), startFacing: 'right',
    // まえはん は かいだん、うしろは まっすぐ。2つの ループを くみあわせる かたちに しぼる。
    walls: [r(0, 2), r(0, 3), r(0, 4), r(1, 0), r(1, 3), r(1, 4), r(2, 0), r(2, 1)],
    goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 2, body: ['forward', 'turn_right', 'forward', 'turn_left'] },
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 2, maxSlots: 10,
    relPrefill: { cmds: [{ kind: 'loop', times: 2, body: ['forward', 'turn_right', 'forward', 'turn_left'] }], openLoop: { times: 2, body: [] } },
    prompt: '2つめの ループに「まえへ」を いれて かんりょう！',
  },
  {
    id: 'adv-q90', zoneId: 'rloop_b', rows: 6, cols: 6,
    start: r(5, 0), goal: r(0, 5), startFacing: 'up',
    // ボス。かいだん→まっすぐ→まがって まっすぐ の くねくね通路。💫(3,2) は とちゅうの だんに ある。
    walls: [
      r(0, 0), r(0, 1), r(0, 2), r(1, 0), r(1, 1), r(1, 2), r(1, 4), r(1, 5),
      r(2, 0), r(2, 1), r(2, 4), r(2, 5), r(3, 0), r(3, 3), r(3, 4), r(3, 5),
      r(4, 2), r(4, 3), r(4, 4), r(4, 5), r(5, 1), r(5, 2), r(5, 3), r(5, 4), r(5, 5),
    ],
    gems: [r(3, 2)], goalEmoji: '🏆', gemEmoji: '💫',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward', 'turn_right', 'forward', 'turn_left'] },
      { kind: 'loop', times: 2, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 2, body: ['forward'] },
    ],
    optimal: 4, maxSlots: 17,
    relPrefill: { cmds: [{ kind: 'loop', times: 3, body: ['forward', 'turn_right', 'forward', 'turn_left'] }, { kind: 'loop', times: 2, body: ['forward'] }, 'turn_right'], openLoop: { times: 2, body: [] } },
    prompt: 'ボス！ さいごの ループに「まえへ」を いれて 💫も ひろおう',
  },

  // ─── 📦 てじゅんの にわ（adv-q91〜adv-q96）てじゅん呼び出し・proc_a ───
  {
    id: 'adv-q91', zoneId: 'proc_a', rows: 4, cols: 1,
    start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '🌸',
    kind: 'proc',
    procDef: ['forward', 'forward', 'forward'],
    procMainSolution: [{ kind: 'call' }],
    optimal: 1, maxSlots: 2,
    prompt: 'てじゅんを よびだして 3マス すすもう！',
  },
  {
    id: 'adv-q92', zoneId: 'proc_a', rows: 7, cols: 1,
    start: r(6, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '🌸',
    kind: 'proc',
    procDef: ['forward', 'forward', 'forward'],
    procMainSolution: [{ kind: 'call' }, { kind: 'call' }],
    optimal: 2, maxSlots: 3,
    prompt: 'てじゅんを 2かい よびだして ゴールへ！',
  },
  {
    id: 'adv-q93', zoneId: 'proc_a', rows: 3, cols: 5,
    start: r(2, 0), goal: r(0, 4), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '🌸',
    kind: 'proc',
    procDef: ['forward', 'forward'],
    procMainSolution: [{ kind: 'call' }, 'turn_right', { kind: 'call' }, { kind: 'call' }],
    procMainPrefill: [{ kind: 'call' }, 'turn_right', { kind: 'call' }],
    optimal: 4, maxSlots: 5,
    prompt: 'まがる ところまで できてるよ。さいごの てじゅんを よぼう！',
  },
  {
    id: 'adv-q94', zoneId: 'proc_a', rows: 3, cols: 3,
    start: r(2, 0), goal: r(0, 2), startFacing: 'up',
    walls: [], gems: [r(0, 0)], goalEmoji: '🎯', gemEmoji: '🌸',
    kind: 'proc',
    procDef: ['forward', 'forward'],
    procMainSolution: [{ kind: 'call' }, 'turn_right', { kind: 'call' }],
    procMainPrefill: [{ kind: 'call' }, 'turn_right'],
    optimal: 3, maxSlots: 4,
    prompt: '🌸を とおる みち！ さいごの てじゅんを よんで ゴールへ',
  },
  {
    id: 'adv-q95', zoneId: 'proc_a', rows: 5, cols: 3,
    start: r(4, 0), goal: r(0, 2), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '🌸',
    kind: 'proc',
    procDef: ['forward', 'forward'],
    procMainSolution: [{ kind: 'call' }, { kind: 'call' }, 'turn_right', { kind: 'call' }],
    procMainPrefill: [{ kind: 'call' }, { kind: 'call' }, 'turn_right'],
    optimal: 4, maxSlots: 5,
    prompt: 'まがる ところまで できてるよ。さいごの てじゅんを よぼう！',
  },
  {
    id: 'adv-q96', zoneId: 'proc_a', rows: 5, cols: 5,
    start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '🌸',
    kind: 'proc',
    procDef: ['forward', 'turn_right', 'forward', 'turn_left'],
    procMainSolution: [{ kind: 'call' }, { kind: 'call' }, { kind: 'call' }, { kind: 'call' }],
    procMainPrefill: [{ kind: 'call' }, { kind: 'call' }, { kind: 'call' }],
    optimal: 4, maxSlots: 5,
    prompt: 'あと 1かい てじゅんを よべば ゴール！',
  },

  // ─── 🏛️ てじゅんの やかた（adv-q97〜adv-q102）てじゅん本体を きめる・proc_b ───
  {
    id: 'adv-q97', zoneId: 'proc_b', rows: 5, cols: 1,
    start: r(4, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🏛️', gemEmoji: '🌺',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'てじゅんの なかみを きめよう！ 2かい よんで ゴールへ',
  },
  {
    id: 'adv-q98', zoneId: 'proc_b', rows: 4, cols: 1,
    start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🏛️', gemEmoji: '🌺',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward'],
    optimal: 1, maxSlots: 3,
    prompt: '3かい よんで 3マス すすむ てじゅんを つくろう！',
  },
  {
    id: 'adv-q99', zoneId: 'proc_b', rows: 3, cols: 3,
    start: r(2, 0), goal: r(0, 2), startFacing: 'up',
    walls: [], goalEmoji: '🏛️', gemEmoji: '🌺',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'てじゅんで のぼって まがって また すすもう！',
  },
  {
    id: 'adv-q100', zoneId: 'proc_b', rows: 4, cols: 4,
    start: r(3, 0), goal: r(3, 2), startFacing: 'up',
    walls: [], goalEmoji: '🏛️', gemEmoji: '🌺',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }, 'turn_right', { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'U字に まわる てじゅんを かんがえよう！',
  },
  {
    id: 'adv-q101', zoneId: 'proc_b', rows: 3, cols: 5,
    start: r(2, 0), goal: r(0, 4), startFacing: 'up',
    walls: [], gems: [r(0, 0)], goalEmoji: '🏛️', gemEmoji: '🌺',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: '🌺を とおりながら、てじゅんで ゴールへ！',
  },
  {
    id: 'adv-q102', zoneId: 'proc_b', rows: 5, cols: 5,
    start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [], gems: [r(0, 0)], goalEmoji: '🏛️', gemEmoji: '🌺',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }, 'turn_right', { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: '🌺を とおって ゴールへ！ てじゅんで どのくらい すすむか きめよう',
  },

  // ─── 🌀 ループの なかの ループ（adv-q103〜adv-q108）ネストループ 入門 ───
  // 段階: L字2辺(小) → L字2辺(長辺) → 3辺(小) → 3辺(向き変え) → 3辺(大) → 3辺(大+⭐)
  {
    // 超入門: loop(2){loop(2){forward}, turn_right} = 2まい すすんで まがる を 2かい
    // = 3×3の 2辺（L字形）。walls:[] で maxSlots:2 の制約が 自然に ネストループを 強制。
    id: 'adv-q103', zoneId: 'nloop_a', rows: 3, cols: 3,
    start: r(0, 0), goal: r(2, 2), startFacing: 'right',
    walls: [], goalEmoji: '🌊', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 2, body: [{ kind: 'loop', times: 2, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 6,
    relPrefill: { openLoop: { times: 2, body: [{ kind: 'loop', times: 2, body: ['forward'] }] } },
    prompt: 'なかの ループは できてるよ。「みぎをむく」を たして かんりょう！',
  },
  {
    // L字2辺（長辺版）: loop(2){loop(3){forward}, turn_right} = 3まい すすんで まがる を 2かい
    // = 4×4の 2辺。内ループを 増やすと 1辺が 長くなる。walls:[] で maxSlots:2 が強制。
    id: 'adv-q104', zoneId: 'nloop_a', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 3), startFacing: 'right',
    walls: [], goalEmoji: '🌊', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 2, body: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 8,
    relPrefill: { openLoop: { times: 2, body: [{ kind: 'loop', times: 3, body: ['forward'] }] } },
    prompt: 'なかの ループは できてるよ。「みぎをむく」を たして かんりょう！',
  },
  {
    // 3辺（小）: loop(3){loop(2){forward}, turn_right} = 2まい すすんで まがる を 3かい
    // まんなかを ふさぐ＝まっすぐ したへ いけない。四角の ふちを まわる。
    id: 'adv-q105', zoneId: 'nloop_a', rows: 3, cols: 3,
    start: r(0, 0), goal: r(2, 0), startFacing: 'right',
    walls: [r(1, 0), r(1, 1)], goalEmoji: '🌊', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 2, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 9,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 2, body: ['forward'] }] } },
    prompt: 'そとの ループは 3かい。「みぎをむく」を たして 3つの かどを まわろう',
  },
  {
    // 3辺（向き変え）: 同じ loop(3){loop(2){forward}, turn_right} を startFacing:down で
    // うえの れつと まんなかを ふさぐ＝よこ まっすぐ では いけない。ふちを まわる だけ。
    id: 'adv-q106', zoneId: 'nloop_a', rows: 3, cols: 3,
    start: r(0, 2), goal: r(0, 0), startFacing: 'down',
    walls: [r(0, 1), r(1, 1)], goalEmoji: '🌊', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 2, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 9,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 2, body: ['forward'] }] } },
    prompt: 'むきが ちがっても おなじ！「みぎをむく」を たして かんりょう',
  },
  {
    // 3辺（大）: loop(3){loop(3){forward}, turn_right} = 4×4 グリッド
    // なかみを ぜんぶ ふさぐ＝四角の ふち（みぎ→した→ひだり）だけ とおれる。
    id: 'adv-q107', zoneId: 'nloop_a', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 0), startFacing: 'right',
    walls: [r(1, 0), r(1, 1), r(1, 2), r(2, 0), r(2, 1), r(2, 2)],
    goalEmoji: '🌊', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 12,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }] } },
    prompt: 'おおきな しかく！「みぎをむく」を たして ふちを まわろう',
  },
  {
    // 3辺（大）+ ⭐: loop(3){loop(3){forward}, turn_right} + gems
    // walls:[] で maxSlots:2 が強制。⭐は コーナーに。
    id: 'adv-q108', zoneId: 'nloop_a', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 0), startFacing: 'right',
    walls: [], gems: [r(0, 3)], goalEmoji: '🌊', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 12,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }] } },
    prompt: '⭐は かどに あるよ。「みぎをむく」を たして かんりょう',
  },

  // ─── 🏔️ ネストループ だいとうげ（adv-q109〜adv-q114）ネストループ 応用 ───
  // 段階: L字(4×4) → 3辺+💎 → 3辺+壁+向き変え → 5×5壁あり → 5×5+💎×2 → 5×5向き変え
  {
    // L字2辺（4×4）: loop(2){loop(3){forward}, turn_right}
    // 入門ゾーンの q104 と同じパターンで、こんどは nloop_b の導入として確認。
    id: 'adv-q109', zoneId: 'nloop_b', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 3), startFacing: 'right',
    walls: [], goalEmoji: '🏔️', gemEmoji: '💎',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 2, body: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 8,
    relPrefill: { openLoop: { times: 2, body: [{ kind: 'loop', times: 3, body: ['forward'] }] } },
    prompt: 'なかの ループは できてるよ。「みぎをむく」を たして かんりょう！',
  },
  {
    // 3辺（4×4）+ 💎: loop(3){loop(3){forward}, turn_right} + gems
    // 💎 は コーナー（3辺目の終点）に。walls:[] で maxSlots:2 が強制。
    id: 'adv-q110', zoneId: 'nloop_b', rows: 4, cols: 4,
    start: r(0, 0), goal: r(3, 0), startFacing: 'right',
    walls: [], gems: [r(3, 3)], goalEmoji: '🏔️', gemEmoji: '💎',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 12,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }] } },
    prompt: '💎は かどに ある！「みぎをむく」を たして かんりょう',
  },
  {
    // 3辺（4×4）+ 壁あり + startFacing:up
    // なかみと したの れつを ふさぐ＝ふち（うえ→みぎ→した）を まわる だけ。
    id: 'adv-q111', zoneId: 'nloop_b', rows: 4, cols: 4,
    start: r(3, 0), goal: r(3, 3), startFacing: 'up',
    walls: [r(1, 1), r(1, 2), r(2, 1), r(2, 2), r(3, 1), r(3, 2)],
    goalEmoji: '🏔️', gemEmoji: '💎',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 12,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 3, body: ['forward'] }] } },
    prompt: 'ゴールの かどは どこかな？「みぎをむく」を たして かんりょう',
  },
  {
    // 5×5（大）+ 壁あり: loop(3){loop(4){forward}, turn_right}
    // なかみを ぜんぶ ふさぐ＝おおきな 四角の ふち（みぎ→した→ひだり）だけ とおれる。
    id: 'adv-q112', zoneId: 'nloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(4, 0), startFacing: 'right',
    walls: [
      r(1, 0), r(1, 1), r(1, 2), r(1, 3), r(2, 0), r(2, 1), r(2, 2), r(2, 3),
      r(3, 0), r(3, 1), r(3, 2), r(3, 3),
    ],
    goalEmoji: '🏔️', gemEmoji: '💎',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 4, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 15,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 4, body: ['forward'] }] } },
    prompt: 'おおきな しかく！「みぎをむく」を たして ふちを まわろう',
  },
  {
    // 5×5 + 💎×2: loop(3){loop(4){forward}, turn_right} + gems
    // 💎 は 2つの コーナーに。walls:[] で maxSlots:2 が強制。
    id: 'adv-q113', zoneId: 'nloop_b', rows: 5, cols: 5,
    start: r(0, 0), goal: r(4, 0), startFacing: 'right',
    walls: [], gems: [r(0, 4), r(4, 4)], goalEmoji: '🏔️', gemEmoji: '💎',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 4, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 15,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 4, body: ['forward'] }] } },
    prompt: '💎を 2つ とろう！「みぎをむく」を たして かんりょう',
  },
  {
    // 5×5 + 壁あり + startFacing:down（最難関ボス）
    // なかみと うえの れつを ふさぐ＝ふち（した→ひだり→うえ）を まわる だけ。
    id: 'adv-q114', zoneId: 'nloop_b', rows: 5, cols: 5,
    start: r(0, 4), goal: r(0, 0), startFacing: 'down',
    walls: [
      r(0, 1), r(0, 2), r(0, 3), r(1, 1), r(1, 2), r(1, 3),
      r(2, 1), r(2, 2), r(2, 3), r(3, 1), r(3, 2), r(3, 3),
    ],
    goalEmoji: '🏔️', gemEmoji: '💎',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 3, body: [{ kind: 'loop', times: 4, body: ['forward'] }, 'turn_right'] }],
    optimal: 1, maxSlots: 15,
    relPrefill: { openLoop: { times: 3, body: [{ kind: 'loop', times: 4, body: ['forward'] }] } },
    prompt: 'ボス！ むきに ちゅうい。「みぎをむく」を たして かんりょう',
  },

  // ─── 🌊 きらめく みずうみ（adv-q115〜adv-q120）矢印ならべ・さかなの かいだん ───
  // 左下から むこうぎしの おうち(右上)へ。さかな(🐟)を ななめに ならべ、はす(🪷)で
  // まっすぐ みちを ふさぐので、「↑→↑→…」と じゅんばんに 組まないと わたれない 階段。
  {
    id: 'adv-q115', zoneId: 'lake', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [], gems: [r(2, 1), r(1, 2)], gemEmoji: FISH, optimal: 6, maxSlots: 14, goalEmoji: HOME,
    prompt: 'さかな🐟を ひろいながら おうちへ いこう',
  },
  {
    id: 'adv-q116', zoneId: 'lake', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(2, 2)], gems: [r(3, 1), r(1, 3)], gemEmoji: FISH, optimal: 8, maxSlots: 16, goalEmoji: HOME,
    prompt: 'はす🪷を よけて さかな🐟を あつめよう',
  },
  {
    id: 'adv-q117', zoneId: 'lake', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: FISH, optimal: 8, maxSlots: 16, goalEmoji: HOME,
    prompt: 'さかな🐟が ならんでる！ じゅんばんに ひろおう',
  },
  {
    id: 'adv-q118', zoneId: 'lake', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(3, 2), r(2, 3)], gems: [r(4, 1), r(1, 4)], gemEmoji: FISH, optimal: 10, maxSlots: 18, goalEmoji: HOME,
    prompt: 'ひろい みずうみ！ さかな🐟を おとさず すすもう',
  },
  {
    id: 'adv-q119', zoneId: 'lake', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [], gems: [r(4, 1), r(3, 2), r(2, 3), r(1, 4)], gemEmoji: FISH, optimal: 10, maxSlots: 18, goalEmoji: HOME,
    prompt: 'さかな🐟が いっぱい！ かいだんを のぼるように',
  },
  {
    id: 'adv-q120', zoneId: 'lake', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(5, 2), r(2, 1), r(3, 4), r(0, 3)],
    gems: [r(4, 1), r(3, 2), r(2, 3), r(1, 4)], gemEmoji: FISH, optimal: 10, maxSlots: 20, goalEmoji: HOME,
    prompt: '🌊みずうみの ボス！ さかな🐟を ぜんぶ あつめて おうちへ',
  },

  // ─── 🍯 はちみつの き（adv-q121〜adv-q126）loopOnly・くりかえし入門 ───
  // ふつうの 1マス矢印は つかわず、🔁ループ箱（おなじ むき×2〜5）だけで すすむ。
  // はちみつ(🍯)を ひろって くまさん(🐻)へ。optimal は solve() の 実測値。
  {
    id: 'adv-q121', zoneId: 'honey', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 0),
    walls: [], optimal: 4, maxSlots: 10, allowLoop: true, loopOnly: true, goalEmoji: BEAR,
    prompt: 'おなじ むきを 🔁ループに まとめて すすもう',
  },
  {
    id: 'adv-q122', zoneId: 'honey', rows: 5, cols: 5, start: r(0, 0), goal: r(0, 4),
    walls: [], optimal: 4, maxSlots: 10, allowLoop: true, loopOnly: true, goalEmoji: BEAR,
    prompt: '🔁ループ箱で まっすぐ くまさんへ',
  },
  {
    id: 'adv-q123', zoneId: 'honey', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: BEAR,
    prompt: 'した と みぎ、2つの 🔁ループで いけるかな',
  },
  {
    id: 'adv-q124', zoneId: 'honey', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(4, 0)], gemEmoji: '🍯', optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: BEAR,
    prompt: 'はちみつ🍯を とってから くまさんへ（🔁だけ）',
  },
  {
    id: 'adv-q125', zoneId: 'honey', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, loopOnly: true, goalEmoji: BEAR,
    prompt: 'むきを かえて 🔁ループで のぼろう',
  },
  {
    id: 'adv-q126', zoneId: 'honey', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [], gems: [r(5, 0)], gemEmoji: '🍯', optimal: 10, maxSlots: 14, allowLoop: true, loopOnly: true, goalEmoji: BEAR,
    prompt: '🍯はちみつの ボス！ はちみつを とって くまさんへ（🔁だけ）',
  },

  // ─── 🤖 ロボットこうじょう（adv-q127〜adv-q132）そうたい方向・ループなし ───
  // キャラの むき が きじゅん。まえへ／みぎをむく／ひだりをむく で ねじ(⚙️)を ひろい でんち(🔋)へ。
  // optimal は そうたい命令の かず（まわる も 1手）。relSolution は solveRelative() の 最短解。
  {
    id: 'adv-q127', zoneId: 'robot', rows: 5, cols: 1, start: r(4, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: BATTERY, gemEmoji: COG,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'forward'],
    optimal: 4, maxSlots: 6,
    prompt: 'まえへ すすんで でんち🔋へ いこう',
  },
  {
    id: 'adv-q128', zoneId: 'robot', rows: 1, cols: 5, start: r(0, 0), goal: r(0, 4), startFacing: 'right',
    walls: [], goalEmoji: BATTERY, gemEmoji: COG,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'forward'],
    optimal: 4, maxSlots: 6,
    prompt: 'むいている ほうへ すすもう',
  },
  {
    id: 'adv-q129', zoneId: 'robot', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [], goalEmoji: BATTERY, gemEmoji: COG,
    kind: 'relative',
    relSolution: ['forward', 'forward', 'forward', 'turn_right', 'forward', 'forward', 'forward'],
    optimal: 7, maxSlots: 10,
    prompt: 'てっぺんで むきを かえて すすもう',
  },
  {
    id: 'adv-q130', zoneId: 'robot', rows: 3, cols: 3, start: r(2, 0), goal: r(0, 2), startFacing: 'up',
    walls: [], gems: [r(2, 2)], goalEmoji: BATTERY, gemEmoji: COG,
    kind: 'relative',
    relSolution: ['turn_right', 'forward', 'forward', 'turn_left', 'forward', 'forward'],
    optimal: 6, maxSlots: 9,
    prompt: 'ねじ⚙️を とおって でんち🔋へ',
  },
  {
    id: 'adv-q131', zoneId: 'robot', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [], gems: [r(3, 3)], goalEmoji: BATTERY, gemEmoji: COG,
    kind: 'relative',
    relSolution: ['turn_right', 'forward', 'forward', 'forward', 'turn_left', 'forward', 'forward', 'forward'],
    optimal: 8, maxSlots: 11,
    prompt: 'ねじ⚙️を ひろってから ゴールへ',
  },
  {
    id: 'adv-q132', zoneId: 'robot', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [r(2, 2)], gems: [r(4, 4)], goalEmoji: BATTERY, gemEmoji: COG,
    kind: 'relative',
    relSolution: ['turn_right', 'forward', 'forward', 'forward', 'forward', 'turn_left', 'forward', 'forward', 'forward', 'forward'],
    optimal: 10, maxSlots: 16,
    prompt: '🤖こうじょうの ボス！ ねじ⚙️を とって でんち🔋へ',
  },

  // ─── 🍭 おかしの くに（adv-q133〜adv-q138）もしも分岐・穴埋め ───
  // キャンディ(🍬)が かべ。「<むき> に すすめなかったら…」の ルールを 穴埋めで えらんで ケーキ(🎂)へ。
  // 盤面は くもの てんごく（検証ずみ）の 一意解配置を ベースに、テーマだけ おかしに かえた もの。
  // 穴の 一意解・最短一致は adventure.test.ts が 自動検証する。
  {
    id: 'adv-q133', zoneId: 'candy', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 2)], goalEmoji: CAKE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeSensor: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'どっちに すすめないか しらべよう「[？] に すすめなかったら ↓、すすめたら →」',
  },
  {
    id: 'adv-q134', zoneId: 'candy', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(2, 0)], goalEmoji: CAKE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeThen: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'すすめなかったら どっちへ？「↓ に すすめなかったら [？]、すすめたら ↓」',
  },
  {
    id: 'adv-q135', zoneId: 'candy', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 0),
    walls: [r(0, 1)], goalEmoji: CAKE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 6, rule: { sensor: 'left', thenDir: 'down', elseDir: 'left', holeElse: true } }] },
    optimal: 6, maxSlots: 6,
    prompt: 'すすめるとき どっちへ？「← に すすめなかったら ↓、すすめたら [？]」',
  },
  {
    id: 'adv-q136', zoneId: 'candy', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(3, 0)], goalEmoji: CAKE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'up', thenDir: 'right', elseDir: 'up', holeSensor: true, holeThen: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: 'うえへ のぼろう！「[？] に すすめなかったら [？]、すすめたら ↑」',
  },
  {
    id: 'adv-q137', zoneId: 'candy', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 2)], goalEmoji: CAKE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'right', thenDir: 'down', elseDir: 'right', holeThen: true, holeElse: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: 'すすめないとき・すすめるとき！「→ に すすめなかったら [？]、すすめたら [？]」',
  },
  {
    id: 'adv-q138', zoneId: 'candy', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 1), r(2, 4)], goalEmoji: CAKE,
    kind: 'branch',
    branchFill: { phases: [{ loopTimes: 8, rule: { sensor: 'down', thenDir: 'right', elseDir: 'down', holeSensor: true, holeThen: true, holeElse: true } }] },
    optimal: 8, maxSlots: 8,
    prompt: '🍭おかしの ボス！ぜんぶ うめてゴール「[？] に すすめなかったら [？]、すすめたら [？]」',
  },

  // ─── 🎁 おもちゃ こうじょう（adv-q139〜adv-q144）proc_b・てじゅんの なかみを きめる ───
  // メインプログラム（call の ならび）は できている。てじゅん(📦)の なかみを きめて ゴールへ。
  // optimal は なかみの 命令数。みじかい なかみでは クリアできないことを adventure.test.ts が検証。
  {
    id: 'adv-q139', zoneId: 'toy', rows: 4, cols: 1, start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: TOYGOAL, gemEmoji: '🎀',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward'],
    optimal: 1, maxSlots: 4,
    prompt: 'てじゅんの なかみを きめて、3かい よんで ゴールへ！',
  },
  {
    id: 'adv-q140', zoneId: 'toy', rows: 5, cols: 1, start: r(4, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: TOYGOAL, gemEmoji: '🎀',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'なんマス すすむ てじゅんに すれば いいかな？',
  },
  {
    id: 'adv-q141', zoneId: 'toy', rows: 3, cols: 3, start: r(2, 0), goal: r(0, 2), startFacing: 'up',
    walls: [], goalEmoji: TOYGOAL, gemEmoji: '🎀',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'のぼって まがって すすむ てじゅんを かんがえよう',
  },
  {
    id: 'adv-q142', zoneId: 'toy', rows: 4, cols: 4, start: r(3, 0), goal: r(3, 2), startFacing: 'up',
    walls: [], goalEmoji: TOYGOAL, gemEmoji: '🎀',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }, 'turn_right', { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'U字に まわる てじゅんを かんがえよう！',
  },
  {
    id: 'adv-q143', zoneId: 'toy', rows: 3, cols: 5, start: r(2, 0), goal: r(0, 4), startFacing: 'up',
    walls: [], gems: [r(0, 0)], goalEmoji: TOYGOAL, gemEmoji: '🎀',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: 'リボン🎀を とおりながら、てじゅんで ゴールへ！',
  },
  {
    id: 'adv-q144', zoneId: 'toy', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [], gems: [r(0, 0)], goalEmoji: TOYGOAL, gemEmoji: '🎀',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }, 'turn_right', { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: '🎁こうじょうの ボス！ てじゅんで どのくらい すすむか きめよう',
  },

  // ─── 💎 ほうせきの どうくつ（adv-q145〜adv-q147）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  // いわ(🪨)を よけて、ほうせき(💎)を ぜんぶ とおってから おうちへ。optimal は solve() の 実測値。
  {
    id: 'adv-q145', zoneId: 'gemcave', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 3)], gems: [r(1, 1), r(2, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろいながら おうちへ いこう',
  },
  {
    id: 'adv-q146', zoneId: 'gemcave', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 4)], gems: [r(1, 1), r(2, 2), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'ほうせき💎が 3つ ならんでる！ ぜんぶ あつめよう',
  },
  {
    id: 'adv-q147', zoneId: 'gemcave', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(4, 4)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: '💎どうくつの ボス！ ほうせきを おとさず すすもう',
  },

  // ─── 🚀 ほしの きち（adv-q148〜adv-q150）そうたい方向・ほしを 2つ ひろう・ループなし ───
  // ロケットの むき が きじゅん。まえへ／みぎをむく／ひだりをむく で ほし(⭐)を 2つ ひろい ロケット(🚀)へ。
  // ほしは まんなか より（はじっこ では ない）。relSolution は solveRelative() の 最短解、optimal は その手数。
  {
    id: 'adv-q148', zoneId: 'starbase', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [r(1, 1)], gems: [r(2, 1), r(1, 2)], goalEmoji: '🚀', gemEmoji: '⭐',
    kind: 'relative',
    relSolution: ['forward', 'turn_right', 'forward', 'forward', 'turn_left', 'forward', 'forward', 'turn_right', 'forward'],
    optimal: 9, maxSlots: 13,
    prompt: 'ほし⭐を 2つ ひろって ロケット🚀へ いこう',
  },
  {
    id: 'adv-q149', zoneId: 'starbase', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [r(1, 1)], gems: [r(3, 1), r(2, 2)], goalEmoji: '🚀', gemEmoji: '⭐',
    kind: 'relative',
    relSolution: ['forward', 'turn_right', 'forward', 'forward', 'turn_left', 'forward', 'forward', 'forward', 'turn_right', 'forward', 'forward'],
    optimal: 11, maxSlots: 15,
    prompt: 'ほし⭐を とおって でんち… じゃなくて ロケット🚀へ',
  },
  {
    id: 'adv-q150', zoneId: 'starbase', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4), startFacing: 'up',
    walls: [r(2, 3)], gems: [r(3, 2), r(1, 2)], goalEmoji: '🚀', gemEmoji: '⭐',
    kind: 'relative',
    relSolution: ['forward', 'turn_right', 'forward', 'forward', 'turn_left', 'forward', 'forward', 'forward', 'turn_right', 'forward', 'forward'],
    optimal: 11, maxSlots: 15,
    prompt: '🚀きちの ボス！ ほし⭐を 2つ あつめて ロケットへ',
  },

  // ─── 🎡 くるくる ふうしゃ（adv-q151〜adv-q152）そうたい×ループ・足場プリフィル ───
  // おなじ うごきは 🔁ループ箱に まとめる。最初から ループ箱が おいてあるので、のこりを たすだけ。
  {
    id: 'adv-q151', zoneId: 'windmill', rows: 5, cols: 1, start: r(4, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [{ kind: 'loop', times: 4, body: ['forward'] }],
    optimal: 1, maxSlots: 5,
    relPrefill: { openLoop: { times: 4, body: [] } },
    prompt: 'ループ箱に「まえへ」を いれて、✅かんりょう！',
  },
  {
    id: 'adv-q152', zoneId: 'windmill', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3), startFacing: 'up',
    walls: [], goalEmoji: '🎯', gemEmoji: '⭐',
    kind: 'relative', allowLoop: true,
    relSolution: [
      { kind: 'loop', times: 3, body: ['forward'] },
      'turn_right',
      { kind: 'loop', times: 3, body: ['forward'] },
    ],
    optimal: 3, maxSlots: 8,
    relPrefill: { cmds: [{ kind: 'loop', times: 3, body: ['forward'] }, 'turn_right'], openLoop: { times: 3, body: [] } },
    prompt: '🎡ふうしゃの ボス！ まがる ところは できてるよ。さいごの ループに「まえへ」を いれてね',
  },

  // ─── 🔧 ふしぎな こうぼう（adv-q153〜adv-q154）proc_b・てじゅんの なかみを きめる ───
  // メインプログラム（call の ならび）は できている。てじゅん(📦)の なかみを きめて ゴールへ。
  {
    id: 'adv-q153', zoneId: 'craft', rows: 4, cols: 1, start: r(3, 0), goal: r(0, 0), startFacing: 'up',
    walls: [], goalEmoji: '🔧', gemEmoji: '🔩',
    kind: 'proc',
    procMain: [{ kind: 'call' }, { kind: 'call' }, { kind: 'call' }],
    procDef: ['forward'],
    optimal: 1, maxSlots: 4,
    prompt: 'てじゅんの なかみを きめて、3かい よんで ゴールへ！',
  },
  {
    id: 'adv-q154', zoneId: 'craft', rows: 3, cols: 3, start: r(2, 0), goal: r(0, 2), startFacing: 'up',
    walls: [], goalEmoji: '🔧', gemEmoji: '🔩',
    kind: 'proc',
    procMain: [{ kind: 'call' }, 'turn_right', { kind: 'call' }],
    procDef: ['forward', 'forward'],
    optimal: 2, maxSlots: 4,
    prompt: '🔧こうぼうの ボス！ のぼって まがって すすむ てじゅんを かんがえよう',
  },

  // ─── 🌋 ようがんの どうくつ（adv-q155〜adv-q157）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  {
    id: 'adv-q155', zoneId: 'lava', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 3)], gems: [r(1, 1), r(2, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろいながら おうちへ いこう',
  },
  {
    id: 'adv-q156', zoneId: 'lava', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 4)], gems: [r(1, 1), r(2, 2), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'ほうせき💎が 3つ ならんでる！ ぜんぶ あつめよう',
  },
  {
    id: 'adv-q157', zoneId: 'lava', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(4, 4)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: '🌋どうくつの ボス！ ようがんを よけて すすもう',
  },

  // ─── 🏖️ すなはまの みち（adv-q158〜adv-q160）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  {
    id: 'adv-q158', zoneId: 'beach', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(3, 3)], gems: [r(2, 1), r(1, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろって おうちへ いこう',
  },
  {
    id: 'adv-q159', zoneId: 'beach', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(0, 0)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'やしのき🌴を よけて ほうせきを あつめよう',
  },
  {
    id: 'adv-q160', zoneId: 'beach', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(5, 5)], gems: [r(4, 1), r(2, 3), r(1, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: '🏖️すなはまの ボス！ ひろい はまべを すすもう',
  },

  // ─── 🌸 はなばたけ（adv-q161〜adv-q163）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  {
    id: 'adv-q161', zoneId: 'flower', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(3, 0)], gems: [r(1, 1), r(2, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろいながら おうちへ いこう',
  },
  {
    id: 'adv-q162', zoneId: 'flower', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(2, 4), r(4, 2)], gems: [r(1, 1), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'チューリップ🌷の あいだを とおろう',
  },
  {
    id: 'adv-q163', zoneId: 'flower', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(0, 5)], gems: [r(1, 1), r(3, 3), r(4, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: '🌸はなばたけの ボス！ ほうせきを おとさず すすもう',
  },

  // ─── ⛰️ いわやまの とりで（adv-q164〜adv-q166）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  {
    id: 'adv-q164', zoneId: 'rock', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(3, 3)], gems: [r(2, 1), r(1, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろって てっぺんへ いこう',
  },
  {
    id: 'adv-q165', zoneId: 'rock', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(2, 2)], gems: [r(3, 1), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'いわ🪨を よけて ほうせきを あつめよう',
  },
  {
    id: 'adv-q166', zoneId: 'rock', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(5, 5)], gems: [r(4, 1), r(3, 2), r(1, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: '⛰️いわやまの ボス！ たかい とりでを のぼろう',
  },

  // ─── 🌃 よぞらの まち（adv-q167〜adv-q169）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  {
    id: 'adv-q167', zoneId: 'night', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(3, 0)], gems: [r(1, 1), r(2, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろいながら おうちへ いこう',
  },
  {
    id: 'adv-q168', zoneId: 'night', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(4, 0)], gems: [r(1, 1), r(2, 2), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'ビル🏢の あいだを とおって あつめよう',
  },
  {
    id: 'adv-q169', zoneId: 'night', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(0, 0)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: '🌃よぞらの ボス！ ひかる ほうせきを あつめよう',
  },

  // ─── 🍂 おちばの こみち（adv-q170〜adv-q172）矢印ならべ・ほうせきを ぜんぶ ひろう ───
  {
    id: 'adv-q170', zoneId: 'leaf', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(0, 0)], gems: [r(2, 1), r(1, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろって おうちへ いこう',
  },
  {
    id: 'adv-q171', zoneId: 'leaf', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(0, 0)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'おちば🍂を よけて ほうせきを あつめよう',
  },
  {
    id: 'adv-q172', zoneId: 'leaf', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(5, 5)], gems: [r(4, 1), r(3, 2), r(2, 3), r(1, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 18, goalEmoji: HOME,
    prompt: '🍂こみちの ボス！ ほうせきを ぜんぶ あつめて おうちへ',
  },

  // ─── 🌈 にじの おか（adv-q173〜adv-q177）矢印ならべ・やさしい入門 ───
  {
    id: 'adv-q173', zoneId: 'rainbow', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 3)], gems: [r(1, 1), r(2, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ほうせき💎を ひろいながら おうちへ いこう',
  },
  {
    id: 'adv-q174', zoneId: 'rainbow', rows: 4, cols: 4, start: r(3, 0), goal: r(0, 3),
    walls: [r(3, 3)], gems: [r(2, 1), r(1, 2)], gemEmoji: CRYSTAL, optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'うえ と みぎ を じゅんばんに ならべよう',
  },
  {
    id: 'adv-q175', zoneId: 'rainbow', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 4)], gems: [r(1, 1), r(2, 2), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'ほうせき💎が 3つ ならんでる！ ぜんぶ あつめよう',
  },
  {
    id: 'adv-q176', zoneId: 'rainbow', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(4, 4)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'くも☁️を よけて ほうせきを あつめよう',
  },
  {
    id: 'adv-q177', zoneId: 'rainbow', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(0, 5)], gems: [r(1, 1), r(2, 2), r(3, 3), r(4, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: '🌈にじの ボス！ ほうせきを おとさず すすもう',
  },

  // ─── 🍄 きのこの もり（adv-q178〜adv-q182）矢印ならべ・かべ多め ───
  {
    id: 'adv-q178', zoneId: 'mushroom', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 4), r(4, 0)], gems: [r(1, 1), r(2, 2), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'きのこ🍄を よけて ほうせきを あつめよう',
  },
  {
    id: 'adv-q179', zoneId: 'mushroom', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(4, 4), r(0, 0)], gems: [r(3, 1), r(2, 2), r(1, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'うえ と みぎ を こうごに ならべよう',
  },
  {
    id: 'adv-q180', zoneId: 'mushroom', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 4), r(2, 0)], gems: [r(1, 2), r(2, 2), r(3, 2)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'まんなかの みちを とおって あつめよう',
  },
  {
    id: 'adv-q181', zoneId: 'mushroom', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(0, 5), r(5, 0)], gems: [r(1, 1), r(2, 2), r(3, 3), r(4, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: 'ほうせき💎が 4つ！ じゅんばんに ひろおう',
  },
  {
    id: 'adv-q182', zoneId: 'mushroom', rows: 6, cols: 6, start: r(5, 0), goal: r(0, 5),
    walls: [r(5, 5), r(0, 0)], gems: [r(4, 1), r(3, 2), r(2, 3), r(1, 4)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: '🍄もりの ボス！ かいだんを のぼるように すすもう',
  },

  // ─── 🏝️ たからじまの ぼうけん（adv-q183〜adv-q187）矢印ならべ・まんなか/すみっこの たから ───
  {
    id: 'adv-q183', zoneId: 'island', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(0, 4)], gems: [r(1, 1), r(2, 2), r(3, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'まんなかの たからを とおって おうちへ',
  },
  {
    id: 'adv-q184', zoneId: 'island', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(2, 2), r(1, 3), r(3, 1)], gemEmoji: CRYSTAL, optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'まんなかと さゆうの たからを あつめよう',
  },
  {
    id: 'adv-q185', zoneId: 'island', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(2, 2), r(4, 0)], gemEmoji: CRYSTAL, optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'まんなかと すみっこの たからを とりに いこう',
  },
  {
    id: 'adv-q186', zoneId: 'island', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(2, 2), r(0, 4), r(4, 0)], gemEmoji: CRYSTAL, optimal: 16, maxSlots: 22, goalEmoji: HOME,
    prompt: 'すみっこ ふたつと まんなかの たから！ じゅんばんを かんがえよう',
  },
  {
    id: 'adv-q187', zoneId: 'island', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [], gems: [r(2, 2), r(3, 3), r(0, 5), r(5, 0)], gemEmoji: CRYSTAL, optimal: 22, maxSlots: 26, goalEmoji: HOME,
    prompt: '🏝️たからじまの ボス！ まんなかと すみっこの たからを ぜんぶ あつめよう',
  },

  // ─── 🧱 まわりみちの とりで（adv-q188〜adv-q192）矢印ならべ・かべを ぐるっと まわる ───
  {
    id: 'adv-q188', zoneId: 'detour', rows: 4, cols: 4, start: r(0, 0), goal: r(0, 3),
    walls: [r(0, 1), r(0, 2)], gems: [], optimal: 5, maxSlots: 11, goalEmoji: HOME,
    prompt: 'まっすぐ いけない！ したを とおって おうちへ',
  },
  {
    id: 'adv-q189', zoneId: 'detour', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 0),
    walls: [r(1, 0), r(2, 0)], gems: [], optimal: 5, maxSlots: 11, goalEmoji: HOME,
    prompt: 'かべを よけて、よこから まわりこもう',
  },
  {
    id: 'adv-q190', zoneId: 'detour', rows: 5, cols: 5, start: r(0, 0), goal: r(0, 4),
    walls: [r(0, 2), r(1, 2), r(2, 2), r(3, 2)], gems: [], optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'ながい かべ！ したの すきまから むこうがわへ',
  },
  {
    id: 'adv-q191', zoneId: 'detour', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 1), r(1, 2), r(1, 3), r(1, 4), r(3, 0), r(3, 1), r(3, 2), r(3, 3)],
    gems: [r(2, 2)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'くねくね みち！ すきまを さがして たからを ひろおう',
  },
  {
    id: 'adv-q192', zoneId: 'detour', rows: 6, cols: 6, start: r(0, 0), goal: r(0, 5),
    walls: [r(0, 3), r(1, 3), r(2, 3), r(3, 3), r(4, 3)], gems: [r(5, 1)], gemEmoji: CRYSTAL, optimal: 15, maxSlots: 22, goalEmoji: HOME,
    prompt: '🧱とりでの ボス！ おおまわりして たからを もってかえろう',
  },

  // ─── 🔦 あともどりの どうくつ（adv-q193〜adv-q197）矢印ならべ・ゴールと逆の たからを とる ───
  {
    id: 'adv-q193', zoneId: 'backtrack', rows: 4, cols: 4, start: r(0, 3), goal: r(3, 3),
    walls: [], gems: [r(0, 0)], gemEmoji: CRYSTAL, optimal: 9, maxSlots: 15, goalEmoji: HOME,
    prompt: 'たから💎は はんたいがわ！ とってから おうちへ',
  },
  {
    id: 'adv-q194', zoneId: 'backtrack', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [], gems: [r(3, 0), r(0, 3)], gemEmoji: CRYSTAL, optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'りょうがわの すみの たからを とりに いこう',
  },
  {
    id: 'adv-q195', zoneId: 'backtrack', rows: 5, cols: 5, start: r(4, 0), goal: r(4, 4),
    walls: [], gems: [r(0, 0)], gemEmoji: CRYSTAL, optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'うえに ある たからを とって、もどって ゴールへ',
  },
  {
    id: 'adv-q196', zoneId: 'backtrack', rows: 5, cols: 5, start: r(0, 0), goal: r(0, 4),
    walls: [], gems: [r(4, 0), r(4, 4)], gemEmoji: CRYSTAL, optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'したの すみ ふたつを まわってから もどろう',
  },
  {
    id: 'adv-q197', zoneId: 'backtrack', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 0),
    walls: [], gems: [r(0, 5), r(5, 5)], gemEmoji: CRYSTAL, optimal: 15, maxSlots: 21, goalEmoji: HOME,
    prompt: '🔦どうくつの ボス！ むこうの すみを まわって もどってこよう',
  },

  // ─── 🔒 とじこめられた たから（adv-q198〜adv-q202）矢印ならべ・へやに 入って 出る ───
  {
    id: 'adv-q198', zoneId: 'vault', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [r(0, 2)], gems: [r(0, 3)], gemEmoji: CRYSTAL, optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'すみの たから💎へ、したから まわって とりに いこう',
  },
  {
    id: 'adv-q199', zoneId: 'vault', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 0),
    walls: [r(1, 3)], gems: [r(0, 3)], gemEmoji: CRYSTAL, optimal: 9, maxSlots: 15, goalEmoji: HOME,
    prompt: 'たから💎を とったら、もどって ゴールへ',
  },
  {
    id: 'adv-q200', zoneId: 'vault', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 0), r(3, 0)], gems: [r(2, 0)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: 'よこの いりぐちから へやに 入って、たからを とって 出よう',
  },
  {
    id: 'adv-q201', zoneId: 'vault', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 2), r(2, 1), r(2, 3)], gems: [r(2, 2)], gemEmoji: CRYSTAL, optimal: 10, maxSlots: 16, goalEmoji: HOME,
    prompt: 'まんなかの へやは いりぐちが ひとつ！ 入って 出よう',
  },
  {
    id: 'adv-q202', zoneId: 'vault', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(2, 2), r(3, 1), r(3, 3)], gems: [r(3, 2), r(0, 5)], gemEmoji: CRYSTAL, optimal: 18, maxSlots: 24, goalEmoji: HOME,
    prompt: '🔒たからべやの ボス！ へやの たからと とおくの たから、ぜんぶ あつめよう',
  },

  // ─── 👻 おばけの まよいみち（adv-q203〜adv-q207）矢印ならべ・固定ゾンビを よける ───
  {
    id: 'adv-q203', zoneId: 'ghost', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 3),
    walls: [], zombies: [{ kind: 'fixed', pos: r(1, 1) }, { kind: 'fixed', pos: r(2, 2) }],
    optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'おばけ🧟を よけて おうちへ いこう',
  },
  {
    id: 'adv-q204', zoneId: 'ghost', rows: 4, cols: 4, start: r(0, 0), goal: r(0, 3),
    walls: [], zombies: [{ kind: 'fixed', pos: r(0, 1) }, { kind: 'fixed', pos: r(0, 2) }],
    gems: [], optimal: 5, maxSlots: 11, goalEmoji: HOME,
    prompt: 'おばけが みちを ふさいでる！ したから まわろう',
  },
  {
    id: 'adv-q205', zoneId: 'ghost', rows: 5, cols: 5, start: r(0, 0), goal: r(0, 4),
    walls: [],
    zombies: [{ kind: 'fixed', pos: r(0, 2) }, { kind: 'fixed', pos: r(1, 2) }, { kind: 'fixed', pos: r(2, 2) }, { kind: 'fixed', pos: r(3, 2) }],
    gems: [r(4, 0)], gemEmoji: CRYSTAL, optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'おばけの かべ！ したを とおって むこうへ まわろう',
  },
  {
    id: 'adv-q206', zoneId: 'ghost', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [],
    zombies: [{ kind: 'fixed', pos: r(1, 0) }, { kind: 'fixed', pos: r(1, 1) }, { kind: 'fixed', pos: r(1, 2) }, { kind: 'fixed', pos: r(1, 3) }, { kind: 'fixed', pos: r(3, 1) }, { kind: 'fixed', pos: r(3, 2) }, { kind: 'fixed', pos: r(3, 3) }, { kind: 'fixed', pos: r(3, 4) }],
    gems: [], optimal: 16, maxSlots: 22, goalEmoji: HOME,
    prompt: 'おばけの れつを ヘビのように よけて すすもう',
  },
  {
    id: 'adv-q207', zoneId: 'ghost', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [],
    zombies: [{ kind: 'fixed', pos: r(1, 0) }, { kind: 'fixed', pos: r(1, 1) }, { kind: 'fixed', pos: r(1, 2) }, { kind: 'fixed', pos: r(1, 3) }, { kind: 'fixed', pos: r(1, 4) }, { kind: 'fixed', pos: r(3, 1) }, { kind: 'fixed', pos: r(3, 2) }, { kind: 'fixed', pos: r(3, 3) }, { kind: 'fixed', pos: r(3, 4) }, { kind: 'fixed', pos: r(3, 5) }],
    gems: [r(2, 2)], gemEmoji: CRYSTAL, optimal: 20, maxSlots: 26, goalEmoji: HOME,
    prompt: '👻まよいみちの ボス！ おばけの れつを よけて たからを とろう',
  },

  // ─── 🌀 うずまきの とう（adv-q208〜adv-q212）矢印ならべ・くねくね まいて すすむ ───
  {
    id: 'adv-q208', zoneId: 'spiral', rows: 3, cols: 3, start: r(0, 0), goal: r(0, 2),
    walls: [r(0, 1), r(1, 1)], gems: [], optimal: 6, maxSlots: 12, goalEmoji: HOME,
    prompt: 'ぐるっと まわって おうちへ',
  },
  {
    id: 'adv-q209', zoneId: 'spiral', rows: 4, cols: 4, start: r(0, 0), goal: r(3, 0),
    walls: [r(1, 0), r(1, 1), r(1, 2)], gems: [], optimal: 9, maxSlots: 15, goalEmoji: HOME,
    prompt: 'かべを まわりこんで くるっと すすもう',
  },
  {
    id: 'adv-q210', zoneId: 'spiral', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 0),
    walls: [r(1, 0), r(1, 1), r(1, 2), r(1, 3), r(3, 1), r(3, 2), r(3, 3), r(3, 4)],
    gems: [], optimal: 12, maxSlots: 18, goalEmoji: HOME,
    prompt: 'くねくね みちを ヘビのように すすもう',
  },
  {
    id: 'adv-q211', zoneId: 'spiral', rows: 5, cols: 5, start: r(0, 0), goal: r(2, 2),
    walls: [r(1, 1), r(1, 2), r(1, 3), r(2, 1), r(2, 3), r(3, 1), r(3, 3)],
    gems: [], optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'うずまきの まんなかへ ぐるっと はいろう',
  },
  {
    id: 'adv-q212', zoneId: 'spiral', rows: 6, cols: 6, start: r(0, 0), goal: r(5, 5),
    walls: [r(1, 0), r(1, 1), r(1, 2), r(1, 3), r(1, 4), r(3, 1), r(3, 2), r(3, 3), r(3, 4), r(3, 5)],
    gems: [r(2, 2)], gemEmoji: CRYSTAL, optimal: 20, maxSlots: 26, goalEmoji: HOME,
    prompt: '🌀とうの ボス！ くねくね まいて おくの たからを とろう',
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
