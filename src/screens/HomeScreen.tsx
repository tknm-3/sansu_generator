import { UNITS } from '../data/units';

interface Props {
  characterName: string;
  stampTotal: number;
  onSelectUnit: (unitId: string) => void;
}

export function HomeScreen({ characterName, stampTotal, onSelectUnit }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-amber-50 p-8">
      <div className="flex w-full items-center justify-between">
        <div className="text-lg font-bold text-amber-900">あいぼう: {characterName}🐰</div>
        <div className="rounded-full bg-yellow-200 px-4 py-1 font-bold text-amber-900">⭐ スタンプ {stampTotal}</div>
      </div>
      <h1 className="text-3xl font-bold text-amber-900">さんすうあそび</h1>
      <p className="text-amber-700">きょうの がくしゅう を えらんでね</p>
      <div className="flex flex-wrap justify-center gap-4">
        {UNITS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onSelectUnit(u.id)}
            className="w-56 rounded-2xl border-2 border-blue-200 bg-white p-6 text-center shadow-md"
          >
            <div className="text-4xl">🔟</div>
            <div className="mt-2 text-xl font-bold text-amber-900">{u.title}</div>
            <div className="mt-1 text-xs text-amber-500">{u.grade}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
