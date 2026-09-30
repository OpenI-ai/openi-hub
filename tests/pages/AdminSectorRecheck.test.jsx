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

const api = vi.hoisted(() => ({ overview: vi.fn(), run: vi.fn(), decide: vi.fn() }));
vi.mock('../../src/services/api', () => ({ sectorRecheckAPI: api }));
const { default: Page, recheckStatusText } = await import('../../src/pages/dashboard/AdminSectorRecheck');

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
    expect(rows[0].textContent).toContain('Financial Services → FinTech');
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
});
