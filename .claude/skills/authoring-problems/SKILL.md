---
name: authoring-problems
description: このアプリ（算数ジェネレーター）の問題・レベルを作る/直すときの指針。アプリの目的、こども向け文言のルール、各単元の問題定義の置き場所、出題設計のコツ、検証テストの通し方をまとめる。「問題を追加」「レベル追加」「難易度」「ヒント文言」「出題」「冒険のクエスト」「さくらんぼ計算の問題」等のときに使う。新しいコツが見つかったら下部に追記していく。
---

# 問題づくりの指針（authoring-problems）

## だれのための、なんのアプリか（目的）
**小学生（未就学〜低学年中心）向けの算数学習アプリ**。目的は「正解させる」より
**「考えるのが楽しい」「できた！が積み重なる」体験**。だから:
- ✅ こどもが自分で気づける小さな段差。1問ごとに「ちょっと考える」程度。
- ✅ つまずいても前向き。失敗を責めない、次の一手を後押しする。
- ✅ ごほうび（スタンプ・キャラ・ぴったり賞）で達成感を可視化。
- ❌ いきなり難しい/作業量が多いだけ/学びが薄い（手を動かすだけで解ける）問題。

## こども向け文言の鉄則
- **ぜんぶ ひらがな**（漢字を使わない）。数字はOK。
- **「まちがい」と言わない**。ヒントは *次に考えること* を示す（`buildHint` 参照）。
  例:「3ばんめの やじるしで とまっちゃった！その まえの まがりかどを よく みてみよう。」
- ヒントは **やりなおすほど濃くなる**（`attempt` で段階化）。
- ほめ言葉は達成度で変える（`buildPraise`：ぴったり賞 vs クリア）。

## 問題定義はどこにあるか
> **プログラミング 冒険モード（ぼうけんしよう）を いじるときは まず `adventure-architecture.md`**
> を見る。ファイル/シンボルの早見表・進捗ときらきら(✨)の仕組み・ボス難化や物語追加のレシピ・
> 落とし穴を まとめてある。

> **としょかん（さんすう）冒険モードを いじるときは まず `math-adventure-architecture.md`**
> を見る。ゾーン追加チェックリスト・**アダプター登録漏れ罠**（ゾーン追加後に問題に進めなくなる
> 既知バグ）・BattleVisual の種類表を まとめてある。

> **プログラミング問題で「意図した解き方でしか解けない」ようにするときは `intended-solution.md`**
> を見る。ショートカット（まっすぐ/L字/道具を使わず）で 解けてしまう 落とし穴と、単元別の
> 強制のしかた・まもる検証テストの 早見表を まとめてある。

| 種類 | ファイル |
|---|---|
| プログラミング 冒険モード（クエスト/ゾーン）| `src/lib/programming/adventureLevels.ts` |
| プログラミング 矢印ならべ/デバッグ | `src/lib/programming/levels.ts` |
| プログラミング 分岐（もし〜なら/くりかえし）| `src/lib/programming/branchLevels.ts` |
| さんすう各単元（生成ロジック）| `src/lib/math/*.ts`（makeTen, addition, …）|
| ユニットのメタ情報（題名・学年・難易度ヒント）| `src/data/units.ts` |

## 出題設計のコツ（共通）
- **1問1ねらい**。新概念は1つずつ導入し、prompt（ひとことガイド）で何を学ぶか示す。
- **やさしい→むずかしいを配列順に**。配列の並び＝出題順になっている単元が多い。
- **「その単元でしか学べない解き方」を要求する**。普通の手段で解けてしまうと学びが薄い。
  例: くりかえしの谷は `loopOnly` で1マス矢印を封じ、ループ箱必須にした。
- **maxSlots >= optimal** を必ず守る（道具が足りない事故を防ぐ）。
- **ぴったり賞**が取れるよう `optimal` は最短手数と一致させる。
- 盤面の整合（start≠goal、かべ/ゾンビが重ならない 等）を守る。

## 作ったら必ず検証（テストが守ってくれる）
プログラミング問題は **`src/lib/programming/adventure.test.ts`** 等が自動検証する:
- 解ける（`solve()`）／optimal が最短と一致／maxSlots に収まる／盤面整合／
  `loopOnly` はループ箱(1方向×2〜5)で解ける、など。
```bash
npx vitest run src/lib/programming/adventure.test.ts   # 単独
npx vitest run                                          # 全部
```
**新しい設計ルールを足したら、それを守るテストも足す**（人手チェックに頼らない）。
見た目の確認は `screenshot-app` スキルを使う。

## ゾーン/単元を増やすとき
- 冒険: `ADVENTURE_QUEST` の末尾に足すだけ。新ゾーンなら `ADVENTURE_ZONES` に1件追加
  （「さいご」をコードで特別扱いしない設計）。世界観は `design/adventure-philosophy.md`。
- 難易度アンロックは `src/lib/programming/progress.ts`（規定回数クリアで次を解放）。

---

## 追記ログ（コツは見つけ次第ここに足す）
> 形式: `- [YYYY-MM-DD] 単元/場面: 学んだコツ（なぜ）`。PR前にこのスキルへ追記する習慣にする。

- [2026-05-30] 冒険/くりかえしの谷: ループ箱だけで解かせたい谷は `loopOnly:true` を付け、
  普通の矢印パレットを隠す。「普通の矢印でも解ける＝学びが薄い」を防ぐため。`loopOnly` が
  ループ箱(1方向×2〜5)で解けることをテストで保証する。
- [2026-05-30] 冒険/ボス難化: 各ゾーン最後の問題(adv-q06/12/18/24/30)を盤面6×6に広げて
  「マップの最後感」を出した。`optimal` は手計算せず、盤面を直して
  `npx vitest run src/lib/programming/adventure.test.ts` の `expected <実際> to be <設定値>`
  から実際の最短手数を写す（BFS の `solve()` が正）。手計算はズレてテストが落ちる。
- [2026-05-30] 冒険/リプレイ動機: クリアの度にもらえる「きらきら✨」を progress.ts に追加
  （`addQuestClear` が獲得数を return、ぴったりはボーナス、**リプレイでも毎回もらえる**）。
  「もう一度とくと✨が増える／⭐→💎を狙える」で同じマップを解き直したくなる設計。
- [2026-05-30] 冒険/物語: `AdventureZone.story`（ひらがな2〜3行、`\n`区切り）をゾーン入口に
  表示。子の没入を上げるが、長すぎるとテンポを崩すので短く。詳細は `adventure-architecture.md`。
- [2026-05-30] 冒険/分岐ゾーン(くものてんごく): 矢印ならべ専用だった冒険モードに「もしも」分岐を
  統合。`AdventureQuest` に `kind:'branch'` と `branchFill`（loopTimes/sensor/thenDir/elseDir＋
  穴フラグ holeSensor/holeThen/holeElse）を足し、UI 側は `BranchAdventurePlay` で `runBranch` を使う
  （`useProgramRunner` は第3引数に実行関数を差せる）。盤面の壁絵文字とは別に
  `AdventureZone.wallName`（例「くも」）を足し、`buildBranchHint(…, wallName)` でヒント文言を
  ゾーンに合わせる。
- [2026-05-30] 冒険/分岐の穴埋め: **穴埋めは「正解1とおりだけクリアできる（一意解）」を必ず保証する**。
  保証しないと、あてずっぽうで偶然ゴールでき「当てる」学びが消える。盤面は手で置かず、
  4方向×穴数を総当りして「クリアできる組み合わせが正解1つだけ＆steps===optimal」になる壁配置を
  探索で確定する（一時 vitest を書いて `--reporter=verbose --disable-console-intercept` で結果を出す）。
  `adventure.test.ts` に全組み合わせを試す一意解テストを常設し、人手チェックに頼らない。
  全穴（3つとも穴）のステージは1壁では一意解にできないことが多く、2壁以上が必要。
- [2026-05-30] 冒険/つきゾーン（もしを2つ）: 分岐穴埋めを **複数フェーズ対応**にした
  （`branchFill.phases[]`、各フェーズ=くりかえし×ルール1つ）。1フェーズ=くも、2フェーズ=つき。
  文言を「もし<むき>が☁️なら」→「**<むき>に すすめなかったら…すすめたら…**」に変更（こどもに
  「すすめる/すすめない」のほうが直感的）。落とし穴: **row0スタート＋sensor穴のとき sensor=up と
  sensor=down が同じ挙動になり一意解が壊れる**（上はいつも盤外＝ブロックなので）。row0に1枚かべを足して
  「上沿い経路」を行き止まりにし、down経路だけ通す→一意解にもどる（adv-q46/q48で対処）。
- [2026-05-30] 冒険/ゆきゾーン（そうたい方向）: `relativeEngine.ts` を新設。キャラのむき基準で
  `forward/turn_right/turn_left`。`Level.startFacing` で初期むき、`relSolution` で検証、
  `solveRelative()`（状態={pos,facing,gem mask}のBFS）が最短手数=optimal。steps はまわるも1手と数える。
  むきは ProgrammingGrid の `charFacing` バッジ（小さな矢印）で表示（動物絵文字は回さない＝向きが伝わらないため）。
  issueの「progress.ts でゾーン解放条件」は**不要**だった（冒険は nextPlayableIndex の配列順で自動アンロック）。

- [2026-05-31] 冒険/ゾーン4つ追加（うずまきの とう🌀・すいしょうの どうくつ💎・きりの まよいもり🌫️・
  かいていの しんでん🔱）: 既存メカニクスを **組み合わせ／少し難しめ** にした続編ゾーン。学んだこと:
  ・**1ゾーン＝6問が上限**（マップの `STOPS` が6つ。7問目以降は `STOPS[li]` が undefined で描画クラッシュ）。
  ・新ゾーンは `ACCENT` の**既存キーを再利用**すればUI追加不要。ただし `REGION_TINT[zoneId]` は
    新idぶん追加する（無いと地図のにじみ色がデフォルトになる）。
  ・**loopOnlyで「少ないブロックで長い道」**を出すコツ: コーナーを宝(gem)で固定し L字/コの字に曲げる。
    `solve()` は DIRS=[up,down,left,right] 順で「最初の軸を伸ばし切る」直線的な最短路を返すので、
    宝で角を作れば各辺が きれいな2〜5連続（＝ループ箱1個）になる。下→上のように同じ列を往復させると
    BFSが1マス刻みに割れて run<2 でテスト落ちするので避ける。
  ・**relativeゾーンのボスは手計算で長くしすぎない**: コーナー2つに宝を置くと solveRelative が24手など
    巨大になる。宝は経路上（例: ゴール手前の直線上）に置き、`relSolution`/`optimal` は
    `solveRelative()` の実測値を写す（一時 vitest で `console.log` → `--disable-console-intercept`）。
  ・**branchゾーンに宝を足すとき**: gem は「クリアできる組み合わせ」を減らすだけなので、正解経路上に置けば
    一意解は壊れない。検証ずみの くも/つき 配置を流用し gem を経路に足すのが安全（adventure.test.ts の
    一意解テストが自動で守る）。

- [2026-06-03] としょかん冒険/アダプター登録漏れ: `zones.ts` に新ゾーン（unitIds）を追加したのに
  `adapters.ts` の `ADAPTERS` マップへの登録を忘れると、バトルノードのタップで
  `adapter not found: <unitId>` エラーが発生し問題画面に進めなくなる。TypeScript・buildは通るので
  気づきにくい。今後は `adapters.test.ts` の `zone adapter coverage` テスト
  （`npx vitest run src/lib/adventure/adapters.test.ts`）が全ゾーンの unitId を実呼び出しして
  検知する。詳細は `math-adventure-architecture.md`。
- [2026-06-03] としょかん冒険/図形バトルの視覚化: かたち単元（compose/pattern/spatial）が
  `adapters.ts` で `word`（テキスト）kind に潰され「視覚的にわかりにくい」状態だった
  （例: `あか○ → あお△ → ？`）。**図形は目で見て考えるのが学びの本体**なのでテキスト化は厳禁。
  標準単元のSVG描画を `src/components/shapes/ShapeVisuals.tsx` に一元化し、標準単元・としょかん
  バトルの両方で同じ部品を使う（単一実装）。`BattleVisual` に `shape-compose`/`shape-pattern`/
  `shape-spatial` kind を追加、選択肢が図形のものは `BattleScreen` の `ShapeChoiceGrid`（回転と共用）
  で描く。回帰防止テストは `adapters.test.ts`「図形バトルは視覚的なビジュアルで出す」。
  詳細は `math-adventure-architecture.md` §8。
- [2026-06-03] 冒険/そうたい×ループ・ネストループ: **「コの字／かいだん／ジグザグ／四角の ふち」と
  prompt で うたう問題は、かべで みちを しぼらないと まっすぐ や L字で ショートカットできてしまう**
  （`walls:[]` のままだと学びが薄い）。relSolution が ゴールに着くだけでは不十分。対策:
  ・**ねらった形の通路（コリドー）になるよう、形の外のマスを かべで うめる**。階段なら off-path マスを
    全部かべ、四角の周回ループなら なかみ（interior）を全部かべにして ふちだけ残す。コの字/Z字は
    まんなか1マスを ふさぐだけでも 直進を封じられる（最少の壁でよい場合もある）。
  ・gem を 形の角・経路上に置くと、それだけで 形を強制できる（q104/q107/q112/q114 は gem だけで合格）。
  ・**検証は「ショートカット不可」テスト**を `adventure.test.ts` に常設: relSolution の まがりかど数
    （すすむ向きの変化回数）より `solveRelative()` の最短解の まがりかど数が **少なくならない**ことを
    `corners()` で確認する。まっすぐ(0)・L字(1) で抜ける穴を自動で検知する。
  ・relativeLoopQuests は `optimal===命令数`（BFS最短ではない）なので、既存テストだけでは
    ショートカットを 検知できなかった＝この穴に注意。
- [2026-06-03] 冒険/てじゅん(proc)単元: **テストが 1つも 無かった**ので q91〜q102 に追加。
  落とし穴: **proc_a（中身固定・main を つくる）は パレットに ふつうの矢印も 出るので、
  call を 使わず 矢印だけで 解けると 学びが うすい**。`maxSlots` でしか 暗黙に 防いでいなかった。
  検証: **矢印だけの最短(`solveRelative`) > maxSlots** を テストで確認＝てじゅん必須を 保証。
  proc_b（main固定・中身を きめる）は **optimalより 短い 中身では クリアできない**ことを 総当りで確認
  （短い中身で 当たると 考えずに解ける）。設計と検証の早見表は `intended-solution.md` に まとめた。
- [2026-06-04] 冒険/ダイヤ(ぴったり賞💎)が ループ・proc単元で 取得不能だったバグ: `isPerfect` は
  `result.steps === optimal` で判定するが、**ループ/ネスト/proc の `optimal` は「ならべた ブロック数」**
  （ループ1個=1）で定義されている。一方 `result.steps` は **ループ展開後の 実行命令数**（前へ・まわるの
  合計）なので、ループは必ず2回以上展開され 両者は永遠に一致しない＝そうたいループ以降の36問すべてで
  ぴったり賞が 取れなかった。修正: `engine.ts` に `isPerfectByBlocks(level, result, usedBlocks)` を新設し、
  `RelativeAdventurePlay`（`cmds.length`）・`ProcAdventurePlay`（proc_a=main数 / proc_b=なかみ数）で つかう。
  **教訓: 単元ごとに optimal の意味（手数 か ブロック数 か）が ちがうときは、ぴったり賞の判定も そろえる**。
  回帰防止テスト「$id は relSolution で ダイヤ（ぴったり賞）が とれる」を `adventure.test.ts` に常設。
- [2026-06-04] 冒険/ループ系を「練習ゾーン化」: rloop_a/rloop_b/nloop_a/nloop_b は maxSlots が
  「圧縮後ぴったり」だったので、**ループ/ネストを最初から正しく組まないと クリアすら できない**＝難しい
  ゲートになっていた。対策: **maxSlots を 手動最短(`solveRelative()`)が おさまる大きさに ゆるめる**＝
  まず めいれいを 1つずつ ならべて クリアでき、ループ/ネストに まとめると ✨ぴったり賞(💎)、という
  段階的な学びにする。**かべで かたちは しぼったまま**なので「ショートカット不可」テストは維持される
  （maxSlots は corners テストに 影響しない）。**proc_a は別**: maxSlots を ゆるめると「てじゅん必須」
  テスト（矢印だけの最短 > maxSlots）が壊れるので 据え置き、ダイヤ修正だけで 達成可能にする。
  maxSlots の値は 一時 vitest で `solveRelative().length <= maxSlots` を確認して 決める。
- [2026-06-04] 冒険/そうたい×ループ・proc を「足場プリフィル」でチュートリアル化: 「1つずつ ならべても
  クリアできる」練習ゾーン化だけでは そうたい×ループの 組み立て負荷が のこり 難しかった。対策は
  **最初から ループ箱＋少しの矢印を おいておき、こどもは のこりを 少し たすだけ**にする 穴埋め足場。
  ・データ: `AdventureQuest.relPrefill = { cmds?, openLoop? }`（そうたい）/ `procMainPrefill`（proc_a）。
    `openLoop` は **relSolution の さいごの ループ箱を 途中まで ひらいた もの**（times固定・body先頭ロック）。
    こどもは のこりの body を たして「✅かんりょう」する。単一ループ・ネスト（内側ループを body に
    完成させて おく）・列(cmds に前半ブロック)の すべてを openLoop だけで 表現できる（appendのみ）。
  ・UI（`ArrowAdventureUnit.tsx` の `RelativeAdventurePlay`/`ProcAdventurePlay`）: state を 足場で 初期化、
    `lockedCmdLen`/`lockedMainLen` 未満は `removeAt` で けせない、🗑️/↺ は 足場まで もどす、ロック分に 🔒。
  ・**検証**（`adventure.test.ts`）: relPrefill は **relSolution の 接頭辞**で、openLoop の のこり body は
    1〜3（穴埋め＝全部うまってない／たしすぎない）。procMainPrefill も procMainSolution の 接頭辞。
    そうたい×ループ4ゾーンは 全問 relPrefill を もつ（取りこぼし防止の coverage テスト）。
  ・**ぴったり賞**: cmds.length===optimal（ブロック数）の `isPerfectByBlocks` のまま。足場どおり 完成すると
    トップレベルが relSolution と そろい 💎が とれる（実機で q79=💎クリアまで確認ずみ）。
  ・落とし穴: スクショ検証で `getByRole('button',{name:/スタート/})` は「スタート」と「▶ スタート」の
    2つに マッチして 失敗 → **`name:'▶ スタート'` の 完全一致**で 取る。足場の 表示は「🔁×N に 途中まで
    矢印＋？プレースホルダ」で 出る（renderLoopBuilding の ？）。
- [2026-06-07] 冒険/新ゾーン5つ追加（みずうみ🌊・はちみつ🍯・ロボット🤖・おかし🍭・おもちゃ🎁）:
  「難易度を上げず バラエティ」は **新メカニクスを作らず、既存メカニクスを 1つずつ やさしい新ゾーンに
  わりあてる**のが安全＝矢印ならべ／loopOnly／relative(ループなし)／branch／proc_b の 5種を テーマ替えで。
  ・**branch の新ゾーンは くも(q37-42)の 壁/branchFill を まるごと流用**し goalEmoji/prompt だけ かえる
    （一意解は 既検証配置なら そのまま保たれる）。新規の壁で 一意解を 探索し直すのは 高リスクなので さける。
  ・**relative(ループなし)は relSolution を「マンハッタン最短＋回転最小」で 手で書ける**。gem は コーナーに
    置き「gemへ→ゴールへ」の 2辺ルートにすると 最短が 読みやすい。optimal は test の `expected` から写す。
  ・忘れがちな副作用2つ: ①`ArrowAdventureUnit.tsx` の **`REGION_TINT[zoneId]` を 新id分 追加**（無いと
    地図のにじみ色がデフォルト）。`ACCENT` は 既存キー(emerald/sky/…)を 再利用すれば追加不要。
    ②`adventureLevels.ts` で **使わない 絵文字定数を 宣言すると `tsc`(build)が TS6133 で落ちる**
    （`npm run test` は通るが `npm run build` で発覚）。使う分だけ定数化する。
  ・ゾンビ絵文字は `ProgrammingGrid` で **🧟固定**（カスタム不可）。テーマに合わない 動物障害物に したいなら
    Grid 改修が要る＝データだけで すませたいなら ゾンビ系の 新テーマは さける。
  ・**prompt が「答えになりすぎ」問題**（ユーザー指摘）: 「みぎと したで」のように 移動方向を 列挙すると
    答えそのもの。新問は **目的・状況の提示**（例「さかな🐟を ひろって おうちへ」「まんなかを とおって」）に
    とどめ、具体的な むき/回数は 言わない。branch の「[？]に すすめなかったら ↓」は 穴の答えは 伏せたまま
    構造だけ見せる形なので OK。
- [2026-06-07] としょかん/かけ算・わり算が「式だけ＆9の段まで」で難しかった → **5の段までに絞り＋
  視覚化**した。学んだこと:
  ・**数を絞るのは生成ロジック側にオプションを足す**（既定は据え置き）。`generateMultiplication(rng,
    {maxFactor})` / `generateDivision(rng, withRemainder, {maxDivisor,maxQuotient})`。図書館アダプター
    （`adapters.ts`）だけ `{maxFactor:5}` 等を渡す＝標準単元(`MultiplicationUnit`等)は無変更。
  ・**かけ算は `BattleVisual.kind:'groups'`** を新設し、既存の `GroupsVisual`（`src/components/`）を
    `BattleScreen` でそのまま再利用（「○こずつの かたまりが △つ」を わくで囲って見せる＝単一実装）。
    わり算は `objects` で わける前の山を見せる（答えは見せない）。`objects` の表示上限は 10→25 に拡大
    （5の段なら被除数 ≤25）。回帰テストは `adapters.test.ts` の「かけ算は塊／わり算は山」で kind と
    数の範囲(2..5)を検証。
  ・**スクショ経路**: ホーム「なにをやる？」は カテゴリ選択で だいとしょかんは無い。**さんすう →
    「ふしぎな だいとしょかん」**の順。ゾーンは前ゾーンクリアでアンロックされるので、`localStorage`
    の **`math-adventure:history`** に `{zones:[{zoneId,...}],...}` を全ゾーン分シードして解錠する
    （プロフィールキーは `math-app:` 名前空間だが、冒険の履歴は `math-adventure:` 名前空間で別）。
    マップのバトルノードは `button:not([disabled])` で ⚔️ を含む最初のものをタップ（🔒/✅は除外）。
- [2026-06-07] としょかんに「理数センス」本を3つ追加（数直線わたり🐸／みつもりめいじん🍪／パッとそろばん⚡）。
  対象は **簡単な足し算ができる子以上**（5歳〜だけだと サビタイジング/ANS は効果が薄れるため、狙いを
  数直線・見積もり・概念的サビタイジング＋暗算の自動化にずらす）。学んだこと:
  ・**新ゲームは『見せる＋選ばせる』に落とせば 既存のバトル系にそのまま乗る**。`BattleVisual` に kind を
    足し（`number-line`／`estimate-pile`／`ten-frame-sum`）、`adapters.ts` に `xxxToBattle` を1つ書いて
    `ADAPTERS` に登録、`zones.ts` に本を1つ足し、`MathAdventureUnit.tsx` の描画スイッチに1分岐足すだけ。
    マップ生成・HP・✨評価・ゾーン解放・ラン保存は **全部タダで継承**＝「何度もやりたくなる」が自動でつく。
  ・**ゾーンは必ず配列の末尾に追加**する。ハブは `isZoneUnlocked(i)=前ゾーンクリア` の直線アンロックなので、
    途中に挿入すると **次のゾーンが再ロック**されて既存セーブの進捗が巻き戻る。末尾追加なら非破壊。
    （理数センス本は「ラスボス後に解放される上級の まき」という位置づけにした。）
  ・**スクショで新ゾーンを開くには 1つ前のゾーンも history に入れる**。zone-estimate を見たいなら
    zone-numberline も cleared にしないと解錠されない（直線アンロックのため連鎖で前を埋める）。
  ・出題の選択肢は **スケールに応じて間隔をあける**（数直線100なら gap=8、見積もりは20間隔の10の倍数）。
    `toFourChoices` は answer±3 に寄るので、位置で見分ける数直線/見積もりでは近すぎ＝専用ロジックで散らす。
  ・**見積もりは個数を出さない**（`objects` kind は「（Nこ）」を出して答えバレ）→ `estimate-pile` を新設し
    密な山だけ見せる。回帰は `adapters.test.ts` の各 describe（target=正解／10の倍数／a+b）で固める。
  ・テスト追加は最小で済む: `zone adapter coverage` と `mapGen` が **全ゾーンを自動で舐める**ので、unitId を
    登録した時点で「アダプタ無し」「到達不能マップ」は自動検出される。固有の不変条件だけ describe を足す。
- [2026-06-07] 冒険/みずうみ(lake)が「かんたんすぎる」→ 階段化: 矢印ならべゾーンは gem/壁が L字
  （角1つ）で済むと「ぜんぶ→してから ぜんぶ↑」で 解けて 学びが うすい（＝じゅんばんに 組む 体験に
  ならない）。対策と教訓:
  ・**ジェムを ばんめんの 対角線(anti-diagonal)に ならべる**と、最短(マンハッタン)で 全部 ひろうには
    「↑→↑→…」と 交互に 組むしか なくなる。L字だと とちゅうの gem を 通れない。start を 左下・
    goal を 右上に すると「うえ と みぎ を じゅんばんに」が 文字どおりに なり こどもの 直感に あう。
  ・**壁(🪷)は「まっすぐの 逃げ道」を ふさぐ位置**に置く（階段の off-path セル）。階段じたいは
    ふさがない＝optimal は マンハッタン最短のまま。boss は 四辺に 壁を ちらして 直進ショートカットを 全部 消す。
  ・**arrowQuests には「L字ズル不可」テストが 無かった**（corners テストは relativeLoop 専用）ので、
    `adventure.test.ts` に `minCornersShortest(q)`（state=pos|mask|lastDir の 層DP で 最短手数の
    まがりかど最小を 出す）を 足し、lake全問 **まがりかど ≥ 3** を 保証。これが ないと 将来 また
    L字に もどされる。新しく「階段/ジグザグを 組ませたい 矢印ゾーン」を 作ったら 同じ テストで まもる。
  ・optimal は 手計算せず `expected <実際> to be <設定値>` から 写す（壁で 遠回りに なると ずれる）。
- [2026-06-07] としょかん/かけ算・わり算ビジュアルに「式」をそえる: 絵だけだと「これが 何×何 / 何÷何 か」が
  伝わらないので、`groups`/`objects` ビジュアルに `equationText?` を足して 絵の下に式を表示する。**式の順番は絵の
  見た目とそろえる**（かけ算は「○こずつ△つ」＝ `perGroup × groups`、わり算は山の数 ÷ 人数）。
  回帰テストで `equationText === \`${perGroup} × ${groups}\`` / `^${count} ÷ \d+$` を固定する。
- [2026-06-07] 冒険/新ゾーン4つ追加（💎ほうせきの どうくつ・🚀ほしの きち・🎡くるくる ふうしゃ・
  🔧ふしぎな こうぼう）: 種類別に「矢印ならべ(gem複数+壁)×3／そうたい(gem2中央寄り+壁)×3／
  そうたい×ループ×2／proc_b×2」を ゾーンに わりあてた。学んだこと:
  ・**矢印で gem を 複数おくとき、はじっこ どうしに 置くと 往復で optimal が はねあがる**
    （4×4で gem 2つを 角に → optimal 10で こどもには ながい）。**gem を start→goal の 単調経路
    （右と下だけ／上と右だけ）の 上に ならべる**と optimal が マンハッタン最短のまま（対角線上
    (1,1)(2,2)(3,3) など）。壁は 経路外の マスに 置けば 最短を くずさない。
  ・**そうたい(relative・ループなし)で gem 2個＋5×5 は optimal が 11前後**に なりやすい（中央寄り gem の
    detour で 回転が ふえる）。10ちょうどは つくりにくいので 4×4(9手)→5×5(11手)で 段差を つける。
    relSolution は **`solveRelative()` の 出力を そのまま 写す**（手書きは ずれる。一時 vitest で
    `console.log` → `--disable-console-intercept`）。
  ・**ループ系/proc系は 既存ゾーン（rloop_a の q79/q81・toy の q139/q141）を テーマ替えで 流用**するのが安全。
    そうたい×ループは `relPrefill`(足場)必須（`relativeLoopQuests` 全件 coverage テストが ある）。
    proc_b は procMain固定＋procDef正解で「短い中身では クリア不可」テストが かかる＝既検証の構造を まねる。
  ・忘れず: `ArrowAdventureUnit.tsx` の **`REGION_TINT` に 新ゾーンid を 追加**（`ACCENT` は 既存キー再利用可）。
    `adventure.test.ts` の `lakeQuests`(minCornersShortest>=3) は **lake限定**なので 新しい矢印ゾーンには
    かからない＝L字ズルを ふせぎたい矢印ゾーンを 作るなら 同テストを その zoneId にも 広げる。
- [2026-06-08] としょかん/わけわけ どうくつ（`division`）を `objects`（山だけ）から `divide` ビジュアルに変更。
  既存の `DivideVisual`（あまりんぼの たに で使用）を 流用＝こたえる まえは 山＋かご、こたえた あとは
  かごに おなじ かずずつ わけた 絵を 見せる。「わける」が 視覚的に わかるように した。学んだこと:
  ・`DivideVisual` は remainder=0 でも そのまま使える（あまり枠は `remainder > 0` のときだけ描画）。
    あまりなしゾーンは `remainder: 0` を 渡すだけ＝コンポーネントは 共有のまま 増やさない。
  ・`divide` 型に `equationText?` を 足し、絵の下に `${dividend} ÷ ${divisor}` を そえる（式の向きは 山の数÷人数）。
  ・回帰テストは `divisionToBattle` が `divide` kind・`remainder===0`・`dividend===divisor*quotient`・
    `equationText===\`${dividend} ÷ ${divisor}\`` を返すことを固定（`adapters.test.ts`）。
