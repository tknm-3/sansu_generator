/**
 * 「てじゅん（手順）」単元のエンジン。
 *
 * プレイヤーは「てじゅん A」という名前の 短い 命令ブロックを つかい回す。
 * - proc_a ゾーン: てじゅんの 中身は 固定で みせる。プレイヤーは メインプログラムで
 *   「てじゅん A」タイル（call）を ならべる。
 * - proc_b ゾーン: メインプログラムは 固定で みせる。プレイヤーは てじゅんの 中身を きめる。
 *
 * 実行は runRelative（そうたい方向エンジン）に展開して 委譲するため、
 * フィールドの 向きや startFacing は relativeEngine と 共通。
 */
import { runRelative, type RelDir } from './relativeEngine';
import type { Level } from './engine';

/** てじゅんの 呼び出し命令 */
export type ProcCall = { kind: 'call' };

/** メインプログラムの 1命令（そうたい方向 または てじゅん呼び出し） */
export type ProcMainCmd = RelDir | ProcCall;

/** てじゅん呼び出しを そうたい方向の ならびに ひらく */
export function expandProc(mainCmds: ProcMainCmd[], procBody: RelDir[]): RelDir[] {
  const out: RelDir[] = [];
  for (const c of mainCmds) {
    if (typeof c === 'string') out.push(c);
    else out.push(...procBody);
  }
  return out;
}

/** てじゅんを 使った プログラムを 実行する */
export function runProc(
  level: Level,
  mainCmds: ProcMainCmd[],
  procBody: RelDir[],
): ReturnType<typeof runRelative> {
  return runRelative(level, expandProc(mainCmds, procBody));
}

export const CALL_ICON = '📦';
export const CALL_LABEL = 'てじゅん A';
