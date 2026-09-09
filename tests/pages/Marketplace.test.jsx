/**
 * @vitest-environment jsdom
 *
 * s116k — layer 3, page 2 of 3: Marketplace.jsx (858 lines).
 *
 * WHAT THIS PINS. One thing above all: the RESPONSE-SHAPE branch in
 * loadChallenges (Marketplace.jsx:205-208). The backend used to return a bare
 * array and now returns `{opportunities, total, page, limit}`. The page still
 * accepts both, and its own comment says why — so that a frontend deploy
 * landing before the backend one degrades to the old behaviour "instead of
 * rendering empty".
 *
 * That branch is worth a test precisely because it is INVISIBLE when everything
 * is working. It has no UI, it never fires in normal operation, and it reads
 * like dead defensive code that a tidy-up would delete. The cost of deleting it
 * is a marketplace that renders empty for the length of a deploy window, on the
 * page where users find opportunities. Nobody would connect the two.
 *
 * SECOND: `total` is the server's UNPAGED count, not `rows.length`. The source
 * comment flags this too. Getting it wrong shows "12 opportunities found" when
 * there are 500 — a number that looks plausible, so it would ship. The specs
 * below use a total that deliberately differs from the row count, because a
 * fixture where they match cannot tell the two apart.
 *
 * NOT COVERED, deliberately: the apply flow, the detail drawer, draft
 * persistence, deal requests, and the tab switch. Each needs several more
 * mocked endpoints and asserts something the network owns rather than this
 * page. Layer 2's rule holds — protect the logic that actually breaks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listAll = vi.fn();

vi.mock('../../src/services/api', () => ({
  opportunityAPI: { listAll: (...a) => listAll(...a) },
  corporateAPI: { getTaxonomy: vi.fn().mockResolvedValue({ sectors: [], technologies: [], usecases: [] }) },
  challengeAPI: {
    getDetail: vi.fn(), profileCheck: vi.fn(), getMyApplications: vi.fn().mockResolvedValue([]),
    apply: vi.fn(), updateMyApplication: vi.fn(),
  },
  publicAPI: {
    getDealRequest: vi.fn(), applyToDealRequest: vi.fn(), updateMyDealApplication: vi.fn(),
    getTaxonomy: vi.fn().mockResolvedValue({ sectors: [] }),
  },
}));
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'startup' }, activeRole: 'startup' }),
}));
vi.mock('../../src/hooks/useFormDraft', () => ({
  default: () => ({ clearDraft: vi.fn(), hasDraft: false, restoreDraft: vi.fn() }),
}));
vi.mock('../../src/components/FileUpload', () => ({ default: () => null }));
vi.mock('../../src/components/UpgradeCTA', () => ({ default: () => null }));

// toast is asserted on in the failure spec, so it needs to be a real spy
// rather than a no-op — "did not crash" and "told the user" are different
// claims and the failure path owes us both.
const toastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: { error: (...a) => toastError(...a), success: vi.fn() },
  Toaster: () => null,
}));

import Marketplace from '../../src/pages/dashboard/Marketplace';

const row = (id, title) => ({
  type: 'challenge', id, title, description: 'desc', org_name: 'Acme',
  sectors: [], deadline: null, apply_url: null, created_at: '2026-01-01',
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/marketplace']}>
      <Marketplace />
    </MemoryRouter>,
  );

beforeEach(() => {
  listAll.mockReset();
  toastError.mockReset();
});

describe('Marketplace — response shape tolerance', () => {
  it('renders the CURRENT backend shape {opportunities, total}', async () => {
    listAll.mockResolvedValue({
      opportunities: [row(1, 'Reduce grid losses'), row(2, 'Cold chain sensing')],
      total: 57, page: 1, limit: 20,
    });

    renderPage();

    expect(await screen.findByText('Reduce grid losses')).toBeInTheDocument();
    expect(screen.getByText('Cold chain sensing')).toBeInTheDocument();
  });

  it('renders the LEGACY bare-array shape instead of falling through to empty', async () => {
    // This is the whole point of the file. If someone removes the
    // Array.isArray branch, `data.opportunities` on an array is undefined,
    // rows becomes [], and the page renders its empty state while the server
    // is returning data perfectly well.
    listAll.mockResolvedValue([row(1, 'Legacy shaped row')]);

    renderPage();

    expect(await screen.findByText('Legacy shaped row')).toBeInTheDocument();
    expect(screen.queryByText(/no open opportunities found/i)).not.toBeInTheDocument();
  });

  it('counts from the SERVER total, not the number of rows on this page', async () => {
    // 2 rows, 57 total — deliberately different, because a fixture where they
    // match would pass either way and prove nothing.
    listAll.mockResolvedValue({ opportunities: [row(1, 'A'), row(2, 'B')], total: 57 });

    renderPage();

    expect(await screen.findByText(/57 opportunities found/i)).toBeInTheDocument();
  });

  it('falls back to the row count when a legacy array gives no total', async () => {
    listAll.mockResolvedValue([row(1, 'A'), row(2, 'B'), row(3, 'C')]);

    renderPage();

    expect(await screen.findByText(/3 opportunities found/i)).toBeInTheDocument();
  });

  it('singularises the count for exactly one result', async () => {
    listAll.mockResolvedValue({ opportunities: [row(1, 'Only one')], total: 1 });

    renderPage();

    expect(await screen.findByText(/1 opportunity found/i)).toBeInTheDocument();
  });
});

describe('Marketplace — empty and failed loads', () => {
  it('shows the empty state when the server returns no rows', async () => {
    listAll.mockResolvedValue({ opportunities: [], total: 0 });

    renderPage();

    expect(await screen.findByText(/no open opportunities found/i)).toBeInTheDocument();
  });

  it('survives a rejected fetch, tells the user, and does not spin forever', async () => {
    listAll.mockRejectedValue(new Error('network down'));

    renderPage();

    // The `finally` in loadChallenges is what clears `loading`. Without it the
    // page would sit on a spinner for ever and never reach this empty state —
    // so this assertion covers the catch AND the finally.
    expect(await screen.findByText(/no open opportunities found/i)).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
