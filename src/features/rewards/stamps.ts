export interface StampEntry {
  unitId: string;
  at: number; // 取得時刻(ms)
}

export interface StampState {
  total: number;
  history: StampEntry[];
}

export const EMPTY_STAMPS: StampState = { total: 0, history: [] };

/** スタンプ状態の localStorage キー（全画面で共有） */
export const STAMP_KEY = 'math-app:stamps';

/** マイルストーン達成でスタンプを1つ付与（不変・新オブジェクトを返す） */
export function addStamp(state: StampState, unitId: string, at: number): StampState {
  return {
    total: state.total + 1,
    history: [...state.history, { unitId, at }],
  };
}
