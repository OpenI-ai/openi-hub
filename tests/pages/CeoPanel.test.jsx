/**
 * @vitest-environment jsdom
 *
 * s124 (30 Sep 2026) — the CEO view on a company's brief (Innovation Agent
 * Phase 3): competitors (the agent's marked "suggested"), each one's startup
 * deals with the source, "On OpenI" links, where to venture next with startups
 * to acquire ("Shortlist" puts one in the pipeline), Refresh (off while it
 * cools down), and the board pack download. Asserted on the rendered panel.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CeoPanel, { ceoStatusText } from '../../src/pages/dashboard/CeoPanel';

const view = {
  competitors: [{ name: 'Rivalco', source: 'you' }, { name: 'Othercorp', source: 'agent' }],
  ecosystem: [
    { competitor: 'Rivalco', kind: 'acquired', startup: 'Shelfsense', headline: 'Rivalco acquires Shelfsense', url: 'https://news.example/1', date: '2026-09-10T00:00:00Z', on_openi: { user_id: 7 } },
    { competitor: 'Rivalco', kind: 'partnered', startup: 'Qwik Labs', headline: 'Rivalco partners with Qwik Labs', url: 'https://news.example/2', date: null, on_openi: null },
  ],
  adjacent: [
    { industry: 'Retail media', why: 'Both competitors are buying here.', startups: [{ user_id: 9, name: 'Freshads', size: 'Seed · 6 people', reason: 'Sells shelf ads to grocers.' }] },
    { industry: 'Quick commerce ads', why: null, startups: [], unchecked: true },
  ],
  deals_by: 'agent', ran_at: new Date().toISOString(), running: false, next_manual_at: new Date(Date.now() + 60e3).toISOString(), max_competitors: 3,
};
const props = (over = {}) => ({
  load: vi.fn().mockResolvedValue(view), save: vi.fn().mockResolvedValue({ competitors: [], refreshing: true }),
  run: vi.fn().mockResolvedValue({ status: 'started' }), download: vi.fn(), shortlist: vi.fn().mockResolvedValue(), ...over,
});
const show = p => render(<MemoryRouter><CeoPanel {...p} /></MemoryRouter>);

describe('CeoPanel', () => {
  it('shows competitors (suggested marked), their deals with sources, and On OpenI links', async () => {
    show(props());
    const comps = await screen.findAllByTestId('ceo-competitor');
    expect(comps.map(c => c.textContent)).toEqual(['Rivalco', 'Othercorp · suggested']);
    const deals = screen.getAllByTestId('ceo-deal');
    expect(deals.map(d => d.getAttribute('data-kind'))).toEqual(['acquired', 'partnered']);
    expect(deals[0].textContent).toContain('Acquired Shelfsense');
    expect(deals[0].querySelector('a[href="/dashboard/startups/7?by=user_id"]').textContent).toBe('On OpenI');
    expect(deals[0].querySelector('a[href="https://news.example/1"]').getAttribute('target')).toBe('_blank');
    expect(deals[1].textContent).not.toContain('On OpenI');
    expect(screen.getByText('No startup deal in the news in the last 12 months.')).toBeTruthy();  // Othercorp
  });

  it('where to venture next: startups to acquire, Shortlist puts one in the pipeline; unchecked says so', async () => {
    const p = props();
    show(p);
    const t = await screen.findByTestId('ceo-target');
    expect(t.textContent).toContain('Freshads');
    expect(t.textContent).toContain('Seed · 6 people');
    expect(t.textContent).toContain('Sells shelf ads to grocers.');
    expect(screen.getByText('Startups found here are still being checked.')).toBeTruthy();
    fireEvent.click(screen.getByTestId('ceo-shortlist'));
    await waitFor(() => expect(p.shortlist).toHaveBeenCalledWith(9));
    expect(await screen.findByText('Shortlisted')).toBeTruthy();
  });

  it('adding a competitor saves the list; Refresh is off while it cools down; the board pack downloads', async () => {
    const p = props({ download: vi.fn().mockResolvedValue({ blob: new Blob(['%PDF-']), name: 'OpenI-Board-Pack-Q3-2026-Ceoco.pdf' }) });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    show(p);
    fireEvent.change(await screen.findByTestId('ceo-add-input'), { target: { value: ' Thirdco ' } });
    fireEvent.click(screen.getByTestId('ceo-add'));
    await waitFor(() => expect(p.save).toHaveBeenCalledWith(['Rivalco', 'Othercorp', 'Thirdco']));
    expect(screen.getByTestId('ceo-refresh').disabled).toBe(true);
    fireEvent.click(screen.getByTestId('ceo-board-pack'));
    await waitFor(() => expect(p.download).toHaveBeenCalledTimes(1));
  });

  it('with no competitors: asks for them; Refresh off; nothing else shown', async () => {
    show(props({ load: vi.fn().mockResolvedValue({ ...view, competitors: [], ecosystem: [], adjacent: [], ran_at: null, next_manual_at: null }) }));
    expect((await screen.findByTestId('ceo-status')).textContent).toBe('Name up to 3 competitors and OpenI follows their startup deals for you.');
    expect(screen.getByTestId('ceo-refresh').disabled).toBe(true);
    expect(screen.queryByTestId('ceo-ecosystem')).toBeNull();
  });

  it('status text', () => {
    expect(ceoStatusText({ running: true })).toBe('Reading the news on your competitors… this takes a minute.');
    expect(ceoStatusText({ competitors: [{ name: 'A' }], ran_at: '2026-09-30T10:00:00Z', deals_by: 'headlines' })).toMatch(/^Last read 30 Sept? 2026 \(from the headlines\)\.$/);  // ICU spells it Sep or Sept
  });
});
