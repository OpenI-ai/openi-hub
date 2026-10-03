/**
 * @vitest-environment jsdom
 *
 * s127 (3 Oct 2026) — G4 "search that learns": on the DASHBOARD search, the startups you shortlisted and opened before
 * come first and those you passed on last, each marked; opening one records the click with its position. The public
 * /search page is unchanged (no personal call, engine order).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { orderByMarks, MARK_TEXT } from '../../src/utils/searchLearn';

const learn = vi.hoisted(() => ({ personal: vi.fn(), click: vi.fn() }));
vi.mock('../../src/components/PublicLayout', () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock('../../src/components/SearchBar', () => ({ default: () => null }));
vi.mock('../../src/services/clusterAPI', () => ({ mapsAPI: { suggest: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/services/api', () => ({
  getToken: () => 'tok',
  crawlAPI: {},
  searchLearnAPI: learn,
  publicAPI: { globalSearch: vi.fn().mockResolvedValue({
    challenges: { results: [], total: 0 }, directory: { results: [], total: 0 }, knowledge: { results: [], total: 0 },
    startups: { results: [{ user_id: 1, company_name: 'Alpha' }, { user_id: 2, company_name: 'Bravo' }, { user_id: 3, company_name: 'Charlie' }, { user_id: 4, company_name: 'Delta' }], total: 4 } }),
    aiSearch: vi.fn(), semanticSearch: vi.fn() },
}));
const { default: GlobalSearch } = await import('../../src/pages/public/GlobalSearch');
const show = (path) => render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/search" element={<GlobalSearch />} />
  <Route path="/dashboard/search" element={<GlobalSearch inDashboard />} />
</Routes></MemoryRouter>);
const names = () => screen.getAllByTestId('search-startup').map(a => a.querySelector('h4').textContent);

describe('search that learns', () => {
  beforeEach(() => {
    learn.personal.mockReset().mockResolvedValue({ marks: { 1: 'passed', 3: 'shortlisted', 4: 'opened' } });
    learn.click.mockReset().mockResolvedValue(null);
  });

  it('orderByMarks: shortlisted, opened, rest, passed; stable; never in place', () => {
    const items = [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }];
    expect(orderByMarks(items, { 1: 'passed', 3: 'opened' }).map(s => s.user_id)).toEqual([3, 2, 1]);
    expect(items.map(s => s.user_id)).toEqual([1, 2, 3]);
    expect(MARK_TEXT.passed).toBe('You passed on this');
  });

  it('dashboard: personal order and marks; opening one records the click with its position', async () => {
    show('/dashboard/search?q=drones');
    await waitFor(() => expect(names()).toEqual(['Charlie', 'Delta', 'Bravo', 'Alpha']));
    expect(learn.personal).toHaveBeenCalledWith([1, 2, 3, 4]);
    expect(screen.getAllByTestId('search-mark').map(m => m.textContent)).toEqual(['On your shortlist', 'You opened this before', 'You passed on this']);
    fireEvent.click(screen.getAllByTestId('search-startup')[1]);
    expect(learn.click).toHaveBeenCalledWith({ startup_user_id: 4, query: 'drones', position: 2 });
  });

  it('the public page: engine order, no personal call, no click recorded', async () => {
    show('/search?q=drones');
    await waitFor(() => expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']));
    expect(learn.personal).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByTestId('search-startup')[0]);
    expect(learn.click).not.toHaveBeenCalled();
  });
});
