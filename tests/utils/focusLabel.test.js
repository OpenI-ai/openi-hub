/**
 * focusLabel — the client-side mirror of the backend paste guard (s121j).
 * On 26 Sep a chunk of chat text became a section on a client's brief.
 */
import { describe, it, expect } from 'vitest';
import { focusLabel } from '../../src/utils/focusLabel';

const PASTE = "I'll add Dentsu's two focus areas once both PRs are merged. - **Yesterday's \"New this week\" fix is live.** Ra";

describe('focusLabel', () => {
  it('accepts short focus areas', () => {
    expect(focusLabel('  AI-powered   creative at scale ')).toEqual({ label: 'AI-powered creative at scale' });
    expect(focusLabel('Measurement, insight and brand safety').label).toBe('Measurement, insight and brand safety');
  });
  it('rejects pasted chat text, lists, sentences and long labels', () => {
    for (const bad of [PASTE, '**bold** thing', 'line one\nline two', '- a bullet', '1. first item',
      'We need this. And that too', 'see https://example.com', 'x'.repeat(81),
      'one two three four five six seven eight nine ten eleven', 'ab']) {
      expect(focusLabel(bad).error, bad).toBeTruthy();
    }
  });
});
