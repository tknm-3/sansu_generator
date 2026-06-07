interface Props {
  emoji: string;
  count: number;
}

/**
 * 数える用の山。10こずつの「かたまり（ミニ10の枠）」に分けて見せる。
 * びっしり均一に並べると パッと見で量が わからない（ユーザー指摘）ため、
 * 10のブロックに分け「10ずつ かぞえて、あと なんこ」で 正確な こ数を
 * 数えられるようにする＝10ずつ数える・位取りの力を育てる。
 */
export function EstimatePile({ emoji, count }: Props) {
  const full = Math.floor(count / 10);
  const rem = count % 10;
  const blocks: number[] = [];
  for (let i = 0; i < full; i++) blocks.push(10);
  if (rem > 0) blocks.push(rem);

  return (
    <div className="flex flex-wrap items-start justify-center gap-2">
      {blocks.map((n, bi) => (
        <div key={bi} className="grid grid-cols-5 gap-0.5 rounded-lg border border-amber-200 bg-white/70 p-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="flex h-4 w-4 items-center justify-center text-[13px] leading-none">
              {i < n ? emoji : <span className="h-1.5 w-1.5 rounded-full bg-amber-200/50" />}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
