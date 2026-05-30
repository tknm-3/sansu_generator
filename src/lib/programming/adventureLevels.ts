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
  /** ── 盤面の みため（ゾーンの せかいかんに あわせる）── */
  /** かべの 絵文字（森なら 木、さばくなら サボテン…） */
  wall: string;
  /** ふつうの マスの 色（Tailwind） */
  tile: string;
  /** かべマスの 色（Tailwind） */
  wallTile: string;
  /** 盤面ぜんたいの 背景（Tailwind） */
  board: string;
}

/** 問題集の 1問。Level に ゾーン所属と 検証用の解を そえたもの */
export interface AdventureQuest extends Level {
  zoneId: string;
  /** 検証・ヒント用の 解の一例（なければ solve() で 検証する） */
  solution?: Dir[];
}

export const ADVENTURE_ZONES: AdventureZone[] = [
  {
    id: 'forest',
    name: 'はじまりの もり',
    emoji: '🌳',
    bg: 'from-emerald-100 to-teal-50',
    accent: 'emerald',
    tagline: 'やじるしを ならべて みちを つくろう',
    wall: '🌳', tile: 'bg-emerald-50', wallTile: 'bg-emerald-200', board: 'bg-emerald-200/70',
  },
  {
    id: 'valley',
    name: 'くりかえしの たに',
    emoji: '🔁',
    bg: 'from-violet-100 to-fuchsia-50',
    accent: 'violet',
    tagline: 'おなじ うごきは ループ箱が べんり！',
    wall: '🪨', tile: 'bg-violet-50', wallTile: 'bg-violet-200', board: 'bg-violet-200/70',
  },
  {
    id: 'desert',
    name: 'せつやくの さばく',
    emoji: '🧭',
    bg: 'from-amber-100 to-orange-50',
    accent: 'amber',
    tagline: 'やじるしの かずが かぎられているよ',
    wall: '🌵', tile: 'bg-amber-50', wallTile: 'bg-amber-200', board: 'bg-amber-200/70',
  },
  {
    id: 'zombie',
    name: 'ゾンビの たに',
    emoji: '🧟',
    bg: 'from-lime-100 to-green-50',
    accent: 'lime',
    tagline: 'ゾンビを よけて すすもう',
    wall: '🪦', tile: 'bg-lime-50', wallTile: 'bg-lime-300', board: 'bg-lime-300/70',
  },
  {
    id: 'castle',
    name: 'まほうの しろ',
    emoji: '🏰',
    bg: 'from-sky-100 to-indigo-50',
    accent: 'indigo',
    tagline: 'いままでの ちからを ぜんぶ つかおう！',
    wall: '🧱', tile: 'bg-slate-100', wallTile: 'bg-slate-400', board: 'bg-slate-300/70',
  },
];

const GEM = '🎁';
const HOME = '🏠';

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
    id: 'adv-q06', zoneId: 'forest', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [r(1, 1), r(1, 2), r(3, 2), r(3, 3)], optimal: 8, maxSlots: 12, goalEmoji: HOME,
    prompt: 'はしっこを つかって まわりこもう',
  },

  // ───────── 🔁 くりかえしの たに（7〜12）ループ箱の とうにゅう ─────────
  {
    id: 'adv-q07', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 0),
    walls: [], optimal: 4, maxSlots: 10, allowLoop: true, goalEmoji: HOME,
    prompt: 'した した した した…🔁で まとめられるよ',
  },
  {
    id: 'adv-q08', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(0, 4),
    walls: [], optimal: 4, maxSlots: 10, allowLoop: true, goalEmoji: HOME,
    prompt: 'みぎへ まっすぐ。ループ箱を つかおう',
  },
  {
    id: 'adv-q09', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: HOME,
    prompt: 'した4かい と みぎ4かい。ループ2こで いけるね',
  },
  {
    id: 'adv-q10', zoneId: 'valley', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [], optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: HOME,
    prompt: 'うえ と みぎを くりかえそう',
  },
  {
    id: 'adv-q11', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(4, 0)], gemEmoji: GEM, optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: HOME,
    prompt: 'したの たからばこ🎁を とってから おうちへ',
  },
  {
    id: 'adv-q12', zoneId: 'valley', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(0, 4)], gemEmoji: GEM, optimal: 8, maxSlots: 12, allowLoop: true, goalEmoji: HOME,
    prompt: 'みぎの たからばこ🎁を とってから おうちへ',
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
    id: 'adv-q18', zoneId: 'desert', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [r(1, 2), r(2, 1)], optimal: 8, maxSlots: 8, allowLoop: true, goalEmoji: HOME,
    prompt: 'かべを よけても ぴったり 8こで いけるよ',
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
    id: 'adv-q24', zoneId: 'zombie', rows: 5, cols: 5, start: r(4, 0), goal: r(0, 4),
    walls: [], gems: [r(2, 2)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(1, 1) }, { kind: 'fixed', pos: r(3, 3) }],
    optimal: 8, maxSlots: 14, goalEmoji: HOME,
    prompt: 'たからばこ🎁を とって みぎうえの おうちへ',
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
    id: 'adv-q30', zoneId: 'castle', rows: 5, cols: 5, start: r(0, 0), goal: r(4, 4),
    walls: [], gems: [r(0, 4), r(4, 0)], gemEmoji: GEM,
    zombies: [{ kind: 'fixed', pos: r(2, 2) }],
    optimal: 16, maxSlots: 24, allowLoop: true, goalEmoji: HOME,
    prompt: 'さいごの ぼうけん！ たからばこ2つを とって おうちへ',
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
