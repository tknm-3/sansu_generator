import { describe, it, expect } from 'vitest';
import { TEMPLATES, fillTemplate, type TemplateFilled } from '../../src/lib/problemTemplates';

describe('TEMPLATES', () => {
  it('has at least 5 templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });
});

describe('fillTemplate', () => {
  it('returns a filled problem with computed answer', () => {
    const tpl = TEMPLATES[0];
    const filled: TemplateFilled = fillTemplate(tpl, { a: 3, b: 4, emoji: '🍎' });
    expect(typeof filled.answer).toBe('number');
    expect(filled.questionText.length).toBeGreaterThan(0);
  });
  it('answer is correct for addition template', () => {
    const addTpl = TEMPLATES.find((t) => t.type === 'addition')!;
    const filled = fillTemplate(addTpl, { a: 5, b: 3, emoji: '🍊' });
    expect(filled.answer).toBe(8);
  });
});
