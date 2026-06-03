export type SynthName = 'tap' | 'correct' | 'wrong' | 'levelup' | 'fanfare' | 'dice';

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

function playDice(ac: AudioContext): void {
  // handleRoll と同じ間隔: 最初8回×55ms → 6回×100ms → 6回×170ms
  const intervals = [
    ...Array(8).fill(55),
    ...Array(6).fill(100),
    ...Array(6).fill(170),
  ];
  const tickTimes: number[] = [];
  let t = 0;
  for (const iv of intervals) {
    tickTimes.push(t / 1000);
    t += iv;
  }
  tickTimes.push(t / 1000); // 最後の1回

  const totalDuration = t / 1000 + 0.1;
  const bufLen = Math.ceil(ac.sampleRate * totalDuration);
  const buffer = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buffer.getChannelData(0);

  for (const tickTime of tickTimes) {
    const start = Math.floor(tickTime * ac.sampleRate);
    // 各ティックに短いノイズバースト（指数減衰）を書き込む
    const clickLen = Math.floor(0.03 * ac.sampleRate);
    for (let i = 0; i < clickLen && start + i < bufLen; i++) {
      const env = Math.exp(-i / (clickLen * 0.25));
      data[start + i] += (Math.random() * 2 - 1) * 0.55 * env;
    }
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;

  // 木製サイコロらしい 1.5kHz 帯域を強調
  const bpf = ac.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 1500;
  bpf.Q.value = 1.2;

  const gainNode = ac.createGain();
  gainNode.gain.setValueAtTime(1.0, ac.currentTime);

  src.connect(bpf);
  bpf.connect(gainNode);
  gainNode.connect(ac.destination);
  src.start(ac.currentTime);
  src.stop(ac.currentTime + totalDuration);
}

// ページ非表示時にAudioContextをサスペンドし、再表示時に再開する
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') {
      ctx.suspend();
    } else {
      ctx.resume();
    }
  });
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
      case 'dice':
        playDice(ac);
        break;
    }
  } catch {
    // 再生失敗でも継続
  }
}
