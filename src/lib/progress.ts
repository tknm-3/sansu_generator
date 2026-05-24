import type { StampEntry } from '../features/rewards/stamps';
import { dateKey } from './dateKey';

/** 履歴を日付キー(YYYY-MM-DD) → スタンプ数 の Map に集計する。 */
export function countByDay(history: StampEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of history) {
    const k = dateKey(e.at);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** todayMs を起点に、過去へ連続してスタンプがある日数を数える。 */
export function currentStreak(history: StampEntry[], todayMs: number): number {
  const map = countByDay(history);
  let streak = 0;
  const cursor = new Date(todayMs);
  cursor.setHours(12, 0, 0, 0);
  while (map.has(dateKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
