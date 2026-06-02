import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleButtons } from '../components/BattleButtons';
import { MATH_ADVENTURE_ZONES, getZone } from '../lib/adventure/zones';
import { generateMap, getNode } from '../lib/adventure/mapGen';
import { generateBattleQuestion } from '../lib/adventure/adapters';
import {
  makeInitialRun,
  saveRun,
  clearRun,
  recordZoneClear,
  isZoneCleared,
  isZoneUnlocked,
  calcSparkles,
} from '../lib/adventure/progress';
import type { AdventureMap, RunState, BattleQuestion, MapNode } from '../lib/adventure/types';

interface Props {
  characterName: string;
  characterId: string;
  onExit: () => void;
}

type View = 'hub' | 'map' | 'battle' | 'result';

const ZONE_IDS = MATH_ADVENTURE_ZONES.map((z) => z.id);

// ─── Hub ─────────────────────────────────────────────────────────────────────

function HubScreen({ characterName, onSelectZone, onBack }: {
  characterName: string;
  onSelectZone: (zoneIndex: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-yellow-100 flex flex-col">
      <header className="flex items-center gap-2 p-4">
        <button onClick={onBack} className="text-2xl p-2 rounded-full hover:bg-amber-200">←</button>
        <h1 className="text-2xl font-bold text-amber-800">📚 ふしぎな だいとしょかん</h1>
      </header>

      <p className="text-center text-amber-700 text-sm mb-2">
        {characterName}さん、ようこそ！えほんを えらんで ぼうけんしよう
      </p>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {MATH_ADVENTURE_ZONES.map((zone, i) => {
            const unlocked = isZoneUnlocked(i, ZONE_IDS);
            const cleared = isZoneCleared(zone.id);
            return (
              <motion.button
                key={zone.id}
                disabled={!unlocked}
                onClick={() => onSelectZone(i)}
                whileTap={unlocked ? { scale: 0.94 } : {}}
                className={`relative rounded-2xl p-4 text-left transition-all ${
                  unlocked
                    ? `bg-gradient-to-br ${zone.bgFrom} ${zone.bgTo} shadow-md hover:shadow-lg`
                    : 'bg-gray-100 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-3xl mb-1">{unlocked ? zone.emoji : '🔒'}</div>
                <div className="text-xs font-bold text-gray-700 leading-tight">{zone.name}</div>
                {cleared && (
                  <span className="absolute top-2 right-2 text-sm">🔖</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

const NODE_KIND_EMOJI: Record<string, string> = {
  battle: '⚔️',
  treasure: '🎁',
  rest: '⛺',
  boss: '👑',
  mimic: '🎭',
};

function MapScreen({ map, run, zone, onSelectNode, onBack }: {
  map: AdventureMap;
  run: RunState;
  zone: ReturnType<typeof getZone>;
  onSelectNode: (nodeId: string) => void;
  onBack: () => void;
}) {
  const { nodes } = map;
  const maxLayer = Math.max(...nodes.map((n) => n.layer));

  const layers: MapNode[][] = [];
  for (let l = 0; l <= maxLayer; l++) {
    layers.push(nodes.filter((n) => n.layer === l));
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${zone.bgFrom} ${zone.bgTo} flex flex-col`}>
      <header className="flex items-center gap-2 p-4">
        <button onClick={onBack} className="text-2xl p-2 rounded-full hover:bg-white/40">←</button>
        <h1 className="text-xl font-bold text-gray-800">{zone.emoji} {zone.name}</h1>
        <div className="ml-auto flex gap-1">
          {Array.from({ length: run.maxHp }).map((_, i) => (
            <span key={i} className={i < run.hp ? 'text-2xl' : 'text-2xl opacity-30'}>❤️</span>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
        {[...layers].reverse().map((layer, revIdx) => {
          const l = maxLayer - revIdx;
          return (
            <div key={l} className="flex justify-center gap-4">
              {layer.map((node) => {
                const visited = run.visitedIds.includes(node.id);
                const isCurrent = run.currentNodeId === node.id;
                const reachable = run.currentNodeId
                  ? (() => {
                      const cur = nodes.find((n) => n.id === run.currentNodeId);
                      return cur?.nextIds.includes(node.id) ?? false;
                    })()
                  : node.id === map.startId;

                return (
                  <motion.button
                    key={node.id}
                    disabled={!reachable && !isCurrent}
                    onClick={() => reachable && onSelectNode(node.id)}
                    whileTap={reachable ? { scale: 0.9 } : {}}
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-2xl font-bold shadow transition-all ${
                      isCurrent
                        ? 'bg-white ring-4 ring-yellow-400 scale-110'
                        : visited
                        ? 'bg-white/40 text-gray-500'
                        : reachable
                        ? 'bg-white shadow-lg hover:scale-105 cursor-pointer'
                        : 'bg-white/20 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{visited && !isCurrent ? '✅' : NODE_KIND_EMOJI[node.kind]}</span>
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Battle ───────────────────────────────────────────────────────────────────

function BattleScreen({ question, run, node, onCorrect, onWrong }: {
  question: BattleQuestion;
  run: RunState;
  node: MapNode;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const handlePick = useCallback((index: number) => {
    if (locked) return;
    setChosen(index);
    setLocked(true);
    if (index === question.answerIndex) {
      setTimeout(onCorrect, 800);
    } else {
      setTimeout(onWrong, 800);
    }
  }, [locked, question.answerIndex, onCorrect, onWrong]);

  const nodeLabel = node.kind === 'boss' ? '👑 ラスボス！' : NODE_KIND_EMOJI[node.kind] + ' バトル';
  const isCorrect = chosen === question.answerIndex;
  const isWrong = chosen !== null && !isCorrect;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-100 flex flex-col items-center">
      <header className="w-full flex items-center justify-between p-4">
        <span className="text-sm font-bold text-gray-600">{nodeLabel}</span>
        <div className="flex gap-1">
          {Array.from({ length: run.maxHp }).map((_, i) => (
            <span key={i} className={i < run.hp ? 'text-xl' : 'text-xl opacity-30'}>❤️</span>
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 w-full max-w-sm">
        {/* 問題表示 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.promptText}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-lg w-full text-center"
          >
            {question.visual?.kind === 'equation' && (
              <div className="text-4xl font-bold text-gray-800 mb-2">{question.visual.text}</div>
            )}
            {question.visual?.kind === 'objects' && (
              <div className="mb-2">
                <div className="text-3xl mb-1">
                  {Array.from({ length: Math.min(question.visual.count, 10) }).map((_, i) => (
                    <span key={i}>{question.visual!.kind === 'objects' ? (question.visual as { kind: 'objects'; emoji: string }).emoji : ''}</span>
                  ))}
                </div>
                {question.visual.count > 10 && (
                  <div className="text-lg text-gray-600">（{question.visual.count}こ）</div>
                )}
              </div>
            )}
            {question.visual?.kind === 'word' && (
              <div className="text-base text-gray-700 whitespace-pre-line text-left leading-relaxed">
                {question.visual.text}
              </div>
            )}
            {!question.visual && (
              <div className="text-2xl font-bold text-gray-800">{question.promptText}</div>
            )}
            {question.visual && (
              <div className="text-lg text-gray-600 mt-2">{question.promptText}</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 結果フィードバック */}
        <AnimatePresence>
          {chosen !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-3xl font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-400'}`}
            >
              {isCorrect ? '🎉 せいかい！' : `こたえは ${question.choices[question.answerIndex]} だよ`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 選択肢 */}
        <BattleButtons
          choices={question.choices}
          onPick={handlePick}
          disabled={locked}
          correctIndex={chosen !== null ? question.answerIndex : undefined}
          wrongIndex={isWrong ? chosen! : undefined}
        />
      </div>
    </div>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────

function ResultScreen({ run, zoneName, onContinue, onHub }: {
  run: RunState;
  zoneName: string;
  onContinue: () => void;
  onHub: () => void;
}) {
  const sparkles = calcSparkles(run.maxHp, run.hp);
  const perfect = sparkles === 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-amber-100 flex flex-col items-center justify-center gap-6 p-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="text-6xl"
      >
        {perfect ? '🏆' : '🎊'}
      </motion.div>
      <h2 className="text-3xl font-bold text-amber-800 text-center">
        {zoneName} クリア！
      </h2>
      <div className="flex gap-2 text-4xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: i < sparkles ? 1 : 0.5 }}
            transition={{ delay: i * 0.2 }}
            className={i < sparkles ? '' : 'opacity-30'}
          >
            ✨
          </motion.span>
        ))}
      </div>
      {perfect && (
        <p className="text-emerald-600 font-bold text-lg">ぴったり賞！ノーミスで クリア！</p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onContinue}
          className="bg-amber-500 text-white rounded-2xl py-4 text-xl font-bold shadow-lg hover:bg-amber-600 transition-colors"
        >
          つぎの ゾーンへ →
        </button>
        <button
          onClick={onHub}
          className="bg-white text-amber-700 rounded-2xl py-3 text-lg font-bold shadow hover:bg-amber-50 transition-colors"
        >
          としょかんに もどる
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MathAdventureUnit({ characterName, onExit }: Props) {
  const [view, setView] = useState<View>('hub');
  const [zoneIndex, setZoneIndex] = useState(0);
  const [map, setMap] = useState<AdventureMap | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);

  const currentZone = MATH_ADVENTURE_ZONES[zoneIndex];

  function startZone(idx: number) {
    const zone = MATH_ADVENTURE_ZONES[idx];
    const rng = Math.random;
    const newMap = generateMap(zone, rng);
    const newRun = makeInitialRun(zone.id, newMap.startId);
    setZoneIndex(idx);
    setMap(newMap);
    setRun(newRun);
    setView('map');
  }

  function enterNode(nodeId: string) {
    if (!map || !run) return;
    const node = getNode(map, nodeId);

    const updatedRun: RunState = {
      ...run,
      currentNodeId: nodeId,
      visitedIds: [...run.visitedIds, nodeId],
    };

    if (node.kind === 'rest') {
      const healed = { ...updatedRun, hp: Math.min(updatedRun.maxHp, updatedRun.hp + 1) };
      setRun(healed);
      saveRun(healed);
      return;
    }

    if (node.kind === 'treasure') {
      setRun(updatedRun);
      saveRun(updatedRun);
      return;
    }

    // battle / boss / mimic → 問題を出す
    const zone = getZone(node.zoneId);
    const unitId = zone.unitIds[Math.floor(Math.random() * zone.unitIds.length)];
    const q = generateBattleQuestion(unitId);
    setQuestion(q);
    setActiveNode(node);
    setRun(updatedRun);
    saveRun(updatedRun);
    setView('battle');
  }

  function handleCorrect() {
    if (!run || !activeNode || !map) return;
    const isBoss = activeNode.kind === 'boss';
    if (isBoss) {
      const sparkles = calcSparkles(run.maxHp, run.hp);
      recordZoneClear(currentZone.id, sparkles === 3, sparkles);
      clearRun();
      setView('result');
    } else {
      setView('map');
    }
  }

  function handleWrong() {
    if (!run || !activeNode) return;
    const newHp = Math.max(0, run.hp - 1);
    const updated = { ...run, hp: newHp };
    setRun(updated);
    saveRun(updated);
    // HP0でも続行（案A）
    setTimeout(() => setView('map'), 1000);
  }

  if (view === 'hub') {
    return (
      <HubScreen
        characterName={characterName}
        onSelectZone={startZone}
        onBack={onExit}
      />
    );
  }

  if (view === 'map' && map && run) {
    return (
      <MapScreen
        map={map}
        run={run}
        zone={currentZone}
        onSelectNode={enterNode}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'battle' && question && run && activeNode) {
    return (
      <BattleScreen
        question={question}
        run={run}
        node={activeNode}
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />
    );
  }

  if (view === 'result' && run) {
    return (
      <ResultScreen
        run={run}
        zoneName={currentZone.name}
        onContinue={() => {
          const next = zoneIndex + 1;
          if (next < MATH_ADVENTURE_ZONES.length) {
            startZone(next);
          } else {
            setView('hub');
          }
        }}
        onHub={() => setView('hub')}
      />
    );
  }

  return null;
}
