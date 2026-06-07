import type { ExplainStep } from '../math/explain';
import type { PatternItem } from '../geometry/pattern';
import type { SceneObj } from '../geometry/spatial';

export type NodeKind = 'battle' | 'treasure' | 'rest' | 'boss' | 'mimic';

export type ShapeTransform = { rotate: number; flipX: boolean };

export type BattleVisual =
  | { kind: 'equation'; text: string }
  | { kind: 'objects'; emoji: string; count: number; addCount?: number }
  | { kind: 'groups'; emoji: string; perGroup: number; groups: number }
  | { kind: 'word'; text: string; emoji: string }
  | { kind: 'shape-rotation'; shapeId: string; rotationLabel: string }
  | { kind: 'shape-compose'; questionSvg: string; choiceSvgs: string[] }
  | { kind: 'shape-pattern'; sequence: (PatternItem | null)[]; choiceItems: PatternItem[] }
  | { kind: 'shape-spatial'; objects: SceneObj[] }
  | { kind: 'number-line'; max: number; target: number; marker: string }
  | { kind: 'estimate-pile'; emoji: string; count: number }
  | { kind: 'ten-frame-sum'; a: number; b: number; emojiA: string; emojiB: string };

export interface BattleQuestion {
  unitId: string;
  promptText: string;
  visual?: BattleVisual;
  choices: string[];
  answerIndex: number;
  explainSteps: ExplainStep[];
  /** shape-rotation バトル用: 選択肢ごとの変換情報 */
  choiceTransforms?: ShapeTransform[];
}

export type ItemKind = 'magnifier' | 'cookie';

export interface AdventureZoneDef {
  id: string;
  name: string;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  unitIds: string[];
  layerCount: number;
  tagline?: string;
  story?: string;
  wall?: string;
  tint?: string;
}

export interface MapNode {
  id: string;
  kind: NodeKind;
  zoneId: string;
  layer: number;
  branch: 0 | 1 | -1;
  nextIds: string[];
}

export interface AdventureMap {
  zoneId: string;
  nodes: MapNode[];
  startId: string;
  bossId: string;
}

export interface TornPage {
  question: BattleQuestion;
  nodeId: string;
}

export interface RunState {
  hp: number;
  maxHp: number;
  items: { kind: ItemKind; count: number }[];
  currentNodeId: string;
  visitedIds: string[];
  tornPages: TornPage[];
  sparkles: number;
  startedAt: number;
}
