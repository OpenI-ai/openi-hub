/**
 * @vitest-environment jsdom
 *
 * 21 Sep 2026 (s119) — the organization seat panel must tell the truth.
 *
 * WHY THIS EXISTS. Rajeev's org read "No plan · 5/5 seats used" and he asked
 * what adding a sixth member would do. Two defects sat behind that number:
 *
 *   1. The bar counted only ACTIVE members while the backend gate counted
 *      invited + active, so the page could say 4/5 while the API refused the
 *      fifth member — with nothing on screen explaining the refusal.
 *   2. Anyone could POST a join request against any org, and those rows were
 *      counted as seats, so outsiders could spend an org's seats.
 *
 * The backend now hands down `seats_used` from one shared predicate and marks
 * each row's `source`. This file pins the three things a browser must show:
 * the server's seat number (never a recount), join requests kept OUT of the
 * seat roster, and a way for an admin to actually change the limit — the
 * PUT /api/org endpoint existed since Phase 21 with zero frontend callers.
 *
 * Asserted against the RENDERED page, not the source text.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const getMyOrgMock = vi.fn();
const updateMock = vi.fn();
const removeMemberMock = vi.fn();
let currentUser = { id: 1, role: 'corporate' };

vi.mock('../../src/services/api', () => ({
  orgAPI: {
    getMyOrg: (...a) => getMyOrgMock(...a),
    update: (...a) => updateMock(...a),
    removeMember: (...a) => removeMemberMock(...a),
    inviteMember: vi.fn(),
    updateMember: vi.fn(),
    create: vi.fn(),
    requestJoin: vi.fn(),
  },
  subscriptionAPI: { getPlans: vi.fn().mockResolvedValue({ plans: [] }) },
  claimAPI: { claimOrg: vi.fn() },
}));
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

import OrgAdmin from '../../src/pages/dashboard/OrgAdmin';

// Three active members, one pending invite the admin sent, and one outsider
// asking to join. The server counts 4 seats: actives + the pending INVITE.
// The request is not a seat and must not be in the Members roster.
const PAYLOAD = {
  org: { id: 7, name: 'Openi', seat_limit: 5, domain: 'openi.ai', plan_name: null, is_admin: true },
  members: [
    { id: 1, user_id: 1, email: 'rajeev@openi.ai', name: 'Rajeev Banduni', role: 'admin', status: 'active', source: 'invite' },
    { id: 2, user_id: 2, email: 'sharad@openi.ai', name: 'Sharad', role: 'member', status: 'active', source: 'invite' },
    { id: 3, user_id: 3, email: 'vanessa@openi.ai', name: 'Vanessa B', role: 'member', status: 'active', source: 'invite' },
    { id: 4, user_id: null, email: 'newhire@openi.ai', name: null, role: 'member', status: 'invited', source: 'invite' },
    { id: 5, user_id: 99, email: 'stranger@example.com', name: 'A Stranger', role: 'member', status: 'invited', source: 'request' },
  ],
  my_role: 'admin',
  seats_used: 4,
  pending_requests: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: 1, role: 'corporate' };
  getMyOrgMock.mockResolvedValue(PAYLOAD);
  updateMock.mockResolvedValue({ message: 'Organization updated' });
  removeMemberMock.mockResolvedValue({ message: 'Join request dismissed' });
});

describe('OrgAdmin — the seat count is the server’s, not a recount', () => {
  it('shows seats_used from the payload, including the pending invite', async () => {
    render(<OrgAdmin />);
    // 4, not 3: the pending invite holds a seat. A recount of active-only
    // members here would render 3 and reproduce the original defect.
    await waitFor(() => expect(screen.getByText('4 / 5')).toBeInTheDocument());
  });

  it('keeps the join request out of the Members roster', async () => {
    render(<OrgAdmin />);
    // 5 rows came down; 4 belong to the roster, 1 is a request.
    await waitFor(() => expect(screen.getByText('Members (4)')).toBeInTheDocument());
    expect(screen.getByText('Requests to join (1)')).toBeInTheDocument();
    expect(screen.getByText('A Stranger')).toBeInTheDocument();
    expect(screen.getByText('requested')).toBeInTheDocument();
  });

  it('says plainly that a request does not consume a seat', async () => {
    render(<OrgAdmin />);
    await waitFor(() => expect(
      screen.getByText(/Requests to join do not use a seat until you accept them/i)
    ).toBeInTheDocument());
    // And the requests card repeats it where the admin is about to act.
    expect(screen.getByText(/These do not use a seat/i)).toBeInTheDocument();
  });
});

describe('OrgAdmin — an admin can change the seat limit', () => {
  it('sends the new limit to PUT /api/org and reloads', async () => {
    render(<OrgAdmin />);
    await waitFor(() => expect(screen.getByText('4 / 5')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /change/i }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ seat_limit: 25 }));
    // A raise is only real once the page re-reads the org.
    expect(getMyOrgMock).toHaveBeenCalledTimes(2);
  });

  it('refuses a value outside 1-100 without calling the API', async () => {
    render(<OrgAdmin />);
    await waitFor(() => expect(screen.getByText('4 / 5')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /change/i }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(updateMock).not.toHaveBeenCalled());
  });

  it('hides the control from a non-admin member', async () => {
    getMyOrgMock.mockResolvedValue({
      ...PAYLOAD,
      org: { ...PAYLOAD.org, is_admin: false },
      my_role: 'member',
    });
    currentUser = { id: 2, role: 'corporate' };
    render(<OrgAdmin />);
    await waitFor(() => expect(screen.getByText('4 / 5')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /change/i })).toBeNull();
    // The requests card is admin-only too — a member must not see who applied.
    expect(screen.queryByRole('heading', { name: /Requests to join/i })).toBeNull();
    expect(screen.queryByText('A Stranger')).toBeNull();
  });
});

describe('OrgAdmin — pending rows are actionable', () => {
  it('lets the admin dismiss a request, and says it leaves their account alone', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<OrgAdmin />);
    await waitFor(() => expect(screen.getByText('A Stranger')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Dismiss request'));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/own account is not affected/i));
    await waitFor(() => expect(removeMemberMock).toHaveBeenCalledWith(5));
  });

  it('lets the admin revoke a pending invite to free its seat', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<OrgAdmin />);
    await waitFor(() => expect(screen.getByTitle('Revoke invitation')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Revoke invitation'));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/frees up their seat/i));
    await waitFor(() => expect(removeMemberMock).toHaveBeenCalledWith(4));
  });

  it('offers no role toggle on a row that is not active', async () => {
    render(<OrgAdmin />);
    await waitFor(() => expect(screen.getByText('A Stranger')).toBeInTheDocument());
    // Three actives, but one of them is the viewer themselves — so exactly two
    // Promote/Demote controls, and none on the two pending rows.
    expect(screen.getAllByRole('button', { name: /promote|demote/i })).toHaveLength(2);
  });
});
