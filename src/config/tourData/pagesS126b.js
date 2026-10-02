/**
 * s126b (2 Oct 2026) — Agent Runs gets "Your agents", the control room (AGENTIC_PLATFORM_PLAN G6; Rajeev: "End to End
 * agentic platform managed using graphs" … "a self learning agent continuously improving"). One step pointing at the
 * panel (always rendered once the page loads), right after the page title step.
 * Also (same day, G2 "Adjacent markets agent"): a company's brief gets "Where to venture next" — adjacent markets and
 * small startups to invest in or acquire, which also fill the Strategy map's Venture row. The section appears only once
 * the CEO view has run, so it is described in the always-present Agents step.
 * Also (G3 account watch): the Agents step (it holds the inbox) describes "Daily alerts".
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
const brief = pagesS126['/dashboard/brief'];
const DAILY = ' "Daily alerts" (on by default): one short email in the morning, only when your agent found something new for you — a startup, a competitor\'s startup deal or an open call. Turn it off here.';
const VENTURE = ' "Where to venture next" lists adjacent markets the CEO view found and small startups you could invest in or acquire to enter them; they fill the Strategy map\'s "Venture into adjacent markets" row.';

export const pagesS126b = {
  '/dashboard/brief': {
    ...brief,
    steps: brief.steps.map(s => (s.target === '#tour-brief-agents' ? { ...s, content: `${s.content}${DAILY}${VENTURE}` } : s)),
  },
  '/dashboard/admin/agent-runs': {
    ...runs,
    steps: [...runs.steps.slice(0, first + 1), CONTROL, ...runs.steps.slice(first + 1)],
  },
};
