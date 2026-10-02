/**
 * s126b (2 Oct 2026) — Agent Runs gets "Your agents", the control room (AGENTIC_PLATFORM_PLAN G6; Rajeev: "End to End
 * agentic platform managed using graphs" … "a self learning agent continuously improving"). One step pointing at the
 * panel (always rendered once the page loads), right after the page title step.
 * Derived from pagesS126 so the six split modules and the earlier S12x modules stay verbatim.
 */
import { pagesS126 } from './pagesS126.js';

const runs = pagesS126['/dashboard/admin/agent-runs'];
const CONTROL = {
  target: '#tour-agent-control',
  title: 'Your agents',
  content: "Every agent OpenI runs, one card each: what it does, for whom and when it runs; its week (runs, how many finished OK, clients served, model cost, and a line of runs per day); whether it is getting better (for example the share of recommended startups clients said yes to, against last week); and how it learns. Pause stops an agent until you resume it; Run now starts a nightly job straight away; See runs filters the run list below to that agent.",
  placement: 'bottom',
  skipBeacon: true,
};
const first = runs.steps.findIndex(s => s.target === '#tour-page-admin-agent-runs');

export const pagesS126b = {
  '/dashboard/admin/agent-runs': {
    ...runs,
    steps: [...runs.steps.slice(0, first + 1), CONTROL, ...runs.steps.slice(first + 1)],
  },
};
