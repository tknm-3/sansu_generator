interface Props {
  /** さいしょの かたまり（色1） */
  a: number;
  /** つぎの かたまり（色2） */
  b: number;
  emojiA?: string;
  emojiB?: string;
}

/**
 * 10の枠（5×2）を つかって a＋b を「色ちがいの かたまり」で 見せる。
 * 「5と3で8」のように 構造で パッと よむ 概念的サビタイジングを 育てる。
 * くりあがると 2まいめの 枠に うつるので「10と あといくつ」も 目で わかる。
 */
export function TenFrameSum({ a, b, emojiA = '🔴', emojiB = '🟡' }: Props) {
  const total = a + b;
  const frameCount = Math.max(1, Math.ceil(total / 10));
  const cells: (string | null)[] = [];
  for (let i = 0; i < frameCount * 10; i++) {
    if (i < a) cells.push(emojiA);
    else if (i < total) cells.push(emojiB);
    else cells.push(null);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {Array.from({ length: frameCount }).map((_, f) => (
        <div key={f} className="grid grid-cols-5 gap-1 rounded-xl border-[3px] border-sky-300 bg-white p-1.5">
          {cells.slice(f * 10, f * 10 + 10).map((c, i) => (
            <div
              key={i}
              className={
                'flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none ' +
                (c ? 'bg-rose-50' : 'border border-dashed border-sky-200 bg-sky-50/50')
              }
            >
              {c ?? ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
