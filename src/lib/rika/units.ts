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
  // 画面の いろ。Tailwind v4 は 動的クラス名を 拾えないので すべて リテラル文字列で もつ
  // （@source が src を なめる＝ここに 書いた クラスは 生成される）。
  theme: {
    grad: string; // 背景グラデ 'from-… via-… to-…'
    shadow: string; // boxShadow 用の hex
    text: string; // 見出し・お題（濃いめ 800）
    textSoft: string; // カウンタ・ヒント（600）
    textBtn: string; // もどるボタン（700）
    dot: string; // すすみドット・ばんごうバッジ（bg 500）
    border: string; // 正解わく（border 400）
  };
}

export const RIKA_UNITS: RikaUnitDef[] = [
  {
    id: 'ikimono',
    title: 'いきもの かんさつ',
    emoji: '🐾',
    blurb: 'およぐ・とぶ・むし… なかまわけ！',
    kinds: ['classify', 'odd-one-out'],
    stampId: 'rika-ikimono',
    theme: {
      grad: 'from-lime-200 via-emerald-100 to-amber-50',
      shadow: '#047857',
      text: 'text-emerald-800',
      textSoft: 'text-emerald-600',
      textBtn: 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: 'border-emerald-400',
    },
  },
  {
    id: 'sodatsu',
    title: 'そだつ じゅんばん',
    emoji: '🌱',
    blurb: 'たまご→ひよこ… じゅんに ならべよう！',
    kinds: ['sequence'],
    stampId: 'rika-sodatsu',
    theme: {
      grad: 'from-green-200 via-lime-100 to-yellow-50',
      shadow: '#15803d',
      text: 'text-green-800',
      textSoft: 'text-green-600',
      textBtn: 'text-green-700',
      dot: 'bg-green-500',
      border: 'border-green-400',
    },
  },
  {
    id: 'ukishizumu',
    title: 'うくかな？ しずむかな？',
    emoji: '🛟',
    blurb: 'みずに いれたら… よそう して みよう！',
    kinds: ['predict', 'classify'],
    stampId: 'rika-ukishizumu',
    theme: {
      grad: 'from-sky-200 via-cyan-100 to-blue-50',
      shadow: '#0369a1',
      text: 'text-sky-800',
      textSoft: 'text-sky-600',
      textBtn: 'text-sky-700',
      dot: 'bg-sky-500',
      border: 'border-sky-400',
    },
  },
  {
    id: 'jishaku',
    title: 'じしゃく けんきゅうじょ',
    emoji: '🧲',
    blurb: 'くっつく？ つかない？ よそう しよう！',
    kinds: ['predict', 'classify'],
    stampId: 'rika-jishaku',
    theme: {
      grad: 'from-red-200 via-rose-100 to-amber-50',
      shadow: '#be123c',
      text: 'text-rose-800',
      textSoft: 'text-rose-600',
      textBtn: 'text-rose-700',
      dot: 'bg-rose-500',
      border: 'border-rose-400',
    },
  },
  {
    id: 'kisetsu',
    title: 'きせつと おてんき',
    emoji: '🌤️',
    blurb: 'なつ・ふゆ・あめの ひ… なかまわけ！',
    kinds: ['classify', 'odd-one-out', 'sequence'],
    stampId: 'rika-kisetsu',
    theme: {
      grad: 'from-orange-200 via-amber-100 to-sky-50',
      shadow: '#c2410c',
      text: 'text-orange-800',
      textSoft: 'text-orange-600',
      textBtn: 'text-orange-700',
      dot: 'bg-orange-500',
      border: 'border-orange-400',
    },
  },
];

export function getRikaUnit(id: RikaUnitId): RikaUnitDef {
  return RIKA_UNITS.find((u) => u.id === id) ?? RIKA_UNITS[0];
}
