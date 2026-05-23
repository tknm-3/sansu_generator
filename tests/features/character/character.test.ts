import { describe, it, expect, beforeEach } from 'vitest';
import { loadCharacter, saveCharacterName, DEFAULT_CHARACTER } from '../../../src/features/character/character';

beforeEach(() => localStorage.clear());

describe('character profile', () => {
  it('returns default when nothing stored', () => {
    expect(loadCharacter()).toEqual(DEFAULT_CHARACTER);
  });
  it('persists and reloads the chosen name', () => {
    saveCharacterName('うさたろう');
    expect(loadCharacter().name).toBe('うさたろう');
  });
  it('trims whitespace and keeps the default name for empty input', () => {
    saveCharacterName('   ');
    expect(loadCharacter().name).toBe(DEFAULT_CHARACTER.name);
  });
  it('persists the named flag even when the name is empty', () => {
    saveCharacterName('   ');
    expect(loadCharacter().named).toBe(true);
  });
});
