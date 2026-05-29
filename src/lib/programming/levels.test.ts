import { describe, it, expect } from 'vitest';
import { SEQUENCE_LEVELS, DEBUG_LEVELS } from './levels';
import { solve, runProgram, isCleared, type Level, type Command } from './engine';

function toCommands(dirs: { length: number } & Iterable<string>): Command[] {
  return [...(dirs as Iterable<import('./engine').Dir>)].map((dir) => ({ kind: 'move' as const, dir }));
}

const allSequence: Level[] = [
  ...SEQUENCE_LEVELS.easy,
  ...SEQUENCE_LEVELS.normal,
  ...SEQUENCE_LEVELS.hard,
];
const allDebug: Level[] = [...DEBUG_LEVELS.easy, ...DEBUG_LEVELS.normal, ...DEBUG_LEVELS.hard];

describe('矢印ならべ レベル', () => {
  it.each(allSequence)('$id は 解けて optimal と一致する', (level) => {
    const path = solve(level);
    expect(path, `${level.id} に解が無い`).not.toBeNull();
    expect(path!.length, `${level.id} の optimal がずれている`).toBe(level.optimal);
    const result = runProgram(level, toCommands(path!));
    expect(isCleared(result)).toBe(true);
  });
});

describe('デバッグ レベル', () => {
  it.each(allDebug)('$id の solution は クリアする', (level) => {
    expect(level.buggy, `${level.id} に buggy が無い`).toBeDefined();
    expect(level.solution, `${level.id} に solution が無い`).toBeDefined();
    expect(level.buggy!.length, `${level.id} は buggy と solution の長さが違う`).toBe(
      level.solution!.length,
    );
    const result = runProgram(level, toCommands(level.solution!));
    expect(isCleared(result), `${level.id} の solution が ゴールに着かない`).toBe(true);
  });

  it.each(allDebug)('$id の buggy は まだクリアしていない', (level) => {
    const result = runProgram(level, toCommands(level.buggy!));
    expect(isCleared(result), `${level.id} の buggy が最初から正解になっている`).toBe(false);
  });
});
