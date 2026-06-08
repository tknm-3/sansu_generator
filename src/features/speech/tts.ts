/** ブラウザがTTSに対応しているか */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** アプリ内で問題文・読み上げに使う絵文字の日本語読み */
const EMOJI_READINGS: Record<string, string> = {
  '🍎': 'りんご', '🍊': 'みかん', '🍇': 'ぶどう', '🍓': 'いちご', '🍌': 'バナナ',
  '🍩': 'ドーナツ', '🍪': 'クッキー', '🍭': 'あめ', '🍬': 'あめ', '🍰': 'ケーキ',
  '🥕': 'にんじん', '🌰': 'くり', '🍒': 'さくらんぼ',
  '🐱': 'ねこ', '🐶': 'いぬ', '🐸': 'かえる', '🐼': 'パンダ', '🦊': 'きつね',
  '🐨': 'コアラ', '🦁': 'ライオン', '🐯': 'とら', '🐟': 'さかな',
  '⭐': 'ほし', '🎈': 'ふうせん', '🎀': 'リボン', '🌸': 'はな',
  '🔴': 'あかいまる', '🔵': 'あおいまる',
  '🔟': 'じゅう', '🔢': 'すうじ', '🔣': 'きごう',
  '➕': 'たす', '➖': 'ひく', '✖️': 'かける', '✖': 'かける', '➗': 'わる',
};

// マップにない残りの絵文字・装飾記号（読まれないノイズ）を除去する
const STRIP_EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}\u{20E3}]/gu;

/**
 * 問題文を読み上げ用の日本語に変換する。
 * Web Speech API は記号や絵文字を読み飛ばすため:
 *  - 数字に挟まれた演算子を「たす/ひく/かける/わる/は」に置換（長音「ー」の誤変換を避け数字隣接時のみ）
 *  - 絵文字を日本語読み（🍎→りんご 等）に置換、残りの絵文字は除去
 */
export function speechifyMath(text: string): string {
  let out = text;
  for (const [emoji, reading] of Object.entries(EMOJI_READINGS)) {
    if (out.includes(emoji)) out = out.split(emoji).join(` ${reading} `);
  }
  out = out
    .replace(/(\d)\s*[＋+]\s*(\d)/g, '$1 たす $2')
    .replace(/(\d)\s*[ー－−–—-]\s*(\d)/g, '$1 ひく $2')
    .replace(/(\d)\s*[×✕*＊]\s*(\d)/g, '$1 かける $2')
    .replace(/(\d)\s*[÷/]\s*(\d)/g, '$1 わる $2')
    .replace(/(\d)\s*[＝=]\s*/g, '$1 は ');
  return out.replace(STRIP_EMOJI, ' ').replace(/\s+/g, ' ').trim();
}

// ページ非表示時に読み上げをキャンセルする
if (typeof document !== 'undefined' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const cancelSpeech = () => window.speechSynthesis.cancel();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cancelSpeech();
  });
  document.addEventListener('pagehide', cancelSpeech);
}

/**
 * 日本語で読み上げ。非対応なら何もしない（優雅な劣化）。
 * onEnd を渡すと読み上げ終了（またはエラー・非対応）後に必ず一度だけ呼ぶ。
 * 「言い切ってから次の演出へ」進めたいとき（例: すごろくの煽りセリフ→サイコロ）に使う。
 * opts.rate で読み上げ速度を変えられる（未指定 0.95）。小さいこ向けは 0.7 くらいで
 * ゆっくり話す（数字を一緒に数えやすくするため）。
 */
export function speakJa(text: string, onEnd?: () => void, opts?: { rate?: number }): void {
  if (!isSpeechSupported()) {
    onEnd?.();
    return;
  }
  try {
    const u = new SpeechSynthesisUtterance(speechifyMath(text));
    u.lang = 'ja-JP';
    u.rate = opts?.rate ?? 0.95;
    if (onEnd) {
      let done = false;
      const finish = () => { if (!done) { done = true; onEnd(); } };
      u.onend = finish;
      u.onerror = finish;
    }
    window.speechSynthesis.cancel(); // 連続読み上げの重なり防止
    window.speechSynthesis.speak(u);
  } catch {
    onEnd?.(); // 失敗してもアプリは継続
  }
}
