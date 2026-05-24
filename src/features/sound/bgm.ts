/**
 * Web Audio で生成する明るいループBGM。
 * 既存SFX（synth.ts）と同様にファイル不要・オフライン動作・ライセンス問題なし。
 * 画面遷移をまたいで鳴り続けるシングルトンとして管理する。
 */
import { loadJson, saveJson } from '../../lib/storage';

const BGM_KEY = 'math-app:bgm-enabled';

// ハ長調の音名（null=休符）。1音 = track.note 秒でループ。
const E4 = 329.63, F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25;

// 低音（コードのルート）
const A2 = 110.0;
const C3 = 130.81, F3 = 174.61, G3 = 196.0;

export interface Track {
  melody: (number | null)[];
  bass: (number | null)[];
  note: number;
  melodyWave?: OscillatorType;
}

// ホーム（既存の明るいループ）
const TRACK_HOME: Track = {
  melody: [
    E4, G4, C5, G4, E4, G4, C5, G4,
    F4, A4, D5, A4, F4, A4, D5, C5,
    E4, G4, C5, E5, D5, C5, B4, G4,
    C5, G4, E4, G4, C5, null, C5, null,
  ],
  bass: [C3, F3, C3, G3, C3, F3, C3, C3],
  note: 0.28,
  melodyWave: 'triangle',
};

// たし算系（やや速くはずむ感じ・triangle）
const TRACK_ADD: Track = {
  melody: [
    C5, E5, G4, C5, E5, D5, C5, G4,
    A4, C5, E5, C5, G4, A4, C5, G4,
    C5, E5, G4, C5, D5, E5, D5, C5,
    G4, A4, C5, A4, G4, null, C5, null,
  ],
  bass: [C3, G3, F3, G3, C3, F3, G3, C3],
  note: 0.24,
  melodyWave: 'triangle',
};

// ひき算系（ゆったり落ち着いた感じ・sine）
const TRACK_SUB: Track = {
  melody: [
    A4, G4, F4, E4, F4, G4, A4, null,
    G4, F4, E4, D5, C5, B4, A4, null,
    F4, A4, C5, A4, G4, F4, E4, null,
    E4, F4, G4, A4, G4, null, F4, null,
  ],
  bass: [A2, F3, C3, G3, A2, F3, G3, C3],
  note: 0.32,
  melodyWave: 'sine',
};

// かけ算系（リズミカルで元気・square）
const TRACK_MUL: Track = {
  melody: [
    C5, C5, G4, G4, A4, A4, G4, null,
    F4, F4, E4, E4, D5, D5, C5, null,
    C5, E5, C5, E5, G4, C5, G4, null,
    E5, D5, C5, B4, C5, null, C5, null,
  ],
  bass: [C3, C3, F3, F3, G3, G3, C3, C3],
  note: 0.22,
  melodyWave: 'square',
};

// わり算系（やさしくなめらか・triangle）
const TRACK_DIV: Track = {
  melody: [
    G4, A4, B4, C5, D5, C5, B4, A4,
    F4, G4, A4, B4, C5, B4, A4, G4,
    E4, F4, G4, A4, B4, A4, G4, F4,
    G4, A4, B4, C5, B4, null, G4, null,
  ],
  bass: [C3, G3, F3, C3, G3, F3, G3, C3],
  note: 0.30,
  melodyWave: 'triangle',
};

const TRACKS: Record<string, Track> = {
  home: TRACK_HOME,
  'make-ten': TRACK_ADD,
  addition: TRACK_ADD,
  'big-addition': TRACK_ADD,
  subtraction: TRACK_SUB,
  'big-subtraction': TRACK_SUB,
  'cherry-calc': TRACK_SUB,
  multiplication: TRACK_MUL,
  division: TRACK_DIV,
};

const LOOKAHEAD = 0.2; // 先読みスケジュール窓（秒）

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = loadJson<boolean>(BGM_KEY, true);
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let nextNoteTime = 0;
let noteIndex = 0;
let current: Track = TRACKS.home;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5; // 全体を控えめに（BGMは脇役）
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playNote(
  freq: number,
  at: number,
  dur: number,
  vol: number,
  type: OscillatorType = 'triangle',
): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function scheduler(): void {
  if (!ctx) return;
  while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
    const note = current.note;
    const m = current.melody[noteIndex % current.melody.length];
    if (m != null) playNote(m, nextNoteTime, note * 0.9, 0.07, current.melodyWave ?? 'triangle');
    if (noteIndex % 4 === 0) {
      const b = current.bass[Math.floor(noteIndex / 4) % current.bass.length];
      if (b != null) playNote(b, nextNoteTime, note * 3.6, 0.05, 'sine');
    }
    nextNoteTime += note;
    noteIndex += 1;
  }
}

/** BGM再生開始（ユーザー操作後に呼ぶこと。enabled=false なら何もしない） */
export function startBgm(): void {
  if (!enabled || playing) return;
  const ac = ensureCtx();
  if (!ac) return;
  playing = true;
  nextNoteTime = ac.currentTime + 0.1;
  scheduler();
  timer = setInterval(scheduler, 25);
}

/** BGM停止 */
export function stopBgm(): void {
  playing = false;
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
  noteIndex = 0;
}

export function isBgmEnabled(): boolean {
  return enabled;
}

/** オン/オフ切り替え。設定はlocalStorageに保存し、即座に再生/停止に反映 */
export function setBgmEnabled(on: boolean): void {
  enabled = on;
  saveJson(BGM_KEY, on);
  if (on) startBgm();
  else stopBgm();
}

let currentTrackId = 'home';

/** 画面に応じてBGMの曲を切り替える。未知IDは home にフォールバック。
 *  同じ曲の再指定は無視（リスタートさせない）。enabled/再生状態は維持。 */
export function setBgmTrack(id: string): void {
  if (id === currentTrackId) return;
  currentTrackId = id;
  current = TRACKS[id] ?? TRACKS.home;
  noteIndex = 0;
}
