/**
 * OpenI Hub - page tours for the s123 surfaces (30 Sep 2026).
 *
 * "Agents working for you" + "Run Scout now" on the Innovation Brief, and the
 * same panel in Brief Preview. Rajeev's rule (29 Sep): every new feature ships
 * with its tour. This module re-states two s122 keys with one change each and
 * is spread AFTER pagesS122 in ./index.js, so it replaces those two entries
 * whole; the s122 steps are reused, not copied.
 *
 * The client brief's panel is always rendered, so it gets its own step. In
 * Brief Preview the panel appears only once a client is picked, so it is
 * described in the always-present "A client or a prospect" step instead.
 */
import { pagesS122 } from './pagesS122.js';

const brief = pagesS122['/dashboard/brief'];
const agentsStep = {
  target: '#tour-brief-agents',
  title: 'Agents working for you',
  content: 'What OpenI\'s agents did for your brief, most recent first: the analyst checking each startup against your business, last night\'s news crawl for your priorities, the strategy map. Press "Run Scout now" and Scout turns each priority into short searches, searches OpenI\'s startups and adds the ones the analyst approves to that priority\'s section, marked "Found by Scout".',
  placement: 'bottom',
  skipBeacon: true,
};
const at = brief.steps.findIndex(s => s.target === '#tour-brief-priorities') + 1;

const preview = pagesS122['/dashboard/admin/brief-preview'];

export const pagesS123 = {
  '/dashboard/brief': { ...brief, steps: [...brief.steps.slice(0, at), agentsStep, ...brief.steps.slice(at)] },
  '/dashboard/admin/brief-preview': {
    ...preview,
    steps: preview.steps.map(s => (s.target === '#tour-brief-preview-modes'
      ? { ...s, content: `${s.content} For a client, "Agents working for …" shows what OpenI's agents did for them, and "Run Scout now" searches for more startups for their priorities.` }
      : s)),
  },
};
