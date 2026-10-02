/**
 * s126 (2 Oct 2026) — Sector re-check: "Approve in bulk". The SaaS/Enterprise pass left ~14,000 medium/low proposals;
 * Rajeev said yes to approving all of one confidence for one target sector at once, with an Undo per bulk.
 * Adds one step pointing at the bulk panel (always rendered once the page loads), after the status step.
 * Also (same day): Agent Runs gets "Results per client" (Rajeev: "yes do 1 → 2 → 3") — one step after the summary.
 * Also: the CEO view lists competitors' startup programmes and keeps deals for 12 months — described in the brief's
 * Agents step (the CEO view is rendered for company accounts only, inside the always-present Agents section).
 * Also: the 8-vector AI draft costs 20 AI credits (Rajeev: "charge credit", 20 credits) — the evaluate tour no longer
 * says the AI part is free or Pro-only.
 * Derived from pagesS125b so the six split modules and the earlier S12x modules stay verbatim.
 */
import { pagesS125b } from './pagesS125b.js';
import { pagesS125 } from './pagesS125.js';
import { pagesCore } from './pagesCore.js';

const sector = pagesS125b['/dashboard/admin/sector-recheck'];
const BULK = {
  target: '#tour-sector-recheck-bulk',
  title: 'Approve in bulk',
  content: 'Too many to click through? Spot-check a few medium-confidence proposals in the list first, then press "Approve all N medium → sector" to approve every one moving to that sector at once. Each is audited and never changes a profile someone edited. "Recent bulk approvals" lists each bulk with an Undo that puts the whole bulk back for review.',
  placement: 'top',
  skipBeacon: true,
};
const runs = pagesS125['/dashboard/admin/agent-runs'];
const CLIENTS = {
  target: '#tour-agent-runs-clients',
  title: 'Results per client',
  content: 'What the Innovation Agent achieved for each client: minutes to the first startup they kept (target under 10), the share of its suggestions they accepted, good fit, how far startups moved from shortlist to intro, meeting and pilot, the last 30 days against the target of 3 intros and 1 meeting, and an estimate of time saved.',
  placement: 'bottom',
  skipBeacon: true,
};
const afterSummary = runs.steps.findIndex(s => s.target === '#tour-agent-runs-summary');
const brief = pagesS125b['/dashboard/brief'];
const PROGRAMMES = ' The CEO view also lists the startup programmes your competitors run, and other open programmes close to your priorities; a deal seen on an earlier read stays for 12 months.';
const evaluate = pagesCore['/dashboard/evaluate'];
const EV_FREE = 'Free for all OpenI users.';
const EV_FREE_NEW = 'Scoring it yourself is free for all OpenI users; "AI Draft" fills the scores from platform evidence for 20 AI credits (put back if the draft fails).';
const EV_PRO = 'Pro tier adds AI-powered auto-fill.';
const EV_PRO_NEW = 'Link a platform startup to use "AI Draft" (20 AI credits).';
const at = sector.steps.findIndex(s => s.target === '#tour-sector-recheck-status');

export const pagesS126 = {
  '/dashboard/evaluate': {
    ...evaluate,
    steps: evaluate.steps.map(s => ({ ...s, content: s.content.replace(EV_FREE, EV_FREE_NEW).replace(EV_PRO, EV_PRO_NEW) })),
  },
  '/dashboard/brief': {
    ...brief,
    steps: brief.steps.map(s => (s.target === '#tour-brief-agents' ? { ...s, content: `${s.content}${PROGRAMMES}` } : s)),
  },
  '/dashboard/admin/agent-runs': {
    ...runs,
    steps: [...runs.steps.slice(0, afterSummary + 1), CLIENTS, ...runs.steps.slice(afterSummary + 1)],
  },
  '/dashboard/admin/sector-recheck': {
    ...sector,
    steps: [...sector.steps.slice(0, at + 1), BULK, ...sector.steps.slice(at + 1)],
  },
};
