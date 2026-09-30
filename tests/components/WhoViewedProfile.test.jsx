/**
 * @vitest-environment jsdom
 *
 * s124 (30 Sep 2026) — the testing agent's P2: a 402 fired on /dashboard for the
 * free student@ and academia@ demo accounts. The card asked for the viewer list
 * on every plan. Now /profile-views/stats says whether the plan shows it
 * (can_see_viewers): no -> the upgrade prompt, and the list is never asked for.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ viewStats: vi.fn(), whoViewedMe: vi.fn() }));
vi.mock('../../src/services/api', () => ({ profileViewAPI: api }));
const me = vi.hoisted(() => ({ user: { id: 1, role: 'student' } }));
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => me }));
const { default: WhoViewedProfile } = await import('../../src/components/WhoViewedProfile');

const stats = { total_views: 3, unique_viewers: 2, views_7d: 1, views_30d: 3 };
const show = () => render(<MemoryRouter><WhoViewedProfile /></MemoryRouter>);

describe('WhoViewedProfile', () => {
  beforeEach(() => { api.viewStats.mockReset(); api.whoViewedMe.mockReset(); });

  it('a plan without the list: shows the upgrade prompt and never asks for the list', async () => {
    api.viewStats.mockResolvedValue({ ...stats, can_see_viewers: false });
    show();
    expect(await screen.findByText(/to see names of corporates/)).toBeTruthy();
    expect(api.whoViewedMe).not.toHaveBeenCalled();
  });

  it('a plan with the list: asks for it', async () => {
    api.viewStats.mockResolvedValue({ ...stats, can_see_viewers: true });
    api.whoViewedMe.mockResolvedValue({ viewers: [] });
    show();
    await vi.waitFor(() => expect(api.whoViewedMe).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/to see names of corporates/)).toBeNull();
  });

  it('an older API without the flag: still asks, and a refusal shows the upgrade prompt', async () => {
    api.viewStats.mockResolvedValue(stats);
    api.whoViewedMe.mockRejectedValue(new Error('See who viewed your profile with the Growth plan.'));
    show();
    expect(await screen.findByText(/to see names of corporates/)).toBeTruthy();
    expect(api.whoViewedMe).toHaveBeenCalledTimes(1);
  });
});
