/** ブラウザがTTSに対応しているか */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** 日本語で読み上げ。非対応なら何もしない（優雅な劣化） */
export function speakJa(text: string): void {
  if (!isSpeechSupported()) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.95;
    window.speechSynthesis.cancel(); // 連続読み上げの重なり防止
    window.speechSynthesis.speak(u);
  } catch {
    // 失敗してもアプリは継続
  }
}
