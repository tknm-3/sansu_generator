interface Props {
  filled: number; // 0..10
  fruit?: string;
}

/** 10マスフレーム。filled個を果物、残りを点滅する空きマスで表示。 */
export function MakeTenFrame({ filled, fruit = '🍎' }: Props) {
  const clamped = Math.max(0, Math.min(10, filled));
  return (
    <div className="grid max-w-[360px] grid-cols-5 gap-1.5 rounded-2xl border-[3px] border-blue-300 bg-white p-2.5">
      {Array.from({ length: 10 }).map((_, i) => {
        const isFilled = i < clamped;
        return (
          <div
            key={i}
            data-testid={isFilled ? 'cell-filled' : 'cell-empty'}
            className={
              'flex aspect-square items-center justify-center rounded-lg text-2xl ' +
              (isFilled ? 'bg-red-400' : 'animate-pulse border-2 border-dashed border-blue-300 bg-blue-50')
            }
          >
            {isFilled ? fruit : ''}
            <span data-testid="cell" className="hidden" />
          </div>
        );
      })}
    </div>
  );
}
