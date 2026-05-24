import { motion } from 'framer-motion';

interface Props {
  emoji: string;
  perGroup: number;
  groups: number;
}

export function GroupsVisual({ emoji, perGroup, groups }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 justify-center max-w-xs">
      {Array.from({ length: groups }).map((_, gi) => (
        <div key={gi} className="flex gap-1 rounded-lg border-2 border-amber-200 p-1">
          {Array.from({ length: perGroup }).map((_, ii) => (
            <motion.span
              key={ii}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (gi * perGroup + ii) * 0.03, type: 'spring' }}
              className="text-2xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      ))}
    </div>
  );
}
