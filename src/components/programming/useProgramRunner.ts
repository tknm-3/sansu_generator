import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runProgram,
  type Command,
  type Level,
  type Pos,
  type RunResult,
} from '../../lib/programming/engine';

const STEP_MS = 420;

/**
 * 矢印プログラムの 再生（アニメーション）を あつかう共通フック。
 * スタートで いっき再生、1コマずつ も できる。
 * デバッグ・矢印ならべ・自分で作る の どの単元からも使う。
 */
export function useProgramRunner(level: Level, onFinish?: (result: RunResult) => void) {
  const [charPos, setCharPos] = useState<Pos>(level.start);
  const [trail, setTrail] = useState<Pos[]>([]);
  const [collected, setCollected] = useState<Pos[]>([]);
  const [blockedCell, setBlockedCell] = useState<Pos | null>(null);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plan = useRef<{ result: RunResult; index: number } | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const reset = useCallback(() => {
    clearTimer();
    plan.current = null;
    setCharPos(level.start);
    setTrail([]);
    setCollected([]);
    setBlockedCell(null);
    setPlaying(false);
    setFinished(false);
  }, [level]);

  // レベルが かわったら リセット
  useEffect(() => {
    reset();
    return clearTimer;
  }, [reset]);

  const gemKeys = (level.gems ?? []).map((g) => `${g.r},${g.c}`);

  function applyCollected(uptoIndex: number, path: Pos[]) {
    const got = path
      .slice(0, uptoIndex + 1)
      .filter((p) => gemKeys.includes(`${p.r},${p.c}`));
    setCollected(got);
  }

  /** いっき再生 */
  const play = useCallback(
    (commands: Command[]) => {
      clearTimer();
      const result = runProgram(level, commands);
      plan.current = { result, index: 0 };
      setBlockedCell(null);
      setFinished(false);
      setPlaying(true);
      setCharPos(level.start);
      setTrail([]);
      setCollected([]);

      const { path } = result;
      let i = 0;
      const tick = () => {
        i += 1;
        if (i < path.length) {
          setCharPos(path[i]);
          setTrail(path.slice(0, i));
          applyCollected(i, path);
          timer.current = setTimeout(tick, STEP_MS);
        } else {
          setTrail(path.slice(0, path.length - 1));
          if (result.blockedCell) setBlockedCell(result.blockedCell);
          setPlaying(false);
          setFinished(true);
          onFinish?.(result);
        }
      };
      if (path.length <= 1) {
        // うごかない場合も けっかは出す
        if (result.blockedCell) setBlockedCell(result.blockedCell);
        setPlaying(false);
        setFinished(true);
        onFinish?.(result);
      } else {
        timer.current = setTimeout(tick, STEP_MS);
      }
    },
    [level, onFinish], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** 1コマだけ すすめる */
  const step = useCallback(
    (commands: Command[]) => {
      clearTimer();
      if (!plan.current) {
        plan.current = { result: runProgram(level, commands), index: 0 };
        setBlockedCell(null);
        setFinished(false);
      }
      const { result } = plan.current;
      const path = result.path;
      const nextIndex = plan.current.index + 1;
      if (nextIndex < path.length) {
        plan.current.index = nextIndex;
        setCharPos(path[nextIndex]);
        setTrail(path.slice(0, nextIndex));
        applyCollected(nextIndex, path);
      } else {
        // さいごの コマまで きた
        setTrail(path.slice(0, Math.max(0, path.length - 1)));
        if (result.blockedCell) setBlockedCell(result.blockedCell);
        setFinished(true);
        onFinish?.(result);
      }
    },
    [level, onFinish], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { charPos, trail, collected, blockedCell, playing, finished, play, step, reset };
}
