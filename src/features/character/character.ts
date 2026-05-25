import { loadJson, saveJson } from '../../lib/storage';
import { CHARACTER_DEFS } from './characterDefs';

export interface Character {
  id: string;
  name: string;
  named: boolean; // 命名済みか（初回命名画面の出し分けに使う）
  characterNames: Record<string, string>; // キャラクターIDごとのカスタム名
}

export const DEFAULT_CHARACTER: Character = {
  id: 'usagi',
  name: 'うさぎ',
  named: false,
  characterNames: {},
};

const KEY = 'math-app:profile';

export function loadCharacter(): Character {
  const saved = loadJson<Partial<Character>>(KEY, DEFAULT_CHARACTER);
  return {
    ...DEFAULT_CHARACTER,
    ...saved,
    characterNames: saved.characterNames ?? {},
  };
}

/** キャラクターの表示名を取得（カスタム名 > デフォルト名） */
export function getCharName(charId: string, characterNames: Record<string, string>): string {
  return characterNames[charId] ?? CHARACTER_DEFS.find((c) => c.id === charId)?.name ?? charId;
}

/** 初回命名。空白のみのときは既定の名前のまま、命名済みフラグだけ立てる。 */
export function saveCharacterName(name: string): Character {
  const trimmed = name.trim();
  const current = loadCharacter();
  const finalName = trimmed.length === 0 ? current.name : trimmed;
  const next: Character = {
    ...current,
    name: finalName,
    named: true,
    characterNames: { ...current.characterNames, [current.id]: finalName },
  };
  saveJson(KEY, next);
  return next;
}

/** 指定キャラクターに名前をつける。空白のみのときはデフォルト名を使う。 */
export function saveCharacterNameForId(charId: string, name: string): Character {
  const trimmed = name.trim();
  const current = loadCharacter();
  const def = CHARACTER_DEFS.find((c) => c.id === charId);
  const finalName = trimmed.length === 0 ? (def?.name ?? charId) : trimmed;
  const next: Character = {
    ...current,
    characterNames: { ...current.characterNames, [charId]: finalName },
    ...(current.id === charId ? { name: finalName } : {}),
  };
  saveJson(KEY, next);
  return next;
}
