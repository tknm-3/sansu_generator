import { loadJson, saveJson } from '../../lib/storage';

export interface Character {
  id: string;
  name: string;
  named: boolean; // 命名済みか（初回命名画面の出し分けに使う）
}

export const DEFAULT_CHARACTER: Character = { id: 'usagi', name: 'うさぎ', named: false };

const KEY = 'math-app:profile';

export function loadCharacter(): Character {
  return loadJson<Character>(KEY, DEFAULT_CHARACTER);
}

/** 名前を保存。空白のみは無視（既定のまま）。 */
export function saveCharacterName(name: string): Character {
  const trimmed = name.trim();
  const current = loadCharacter();
  if (trimmed.length === 0) return current;
  const next: Character = { ...current, name: trimmed, named: true };
  saveJson(KEY, next);
  return next;
}
