/**
 * @vitest-environment jsdom
 *
 * s123 (30 Sep 2026) — Innovation Agent Phase 2. The intro / meeting / pilot
 * sheet shows the agent's draft, lets the client edit it, sends exactly what
 * they see, shows a refusal in the client's words, and "Not now" dismisses. The
 * pipeline panel lists each startup at its stage with its next step and the
 * last-30-days counts. Asserted on the rendered components.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EngageSheet, PipelinePanel, toLocalInput } from '../../src/pages/dashboard/EngageAgents';

const introDraft = { startup_user_id: 7, name: 'Shelfco', message: 'Hello Shelfco team, we would like a short call.' };
const meetDraft = { startup_user_id: 7, name: 'Shelfco', title: 'Shelfco × Agency', description: 'Intro call', start_time: '2026-10-05T05:30:00.000Z', duration_min: 30, meeting_link: '' };
const sheet = (key, draft, over = {}) => ({
  offer: { key, subject: 'startup:7', label: 'Shelfco' },
  preview: vi.fn().mockResolvedValue({ id: 11, cost: 'Uses one connection request from your plan.', drafted_by: 'template', draft }),
  execute: vi.fn().mockResolvedValue({ result: { url: '/dashboard/network' } }),
  dismiss: vi.fn().mockResolvedValue({}), onClose: vi.fn(), onDone: vi.fn(), ...over,
});

describe('EngageSheet', () => {
  it('A7: shows the note (and says it is a plain one), sends what the client edited', async () => {
    const p = sheet('request_intro', introDraft);
    render(<EngageSheet {...p} />);
    const box = await screen.findByTestId('engage-message');
    expect(box.value).toBe(introDraft.message);
    expect(screen.getByTestId('engage-drafted-by').textContent).toMatch(/^A plain note/);
    expect(screen.getByTestId('engage-cost').textContent).toBe('Uses one connection request from your plan.');
    fireEvent.change(box, { target: { value: 'Hi Shelfco, a 20-minute call next week?' } });
    fireEvent.click(screen.getByTestId('engage-send'));
    await waitFor(() => expect(p.execute).toHaveBeenCalledWith(11, { ...introDraft, message: 'Hi Shelfco, a 20-minute call next week?' }));
    expect(p.preview).toHaveBeenCalledWith('request_intro', 'startup:7');
    await waitFor(() => expect(p.onDone).toHaveBeenCalled());
  });

  it('A8: the meeting fields; a refusal is shown in the client\'s words', async () => {
    const p = sheet('schedule_meeting', meetDraft, { execute: vi.fn().mockRejectedValue(new Error('Pick a start time in the future.')) });
    render(<EngageSheet {...p} />);
    expect((await screen.findByTestId('engage-title')).value).toBe('Shelfco × Agency');
    expect(screen.getByTestId('engage-start').value).toBe(toLocalInput(meetDraft.start_time));
    fireEvent.change(screen.getByTestId('engage-link'), { target: { value: 'https://meet.example/x' } });
    fireEvent.click(screen.getByTestId('engage-send'));
    expect((await screen.findByTestId('engage-error')).textContent).toBe('Pick a start time in the future.');
    expect(p.execute.mock.calls[0][1]).toMatchObject({ meeting_link: 'https://meet.example/x', duration_min: 30 });
    expect(p.onDone).not.toHaveBeenCalled();
  });

  it('"Not now" dismisses the proposal and closes', async () => {
    const p = sheet('start_pilot', { startup_user_id: 7, name: 'Shelfco', title: 'Pilot: Shelfco', notes: '' });
    render(<EngageSheet {...p} />);
    fireEvent.click(await screen.findByTestId('engage-not-now'));
    await waitFor(() => expect(p.dismiss).toHaveBeenCalledWith(11));
    expect(p.onClose).toHaveBeenCalled();
  });
});

describe('PipelinePanel', () => {
  it('lists each startup at its stage with its next step; the last 30 days; empty state', async () => {
    const data = { stages: { found: 1, intro: 1, meeting: 0, pilot: 1, decision: 0 }, last30: { intros: 1, meetings: 0, pilots: 1 }, items: [
      { startup_user_id: 3, name: 'Pilotco', stage: 'pilot', status: 'exploring', next: null },
      { startup_user_id: 2, name: 'Introco', stage: 'intro', status: 'accepted', next: { key: 'schedule_meeting', label: 'Schedule a meeting', subject: 'startup:2', stalled: true, why: 'Introco accepted your intro. Put a call in the diary.' } },
      { startup_user_id: 1, name: 'Foundco', stage: 'found', status: 'shortlisted', next: { key: 'request_intro', label: 'Request an intro', subject: 'startup:1', stalled: false, why: 'x' } },
    ] };
    const onAction = vi.fn();
    render(<MemoryRouter><PipelinePanel load={vi.fn().mockResolvedValue(data)} onAction={onAction} /></MemoryRouter>);
    const rows = await screen.findAllByTestId('pipeline-item');
    expect(rows.map(r => r.getAttribute('data-stage'))).toEqual(['pilot', 'intro', 'found']);
    expect(screen.getByTestId('pipeline-last30').textContent).toBe('Last 30 days: 1 intro · 0 meetings · 1 pilot');
    expect(screen.getAllByTestId('pipeline-stalled').map(s => s.textContent)).toEqual(['Introco accepted your intro. Put a call in the diary.']);
    fireEvent.click(screen.getAllByTestId('pipeline-next')[0]);
    expect(onAction).toHaveBeenCalledWith({ key: 'schedule_meeting', subject: 'startup:2', label: 'Introco' });
  });

  it('empty: says how startups get here', async () => {
    render(<MemoryRouter><PipelinePanel load={vi.fn().mockResolvedValue({ stages: {}, last30: { intros: 0, meetings: 0, pilots: 0 }, items: [] })} onAction={vi.fn()} /></MemoryRouter>);
    expect((await screen.findByTestId('pipeline-empty')).textContent).toMatch(/^Shortlist startups on your Innovation Agent page/);
  });
});
