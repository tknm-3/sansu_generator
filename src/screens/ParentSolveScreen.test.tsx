import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ParentSolveScreen } from './ParentSolveScreen';
import { buildDivision, buildAddition } from '../lib/problemBuilder';

vi.mock('../features/sound/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../features/speech/tts', () => ({ speakJa: vi.fn() }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('ParentSolveScreen', () => {
  beforeEach(() => {
    cleanup();
  });

  it('あまりのない問題は 1回 正解すると せいかい', () => {
    const onDone = vi.fn();
    const problem = buildAddition(3, 2, '🍎'); // こたえ 5
    render(<ParentSolveScreen problem={problem} characterName="テスト" onDone={onDone} />);

    fireEvent.click(screen.getByText('5'));
    expect(screen.getByText(/せいかい！/)).toBeInTheDocument();
  });

  it('あまりのある わり算は 1人分→あまり の2段階で 両方 正解して せいかい', () => {
    const problem = buildDivision(7, 2, '🍪'); // 1にん 3こ、あまり 1こ
    expect(problem.remainder).toBe(1);
    render(<ParentSolveScreen problem={problem} characterName="テスト" onDone={() => {}} />);

    // ① 1にん なんこ？
    expect(screen.getByText('① 1にん なんこ？')).toBeInTheDocument();
    fireEvent.click(screen.getByText('3'));

    // 1段目正解だけでは せいかい にならず、② あまり に進む
    expect(screen.queryByText(/せいかい！/)).not.toBeInTheDocument();
    expect(screen.getByText('② あまりは なんこ？')).toBeInTheDocument();

    // ② あまり 1こ
    fireEvent.click(screen.getByText('1'));
    expect(screen.getByText(/せいかい！/)).toBeInTheDocument();
    expect(screen.getByText(/1にん 3こ、あまり 1こ/)).toBeInTheDocument();
  });

  it('1人分を まちがえると その時点で ふせいかい', () => {
    const problem = buildDivision(7, 2, '🍪'); // 正解 1にん 3こ
    render(<ParentSolveScreen problem={problem} characterName="テスト" onDone={() => {}} />);

    const wrong = [0, 1, 2, 4, 5, 6].find((n) => screen.queryByText(String(n)));
    fireEvent.click(screen.getByText(String(wrong)));
    expect(screen.getByText(/こたえは/)).toBeInTheDocument();
    expect(screen.getByText(/1にん 3こ、あまり 1こ/)).toBeInTheDocument();
  });
});
