/**
 * Feature Map — two guards, for the two ways this page goes wrong.
 *
 * ─── GUARD 1: the sweep that missed a file ──────────────────────────────
 * On 17 Aug 2026, commit 7703cfc fixed AdminUsers.jsx and AdminLicenses.jsx,
 * which each compared a user's plan against the literals 'pro' and
 * 'enterprise' — names migration 010 had already replaced with
 * provider_growth / seeker_pro / seeker_enterprise. It also added
 * src/utils/plans.js and tests/utils/plans.test.js to pin the correct names.
 *
 * It did not touch FeatureMap.jsx, which carried the identical comparison.
 * So for five more weeks every paying customer opened Feature Map, saw
 * "Your plan: Free" beside a sidebar reading Enterprise, and was invited to
 * "Upgrade to Pro" on features they already paid for — because
 * `plan === 'pro'` and `plan === 'enterprise'` are both unreachable and the
 * function fell through to `tier === 'free'` for everyone.
 *
 * 📌 A FIX APPLIED FILE-BY-FILE IS NOT A FIX; it is a fix plus an unchecked
 * claim that you found every file. This guard is that claim, made checkable.
 *
 * ─── GUARD 2: the inventory that never grows ────────────────────────────
 * The FEATURES array is editorial — a human decides a capability is worth
 * naming — so it cannot be synced from anything. Left unguarded it silently
 * falls behind: api_access, sso_oidc and sso_audit_logs were all live, all
 * gated by checkFeatureAccess() in the backend, and all shipped with working
 * Settings tabs, while this page never mentioned them.
 *
 * MAINTENANCE — the two-repo handshake. BACKEND_GATED_KEYS mirrors the
 * checkFeatureAccess() call sites in openi-hub-backend. The backend repo has
 * the matching half (tests/plan-gate-manifest.test.mjs), which fails there
 * whenever a gate is added or removed and names this file as the other side.
 * Regenerate with, from the backend checkout:
 *     grep -rhoE "checkFeatureAccess\('[a-z_]+'\)" src/ | sort -u
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');
const FEATURE_MAP = join(SRC, 'pages', 'dashboard', 'FeatureMap.jsx');

// Mirrors openi-hub-backend checkFeatureAccess() call sites — see header.
const BACKEND_GATED_KEYS = [
  'api_access',
  'can_access_deal_pipeline',
  'can_access_portfolio_health',
  'can_access_service_partners',
  'eight_vector_evaluation',
  'semantic_search',
  'sso_audit_logs',
  'sso_oidc',
];

// The plan names migration 010 retired. A source file comparing a plan against
// either is the 17 Aug defect, whatever the surrounding code looks like.
const RETIRED_PLAN_NAMES = ['pro', 'enterprise'];

function sourceFiles(dir = SRC, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.(jsx?|tsx?)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe('Feature Map — no file compares a plan to a retired plan name', () => {
  it('finds source files (guard is not vacuous)', () => {
    expect(sourceFiles().length).toBeGreaterThan(100);
  });

  it('nothing in src/ tests a plan against "pro" or "enterprise"', () => {
    // Deliberately matches the EXPRESSION, not the bare string: 'enterprise' is
    // a legitimate tier label, a badge and a filter-chip key. What was wrong was
    // comparing a PLAN to it.
    const pattern = new RegExp(
      String.raw`(?:\w*[Pp]lan\w*)\s*===\s*'(?:${RETIRED_PLAN_NAMES.join('|')})'` +
      String.raw`|'(?:${RETIRED_PLAN_NAMES.join('|')})'\s*===\s*(?:\w*[Pp]lan\w*)`
    );
    const offenders = [];
    for (const file of sourceFiles()) {
      const src = readFileSync(file, 'utf8');
      src.split('\n').forEach((line, i) => {
        if (line.trim().startsWith('*') || line.trim().startsWith('//')) return; // prose & history
        if (pattern.test(line)) offenders.push(`${file.replace(SRC, 'src')}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe('Feature Map — every plan-gated backend feature is on the page', () => {
  const src = readFileSync(FEATURE_MAP, 'utf8');
  const declared = [...src.matchAll(/featureKey:\s*'([a-z_]+)'/g)].map((m) => m[1]);

  it('declares a featureKey for each gated backend feature', () => {
    const missing = BACKEND_GATED_KEYS.filter((k) => !declared.includes(k));
    expect(missing, `add a FEATURES entry with featureKey for: ${missing.join(', ')}`).toEqual([]);
  });

  it('declares no featureKey the backend does not define', () => {
    // Keys beyond the checkFeatureAccess() set are legitimate — they live in
    // subscription_plans.features and are read directly by the page (e.g.
    // rich_profile_sections_unlocked). What must never appear is an invented one.
    const KNOWN_PLAN_KEYS = [
      ...BACKEND_GATED_KEYS,
      'ai_search_daily_cap', 'can_create_programs_batches', 'multi_currency_enabled',
      'multi_seat_org_admin', 'rich_profile_sections_unlocked',
    ];
    const unknown = declared.filter((k) => !KNOWN_PLAN_KEYS.includes(k));
    expect(unknown, `not a subscription_plans.features key: ${unknown.join(', ')}`).toEqual([]);
  });

  it('gates every entry it labels Pro or Enterprise on a real key', () => {
    // An entry claiming a paid tier with no featureKey is an UNCHECKABLE claim:
    // nothing can tell whether it is still true. Free entries need no key.
    const entries = [...src.matchAll(/\{\s*icon:[^}]*?\}/g)].map((m) => m[0]);
    const paidWithoutKey = entries
      .filter((e) => /tier:\s*'(pro|enterprise)'/.test(e) && !/featureKey:/.test(e))
      .map((e) => (e.match(/title:\s*'([^']+)'/) || [])[1]);
    expect(paidWithoutKey).toEqual([]);
  });

  it('does not read entitlement from user.current_plan', () => {
    const code = src.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'));
    expect(code.join('\n')).not.toMatch(/current_plan/);
  });
});
