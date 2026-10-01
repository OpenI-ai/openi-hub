/**
 * @vitest-environment jsdom
 *
 * s123 (30 Sep 2026) — "Agents working for you" + "Run Scout now". The panel
 * shows what the agents did (from the API, never invented), runs Scout, says
 * what it found in plain words, and reloads the brief only when something new
 * was added. Asserted on the rendered panel.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentsPanel, { scoutResultText, ago, CoachChanges } from '../../src/pages/dashboard/AgentsPanel';

const line = (agent, text, at = new Date().toISOString()) => ({ agent, text, at, status: 'ok' });

describe('AgentsPanel', () => {
  it('lists what the agents did, most recent first as given', async () => {
    const load = vi.fn().mockResolvedValue({ items: [line('Scout', 'found 2 new startups for "GEO".'), line('Analyst', 'read 12 startups against your business this week and kept 7.')], scout: {} });
    render(<AgentsPanel load={load} scout={vi.fn()} />);
    const lines = await screen.findAllByTestId('agent-line');
    expect(lines.map(l => l.textContent)).toEqual([
      'Scout found 2 new startups for "GEO".just now',
      'Analyst read 12 startups against your business this week and kept 7.just now',
    ]);
  });

  it('says so when no agent has run yet', async () => {
    render(<AgentsPanel load={vi.fn().mockResolvedValue({ items: [], scout: {} })} scout={vi.fn()} />);
    expect((await screen.findByTestId('agents-empty')).textContent).toMatch(/^No agent has worked for you yet\./);
  });

  it('Run Scout now: shows the result and reloads the brief when it found something', async () => {
    const load = vi.fn().mockResolvedValue({ items: [], scout: {} });
    const onFound = vi.fn();
    const scout = vi.fn().mockResolvedValue({ found: 1, priorities: [{ label: 'Retail media', queries: ['retail media'], kept: [{ user_id: 9 }] }] });
    render(<AgentsPanel load={load} scout={scout} onFound={onFound} />);
    fireEvent.click(await screen.findByTestId('run-scout'));
    expect((await screen.findByTestId('scout-result')).textContent)
      .toBe('Scout found 1 new startup for "Retail media". They are in those sections now, marked "Found by Scout".');
    expect(onFound).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2)); // the panel refreshes after a run
  });

  it('a run that found nothing does not reload the brief, and names what it searched', async () => {
    const onFound = vi.fn();
    const scout = vi.fn().mockResolvedValue({ found: 0, priorities: [{ label: 'X', queries: ['quick commerce ads', 'retail media'], kept: [] }] });
    render(<AgentsPanel load={vi.fn().mockResolvedValue({ items: [], scout: {} })} scout={scout} onFound={onFound} />);
    fireEvent.click(await screen.findByTestId('run-scout'));
    expect((await screen.findByTestId('scout-result')).textContent).toMatch(/^Scout searched "quick commerce ads", "retail media": nothing new that fits yet\./);
    expect(onFound).not.toHaveBeenCalled();
  });

  it('the button rests while Scout cannot run again yet', async () => {
    const next = new Date(Date.now() + 5 * 60000).toISOString();
    render(<AgentsPanel load={vi.fn().mockResolvedValue({ items: [], scout: { next_at: next } })} scout={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('run-scout').disabled).toBe(true));
  });

  it('helpers', () => {
    expect(scoutResultText({ found: 0, priorities: [] })).toMatch(/needs at least one priority/);
    const now = Date.parse('2026-09-30T12:00:00Z');
    expect(ago('2026-09-30T10:00:00Z', now)).toBe('2h ago');
    expect(ago('2026-09-29T08:00:00Z', now)).toBe('yesterday');
  });

  // s123 — the Coach
  const change = (id, status, extra = {}) => ({ id, status, priority: 'AI creative', undoable: ['trial', 'kept'].includes(status),
    text: 'In "AI creative" you passed on 5 of the 5 weaker matches (below 38%) and kept the stronger ones, so OpenI now shows only matches of 38% or more for it.', ...extra });

  it('shows the Coach\'s changes with their status; Undo only on changes still in use', () => {
    render(<CoachChanges onUndo={vi.fn()} changes={[change(1, 'trial'), change(2, 'kept', { verdict: 'Kept: "Not relevant" went from 67% to 20%.' }),
      change(3, 'undone', { verdict: 'Put back: too few decisions.' }), change(4, 'user_undone', { verdict: 'Undone by you.' })]} />);
    const rows = screen.getAllByTestId('coach-change');
    expect(rows.map(r => r.textContent.slice(0, 8))).toEqual(['TestingI', 'KeptIn "', 'Put back', 'UndoneIn']);
    expect(rows[1].textContent).toContain('Kept: "Not relevant" went from 67% to 20%.');
    expect(screen.getAllByTestId('coach-undo')).toHaveLength(2);
  });

  it('nothing to show: no Coach block at all', () => {
    const { container } = render(<CoachChanges changes={[]} onUndo={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('Undo calls the API with the change id, reloads the brief and the panel', async () => {
    const load = vi.fn()
      .mockResolvedValueOnce({ items: [], coach: [change(7, 'trial')], scout: {} })
      .mockResolvedValue({ items: [], coach: [change(7, 'user_undone', { verdict: 'Undone by you.' })], scout: {} });
    const undo = vi.fn().mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<AgentsPanel load={load} scout={vi.fn()} undo={undo} onChanged={onChanged} />);
    fireEvent.click(await screen.findByTestId('coach-undo'));
    await waitFor(() => expect(undo).toHaveBeenCalledWith(7));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('coach-change').textContent).toContain('Undone by you.'));
    expect(screen.queryByTestId('coach-undo')).toBeNull();
  });

  it('"Run the Coach" appears only where the caller can run it (Brief Preview)', async () => {
    render(<AgentsPanel load={vi.fn().mockResolvedValue({ items: [], scout: {} })} scout={vi.fn()} />);
    await screen.findByTestId('agents-empty');
    expect(screen.queryByTestId('run-coach')).toBeNull();
  });

  // s125 Phase 4c: a Scout search the Coach ran is shown as "Searched", with no Undo.
  it('a Coach Scout search reads "Searched" and has no Undo; a stage change has one', () => {
    render(<CoachChanges onUndo={vi.fn()} changes={[
      { id: 7, kind: 'scout_search', status: 'kept', undoable: false, text: 'Scout searched again for "Drone delivery".' },
      { id: 8, kind: 'stage_avoid', status: 'trial', undoable: true, text: 'Idea-to-seed startups now come last.' },
    ]} />);
    const rows = screen.getAllByTestId('coach-change');
    expect(rows[0].textContent).toMatch(/^Searched/);
    expect(rows[0].querySelector('[data-testid="coach-undo"]')).toBeNull();
    expect(rows[1].textContent).toMatch(/^Testing/);
    expect(rows[1].querySelector('[data-testid="coach-undo"]')).not.toBeNull();
  });
});
