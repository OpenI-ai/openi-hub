/**
 * s127 (3 Oct 2026) — a persona's dashboard never links to an admin workflow.
 *
 * s117 took "Programs" (/dashboard/evaluations) and "Cohorts" (/dashboard/cohorts) out of every persona's menu:
 * scoring, approving and adding to a cohort are admin-only on the backend (personas.js explains why), so a
 * persona who opens them gets a page whose buttons answer 403. The government dashboard's stat card and two
 * quick actions still pointed there. And every link here must land on a real page (App.jsx routes).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { DASHBOARD_CONFIG } from '../../src/pages/dashboard/PersonaDashboard.jsx';

const ADMIN_ONLY = /^\/dashboard\/(evaluations|cohorts|admin)(\/|$)/;
const app = readFileSync('src/App.jsx', 'utf8');
const routes = [...app.matchAll(/path="([^"]+)"/g)].map(m => m[1]).filter(p => p !== '*')
  .map(p => (p.startsWith('/') ? p : `/dashboard/${p}`))
  .map(p => new RegExp(`^${p.replace(/:[^/]+/g, '[^/]+')}$`));

const links = Object.entries(DASHBOARD_CONFIG).flatMap(([persona, cfg]) =>
  [...(cfg.stats || []), ...(cfg.quickActions || [])].map(x => ({ persona, label: x.label, to: x.to })));

describe('persona dashboards link only to pages that persona can use (s127)', () => {
  it('has links to check', () => expect(links.length).toBeGreaterThan(20));

  it('no stat card or quick action opens an admin-only workflow', () => {
    expect(links.filter(l => ADMIN_ONLY.test(l.to)).map(l => `${l.persona}: ${l.label} -> ${l.to}`)).toEqual([]);
  });

  it('every link lands on a real page', () => {
    expect(links.filter(l => !routes.some(r => r.test(l.to.split('?')[0]))).map(l => `${l.persona}: ${l.label} -> ${l.to}`)).toEqual([]);
  });

  it('the government dashboard opens its own Innovation Agent', () => {
    expect(DASHBOARD_CONFIG.government.quickActions.map(a => a.to)).toContain('/dashboard/brief');
  });
});
