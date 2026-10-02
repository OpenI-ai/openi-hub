/**
 * @vitest-environment jsdom
 *
 * s126 live check (2 Oct 2026): pressing "Evaluate with AI" on an account with no AI credits showed the raw code
 * "upgrade_required" as the toast. The toast now says what to do.
 */
import { describe, it, expect } from 'vitest';
import { evaluateErrorText } from '../../src/pages/dashboard/InnovationBrief';

describe('evaluateErrorText', () => {
  it('no credits (402 upgrade_required): says how to get credits, never the raw code', () => {
    const err = Object.assign(new Error('upgrade_required'), { status: 402, feature: 'ai_tokens', error: 'upgrade_required' });
    const text = evaluateErrorText(err);
    expect(text).toMatch(/AI credit pack/);
    expect(text).not.toMatch(/upgrade_required/);
  });
  it('any other failure keeps the server message', () => {
    expect(evaluateErrorText(Object.assign(new Error('That startup was not found.'), { status: 404 }))).toBe('That startup was not found.');
    expect(evaluateErrorText(null)).toBe('The evaluation could not run');
  });
});
