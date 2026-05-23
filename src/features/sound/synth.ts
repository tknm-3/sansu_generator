export type SynthName = 'tap' | 'correct' | 'wrong' | 'levelup' | 'fanfare';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(
  ac: AudioContext,
  freq: number,
  type: OscillatorType,
  startAt: number,
  duration: number,
  volume = 0.3,
): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
}

function playCorrect(ac: AudioContext): void {
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => beep(ac, freq, 'sine', ac.currentTime + i * 0.1, 0.15, 0.35));
}

function playWrong(ac: AudioContext): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ac.currentTime);
  osc.frequency.linearRampToValueAtTime(180, ac.currentTime + 0.15);
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.25);
}

function playLevelup(ac: AudioContext): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => beep(ac, freq, 'sine', ac.currentTime + i * 0.12, 0.18, 0.4));
}

function playFanfare(ac: AudioContext): void {
  const chord = [523.25, 659.25, 783.99];
  chord.forEach((f) => beep(ac, f, 'sine', ac.currentTime, 0.3, 0.25));
  chord.forEach((f) => beep(ac, f, 'sine', ac.currentTime + 0.35, 0.3, 0.25));
  [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5].forEach((f, i) =>
    beep(ac, f, 'sine', ac.currentTime + 0.7 + i * 0.08, 0.1, 0.3),
  );
}

export function playTone(name: SynthName): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    switch (name) {
      case 'tap':
        beep(ac, 440, 'sine', ac.currentTime, 0.05, 0.2);
        break;
      case 'correct':
        playCorrect(ac);
        break;
      case 'wrong':
        playWrong(ac);
        break;
      case 'levelup':
        playLevelup(ac);
        break;
      case 'fanfare':
        playFanfare(ac);
        break;
    }
  } catch {
    // 再生失敗でも継続
  }
}
