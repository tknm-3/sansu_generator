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

describe('BonusQuizOverlay（だれとだれの差）', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); cleanup(); });

  const quiz: BonusQuiz = {
    kind: 'distance',
    a: { name: 'こども', char: '🦊', pos: 20 },
    b: { name: 'パパ',   char: '🐼', pos: 50 },
    answer: 30,
    choices: [29, 30, 40],
  };

  it('「なんマス はなれてる？」と2人のコマ・マス番号を表示する', () => {
    render(<BonusQuizOverlay quiz={quiz} player={player} styleIdx={0} onAnswer={vi.fn()} />);
    expect(screen.getByText(/なんマス はなれてる/)).toBeInTheDocument();
    // 見出しと数直線の両方にコマが出る（だから getAllBy）
    expect(screen.getAllByText('🦊').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🐼').length).toBeGreaterThan(0);
    // マス番号はカードと数直線の両方に出る（だから getAllBy）
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);   // a のマス番号
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);   // b のマス番号
  });

  it('正しい差を選ぶと せいかい・onAnswer(true)', () => {
    const onAnswer = vi.fn();
    render(<BonusQuizOverlay quiz={quiz} player={player} styleIdx={0} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(/せいかい/)).toBeInTheDocument();
    vi.advanceTimersByTime(2000);
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('ちがう差を選ぶと 後押し文言・onAnswer(false)', () => {
    const onAnswer = vi.fn();
    render(<BonusQuizOverlay quiz={quiz} player={player} styleIdx={0} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole('button', { name: '40' }));
    expect(screen.getByText(/30 マス はなれてるね/)).toBeInTheDocument();
    expect(screen.queryByText(/せいかい/)).not.toBeInTheDocument();
    vi.advanceTimersByTime(2000);
    expect(onAnswer).toHaveBeenCalledWith(false);
  });
});
