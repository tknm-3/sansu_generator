import { describe, it, expect } from 'vitest';
import {
  ADVENTURE_QUEST,
  ADVENTURE_ZONES,
  buildBranchProgram,
  type AdventureQuest,
} from './adventureLevels';
import {
  solve,
  runProgram,
  isCleared,
  isPerfect,
  isPerfectByBlocks,
  samePos,
  type Command,
  type Dir,
  type Pos,
} from './engine';
import { runBranch } from './branch';
import {
  runRelative,
  solveRelative,
  flattenRel,
  turnRight,
  turnLeft,
  type RelDir,
  type RelCommand,
} from './relativeEngine';
import { runProc } from './procEngine';

function toCommands(dirs: Dir[]): Command[] {
  return dirs.map((dir) => ({ kind: 'move' as const, dir }));
}

/** そうたい命令れつを 実行し、まえへ すすんだ ときの ぜったい むき れつ を かえす */
function moveDirs(cmds: RelDir[], startFacing: Dir): Dir[] {
  let facing = startFacing;
  const out: Dir[] = [];
  for (const c of cmds) {
    if (c === 'turn_right') facing = turnRight(facing);
    else if (c === 'turn_left') facing = turnLeft(facing);
    else out.push(facing);
  }
  return out;
}

/** みちの「まがりかど」の かず（となりあう すすむ むき が ちがう かいすう）*/
function corners(cmds: RelDir[], startFacing: Dir): number {
  const dirs = moveDirs(cmds, startFacing);
  let n = 0;
  for (let i = 1; i < dirs.length; i++) if (dirs[i] !== dirs[i - 1]) n += 1;
  return n;
}

const all = ADVENTURE_QUEST;

describe('ぼうけん 問題集', () => {
  it('30問 ある', () => {
    expect(all.length).toBeGreaterThanOrEqual(30);
  });

  it('questId は ぜんぶ ユニーク', () => {
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chase ゾンビは つかわない（solve で 検証できる）', () => {
    for (const q of all) {
      const hasChase = (q.zombies ?? []).some((z) => z.kind === 'chase');
      expect(hasChase, `${q.id} に chase ゾンビが ある`).toBe(false);
    }
  });

  it('すべての zoneId が ADVENTURE_ZONES に ある', () => {
    const zoneIds = new Set(ADVENTURE_ZONES.map((z) => z.id));
    for (const q of all) {
      expect(zoneIds.has(q.zoneId), `${q.id} の zoneId=${q.zoneId} が ない`).toBe(true);
    }
  });

  it('問題は ゾーンごとに まとまって ならんでいる', () => {
    // 同じ zoneId が とびとびに ならんでいない（出題じゅんが ゾーンで くぎれている）
    const seen = new Set<string>();
    let prev = '';
    for (const q of all) {
      if (q.zoneId !== prev) {
        expect(seen.has(q.zoneId), `${q.zoneId} が とびとびに ある`).toBe(false);
        seen.add(q.zoneId);
        prev = q.zoneId;
      }
    }
  });

  function inBounds(q: AdventureQuest, p: Pos): boolean {
    return p.r >= 0 && p.r < q.rows && p.c >= 0 && p.c < q.cols;
  }

  it.each(all)('$id は ばんめんが せいごう（start/goal/かべ/ゾンビ）', (q) => {
    expect(inBounds(q, q.start), `${q.id} start が そと`).toBe(true);
    expect(inBounds(q, q.goal), `${q.id} goal が そと`).toBe(true);
    expect(samePos(q.start, q.goal), `${q.id} start と goal が おなじ`).toBe(false);
    for (const w of q.walls) {
      expect(inBounds(q, w)).toBe(true);
      expect(samePos(w, q.start), `${q.id} かべが start に かさなる`).toBe(false);
      expect(samePos(w, q.goal), `${q.id} かべが goal に かさなる`).toBe(false);
    }
    for (const g of q.gems ?? []) {
      expect(inBounds(q, g)).toBe(true);
      expect(q.walls.some((w) => samePos(w, g)), `${q.id} ほしが かべに かさなる`).toBe(false);
    }
    for (const z of q.zombies ?? []) {
      expect(inBounds(q, z.pos)).toBe(true);
      expect(samePos(z.pos, q.start), `${q.id} ゾンビが start に かさなる`).toBe(false);
    }
  });

  it.each(all)('$id は maxSlots >= optimal（やじるしが たりる）', (q) => {
    expect(q.maxSlots, `${q.id} に maxSlots が ない`).toBeDefined();
    expect(q.maxSlots!, `${q.id} は maxSlots が optimal より すくない`).toBeGreaterThanOrEqual(
      q.optimal,
    );
  });

  const arrowQuests = all.filter((q) => q.kind === undefined);
  const branchQuests = all.filter((q) => q.kind === 'branch');
  const relativeQuests = all.filter((q) => q.kind === 'relative' && !q.allowLoop);
  const relativeLoopQuests = all.filter((q) => q.kind === 'relative' && q.allowLoop);

  it.each(arrowQuests)('$id は 解けて optimal が 最短と 一致する', (q) => {
    const sol = q.solution ?? solve(q);
    expect(sol, `${q.id} に 解が ない`).not.toBeNull();
    if (!q.solution) {
      expect(sol!.length, `${q.id} の optimal が 最短と ずれている`).toBe(q.optimal);
    }
    expect(sol!.length, `${q.id} の 解が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
    const result = runProgram(q, toCommands(sol!));
    expect(isCleared(result), `${q.id} の 解が ゴールに つかない`).toBe(true);
  });

  // 🌊 みずうみは「↑→↑→…」の 階段を 組ませる ゾーン。L字（ぜんぶ↑→ぜんぶ→）の
  // ショートカットで 解けると 学びが うすい。最短(optimal手数)の どの 組み方でも
  // まがりかどが おおい こと＝L字や コの字では わたれない ことを 保証する。
  const lakeQuests = arrowQuests.filter((q) => q.zoneId === 'lake');
  const DELTA: Record<Dir, Pos> = {
    up: { r: -1, c: 0 }, down: { r: 1, c: 0 }, left: { r: 0, c: -1 }, right: { r: 0, c: 1 },
  };
  const MOVE_DIRS: Dir[] = ['up', 'down', 'left', 'right'];

  // 最短(optimal手数)で ゴール＆さかな全部 を みたす みちの うち、まがりかどが
  // いちばん すくない ものの かど数 を かえす（DP: state=pos|mask|lastDir、層=step）。
  function minCornersShortest(q: AdventureQuest): number {
    const gems = q.gems ?? [];
    const gemIndex = new Map(gems.map((g, i) => [`${g.r},${g.c}`, i]));
    const allMask = (1 << gems.length) - 1;
    const wallSet = new Set(q.walls.map((w) => `${w.r},${w.c}`));
    const inB = (p: Pos) => p.r >= 0 && p.r < q.rows && p.c >= 0 && p.c < q.cols;
    const maskAt = (p: Pos, m: number) => {
      const i = gemIndex.get(`${p.r},${p.c}`);
      return i === undefined ? m : m | (1 << i);
    };
    type St = { pos: Pos; mask: number; lastDir: Dir | 'none'; turns: number };
    const key = (p: Pos, m: number, d: Dir | 'none') => `${p.r},${p.c}|${m}|${d}`;
    const startMask = maskAt(q.start, 0);
    let layer = new Map<string, St>([
      [key(q.start, startMask, 'none'), { pos: q.start, mask: startMask, lastDir: 'none', turns: 0 }],
    ]);
    let best = Infinity;
    for (let step = 0; step <= q.optimal; step++) {
      if (step === q.optimal) {
        for (const st of layer.values()) {
          if (samePos(st.pos, q.goal) && st.mask === allMask) best = Math.min(best, st.turns);
        }
        break;
      }
      const next = new Map<string, St>();
      for (const st of layer.values()) {
        for (const d of MOVE_DIRS) {
          const np = { r: st.pos.r + DELTA[d].r, c: st.pos.c + DELTA[d].c };
          if (!inB(np) || wallSet.has(`${np.r},${np.c}`)) continue;
          const nm = maskAt(np, st.mask);
          const nt = st.turns + (st.lastDir !== 'none' && st.lastDir !== d ? 1 : 0);
          const k = key(np, nm, d);
          const cur = next.get(k);
          if (!cur || nt < cur.turns) next.set(k, { pos: np, mask: nm, lastDir: d, turns: nt });
        }
      }
      layer = next;
    }
    return best;
  }

  it('みずうみゾーンが 6問 ある', () => {
    expect(lakeQuests.length).toBe(6);
  });

  it.each(lakeQuests)('$id（みずうみ）は L字で ズルできない（最短でも まがりかど3いじょう）', (q) => {
    const c = minCornersShortest(q);
    expect(c, `${q.id} は 最短手数の まがりかどが ${c}（L字や コの字で ズルできてしまう）`).toBeGreaterThanOrEqual(3);
  });

  it.each(branchQuests)('$id（分岐）は 正解プログラムで クリアできて optimal が ステップ数と 一致する', (q) => {
    const fill = q.branchFill!;
    expect(fill, `${q.id} に branchFill が ない`).toBeDefined();
    const program = buildBranchProgram(fill);
    const result = runBranch(q, program);
    expect(isCleared(result), `${q.id} の 正解プログラムが クリアに ならない`).toBe(true);
    expect(isPerfect(q, result), `${q.id} の ステップ数が optimal(${q.optimal})と ずれている（実際: ${result.steps}）`).toBe(true);
  });

  // 穴埋めは「あてずっぽうでも解ける」と 学びが うすい。穴の むきの 全組み合わせを ためし、
  // クリアできるのは 正解の 1とおり だけ（＝一意解）であることを 保証する。
  // フェーズが 2つ（つきゾーン）でも、すべての 穴の くみあわせを 総当りする。
  const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
  it.each(branchQuests)('$id（分岐）は 穴の くみあわせで 正解 1とおり だけ クリアできる（一意解）', (q) => {
    const fill = q.branchFill!;
    // 穴スロット（フェーズ番号・どの項目か）を あつめる
    type Slot = { phase: number; field: 'sensor' | 'thenDir' | 'elseDir' };
    const slots: Slot[] = [];
    fill.phases.forEach((ph, i) => {
      if (ph.rule.holeSensor) slots.push({ phase: i, field: 'sensor' });
      if (ph.rule.holeThen) slots.push({ phase: i, field: 'thenDir' });
      if (ph.rule.holeElse) slots.push({ phase: i, field: 'elseDir' });
    });
    // 正解の しるし
    const correct = fill.phases.map((ph) => `${ph.rule.sensor}/${ph.rule.thenDir}/${ph.rule.elseDir}`).join(' | ');

    const solutions: string[] = [];
    const total = Math.pow(4, slots.length);
    for (let combo = 0; combo < total; combo++) {
      // この くみあわせの 穴の値を きめる
      const assign = new Map<string, Dir>();
      let rest = combo;
      for (const s of slots) {
        assign.set(`${s.phase}:${s.field}`, DIRS[rest % 4]);
        rest = Math.floor(rest / 4);
      }
      const program = buildBranchProgram(fill, (phaseIdx, rule) => ({
        sensor: assign.get(`${phaseIdx}:sensor`) ?? rule.sensor,
        thenDir: assign.get(`${phaseIdx}:thenDir`) ?? rule.thenDir,
        elseDir: assign.get(`${phaseIdx}:elseDir`) ?? rule.elseDir,
      }));
      if (isCleared(runBranch(q, program))) {
        const sig = fill.phases.map((ph, i) => {
          const s = assign.get(`${i}:sensor`) ?? ph.rule.sensor;
          const t = assign.get(`${i}:thenDir`) ?? ph.rule.thenDir;
          const e = assign.get(`${i}:elseDir`) ?? ph.rule.elseDir;
          return `${s}/${t}/${e}`;
        }).join(' | ');
        if (!solutions.includes(sig)) solutions.push(sig);
      }
    }
    expect(solutions, `${q.id} は 正解いがいでも クリアできる: ${solutions.join(', ')}`).toEqual([correct]);
  });

  // ゆきのゾーン（そうたい方向、ループなし）。relSolution で クリアでき、optimal が 最短（BFS）と 一致する。
  it.each(relativeQuests)('$id（そうたい方向）は relSolution で クリアでき optimal が 最短と 一致する', (q) => {
    expect(q.startFacing, `${q.id} に startFacing が ない`).toBeDefined();
    expect(q.relSolution, `${q.id} に relSolution が ない`).toBeDefined();
    const result = runRelative(q, q.relSolution!);
    expect(isCleared(result), `${q.id} の relSolution が ゴールに つかない`).toBe(true);
    expect(q.relSolution!.length, `${q.id} の relSolution が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
    const best = solveRelative(q);
    expect(best, `${q.id} に そうたい解が ない`).not.toBeNull();
    expect(best!.length, `${q.id} の optimal が 最短と ずれている（最短: ${best!.length}）`).toBe(q.optimal);
    expect(result.steps, `${q.id} の relSolution が 最短手数で ない`).toBe(q.optimal);
  });

  // そうたい×ループゾーン。relSolution（ループ圧縮）で クリアでき、optimal が 命令数と 一致する。
  it.each(relativeLoopQuests)('$id（そうたい×ループ）は relSolution で クリアでき optimal が 命令数と 一致する', (q) => {
    expect(q.startFacing, `${q.id} に startFacing が ない`).toBeDefined();
    expect(q.relSolution, `${q.id} に relSolution が ない`).toBeDefined();
    const result = runRelative(q, q.relSolution!);
    expect(isCleared(result), `${q.id} の relSolution が ゴールに つかない`).toBe(true);
    expect(q.relSolution!.length, `${q.id} の relSolution が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
    expect(q.relSolution!.length, `${q.id} の optimal が 命令数と ずれている`).toBe(q.optimal);
  });

  // ダイヤ（ぴったり賞💎）が とれることを 保証する。ループ/ネスト単元は optimal が
  // 「ならべた ブロック数」なので、intended solution（relSolution）の ブロック数で 判定する。
  // （isPerfect の steps基準だと ループ展開で 永遠に 一致せず ダイヤが とれない＝既知バグの回帰防止）
  it.each(relativeLoopQuests)('$id（そうたい×ループ）は relSolution で ダイヤ（ぴったり賞）が とれる', (q) => {
    const result = runRelative(q, q.relSolution!);
    expect(
      isPerfectByBlocks(q, result, q.relSolution!.length),
      `${q.id} は intended solution(${q.relSolution!.length}ブロック)でも ダイヤが とれない`,
    ).toBe(true);
  });

  // ループなしの そうたい（ゆき/うみ）も、ならべた ブロック数 === optimal で ダイヤが とれる。
  it.each(relativeQuests)('$id（そうたい方向）は relSolution で ダイヤ（ぴったり賞）が とれる', (q) => {
    const result = runRelative(q, q.relSolution!);
    expect(isPerfectByBlocks(q, result, q.relSolution!.length), `${q.id} は ダイヤが とれない`).toBe(true);
  });

  // そうたい×ループの「かたち」を かべで しぼれているか。
  // コの字／かいだん／ジグザグ なのに まっすぐ や L字で ショートカットできると 学びが うすい。
  // 最短解（solveRelative）の まがりかど かずが、ねらった かたち（relSolution）より すくなく
  // ならないことを 確認する＝より すくない まがりかどでは ゴールできない＝ショートカット不可。
  it.each(relativeLoopQuests)('$id（そうたい×ループ）は ショートカットできない（かべで かたちが しぼれている）', (q) => {
    const facing = q.startFacing!;
    const best = solveRelative(q);
    expect(best, `${q.id} に そうたい解が ない`).not.toBeNull();
    const needed = corners(flattenRel(q.relSolution!), facing);
    const shortest = corners(best!, facing);
    expect(
      shortest,
      `${q.id} は ${needed}かい まがる はずが ${shortest}かいで ゴールできてしまう（かべで みちを しぼって）`,
    ).toBeGreaterThanOrEqual(needed);
  });

  // ── 足場プリフィル（relPrefill）の チュートリアル穴埋め ──
  // relPrefill は こどもに「ループ箱＋少しの矢印」を 最初から みせる 足場。
  // ① relSolution の 接頭辞で あること（足場どおり 進めば 正解に なる）。
  // ② openLoop は relSolution の さいごの ブロックを 途中まで ひらいたもので、
  //    こどもが たす ぶん（のこりの body）が 1つ以上 ある（＝全部 うまってない）。
  // ③ こどもの 追加は すこし（穴埋め）＝のこりの body は 3つ以下。
  // ④ そうたい×ループの 4ゾーンは すべて relPrefill を もつ（取りこぼし防止）。
  function relEqual(a: RelCommand, b: RelCommand): boolean {
    if (typeof a === 'string' || typeof b === 'string') return a === b;
    if (a.times !== b.times || a.body.length !== b.body.length) return false;
    return a.body.every((c, i) => relEqual(c, b.body[i]));
  }
  const relPrefillQuests = all.filter((q) => q.relPrefill);

  it('そうたい×ループの 4ゾーンは すべて relPrefill（足場）を もつ', () => {
    const ids = relativeLoopQuests.map((q) => q.id);
    const withPrefill = relativeLoopQuests.filter((q) => q.relPrefill).map((q) => q.id);
    expect(withPrefill, `relPrefill が ない: ${ids.filter((id) => !withPrefill.includes(id))}`).toEqual(ids);
  });

  it.each(relPrefillQuests)('$id の relPrefill は relSolution の 接頭辞で、すこしだけ こどもが たす', (q) => {
    const sol = q.relSolution!;
    const pre = q.relPrefill!.cmds ?? [];
    // ① cmds は 先頭から ぴったり 一致
    expect(pre.length, `${q.id} の relPrefill.cmds が relSolution より ながい`).toBeLessThanOrEqual(sol.length);
    pre.forEach((c, i) => {
      expect(relEqual(c, sol[i]), `${q.id} の relPrefill.cmds[${i}] が relSolution と ちがう`).toBe(true);
    });
    const open = q.relPrefill!.openLoop;
    if (open) {
      // ② openLoop は cmds の つぎ（＝relSolution の さいごの ブロック）を ひらいたもの
      expect(pre.length + 1, `${q.id} の openLoop は relSolution の さいごの ブロックで ない`).toBe(sol.length);
      const last = sol[pre.length];
      expect(typeof last !== 'string' && last.kind === 'loop', `${q.id} の さいごの ブロックが ループで ない`).toBe(true);
      const loop = last as Exclude<RelCommand, RelDir>;
      expect(loop.times, `${q.id} の openLoop.times が relSolution と ちがう`).toBe(open.times);
      open.body.forEach((c, i) => {
        expect(relEqual(c, loop.body[i]), `${q.id} の openLoop.body[${i}] が relSolution と ちがう`).toBe(true);
      });
      const remaining = loop.body.length - open.body.length;
      // ③ こどもが たす ぶんが 1〜3（穴埋め）
      expect(remaining, `${q.id} は openLoop が ぜんぶ うまっていて こどもが たす ぶんが ない`).toBeGreaterThanOrEqual(1);
      expect(remaining, `${q.id} は こどもが たす ぶんが おおすぎる（穴埋めに ならない）`).toBeLessThanOrEqual(3);
    } else {
      // openLoop が なければ cmds が 解の 一部（最後の1ブロックは こどもが くむ）
      expect(pre.length, `${q.id} は relPrefill が ぜんぶ 解で こどもが くむ ぶんが ない`).toBeLessThan(sol.length);
    }
  });

  // ── てじゅん（proc）単元 ──
  const procQuests = all.filter((q) => q.kind === 'proc');
  const procAQuests = procQuests.filter((q) => q.procMainSolution); // proc_a: 中身固定・main を つくる
  const procBQuests = procQuests.filter((q) => q.procMain && !q.procMainSolution); // proc_b: main固定・中身を きめる

  it('proc 単元が proc_a/proc_b とも ある', () => {
    expect(procAQuests.length).toBeGreaterThan(0);
    expect(procBQuests.length).toBeGreaterThan(0);
  });

  it.each(procAQuests)('$id（proc_a）は call で クリアでき optimal が main命令数と 一致する', (q) => {
    expect(q.procDef, `${q.id} に procDef が ない`).toBeDefined();
    const result = runProc(q, q.procMainSolution!, q.procDef!);
    expect(isCleared(result), `${q.id} の procMainSolution が ゴールに つかない`).toBe(true);
    expect(q.procMainSolution!.length, `${q.id} の optimal が main命令数と ずれている`).toBe(q.optimal);
    expect(q.procMainSolution!.length, `${q.id} の main が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
  });

  // proc_a の「意図した解き方」: ふつうの矢印だけ では maxSlots に おさまらない＝てじゅんA 必須。
  // （おさまると てじゅんを つかわず 解けてしまい「まとめて よびだす」学びが うすい）
  it.each(procAQuests)('$id（proc_a）は てじゅんA なしの 矢印だけ では maxSlots に おさまらない', (q) => {
    const raw = solveRelative(q);
    expect(raw, `${q.id} に そうたい解が ない`).not.toBeNull();
    expect(
      raw!.length,
      `${q.id} は 矢印だけ(${raw!.length}手)で maxSlots(${q.maxSlots})に おさまり てじゅんを つかわず 解けてしまう`,
    ).toBeGreaterThan(q.maxSlots!);
  });

  // proc_a の 足場プリフィル（procMainPrefill）: procMainSolution の 接頭辞で、
  // こどもが たす ぶんが 1つ以上 ある（＝全部 うまってない 穴埋め）。
  const procPrefillQuests = procAQuests.filter((q) => q.procMainPrefill);
  it.each(procPrefillQuests)('$id（proc_a）の procMainPrefill は main解の 接頭辞で、すこしだけ たす', (q) => {
    const sol = q.procMainSolution!;
    const pre = q.procMainPrefill!;
    expect(pre.length, `${q.id} の procMainPrefill が main解より ながい`).toBeLessThan(sol.length);
    pre.forEach((c, i) => {
      const a = sol[i];
      const same = typeof c === 'string' || typeof a === 'string' ? c === a : c.kind === a.kind;
      expect(same, `${q.id} の procMainPrefill[${i}] が main解と ちがう`).toBe(true);
    });
    const remaining = sol.length - pre.length;
    expect(remaining, `${q.id} は こどもが たす ぶんが おおすぎる`).toBeLessThanOrEqual(2);
  });

  it.each(procBQuests)('$id（proc_b）は きめた 中身で クリアでき optimal が 中身の命令数と 一致する', (q) => {
    expect(q.procDef, `${q.id} に procDef（正解の中身）が ない`).toBeDefined();
    const result = runProc(q, q.procMain!, q.procDef!);
    expect(isCleared(result), `${q.id} の procDef が ゴールに つかない`).toBe(true);
    expect(q.procDef!.length, `${q.id} の optimal が 中身の命令数と ずれている`).toBe(q.optimal);
    expect(q.procDef!.length, `${q.id} の 中身が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
  });

  // てじゅん（proc）も intended solution で ダイヤ（ぴったり賞💎）が とれる。
  // proc_a は main の めいれい数、proc_b は てじゅんの なかみ（procDef）の 数 が optimal。
  it.each(procAQuests)('$id（proc_a）は ダイヤ（ぴったり賞）が とれる', (q) => {
    const result = runProc(q, q.procMainSolution!, q.procDef!);
    expect(
      isPerfectByBlocks(q, result, q.procMainSolution!.length),
      `${q.id} は intended solution でも ダイヤが とれない`,
    ).toBe(true);
  });
  it.each(procBQuests)('$id（proc_b）は ダイヤ（ぴったり賞）が とれる', (q) => {
    const result = runProc(q, q.procMain!, q.procDef!);
    expect(
      isPerfectByBlocks(q, result, q.procDef!.length),
      `${q.id} は intended solution でも ダイヤが とれない`,
    ).toBe(true);
  });

  // proc_b の「意図した解き方」: optimal より みじかい 中身では クリアできない
  // （みじかい 中身で クリアできると かんがえずに あてられてしまう）。
  it.each(procBQuests)('$id（proc_b）は optimal より みじかい 中身では クリアできない', (q) => {
    const dirs: RelDir[] = ['forward', 'turn_right', 'turn_left'];
    function bodies(len: number): RelDir[][] {
      if (len === 0) return [[]];
      const rest = bodies(len - 1);
      return dirs.flatMap((d) => rest.map((b) => [d, ...b]));
    }
    for (let len = 1; len < q.optimal; len++) {
      for (const body of bodies(len)) {
        const ok = isCleared(runProc(q, q.procMain!, body));
        expect(ok, `${q.id} は ${len}個の 中身 [${body.join(',')}] で クリアできてしまう`).toBe(false);
      }
    }
  });

  // loopOnly の たには、ふつうの 1マス矢印を ださず ループ箱だけ つかわせる。
  // LoopBuilder の せいやく（1ループ＝1方向 × 2〜5かい）の はんいで 解けることを 確認する。
  const loopOnly = all.filter((q) => q.loopOnly);

  it('loopOnly は ループの たに（valley）に そろっている', () => {
    expect(loopOnly.length).toBeGreaterThan(0);
    for (const q of loopOnly) {
      expect(q.allowLoop, `${q.id} は loopOnly なのに allowLoop でない`).toBe(true);
    }
  });

  it.each(loopOnly)('$id は ループ箱だけ（1方向×2〜5）で 解ける', (q) => {
    const sol = q.solution ?? solve(q)!;
    // 最短解を「おなじ むきの れんぞく」で くぎる＝ループ箱の かたまり
    const runs: { dir: Dir; len: number }[] = [];
    for (const d of sol) {
      const last = runs[runs.length - 1];
      if (last && last.dir === d) last.len += 1;
      else runs.push({ dir: d, len: 1 });
    }
    // どの かたまりも 2〜5かい に おさまれば ループ箱で 表現できる
    for (const run of runs) {
      expect(run.len, `${q.id} の ${run.dir} が ${run.len}かい連続（ループ箱2〜5に おさまらない）`).toBeGreaterThanOrEqual(2);
      expect(run.len, `${q.id} の ${run.dir} が ${run.len}かい連続（ループ箱2〜5に おさまらない）`).toBeLessThanOrEqual(5);
    }
    // ループ箱の かず（かたまり数）が maxSlots に おさまる
    const flatLen = runs.reduce((n, r) => n + r.len, 0);
    expect(flatLen, `${q.id} の 解が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
  });
});
