import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  emoji: string;
  perGroup: number;
  groups: number;
  /** はこ／おさら の うえに だす ラベル（🙂・🍽️ など）。わり算で「だれに 配ったか」を 見せる */
  groupLabel?: string;
  /** ぱっとみ: さいしょだけ 見せて かくす（サビタイジング） */
  flash?: boolean;
  /** こたえた あと（true）は また 見せる */
  reveal?: boolean;
}

/** ぱっとみで 見せておく ながさ（ミリびょう） */
const FLASH_MS = 1300;

export function GroupsVisual({ emoji, perGroup, groups, groupLabel, flash, reveal }: Props) {
  // flash のとき: さいしょは 見せて、すこし たったら かくす。こたえたら（reveal）また 見せる。
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    if (!flash) return;
    setCovered(false);
    const t = setTimeout(() => setCovered(true), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash, perGroup, groups, emoji]);
  const hidden = flash && covered && !reveal;

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 justify-center max-w-xs">
      {Array.from({ length: groups }).map((_, gi) => (
        <div key={gi} className="flex flex-col items-center gap-0.5">
          {groupLabel && <span className="text-lg leading-none">{groupLabel}</span>}
          <div className="flex gap-1 rounded-lg border-2 border-amber-200 p-1 min-h-[2.75rem] min-w-[2.75rem] items-center justify-center">
            {hidden ? (
              <span className="text-2xl opacity-60">❓</span>
            ) : (
              Array.from({ length: perGroup }).map((_, ii) => (
                <motion.span
                  key={ii}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (gi * perGroup + ii) * 0.03, type: 'spring' }}
                  className="text-2xl"
                >
                  {emoji}
                </motion.span>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
