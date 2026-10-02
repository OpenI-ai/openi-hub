/**
 * @vitest-environment jsdom
 *
 * s126 (2 Oct 2026) — Agent Runs "Results per client": one row per client with time to the first useful startup,
 * suggestions accepted, good fit, the funnel, the last 30 days against the target (3 intros + 1 meeting), and the
 * time-saved estimate with its formula. Demo accounts can be hidden. Asserted on the rendered panel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const api = vi.hoisted(() => ({ measures: vi.fn(), list: vi.fn(), get: vi.fn() }));
vi.mock('../../src/services/api', () => ({ agentRunsAPI: api, programmeScoutAPI: { sources: vi.fn().mockResolvedValue({ sources: [] }), run: vi.fn() } }));
const { ClientMeasuresPanel, minutesText, targetMet } = await import('../../src/pages/dashboard/AdminAgentRuns');

const client = (over = {}) => ({
  id: 1, company: 'Dentsu', role: 'corporate', demo: false, first_useful_min: 7,
  proposals: { done: 2, dismissed: 1, open: 1, failed: 0, accepted_pct: 67 },
  good_fit: { pct: 80, good: 8, labeled: 10 },
  funnel: { shortlisted: 4, intro: 3, meeting: 2, pilot: 1, last30: { intros: 3, meetings: 1, pilots: 0 } },
  minutes_saved: 145, ...over,
});
const formula = { minutes_per_find: 30, minutes_per_action: { request_intro: 10 } };

describe('Results per client', () => {
  beforeEach(() => {
    api.measures.mockReset().mockResolvedValue({ clients: [client(), client({ id: 2, company: 'Demo Corp', demo: true, first_useful_min: null,
      proposals: { done: 0, dismissed: 0, open: 0, failed: 0, accepted_pct: null }, good_fit: null,
      funnel: { shortlisted: 0, intro: 0, meeting: 0, pilot: 0, last30: { intros: 0, meetings: 0, pilots: 0 } }, minutes_saved: 0 })], formula });
  });

  it('a row per client with every measure, and the formula under the table', async () => {
    render(<ClientMeasuresPanel />);
    const rows = await screen.findAllByTestId('client-measures-row');
    expect(rows).toHaveLength(2);
    const t = rows[0].textContent;
    for (const s of ['Dentsu', '7 min', '67%', '2 done · 1 dismissed · 1 open', '80%', '8 of 10 labelled', '3 intros · 1 meeting', 'Target met', '2 h']) expect(t).toContain(s);
    expect(screen.getAllByTestId('client-measures-funnel')[0].textContent).toBe('4 → 3 → 2 → 1');
    expect(rows[1].textContent).toContain('demo');
    expect(rows[1].textContent).not.toContain('Target met');
    expect(screen.getByTestId('client-measures-formula').textContent).toContain('30 min for each startup the agent found that the client kept, plus 10 min per request intro');
  });

  it('"Show demo accounts" off hides them', async () => {
    render(<ClientMeasuresPanel />);
    await screen.findAllByTestId('client-measures-row');
    fireEvent.click(screen.getByTestId('client-measures-demo'));
    expect(screen.getAllByTestId('client-measures-row')).toHaveLength(1);
  });

  it('no client yet: says so', async () => {
    api.measures.mockResolvedValue({ clients: [], formula });
    render(<ClientMeasuresPanel />);
    expect((await screen.findByTestId('client-measures-empty')).textContent).toContain('No client has used the Innovation Agent yet.');
  });

  it('minutesText / targetMet', () => {
    expect(minutesText(null)).toBe('—');
    expect(minutesText(9)).toBe('9 min');
    expect(minutesText(180)).toBe('3 h');
    expect(minutesText(4 * 1440)).toBe('4 days');
    expect(targetMet({ intros: 3, meetings: 1 })).toBe(true);
    expect(targetMet({ intros: 3, meetings: 0 })).toBe(false);
    expect(targetMet(null)).toBe(false);
  });
});
