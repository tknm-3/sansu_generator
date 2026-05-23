/**
 * localStorage アクセスを一元管理する層。
 * 仕様§7：読めない/壊れた/保存失敗でもアプリを落とさない（優雅な劣化）。
 */
export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** 保存。成功で true、失敗（容量超過・stringify失敗等）でも例外を投げず false */
export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
