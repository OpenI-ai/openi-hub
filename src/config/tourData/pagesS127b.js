/**
 * s127b (3 Oct 2026) — landing page rethink (Rajeev approved the 9-section plan; headline kept, new subline). The
 * public landing tour walks the new order: the headline, "Pick your role", how the agents work, you stay in charge.
 * Every target is always rendered (no step waits on data). New module so the six split modules and the earlier
 * S12x modules stay verbatim; it replaces the '/' and '/landing' entries of pagesS125b.
 */
import { pagesAdminPublic } from './pagesAdminPublic.js';

const WELCOME = { target: '#tour-page-landing', title: 'Your innovation team that works while you sleep',
  content: 'An Innovation Agent for every role: it finds what matters to you every night, checks each match against your business, and learns from every click. Every suggestion shows its evidence, and nothing happens without your OK. Free to start.',
  placement: 'bottom', skipBeacon: true };
const ROLES = { target: '#tour-landing-roles', title: 'Pick your role',
  content: 'Companies, government, investors, incubators and accelerators, universities and labs, mentors and service providers, students and startups: pick yours to see what your agent does, and join with that role in one click.',
  placement: 'bottom', skipBeacon: true };
const AGENTS = { target: '#tour-landing-agents', title: 'How your agents work',
  content: 'Scout searches, the Analyst checks, your agent ranks, Next moves suggests, and Daily alerts tells you what is new. Below the steps: how it learns from what you do.',
  placement: 'top', skipBeacon: true };
const TRUST = { target: '#tour-landing-trust', title: 'You stay in charge',
  content: 'Suggest only by default, a "Why?" behind every suggestion, Undo, your activity never named to others, alerts you can switch off, and ISO 27001.',
  placement: 'top', skipBeacon: true };
const landing = key => ({ ...pagesAdminPublic[key], steps: [WELCOME, ROLES, AGENTS, TRUST] });

export const pagesS127b = {
  '/': landing('/'),
  '/landing': landing('/landing'),
};
