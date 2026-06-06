import { describe, it, expect } from 'vitest';
import {
  generateBonusSquares,
  isLandmark,
  makeCompareQuiz,
  makeNumberLineQuiz,
  makeBonusQuiz,
  makeNearestQuiz,
  makePlusTenQuiz,
  makeDistanceQuiz,
  makeDistanceChoices,
  isNumberLineCorrect,
  rollBonusSteps,
  shouldTriggerLandmarkBonus,
  firstPassedLandmark,
  NUMBERLINE_TOLERANCE,
  makePredictQuiz,
  rollPredictBonusSteps,
  shouldTriggerPredictBonus,
  PREDICT_BONUS_MAX,
  PREDICT_BONUS_TOLERANCE,
} from './logic';

describe('generateBonusSquares（キリ番固定）', () => {
  it('10〜90 の 10の倍数を返す', () => {
    expect(generateBonusSquares()).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });
});

describe('isLandmark', () => {
  it('1〜99 の 10の倍数だけ true（0・100 は除外）', () => {
    expect(isLandmark(10)).toBe(true);
    expect(isLandmark(50)).toBe(true);
    expect(isLandmark(0)).toBe(false);
    expect(isLandmark(100)).toBe(false);
    expect(isLandmark(23)).toBe(false);
  });
});

describe('makeCompareQuiz（大小比較）', () => {
  it('a≠b で answer は大きいほう・両方 1〜99', () => {
    for (let i = 0; i < 500; i++) {
      const q = makeCompareQuiz();
      if (q.kind !== 'compare') throw new Error('compare のはず');
      expect(q.a).not.toBe(q.b);
      expect(q.answer).toBe(Math.max(q.a, q.b));
      for (const n of [q.a, q.b]) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(99);
      }
    }
  });
});

describe('makeNumberLineQuiz（数直線推定）', () => {
  it('target は 1〜99・tolerance は規定値', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeNumberLineQuiz();
      if (q.kind !== 'numberline') throw new Error('numberline のはず');
      expect(q.target).toBeGreaterThanOrEqual(1);
      expect(q.target).toBeLessThanOrEqual(99);
      expect(q.tolerance).toBe(NUMBERLINE_TOLERANCE);
    }
  });
});

describe('makeBonusQuiz（ランダム）', () => {
  it('players なしなら distance は出ない（rng<0.5 で compare、>=0.8 で numberline）', () => {
    expect(makeBonusQuiz(undefined, () => 0.1).kind).toBe('compare');
    expect(makeBonusQuiz(undefined, () => 0.9).kind).toBe('numberline');
  });
  it('players ありで rng<0.3 なら distance、差が作れる', () => {
    const players = [
      { name: 'こども', char: '🐶', pos: 12 },
      { name: 'パパ',   char: '🐱', pos: 40 },
    ];
    expect(makeBonusQuiz(players, () => 0.1).kind).toBe('distance');
  });
  it('players が全員同じ位置なら distance にフォールバックしない', () => {
    const players = [
      { name: 'こども', char: '🐶', pos: 30 },
      { name: 'パパ',   char: '🐱', pos: 30 },
    ];
    expect(makeBonusQuiz(players, () => 0.1).kind).toBe('compare');
  });
});

describe('makeDistanceQuiz（だれとだれの差）', () => {
  it('位置の異なる2人から左(pos小)=a / 右(pos大)=b・answer=差', () => {
    const players = [
      { name: 'こども', char: '🐶', pos: 55 },
      { name: 'パパ',   char: '🐱', pos: 23 },
    ];
    const q = makeDistanceQuiz(players, () => 0);
    if (!q) throw new Error('distance のはず');
    expect(q.a.pos).toBeLessThan(q.b.pos);
    expect(q.answer).toBe(q.b.pos - q.a.pos);
    expect(q.choices).toContain(q.answer);
    expect(q.choices).toHaveLength(3);
    expect(new Set(q.choices).size).toBe(3);
  });
  it('全員同じ位置なら null', () => {
    const players = [
      { name: 'こども', char: '🐶', pos: 30 },
      { name: 'パパ',   char: '🐱', pos: 30 },
    ];
    expect(makeDistanceQuiz(players, () => 0)).toBe(null);
  });
});

describe('makeDistanceChoices（差の3択）', () => {
  it('answer を含む3つ・重複なし・0〜100', () => {
    for (let answer = 1; answer <= 99; answer++) {
      for (const r of [0, 0.3, 0.6, 0.99]) {
        const cs = makeDistanceChoices(answer, () => r);
        expect(cs).toContain(answer);
        expect(cs).toHaveLength(3);
        expect(new Set(cs).size).toBe(3);
        for (const c of cs) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe('rollBonusSteps（ビンゴボーナスの進数）', () => {
  it('常に 5〜10 の整数を返す（何ビンゴでも1回分）', () => {
    for (let i = 0; i < 500; i++) {
      const s = rollBonusSteps();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(5);
      expect(s).toBeLessThanOrEqual(10);
    }
  });
  it('rng の下限/上限で 5 と 10 になる', () => {
    expect(rollBonusSteps(() => 0)).toBe(5);
    expect(rollBonusSteps(() => 0.999)).toBe(10);
  });
});

describe('makeNumberLineQuiz（数字ラベル間引き）', () => {
  it('labels に 0 と 100 を必ず含み、中身はキリ番のみ', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeNumberLineQuiz();
      if (q.kind !== 'numberline') throw new Error('numberline のはず');
      expect(q.labels).toContain(0);
      expect(q.labels).toContain(100);
      for (const n of q.labels) expect(n % 10).toBe(0);
    }
  });
});

describe('makeNearestQuiz（どっちにちかい）', () => {
  it('low/high は両どなりのキリ番、answer は近いほう、value は5の倍数でない', () => {
    for (let i = 0; i < 500; i++) {
      const q = makeNearestQuiz();
      if (q.kind !== 'nearest') throw new Error('nearest のはず');
      expect(q.high - q.low).toBe(10);
      expect(q.low % 10).toBe(0);
      expect(q.value % 5).not.toBe(0);                 // キリ番ちょうど・等距離を除外
      expect(q.value).toBeGreaterThan(q.low);
      expect(q.value).toBeLessThan(q.high);
      const near = q.value - q.low < q.high - q.value ? q.low : q.high;
      expect(q.answer).toBe(near);
    }
  });
});

describe('makePlusTenQuiz（10おおきい/ちいさい・3択）', () => {
  it('answer=base+delta、choices は3つで answer を含み 0〜100', () => {
    for (let i = 0; i < 500; i++) {
      const q = makePlusTenQuiz();
      if (q.kind !== 'plusten') throw new Error('plusten のはず');
      expect(Math.abs(q.delta)).toBe(10);
      expect(q.answer).toBe(q.base + q.delta);
      expect(q.choices).toHaveLength(3);
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(3);         // 重複なし
      for (const c of q.choices) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('firstPassedLandmark', () => {
  it('(from, to] の最初のキリ番を返す（なければ null）', () => {
    expect(firstPassedLandmark(8, 12)).toBe(10);
    expect(firstPassedLandmark(20, 20)).toBe(null);     // 動いていない
    expect(firstPassedLandmark(10, 20)).toBe(20);       // ぴったり到達も対象
    expect(firstPassedLandmark(11, 19)).toBe(null);     // キリ番なし
  });
});

describe('shouldTriggerLandmarkBonus（順位ティア補正）', () => {
  it('キリ番に関与しない/ゴール時は発生しない', () => {
    expect(shouldTriggerLandmarkBonus(11, 19, [19, 5, 30])).toBe(false);
    expect(shouldTriggerLandmarkBonus(95, 100, [100, 5, 30])).toBe(false);
  });
  it('トップ（最上位・同着含む）はぴったりなら必ず発生、通り過ぎは30%', () => {
    // pos=30 が最大（ぴったりキリ番）→ 必ず true
    expect(shouldTriggerLandmarkBonus(25, 30, [30, 10, 20])).toBe(true);
    // pos=32 が最大（通り過ぎ）、rng=0.9 > 0.3 → false
    expect(shouldTriggerLandmarkBonus(28, 32, [32, 10, 20], () => 0.9)).toBe(false);
    // pos=32 が最大（通り過ぎ）、rng=0.1 < 0.3 → true
    expect(shouldTriggerLandmarkBonus(28, 32, [32, 10, 20], () => 0.1)).toBe(true);
  });
  it('びり（最下位・同着含む）はキリ番に関与したら必ず発生', () => {
    // pos=20 が最小。通り過ぎでも（rng=0.99）true
    expect(shouldTriggerLandmarkBonus(15, 23, [23, 50, 80], () => 0.99)).toBe(true);
  });
  it('中間はぴったり止まれば必ず、通り過ぎは1/2', () => {
    expect(shouldTriggerLandmarkBonus(28, 30, [10, 30, 50])).toBe(true);          // ぴったり
    expect(shouldTriggerLandmarkBonus(28, 33, [10, 33, 50], () => 0.9)).toBe(false); // 通過・はずれ
    expect(shouldTriggerLandmarkBonus(28, 33, [10, 33, 50], () => 0.1)).toBe(true);  // 通過・あたり
  });
});

describe('isNumberLineCorrect', () => {
  it('許容差以内は正解、超えると不正解', () => {
    expect(isNumberLineCorrect(45, 45, 8)).toBe(true);
    expect(isNumberLineCorrect(45, 53, 8)).toBe(true);
    expect(isNumberLineCorrect(45, 37, 8)).toBe(true);
    expect(isNumberLineCorrect(45, 54, 8)).toBe(false);
    expect(isNumberLineCorrect(45, 30, 8)).toBe(false);
  });
});

describe('makePredictQuiz（どこに止まる？予想）', () => {
  it('target は from + roll（最大100で頭打ち）', () => {
    expect(makePredictQuiz(23, 4)).toEqual({ from: 23, roll: 4, target: 27, tolerance: PREDICT_BONUS_TOLERANCE });
    expect(makePredictQuiz(98, 5).target).toBe(100); // 100で頭打ち
  });
});

describe('rollPredictBonusSteps（3〜5）', () => {
  it('rng の境界で 3 と 5 を返す', () => {
    expect(rollPredictBonusSteps(() => 0)).toBe(3);
    expect(rollPredictBonusSteps(() => 0.99)).toBe(5);
  });
});

describe('shouldTriggerPredictBonus', () => {
  it('上限回数に達したら出さない', () => {
    expect(shouldTriggerPredictBonus(0, PREDICT_BONUS_MAX, [10, 20, 30], 14, () => 0)).toBe(false);
  });
  it('ゴール到達(to>=100)では出さない', () => {
    expect(shouldTriggerPredictBonus(0, 0, [98, 20, 30], 100, () => 0)).toBe(false);
  });
  it('びり（最下位）は起きやすい（55%）', () => {
    // pos=10 が最小。rng=0.5 < 0.55 → true、rng=0.6 → false
    expect(shouldTriggerPredictBonus(0, 0, [10, 50, 80], 15, () => 0.5)).toBe(true);
    expect(shouldTriggerPredictBonus(0, 0, [10, 50, 80], 15, () => 0.6)).toBe(false);
  });
  it('トップ（最上位）は起きにくい（15%）', () => {
    // pos=80 が最大。rng=0.1 < 0.15 → true、rng=0.2 → false
    expect(shouldTriggerPredictBonus(2, 0, [10, 50, 80], 85, () => 0.1)).toBe(true);
    expect(shouldTriggerPredictBonus(2, 0, [10, 50, 80], 85, () => 0.2)).toBe(false);
  });
  it('中間は30%', () => {
    expect(shouldTriggerPredictBonus(1, 0, [10, 50, 80], 55, () => 0.2)).toBe(true);
    expect(shouldTriggerPredictBonus(1, 0, [10, 50, 80], 55, () => 0.4)).toBe(false);
  });
});
