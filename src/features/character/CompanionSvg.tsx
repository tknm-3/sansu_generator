export type FaceExpression = 'normal' | 'happy' | 'hint';

interface Props {
  expression?: FaceExpression;
  size?: number;
}

export function CompanionSvg({ expression = 'normal', size = 80 }: Props) {
  const eyes = {
    normal: (
      <>
        <circle cx="38" cy="52" r="4" fill="#333" />
        <circle cx="62" cy="52" r="4" fill="#333" />
        <circle cx="39.5" cy="50.5" r="1.5" fill="white" />
        <circle cx="63.5" cy="50.5" r="1.5" fill="white" />
      </>
    ),
    happy: (
      <>
        <path d="M34 52 Q38 46 42 52" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M58 52 Q62 46 66 52" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
    hint: (
      <>
        <circle cx="38" cy="52" r="4" fill="#333" />
        <circle cx="62" cy="52" r="4" fill="#333" />
        <circle cx="39.5" cy="50.5" r="1.5" fill="white" />
        <circle cx="63.5" cy="50.5" r="1.5" fill="white" />
        <path d="M56 44 Q62 40 68 43" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  }[expression];

  const mouth = {
    normal: <path d="M43 63 Q50 69 57 63" stroke="#c0392b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    happy: <path d="M40 63 Q50 74 60 63" stroke="#c0392b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    hint: <path d="M43 65 Q50 68 57 65" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />,
  }[expression];

  const cheekColor = expression === 'happy' ? '#ffb3b3' : '#ffd0d0';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="22" rx="10" ry="22" fill="#f5c5d0" />
      <ellipse cx="30" cy="22" rx="6" ry="16" fill="#ffaab8" />
      <ellipse cx="70" cy="22" rx="10" ry="22" fill="#f5c5d0" />
      <ellipse cx="70" cy="22" rx="6" ry="16" fill="#ffaab8" />
      <circle cx="50" cy="58" r="34" fill="#fce8ee" />
      <ellipse cx="28" cy="64" rx="9" ry="6" fill={cheekColor} opacity="0.7" />
      <ellipse cx="72" cy="64" rx="9" ry="6" fill={cheekColor} opacity="0.7" />
      <ellipse cx="50" cy="59" rx="3.5" ry="2.5" fill="#ff8fa3" />
      <line x1="16" y1="60" x2="38" y2="62" stroke="#ccc" strokeWidth="1.2" />
      <line x1="16" y1="65" x2="38" y2="64" stroke="#ccc" strokeWidth="1.2" />
      <line x1="84" y1="60" x2="62" y2="62" stroke="#ccc" strokeWidth="1.2" />
      <line x1="84" y1="65" x2="62" y2="64" stroke="#ccc" strokeWidth="1.2" />
      {eyes}
      {mouth}
    </svg>
  );
}
