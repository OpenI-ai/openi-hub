/**
 * isUpgradeError — routes a gate-hit into the upgrade journey instead of a
 * bare toast.error dead-end.
 *
 * The distinction it encodes is easy to get wrong in either direction, and
 * both directions are user-visible: treat a plain permission 403 as an upgrade
 * prompt and you tell a user to pay for something they will never be allowed
 * to do; miss a real gate hit and they get a generic failure with no way
 * forward.
 */
import { describe, it, expect } from 'vitest';
import { isUpgradeError } from '../../src/utils/upgradeError.js';

describe('isUpgradeError — recognised gate hits', () => {
  it('treats 402 Payment Required as an upgrade prompt', () => {
    expect(isUpgradeError({ status: 402 })).toBe(true);
  });

  it('treats 402 as an upgrade prompt regardless of a feature field', () => {
    expect(isUpgradeError({ status: 402, feature: 'api_access' })).toBe(true);
  });

  it('treats a 403 carrying a feature as a plan-gated feature check', () => {
    expect(isUpgradeError({ status: 403, feature: 'semantic_search' })).toBe(true);
  });
});

describe('isUpgradeError — everything else', () => {
  it('does NOT treat a bare 403 as an upgrade prompt', () => {
    // A generic auth/permission denial. Offering to sell a plan here is wrong.
    expect(isUpgradeError({ status: 403 })).toBe(false);
  });

  it('does not fire on a 403 whose feature is empty or null', () => {
    expect(isUpgradeError({ status: 403, feature: '' })).toBe(false);
    expect(isUpgradeError({ status: 403, feature: null })).toBe(false);
  });

  it.each([400, 401, 404, 409, 429, 500])('does not fire on %s', (status) => {
    expect(isUpgradeError({ status })).toBe(false);
  });
});

describe('isUpgradeError — malformed input', () => {
  it('returns false rather than throwing on null or undefined', () => {
    // This runs inside a catch block, so throwing here would replace the real
    // error with a TypeError and lose the failure entirely.
    expect(isUpgradeError(null)).toBe(false);
    expect(isUpgradeError(undefined)).toBe(false);
  });

  it('returns false for an error with no status', () => {
    expect(isUpgradeError(new Error('network down'))).toBe(false);
    expect(isUpgradeError({})).toBe(false);
  });

  it('does not coerce a string status', () => {
    // api.js sets a numeric status; a string here means something upstream
    // changed shape, and guessing would be worse than declining.
    expect(isUpgradeError({ status: '402' })).toBe(false);
  });
});
