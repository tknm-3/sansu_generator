import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MakeTenUnit } from './screens/MakeTenUnit';
import { AdditionUnit } from './screens/AdditionUnit';
import { SubtractionUnit } from './screens/SubtractionUnit';
import { CherryCalcUnit } from './screens/CherryCalcUnit';
import { BigAdditionUnit } from './screens/BigAdditionUnit';
import { BigSubtractionUnit } from './screens/BigSubtractionUnit';
import { MultiplicationUnit } from './screens/MultiplicationUnit';
import { DivisionUnit } from './screens/DivisionUnit';
import { ChallengeMode } from './screens/ChallengeMode';
import { MissionScreen } from './screens/MissionScreen';
import { ProblemMakerScreen } from './screens/ProblemMakerScreen';
import { ParentSolveScreen } from './screens/ParentSolveScreen';
import { StampBook } from './screens/StampBook';
import { ProgressCalendar } from './screens/ProgressCalendar';
import { CharacterCollection } from './features/character/CharacterCollection';
import { CharacterDetail } from './features/character/CharacterDetail';
import { NamingScreen } from './features/character/NamingScreen';
import { BgmToggle } from './features/sound/BgmToggle';
import { setBgmTrack } from './features/sound/bgm';
import { loadCharacter, getCharName, saveCharacterNameForId } from './features/character/character';
import { CHARACTER_DEFS } from './features/character/characterDefs';
import { loadJson, saveJson } from './lib/storage';
import { EMPTY_STAMPS, STAMP_KEY, type StampState } from './features/rewards/stamps';
import type { Character } from './features/character/character';
import type { TemplateFilled } from './lib/problemTemplates';

const PROFILE_KEY = 'math-app:profile';

type Screen =
  | { kind: 'home' }
  | { kind: 'unit'; unitId: string }
  | { kind: 'challenge' }
  | { kind: 'mission' }
  | { kind: 'maker' }
  | { kind: 'parentSolve'; problem: TemplateFilled }
  | { kind: 'collection' }
  | { kind: 'characterDetail'; charId: string }
  | { kind: 'stampBook' }
  | { kind: 'progress' };

export default function App() {
  const [character, setCharacter] = useState<Character>(loadCharacter);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (screen.kind === 'home' || screen.kind === 'progress' || screen.kind === 'stampBook' || screen.kind === 'collection' || screen.kind === 'characterDetail') {
      setBgmTrack('home');
    }
  }, [screen.kind]);

  const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
  const stampTotal = stamps.total;
  const stampHistory = stamps.history;

  if (!character.named) {
    return (
      <NamingScreen
        onDone={(name) => {
          const next = { ...character, name, named: true };
          saveJson(PROFILE_KEY, next);
          setCharacter(next);
        }}
      />
    );
  }

  function handleExit() {
    setRefresh((r) => r + 1);
    setScreen({ kind: 'home' });
  }

  const sharedProps = { characterName: character.name, characterId: character.id, onExit: handleExit };

  function renderScreen() {
  if (screen.kind === 'unit') {
    switch (screen.unitId) {
      case 'make-ten':        return <MakeTenUnit        key={refresh} {...sharedProps} />;
      case 'addition':        return <AdditionUnit        key={refresh} {...sharedProps} />;
      case 'subtraction':     return <SubtractionUnit     key={refresh} {...sharedProps} />;
      case 'cherry-calc':     return <CherryCalcUnit      key={refresh} {...sharedProps} />;
      case 'big-addition':    return <BigAdditionUnit     key={refresh} {...sharedProps} />;
      case 'big-subtraction': return <BigSubtractionUnit  key={refresh} {...sharedProps} />;
      case 'multiplication':  return <MultiplicationUnit  key={refresh} {...sharedProps} />;
      case 'division':        return <DivisionUnit        key={refresh} {...sharedProps} />;
      default:                return <MakeTenUnit         key={refresh} {...sharedProps} />;
    }
  }

  if (screen.kind === 'challenge') return <ChallengeMode key={refresh} {...sharedProps} />;
  if (screen.kind === 'mission')   return <MissionScreen  key={refresh} {...sharedProps} />;

  if (screen.kind === 'maker') {
    return (
      <ProblemMakerScreen
        key={refresh}
        characterName={character.name}
        onMake={(problem) => setScreen({ kind: 'parentSolve', problem })}
        onExit={handleExit}
      />
    );
  }

  if (screen.kind === 'parentSolve') {
    return (
      <ParentSolveScreen
        problem={screen.problem}
        characterName={character.name}
        onDone={handleExit}
      />
    );
  }

  if (screen.kind === 'collection') {
    return (
      <CharacterCollection
        stampHistory={stampHistory}
        activeCharId={character.id}
        characterNames={character.characterNames}
        onOpenDetail={(charId) => setScreen({ kind: 'characterDetail', charId })}
        onClose={() => setScreen({ kind: 'home' })}
      />
    );
  }

  if (screen.kind === 'characterDetail') {
    return (
      <CharacterDetail
        charId={screen.charId}
        stampHistory={stampHistory}
        activeCharId={character.id}
        characterNames={character.characterNames}
        onSelect={(charId) => {
          const def = CHARACTER_DEFS.find((c) => c.id === charId)!;
          const newName = getCharName(charId, character.characterNames) ?? def.name;
          const next = { ...character, id: charId, name: newName };
          saveJson(PROFILE_KEY, next);
          setCharacter(next);
          setScreen({ kind: 'collection' });
        }}
        onNameChange={(charId, name) => {
          const saved = saveCharacterNameForId(charId, name);
          setCharacter(saved);
        }}
        onClose={() => setScreen({ kind: 'collection' })}
      />
    );
  }

  if (screen.kind === 'stampBook') {
    return <StampBook onClose={() => setScreen({ kind: 'home' })} />;
  }

  if (screen.kind === 'progress') {
    return <ProgressCalendar onClose={() => setScreen({ kind: 'home' })} />;
  }

  return (
    <HomeScreen
      key={refresh}
      characterName={character.name}
      stampTotal={stampTotal}
      onSelectUnit={(unitId) => setScreen({ kind: 'unit', unitId })}
      onStartChallenge={() => setScreen({ kind: 'challenge' })}
      onStartMission={() => setScreen({ kind: 'mission' })}
      onStartMaker={() => setScreen({ kind: 'maker' })}
      onOpenCollection={() => setScreen({ kind: 'collection' })}
      onOpenStampBook={() => setScreen({ kind: 'stampBook' })}
      onOpenProgress={() => setScreen({ kind: 'progress' })}
    />
  );
  }

  return (
    <>
      {renderScreen()}
      <BgmToggle />
    </>
  );
}
