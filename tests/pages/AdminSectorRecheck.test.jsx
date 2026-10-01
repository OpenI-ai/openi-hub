/**
 * @vitest-environment jsdom
 *
 * s124 (30 Sep 2026) — admin "Sector re-check": the analyst's proposals for the
 * startups filed under "Financial Services", reviewed and approved here. The
 * status line says how far it got; approve / reject send only the ticked rows;
 * "Probably not a startup" is marked. Asserted on the rendered page.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ overview: vi.fn(), run: vi.fn(), decide: vi.fn(), autoApprove: vi.fn(), hide: vi.fn(), unhide: vi.fn() }));
vi.mock('../../src/services/api', () => ({ sectorRecheckAPI: api }));
const { default: Page, recheckStatusText, sectorLabels, busyText, autoText, hiddenText, hideDoneText } = await import('../../src/pages/dashboard/AdminSectorRecheck');

const data = {
  from: 'Financial Services', still_filed: 3256, counts: { pending: 2, kept: 5 }, run: null,
  proposed_by_sector: [{ sector: 'FinTech', n: 1 }, { sector: 'SaaS/Enterprise', n: 1 }],
  items: [
    { id: 11, user_id: 101, company_name: 'Payco', from_sector: 'Financial Services', proposed_sector: 'FinTech', not_startup: false, confidence: 'high', reason: 'Payments API.' },
    { id: 12, user_id: 102, company_name: 'Fundco', from_sector: 'Financial Services', proposed_sector: 'Financial Services', not_startup: true, confidence: 'medium', reason: 'A VC fund.' },
  ],
};
const show = () => render(<MemoryRouter><Page /></MemoryRouter>);

describe('AdminSectorRecheck', () => {
  beforeEach(() => { api.overview.mockReset().mockResolvedValue(data); api.decide.mockReset().mockResolvedValue({ approved: 1, rejected: 0, stale: 0 }); api.run.mockReset().mockResolvedValue({ status: 'started' }); });

  it('lists the proposals with reason and confidence, and marks a company that is not a startup', async () => {
    show();
    const rows = await screen.findAllByTestId('recheck-row');
    expect(rows).toHaveLength(2);
    const sectors = rows[0].querySelector('[data-testid="recheck-sectors"]').children;
    expect(sectors[0].textContent).toBe('Now: Financial Services');
    expect(sectors[1].textContent).toBe('Proposed: FinTech');
    expect(rows[0].textContent).toContain('Payments API.');
    expect(rows[0].querySelector('a').getAttribute('href')).toBe('/dashboard/startups/101?by=user_id');
    expect(screen.getAllByTestId('recheck-not-startup')).toHaveLength(1);
    expect(screen.getByTestId('recheck-status').textContent).toBe('7 checked · 2 to review · 5 kept as "Financial Services" · 3,256 still filed under it.');
  });

  it('approve sends only the ticked rows; nothing is sent with none ticked', async () => {
    show();
    await screen.findAllByTestId('recheck-row');
    expect(screen.getByTestId('recheck-approve').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Select Payco'));
    fireEvent.click(screen.getByTestId('recheck-approve'));
    await waitFor(() => expect(api.decide).toHaveBeenCalledWith([11], 'approve'));
  });

  it('select all + reject; start the re-check', async () => {
    show();
    await screen.findAllByTestId('recheck-row');
    fireEvent.click(screen.getByTestId('recheck-pick-all'));
    fireEvent.click(screen.getByTestId('recheck-reject'));
    await waitFor(() => expect(api.decide).toHaveBeenCalledWith([11, 12], 'reject'));
    fireEvent.click(screen.getByTestId('recheck-start'));
    await waitFor(() => expect(api.run).toHaveBeenCalledTimes(1));
  });

  it('status text: before any check, while running, no model', () => {
    expect(recheckStatusText({ from: 'Financial Services', still_filed: 3256, counts: {}, run: null }))
      .toBe('3,256 startups are filed under "Financial Services". Press "Start the re-check" and the analyst reads each one.');
    expect(recheckStatusText({ counts: {}, run: { running: true, checked: 75 } })).toBe('The analyst is reading startups… 75 checked so far in this run.');
    expect(recheckStatusText({ counts: {}, run: { running: false, status: 'no_model' } })).toBe('The analyst is not available right now (no AI model); nothing was checked.');
  });

  it('each side of a row says what it is, per tab (1 Oct: "Financial Services → MarTech" read as one sector)', () => {
    const i = { from_sector: 'Financial Services', proposed_sector: 'MarTech' };
    expect(sectorLabels(i, 'pending')).toEqual(['Now: Financial Services', 'Proposed: MarTech']);
    expect(sectorLabels(i, 'rejected')).toEqual(['Now: Financial Services', 'Proposed: MarTech']);
    expect(sectorLabels(i, 'approved')).toEqual(['Was: Financial Services', 'Now: MarTech']);
    expect(sectorLabels(i, 'stale')).toEqual(['Was: Financial Services', 'Proposed: MarTech']);
    expect(sectorLabels(i, 'kept')).toEqual(['Now: Financial Services', 'Stays as it is']);
  });

  it('says how long an approval takes while it saves, and clears it after', async () => {
    let finish;
    api.decide.mockImplementation(() => new Promise((r) => { finish = r; }));
    show();
    await screen.findAllByTestId('recheck-row');
    fireEvent.click(screen.getByTestId('recheck-pick-all'));
    fireEvent.click(screen.getByTestId('recheck-approve'));
    expect((await screen.findByTestId('recheck-saving')).textContent).toContain('Approving 2 startups… about 2 seconds.');
    finish({ approved: 2, rejected: 0, stale: 0 });
    await waitFor(() => expect(screen.queryByTestId('recheck-saving')).toBeNull());
    expect(busyText('approve', 9)).toBe('Approving 9 startups… about 7 seconds.');
    expect(busyText('reject', 1)).toBe('Rejecting 1 startup… about 1 second.');
  });

  // s125: the agent approves its own high-confidence proposals.
  it('autoText: on, off, running; says what waits and that medium/low stay with the admin', () => {
    expect(autoText({})).toBe('');
    expect(autoText({ auto: { enabled: false } })).toBe('Auto-approve is off on this server: every proposal waits for you.');
    expect(autoText({ auto: { enabled: true, running: true } })).toMatch(/^The agent is approving/);
    expect(autoText({ auto: { enabled: true, approved_by_agent: 1200, waiting: 1323 } }))
      .toBe('Auto-approve is on for high confidence: 1,200 approved by the agent so far, 1,323 waiting for its next pass. Medium and low confidence wait for you.');
    expect(autoText({ auto: { enabled: true, approved_by_agent: 5, waiting: 0 } })).not.toMatch(/waiting/);
  });

  it('"Approve high confidence now" starts the agent; disabled when nothing waits or auto is off', async () => {
    api.autoApprove.mockReset().mockResolvedValue({ status: 'started', waiting: 1323 });
    api.overview.mockResolvedValue({ ...data, auto: { enabled: true, waiting: 1323, approved_by_agent: 0, running: false } });
    show();
    const b = await screen.findByTestId('recheck-auto-now');
    expect(b.disabled).toBe(false);
    fireEvent.click(b);
    await waitFor(() => expect(api.autoApprove).toHaveBeenCalledTimes(1));
  });

  it('no button when auto-approve is off; disabled when nothing waits', async () => {
    api.overview.mockResolvedValue({ ...data, auto: { enabled: false } });
    const { unmount } = show();
    expect((await screen.findByTestId('recheck-auto')).textContent).toMatch(/off/);
    expect(screen.queryByTestId('recheck-auto-now')).toBeNull();
    unmount();
    api.overview.mockResolvedValue({ ...data, auto: { enabled: true, waiting: 0, approved_by_agent: 9, running: false } });
    show();
    expect((await screen.findByTestId('recheck-auto-now')).disabled).toBe(true);
  });

  // s125: all eight older sectors, and hiding what is not a startup / too thin to place.
  const SECTORS = [{ name: 'Financial Services', still_filed: 3256, pending: 2 }, { name: 'IT & Software', still_filed: 9000, pending: 0 }, { name: 'Energy & Utilities', still_filed: 800, pending: 4 }];

  it('a sector picker over the eight sectors: choosing one reloads it, and Start / Approve-now act on it', async () => {
    api.overview.mockResolvedValue({ ...data, sectors: SECTORS, auto: { enabled: true, waiting: 3, approved_by_agent: 0, running: false } });
    api.autoApprove.mockReset().mockResolvedValue({ status: 'started', waiting: 3 });
    show();
    const pick = await screen.findByTestId('recheck-sector');
    await waitFor(() => expect(pick.querySelectorAll('option')).toHaveLength(3));
    expect([...pick.querySelectorAll('option')].map(o => o.textContent)).toEqual(['Financial Services (2 to review)', 'IT & Software', 'Energy & Utilities (4 to review)']);
    expect(api.overview).toHaveBeenLastCalledWith(expect.objectContaining({ from: 'Financial Services' }));
    fireEvent.change(pick, { target: { value: 'Energy & Utilities' } });
    await waitFor(() => expect(api.overview).toHaveBeenLastCalledWith(expect.objectContaining({ from: 'Energy & Utilities' })));
    fireEvent.click(screen.getByTestId('recheck-start'));
    await waitFor(() => expect(api.run).toHaveBeenCalledWith('Energy & Utilities'));
    fireEvent.click(await screen.findByTestId('recheck-auto-now'));
    await waitFor(() => expect(api.autoApprove).toHaveBeenCalledWith('Energy & Utilities'));
  });

  it('"Hide: not a startup" and "Hide until more data" send only the ticked rows with their reason', async () => {
    api.hide.mockReset().mockResolvedValue({ hidden: [102] });
    show();
    await screen.findAllByTestId('recheck-row');
    expect(screen.getByTestId('recheck-hide-not-startup').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Select Fundco'));
    fireEvent.click(screen.getByTestId('recheck-hide-not-startup'));
    await waitFor(() => expect(api.hide).toHaveBeenCalledWith([12], 'not_a_startup'));
    await waitFor(() => expect(screen.getByLabelText('Select Payco').checked).toBe(false));
    fireEvent.click(screen.getByLabelText('Select Payco'));
    fireEvent.click(screen.getByTestId('recheck-hide-thin'));
    await waitFor(() => expect(api.hide).toHaveBeenLastCalledWith([11], 'insufficient_data'));
  });

  it('a hidden company says why, and Undo shows it again', async () => {
    api.unhide.mockReset().mockResolvedValue({ restored: [102] });
    api.overview.mockResolvedValue({ ...data, items: [{ ...data.items[1], hidden_reason: 'not_a_startup' }, data.items[0]] });
    show();
    const badge = await screen.findByTestId('recheck-hidden');
    expect(badge.textContent).toContain('Hidden from clients: not a startup');
    expect(screen.getAllByTestId('recheck-hidden')).toHaveLength(1);
    fireEvent.click(screen.getByTestId('recheck-unhide'));
    await waitFor(() => expect(api.unhide).toHaveBeenCalledWith([12]));
  });

  it('hiddenText / hideDoneText', () => {
    expect(hiddenText('insufficient_data')).toBe('Hidden from clients until its profile has enough data');
    expect(hiddenText(null)).toBe('');
    expect(hideDoneText('not_a_startup', 1)).toBe('1 company hidden from every client list. "Undo" on the Rejected tab shows one again.');
    expect(hideDoneText('insufficient_data', 3)).toBe('3 companies hidden from every client list; each comes back by itself once its profile has enough data.');
  });

  // s125 — Rajeev: "we need to expand this sector" → "More sectors in the list". Specific sectors, sample first.
  it('specific sectors are listed apart, and are read by sample first; "Check all" appears after the sample', async () => {
    const sectors = [{ name: 'Financial Services', group: 'legacy', still_filed: 3256 }, { name: 'AgriTech', group: 'specific', still_filed: 4100 }];
    api.overview.mockImplementation(({ from }) => Promise.resolve(from === 'AgriTech'
      ? { ...data, from: 'AgriTech', group: 'specific', sample_size: 50, still_filed: 4100, counts: { pending: 6, kept: 40, approved: 4 }, sectors, items: [] }
      : { ...data, group: 'legacy', sample_size: 50, sectors }));
    show();
    const pick = await screen.findByTestId('recheck-sector');
    expect([...pick.querySelectorAll('optgroup')].map(g => g.label)).toEqual(['Older broad sectors', 'Specific sectors (startups filed)']);
    expect(screen.queryByTestId('recheck-start-all')).toBeNull();   // broad sectors: one button, as before
    fireEvent.change(pick, { target: { value: 'AgriTech' } });
    await waitFor(() => expect(screen.getByTestId('recheck-start').textContent).toContain('Check a sample (50)'));
    expect(screen.getByTestId('recheck-status').textContent).toBe('50 checked · 10 look mis-filed (20%) · 6 to review · 4,100 still filed under it.');
    fireEvent.click(screen.getByTestId('recheck-start'));
    await waitFor(() => expect(api.run).toHaveBeenCalledWith('AgriTech'));
    fireEvent.click(screen.getByTestId('recheck-start-all'));
    await waitFor(() => expect(api.run).toHaveBeenCalledWith('AgriTech', { all: true }));
  });

  it('a specific sector not checked yet explains the sample', () => {
    expect(recheckStatusText({ from: 'AgriTech', group: 'specific', sample_size: 50, still_filed: 4100, counts: {} }))
      .toBe('4,100 startups are filed under "AgriTech". Press "Check a sample" and the analyst reads 50 of them, so you see how many are mis-filed before reading them all.');
  });
});
