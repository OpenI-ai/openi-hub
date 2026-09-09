/**
 * challengeGate — the client-side mirror of the backend invite gate.
 *
 * Reported by Dentsu (s81): a closed challenge accepted invites and reported
 * "invitation sent" while nothing usable happened. This copy exists so the
 * user is told BEFORE composing a list of invitees.
 *
 * The module's own docblock states the contract that matters most here: this
 * gate must FAIL OPEN. It is not the enforcement — the backend 409 is — and a
 * false negative costs a wasted click, while a false positive blocks a
 * legitimate invite on the client with no server involved. Every assertion
 * below about unknown or malformed input is protecting that direction.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canInviteToChallenge, deadlinePassed } from '../../src/utils/challengeGate.js';

describe('canInviteToChallenge — terminal statuses', () => {
  it.each(['closed', 'awarded'])('blocks an invite to a %s challenge', (status) => {
    const result = canInviteToChallenge({ status });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('closed');
    // Verbatim from the client's bug report; kept in sync with the backend copy.
    expect(result.message).toBe('Invitation cannot be sent because the challenge is closed');
  });

  it.each(['open', 'draft', 'evaluating', undefined])('allows an invite when status is %s', (status) => {
    expect(canInviteToChallenge({ status }).ok).toBe(true);
  });
});

describe('canInviteToChallenge — failing open', () => {
  it('allows the invite when the challenge is unknown, leaving it to the server', () => {
    expect(canInviteToChallenge(null).ok).toBe(true);
    expect(canInviteToChallenge(undefined).ok).toBe(true);
  });

  it('allows the invite when the deadline is unparseable rather than guessing', () => {
    expect(canInviteToChallenge({ status: 'open', deadline: 'whenever' }).ok).toBe(true);
  });

  it('allows the invite when there is no deadline at all', () => {
    expect(canInviteToChallenge({ status: 'open', deadline: null }).ok).toBe(true);
  });
});

describe('deadlinePassed — day granularity, not millisecond', () => {
  // The implementation compares midnight-to-midnight on purpose: a deadline of
  // "today" must stay invitable all day, not expire at 00:00.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T13:45:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats a deadline earlier today as NOT passed', () => {
    expect(deadlinePassed('2026-09-09T01:00:00Z')).toBe(false);
  });

  it('treats yesterday as passed', () => {
    expect(deadlinePassed('2026-09-08T23:59:00Z')).toBe(true);
  });

  it('treats tomorrow as not passed', () => {
    expect(deadlinePassed('2026-09-10T00:00:00Z')).toBe(false);
  });

  it('returns false for a missing deadline', () => {
    expect(deadlinePassed(null)).toBe(false);
    expect(deadlinePassed(undefined)).toBe(false);
    expect(deadlinePassed('')).toBe(false);
  });

  it('returns false for an unparseable deadline instead of throwing', () => {
    expect(deadlinePassed('not-a-date')).toBe(false);
  });

  it('blocks an open challenge whose deadline has passed', () => {
    const result = canInviteToChallenge({ status: 'open', deadline: '2026-09-01' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('expired');
    expect(result.message).toBe('Invitation cannot be sent because the challenge has passed its deadline');
  });

  it('reports a closed challenge as closed even when the deadline also passed', () => {
    // Status is checked first, and the two messages differ. A user who sees
    // "past its deadline" on an awarded challenge would go ask for an extension.
    const result = canInviteToChallenge({ status: 'awarded', deadline: '2026-09-01' });
    expect(result.reason).toBe('closed');
  });
});
