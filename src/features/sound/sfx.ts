import { Howl } from 'howler';

export type SfxName = 'correct' | 'tap' | 'levelup';

// public/sounds/ に後でファイルを置く。未配置でも例外は出ない（再生時に無音）。
const FILES: Record<SfxName, string> = {
  correct: 'sounds/correct.mp3',
  tap: 'sounds/tap.mp3',
  levelup: 'sounds/levelup.mp3',
};

let enabled = true;
const cache: Partial<Record<SfxName, Howl>> = {};

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  try {
    if (!cache[name]) {
      cache[name] = new Howl({ src: [FILES[name]], volume: 0.6 });
    }
    cache[name]!.play();
  } catch {
    // 読み込み/再生失敗でも継続
  }
}
