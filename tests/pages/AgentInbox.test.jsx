/**
 * @vitest-environment jsdom
 *
 * s123 (30 Sep 2026) — the Innovation Agent's inbox on a company's brief
 * (Phase 1). It lists the agent's next moves as the API gives them, each with
 * why and what it costs; each button does what the brief already does
 * (shortlist, the Launch / Invite sheets, add a priority); "Not now" removes
 * one at once; "Run my agent now" starts a run; the status line says when the
 * agent last ran and why. Asserted on the rendered inbox.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentInbox, { agentStatusText } from '../../src/pages/dashboard/AgentInbox';

const offer = { key: 'launch_challenge', subject: 'interest:retail-media', label: 'Retail media' };
const items = [
  { id: 'shortlist:7', kind: 'shortlist', startup_user_id: 7, name: 'Shelfco', priority: 'Retail media', title: 'Shortlist Shelfco', why: 'For "Retail media": sells shelf ads.', cost: 'Free.' },
  { id: 'launch:interest:retail-media', kind: 'launch', offer, title: 'Launch a challenge on "Retail media"', why: 'Let startups come to you.', cost: 'Uses one monthly challenge.' },
  { id: 'priority:shoppable-video', kind: 'priority', label: 'Shoppable video', title: 'Add "Shoppable video" to your priorities', why: 'You buy video ads.', cost: 'Free.' },
];
const agent = { ran_at: new Date().toISOString(), trigger: 'weekly', running: false, autonomy: 'suggest', next_manual_at: null };
const props = (over = {}) => ({
  load: vi.fn().mockResolvedValue({ items, agent }), snooze: vi.fn().mockResolvedValue({ ok: true }), run: vi.fn().mockResolvedValue({ status: 'started' }),
  onShortlist: vi.fn().mockResolvedValue(), onLaunch: vi.fn(), onInvite: vi.fn(), onAddPriority: vi.fn().mockResolvedValue(true), ...over,
});

describe('AgentInbox', () => {
  it('lists the next moves with why and cost, and says it only suggests', async () => {
    render(<AgentInbox {...props()} />);
    const rows = await screen.findAllByTestId('inbox-item');
    expect(rows.map(r => r.getAttribute('data-kind'))).toEqual(['shortlist', 'launch', 'priority']);
    expect(rows[0].textContent).toContain('Shortlist Shelfco');
    expect(rows[0].textContent).toContain('For "Retail media": sells shelf ads.');
    expect(screen.getByText('Suggest only')).toBeTruthy();
    expect(screen.getByTestId('agent-status').textContent).toMatch(/Last run just now \(weekly check\)\./);
  });

  it('each button does what the brief does: shortlist, open the Launch sheet, add the priority', async () => {
    const p = props();
    render(<AgentInbox {...p} />);
    const acts = await screen.findAllByTestId('inbox-act');
    expect(acts.map(a => a.textContent)).toEqual(['Shortlist', 'Review the challenge', 'Add priority']);
    fireEvent.click(acts[0]);
    await waitFor(() => expect(p.onShortlist).toHaveBeenCalledWith({ user_id: 7, name: 'Shelfco', shortlisted: false, priority_label: 'Retail media' }));
    fireEvent.click(acts[1]);
    expect(p.onLaunch).toHaveBeenCalledWith(offer);
    fireEvent.click(acts[2]);
    await waitFor(() => expect(p.onAddPriority).toHaveBeenCalledWith({ label: 'Shoppable video' }));
    await waitFor(() => expect(p.load.mock.calls.length).toBeGreaterThanOrEqual(3)); // the list refreshes after an action
  });

  it('"Not now" removes the item at once and tells the server', async () => {
    const p = props({ load: vi.fn().mockResolvedValueOnce({ items, agent }).mockResolvedValue({ items: items.slice(1), agent }) });
    render(<AgentInbox {...p} />);
    fireEvent.click((await screen.findAllByTestId('inbox-snooze'))[0]);
    await waitFor(() => expect(screen.getAllByTestId('inbox-item')).toHaveLength(2));
    expect(p.snooze).toHaveBeenCalledWith('shortlist:7');
  });

  it('empty: says nothing needs you; "Run my agent now" starts a run', async () => {
    const p = props({ load: vi.fn().mockResolvedValue({ items: [], agent: { ...agent, ran_at: null } }) });
    render(<AgentInbox {...p} />);
    expect((await screen.findByTestId('inbox-empty')).textContent).toMatch(/^Nothing needs you right now\./);
    fireEvent.click(screen.getByTestId('agent-run'));
    await waitFor(() => expect(p.run).toHaveBeenCalledTimes(1));
  });

  it('the status line: running, never run, cooling down', () => {
    expect(agentStatusText({ running: true })).toMatch(/^Your agent is working now/);
    expect(agentStatusText({ ran_at: null })).toBe('Your agent runs every Monday and whenever you change your priorities.');
    expect(agentStatusText({ ran_at: new Date().toISOString(), trigger: 'priorities' })).toMatch(/\(after you changed your priorities\)/);
  });

  it('Weekly email: shows On by default and turns it off', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ settings: { weekly_email: false } });
    render(<AgentInbox {...props({ saveSettings })} />);
    expect((await screen.findByTestId('agent-email-state')).textContent).toBe('On');
    fireEvent.click(screen.getByTestId('agent-email-toggle'));
    await waitFor(() => expect(screen.getByTestId('agent-email-state').textContent).toBe('Off'));
    expect(saveSettings).toHaveBeenCalledWith({ weekly_email: false });
  });

  // s125 Phase 4: autonomy, evidence, "Done for you".
  it('"Why?" opens the evidence: text, OpenI links in the app, outside links in a new tab', async () => {
    const ev = [{ text: 'Analyst: sells shelf ads.' }, { text: 'Shelfco on OpenI', url: '/dashboard/startups/7?by=user_id' }, { text: 'Their website', url: 'https://shelf.example' }];
    const withEv = [{ ...items[0], evidence: ev }, items[1]];
    const { MemoryRouter } = await import('react-router-dom');
    render(<MemoryRouter><AgentInbox {...props({ load: vi.fn().mockResolvedValue({ items: withEv, agent }) })} /></MemoryRouter>);
    const toggles = await screen.findAllByTestId('inbox-evidence-toggle');
    expect(toggles).toHaveLength(1); // only the move that has evidence
    expect(screen.queryByTestId('inbox-evidence')).toBeNull();
    fireEvent.click(toggles[0]);
    const links = screen.getByTestId('inbox-evidence').querySelectorAll('a');
    expect(screen.getByTestId('inbox-evidence').textContent).toContain('Analyst: sells shelf ads.');
    expect(links[0].getAttribute('href')).toBe('/dashboard/startups/7?by=user_id');
    expect(links[0].getAttribute('target')).toBeNull();
    expect(links[1].getAttribute('href')).toBe('https://shelf.example');
    expect(links[1].getAttribute('target')).toBe('_blank');
    expect(links[1].getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('autonomy switch is easy to see (s126, Rajeev: "too light to notice"): chosen = filled navy with a tick, the other dark text', async () => {
    render(<AgentInbox {...props({ saveSettings: vi.fn() })} />);
    const on = await screen.findByTestId('agent-autonomy-suggest');
    const off = screen.getByTestId('agent-autonomy-auto');
    expect(on.textContent).toBe('✓ Suggest only');
    expect(on.style.background).toBe('rgb(11, 30, 63)');
    expect(on.style.color).toBe('rgb(255, 255, 255)');
    expect(off.textContent).toBe('Auto: free steps');
    expect(off.style.color).toBe('rgb(51, 51, 51)');   // not the old #888 grey
  });

  it('autonomy: Suggest only by default; Auto asks first (cancel = nothing saved), then saves; back to Suggest is immediate', async () => {
    const saveSettings = vi.fn()
      .mockResolvedValueOnce({ settings: { weekly_email: true, autonomy: 'auto' } })
      .mockResolvedValueOnce({ settings: { weekly_email: true, autonomy: 'suggest' } });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<AgentInbox {...props({ saveSettings })} />);
    expect((await screen.findByTestId('agent-autonomy')).getAttribute('data-value')).toBe('suggest');
    fireEvent.click(screen.getByTestId('agent-autonomy-auto'));
    expect(confirm.mock.calls[0][0]).toMatch(/never launches a challenge, invites, writes intros, books meetings, adds priorities or spends credits/);
    expect(saveSettings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('agent-autonomy-auto'));
    await waitFor(() => expect(screen.getByTestId('agent-autonomy').getAttribute('data-value')).toBe('auto'));
    expect(saveSettings).toHaveBeenLastCalledWith({ autonomy: 'auto' });
    fireEvent.click(screen.getByTestId('agent-autonomy-suggest'));
    await waitFor(() => expect(screen.getByTestId('agent-autonomy').getAttribute('data-value')).toBe('suggest'));
    expect(confirm).toHaveBeenCalledTimes(2);
    confirm.mockRestore();
  });

  it('"Done for you": Undo un-shortlists through the brief; an undone one says so; Review opens the drafted challenge', async () => {
    const done = [
      { kind: 'shortlist', startup_user_id: 7, name: 'Shelfco', priority: 'Retail media', watchlist: 'Innovation Brief — Retail media', undone: false },
      { kind: 'shortlist', startup_user_id: 8, name: 'Gone', priority: 'Retail media', undone: true },
      { kind: 'draft', subject: 'interest:retail-media', label: 'Retail media' },
    ];
    const launchItem = { ...items[1], subject: offer.subject, drafted: true };  // the API sends subject on launch items
    const p = props({ load: vi.fn().mockResolvedValue({ items: [launchItem], agent: { ...agent, autonomy: 'auto', done_for_you: done } }) });
    render(<AgentInbox {...p} />);
    const rows = await screen.findAllByTestId('agent-done-item');
    expect(rows.map(r => r.getAttribute('data-kind'))).toEqual(['shortlist', 'shortlist', 'draft']);
    expect(rows[0].textContent).toContain('Shortlisted Shelfco for "Retail media", added to Innovation Brief — Retail media');
    expect(rows[1].textContent).toContain('Undone');
    expect(screen.getByTestId('inbox-act').textContent).toBe('Review the draft');
    fireEvent.click(screen.getAllByTestId('agent-done-undo')[0]);
    await waitFor(() => expect(p.onShortlist).toHaveBeenCalledWith({ user_id: 7, name: 'Shelfco', shortlisted: true, priority_label: 'Retail media' }));
    fireEvent.click(screen.getByTestId('agent-done-review'));
    expect(p.onLaunch).toHaveBeenCalledWith(offer);
  });

  // s125 Phase 4d: investors — "Add to deal pipeline".
  it('a deal move: "Add to deal pipeline" hands the offer to the brief', async () => {
    const dealOffer = { key: 'add_to_deals', subject: 'startup:7', label: 'Shelfco' };
    const onDeal = vi.fn().mockResolvedValue();
    const deal = { id: 'deal:7', kind: 'deal', startup_user_id: 7, name: 'Shelfco', offer: dealOffer, title: 'Add Shelfco to your deal pipeline', why: 'You shortlisted it.', cost: 'Free.' };
    render(<AgentInbox {...props({ onDeal, load: vi.fn().mockResolvedValue({ items: [deal], agent }) })} />);
    const act = await screen.findByTestId('inbox-act');
    expect(act.textContent).toBe('Add to deal pipeline');
    fireEvent.click(act);
    await waitFor(() => expect(onDeal).toHaveBeenCalledWith(dealOffer));
  });
});
