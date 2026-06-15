# としょかんモード（数学冒険）アーキテクチャ早見表

> `MathAdventureUnit`（ふしぎな だいとしょかん）の冒険システム。
> プログラミング冒険（`ArrowAdventureUnit`）とは**別システム**。混同しないこと。

## 1. ファイル構成

| 役割 | ファイル | 主なシンボル |
|---|---|---|
| ゾーン定義 | `src/lib/adventure/zones.ts` | `MATH_ADVENTURE_ZONES` |
| バトル問題生成 | `src/lib/adventure/adapters.ts` | `ADAPTERS`, `generateBattleQuestion` |
| 型定義 | `src/lib/adventure/types.ts` | `BattleQuestion`, `BattleVisual`, `AdventureZoneDef` |
| マップ生成 | `src/lib/adventure/mapGen.ts` | `generateMap` |
| 進捗保存 | `src/lib/adventure/progress.ts` | `makeInitialRun`, `recordZoneClear` |
| UI（全画面同居）| `src/screens/MathAdventureUnit.tsx` | `HubScreen`, `MapScreen`, `BattleScreen`, `ResultScreen` |

## 2. データフロー（タップ → 問題表示）

```
HubScreen（本棚）
  └─ ゾーンをタップ → startZone(idx)
       generateMap(zone)   … MapNode の木を生成
MapScreen（マップ）
  └─ ノードをタップ → enterNode(nodeId)
       zone.unitIds からランダムに unitId を選ぶ
       generateBattleQuestion(unitId)  ← ここで ADAPTERS を引く
BattleScreen（問題）
```

## 3. ゾーンとアダプターの対応ルール

`zones.ts` の `unitIds` に書いた **すべての文字列** が、
`adapters.ts` の `ADAPTERS` マップに存在しなければならない。

```
// zones.ts
{ id: 'zone-compose', unitIds: ['shape-compose'] }

// adapters.ts
const ADAPTERS = {
  'shape-compose': shapeComposeToBattle,  // ← 必ず対になる
};
```

**欠けていると実行時に `Error: adapter not found: <unitId>` が投げられ、
バトル画面に進めなくなる。TypeScript も build も通るので気づきにくい。**

## 4. 罠：ゾーンを追加してアダプターを忘れる

### 症状
- としょかんモードで本（ゾーン）を選びマップのノードをタップしても何も起きない
- コンソールに `adapter not found: <unitId>` が出る
- ビルド・型チェックはエラーなし

### 予防
`adapters.test.ts` の `zone adapter coverage` テストが全ゾーンの unitId を実際に
呼び出してチェックする。**ゾーン追加後に必ずテストを通すこと**:

```bash
npx vitest run src/lib/adventure/adapters.test.ts
```

## 5. 新ゾーンを追加するときのチェックリスト

1. `zones.ts` の `MATH_ADVENTURE_ZONES` にゾーン定義を追加
   - `id`, `name`, `emoji`, `unitIds`, `layerCount`, `tagline`, `story`, `wall`, `tint`
2. `unitIds` に書いた各 `unitId` ごとに `adapters.ts` にアダプター関数を書く
   - 関数シグネチャ: `(rng?: () => number) => BattleQuestion`
   - `BattleVisual` の `kind` を選ぶ（下の表）
   - **図形単元は ぜったいに `word`（テキスト）で代替しない**。標準単元と同じSVGビジュアルを
     渡す（理由は §8）。共有描画は `src/components/shapes/ShapeVisuals.tsx`。
3. `ADAPTERS` マップに追加したアダプターを登録する
4. テストを実行して `zone adapter coverage` が通ることを確認

## 6. BattleVisual の種類（`types.ts`）

| kind | 用途 | 必須フィールド |
|---|---|---|
| `equation` | 計算式（`3 ＋ 5`） | `text: string` |
| `objects` | 絵文字を並べる（`🟡×6`／わり算の わける まえの 山）| `emoji`, `count`, `addCount?` |
| `groups` | おなじ かずの かたまりを わくで囲って並べる（かけ算「○こずつ△つ」）| `emoji`, `perGroup`, `groups`（任意: `groupLabel`＝はこ/人の上ラベル🙂🍽️、`flash`＝ぱっとみで一瞬だけ見せて隠す）|
| `word` | 文章問題（さんすう専用。図形では使わない）| `text`, `emoji` |
| `shape-rotation` | 図形の回転 | `shapeId`, `rotationLabel`（＋`choiceTransforms`）|
| `shape-compose` | かたちをあわせる | `questionSvg`, `choiceSvgs`（生SVG）|
| `shape-pattern` | つぎはどれ | `sequence`, `choiceItems`（`PatternItem`）|
| `shape-spatial` | どこにいる | `objects`（`SceneObj[]`。選択肢はテキスト）|

`shape-rotation` / `shape-compose` / `shape-pattern` は選択肢も図形なので、
`BattleScreen` の `ShapeChoiceGrid`（2×2のSVGボタン）でレンダリングする。
`shape-spatial` は選択肢が動物名（テキスト）なので `BattleButtons` のまま。

## 8. 図形バトルは ぜったいに 図形で見せる（テキスト代替の禁止）

としょかんモードの図形問題は、過去 `word` kind でテキストに潰していたため
（例: `あか○ → あお△ → ？`、`🐱ねこ 🐶いぬ`）**視覚的にわかりにくかった**。
かたち単元はそもそも「目で見て考える」のが学びの本体なので、テキスト化は学びを殺す。

- **必ず標準単元と同じSVGビジュアルを渡す**。描画は `src/components/shapes/ShapeVisuals.tsx`
  に一元化（`ComposeSvg` / `PatternIcon` / `PatternSequence` / `SpatialScene`）。
  標準単元（`ShapeComposeUnit` 等）も としょかんバトルも この共有部品を使う＝**単一実装**。
- 図形の選択肢は `BattleScreen` の `ShapeChoiceGrid` を使う（回転と共用の2×2グリッド）。
  選択肢ラベルが意味を持たない単元（pattern は「かたち1」等）は不正解時の文言を
  「これが こたえ！」にする（`こたえは <ラベル>` は無意味になるため）。
- 回帰防止: `adapters.test.ts` の「図形バトルは視覚的なビジュアルで出す」が、
  各図形アダプターが `shape-*` kind＋SVG/図形データを返すことを検査する。`word` に戻すと落ちる。

## 7. 既存アダプター一覧（2026-06 時点）

| unitId | アダプター関数 | visual.kind |
|---|---|---|
| `make-ten` | `makeTenToBattle` | `objects` |
| `addition` | `additionToBattle` | `equation` |
| `subtraction` | `subtractionToBattle` | `equation` |
| `cherry-calc` | `cherryCalcToBattle` | `equation` |
| `big-addition` | `bigAdditionToBattle` | `equation` |
| `multiplication` | `multiplicationToBattle` | `groups`（5の段まで・塊を見せる）|
| `division` | `divisionToBattle` | `objects`（5の段まで・わける前の山を見せる）|
| `word-addition` | `wordToBattle('word-addition',…)` | `word` |
| `word-subtraction` | `wordToBattle('word-subtraction',…)` | `word` |
| `shape-rotation` | `shapeRotationToBattle` | `shape-rotation` |
| `shape-compose` | `shapeComposeToBattle` | `word` |
| `shape-pattern` | `shapePatternToBattle` | `word` |
| `shape-spatial` | `shapeSpatialToBattle` | `word` |
| `mul-look-total` | `mulLookTotalToBattle` | `groups`（○こずつ△つ→ぜんぶで なんこ）|
| `mul-count-groups` | `mulCountGroupsToBattle` | `groups`（かたまりは いくつ＝わける数を読む）|
| `mul-flash-total` | `mulFlashTotalToBattle` | `groups`＋`flash`（ぱっとみで ぜんぶで なんこ）|
| `div-look-total` | `divLookTotalToBattle` | `groups`＋`groupLabel:🍽️`（おさらに わけて ぜんぶで なんこ）|
| `div-count-people` | `divCountPeopleToBattle` | `groups`＋`groupLabel:🙂`（なん人で わけた＝わる数を読む）|
| `div-flash-total` | `divFlashTotalToBattle` | `groups`＋`groupLabel:🍽️`＋`flash`（ぱっとみ）|

> 「まとめて／わけて かぞえる くに」（としょかんの 初歩 かけ算・わり算 6ゾーン）の
> 共通ロジックは `lookCountToBattle`。`ask:'total'`=ぜんぶで なんこ／`ask:'groups'`=いくつ(なん人)で
> わけた、を 同じ groups ビジュアル（四角でかこう）で 出し分ける。`flash:true` で ぱっとみ化。
