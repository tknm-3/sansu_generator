import type { Player } from './types';

export const BINGO_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
] as const;

function squareToCell(n: number) {
  const rfb = Math.floor((n - 1) / 10);
  const c   = (n - 1) % 10;
  return { row: 9 - rfb, col: rfb % 2 === 0 ? c : 9 - c };
}

export const BOARD_GRID: number[][] = (() => {
  const g = Array.from({ length: 10 }, () => Array<number>(10).fill(0));
  for (let n = 1; n <= 100; n++) {
    const { row, col } = squareToCell(n);
    g[row][col] = n;
  }
  return g;
})();

/** ゲーム開始時にボーナスマスをランダムに配置（5〜95 の範囲で count 個） */
export function generateBonusSquares(count: number = 8): number[] {
  const pool: number[] = [];
  for (let n = 5; n <= 95; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

export function getNewBingos(player: Player): number[] {
  return BINGO_LINES.flatMap((line, i) => {
    if (player.doneLines.includes(i)) return [];
    return line.every(j => player.checked[j]) ? [i] : [];
  });
}

export function getReachNumbers(player: Player): number[] {
  const res = new Set<number>();
  BINGO_LINES.forEach((line, i) => {
    if (player.doneLines.includes(i)) return;
    const unchecked = line.filter(j => !player.checked[j]);
    if (unchecked.length === 1) res.add(player.numbers[unchecked[0]]);
  });
  return [...res].sort((a, b) => a - b);
}

/** マスを踏んで全員のビンゴカードに反映。どのカードセルが光ったかも返す */
export function markBingoNumber(
  square: number,
  ps: Player[],
): { updated: Player[]; flashMap: Map<number, Set<number>> } {
  const flashMap = new Map<number, Set<number>>();
  const updated = ps.map((p, pi) => {
    const idx = p.numbers.indexOf(square);
    if (idx === -1) return p;
    const newChecked = [...p.checked];
    newChecked[idx] = true;
    const set = flashMap.get(pi) ?? new Set<number>();
    set.add(idx);
    flashMap.set(pi, set);
    return { ...p, checked: newChecked };
  });
  return { updated, flashMap };
}

export interface BingoEvent { playerIdx: number; count: number }

/** 全プレイヤーのビンゴ達成をまとめてチェック */
export function processAllBingos(
  ps: Player[],
): { updated: Player[]; events: BingoEvent[] } {
  let updated = ps;
  const events: BingoEvent[] = [];
  ps.forEach((_, i) => {
    const newLines = getNewBingos(updated[i]);
    if (newLines.length > 0) {
      updated = updated.map((pl, j) =>
        j === i ? { ...pl, doneLines: [...pl.doneLines, ...newLines] } : pl,
      );
      events.push({ playerIdx: i, count: newLines.length });
    }
  });
  return { updated, events };
}

/** 各マスにビンゴカードを持つプレイヤーのインデックスリストを返す */
export function buildSquareOwnerMap(players: Player[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  players.forEach((p, pi) => {
    p.numbers.forEach(n => {
      const arr = map.get(n) ?? [];
      arr.push(pi);
      map.set(n, arr);
    });
  });
  return map;
}
