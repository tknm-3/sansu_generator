import { describe, it, expect, vi } from 'vitest';

// jsdom に AudioContext はないのでモック
const mockOscillator = {
  type: 'sine' as OscillatorType,
  frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};
const mockGain = {
  gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
};
const mockCtx = {
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  state: 'running',
  resume: vi.fn(),
};
vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

import { playTone } from '../../../src/features/sound/synth';

describe('playTone', () => {
  it('tap を再生してもエラーを投げない', () => {
    expect(() => playTone('tap')).not.toThrow();
  });
  it('correct を再生してもエラーを投げない', () => {
    expect(() => playTone('correct')).not.toThrow();
  });
  it('wrong を再生してもエラーを投げない', () => {
    expect(() => playTone('wrong')).not.toThrow();
  });
  it('levelup を再生してもエラーを投げない', () => {
    expect(() => playTone('levelup')).not.toThrow();
  });
  it('fanfare を再生してもエラーを投げない', () => {
    expect(() => playTone('fanfare')).not.toThrow();
  });
});
