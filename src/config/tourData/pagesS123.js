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
  content: 'What OpenI\'s agents did for your brief, most recent first: the analyst checking each startup against your business, last night\'s news crawl for your priorities, the strategy map. Press "Run Scout now" and Scout turns each priority into short searches, searches OpenI\'s startups and adds the ones the analyst approves to that priority\'s section, marked "Found by Scout". Below them, the Coach lists any change it made to your brief, for example showing only stronger matches for a priority where you kept passing on weaker ones. Each change is tested on your own decisions and kept only if it helps; press "Undo" to put one back.',
  placement: 'bottom',
  skipBeacon: true,
};
const askStep = {
  target: '#tour-brief-ask',
  title: 'Ask OpenI',
  content: 'Ask in your own words, for example "Who does shoppable video for quick commerce?". OpenI turns your question into short searches, searches its startups, and its analyst checks each one against your business. The answer is the startups it kept, each with the reason; shortlist any of them from here. If nothing fits yet, add the question as a priority and Scout and the nightly crawl keep looking. Your recent questions stay under "Earlier questions".',
  placement: 'bottom',
  skipBeacon: true,
};
const landscapeStep = {
  target: '#tour-brief-landscape',
  title: 'Your innovation landscape',
  content: 'OpenI\'s Innovation Maps around your own priorities: for each sector, function and use case close to what you care about, how many startups are building there. Once OpenI has enough recent data, it also shows how many are new and marks the areas that are rising. Click an area to open its map. If none of OpenI\'s maps covers one of your priorities, "Build a map for it" has OpenI\'s map builder create one for you from what you shortlist, and keep it up to date every night.',
  placement: 'bottom',
  skipBeacon: true,
};
const knowsStep = {
  target: '#tour-brief-knows',
  title: 'What OpenI knows about you',
  content: 'What your brief is built on, and where each part came from: your profile, the priorities and challenges you gave us, what OpenI\'s researcher read on your website and in recent news (every line links to its source), and what it learned from what you shortlist and pass on. Not right? Update your profile, or press "Read again".',
  placement: 'top',
  skipBeacon: true,
};
const at = brief.steps.findIndex(s => s.target === '#tour-brief-priorities') + 1;

const preview = pagesS122['/dashboard/admin/brief-preview'];

// The client's strategy map appears only once OpenI has placed the brief's startups,
// so it is described in the always-present first step rather than targeted.
const withMap = brief.steps.map(s => (s.target === '#tour-page-brief'
  ? { ...s, content: `${s.content} Once OpenI has read your startups, a strategy map shows what each would do for you (grow revenue, cut cost, or open a new market) and whether to partner with, source from or invest in it.` }
  // s123 action agents: the "Launch a challenge on this" chip sits in each priority's section (corporate only).
  : s.target === '#tour-brief-priorities'
    ? { ...s, content: `${s.content} For a company, each priority's section also offers "Launch a challenge on this": OpenI drafts a challenge from the priority, your business and what you shortlisted; you edit it and save it as a draft for free (publishing it later uses one of your monthly challenges). Each of your open challenges offers "Invite the startups you shortlisted": tick who to invite, edit the note, and each gets an email and a notification.` }
    : s));

export const pagesS123 = {
  '/dashboard/brief': { ...brief, steps: [...withMap.slice(0, at), agentsStep, askStep, landscapeStep, knowsStep, ...withMap.slice(at)] },
  '/dashboard/admin/brief-preview': {
    ...preview,
    steps: preview.steps.map(s => (s.target === '#tour-brief-preview-modes'
      ? { ...s, content: `${s.content} For a client, "Agents working for …" shows what OpenI's agents did for them, and "Run Scout now" searches for more startups for their priorities; "Run the Coach" checks their decisions now and may test one change (each with an Undo); "Ask OpenI" answers a question for them with analyst-checked startups; the innovation landscape shows the Innovation Maps around their priorities; "What OpenI knows" shows what their brief is built on. On the strategy map, "Change" under a card moves a startup to the right outcome and action; the client's own brief shows it, and OpenI learns from it.` }
      : s)),
  },
};
