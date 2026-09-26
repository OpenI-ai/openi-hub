/**
 * applyLabel — Brief Preview's instant 👍/👎 (s121k). Rajeev: the button took
 * 2-3 seconds to turn green, so the label is applied locally first.
 */
import { describe, it, expect } from 'vitest';
import { applyLabel } from '../../src/utils/briefLabels';

const brief = () => ({ sections: [
  { priority_key: 'p1', items: [{ user_id: 1 }, { user_id: 2, eval_label: 'good' }], quality: { top: 2, labeled: 1, good: 1, bad: 0 } },
  { priority_key: 'p2', items: [{ user_id: 1 }] },
] });

describe('applyLabel', () => {
  it('👍 marks the card and raises the score, in that section only', () => {
    const b = applyLabel(brief(), { priority_key: 'p1', startup_user_id: 1, label: 'good' });
    expect(b.sections[0].items[0].eval_label).toBe('good');
    expect(b.sections[0].quality).toMatchObject({ labeled: 2, good: 2, bad: 0 });
    expect(b.sections[1].items[0].eval_label).toBeUndefined();
  });
  it('👎 hides the card and counts it bad; switching good→bad moves the count', () => {
    const b = applyLabel(brief(), { priority_key: 'p1', startup_user_id: 2, label: 'bad' });
    expect(b.sections[0].items.map(i => i.user_id)).toEqual([1]);
    expect(b.sections[0].quality).toMatchObject({ labeled: 1, good: 0, bad: 1 });
  });
  it('clearing a label lowers the count; no brief is a no-op', () => {
    const b = applyLabel(brief(), { priority_key: 'p1', startup_user_id: 2, label: null });
    expect(b.sections[0].items[1].eval_label).toBeNull();
    expect(b.sections[0].quality).toMatchObject({ labeled: 0, good: 0 });
    expect(applyLabel(null, { priority_key: 'p1', startup_user_id: 1, label: 'good' })).toBeNull();
  });
});
