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

const api = vi.hoisted(() => ({ matches: vi.fn(), setSettings: vi.fn(), callEvents: vi.fn(), feedback: vi.fn() }));
vi.mock('../../src/services/api', () => ({ startupAgentAPI: api }));
const { default: Card, matchesText, applyCountOf, hiddenText, withoutMatch } = await import('../../src/components/StartupAgentCard');

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
  beforeEach(() => { api.feedback.mockReset().mockResolvedValue({ ok: true, hidden: 1 }); api.callEvents.mockReset().mockResolvedValue(null); api.matches.mockReset().mockResolvedValue(data); api.setSettings.mockReset().mockResolvedValue({ weekly_email: false, email_at: null }); });

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
    expect(screen.getByTestId('startup-agent-status').textContent).toBe('No OpenI challenge matches you right now, but 1 requirement from outside OpenI does: see below.');
  });

  // s125 Programme Scout (Rajeev: "requirements from India, corporate, Investors, Govt defence"): who asks, and the card's new name.
  it('each requirement says who asks; the card is "Requirements from corporates, government and defence"', async () => {
    api.matches.mockResolvedValue({ groups: [], total: 0, settings: { weekly_email: true }, open_calls: [
      { id: 7, title: 'DISC 14: counter-drone', org_name: 'iDEX', source_name: 'iDEX (Ministry of Defence)', url: 'https://idex.gov.in/x', publisher_type: 'defence', why: 'Matches your Drones' },
      { id: 8, title: 'Mobility Innovation Challenge', org_name: 'Hyundai', source_name: 'Hyundai Motor India', url: 'https://hyundai.example/x', publisher_type: 'corporate', why: 'Close to what you do' },
      { id: 9, title: 'Untyped call', org_name: 'X', source_name: 'X', url: 'https://x.example/x', why: 'Close' }] });
    show();
    const calls = await screen.findAllByTestId('startup-agent-call');
    expect(calls.map(c => c.querySelector('[data-testid="startup-agent-call-type"]')?.textContent || null)).toEqual(['Defence', 'Corporate', null]);
    expect(screen.getByTestId('startup-agent').textContent).toContain('Requirements from corporates, government and defence');
    expect(screen.getByTestId('startup-agent').textContent).not.toContain('Corporates looking for startups like you');
  });

  // s125 — the Programme Scout learns from startups: the requirements shown count as seen; opening one counts as a click.
  it('records the requirements shown, and a click on one, with the place (home card or brief)', async () => {
    api.matches.mockResolvedValue({ groups: [], total: 0, settings: { weekly_email: true }, open_calls: [
      { id: 7, title: 'DISC 14', source_name: 'iDEX', url: 'https://idex.gov.in/x', why: 'Close' },
      { id: 8, title: 'Mobility', source_name: 'Hyundai', url: 'https://h.example/x', why: 'Close' }] });
    render(<MemoryRouter><Card place="brief" /></MemoryRouter>);
    await screen.findAllByTestId('startup-agent-call');
    await waitFor(() => expect(api.callEvents).toHaveBeenCalledWith([7, 8], 'view', 'brief'));
    fireEvent.click(screen.getAllByTestId('startup-agent-call-apply')[1]);
    expect(api.callEvents).toHaveBeenCalledWith([8], 'click', 'brief');
  });

  it('records nothing when there are no requirements, and a failed record never breaks the card', async () => {
    show();
    await screen.findAllByTestId('startup-agent-corporate');
    expect(api.callEvents).not.toHaveBeenCalled();
    api.callEvents.mockRejectedValue(new Error('down'));
    api.matches.mockResolvedValue({ groups: [], total: 0, settings: { weekly_email: true }, open_calls: [{ id: 9, title: 'Unique call title', source_name: 'Src', url: 'https://x.example', why: 'C' }] });
    render(<MemoryRouter><Card /></MemoryRouter>);
    expect(await screen.findByText('Unique call title')).toBeTruthy();
  });

  it('no open calls: no empty section', async () => {
    show();
    await screen.findAllByTestId('startup-agent-corporate');
    expect(screen.queryByTestId('startup-agent-calls')).toBeNull();
  });

  // Rajeev (1 Oct): "0 challenges you could win" above 4 requirements — the page counts both.
  it('tells the page how many things the startup could apply to: OpenI challenges plus outside requirements', async () => {
    expect(applyCountOf({ groups: [{ challenges: [{}, {}] }, { challenges: [{}] }], open_calls: [{}, {}, {}, {}] })).toBe(7);
    expect(applyCountOf({ groups: [], open_calls: [{}, {}, {}, {}] })).toBe(4);
    expect(applyCountOf(null)).toBe(0);
    const onLoaded = vi.fn();
    api.matches.mockResolvedValue({ groups: [], total: 0, settings: { weekly_email: true }, open_calls: [{ id: 1, title: 'A', url: 'https://a.example', why: 'x' }, { id: 2, title: 'B', url: 'https://b.example', why: 'y' }] });
    render(<MemoryRouter><Card place="brief" onLoaded={onLoaded} /></MemoryRouter>);
    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(2));
  });

  // s127 — the startup agent learns: "Not for me" hides a match for good (and from the weekly email).
  it('"Not for me" on a challenge hides it at once, saves it, and says how many are hidden', async () => {
    show();
    await screen.findAllByTestId('startup-agent-corporate');
    fireEvent.click(screen.getAllByTestId('startup-agent-not-for-me')[2]);   // Bolt's only challenge
    expect(screen.getAllByTestId('startup-agent-challenge')).toHaveLength(2);
    expect(screen.getAllByTestId('startup-agent-corporate')).toHaveLength(1);   // a company with nothing left goes
    await waitFor(() => expect(api.feedback).toHaveBeenCalledWith({ kind: 'challenge', id: 21, action: 'dismiss' }));
    expect((await screen.findByTestId('startup-agent-hidden')).textContent).toContain('1 match you said "Not for me" to is hidden.');
  });

  it('"Not for me" puts the match back when the save fails', async () => {
    api.feedback.mockRejectedValue(new Error('down'));
    show();
    await screen.findAllByTestId('startup-agent-corporate');
    fireEvent.click(screen.getAllByTestId('startup-agent-not-for-me')[0]);
    await waitFor(() => expect(screen.getAllByTestId('startup-agent-challenge')).toHaveLength(3));
    expect(screen.queryByTestId('startup-agent-hidden')).toBeNull();
  });

  it('"Not for me" on an open call; "Show them again" resets and reloads', async () => {
    api.matches.mockResolvedValue({ groups: [], total: 0, settings: { weekly_email: true }, learned: { hidden: 2 }, open_calls: [
      { id: 7, title: 'DISC 14', source_name: 'iDEX', url: 'https://idex.gov.in/x', why: 'Close' },
      { id: 8, title: 'Mobility', source_name: 'Hyundai', url: 'https://h.example/x', why: 'Close' }] });
    api.feedback.mockResolvedValue({ ok: true, hidden: 3 });
    show();
    await screen.findAllByTestId('startup-agent-call');
    expect(screen.getByTestId('startup-agent-hidden').textContent).toContain('2 matches you said "Not for me" to are hidden.');
    fireEvent.click(screen.getAllByTestId('startup-agent-call-not-for-me')[0]);
    expect(screen.getAllByTestId('startup-agent-call')).toHaveLength(1);
    await waitFor(() => expect(api.feedback).toHaveBeenCalledWith({ kind: 'call', id: 7, action: 'dismiss' }));
    await waitFor(() => expect(screen.getByTestId('startup-agent-hidden').textContent).toContain('3 matches'));
    api.feedback.mockResolvedValue({ ok: true, hidden: 0 });
    api.matches.mockResolvedValue({ ...data, learned: { hidden: 0 } });
    fireEvent.click(screen.getByTestId('startup-agent-show-again'));
    await waitFor(() => expect(api.feedback).toHaveBeenCalledWith({ action: 'reset' }));
    await waitFor(() => expect(screen.queryByTestId('startup-agent-hidden')).toBeNull());
    expect(screen.getAllByTestId('startup-agent-challenge')).toHaveLength(3);
  });

  it('pure parts: hiddenText and withoutMatch', () => {
    expect(hiddenText(0)).toBe('');
    expect(hiddenText(1)).toBe('1 match you said "Not for me" to is hidden.');
    expect(hiddenText(4)).toBe('4 matches you said "Not for me" to are hidden.');
    expect(withoutMatch(data, 'challenge', 11).groups.map(g => g.challenges.map(c => c.id))).toEqual([[12], [21]]);
    expect(withoutMatch(data, 'challenge', 21).groups).toHaveLength(1);
    expect(withoutMatch({ open_calls: [{ id: 1 }, { id: 2 }] }, 'call', 1).open_calls).toEqual([{ id: 2 }]);
    expect(withoutMatch(null, 'call', 1)).toBeNull();
  });
});
