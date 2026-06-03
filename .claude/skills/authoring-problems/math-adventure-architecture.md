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
   - `BattleVisual` の `kind` は `equation` / `objects` / `word` / `shape-rotation` から選ぶ
   - 視覚的なSVGが必要なら `word` kind でテキスト代替が最速（例: `shapeComposeToBattle`）
3. `ADAPTERS` マップに追加したアダプターを登録する
4. テストを実行して `zone adapter coverage` が通ることを確認

## 6. BattleVisual の種類（`types.ts`）

| kind | 用途 | 必須フィールド |
|---|---|---|
| `equation` | 計算式（`3 ＋ 5`） | `text: string` |
| `objects` | 絵文字を並べる（`🟡×6`) | `emoji`, `count`, `addCount?` |
| `word` | 文章問題・テキスト系ビジュアル | `text`, `emoji` |
| `shape-rotation` | 図形の回転問題 | `shapeId`, `rotationLabel` |

`shape-rotation` を使う場合は `choiceTransforms` も設定し、
`BattleScreen` の分岐レンダリングを確認すること。

## 7. 既存アダプター一覧（2026-06 時点）

| unitId | アダプター関数 | visual.kind |
|---|---|---|
| `make-ten` | `makeTenToBattle` | `objects` |
| `addition` | `additionToBattle` | `equation` |
| `subtraction` | `subtractionToBattle` | `equation` |
| `cherry-calc` | `cherryCalcToBattle` | `equation` |
| `big-addition` | `bigAdditionToBattle` | `equation` |
| `word-addition` | `wordToBattle('word-addition',…)` | `word` |
| `word-subtraction` | `wordToBattle('word-subtraction',…)` | `word` |
| `shape-rotation` | `shapeRotationToBattle` | `shape-rotation` |
| `shape-compose` | `shapeComposeToBattle` | `word` |
| `shape-pattern` | `shapePatternToBattle` | `word` |
| `shape-spatial` | `shapeSpatialToBattle` | `word` |
