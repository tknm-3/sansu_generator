// スーパーマーケットの くに タングラム問題の データ。
// 正解は つねに choices[0]（generate がわで シャッフルする）。
// 座標は viewBox "0 0 200 120"（ComposeSvg と そろえる）。

import type { RawTangram } from './tangramShapes';
import {
  triUp,
  triDown,
  rect,
  diamond,
  hole,
  BLUE,
  GREEN,
  ORANGE,
  PURPLE,
  YELLOW,
  RED,
} from './tangramShapes';

// circle は タングラム外（ダミー専用）
function circle(cx: number, cy: number, r: number, color: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="white" stroke-width="2"/>`;
}

// ════════════════════════════════════════════════════════════════
// ゾーン1: くみあわせ（compose）— ピースを あわせると なにが できる？
// お題＝はなして ならべた ピース、選択肢＝できあがりの シルエット
// ════════════════════════════════════════════════════════════════
export const TANGRAM_COMPOSE: RawTangram[] = [
  {
    // △ ＋ △ → ましかく（チーズ）。直角三角2枚で 四角に なるのが 見えるよう 直角三角で見せる
    questionLabel: 'さんかく ＋ さんかく で なにが できる？',
    questionSvg: `<polygon points="25,35 25,95 90,95" fill="${BLUE}" stroke="white" stroke-width="2"/><polygon points="180,35 180,95 115,95" fill="${GREEN}" stroke="white" stroke-width="2"/>`,
    choices: [
      { label: 'ましかく', svg: rect(60, 20, 80, 80, YELLOW) },
      { label: 'ながしかく', svg: rect(20, 45, 160, 45, ORANGE) },
      { label: 'さんかく', svg: triUp(40, 20, 120, 85, GREEN) },
      { label: 'ダイヤ', svg: diamond(100, 60, 55, 50, PURPLE) },
    ],
  },
  {
    // □ ＋ △ → いえの かたち（ぎゅうにゅうパック）
    questionLabel: 'しかく ＋ さんかく で なにが できる？',
    questionSvg: `${rect(25, 50, 60, 55, BLUE)}${triUp(115, 40, 70, 60, ORANGE)}`,
    choices: [
      { label: 'いえの かたち', svg: `${rect(70, 50, 60, 50, BLUE)}${triUp(70, 15, 60, 40, ORANGE)}` },
      { label: 'ながしかく', svg: rect(20, 45, 160, 45, GREEN) },
      { label: 'ダイヤ', svg: diamond(100, 60, 55, 50, PURPLE) },
      { label: 'ましかく', svg: rect(65, 20, 70, 70, RED) },
    ],
  },
  {
    // □ ＋ □ → ながしかく（チョコ）
    questionLabel: 'しかく ＋ しかく で なにが できる？',
    questionSvg: `${rect(25, 40, 60, 50, BLUE)}${rect(115, 40, 60, 50, GREEN)}`,
    choices: [
      { label: 'ながしかく', svg: rect(20, 40, 160, 50, ORANGE) },
      { label: 'ましかく', svg: rect(60, 20, 80, 80, PURPLE) },
      { label: 'いえの かたち', svg: `${rect(70, 50, 60, 50, BLUE)}${triUp(70, 15, 60, 40, GREEN)}` },
      { label: 'さんかく', svg: triUp(40, 20, 120, 85, RED) },
    ],
  },
  {
    // △ ＋ □ ＋ △ → ロケット（ロケットアイス）
    questionLabel: 'さんかく ＋ しかく ＋ さんかく で なにが できる？',
    questionSvg: `${triUp(12, 40, 50, 45, RED)}${rect(78, 40, 45, 45, BLUE)}${triDown(140, 40, 50, 45, GREEN)}`,
    choices: [
      { label: 'ロケット', svg: `${triUp(75, 8, 50, 40, RED)}${rect(75, 45, 50, 45, BLUE)}${triDown(75, 90, 50, 25, GREEN)}` },
      { label: 'いえの かたち', svg: `${rect(70, 50, 60, 50, BLUE)}${triUp(70, 15, 60, 40, ORANGE)}` },
      { label: 'ダイヤ', svg: diamond(100, 60, 55, 50, PURPLE) },
      { label: 'ながしかく', svg: rect(20, 40, 160, 50, ORANGE) },
    ],
  },
  {
    // □ ＋ □ ＋ □ → ながーいしかく（おかしの はこ）
    questionLabel: 'しかく ３つで なにが できる？',
    questionSvg: `${rect(15, 40, 50, 45, BLUE)}${rect(75, 40, 50, 45, GREEN)}${rect(135, 40, 50, 45, ORANGE)}`,
    choices: [
      { label: 'ながーい しかく', svg: rect(15, 42, 170, 40, PURPLE) },
      { label: 'ましかく', svg: rect(65, 20, 70, 70, ORANGE) },
      { label: 'かいだん', svg: `${rect(20, 65, 50, 35, BLUE)}${rect(75, 42, 50, 58, BLUE)}${rect(130, 20, 50, 80, BLUE)}` },
      { label: 'L の かたち', svg: `${rect(40, 15, 45, 85, BLUE)}${rect(40, 60, 120, 40, BLUE)}` },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// ゾーン2: たりないピース（missing）— あなに ぴったり あう ピースは？
// お題＝ほぼ できた かたち（1ヶ所が 点線の あな）、選択肢＝ピース（正解は あなと 合同）
// ════════════════════════════════════════════════════════════════
export const TANGRAM_MISSING: RawTangram[] = [
  {
    // ましかく（チーズ）の みぎうえ さんかくが あな
    questionLabel: 'たりない ところに ぴったり あう ピースは？',
    questionSvg: `<polygon points="50,20 50,100 150,100" fill="${BLUE}" stroke="white" stroke-width="2"/>${hole('50,20 150,20 150,100')}`,
    choices: [
      { label: 'おおきい さんかく', svg: `<polygon points="50,20 150,20 150,100" fill="${RED}" stroke="white" stroke-width="2"/>` },
      { label: 'ちいさい さんかく', svg: triUp(70, 40, 60, 50, GREEN) },
      { label: 'ましかく', svg: rect(60, 25, 80, 70, ORANGE) },
      { label: 'ほそい さんかく', svg: `<polygon points="85,20 115,20 115,100" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
    ],
  },
  {
    // ながしかく（しょくパン）の みぎはんぶんが あな（しかく）
    questionLabel: 'たりない ところに ぴったり あう ピースは？',
    questionSvg: `${rect(30, 35, 70, 50, BLUE)}${hole('100,35 170,35 170,85 100,85')}`,
    choices: [
      { label: 'しかく', svg: rect(65, 35, 70, 50, GREEN) },
      { label: 'さんかく', svg: triUp(65, 35, 70, 50, ORANGE) },
      { label: 'おおきい しかく', svg: rect(50, 25, 100, 70, PURPLE) },
      { label: 'ほそい しかく', svg: rect(85, 25, 30, 70, RED) },
    ],
  },
  {
    // いえ（ぎゅうにゅうパック）の やね（さんかく）が あな
    questionLabel: 'たりない ところに ぴったり あう ピースは？',
    questionSvg: `${rect(60, 55, 80, 50, BLUE)}${hole('60,55 140,55 100,15')}`,
    choices: [
      { label: 'さんかく', svg: triUp(60, 40, 80, 45, ORANGE) },
      { label: 'しかく', svg: rect(65, 40, 70, 50, GREEN) },
      { label: 'ちいさい さんかく', svg: triUp(80, 45, 40, 35, PURPLE) },
      { label: 'ダイヤ', svg: diamond(100, 60, 45, 40, RED) },
    ],
  },
  {
    // だいけい（サンドイッチ）の みぎはしの さんかくが あな
    questionLabel: 'たりない ところに ぴったり あう ピースは？',
    questionSvg: `<polygon points="40,95 70,40 70,95" fill="${BLUE}" stroke="white" stroke-width="2"/>${rect(70, 40, 60, 55, GREEN)}${hole('130,40 130,95 160,95')}`,
    choices: [
      { label: 'さんかく', svg: `<polygon points="130,40 130,95 160,95" fill="${RED}" stroke="white" stroke-width="2"/>` },
      { label: 'おおきい さんかく', svg: triUp(60, 40, 80, 55, ORANGE) },
      { label: 'しかく', svg: rect(80, 40, 40, 55, PURPLE) },
      { label: 'ちがう むきの さんかく', svg: `<polygon points="130,40 160,40 160,95" fill="${GREEN}" stroke="white" stroke-width="2"/>` },
    ],
  },
  {
    // ロケットアイスの さきっぽ（さんかく）が あな
    questionLabel: 'たりない ところに ぴったり あう ピースは？',
    questionSvg: `${rect(78, 45, 45, 45, BLUE)}${triDown(78, 90, 45, 22, GREEN)}${hole('78,45 123,45 100,10')}`,
    choices: [
      { label: 'さんかく', svg: triUp(78, 40, 45, 40, RED) },
      { label: 'しかく', svg: rect(75, 40, 50, 50, ORANGE) },
      { label: 'ダイヤ', svg: diamond(100, 60, 45, 40, PURPLE) },
      { label: 'ちいさい さんかく', svg: triUp(88, 50, 25, 30, GREEN) },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// ゾーン3: ぶんかい（decompose）— どの ピースで できてる？
// お題＝しなものの シルエット、選択肢＝バラした ピースぐみ（正解は その くみあわせ）
// ════════════════════════════════════════════════════════════════
export const TANGRAM_DECOMPOSE: RawTangram[] = [
  {
    // ましかく（チーズ）→ さんかく と さんかく
    questionLabel: 'この チーズは どの ピースで できてる？',
    questionSvg: rect(60, 20, 80, 80, YELLOW),
    choices: [
      { label: 'さんかく と さんかく', svg: `<polygon points="20,30 90,30 20,90" fill="${BLUE}" stroke="white" stroke-width="2"/><polygon points="110,90 180,90 180,30" fill="${GREEN}" stroke="white" stroke-width="2"/>` },
      { label: 'しかく と しかく', svg: `${rect(20, 30, 70, 60, BLUE)}${rect(110, 30, 70, 60, GREEN)}` },
      { label: 'しかく と さんかく', svg: `${rect(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
      { label: 'さんかく ３つ', svg: `${triUp(15, 35, 50, 55, BLUE)}${triUp(75, 35, 50, 55, GREEN)}${triUp(135, 35, 50, 55, ORANGE)}` },
    ],
  },
  {
    // ダイヤ（あめ）→ さんかく と さんかく
    questionLabel: 'この あめは どの ピースで できてる？',
    questionSvg: diamond(100, 60, 70, 50, PURPLE),
    choices: [
      { label: 'さんかく と さんかく', svg: `${triDown(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
      { label: 'しかく と しかく', svg: `${rect(20, 30, 70, 60, BLUE)}${rect(110, 30, 70, 60, GREEN)}` },
      { label: 'まる と さんかく', svg: `${circle(55, 60, 38, YELLOW)}${triUp(110, 30, 70, 60, GREEN)}` },
      { label: 'しかく と さんかく', svg: `${rect(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
    ],
  },
  {
    // いえ（ぎゅうにゅうパック）→ しかく と さんかく
    questionLabel: 'この ぎゅうにゅうパックは どの ピースで できてる？',
    questionSvg: `${rect(60, 55, 80, 50, BLUE)}${triUp(60, 15, 80, 40, ORANGE)}`,
    choices: [
      { label: 'しかく と さんかく', svg: `${rect(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
      { label: 'さんかく と さんかく', svg: `${triUp(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
      { label: 'しかく と しかく', svg: `${rect(20, 30, 70, 60, BLUE)}${rect(110, 30, 70, 60, GREEN)}` },
      { label: 'さんかく ３つ', svg: `${triUp(15, 35, 50, 55, BLUE)}${triUp(75, 35, 50, 55, GREEN)}${triUp(135, 35, 50, 55, ORANGE)}` },
    ],
  },
  {
    // ながしかく（チョコ）→ しかく と しかく
    questionLabel: 'この チョコは どの ピースで できてる？',
    questionSvg: rect(20, 40, 160, 50, ORANGE),
    choices: [
      { label: 'しかく と しかく', svg: `${rect(20, 30, 70, 60, BLUE)}${rect(110, 30, 70, 60, GREEN)}` },
      { label: 'しかく ３つ', svg: `${rect(15, 35, 50, 55, BLUE)}${rect(75, 35, 50, 55, GREEN)}${rect(135, 35, 50, 55, ORANGE)}` },
      { label: 'さんかく と さんかく', svg: `${triUp(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
      { label: 'さんかく と しかく', svg: `${triUp(20, 30, 70, 60, BLUE)}${rect(110, 30, 70, 60, GREEN)}` },
    ],
  },
  {
    // ロケットアイス → さんかく と しかく と さんかく
    questionLabel: 'この ロケットアイスは どの ピースで できてる？',
    questionSvg: `${triUp(75, 8, 50, 40, RED)}${rect(75, 48, 50, 45, BLUE)}${triDown(75, 93, 50, 22, GREEN)}`,
    choices: [
      { label: 'さんかく と しかく と さんかく', svg: `${triUp(10, 35, 50, 50, RED)}${rect(75, 35, 50, 50, BLUE)}${triDown(140, 35, 50, 50, GREEN)}` },
      { label: 'しかく ３つ', svg: `${rect(15, 35, 50, 55, BLUE)}${rect(75, 35, 50, 55, GREEN)}${rect(135, 35, 50, 55, ORANGE)}` },
      { label: 'さんかく ３つ', svg: `${triUp(15, 35, 50, 55, RED)}${triUp(75, 35, 50, 55, BLUE)}${triUp(135, 35, 50, 55, GREEN)}` },
      { label: 'しかく と さんかく', svg: `${rect(20, 30, 70, 60, BLUE)}${triUp(110, 30, 70, 60, GREEN)}` },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// ゾーン4: つづき・おうよう（advanced）— ピースを 3〜4まい つかって もっと
// むずかしい かたちを つくる。だいけい・ダイヤ・おおきい さんかく/ましかく など。
// お題＝はなして（でも だいたいの ならびで）おいた ピース、選択肢＝できあがり。
// ════════════════════════════════════════════════════════════════
export const TANGRAM_ADVANCED: RawTangram[] = [
  {
    // さんかく ４つ → おおきい さんかく（おおきい ケーキ）
    questionLabel: 'さんかく ４つで なにが できる？',
    questionSvg: `${triUp(82, 12, 36, 34, RED)}${triUp(46, 60, 36, 34, BLUE)}${triDown(64, 60, 36, 34, GREEN)}${triUp(118, 60, 36, 34, ORANGE)}`,
    choices: [
      { label: 'おおきい さんかく', svg: triUp(40, 18, 120, 84, RED) },
      { label: 'ましかく', svg: rect(60, 20, 80, 80, YELLOW) },
      { label: 'ながしかく', svg: rect(20, 45, 160, 40, ORANGE) },
      { label: 'ダイヤ', svg: diamond(100, 60, 55, 48, PURPLE) },
    ],
  },
  {
    // しかく ４つ → おおきい ましかく（チョコの はこ・2×2）
    questionLabel: 'しかく ４つで なにが できる？',
    questionSvg: `${rect(60, 18, 38, 38, BLUE)}${rect(102, 18, 38, 38, GREEN)}${rect(60, 60, 38, 38, ORANGE)}${rect(102, 60, 38, 38, PURPLE)}`,
    choices: [
      { label: 'おおきい ましかく', svg: rect(58, 16, 84, 84, YELLOW) },
      { label: 'ながしかく', svg: rect(20, 45, 160, 40, ORANGE) },
      { label: 'さんかく', svg: triUp(40, 20, 120, 80, RED) },
      { label: 'だいけい', svg: `<polygon points="55,95 80,35 120,35 145,95" fill="${GREEN}" stroke="white" stroke-width="2"/>` },
    ],
  },
  {
    // さんかく ２つ ＋ しかく → だいけい（サンドイッチ）
    questionLabel: 'さんかく ＋ しかく ＋ さんかく で なにが できる？',
    questionSvg: `<polygon points="40,95 80,40 80,95" fill="${RED}" stroke="white" stroke-width="2"/>${rect(82, 40, 55, 55, BLUE)}<polygon points="139,95 139,40 179,95" fill="${GREEN}" stroke="white" stroke-width="2"/>`,
    choices: [
      { label: 'だいけい', svg: `<polygon points="45,95 80,35 120,35 155,95" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
      { label: 'ながしかく', svg: rect(20, 45, 160, 40, ORANGE) },
      { label: 'さんかく', svg: triUp(40, 20, 120, 80, RED) },
      { label: 'ましかく', svg: rect(60, 20, 80, 80, YELLOW) },
    ],
  },
  {
    // さんかく ２つ → ダイヤ（あめ）
    questionLabel: 'さんかく ２つで なにが できる？',
    questionSvg: `${triUp(60, 22, 80, 40, BLUE)}${triDown(60, 66, 80, 40, GREEN)}`,
    choices: [
      { label: 'ダイヤ', svg: diamond(100, 60, 55, 48, PURPLE) },
      { label: 'ましかく', svg: rect(60, 20, 80, 80, YELLOW) },
      { label: 'ながしかく', svg: rect(20, 45, 160, 40, ORANGE) },
      { label: 'おおきい さんかく', svg: triUp(40, 18, 120, 84, RED) },
    ],
  },
  {
    // しかく ＋ さんかく ２つ → おおきい いえ（やね＝さんかく２つ）
    questionLabel: 'しかく ＋ さんかく ２つで なにが できる？',
    questionSvg: `${rect(65, 60, 70, 45, BLUE)}<polygon points="65,56 100,18 100,56" fill="${ORANGE}" stroke="white" stroke-width="2"/><polygon points="100,18 135,56 100,56" fill="${RED}" stroke="white" stroke-width="2"/>`,
    choices: [
      { label: 'おおきい いえ', svg: `${rect(65, 55, 70, 50, BLUE)}${triUp(60, 15, 80, 42, ORANGE)}` },
      { label: 'ましかく', svg: rect(60, 20, 80, 80, YELLOW) },
      { label: 'ながしかく', svg: rect(20, 45, 160, 40, ORANGE) },
      { label: 'だいけい', svg: `<polygon points="55,95 80,35 120,35 145,95" fill="${PURPLE}" stroke="white" stroke-width="2"/>` },
    ],
  },
];
