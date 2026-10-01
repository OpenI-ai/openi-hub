/**
 * @vitest-environment jsdom
 *
 * s125 (1 Oct 2026) — Rajeev: "ask openI button signs you out". /search is the PUBLIC page (website header,
 * "Sign In"), so a logged-in user searching from the dashboard looked signed out. Logged-in search runs inside
 * the dashboard (/dashboard/search): no public header, and its links and re-searches stay under /dashboard.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

vi.mock('../../src/components/PublicLayout', () => ({ default: ({ children }) => <div data-testid="public-layout">{children}</div> }));
vi.mock('../../src/components/SearchBar', () => ({ default: ({ onSearch }) => <button type="button" data-testid="sb" onClick={() => onSearch('fintech', 'keyword')}>search</button> }));
vi.mock('../../src/services/clusterAPI', () => ({ mapsAPI: { suggest: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/services/api', () => ({
  getToken: () => 'tok',
  crawlAPI: {},
  publicAPI: { globalSearch: vi.fn().mockResolvedValue({
    challenges: { results: [{ id: 7, title: 'Cold chain', company_name: 'Acme' }], total: 1 },
    startups: { results: [], total: 0 }, directory: { results: [], total: 0 }, knowledge: { results: [], total: 0 } }),
    aiSearch: vi.fn(), semanticSearch: vi.fn() },
}));
const { default: GlobalSearch } = await import('../../src/pages/public/GlobalSearch');

function Where() { const l = useLocation(); return <span data-testid="where">{l.pathname}{l.search}</span>; }
const show = (path, el) => render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/search" element={<><GlobalSearch /><Where /></>} />
  <Route path="/dashboard/search" element={<><GlobalSearch inDashboard /><Where /></>} />
</Routes></MemoryRouter>);

describe('GlobalSearch inside the dashboard', () => {
  it('no public header; a new search stays in the dashboard; "View all" challenges go to the dashboard marketplace', async () => {
    show('/dashboard/search?q=cold');
    expect(screen.queryByTestId('public-layout')).toBeNull();
    await waitFor(() => expect(screen.getAllByText('Cold chain').length).toBeGreaterThan(0));
    const links = [...document.querySelectorAll('a')].map(a => a.getAttribute('href'));
    expect(links.some(h => h.startsWith('/marketplace'))).toBe(false);
    expect(links).toContain('/dashboard/marketplace');
    screen.getAllByTestId('sb')[0].click();
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/dashboard/search?q=fintech'));
  });

  it('the public page keeps its website header and public links', async () => {
    show('/search?q=cold');
    expect(screen.getByTestId('public-layout')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText('Cold chain').length).toBeGreaterThan(0));
    screen.getAllByTestId('sb')[0].click();
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/search?q=fintech'));
  });
});
