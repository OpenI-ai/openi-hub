/**
 * @vitest-environment jsdom
 *
 * s126 (2 Oct 2026) — User Management shows "Last active" (Rajeev: Rajeev Arora read "Last Login 27 Aug 26"
 * though he uses OpenI; "how do I find out how users are active?"). The column shows when the account was last
 * USED, the old password login is in its tooltip, and "Recently active" sorts by it on the server.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ listUsers: vi.fn() }));
vi.mock('../../src/services/api', () => ({ adminAPI: api }));
vi.mock('../../src/utils/plans', () => ({ planColor: () => '', planOptions: () => [], planOptionLabel: (_p, x) => x, useAssignablePlans: () => ['free', 'seeker_pro'] }));
const { default: Page, lastActiveText } = await import('../../src/pages/dashboard/AdminUsers');

const DAY = 86400000;
const now = Date.now();
const users = [{ id: 7, name: 'Rajeev Arora', email: 'ra@example.com', role: 'accelerator', current_plan: 'seeker_pro', is_active: true,
  last_login: new Date(now - 36 * DAY).toISOString(), last_active_at: new Date(now - 60000).toISOString() }];

describe('User Management: Last active', () => {
  beforeEach(() => { api.listUsers.mockReset().mockResolvedValue({ users, total: 1 }); });

  it('lastActiveText', () => {
    expect(lastActiveText(null)).toBe('Never');
    expect(lastActiveText(new Date(now - 60000).toISOString(), now)).toBe('Today');
    expect(lastActiveText(new Date(now - DAY - 1000).toISOString(), now)).toBe('Yesterday');
    expect(lastActiveText(new Date(now - 3 * DAY - 1000).toISOString(), now)).toBe('3 days ago');
    expect(lastActiveText('2026-08-27T10:00:00Z', Date.parse('2026-10-02T00:00:00Z'))).toBe('27 Aug 26');
  });

  it('shows when the account was used, with the old password login in the tooltip; "Recently active" sorts on the server', async () => {
    render(<MemoryRouter><Page /></MemoryRouter>);
    const cell = await screen.findByTestId('admin-user-last-active');
    expect(cell.textContent).toBe('Today');
    expect(cell.getAttribute('title')).toMatch(/^Last password login: /);
    expect(screen.getByRole('columnheader', { name: 'Last active' })).toBeTruthy();
    expect(api.listUsers.mock.calls[0][0].sort).toBeUndefined();
    fireEvent.change(screen.getByTestId('admin-users-sort'), { target: { value: 'last_active' } });
    await waitFor(() => expect(api.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'last_active', page: 1 })));
  });

  it('an account with no activity recorded yet falls back to its last login', async () => {
    api.listUsers.mockResolvedValue({ users: [{ ...users[0], last_active_at: null, last_login: '2026-08-27T10:00:00Z' }], total: 1 });
    render(<MemoryRouter><Page /></MemoryRouter>);
    expect((await screen.findByTestId('admin-user-last-active')).textContent).toBe('27 Aug 26');
  });
});
