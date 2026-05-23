interface Props {
  choices: number[];
  onPick: (value: number) => void;
  disabled?: boolean;
}

const COLORS = ['bg-blue-400 shadow-[0_4px_0_#1976d2]', 'bg-green-500 shadow-[0_4px_0_#2e7d32]', 'bg-red-400 shadow-[0_4px_0_#c62828]'];

export function AnswerButtons({ choices, onPick, disabled }: Props) {
  return (
    <div className="flex gap-3">
      {choices.map((c, i) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c)}
          className={`rounded-xl px-6 py-3 text-2xl font-bold text-white disabled:opacity-50 ${COLORS[i % COLORS.length]}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
