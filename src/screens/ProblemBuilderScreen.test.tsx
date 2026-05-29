import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProblemBuilderScreen } from './ProblemBuilderScreen';

vi.mock('../features/sound/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../features/speech/tts', () => ({ speakJa: vi.fn() }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// お題と目標値が ランダムだと テストが安定しないので、決定的に固定する。
// randomChoice は先頭を返し、お題配列は デフォルト入力で「達成済み」になる
// 単一のお題に差し替える（完成ボタンが押せる初期状態にする）。
vi.mock('../lib/problemBuilder', async (importActual) => {
  const actual = await importActual<typeof import('../lib/problemBuilder')>();
  return {
    ...actual,
    randomChoice: <T,>(arr: readonly T[]) => arr[0],
    // add: デフォルト 3+2=5 で達成
    ADD_GOALS: [{
      id: 'test', text: (t: number) => `ぜんぶで ${t}こ に なるように つくろう！`, pickTarget: () => 5,
      reached: ({ a, b }: { a: number; b: number }, t: number) => a + b === t,
      status: ({ a, b }: { a: number; b: number }) => `いまは ぜんぶで ${a + b}こ`,
    }],
    // mul: デフォルト 3×2=6 で達成
    MUL_GOALS: [{
      id: 'test', text: (t: number) => `ぜんぶで ${t}こ に なるように つくろう！`, pickTarget: () => 6,
      reached: ({ groups, perGroup }: { groups: number; perGroup: number }, t: number) => groups * perGroup === t,
      status: ({ groups, perGroup }: { groups: number; perGroup: number }) => `いまは ぜんぶで ${groups * perGroup}こ`,
    }],
    // div: デフォルト 7÷2 → あまり1 で達成
    DIV_GOALS: [{
      id: 'test', text: (t: number) => `あまりが ${t}こ に なるように つくろう！`, pickTarget: () => 1,
      reached: ({ total, groups }: { total: number; groups: number }, t: number) => total % groups === t,
      status: ({ total, groups }: { total: number; groups: number }) => `いまは あまり ${total % groups}こ`,
    }],
  };
});

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

    expect(screen.getByText('これで かんせい！')).toBeInTheDocument();
    fireEvent.click(screen.getByText('これで かんせい！'));

    expect(screen.getByText('もんだい できたよ！')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ちょうせん！'));
    expect(onMake).toHaveBeenCalledOnce();
    expect(onMake.mock.calls[0][0].type).toBe('addition');
  });

  it('ぴったり も かごの作業台で作れる（お題達成後）', () => {
    render(<ProblemBuilderScreen characterName="テスト" onMake={() => {}} onExit={() => {}} />);
    fireEvent.click(screen.getByText('ぴったり？'));
    expect(screen.getByText(/つくろう！/)).toBeInTheDocument();
    // お題「ぴったり」を満たすよう、かごの大きさ(5)に合わせて かごへ もう1つ おく（4→5）
    fireEvent.click(screen.getAllByLabelText('おく')[0]);
    fireEvent.click(screen.getByText('これで かんせい！'));
    expect(screen.getByText('もんだい できたよ！')).toBeInTheDocument();
  });

  it('お題を達成していないと 完成ボタンは 押せない', () => {
    const onMake = vi.fn();
    render(<ProblemBuilderScreen characterName="テスト" onMake={onMake} onExit={() => {}} />);
    fireEvent.click(screen.getByText('たしざん'));

    // お題「ぜんぶで 5こ」。デフォルト 3+2=5 で達成しているので、まず1つ足して 未達成にする
    fireEvent.click(screen.getAllByLabelText('おく')[0]); // 6こ になり お題未達成
    expect(screen.queryByText('これで かんせい！')).not.toBeInTheDocument();
    const disabled = screen.getByText('おだいを たっせいしてね');
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(screen.queryByText('もんだい できたよ！')).not.toBeInTheDocument();
  });

  it('かけざんを作れる', () => {
    const onMake = vi.fn();
    render(<ProblemBuilderScreen characterName="テスト" onMake={onMake} onExit={() => {}} />);
    fireEvent.click(screen.getByText('かけざん'));
    expect(screen.getByText('これで かんせい！')).toBeInTheDocument();
    fireEvent.click(screen.getByText('これで かんせい！'));
    fireEvent.click(screen.getByText('ちょうせん！'));
    expect(onMake.mock.calls[0][0].type).toBe('multiplication');
  });

  it('わりざんを作れる', () => {
    const onMake = vi.fn();
    render(<ProblemBuilderScreen characterName="テスト" onMake={onMake} onExit={() => {}} />);
    fireEvent.click(screen.getByText('わりざん'));
    expect(screen.getByText('これで かんせい！')).toBeInTheDocument();
    fireEvent.click(screen.getByText('これで かんせい！'));
    fireEvent.click(screen.getByText('ちょうせん！'));
    expect(onMake.mock.calls[0][0].type).toBe('division');
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
