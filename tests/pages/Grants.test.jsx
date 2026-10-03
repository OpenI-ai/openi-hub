/**
 * @vitest-environment jsdom
 *
 * s127 (3 Oct 2026) — Disburse Grants (government) and My Grants (startup). Rendered from mocked API data: the
 * record-only notice; the 40/30/30 default split; only the action the next step allows (approve tranche 1, not 2;
 * "Record payment" only on an approved tranche, which sends the full amount + reference); the startup can send proof
 * for its NEXT milestone only, and a backend refusal reaches the user as its own words.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ schemes: vi.fn(), createScheme: vi.fn(), scheme: vi.fn(), searchStartups: vi.fn(), award: vi.fn(),
  grant: vi.fn(), approve: vi.fn(), recordPayment: vi.fn(), submitProof: vi.fn(), mine: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../src/services/api', () => ({ grantAPI: api }));
vi.mock('react-hot-toast', () => ({ default: toast }));
const { default: GrantsDisburse, defaultTranches, inr } = await import('../../src/pages/dashboard/government/GrantsDisburse');
const { default: MyGrants } = await import('../../src/pages/dashboard/MyGrants');

const tr = (id, seq, status, extra = {}) => ({ id, seq, amount: [0, 400000, 300000, 300000][seq], milestone: `M${seq}`, status, ...extra });
const grant = (tranches) => ({ id: 5, startup_name: 'Voltgrid', amount: 1000000, disbursed: 0, status: 'active', purpose: 'Pilot',
  scheme_name: 'Seed', funder_name: 'Startup Mission', tranches, next: tranches.find(t => t.status !== 'paid') || null });

beforeEach(() => { Object.values(api).forEach(f => f.mockReset()); toast.success.mockReset(); toast.error.mockReset(); });

describe('defaultTranches / inr', () => {
  it('splits 40/30/30 in whole rupees, the last takes the remainder', () => {
    expect(defaultTranches(1000001).map(t => t.amount)).toEqual([400000, 300000, 300001]);
    expect(defaultTranches(0).map(t => t.amount)).toEqual(['', '', '']);
    expect(inr(1500000)).toBe('₹15,00,000');
  });
});

describe('GrantsDisburse', () => {
  it('says OpenI only records payments, shows totals, lists schemes', async () => {
    api.schemes.mockResolvedValue({ totals: { sanctioned: 1000000, disbursed: 400000 },
      schemes: [{ id: 1, name: 'Seed', status: 'open', grants: 1, awarded: 1000000, total_budget: 5000000, disbursed: 400000 }] });
    render(<GrantsDisburse />);
    expect(screen.getByTestId('grants-record-only').textContent).toMatch(/Your treasury pays each grant/);
    await waitFor(() => expect(screen.getAllByTestId('grants-scheme')).toHaveLength(1));
    expect(screen.getByText('₹10,00,000')).toBeTruthy();
    expect(screen.getByText(/1 grant · ₹10,00,000 awarded of ₹50,00,000/)).toBeTruthy();
  });

  it('offers only the next step: approve tranche 1 (not 2); record payment sends the full amount and reference', async () => {
    api.schemes.mockResolvedValue({ totals: { sanctioned: 0, disbursed: 0 }, schemes: [{ id: 1, name: 'Seed', status: 'open', grants: 1, awarded: 0, total_budget: 1, disbursed: 0 }] });
    const pending = grant([tr(11, 1, 'pending'), tr(12, 2, 'pending'), tr(13, 3, 'pending')]);
    api.scheme.mockResolvedValue({ id: 1, name: 'Seed', status: 'open', total_budget: 5000000, awarded: 1000000, disbursed: 0, grants: [pending] });
    render(<GrantsDisburse />);
    fireEvent.click(await screen.findByTestId('grants-scheme'));
    await screen.findByTestId('grants-grant');
    const approves = screen.getAllByTestId('grants-approve');
    expect(approves.map(b => b.textContent)).toEqual(['Approve milestone 1']);
    expect(screen.queryByTestId('grants-record-payment')).toBeNull();

    const approved = grant([tr(11, 1, 'approved'), tr(12, 2, 'pending'), tr(13, 3, 'pending')]);
    api.approve.mockResolvedValue({});
    api.scheme.mockResolvedValue({ id: 1, name: 'Seed', status: 'open', total_budget: 5000000, awarded: 1000000, disbursed: 0, grants: [approved] });
    fireEvent.click(approves[0]);
    await waitFor(() => expect(api.approve).toHaveBeenCalledWith(5, 11));
    fireEvent.click(await screen.findByTestId('grants-record-payment'));
    fireEvent.change(screen.getByTestId('grants-payment-ref'), { target: { value: 'UTR123' } });
    api.recordPayment.mockRejectedValue(new Error('The payment date cannot be in the future.'));
    fireEvent.click(screen.getByTestId('grants-payment-submit'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('The payment date cannot be in the future.'));
    expect(api.recordPayment.mock.calls[0][2]).toMatchObject({ payment_ref: 'UTR123', paid_amount: 400000 });
  });
});

describe('MyGrants', () => {
  it('shows paid tranches with their reference and offers proof only for the next milestone', async () => {
    api.mine.mockResolvedValue({ grants: [grant([tr(11, 1, 'paid', { paid_at: '2026-10-01', payment_ref: 'UTR9' }), tr(12, 2, 'pending'), tr(13, 3, 'pending')])] });
    api.submitProof.mockResolvedValue({});
    render(<MyGrants />);
    await screen.findByTestId('mygrants-grant');
    expect(screen.getByText(/Paid 2026-10-01 · ref UTR9/)).toBeTruthy();
    expect(screen.getAllByTestId('mygrants-proof-open')).toHaveLength(1);
    fireEvent.click(screen.getByTestId('mygrants-proof-open'));
    fireEvent.change(screen.getByTestId('mygrants-proof-text'), { target: { value: 'Prototype built' } });
    fireEvent.click(screen.getByTestId('mygrants-proof-submit'));
    await waitFor(() => expect(api.submitProof).toHaveBeenCalledWith(5, 12, { evidence: 'Prototype built', evidence_url: '' }));
  });

  it('empty: says how a grant arrives', async () => {
    api.mine.mockResolvedValue({ grants: [] });
    render(<MyGrants />);
    expect((await screen.findByTestId('mygrants-empty')).textContent).toMatch(/When a government body awards you a grant/);
  });
});
