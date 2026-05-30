---
name: screenshot-app
description: このアプリ（算数ジェネレーター）の実画面をスクショで確認する手順。「スクショ」「見た目を確認」「実画面」「画面遷移してから撮る」「localStorageをシード」「プレビューで開く」等のときに使う。命名画面で止まる・真っ白になる・playwrightのmodule not found・遷移ボタンが押せない、を未然に防ぐ。
---

# 実画面スクショの確認手順

`scripts/screenshot.mjs` の `capture({ url, out, initScript, steps })` を必ず使う。
chromium 自作起動スクリプトを毎回書かない（過去に3つの罠で時間を溶かした）。

## 最短手順
```bash
# 1) サーバーを別プロセスで起動（200が返るまで待つ）
npm run preview -- --port 4317 --host
# 2) 単純な1枚なら CLI
npm run screenshot -- http://localhost:4317/ /tmp/home.png 800
```
遷移・シードが要るときは `scripts/` 内に一時スクリプトを作り `capture()` を import して使う。
撮ったら一時スクリプトは消す。

## 3つの罠（必ず踏む。先回りする）

### 罠1: 命名画面で止まる / 真っ白（DOMにボタン0個）
プロフィールキーは **`math-app:profile`**。`named: true` が無いと初回命名画面で止まる。
```js
'math-app:profile': JSON.stringify({ id:'penguin', name:'ぺん', named:true, characterNames:{} })
```

### 罠2: 遷移ボタンの文言を推測して getByText が空振り
**推測せず grep で確定する**。例: 冒険入口は「冒険」でも「ぼうけんモード」でもなく **「ぼうけんしよう」**。
```bash
grep -rn "ぼうけん\|onAdventure" src/screens/ProgrammingHomeScreen.tsx
```
宿場など要素は `getByTitle('もんだい 7')` のように title 属性で取れることも多い。

### 罠3: `/tmp` 配下のスクリプトから playwright-core が ERR_MODULE_NOT_FOUND
node_modules が解決できない。**スクリプトは必ずリポジトリ内（`scripts/`）に置く**。

## localStorage シードキー一覧
`grep -rho "'math-app:[^']*'" src/ | sort -u` で最新を確認。主なもの:
- `math-app:profile` … キャラ/命名（上記。named:true 必須）
- `math-app:prog-progress` … プログラミング難易度アンロック `{clears:{"unitId:diff":n}}`
- `math-app:adventure-progress` … 冒険の達成 `{cleared:{questId:{perfect:bool}}}`
- `math-app:stamps` / `math-app:mastery` / `math-app:katachiMission` ほか

## capture() を使う雛形（scripts/ に置く）
```js
import { capture } from './screenshot.mjs';
const cleared = Object.fromEntries(
  ['adv-q01','adv-q02','adv-q03','adv-q04','adv-q05','adv-q06'].map(id => [id, { perfect:true }]),
);
await capture({
  url: 'http://localhost:4317/',
  out: '/tmp/shot.png',
  initScript: (s) => { for (const [k,v] of Object.entries(s)) localStorage.setItem(k, v); },
  initArg: {
    'math-app:profile': JSON.stringify({ id:'penguin', name:'ぺん', named:true, characterNames:{} }),
    'math-app:adventure-progress': JSON.stringify({ cleared }),
  },
  steps: async (page) => {
    await page.getByText('プログラミング').click();
    await page.getByText('ぼうけんしよう').click();
    await page.waitForTimeout(1500);
    await page.getByTitle('もんだい 7').click();
    await page.waitForTimeout(1000);
  },
});
```

## 撮れた画像は Read で目視する
`Read /tmp/shot.png`。ファイルサイズが数KB（例: ~2.9KB）なら**真っ白＝失敗**のサイン。
シードキー・遷移文言・サーバー生存（curl で 200）を疑う。

## 実機（スマホ）で見たいとき
このリモート環境の localhost はスマホから直接は開けない。選択肢:
1. **手元の PC/スマホで** `git pull` → `npm run dev -- --host` し、表示された LAN URL を同一Wi-Fiのスマホで開く（最速・推奨）。
2. デプロイ（Cloudflare Pages）。`wrangler` は入るがトークン未設定なので、設定済みなら `npx wrangler pages deploy dist`、無ければプレビューURL運用は手元 or CI に任せる。
3. スクショ確認は `capture()` の viewport を `{width:390,height:844}`（iPhone相当）にして擬似モバイル表示で代替。
