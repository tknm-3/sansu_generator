import { loadJson } from '../lib/storage';
import { EMPTY_STAMPS, STAMP_KEY, type StampState } from '../features/rewards/stamps';
import { countByDay, currentStreak } from '../lib/progress';
import { dateKey } from '../lib/dateKey';

interface Props {
  onClose: () => void;
}

/** 直近14日分の日付(古い→新しい)を返す。 */
function recentDays(todayMs: number, n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(todayMs);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function ProgressCalendar({ onClose }: Props) {
  const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
  const byDay = countByDay(stamps.history);
  const now = Date.now();
  const streak = currentStreak(stamps.history, now);
  const todayCount = byDay.get(dateKey(now)) ?? 0;
  const days = recentDays(now, 14);

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-amber-100 to-sky-50 p-6">
      <h1 className="text-2xl font-bold text-amber-800">がんばり カレンダー</h1>
      <div className="flex gap-4 text-lg font-bold text-amber-700">
        <span>れんぞく {streak}にち</span>
        <span>きょうは {todayCount}こ</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const c = byDay.get(dateKey(d.getTime())) ?? 0;
          return (
            <div key={dateKey(d.getTime())}
              className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white shadow">
              <span className="text-[10px] text-amber-500">{d.getMonth() + 1}/{d.getDate()}</span>
              <span className="text-sm leading-none">{c > 0 ? '🌸'.repeat(Math.min(c, 3)) : ''}</span>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onClose}
        className="mt-4 rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0] active:translate-y-1 transition-all">
        ホームに もどる
      </button>
    </div>
  );
}
