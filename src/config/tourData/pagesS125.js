/**
 * OpenI Hub - page tours for the s125 surfaces (1 Oct 2026).
 *
 * Innovation Agent Phase 4 (trust and autonomy) on a company's Innovation Brief, and
 * the sector re-check's auto-approve on the admin page. On the brief:
 * the "Suggest only / Auto: free steps" switch, "Done for you" with Undo, and
 * "Why?" (the evidence behind each next move). Rajeev's rule (29 Sep): every new
 * feature ships with its tour.
 *
 * The inbox renders for company accounts only, and the brief's tour is shared by
 * every persona, so it is described in the always-present "Agents working for
 * you" step (a step whose target never renders stalls the tour). This module
 * re-states the s124 brief entry with that one sentence replaced and is spread
 * AFTER pagesS124 in ./index.js; the earlier steps are reused, not copied.
 */
import { pagesS124 } from './pagesS124.js';

const brief = pagesS124['/dashboard/brief'];
const OLD = 'It only suggests; nothing happens without your click.';
const NEW = 'Under each next move, "Why?" shows what it rests on: the analyst\'s reason, the search Scout ran, and links to the startup\'s profile and website. By default your agent only suggests ("Suggest only"): nothing happens without your click. Switch to "Auto: free steps" and, after each run, it also shortlists up to 3 startups it found and the analyst checked (each goes on your watchlist) and drafts a challenge for your top priority; they appear under "Done for you", where "Undo" takes a shortlist back and "Review" opens the draft. It never launches a challenge, invites, writes intros, books meetings, adds priorities or spends credits on its own.';

// s125 — the admin "Sector re-check" page: the agent approves its own high-confidence proposals.
// Told in the always-present status step (the auto line renders only after the page loads its data).
const sector = pagesS124['/dashboard/admin/sector-recheck'];
const AUTO = ' The agent approves its own high-confidence proposals that change a sector: after each run, and every night with the newly filed startups. Each approval is recorded like yours and never overwrites a profile someone edited. Medium and low confidence, and a "Probably not a startup" that keeps the sector, still wait for you. "Approve high confidence now" clears the backlog at once.';

export const pagesS125 = {
  '/dashboard/admin/sector-recheck': {
    ...sector,
    steps: sector.steps.map(s => (s.target === '#tour-sector-recheck-status' ? { ...s, content: `${s.content}${AUTO}` } : s)),
  },
  '/dashboard/brief': {
    ...brief,
    steps: brief.steps.map(s => (s.target === '#tour-brief-agents' ? { ...s, content: s.content.replace(OLD, NEW) } : s)),
  },
};
