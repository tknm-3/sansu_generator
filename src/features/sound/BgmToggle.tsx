import { useEffect, useState } from 'react';
import { isBgmEnabled, setBgmEnabled, startBgm } from './bgm';

/**
 * 全画面に常設するBGMミュートボタン。
 * ブラウザの自動再生制限のため、最初のユーザー操作でBGMを開始する。
 */
export function BgmToggle() {
  const [on, setOn] = useState(isBgmEnabled());

  useEffect(() => {
    const kick = () => startBgm();
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
  }, []);

  function toggle() {
    const next = !on;
    setBgmEnabled(next);
    setOn(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? 'BGMを消す' : 'BGMをつける'}
      className="fixed top-3 right-3 z-50 rounded-full bg-white/80 px-3 py-2 text-xl shadow-md backdrop-blur active:translate-y-0.5"
    >
      {on ? '🎵' : '🔇'}
    </button>
  );
}
