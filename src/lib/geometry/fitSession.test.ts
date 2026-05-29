import { describe, it, expect } from 'vitest';
import { pickPuzzles, rememberPuzzles, puzzleRank } from './fitSession';

const P = (id: string) => ({ id });

describe('pickPuzzles', () => {
  it('さいきん だしてない ものを ゆうせんして えらぶ', () => {
    const all = ['a', 'b', 'c', 'd'].map(P);
    // a,b は さいきん だした → c,d が さきに えらばれる
    const picked = pickPuzzles(all, ['a', 'b'], 2);
    const ids = picked.map((p) => p.id).sort();
    expect(ids).toEqual(['c', 'd']);
  });

  it('fresh が たりなければ stale で うめる（じゅうふく なし）', () => {
    const all = ['a', 'b', 'c'].map(P);
    const picked = pickPuzzles(all, ['a', 'b', 'c'], 2);
    expect(picked).toHaveLength(2);
    expect(new Set(picked.map((p) => p.id)).size).toBe(2);
  });

  it('count が ぜんたいより おおくても はみ出さない', () => {
    const all = ['a', 'b'].map(P);
    expect(pickPuzzles(all, [], 5)).toHaveLength(2);
  });

  it('そら の ばあいは そら', () => {
    expect(pickPuzzles([], [], 3)).toEqual([]);
  });
});

describe('rememberPuzzles', () => {
  it('あたらしいIDが せんとうに きて、keep こ だけ のこる', () => {
    const next = rememberPuzzles(['a', 'b', 'c'], ['d', 'e'], 4);
    expect(next).toEqual(['d', 'e', 'a', 'b']);
  });

  it('じゅうふくは のぞく', () => {
    const next = rememberPuzzles(['a', 'b'], ['b', 'c'], 10);
    expect(next).toEqual(['b', 'c', 'a']);
  });
});

describe('puzzleRank', () => {
  it('クリアすう で ランクが あがる', () => {
    expect(puzzleRank(0).label).toBe('はじめまして');
    expect(puzzleRank(1).label).toBe('がんばってるね');
    expect(puzzleRank(3).label).toBe('じょうずだね');
    expect(puzzleRank(6).label).toBe('パズル はかせ');
    expect(puzzleRank(10).label).toBe('パズル マスター');
  });

  it('つぎの ランクまでの のこり かいすうを かえす', () => {
    expect(puzzleRank(0).toNext).toBe(1);
    expect(puzzleRank(4).toNext).toBe(2); // つぎは 6
    expect(puzzleRank(10).toNext).toBe(0); // さいこうランク
  });
});
