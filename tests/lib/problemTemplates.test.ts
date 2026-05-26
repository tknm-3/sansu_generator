import { describe, it, expect } from 'vitest';
import { TEMPLATES, fillTemplate, type TemplateFilled } from '../../src/lib/problemTemplates';

describe('TEMPLATES', () => {
  it('has at least 5 templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('every template has title and sample numbers in range', () => {
    for (const t of TEMPLATES) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.sampleA).toBeGreaterThanOrEqual(t.aRange[0]);
      expect(t.sampleA).toBeLessThanOrEqual(t.aRange[1]);
      expect(t.sampleB).toBeGreaterThanOrEqual(t.bRange[0]);
      expect(t.sampleB).toBeLessThanOrEqual(t.bRange[1]);
    }
  });

  it('has multiple templates each for multiplication and division', () => {
    expect(TEMPLATES.filter((t) => t.type === 'multiplication').length).toBeGreaterThanOrEqual(2);
    expect(TEMPLATES.filter((t) => t.type === 'division').length).toBeGreaterThanOrEqual(2);
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
