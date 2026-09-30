/**
 * @vitest-environment jsdom
 *
 * s124 (30 Sep 2026) — every "Meeting scheduled" notification links to
 * /dashboard/meetings/<id>, and no route matched it. That URL now opens the
 * meeting itself; "Back to Meetings" returns to the list URL.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const api = vi.hoisted(() => ({
  list: vi.fn().mockResolvedValue({ meetings: [] }),
  get: vi.fn().mockResolvedValue({ id: 42, title: 'Keenco × Pipeco', meeting_type: 'one_on_one', status: 'proposed',
    organizer_id: 9, start_time: new Date(Date.now() + 86400e3).toISOString(), participants: [] }),
}));
vi.mock('../../src/services/api', () => ({ meetingAPI: api }));
const me = vi.hoisted(() => ({ user: { id: 1, role: 'startup' } }));
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => me }));
const { default: Meetings } = await import('../../src/pages/dashboard/Meetings');

function Where() { return <div data-testid="where">{useLocation().pathname}</div>; }

describe('Meetings route /dashboard/meetings/:id', () => {
  it('opens the meeting from the notification link, and Back returns to the list', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/meetings/42']}>
        <Routes>
          <Route path="/dashboard/meetings" element={<><Meetings /><Where /></>} />
          <Route path="/dashboard/meetings/:id" element={<><Meetings /><Where /></>} />
        </Routes>
      </MemoryRouter>);
    expect(await screen.findByText('Keenco × Pipeco')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith(42);
    fireEvent.click(screen.getByText(/Back to Meetings/));
    expect(await screen.findByText('/dashboard/meetings')).toBeTruthy();
    expect(screen.queryByText('Keenco × Pipeco')).toBeNull();
  });

  it('the list URL opens no meeting', async () => {
    api.get.mockClear();
    render(<MemoryRouter initialEntries={['/dashboard/meetings']}><Routes>
      <Route path="/dashboard/meetings" element={<Meetings />} /></Routes></MemoryRouter>);
    await vi.waitFor(() => expect(api.list).toHaveBeenCalled());
    expect(api.get).not.toHaveBeenCalled();
  });
});
