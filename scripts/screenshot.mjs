/**
 * アプリ画面の スクリーンショットを とる 共通ヘルパー。
 *
 * この環境では `npx playwright install`（CDN）が ブロックされているが、
 * Chromium が /opt/pw-browsers に プリインストール されているので それを つかう。
 * playwright-core は devDependency。バージョンずれを さけるため
 * 実行ファイルは /opt/pw-browsers から 自動けんしゅつ する。
 *
 * 使い方（CLI）:
 *   1) 別ターミナルで  npm run preview -- --port 4317   （または npm run dev）
 *   2) node scripts/screenshot.mjs <url> <out.png> [waitMs]
 *      例) node scripts/screenshot.mjs http://localhost:4317/ /tmp/home.png
 *
 * 使い方（コード）:
 *   import { resolveChromium, capture } from './scripts/screenshot.mjs';
 *   await capture({ url, out, initScript, steps });  // steps(page) で クリック等
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const PW_DIR = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

/** プリインストール済み Chromium の 実行ファイルパスを さがす */
export function resolveChromium() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (existsSync(PW_DIR)) {
    // headless_shell より フルの chromium-* を ゆうせん
    const dirs = readdirSync(PW_DIR)
      .filter((d) => d.startsWith('chromium-') && !d.includes('headless'))
      .sort();
    for (const d of dirs) {
      const exe = path.join(PW_DIR, d, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
    // フォールバック: headless_shell
    for (const d of readdirSync(PW_DIR).filter((d) => d.includes('headless'))) {
      const exe = path.join(PW_DIR, d, 'chrome-linux', 'headless_shell');
      if (existsSync(exe)) return exe;
    }
  }
  // 最後の手段: playwright-core 同梱パス
  try { return chromium.executablePath(); } catch { return undefined; }
}

/**
 * 1ページを ひらいて スクショを とる。
 * @param {object} o
 * @param {string} o.url
 * @param {string} o.out         出力 PNG パス
 * @param {{width:number,height:number}} [o.viewport]
 * @param {Function} [o.initScript]  ページ読み込み前に走る（localStorage シードなど）
 * @param {any} [o.initArg]          initScript に わたす引数
 * @param {(page:any)=>Promise<void>} [o.steps]  スクショ前の そうさ
 * @param {number} [o.waitMs]
 */
export async function capture({ url, out, viewport = { width: 420, height: 880 }, initScript, initArg, steps, waitMs = 500 }) {
  const executablePath = resolveChromium();
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage({ viewport });
    if (initScript) await page.addInitScript(initScript, initArg);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(waitMs);
    if (steps) await steps(page);
    await page.screenshot({ path: out });
  } finally {
    await browser.close();
  }
}

// CLI として よばれたとき
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const [, , url, out, waitMs] = process.argv;
  if (!url || !out) {
    console.error('usage: node scripts/screenshot.mjs <url> <out.png> [waitMs]');
    process.exit(1);
  }
  capture({ url, out, waitMs: waitMs ? Number(waitMs) : 500 })
    .then(() => console.log('saved', out))
    .catch((e) => { console.error(e); process.exit(1); });
}
