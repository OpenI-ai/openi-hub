/**
 * @vitest-environment jsdom
 *
 * s125 (1 Oct 2026) — Innovation Agent Phase 4d, the startup half: "Corporates looking for
 * startups like you" on a startup's home page. Open public challenges that match, grouped by
 * corporate, each with why and a link; a weekly-email switch. Asserted on the rendered card.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ matches: vi.fn(), setSettings: vi.fn() }));
vi.mock('../../src/services/api', () => ({ startupAgentAPI: api }));
const { default: Card, matchesText } = await import('../../src/components/StartupAgentCard');

const data = {
  total: 3, settings: { weekly_email: true, email_at: null },
  groups: [
    { corporate_id: 1, company_name: 'Acme Foods', logo_url: null, challenges: [
      { id: 11, title: 'Keep milk cold', why: 'Matches your IoT', url: '/dashboard/marketplace/11', deadline: '2026-12-01' },
      { id: 12, title: 'Cut spoilage', why: 'Close to what you do (61% match)', url: '/dashboard/marketplace/12' }] },
    { corporate_id: 2, company_name: 'Bolt Logistics', logo_url: null, challenges: [
      { id: 21, title: 'Route trucks', why: 'Matches your Logistics', url: '/dashboard/marketplace/21', budget_range: '₹10-20L' }] },
  ],
};
const show = () => render(<MemoryRouter><Card /></MemoryRouter>);

describe('StartupAgentCard', () => {
  beforeEach(() => { api.matches.mockReset().mockResolvedValue(data); api.setSettings.mockReset().mockResolvedValue({ weekly_email: false, email_at: null }); });

  it('groups by corporate; each challenge says why and links to its page', async () => {
    show();
    const corps = await screen.findAllByTestId('startup-agent-corporate');
    expect(corps.map(c => c.textContent.split('Keep')[0].split('Route')[0])).toEqual(['Acme Foods', 'Bolt Logistics']);
    const items = screen.getAllByTestId('startup-agent-challenge');
    expect(items).toHaveLength(3);
    expect(items[0].querySelector('a').getAttribute('href')).toBe('/dashboard/marketplace/11');
    expect(items[0].textContent).toContain('Matches your IoT');
    expect(items[2].textContent).toContain('₹10-20L');
    expect(screen.getByTestId('startup-agent-status').textContent).toBe('3 open challenges from 2 companies match what you do. Only public challenges, open now, are used.');
  });

  it('the weekly-email switch saves', async () => {
    show();
    const box = await screen.findByTestId('startup-agent-email');
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    await waitFor(() => expect(api.setSettings).toHaveBeenCalledWith({ weekly_email: false }));
    await waitFor(() => expect(screen.getByTestId('startup-agent-email').checked).toBe(false));
  });

  it('the switch answers the click at once, and goes back when the save fails', async () => {
    let fail;
    api.setSettings.mockImplementation(() => new Promise((_, rej) => { fail = rej; }));
    show();
    const box = await screen.findByTestId('startup-agent-email');
    fireEvent.click(box);
    expect(screen.getByTestId('startup-agent-email').checked).toBe(false);
    fail(new Error('down'));
    await waitFor(() => expect(screen.getByTestId('startup-agent-email').checked).toBe(true));
  });

  it('empty states: nothing matching, a thin profile, an error', async () => {
    expect(matchesText({ groups: [] })).toBe('No open public challenge matches you right now. New ones are checked every week.');
    expect(matchesText({ groups: [], reason: 'thin_profile' })).toMatch(/^Add your sector, technologies/);
    expect(matchesText({ groups: [{ challenges: [{}] }] })).toBe('1 open challenge from 1 company matches what you do. Only public challenges, open now, are used.');
    api.matches.mockRejectedValue(new Error('x'));
    show();
    expect((await screen.findByText('Could not load your matches just now.'))).toBeTruthy();
    expect(screen.getByTestId('startup-agent')).toBeTruthy();   // still rendered: the tour step points at it
  });

  // s125 — open calls from OUTSIDE OpenI (crawled daily from government programmes, missions, incubators).
  it('open calls: their own section, each linking out to the publisher in a new tab; the status line points to them when no challenge fits', async () => {
    api.matches.mockResolvedValue({ groups: [], total: 0, settings: { weekly_email: true }, open_calls: [
      { id: 5, title: 'Grand Challenges India: diagnostics', org_name: 'BIRAC', source_name: 'BIRAC (DBT)', url: 'https://birac.nic.in/cfp_view.php?id=27',
        deadline: '2026-12-01', summary: 'Grants for low-cost screening.', why: 'Matches your Biotech', external: true }] });
    show();
    const calls = await screen.findAllByTestId('startup-agent-call');
    expect(calls).toHaveLength(1);
    const a = calls[0].querySelector('a');
    expect(a.getAttribute('href')).toBe('https://birac.nic.in/cfp_view.php?id=27');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(calls[0].textContent).toContain('Matches your Biotech');
    expect(screen.getByTestId('startup-agent-call-apply').textContent).toContain('Apply on BIRAC (DBT)');
    expect(screen.getByTestId('startup-agent-status').textContent).toBe('No OpenI challenge matches you right now, but 1 open call from outside OpenI does: see below.');
  });

  it('no open calls: no empty section', async () => {
    show();
    await screen.findAllByTestId('startup-agent-corporate');
    expect(screen.queryByTestId('startup-agent-calls')).toBeNull();
  });
});
