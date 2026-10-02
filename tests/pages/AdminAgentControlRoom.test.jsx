/**
 * @vitest-environment jsdom
 *
 * s126 (2 Oct 2026) — Agent Runs "Your agents", the control room (Rajeev: "End to End agentic platform managed using
 * graphs" … "a self learning agent continuously improving"). One card per graph with its health, week and quality
 * trend; Pause asks once more before pausing (Resume does not); Run now only for nightly jobs; See runs filters.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const api = vi.hoisted(() => ({ graphs: vi.fn(), pause: vi.fn(), runNow: vi.fn(), measures: vi.fn(), list: vi.fn(), get: vi.fn() }));
vi.mock('../../src/services/api', () => ({ agentRunsAPI: api, programmeScoutAPI: { sources: vi.fn().mockResolvedValue({ sources: [] }), run: vi.fn() } }));
const { AgentControlRoom, trendText, healthOf } = await import('../../src/pages/dashboard/AdminAgentRuns');

const g = (over = {}) => ({ name: 'client_scout', label: 'Scout', who: 'Corporate, Investor', what: 'Finds new startups.', when: 'Inside the Innovation Agent',
  learns: 'Shortlists teach it.', can_run_now: false, paused: false, runs_7d: 12, ok_pct: 92, clients_7d: 3, cost_7d: 0.42, last_status: 'ok', last_error: null,
  daily: [0, 1, 2, 0, 0, 3, 1, 0, 0, 1, 2, 1, 0, 1], quality: { label: 'Clients said yes', now: 62, before: 55, n: 21 }, ...over });
const data = { totals: { graphs: 3, runs_7d: 14, cost_7d: 0.5, paused: 1, failing: 1 }, graphs: [
  g(),
  g({ name: 'coach', label: 'Coach', can_run_now: true, quality: null, runs_7d: 2, clients_7d: 1 }),
  g({ name: 'map_builder', label: 'Map builder', paused: true, can_run_now: true, quality: null, last_status: 'error', last_error: 'timed out' }),
] };

describe('agent control room', () => {
  beforeEach(() => {
    api.graphs.mockReset().mockResolvedValue(data);
    api.pause.mockReset().mockResolvedValue({});
    api.runNow.mockReset().mockResolvedValue({ status: 'started', message: 'Started. Its run will appear below in a minute or two.' });
  });

  it('trendText and healthOf', () => {
    expect(trendText({ label: 'Clients said yes', now: 62, before: 55, n: 21 })).toBe('Clients said yes: 62% · up 7 points on last week');
    expect(trendText({ label: 'Placements kept', now: 80, before: 90, n: 5 })).toBe('Placements kept: 80% · down 10 points on last week');
    expect(trendText({ label: 'X', now: 50, before: 50, n: 2 })).toBe('X: 50% · same as last week');
    expect(trendText({ label: 'X', now: 50, before: null, n: 2 })).toBe('X: 50% (no data last week)');
    expect(trendText({ label: 'X', now: null, before: null, n: 0 })).toBe('No client decisions this week yet');
    expect(trendText(null)).toBeNull();
    expect(healthOf({ paused: true, last_status: 'error' }).label).toBe('Paused');
    expect(healthOf({ last_status: null }).label).toBe('No runs yet');
    expect(healthOf({ last_status: 'step_limit' }).label).toBe('Last run failed');
    expect(healthOf({ last_status: 'ok' }).label).toBe('Healthy');
  });

  it('one card per agent with health, week and the quality trend; totals on top', async () => {
    render(<AgentControlRoom />);
    const cards = await screen.findAllByTestId('agent-card');
    expect(cards).toHaveLength(3);
    expect(screen.getByTestId('agent-control-totals').textContent).toBe('3 agents · 14 runs this week · $0.500 model cost · 1 paused · 1 failing on the last run');
    const scout = within(cards[0]);
    expect(scout.getByTestId('agent-health').textContent).toBe('Healthy');
    expect(scout.getByTestId('agent-week').textContent).toBe('12 runs · 92% OK · 3 clients · $0.420');
    expect(scout.getByTestId('agent-quality').textContent).toBe('Clients said yes: 62% · up 7 points on last week');
    expect(scout.queryByTestId('agent-run-now')).toBeNull();
    const maps = within(cards[2]);
    expect(maps.getByTestId('agent-health').textContent).toBe('Paused');
    expect(maps.getByText('Last error: timed out')).toBeTruthy();
    expect(maps.queryByTestId('agent-run-now')).toBeNull();          // paused: no Run now
    expect(within(cards[1]).getByTestId('agent-week').textContent).toBe('2 runs · 92% OK · 1 client · $0.420');
  });

  it('Pause asks once more; Resume does not; Run now says it started', async () => {
    render(<AgentControlRoom />);
    const cards = await screen.findAllByTestId('agent-card');
    fireEvent.click(within(cards[1]).getByTestId('agent-pause'));
    expect(api.pause).not.toHaveBeenCalled();
    expect(within(cards[1]).getByTestId('agent-pause').textContent.trim()).toBe('Confirm pause');
    fireEvent.click(within(cards[1]).getByTestId('agent-pause'));
    await waitFor(() => expect(api.pause).toHaveBeenCalledWith('coach', true));
    fireEvent.click(within(cards[2]).getByTestId('agent-pause'));
    await waitFor(() => expect(api.pause).toHaveBeenCalledWith('map_builder', false));
    fireEvent.click(within(cards[1]).getByTestId('agent-run-now'));
    await waitFor(() => expect(within(cards[1]).getByTestId('agent-note').textContent).toBe('Started. Its run will appear below in a minute or two.'));
  });

  it('See runs hands the agent to the run list', async () => {
    const onSeeRuns = vi.fn();
    render(<AgentControlRoom onSeeRuns={onSeeRuns} />);
    const cards = await screen.findAllByTestId('agent-card');
    fireEvent.click(within(cards[0]).getByRole('button', { name: /See runs/ }));
    expect(onSeeRuns).toHaveBeenCalledWith('client_scout');
  });
});
