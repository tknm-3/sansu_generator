export type RotationTransform = { rotate: number; flipX: boolean };

export interface RotationProblem {
  shapeId: string;
  label: string;
  transform: RotationTransform;
  rotationLabel: string;
  choices: RotationTransform[];
  answerIndex: number;
}

export interface ShapeDef {
  id: string;
  label: string;
  path: string;
  viewBox: string;
}

export const SHAPE_DEFS: ShapeDef[] = [
  {
    id: 'arrow-r',
    label: 'やじるし',
    path: 'M10,40 L60,40 L60,20 L90,50 L60,80 L60,60 L10,60 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'lshape',
    label: 'Lのかたち',
    path: 'M10,10 L40,10 L40,60 L80,60 L80,90 L10,90 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'tshape',
    label: 'Tのかたち',
    path: 'M30,10 L70,10 L70,40 L90,40 L90,70 L30,70 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'flag',
    label: 'はたのかたち',
    path: 'M15,10 L85,10 L85,50 L50,50 L50,90 L15,90 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'step',
    label: 'かいだん',
    path: 'M10,90 L10,55 L40,55 L40,30 L70,30 L70,10 L90,10 L90,30 L70,30 L70,55 L40,55 L40,90 Z',
    viewBox: '0 0 100 100',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRotationLabel(transform: RotationTransform): string {
  if (transform.flipX) {
    return 'まわして うらがえします';
  }
  switch (transform.rotate) {
    case 90:  return 'みぎに まわします ➡️';
    case 180: return 'くるっと まわします 🔃';
    case 270: return 'ひだりに まわします ⬅️';
    default:  return 'そのまま';
  }
}

const EASY_QUESTION_TRANSFORMS: RotationTransform[] = [
  { rotate: 90, flipX: false },
];

const EASY_CHOICE_POOL: RotationTransform[] = [
  { rotate: 0,   flipX: false },
  { rotate: 90,  flipX: false },
  { rotate: 180, flipX: false },
  { rotate: 270, flipX: false },
];

const HARD_TRANSFORMS: RotationTransform[] = [
  { rotate: 0,   flipX: false },
  { rotate: 90,  flipX: false },
  { rotate: 180, flipX: false },
  { rotate: 270, flipX: false },
  { rotate: 0,   flipX: true  },
  { rotate: 90,  flipX: true  },
];

export function generateRotationProblem(hard = false): RotationProblem {
  const shape = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];

  let transform: RotationTransform;
  let choicePool: RotationTransform[];

  if (hard) {
    const questionPool = HARD_TRANSFORMS.filter((t) => !(t.rotate === 0 && !t.flipX));
    transform = questionPool[Math.floor(Math.random() * questionPool.length)];
    choicePool = HARD_TRANSFORMS;
  } else {
    transform = EASY_QUESTION_TRANSFORMS[Math.floor(Math.random() * EASY_QUESTION_TRANSFORMS.length)];
    choicePool = EASY_CHOICE_POOL;
  }

  const distractors = choicePool.filter(
    (t) => !(t.rotate === transform.rotate && t.flipX === transform.flipX),
  );
  const picked = shuffle(distractors).slice(0, 3);
  const allChoices = shuffle([transform, ...picked]);
  const answerIndex = allChoices.findIndex(
    (t) => t.rotate === transform.rotate && t.flipX === transform.flipX,
  );

  return {
    shapeId: shape.id,
    label: shape.label,
    transform,
    rotationLabel: getRotationLabel(transform),
    choices: allChoices,
    answerIndex,
  };
}
