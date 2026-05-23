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

/** 名前を保存。空白のみのときは既定の名前のまま、命名済みフラグだけ立てる。 */
export function saveCharacterName(name: string): Character {
  const trimmed = name.trim();
  const current = loadCharacter();
  // 空白のみでも named を永続化する（命名画面を再度出さないため）。
  const next: Character = trimmed.length === 0
    ? { ...current, named: true }
    : { ...current, name: trimmed, named: true };
  saveJson(KEY, next);
  return next;
}
