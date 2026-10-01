/**
 * @vitest-environment jsdom
 *
 * s125 (1 Oct 2026) — Rajeev: "yes, add the Run now button". The Programme Scout panel on Agent Runs:
 * "Run now" starts the agent (and says so), and the pages it reads show who asks, how each was added,
 * and what it returned last time.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const scout = vi.hoisted(() => ({ run: vi.fn(), sources: vi.fn() }));
vi.mock('../../src/services/api', () => ({ programmeScoutAPI: scout, agentRunsAPI: { list: vi.fn(), get: vi.fn() } }));
const { ProgrammeScoutPanel } = await import('../../src/pages/dashboard/AdminAgentRuns');

const sources = [
  { key: 'idex', name: 'iDEX (Ministry of Defence)', url: 'https://idex.gov.in/challenges', publisher_type: 'defence', role: 'source', origin: 'seed', status: 'active', last_status: 'ok', last_found: 3, last_run_at: '2026-10-01T18:52:00Z', views_30d: 12, clicks_30d: 4 },
  { key: 'birac', name: 'BIRAC (DBT)', url: 'https://birac.nic.in/cfp.php', publisher_type: 'government', role: 'source', origin: 'seed', status: 'active', last_status: 'http_403', last_found: 0 },
  { key: 'found-1', name: 'Mobility Motors', url: 'https://m.example/c', publisher_type: 'corporate', role: 'source', origin: 'discovered', status: 'active', last_status: null, last_found: 0 },
  { key: 'sgi', name: 'startupgrantsindia.com (competitions)', url: 'https://www.startupgrantsindia.com/competitions', publisher_type: 'government', role: 'discovery', origin: 'seed', status: 'active' },
];

describe('ProgrammeScoutPanel', () => {
  beforeEach(() => {
    scout.sources.mockReset().mockResolvedValue({ sources });
    scout.run.mockReset().mockResolvedValue({ started: true, message: 'The Programme Scout is running. Its run appears in Agent Runs when it finishes.' });
  });

  it('"Run now" starts the agent, says so, and asks the run list to refresh', async () => {
    const onStarted = vi.fn();
    render(<ProgrammeScoutPanel onStarted={onStarted} />);
    fireEvent.click(await screen.findByTestId('programme-scout-run'));
    await waitFor(() => expect(scout.run).toHaveBeenCalledTimes(1));
    expect((await screen.findByTestId('programme-scout-note')).textContent).toMatch(/The Programme Scout is running/);
    expect(onStarted).toHaveBeenCalled();
  });

  it('counts the pages it reads (not the listing sites), and lists each with who asks, how added and its last result', async () => {
    render(<ProgrammeScoutPanel />);
    await waitFor(() => expect(screen.getByTestId('programme-scout').textContent).toMatch(/It reads 3 pages \(1 found by itself\); 1 did not answer last time\./));
    fireEvent.click(screen.getByTestId('programme-scout-toggle'));
    const rows = [...screen.getByTestId('programme-scout-sources').querySelectorAll('tbody tr')].map(r => r.textContent);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatch(/iDEX.*Defence.*Added by OpenI.*3 open.*12 seen · 4 opened/);
    expect(rows[1]).toMatch(/0 seen · 0 opened/);
    expect(rows[1]).toMatch(/BIRAC.*Government.*http_403/);
    expect(rows[2]).toMatch(/Mobility Motors.*Corporate.*Found by the agent.*not read yet/);
  });

  it('a failed start says why', async () => {
    scout.run.mockRejectedValue(new Error('Forbidden'));
    render(<ProgrammeScoutPanel />);
    fireEvent.click(await screen.findByTestId('programme-scout-run'));
    expect((await screen.findByTestId('programme-scout-note')).textContent).toBe('Forbidden');
  });
});
