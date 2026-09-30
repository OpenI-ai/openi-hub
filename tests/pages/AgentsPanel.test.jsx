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
import AgentsPanel, { scoutResultText, ago } from '../../src/pages/dashboard/AgentsPanel';

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
    expect((await screen.findByTestId('agents-empty')).textContent).toMatch(/^No agent has worked on your brief yet\./);
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
});
