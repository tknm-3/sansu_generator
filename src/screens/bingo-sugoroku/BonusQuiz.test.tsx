import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BonusQuizOverlay } from './BonusQuiz';
import type { Player } from './types';
import type { BonusQuiz } from './logic';

vi.mock('../../features/sound/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../../features/speech/tts', () => ({ speakJa: vi.fn() }));

const player: Player = {
  name: 'こども', numbers: [], checked: [], position: 10, doneLines: [], character: '🐶',
};

describe('BonusQuizOverlay（大小比較）', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); cleanup(); });

  const quiz: BonusQuiz = { kind: 'compare', a: 32, b: 35, answer: 35 };

  it('大きいほうを選ぶと せいかい・onAnswer(true)', () => {
    const onAnswer = vi.fn();
    render(<BonusQuizOverlay quiz={quiz} player={player} styleIdx={0} onAnswer={onAnswer} />);
    expect(screen.getByText('おおきいのは どっち？')).toBeInTheDocument();

    fireEvent.click(screen.getByText('35'));
    expect(screen.getByText(/せいかい/)).toBeInTheDocument();

    vi.advanceTimersByTime(2000);
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('小さいほうを選ぶと 後押し文言・onAnswer(false)', () => {
    const onAnswer = vi.fn();
    render(<BonusQuizOverlay quiz={quiz} player={player} styleIdx={0} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText('32'));
    expect(screen.getByText(/35 のほうが おおきい/)).toBeInTheDocument();
    expect(screen.queryByText(/せいかい/)).not.toBeInTheDocument();

    vi.advanceTimersByTime(2000);
    expect(onAnswer).toHaveBeenCalledWith(false);
  });
});

describe('BonusQuizOverlay（数直線推定）', () => {
  beforeEach(() => { cleanup(); });

  it('お題の数字と「どのへん？」を表示する', () => {
    const quiz: BonusQuiz = { kind: 'numberline', target: 45, tolerance: 8, labels: [0, 50, 100] };
    render(<BonusQuizOverlay quiz={quiz} player={player} styleIdx={1} onAnswer={vi.fn()} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/どのへん/)).toBeInTheDocument();
  });
});
