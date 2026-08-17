/**
 * Subscription plan names for admin surfaces — fetched, never hardcoded.
 *
 * 17 Aug 2026. AdminUsers.jsx and AdminLicenses.jsx each carried their own
 * `const PLANS = ['free','pro','enterprise']`, duplicating a list the backend
 * had already replaced. Migration 010 (Phase 37) renamed the paid tiers to
 * provider_growth / seeker_pro / seeker_enterprise, migrated every paid user
 * onto them, and soft-deprecated 'pro' and 'enterprise'. Neither frontend copy
 * was updated.
 *
 * A <select> whose value matches none of its options renders the FIRST option.
 * So three paying seeker_pro customers displayed as 'free' in the admin table
 * while their entitlements were entirely correct — and the colour lookup
 * missed too, so the badge was free-grey as well. Both signals agreed, and
 * both were wrong.
 *
 * The display bug then caused a real one: those users were "corrected" through
 * that dropdown onto 'pro', a deprecated plan whose feature set predates the
 * current pricing model.
 *
 * This module exists so the list has ONE definition. Duplicating it across two
 * screens is what produced the incident; fixing it in two places would repeat
 * the mistake.
 */
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/apiDomains/admin';

/**
 * Used only until /admin/plans responds, and if it never does.
 *
 * These are the CURRENT names deliberately — not the pre-migration-010 ones.
 * A fallback that mislabels paying users is worse than no fallback, because it
 * looks authoritative.
 */
export const PLAN_FALLBACK = ['free', 'provider_growth', 'seeker_pro', 'seeker_enterprise'];

/**
 * Substring-keyed rather than an exact-match map, so a future tier
 * (seeker_pro_plus, provider_growth_2027) gets sane colours instead of
 * silently falling through to free-grey — the same failure mode as above,
 * just in CSS.
 */
export function planColor(plan) {
  const p = String(plan || '');
  if (!p || p === 'free') return 'bg-gray-100 text-gray-600';
  if (p.includes('enterprise')) return 'bg-purple-100 text-purple-700';
  return 'bg-primary-100 text-primary-700';
}

/**
 * Assignable plan names from subscription_plans WHERE is_active = true.
 * One fetch per mount; the set changes only when pricing does.
 */
export function useAssignablePlans() {
  const [plans, setPlans] = useState(PLAN_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    adminAPI.listPlans()
      .then((data) => {
        const names = (data?.plans || []).map((p) => p.name).filter(Boolean);
        if (!cancelled && names.length) setPlans(names);
      })
      .catch(() => { /* keep PLAN_FALLBACK — current-but-static beats empty */ });
    return () => { cancelled = true; };
  }, []);

  return plans;
}

/**
 * Options for a per-user plan <select>.
 *
 * Always includes the user's OWN plan, even when it is not assignable — a user
 * can validly sit on a deprecated tier. Omitting it is what makes the control
 * report a plan the user is not on.
 */
export function planOptions(plans, currentPlan) {
  if (!currentPlan || plans.includes(currentPlan)) return plans;
  return [currentPlan, ...plans];
}

export function planOptionLabel(plans, plan) {
  return plans.includes(plan) ? plan : `${plan} (current, not assignable)`;
}
