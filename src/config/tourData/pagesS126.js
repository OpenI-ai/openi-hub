/**
 * s126 (2 Oct 2026) — Sector re-check: "Approve in bulk". The SaaS/Enterprise pass left ~14,000 medium/low proposals;
 * Rajeev said yes to approving all of one confidence for one target sector at once, with an Undo per bulk.
 * Adds one step pointing at the bulk panel (always rendered once the page loads), after the status step.
 * Derived from pagesS125b so the six split modules and the earlier S12x modules stay verbatim.
 */
import { pagesS125b } from './pagesS125b.js';

const sector = pagesS125b['/dashboard/admin/sector-recheck'];
const BULK = {
  target: '#tour-sector-recheck-bulk',
  title: 'Approve in bulk',
  content: 'Too many to click through? Spot-check a few medium-confidence proposals in the list first, then press "Approve all N medium → sector" to approve every one moving to that sector at once. Each is audited and never changes a profile someone edited. "Recent bulk approvals" lists each bulk with an Undo that puts the whole bulk back for review.',
  placement: 'top',
  skipBeacon: true,
};
const at = sector.steps.findIndex(s => s.target === '#tour-sector-recheck-status');

export const pagesS126 = {
  '/dashboard/admin/sector-recheck': {
    ...sector,
    steps: [...sector.steps.slice(0, at + 1), BULK, ...sector.steps.slice(at + 1)],
  },
};
