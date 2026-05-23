import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MakeTenUnit } from './screens/MakeTenUnit';
import { NamingScreen } from './features/character/NamingScreen';
import { loadCharacter } from './features/character/character';
import { loadJson } from './lib/storage';
import { EMPTY_STAMPS, type StampState } from './features/rewards/stamps';

type Screen = { kind: 'home' } | { kind: 'unit'; unitId: string };

export default function App() {
  const [character, setCharacter] = useState(loadCharacter);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [refresh, setRefresh] = useState(0);
  const stampTotal = loadJson<StampState>('math-app:stamps', EMPTY_STAMPS).total;

  if (!character.named) {
    return <NamingScreen onDone={(name) => setCharacter({ ...character, name, named: true })} />;
  }

  if (screen.kind === 'unit') {
    return (
      <MakeTenUnit
        key={refresh}
        characterName={character.name}
        onExit={() => {
          setRefresh((r) => r + 1);
          setScreen({ kind: 'home' });
        }}
      />
    );
  }

  return (
    <HomeScreen
      key={refresh}
      characterName={character.name}
      stampTotal={stampTotal}
      onSelectUnit={(unitId) => setScreen({ kind: 'unit', unitId })}
    />
  );
}
