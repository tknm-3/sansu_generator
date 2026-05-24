/**
 * Web Audio で生成する明るいループBGM。
 * 既存SFX（synth.ts）と同様にファイル不要・オフライン動作・ライセンス問題なし。
 * 画面遷移をまたいで鳴り続けるシングルトンとして管理する。
 */
import { loadJson, saveJson } from '../../lib/storage';

const BGM_KEY = 'math-app:bgm-enabled';

// ハ長調の軽快なメロディ（null=休符）。1音 = NOTE 秒でループ。
const E4 = 329.63, F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25;

const MELODY: (number | null)[] = [
  E4, G4, C5, G4, E4, G4, C5, G4,
  F4, A4, D5, A4, F4, A4, D5, C5,
  E4, G4, C5, E5, D5, C5, B4, G4,
  C5, G4, E4, G4, C5, null, C5, null,
];

// 4音ごとに鳴る低音（コードのルート）
const C3 = 130.81, F3 = 174.61, G3 = 196.0;
const BASS: (number | null)[] = [C3, F3, C3, G3, C3, F3, C3, C3];

const NOTE = 0.28; // 1音の長さ（秒）
const LOOKAHEAD = 0.2; // 先読みスケジュール窓（秒）

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = loadJson<boolean>(BGM_KEY, true);
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let nextNoteTime = 0;
let noteIndex = 0;

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
    const m = MELODY[noteIndex % MELODY.length];
    if (m != null) playNote(m, nextNoteTime, NOTE * 0.9, 0.07, 'triangle');
    if (noteIndex % 4 === 0) {
      const b = BASS[Math.floor(noteIndex / 4) % BASS.length];
      if (b != null) playNote(b, nextNoteTime, NOTE * 3.6, 0.05, 'sine');
    }
    nextNoteTime += NOTE;
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
