/**
 * @vitest-environment jsdom
 *
 * 21 Sep 2026 — the What's New admin review controls must be admin-only.
 *
 * WHY THIS EXISTS. Repairing the ingest gate turned the next sync into a
 * publish-everything event: five weeks of backlog, ~204 entries, live and
 * unreviewed. The fix stages a stale entry as a draft instead — which is only
 * safe because an admin can then publish it. Those publish controls are
 * rendered on the SAME page every user sees, gated on `user.role === 'admin'`.
 *
 * So there are two failure modes and this file pins both:
 *
 *   1. The controls leak to ordinary users. A `Publish` button next to a
 *      platform announcement invites someone to try it; the backend refuses
 *      with 403, so the damage is a confusing dead control on a page whose
 *      whole job is to communicate clearly — and it advertises an admin
 *      surface to people who should not know it exists.
 *
 *   2. The controls vanish for admins. Then staged entries are unreachable
 *      forever and "staging" is just silent deletion — strictly worse than
 *      the unreviewed dump it replaced.
 *
 * Asserted against the RENDERED page rather than the source text, because what
 * matters is what a browser puts on screen, not that the string `isAdmin`
 * appears somewhere in the file.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const listMock = vi.fn();
const setPublishedMock = vi.fn();
const bulkPublishMock = vi.fn();
let currentUser = { id: 1, role: 'startup' };

vi.mock('../../src/services/api', () => ({
  whatsNewAPI: {
    list: (...a) => listMock(...a),
    markSeen: vi.fn().mockResolvedValue({ ok: true }),
    unreadCount: vi.fn().mockResolvedValue({ unread_count: 0 }),
  },
  whatsNewAdminAPI: {
    listDrafts: (...a) => listMock(...a),
    setPublished: (...a) => setPublishedMock(...a),
    bulkPublish: (...a) => bulkPublishMock(...a),
  },
}));
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

import WhatsNew from '../../src/pages/dashboard/WhatsNew';

// One published entry and one staged draft, on separate dates so each lands in
// its own collapsible group.
const PAYLOAD = {
  entries: [
    { id: 11, posted_at: '2026-09-20', title: 'A published update', summary: 'live', audience: [], is_published: true },
    { id: 22, posted_at: '2026-08-14', title: 'A staged update', summary: 'drafted', audience: [], is_published: false },
  ],
  unread_count: 0,
  draft_count: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  listMock.mockResolvedValue(PAYLOAD);
  setPublishedMock.mockResolvedValue({ ok: true });
  bulkPublishMock.mockResolvedValue({ ok: true, updated: 1 });
});

describe("What's New — review controls are admin-only", () => {
  it('shows an ordinary user no review banner and no publish control', async () => {
    currentUser = { id: 1, role: 'startup' };
    render(<WhatsNew />);
    await screen.findByText(/A published update/);

    expect(screen.queryByText(/awaiting review/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /review drafts/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^publish/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /unpublish/i })).toBeNull();
    expect(screen.queryByText('DRAFT')).toBeNull();
  });

  it('shows an admin the review queue and its count', async () => {
    currentUser = { id: 9, role: 'admin' };
    render(<WhatsNew />);
    await screen.findByText(/awaiting review/i);
    expect(screen.getByRole('button', { name: /review drafts/i })).toBeTruthy();
  });

  it('offers an admin a per-group publish action for staged entries', async () => {
    currentUser = { id: 9, role: 'admin' };
    render(<WhatsNew />);
    await waitFor(() => expect(screen.getByRole('button', { name: /^publish 1$/i })).toBeTruthy());
  });

  /**
   * The mount load must NOT request the draft-only view: an admin opening the
   * page should see the feed as it stands, with review offered — not silently
   * filtered to drafts. This also pins that `load` is called with an explicit
   * boolean, the fix for `onClick={load}` passing a MouseEvent as the view flag.
   */
  it('loads the full feed on mount, not the draft-filtered view', async () => {
    currentUser = { id: 9, role: 'admin' };
    render(<WhatsNew />);
    await screen.findByText(/awaiting review/i);
    expect(listMock).toHaveBeenCalled();
    for (const call of listMock.mock.calls) {
      expect(call[0], 'mount load must not receive a MouseEvent or a truthy flag').toBeUndefined();
    }
  });

  it('hides the review banner when nothing is staged', async () => {
    currentUser = { id: 9, role: 'admin' };
    listMock.mockResolvedValue({ ...PAYLOAD, draft_count: 0 });
    render(<WhatsNew />);
    await screen.findByText(/A published update/);
    expect(screen.queryByText(/awaiting review/i)).toBeNull();
  });
});
