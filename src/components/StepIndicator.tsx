interface Props {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: Props) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={
            'rounded-full transition-all duration-300 ' +
            (i < current
              ? 'w-4 h-4 bg-green-400'
              : i === current
              ? 'w-5 h-5 bg-blue-500 ring-2 ring-blue-300'
              : 'w-4 h-4 bg-gray-200')
          }
        />
      ))}
    </div>
  );
}
