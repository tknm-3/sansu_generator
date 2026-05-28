import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProblemBuilderScreen } from './ProblemBuilderScreen';

vi.mock('../features/sound/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../features/speech/tts', () => ({ speakJa: vi.fn() }));

describe('ProblemBuilderScreen', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('たしざんを 物を置いて作り、プレビュー→出題まで進める', () => {
    const onMake = vi.fn();
    render(<ProblemBuilderScreen characterName="テスト" onMake={onMake} onExit={() => {}} />);

    expect(screen.getByText('どんな もんだいを つくる？')).toBeInTheDocument();
    fireEvent.click(screen.getByText('たしざん'));

    expect(screen.getByText(/おいて つくろう/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('これで かんせい！'));

    expect(screen.getByText('もんだい できたよ！')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ちょうせん！'));
    expect(onMake).toHaveBeenCalledOnce();
    expect(onMake.mock.calls[0][0].type).toBe('addition');
  });

  it('ぴったり も かごの作業台で作れる', () => {
    render(<ProblemBuilderScreen characterName="テスト" onMake={() => {}} onExit={() => {}} />);
    fireEvent.click(screen.getByText('ぴったり？'));
    expect(screen.getByText('かごに ぴったり？')).toBeInTheDocument();
    fireEvent.click(screen.getByText('これで かんせい！'));
    expect(screen.getByText('もんだい できたよ！')).toBeInTheDocument();
  });

  it('もどるで 種類選びに戻れる', () => {
    const onExit = vi.fn();
    render(<ProblemBuilderScreen characterName="テスト" onMake={() => {}} onExit={onExit} />);
    fireEvent.click(screen.getByText('ひきざん'));
    fireEvent.click(screen.getByText('もどる'));
    expect(screen.getByText('どんな もんだいを つくる？')).toBeInTheDocument();
    fireEvent.click(screen.getByText('もどる'));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
