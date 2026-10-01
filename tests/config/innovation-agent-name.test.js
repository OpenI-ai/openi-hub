/**
 * s125b (1 Oct 2026) — Rajeev: "why are we calling this your Innovation Brief? How about your Innovation Agent?"
 * … "i guess it should be same for all personas?". Every persona's menu and the page's tour say "Innovation Agent";
 * the PDF the agent writes keeps the name "Innovation Brief".
 */
import { describe, it, expect } from 'vitest';
import { PERSONA_NAV, ALL_PERSONA_ROLES } from '../../src/config/personas';
import { PAGE_TOURS } from '../../src/config/tourData/index.js';

describe('Innovation Agent name', () => {
  it('every persona\'s menu says "Innovation Agent" for /dashboard/brief, none says "Innovation Brief"', () => {
    for (const role of ALL_PERSONA_ROLES) {
      const items = PERSONA_NAV[role].groups.flatMap(g => g.items);
      const brief = items.filter(i => i.to === '/dashboard/brief');
      expect(brief.map(i => i.label), role).toEqual(['Innovation Agent']);
      expect(items.some(i => i.label === 'Innovation Brief'), role).toBe(false);
    }
  });

  it('the tour is named after the agent; the PDF it writes keeps "Innovation Brief"', () => {
    const t = PAGE_TOURS['/dashboard/brief'];
    expect(t.title).toBe('Innovation Agent');
    const first = t.steps[0];
    expect(first.target).toBe('#tour-page-brief');
    expect(first.title).toBe('Your Innovation Agent');
    expect(first.content).toContain('Your Innovation Agent works for you');
    expect(first.content).toContain('"Download PDF" (top right) saves what it found as your Innovation Brief');
    expect(t.steps.map(s => s.title)).not.toContain('Your Innovation Brief');
  });

  it('the Sector re-check tour tells the faster pace (20,000 a press, every 2 hours)', () => {
    const first = PAGE_TOURS['/dashboard/admin/sector-recheck'].steps.find(s => s.target === '#tour-page-admin-sector-recheck');
    expect(first.content).toContain('reads up to 20,000');
    expect(first.content).toContain('every 2 hours');
    expect(first.content).not.toContain('4,000');
  });

  it('the stats step speaks of the agent, not the brief (Rajeev: "yes, change it")', () => {
    const stats = PAGE_TOURS['/dashboard/brief'].steps.find(s => s.target === '#tour-brief-stats');
    expect(stats.content).toContain('How many matches your agent found');
    expect(stats.content).not.toContain('this brief holds');
  });
});
