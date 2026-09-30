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
});
