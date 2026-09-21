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

  it('declares only keys a backend gate actually ENFORCES', () => {
    // ⚠️ THE STANDARD IS "ENFORCED", NOT "DECLARED", and the difference bit
    // during this very change. subscription_plans.features carries several
    // flags that no middleware reads — multi_seat_org_admin,
    // can_create_programs_batches, rich_profile_sections_unlocked and
    // multi_currency_enabled each have ZERO enforcement sites outside the
    // migrations that seed them. Gating a card on one of those would show a
    // feature as locked that every user can in fact open: the original bug
    // inverted, and just as wrong. A key earns a place here only when
    // something server-side refuses the request without it.
    const ENFORCED_KEYS = [
      ...BACKEND_GATED_KEYS,
      // Not a checkFeatureAccess gate but genuinely enforced: checkAiSearchQuota
      // (middleware/subscription.js) reads it, where 0 blocks outright.
      'ai_search_daily_cap',
    ];
    const unenforced = declared.filter((k) => !ENFORCED_KEYS.includes(k));
    expect(unenforced, `declared but enforced nowhere: ${unenforced.join(', ')}`).toEqual([]);
  });

  it('every paid-tier entry is either gated or a known ungated claim', () => {
    // An entry badged Pro/Enterprise with no featureKey is an UNCHECKABLE
    // claim — nothing can tell whether it is still true. Most should carry a
    // key. The exceptions are listed, not waved through, because each one is a
    // real finding: the page advertises it as paid while the backend lets
    // anyone use it. That is a product decision to confirm (gate it, or
    // relabel it free), and the allow-list is where it stays visible until
    // someone makes it. Same shape as the allow-list in the backend's
    // challenge-soft-delete guard.
    const UNGATED_PAID_CLAIMS = [
      'Rich Startup Profile',     // rich_profile_sections_unlocked — unenforced
      'Portfolio Management',     // /investor/portfolio carries no plan gate
      'Program Management',       // can_create_programs_batches — unenforced
      'Multi-Currency',           // multi_currency_enabled — unenforced
    ];
    const entries = [...src.matchAll(/\{\s*icon:[^}]*?\}/g)].map((m) => m[0]);
    const unexplained = entries
      .filter((e) => /tier:\s*'(pro|enterprise)'/.test(e) && !/featureKey:/.test(e))
      .map((e) => (e.match(/title:\s*'([^']+)'/) || [])[1])
      .filter((t) => !UNGATED_PAID_CLAIMS.includes(t));
    expect(unexplained, `paid tier, no gate, not on the allow-list: ${unexplained.join(', ')}`).toEqual([]);
  });

  it('no free-tier entry is gated on a key that would lock it', () => {
    // A 'free' badge on a gated entry renders the card locked under the prompt
    // "Upgrade to Free →". Caught in review of this change: Organization Admin
    // was briefly given multi_seat_org_admin, an Enterprise-only flag.
    const entries = [...src.matchAll(/\{\s*icon:[^}]*?\}/g)].map((m) => m[0]);
    const freeButGated = entries
      .filter((e) => /tier:\s*'free'/.test(e) && /featureKey:/.test(e))
      .map((e) => (e.match(/title:\s*'([^']+)'/) || [])[1]);
    expect(freeButGated).toEqual([]);
  });

  it('does not read entitlement from user.current_plan', () => {
    const code = src.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'));
    expect(code.join('\n')).not.toMatch(/current_plan/);
  });
});
