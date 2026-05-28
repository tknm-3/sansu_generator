import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { KatachiHomeScreen } from './screens/KatachiHomeScreen';
import { KatachiMissionScreen } from './screens/KatachiMissionScreen';
import { KatachiChallengeScreen } from './screens/KatachiChallengeScreen';
import { CategorySelectScreen } from './screens/CategorySelectScreen';
import { MakeTenUnit } from './screens/MakeTenUnit';
import { AdditionUnit } from './screens/AdditionUnit';
import { SubtractionUnit } from './screens/SubtractionUnit';
import { CherryCalcUnit } from './screens/CherryCalcUnit';
import { BigAdditionUnit } from './screens/BigAdditionUnit';
import { BigSubtractionUnit } from './screens/BigSubtractionUnit';
import { MultiplicationUnit } from './screens/MultiplicationUnit';
import { DivisionUnit } from './screens/DivisionUnit';
import { WordProblemUnit } from './screens/WordProblemUnit';
import { ShapeRotationUnit } from './screens/ShapeRotationUnit';
import { ShapeComposeUnit } from './screens/ShapeComposeUnit';
import { ShapeViewpointUnit } from './screens/ShapeViewpointUnit';
import { ShapeFoldUnit } from './screens/ShapeFoldUnit';
import { ShapePatternUnit } from './screens/ShapePatternUnit';
import { ShapeSpatialUnit } from './screens/ShapeSpatialUnit';
import { ShapeFitUnit } from './screens/ShapeFitUnit';
import { ChallengeMode } from './screens/ChallengeMode';
import { MissionScreen } from './screens/MissionScreen';
import { ProblemBuilderScreen } from './screens/ProblemBuilderScreen';
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
import type { Category } from './data/units';

const PROFILE_KEY = 'math-app:profile';

type Screen =
  | { kind: 'categorySelect' }
  | { kind: 'home' }
  | { kind: 'katachiHome' }
  | { kind: 'unit'; unitId: string; hard?: boolean; returnTo?: 'katachi-mission' | 'katachi-challenge' }
  | { kind: 'challenge' }
  | { kind: 'mission' }
  | { kind: 'katachi-mission' }
  | { kind: 'katachi-challenge' }
  | { kind: 'maker' }
  | { kind: 'parentSolve'; problem: TemplateFilled }
  | { kind: 'collection' }
  | { kind: 'characterDetail'; charId: string }
  | { kind: 'stampBook' }
  | { kind: 'progress' };

export default function App() {
  const [character, setCharacter] = useState<Character>(loadCharacter);
  const [screen, setScreen] = useState<Screen>({ kind: 'categorySelect' });
  const [category, setCategory] = useState<Category>('sansu');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (screen.kind === 'home' || screen.kind === 'progress' || screen.kind === 'stampBook' || screen.kind === 'collection' || screen.kind === 'characterDetail') {
      setBgmTrack('home');
    }
    if (screen.kind === 'katachiHome' || screen.kind === 'katachi-mission' || screen.kind === 'katachi-challenge') {
      setBgmTrack('katachi-home');
    }
    if (screen.kind === 'categorySelect') {
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
    if (screen.kind === 'unit' && screen.returnTo === 'katachi-mission') {
      setScreen({ kind: 'katachi-mission' });
      return;
    }
    if (screen.kind === 'unit' && screen.returnTo === 'katachi-challenge') {
      setScreen({ kind: 'katachi-challenge' });
      return;
    }
    setScreen(category === 'katachi' ? { kind: 'katachiHome' } : { kind: 'home' });
  }

  const sharedProps = { characterName: character.name, characterId: character.id, onExit: handleExit };

  function handleSelectCategory(cat: Category) {
    setCategory(cat);
    setScreen(cat === 'katachi' ? { kind: 'katachiHome' } : { kind: 'home' });
  }

  function renderScreen() {
    if (screen.kind === 'categorySelect') {
      return <CategorySelectScreen onSelect={handleSelectCategory} onMaker={() => setScreen({ kind: 'maker' })} />;
    }

    if (screen.kind === 'unit') {
      const hard = screen.hard ?? false;
      switch (screen.unitId) {
        case 'make-ten':        return <MakeTenUnit        key={refresh} {...sharedProps} />;
        case 'addition':        return <AdditionUnit        key={refresh} {...sharedProps} />;
        case 'subtraction':     return <SubtractionUnit     key={refresh} {...sharedProps} />;
        case 'cherry-calc':     return <CherryCalcUnit      key={refresh} {...sharedProps} />;
        case 'big-addition':    return <BigAdditionUnit     key={refresh} {...sharedProps} />;
        case 'big-subtraction': return <BigSubtractionUnit  key={refresh} {...sharedProps} />;
        case 'multiplication':  return <MultiplicationUnit  key={refresh} {...sharedProps} />;
        case 'division':        return <DivisionUnit        key={refresh} {...sharedProps} />;
        case 'word-addition':        return <WordProblemUnit key={refresh} variant="word-addition"        {...sharedProps} />;
        case 'word-subtraction':     return <WordProblemUnit key={refresh} variant="word-subtraction"     {...sharedProps} />;
        case 'word-multiplication':  return <WordProblemUnit key={refresh} variant="word-multiplication"  {...sharedProps} />;
        case 'word-division':        return <WordProblemUnit key={refresh} variant="word-division"        {...sharedProps} />;
        case 'shape-rotation':  return <ShapeRotationUnit   key={refresh} hard={hard} {...sharedProps} />;
        case 'shape-compose':   return <ShapeComposeUnit    key={refresh} hard={hard} {...sharedProps} />;
        case 'shape-viewpoint': return <ShapeViewpointUnit  key={refresh} hard={hard} {...sharedProps} />;
        case 'shape-fold':      return <ShapeFoldUnit       key={refresh} hard={hard} {...sharedProps} />;
        case 'shape-pattern':   return <ShapePatternUnit    key={refresh} hard={hard} {...sharedProps} />;
        case 'shape-spatial':   return <ShapeSpatialUnit    key={refresh} hard={hard} {...sharedProps} />;
        case 'shape-fit':       return <ShapeFitUnit        key={refresh} variant="fit"     hard={hard} {...sharedProps} />;
        case 'shape-tangram':   return <ShapeFitUnit        key={refresh} variant="tangram" hard={hard} {...sharedProps} />;
        default:                return <MakeTenUnit         key={refresh} {...sharedProps} />;
      }
    }

    if (screen.kind === 'challenge') return <ChallengeMode key={refresh} {...sharedProps} />;
    if (screen.kind === 'mission')   return <MissionScreen  key={refresh} {...sharedProps} />;

    if (screen.kind === 'katachi-mission') {
      return (
        <KatachiMissionScreen
          key={refresh}
          onSelectUnit={(unitId, hard) => setScreen({ kind: 'unit', unitId, hard, returnTo: 'katachi-mission' })}
          onExit={() => setScreen({ kind: 'katachiHome' })}
        />
      );
    }

    if (screen.kind === 'katachi-challenge') {
      return (
        <KatachiChallengeScreen
          key={refresh}
          onSelectUnit={(unitId, hard) => setScreen({ kind: 'unit', unitId, hard, returnTo: 'katachi-challenge' })}
          onExit={() => setScreen({ kind: 'katachiHome' })}
        />
      );
    }

    if (screen.kind === 'maker') {
      return (
        <ProblemBuilderScreen
          key={refresh}
          characterName={character.name}
          onMake={(problem) => setScreen({ kind: 'parentSolve', problem })}
          onExit={() => setScreen({ kind: 'categorySelect' })}
        />
      );
    }

    if (screen.kind === 'parentSolve') {
      return (
        <ParentSolveScreen
          problem={screen.problem}
          characterName={character.name}
          onDone={() => setScreen({ kind: 'categorySelect' })}
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
          onClose={() => setScreen(category === 'katachi' ? { kind: 'katachiHome' } : { kind: 'home' })}
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
      return <StampBook onClose={() => setScreen(category === 'katachi' ? { kind: 'katachiHome' } : { kind: 'home' })} />;
    }

    if (screen.kind === 'progress') {
      return <ProgressCalendar onClose={() => setScreen(category === 'katachi' ? { kind: 'katachiHome' } : { kind: 'home' })} />;
    }

    if (screen.kind === 'katachiHome') {
      return (
        <KatachiHomeScreen
          key={refresh}
          characterName={character.name}
          characterId={character.id}
          stampTotal={stampTotal}
          onSelectUnit={(unitId, hard) => setScreen({ kind: 'unit', unitId, hard })}
          onStartMission={() => setScreen({ kind: 'katachi-mission' })}
          onStartChallenge={() => setScreen({ kind: 'katachi-challenge' })}
          onOpenCollection={() => setScreen({ kind: 'collection' })}
          onOpenStampBook={() => setScreen({ kind: 'stampBook' })}
          onOpenProgress={() => setScreen({ kind: 'progress' })}
          onBack={() => setScreen({ kind: 'categorySelect' })}
        />
      );
    }

    return (
      <HomeScreen
        key={refresh}
        characterName={character.name}
        characterId={character.id}
        stampTotal={stampTotal}
        onSelectUnit={(unitId) => setScreen({ kind: 'unit', unitId })}
        onStartChallenge={() => setScreen({ kind: 'challenge' })}
        onStartMission={() => setScreen({ kind: 'mission' })}
        onOpenCollection={() => setScreen({ kind: 'collection' })}
        onOpenStampBook={() => setScreen({ kind: 'stampBook' })}
        onOpenProgress={() => setScreen({ kind: 'progress' })}
        onBack={() => setScreen({ kind: 'categorySelect' })}
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
