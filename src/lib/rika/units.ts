import type { RikaUnitId, RikaKind } from './types';

// 理科の 単元（テーマ）定義。ホーム画面と ユニット画面が これを 参照する。
// kinds = その単元で 出すメカ（ランダムで まぜて 出す）。stampId = ごほうびスタンプの id。
export interface RikaUnitDef {
  id: RikaUnitId;
  title: string; // ホームの ボタン文言（ぜんぶ ひらがな）
  emoji: string; // 大きな絵
  blurb: string; // ひとこと せつめい
  kinds: RikaKind[];
  stampId: string;
  // 画面の いろ（Tailwind グラデ／かげ／アクセント）
  theme: { grad: string; accent: string; shadow: string };
}

export const RIKA_UNITS: RikaUnitDef[] = [
  {
    id: 'ikimono',
    title: 'いきもの かんさつ',
    emoji: '🐾',
    blurb: 'およぐ・とぶ・むし… なかまわけ！',
    kinds: ['classify', 'odd-one-out'],
    stampId: 'rika-ikimono',
    theme: { grad: 'from-lime-200 via-emerald-100 to-amber-50', accent: 'emerald', shadow: '#047857' },
  },
  {
    id: 'sodatsu',
    title: 'そだつ じゅんばん',
    emoji: '🌱',
    blurb: 'たまご→ひよこ… じゅんに ならべよう！',
    kinds: ['sequence'],
    stampId: 'rika-sodatsu',
    theme: { grad: 'from-green-200 via-lime-100 to-yellow-50', accent: 'green', shadow: '#15803d' },
  },
  {
    id: 'ukishizumu',
    title: 'うくかな？ しずむかな？',
    emoji: '🛟',
    blurb: 'みずに いれたら… よそう して みよう！',
    kinds: ['predict', 'classify'],
    stampId: 'rika-ukishizumu',
    theme: { grad: 'from-sky-200 via-cyan-100 to-blue-50', accent: 'sky', shadow: '#0369a1' },
  },
  {
    id: 'jishaku',
    title: 'じしゃく けんきゅうじょ',
    emoji: '🧲',
    blurb: 'くっつく？ つかない？ よそう しよう！',
    kinds: ['predict', 'classify'],
    stampId: 'rika-jishaku',
    theme: { grad: 'from-red-200 via-rose-100 to-amber-50', accent: 'rose', shadow: '#be123c' },
  },
  {
    id: 'kisetsu',
    title: 'きせつと おてんき',
    emoji: '🌤️',
    blurb: 'なつ・ふゆ・あめの ひ… なかまわけ！',
    kinds: ['classify', 'odd-one-out', 'sequence'],
    stampId: 'rika-kisetsu',
    theme: { grad: 'from-orange-200 via-amber-100 to-sky-50', accent: 'orange', shadow: '#c2410c' },
  },
];

export function getRikaUnit(id: RikaUnitId): RikaUnitDef {
  return RIKA_UNITS.find((u) => u.id === id) ?? RIKA_UNITS[0];
}
