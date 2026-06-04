# 冒険モード（ぼうけんしよう）アーキテクチャ早見表

> 目的: 冒険モードを いじるとき、**ソースを全部読まずに「どこを見ればいいか」だけ**で
> 動けるようにするための地図。行番号は変わるので **シンボル名で Grep** して飛ぶ。
> 体験設計（世界観・なぜ）は `design/adventure-philosophy.md`、文言ルールは親 SKILL.md を見る。

## 1. 全体像（3層）
- **データ**: `src/lib/programming/adventureLevels.ts` … 13ゾーン＋78クエスト＋物語
  （ゾーン1つ＝6問。マップの宿場 `STOPS` が6つなので **1ゾーンは最大6問**）
- **ロジック/永続化**: `src/lib/programming/progress.ts`（進捗・ぴったり賞・きらきら）/
  `src/lib/programming/engine.ts`（矢印実行・`solve()` BFS・`buildHint`/`buildPraise`）/
  `src/lib/programming/branch.ts`（もしも分岐＝`runBranch`）/
  `src/lib/programming/relativeEngine.ts`（そうたい方向＝`runRelative`/`solveRelative`）
- **UI**: `src/screens/ArrowAdventureUnit.tsx`（1ファイルにマップ＆プレイ画面が同居）

### 問題の しゅるい（`AdventureQuest.kind`）
- `undefined`（矢印ならべ）… `solve()` で検証。森・谷・さばく・ゾンビ・しろ・どんぐり。
- `'branch'`（もしも穴埋め）… `branchFill.phases[]`（くりかえし×ルール1つ）。**1フェーズ=くも、
  2フェーズ=つき（もしを2つ）**。文言は「<むき>に すすめなかったら <then>、すすめたら <else>」
  （= sensor方向にかべ/そとがあれば then、なければ else）。`buildBranchProgram(fill, override?)`
  でプログラム生成（UI・テスト共用）。穴埋めは**一意解をtestで保証**。
- `'relative'`（そうたい方向）… ゆきゾーン。キャラのむき基準で `forward/turn_right/turn_left`。
  `Level.startFacing` で初期むき指定。`relSolution` で検証、`solveRelative()` が最短手数。
  UI は むきバッジ（`ProgrammingGrid` の `charFacing`）でキャラのむきを表示。

### ぴったり賞（💎 ダイヤ）の 判定 — 単元で ちがう
- 矢印ならべ・分岐・ゆき/うみ（ループなし そうたい）: `isPerfect`（`result.steps === optimal`）。
- **ループ/ネスト/proc**: `optimal` は「ならべた ブロック数」（ループ1個=1）なので
  `isPerfectByBlocks(level, result, usedBlocks)` を つかう（`RelativeAdventurePlay`=`cmds.length`、
  `ProcAdventurePlay`=main数/なかみ数）。**`isPerfect`(steps基準)では ループ展開で 永遠に 一致せず
  ダイヤが とれない**（2026-06-04 のバグ。親 SKILL 追記ログ参照）。
- ループ系ゾーンは maxSlots を ゆるめて「手動でも クリア・ループで ✨ぴったり」の練習ゾーン設計。

難易度の段階分け（easy/normal/…）は**冒険モードには無い**。30問を順番に進む設計。
（難易度アンロックは矢印ならべ等の他単元の話で、同じ progress.ts 内の別セクション）

## 2. ファイル別・主要シンボル（Grep のとっかかり）

| 見たいもの | ファイル | Grep する語 |
|---|---|---|
| ゾーン定義（名前/絵文字/色/`story`/かべ絵文字）| adventureLevels.ts | `ADVENTURE_ZONES` |
| クエスト30問の盤面 | adventureLevels.ts | `ADVENTURE_QUEST` / `adv-q` |
| ゾーン/クエストの型 | adventureLevels.ts | `AdventureZone` / `AdventureQuest` |
| 盤面の型（rows/goal/walls/gems/zombies…）| engine.ts | `interface Level` |
| クリア記録・ぴったり賞 | progress.ts | `addQuestClear` / `getQuestCleared` |
| きらきら(✨)集め | progress.ts | `getSparkles` / `SPARKLE_CLEAR` |
| 進捗サマリ（X/30・%）| progress.ts | `getAdventureSummary` |
| フロンティア/ゾーン状態 | progress.ts | `nextPlayableIndex` / `getZoneStatus` |
| マップ画面（進捗バー・物語・ワールド地図）| ArrowAdventureUnit.tsx | `function AdventureMap` |
| まち1枚＋ペンギン歩行 | ArrowAdventureUnit.tsx | `function TownBoard` / `function MapStop` |
| プレイ画面（やじるし組み立て・実行）| ArrowAdventureUnit.tsx | `function AdventurePlay` |
| クリア演出（きらきら/次ゾーン予告）| ArrowAdventureUnit.tsx | `function ClearOverlay` |

## 3. データ構造の要点

### AdventureZone（`ADVENTURE_ZONES`）
`id / name / emoji / bg / accent / tagline / story / wall / tile / wallTile / board`
- `story`: ゾーン入口に出す **ひらがな2〜3行の物語**（`\n` 区切り、UI は `whiteSpace:pre-line`）。
- `accent`: 色キー。UI 側 `ACCENT` テーブルに**フルクラス文字列**で持つ（Tailwind purge 対策）。
  新色を足すなら ArrowAdventureUnit.tsx の `ACCENT` と `REGION_TINT` にも追加。

### AdventureQuest（`ADVENTURE_QUEST`、配列順＝出題順）
`Level` ＋ `zoneId` ＋ 任意 `solution`。よく使う `Level` のフィールド:
- `rows/cols/start/goal/walls/gems/optimal/maxSlots`
- `allowLoop`（ループ箱可）/ `loopOnly`（ループ箱**のみ**＝谷ゾーン）
- `zombies`（`fixed`/`patrol`。**`chase` は使わない** … `solve()` で検証不能になるため）
- `gemEmoji`(🎁) / `goalEmoji`(🏠) / `prompt`（ひとことガイド）
- `kind:'branch'` ＋ `branchFill`（**分岐ゾーン用**。くものてんごく）。矢印ならべではなく
  「もしも」穴埋めになる。`branchFill = { loopTimes, sensor, thenDir, elseDir, holeSensor?, holeThen?, holeElse? }`。
  hole が true の項目だけ こどもが穴埋め。UI は `AdventurePlay` が `kind==='branch'` を見て
  `BranchAdventurePlay`（`runBranch` 実行）に分岐。**穴埋めは一意解を test で保証**（親 SKILL 追記ログ）。
  ゾーン側 `AdventureZone.wallName`（例「くも」）で 分岐ヒントの呼び名を変える。

## 4. 進捗・きらきらの永続化（localStorage）
- キー `math-app:adventure-progress` → `{ cleared: {questId:{perfect}}, sparkles:number }`
- `addQuestClear(id, perfect)`: クリア記録＋きらきら加算し、**もらった数を return**。
  きらきらは `perfect?SPARKLE_PERFECT(3):SPARKLE_CLEAR(1)`。**リプレイでも毎回もらえる**
  （＝同じ問題を解き直す動機）。ぴったり賞は一度取れば消えない。
- UI 反映は `ArrowAdventureUnit` の `tick` state を増やして `<AdventureMap key={tick}>` を
  再マウント→ progress を読み直す方式。

## 5. UI の同居構造（ArrowAdventureUnit.tsx 1ファイル）
```
ArrowAdventureUnit         … playIndex で マップ⇔プレイ を切替
├ AdventureMap             … 進捗バー / ゾーン物語 / ワールド地図 / ◀▶
│ └ TownBoard → MapStop    … まち1枚・封蝋スタンプ（⭐クリア/💎ぴったり/⛳いまここ/🔒）
└ AdventurePlay            … 盤面・どうぐばこ・ループ箱・実行
  └ ClearOverlay           … ✨獲得 / ぴったり予告 / 次ゾーン予告
```
リプレイは「クリア済みスタンプ(⭐)をタップ→再プレイ」で実現。`MapStop` は `unlocked` なら
タップ可（クリア済みは常に unlocked）。`ClearOverlay` の `replayHint` が ⭐→💎 を促す。

## 6. 変更レシピ
- **問題を1問足す**: `ADVENTURE_QUEST` 末尾に追加するだけ。`maxSlots>=optimal` を守る。
- **ボス（各ゾーン最後）を難しくする**: その zone の最後の `adv-qNN` を編集。盤面を広げる/
  かべ・たからばこ・ゾンビを足す。**`optimal` は手で合わせず、テストに計算させる**
  （下記）。`loopOnly` の谷は「同じ向きの連続が2〜5回」に収まる解にする。
- **物語を変える**: `ADVENTURE_ZONES[].story`。ぜんぶ ひらがな・短く。
- **新ゾーン追加**: `ADVENTURE_ZONES` に1件＋`ADVENTURE_QUEST` に数問。`ACCENT`/`REGION_TINT`
  に色を足す。「さいご」をコードで特別扱いしない設計（末尾＝自動でラスト）。
- **きらきらの配点変更**: progress.ts の `SPARKLE_CLEAR`/`SPARKLE_PERFECT`。

### optimal の合わせ方（手計算しない）
`adventure.test.ts` は `optimal === solve()の最短手数` を検証する。盤面を編集→
`npx vitest run src/lib/programming/adventure.test.ts` を実行→ ずれていれば
`expected <実際> to be <設定値>` の **実際の数字**を `optimal` に書き写す。

## 7. テストの守備範囲
- `adventure.test.ts`: 30問が 解ける/optimal最短一致/maxSlots内/盤面整合/`loopOnly`はループ箱で解ける/chase不使用 等。
- `progress.adventure.test.ts`: きらきら加算・リプレイ加算・ぴったり永続・サマリ二重カウント無し。
- 実行: `npx vitest run src/lib/programming/`（冒険まわりだけ）/ `npx vitest run`（全部）。
- **新ルールを足したらテストも足す**（人手チェックに頼らない）。

## 8. 落とし穴
- `chase` ゾンビを足すと `solve()` が検証できずテストが破綻する → 使わない。
- `loopOnly` で「同じ向き6連続」など長い直線を作ると、ループ箱(2〜5)で表現できずテスト落ち。
- `accent` の色クラスは動的生成すると Tailwind purge で消える → `ACCENT` にフルクラスで持つ。
- 行番号でファイルを覚えない（よく動く）。**シンボル名で Grep** する。
