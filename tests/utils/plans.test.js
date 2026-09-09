/**
 * plans — the module that exists because a hardcoded plan list mislabelled
 * paying customers.
 *
 * 17 Aug 2026: AdminUsers.jsx and AdminLicenses.jsx each carried
 * `const PLANS = ['free','pro','enterprise']`, a list migration 010 had
 * already replaced. A <select> whose value matches none of its options renders
 * the FIRST option, so three paying seeker_pro customers displayed as 'free'
 * while their entitlements were correct. Someone then "corrected" them through
 * that dropdown onto a deprecated tier — a display bug that caused a real one.
 *
 * The assertions below pin the two behaviours that would have prevented it:
 * the fallback names the CURRENT tiers, and planOptions never drops the plan
 * the user is actually on.
 *
 * useAssignablePlans is a React hook and is not covered here; it belongs to
 * layer 3 (React Testing Library), not to a pure-unit layer.
 */
import { describe, it, expect } from 'vitest';
import {
  PLAN_FALLBACK,
  planColor,
  planOptions,
  planOptionLabel,
} from '../../src/utils/plans.js';

describe('PLAN_FALLBACK', () => {
  it('names the current tiers, not the pre-migration-010 ones', () => {
    expect(PLAN_FALLBACK).toEqual(['free', 'provider_growth', 'seeker_pro', 'seeker_enterprise']);
  });

  it('contains neither deprecated tier', () => {
    // 'pro' and 'enterprise' are soft-deprecated; a fallback that offers them
    // is how a paying user gets moved onto a tier that predates the pricing model.
    expect(PLAN_FALLBACK).not.toContain('pro');
    expect(PLAN_FALLBACK).not.toContain('enterprise');
  });
});

describe('planOptions — never misreport the plan a user is on', () => {
  it('returns the assignable list unchanged when the current plan is in it', () => {
    expect(planOptions(PLAN_FALLBACK, 'seeker_pro')).toEqual(PLAN_FALLBACK);
  });

  it('prepends a deprecated current plan so the select cannot silently show another', () => {
    // This is the exact incident: 'pro' is not assignable, but the user is on
    // it. Without this the <select> renders 'free' and looks authoritative.
    expect(planOptions(PLAN_FALLBACK, 'pro')).toEqual(['pro', ...PLAN_FALLBACK]);
  });

  it('returns the list unchanged when there is no current plan', () => {
    expect(planOptions(PLAN_FALLBACK, null)).toEqual(PLAN_FALLBACK);
    expect(planOptions(PLAN_FALLBACK, undefined)).toEqual(PLAN_FALLBACK);
    expect(planOptions(PLAN_FALLBACK, '')).toEqual(PLAN_FALLBACK);
  });

  it('never drops the current plan, whatever it is', () => {
    for (const plan of ['pro', 'enterprise', 'legacy_tier_2024', 'seeker_pro']) {
      expect(planOptions(PLAN_FALLBACK, plan)).toContain(plan);
    }
  });
});

describe('planOptionLabel', () => {
  it('labels an assignable plan with its bare name', () => {
    expect(planOptionLabel(PLAN_FALLBACK, 'seeker_pro')).toBe('seeker_pro');
  });

  it('marks a non-assignable current plan so an admin knows why it is there', () => {
    expect(planOptionLabel(PLAN_FALLBACK, 'pro')).toBe('pro (current, not assignable)');
  });
});

describe('planColor — substring-keyed so a new tier never falls through to free-grey', () => {
  it('gives free its own grey', () => {
    expect(planColor('free')).toBe('bg-gray-100 text-gray-600');
  });

  it('gives every enterprise-shaped tier the enterprise colour', () => {
    for (const plan of ['enterprise', 'seeker_enterprise', 'provider_enterprise_2027']) {
      expect(planColor(plan)).toBe('bg-purple-100 text-purple-700');
    }
  });

  it('gives an unrecognised paid tier the primary colour, not free-grey', () => {
    // The whole point of substring keying: a future tier gets sane colours
    // instead of repeating the incident in CSS.
    for (const plan of ['seeker_pro', 'provider_growth', 'seeker_pro_plus']) {
      expect(planColor(plan)).toBe('bg-primary-100 text-primary-700');
    }
  });

  it('treats a missing plan as free rather than throwing', () => {
    expect(planColor(null)).toBe('bg-gray-100 text-gray-600');
    expect(planColor(undefined)).toBe('bg-gray-100 text-gray-600');
    expect(planColor('')).toBe('bg-gray-100 text-gray-600');
  });
});
