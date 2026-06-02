import type { AdventureZoneDef } from './types';

export const MATH_ADVENTURE_ZONES: AdventureZoneDef[] = [
  {
    id: 'zone-maketen',
    name: 'はじまりの もり',
    emoji: '🌳',
    bgFrom: 'from-green-100',
    bgTo: 'to-emerald-200',
    unitIds: ['make-ten'],
    layerCount: 8,
  },
  {
    id: 'zone-addition',
    name: 'たしざんの みち',
    emoji: '➕',
    bgFrom: 'from-sky-100',
    bgTo: 'to-blue-200',
    unitIds: ['addition'],
    layerCount: 8,
  },
  {
    id: 'zone-subtraction',
    name: 'ひきざんの はら',
    emoji: '➖',
    bgFrom: 'from-orange-100',
    bgTo: 'to-amber-200',
    unitIds: ['subtraction'],
    layerCount: 8,
  },
  {
    id: 'zone-cherry',
    name: 'さくらんぼの おか',
    emoji: '🍒',
    bgFrom: 'from-rose-100',
    bgTo: 'to-pink-200',
    unitIds: ['cherry-calc'],
    layerCount: 8,
  },
  {
    id: 'zone-bigadd',
    name: 'ふたけたの まち',
    emoji: '🏘️',
    bgFrom: 'from-violet-100',
    bgTo: 'to-purple-200',
    unitIds: ['big-addition'],
    layerCount: 8,
  },
  {
    id: 'zone-word',
    name: 'ぴったり みなと',
    emoji: '⚓',
    bgFrom: 'from-teal-100',
    bgTo: 'to-cyan-200',
    unitIds: ['word-addition', 'word-subtraction'],
    layerCount: 8,
  },
  {
    id: 'zone-rotation',
    name: 'くるくる アトリエ',
    emoji: '🔄',
    bgFrom: 'from-yellow-100',
    bgTo: 'to-lime-200',
    unitIds: ['shape-rotation'],
    layerCount: 8,
  },
  {
    id: 'zone-compose',
    name: 'かたちあわせ こうぼう',
    emoji: '🧩',
    bgFrom: 'from-indigo-100',
    bgTo: 'to-blue-200',
    unitIds: ['shape-compose'],
    layerCount: 8,
  },
  {
    id: 'zone-pattern',
    name: 'もようの にわ',
    emoji: '🔁',
    bgFrom: 'from-fuchsia-100',
    bgTo: 'to-pink-200',
    unitIds: ['shape-pattern', 'shape-spatial'],
    layerCount: 8,
  },
  {
    id: 'zone-boss',
    name: 'だいとしょかんの おく',
    emoji: '🌟',
    bgFrom: 'from-amber-100',
    bgTo: 'to-yellow-200',
    unitIds: ['make-ten', 'addition', 'subtraction', 'cherry-calc', 'big-addition'],
    layerCount: 10,
  },
];

export function getZone(id: string): AdventureZoneDef {
  const z = MATH_ADVENTURE_ZONES.find((z) => z.id === id);
  if (!z) throw new Error(`zone not found: ${id}`);
  return z;
}
