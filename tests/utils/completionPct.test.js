/**
 * completionPct — the rule is "100 means finished", and it is worth a test
 * because the bug it replaces was invisible in review.
 *
 * `((573240 / 573241) * 100).toFixed(1)` is the string "100.0". Nothing throws,
 * nothing logs, and the panel confidently reports a complete census while a
 * real selectable profile is outstanding. That is the same class of defect as
 * the counter/selector divergence this panel had shipped hours earlier: a
 * number that cannot express the state it is describing.
 */
import { describe, it, expect } from 'vitest';
import { completionPct } from '../../src/utils/completionPct';

describe('completionPct', () => {
  it('does NOT round up to 100 — the exact production case', () => {
    // 19 Sep 2026: 573,240 checked of 573,241 checkable, one genuinely
    // outstanding. toFixed(1) rendered this as "100.0%".
    expect(completionPct(573240, 573241)).toBe(99.9);
    expect(completionPct(573240, 573241)).toBeLessThan(100);
  });

  it('returns exactly 100 only when nothing is outstanding', () => {
    expect(completionPct(573241, 573241)).toBe(100);
    expect(completionPct(1, 1)).toBe(100);
    expect(completionPct(0, 0)).toBe(0);      // no corpus is not "done"
  });

  it('never reports 100 while ANY work remains, at any corpus size', () => {
    // The failure scales with the denominator: toFixed(1) reads 100.0% for
    // anything above 99.95%, so a bigger corpus hides a bigger backlog. This
    // is the invariant that actually matters, so assert it as a property
    // rather than trusting the two hand-picked cases above.
    for (const total of [3, 100, 1000, 20_001, 573_241, 5_000_000]) {
      for (const missing of [1, 2, Math.max(1, Math.floor(total * 0.0004))]) {
        const done = total - missing;
        if (done <= 0) continue;
        expect(
          completionPct(done, total),
          `${done}/${total} (missing ${missing}) must not read as complete`
        ).toBeLessThan(100);
      }
    }
  });

  it('floors rather than rounds, so progress is never overstated', () => {
    expect(completionPct(2, 3)).toBe(66.6);   // 66.66… — not 66.7
    expect(completionPct(1, 3)).toBe(33.3);
    expect(completionPct(999, 1000)).toBe(99.9);
    expect(completionPct(50, 100)).toBe(50);
  });

  it('degrades to 0 rather than NaN on absent or malformed stats', () => {
    // These render straight into a width style and a label; NaN% would paint
    // a broken bar on a dashboard that is otherwise fine.
    expect(completionPct(5, 0)).toBe(0);
    expect(completionPct(undefined, 100)).toBe(0);
    expect(completionPct(null, 100)).toBe(0);
    expect(completionPct(NaN, 100)).toBe(0);
    expect(completionPct(10, NaN)).toBe(0);
    expect(completionPct(-5, 100)).toBe(0);
    expect(completionPct(10, -100)).toBe(0);
  });

  it('clamps when done exceeds total instead of exceeding the bar', () => {
    // The two counts come from one query but describe a moving corpus; a
    // transient overshoot must not produce a 101%-wide bar.
    expect(completionPct(101, 100)).toBe(100);
  });
});
