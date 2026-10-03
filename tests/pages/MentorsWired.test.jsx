/**
 * @vitest-environment jsdom
 *
 * s127 (3 Oct 2026) — Find Mentors, wired. "Request Session" used to close the box and send nothing; "Send Message",
 * "Add Mentor", "Assign More" and the per-startup "Message" did nothing at all. Now a mentor with an OpenI account
 * gets a real conversation and a real meeting invite; one without an account says how sessions are arranged.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ list: vi.fn(), createConversation: vi.fn(), create: vi.fn() }));
const nav = vi.hoisted(() => vi.fn());
vi.mock('../../src/services/api', () => ({ mentorAPI: { list: api.list }, messageAPI: { createConversation: api.createConversation }, meetingAPI: { create: api.create } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => nav }));
const { default: Mentors, normaliseMentor, sessionRequest } = await import('../../src/pages/dashboard/Mentors');

const withAccount = { id: 1, user_id: 77, name: 'Asha Rao', organisation: 'IISc', total_sessions: 12, is_active: true, rating: 4.5, expertise: ['Batteries'] };
const noAccount = { id: 2, user_id: null, name: 'Vikram Sen', organisation: 'Retired', is_active: true, rating: 4, expertise: [] };
const open = async (name) => { render(<MemoryRouter><Mentors /></MemoryRouter>); fireEvent.click(await screen.findByText(name)); };

beforeEach(() => { Object.values(api).forEach(f => f.mockReset()); nav.mockReset(); api.list.mockResolvedValue({ mentors: [withAccount, noAccount] }); });

describe('Find Mentors', () => {
  it('reads the table’s own columns', () => {
    expect(normaliseMentor(withAccount)).toMatchObject({ org: 'IISc', sessions: 12, available: true, avatar: 'A' });
    expect(normaliseMentor({ name: 'x', is_active: false }).available).toBe(false);
  });

  it('no admin-only buttons on the list', async () => {
    render(<MemoryRouter><Mentors /></MemoryRouter>);
    await screen.findByText('Asha Rao');
    expect(screen.queryByText(/Add Mentor/)).toBeNull();
  });

  it('Send Message opens a real conversation with the mentor', async () => {
    api.createConversation.mockResolvedValue({ id: 9 });
    await open('Asha Rao');
    fireEvent.click(screen.getByTestId('mentor-message'));
    await waitFor(() => expect(nav).toHaveBeenCalledWith('/dashboard/messaging?conversation=9'));
    expect(api.createConversation).toHaveBeenCalledWith({ type: 'direct', member_ids: [77] });
    expect(screen.queryByText(/Assign More/)).toBeNull();
  });

  it('Request Session sends a meeting invite to the mentor (it used to send nothing)', async () => {
    api.create.mockResolvedValue({ id: 3 });
    await open('Asha Rao');
    fireEvent.click(screen.getByTestId('mentor-book'));
    fireEvent.change(screen.getByTestId('mentor-date'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Session topic'), { target: { value: 'Cell chemistry' } });
    fireEvent.click(screen.getByTestId('mentor-request'));
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    expect(api.create.mock.calls[0][0]).toMatchObject({ title: 'Mentoring session with Asha Rao', description: 'Cell chemistry', participant_ids: [77] });
    expect(sessionRequest(withAccount, { date: '2026-10-20', slot: 1 }).start_time).toBe(new Date('2026-10-20T14:00:00').toISOString());
  });

  it('a mentor without an OpenI account: no buttons that cannot work, and says why', async () => {
    await open('Vikram Sen');
    expect(screen.queryByTestId('mentor-message')).toBeNull();
    expect(screen.queryByTestId('mentor-book')).toBeNull();
    expect(screen.getByTestId('mentor-unreachable').textContent).toMatch(/does not have an OpenI account yet/);
  });
});
