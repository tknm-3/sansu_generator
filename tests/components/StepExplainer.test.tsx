import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepExplainer } from '../../src/components/StepExplainer';
import type { ExplainStep } from '../../src/lib/math/explain';

vi.mock('../../src/features/speech/tts', () => ({ speakJa: vi.fn() }));

const steps: ExplainStep[] = [
  { kind: 'equation', caption: 'けいさん', narration: '', data: { text: '5 ＋ 8' } },
];

describe('StepExplainer', () => {
  it('渡した problem を表示する', () => {
    render(<StepExplainer steps={steps} problem="5 ＋ 8 ＝ ？" onClose={() => {}} />);
    expect(screen.getByText('5 ＋ 8 ＝ ？')).toBeTruthy();
  });
});
