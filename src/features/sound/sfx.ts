import { Howl } from 'howler';
import { playTone, type SynthName } from './synth';

export type SfxName = 'correct' | 'tap' | 'levelup' | 'wrong' | 'fanfare';

const FILES: Partial<Record<SfxName, string>> = {
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
  const file = FILES[name];
  if (file) {
    try {
      if (!cache[name]) {
        cache[name] = new Howl({ src: [file], volume: 0.6, preload: false });
      }
      const h = cache[name]!;
      h.on('loaderror', () => {
        delete cache[name];
        playTone(name as SynthName);
      });
      if (h.state() === 'loaded') {
        h.play();
        return;
      }
    } catch {
      // fallthrough to synth
    }
  }
  playTone(name as SynthName);
}
