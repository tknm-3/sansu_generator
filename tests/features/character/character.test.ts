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
  it('trims whitespace and ignores empty names', () => {
    saveCharacterName('   ');
    expect(loadCharacter().name).toBe(DEFAULT_CHARACTER.name);
  });
});
