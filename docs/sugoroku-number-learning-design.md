# すごろくモード 数の大小・量感 学習設計メモ

すごろく（ビンゴすごろく）モードで「数の大小」「大きさの概念（量感）」の学習効果を
高めるための、エビデンスに基づく仕様検討メモ。

- 対象単元: `src/screens/BingoSugorokuUnit.tsx` / `src/screens/bingo-sugoroku/`
- 目的: 数直線（メンタルナンバーライン）の線形化を促し、数の大小比較を速く正確にする

---

## 0. 要約（結論だけ先に）

**「すごろく＝数直線ボードゲーム」は、子どもの数量感覚を育てる介入として最もエビデンスが
厚い手法のひとつ**。今のモードはその土台を既に持っている（1〜100盤・コマが進むたびに数を
読み上げる count-on）。ここに「線形性の明示」「大小比較の能動課題」「量感の可視化」を足すと、
研究が示す学習効果（数直線推定・大小比較・計算）により強く効く。

優先度の高い追加仕様:
1. 盤と並べて**横一直線の数直線バー**を出す（線形メンタルナンバーラインを直接訓練）
2. **大小比較ミニ課題**を組み込む（「32と35、大きいのは?」距離を徐々に縮める適応出題）
3. 進んだ量を**長さ・割合で可視化**（数字＝距離＝量、を結びつける）
4. ボーナスマスで**数直線推定ミニゲーム**（「45はどのへん?」転移効果が最大の課題）
5. count-on を**能動化**（見るだけでなく、タップ/発話で数えながら進む）

---

## 1. エビデンス（なぜすごろくが効くのか）

### 1-1. 数直線ボードゲームは数量感覚を底上げする（中核研究）

Siegler & Ramani の一連の研究。低所得家庭の幼児が**1時間ほど**線形の数ボードゲームで
遊ぶだけで、4つの数量課題（**数の大小比較・数直線推定・カウンティング・数字認識**）が
向上し、効果は**9週間後も持続**した。色を数字に置き換えたゲームでは効果が出なかった
＝「数が並んでいること」が効いている。
- Siegler & Ramani (2008) *Child Development*: "Promoting broad and stable improvements…"
  https://pubmed.ncbi.nlm.nih.gov/18366429/
- Ramani & Siegler (2009): "Playing linear numerical board games promotes low-income
  children's numerical development"
  https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf

### 1-2. 「線形」が大小・量感に効く（円形ではダメ）

線形ボード（数が大きいほど右＝遠い）で遊んだ子だけが**数直線推定が伸び、計算も向上**した。
円形ボードや他の数活動では伸びなかった。理由は、線形配置では
**「数が大きい ⇔ 動いた距離が長い・動いた回数が多い・口にした/聞いた数の名前が多い・
経過時間が長い」**が同時に成り立ち、視覚空間・運動感覚・聴覚・時間という複数の手がかりが
そろって「線形のメンタルナンバーライン」を作るから。
- Siegler & Ramani (2009): "Playing Linear Number Board Games—But Not Circular Ones…"
  https://www.researchgate.net/publication/232563588

→ **示唆**: 今の盤は10×10の蛇行（boustrophedon）で、横方向が行ごとに反転するため
「右＝大きい」の空間手がかりが弱い（縦方向に「上＝大きい」はある）。
**横一直線の数直線を併設**すると、研究が効果を確認したそのままの手がかりを足せる。

### 1-3. メンタルナンバーラインは「対数→線形」に発達する

幼児〜小2にかけて、数の心的表象は**対数的（小さい数の間隔が広く感じる）→線形**へ移行する。
推定の線形性は算数の成績を予測し、移行の遅れは算数障害（dyscalculia）で見られる。
範囲も発達依存（幼児は0〜10、小1〜2で0〜100が線形化）。
- Siegler & Booth (2004) *Child Development*: "Development of Numerical Estimation…"
  http://www.cs.cmu.edu/afs/cs/Web/People/jlbooth/sieglerbooth-cd04.pdf

→ **示唆**: 範囲モード（0〜20 / 0〜50 / 0〜100）を年齢・習熟で選べると、移行の途中の子に
ちょうど合う。10・20…のキリ番（ベンチマーク）を目印にすると推定の足場になる。

### 1-4. 「数えながら進む（count-on）」が encoding を決める

現在地から数え足す count-on（5にいて2出たら「6, 7」）は、毎回1から数える count-from-1 より
**はるかに学習が大きい**。「人は encode したものを学ぶ（You learn what you encode）」。
- Laski & Siegler (2014): "Learning From Number Board Games: You Learn What You Encode"
  https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/2014-Laski-Siegler.pdf

→ **示唆**: 今の実装は移動中にマスの**絶対番号**を読み上げる＝既に count-on になっている（◎）。
さらに**子ども自身に数えさせる（タップ/発話）**と encoding が能動化して効果が増す。

### 1-5. 大小比較（symbolic comparison）そのものが算数の予測因子

数字の大小を**速く正確に**比べられること（記号的大小比較）は算数成績の強い予測因子。
比較の難しさは**距離効果・比効果（Weber則）**に従う＝離れた数ほど簡単、近い数ほど難しい。
比較訓練に特化した適応ゲーム（The Number Race）は、距離・制限時間・記号性を軸に難度を調整し、
数感覚課題を有意に改善した。
- Wilson, Dehaene ら (2006): "Principles underlying the design of The Number Race"
  https://pmc.ncbi.nlm.nih.gov/articles/PMC1550244/
- 記号的距離効果と算数の関係（小さい距離効果＝高成績）:
  https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0067918

→ **示唆**: すごろくに**大小比較の小課題**を織り込み、最初は距離を大きく（10と50）、
できたら徐々に近づける（32と35）と、ちょうどよい難しさで比較スキルを鍛えられる。

---

## 2. 現状の評価（既にできていること / 弱いところ）

| 観点 | 現状 | 評価 |
|---|---|---|
| 数が並んだ盤・数字が見える | 1〜100の盤、各マスに数字 | ◎ |
| count-on 読み上げ | 移動中に絶対番号を読み上げ（`animateMove`） | ◎ 受動的なのが惜しい |
| 複数の手がかり（距離/回数/時間） | コマが1マスずつ進む・サイコロ | ○ |
| 横一直線の「右＝大きい」 | 蛇行配置で行ごとに反転 | △ 縦の「上＝大きい」はある |
| 大小比較の能動課題 | なし | ✗ 追加余地大 |
| 量感（数字＝量）の可視化 | サイコロは出目、位置は数字のみ | △ |
| 数直線推定の練習 | なし | ✗ 転移効果が最大の課題 |
| 範囲の調整（年齢適応） | 0〜100固定 | △ |

`logic.ts` のメモ: `squareToCell` が蛇行（`rfb % 2` で左右反転）。ビンゴ成立で
`+ count*10` マス進むジャンプは、count-on の「数えた分だけ進む」対応を一瞬崩す
（演出としては良いが、ジャンプ中も読み上げで数を埋めると数直線の連続性が保てる）。

---

## 3. 提案する仕様（エビデンス対応つき・優先度順）

### 提案A: 横一直線の数直線バーを併設 ★最優先（1-2 に直接対応）
盤の下（または横）に **0→100 の横一直線**を置き、各プレイヤーのコマを直線上にも表示。
- 「数が大きい＝右に遠い・バーが長い」を**蛇行盤とは別に**はっきり見せる。
- 10・20…100に**目盛り（ベンチマーク）**、現在地に数字フキダシ。
- 実装は読み取り専用の表示追加で済み、ゲームロジックに非破壊。まずここから。

### 提案B: 大小比較ミニ課題（1-5 に対応）
コマが止まった/ボーナス時などに、短い比較を挟む。
- 例: 「いま **34**。つぎ **5** すすむと？ → **34 と 39、大きいのはどっち?**」
- 例: 2人が近いとき「**32 と 35、まえにいるのはどっち?**」（順序＝大小）。
- **適応出題**: 最初は距離大（12 vs 48）→正解が続いたら距離を縮める（32 vs 35）。
  Weber則・距離効果に沿って「ちょうどよい難しさ」を保つ。
- 文言は `authoring-problems` のルールに従い「まちがい」と言わず後押しする。

### 提案C: 進んだ量・出目を量として可視化（1-2 / 量感に対応）
- サイコロの出目を、**点（ドット）が並ぶ量**としても見せる（出目3＝●●●）。10の枠
  （`MakeTenFrame` 流）で「いくつ進むか」を量で提示してから動かす。
- 位置を**ゴールまでの割合**で見せる（「もう半分！(50)」等のマイルストーン読み上げ）。
- 数字＝距離＝量、の三位一体を毎ターン体験させる。

### 提案D: 数直線推定ミニゲーム（ボーナスマス）（1-1/1-3 に対応・転移最大）
ボーナスマスのご褒美に「**45 はどのへん?**」を出し、0〜100の直線をタップ。
- 正解位置との差で短いフィードバック（「いいね、もう少し右だよ」）。
- これは研究で**伸びが確認された評価課題そのもの**＝最も直接的な練習＋即時フィードバック。

### 提案E: count-on を能動化（1-4 に対応）
- 移動中、子どもが**各マスをタップして数え足す**モード（任意ON）。
- 「34 から **+3**」を見せ、35→36→37 を子が押す/言う。encoding を受動から能動へ。

### 提案F: 範囲・年齢モード（1-3 に対応）
- **0〜20 / 0〜50 / 0〜100** を選べる（蛇行盤も数直線バーも同じ範囲で連動）。
- 対数→線形移行の途中の子に範囲を合わせる。小さい範囲ほど早く線形化する。

### 提案G: キリ番ランドマーク（1-3 に対応）
- 10・20…100 のマスを色・サイズで強調、「10とび」のまとまりを可視化。
- ベンチマークを足場に推定・大小判断がしやすくなる。

---

## 4. 段階的な進め方（小さく出してテスト）

1. **A（数直線バー）+ G（キリ番強調）**: 表示追加のみ、非破壊。まず体験を変える。
2. **C（出目・割合の量可視化）**: 既存演出に量の手がかりを足す。
3. **B（大小比較ミニ課題）+ 適応ロジック**: ロジック追加。難度カーブを別関数に。
4. **D（数直線推定）/ E（能動 count-on）/ F（範囲モード）**: 設定として段階導入。

各ステップで `npm run test` と `screenshot-app` スキルで実画面確認。問題文言は
`authoring-problems` スキルの子ども向けルールに合わせる。

---

## 5. 出典まとめ

- Siegler, R. S., & Ramani, G. B. (2008). Promoting Broad and Stable Improvements in
  Low-Income Children's Numerical Knowledge Through Playing Number Board Games.
  *Child Development*. https://pubmed.ncbi.nlm.nih.gov/18366429/
- Ramani, G. B., & Siegler, R. S. (2009/2011). Playing linear number board games—but not
  circular ones—improves low-income preschoolers' numerical understanding.
  https://www.researchgate.net/publication/232563588
- Siegler, R. S., & Booth, J. L. (2004). Development of Numerical Estimation in Young
  Children. *Child Development*. http://www.cs.cmu.edu/afs/cs/Web/People/jlbooth/sieglerbooth-cd04.pdf
- Laski, E. V., & Siegler, R. S. (2014). Learning From Number Board Games: You Learn What
  You Encode. https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/2014-Laski-Siegler.pdf
- Wilson, A. J., Dehaene, S., et al. (2006). Principles underlying the design of "The
  Number Race". *Behavioral and Brain Functions*. https://pmc.ncbi.nlm.nih.gov/articles/PMC1550244/
- 記号的数量処理と算数能力（2分テスト）PLOS One (2013).
  https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0067918
