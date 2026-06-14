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

// すべて「うらがえす（かがみ）」と「まわす」が みわけられる ように
// 左右・上下の たいしょうじくが ない かたち（キラル）だけを つかう。
export const SHAPE_DEFS: ShapeDef[] = [
  {
    id: 'lshape',
    label: 'L のかたち',
    path: 'M15,15 L45,15 L45,60 L85,60 L85,90 L15,90 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'step',
    label: 'かいだん',
    path: 'M12,90 L12,62 L40,62 L40,40 L68,40 L68,18 L90,18 L90,90 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'flag',
    label: 'はた',
    path: 'M15,12 L82,12 L82,48 L48,48 L48,90 L15,90 Z',
    viewBox: '0 0 100 100',
  },
  {
    id: 'bolt',
    label: 'いなずま',
    path: 'M52,10 L24,52 L44,52 L34,90 L82,44 L56,44 L70,10 Z',
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
    return transform.rotate === 0
      ? '🪞 かがみで うらがえし'
      : '🪞 うらがえして まわす';
  }
  switch (transform.rotate) {
    case 90:  return 'みぎへ まわす ➡️';
    case 180: return 'ぐるっと まわす 🔃';
    case 270: return 'ひだりへ まわす ⬅️';
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

/**
 * かがみ（線対称）問題: お題は つねに「うらがえし（flipX）」。
 * 選択肢は「正しい かがみ」＋「まわしただけ（flipX:false の回転）」のダミーで、
 * まわすのと うらがえすのが ちがうことを みわける（キラルな形なので 必ず 区別できる）。
 */
export function generateMirrorProblem(hard = false): RotationProblem {
  const shape = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
  // お題＝かがみ。むずかしいときは まわしてから うらがえす。
  const transform: RotationTransform = hard
    ? { rotate: [90, 180, 270][Math.floor(Math.random() * 3)], flipX: true }
    : { rotate: 0, flipX: true };
  // ダミーは「うらがえさない 回転」だけ（まわしただけ）にして、かがみと みわけさせる
  const distractorPool: RotationTransform[] = [
    { rotate: 0, flipX: false },
    { rotate: 90, flipX: false },
    { rotate: 180, flipX: false },
    { rotate: 270, flipX: false },
  ];
  const picked = shuffle(distractorPool).slice(0, 3);
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
