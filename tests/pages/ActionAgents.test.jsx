/**
 * @vitest-environment jsdom
 *
 * s123 (30 Sep 2026) — action agents, A4 "Launch a challenge on this priority".
 * The agent drafts, the client edits, the cost is on the screen, and what is
 * saved is the client's edited draft; once saved, the chip links to it.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LaunchChallengeChip, LaunchChallengeSheet, InviteShortlistedChip, InviteShortlistedSheet } from '../../src/pages/dashboard/ActionAgents';

const offer = { key: 'launch_challenge', subject: 'interest:geo', label: 'GEO optimisation', cost: 'Free to save as a draft. Publishing it later uses one of your monthly challenges.', last: null };
const wrap = ui => render(<MemoryRouter>{ui}</MemoryRouter>);
const draft = { title: 'Brands in AI answers', problem_statement: 'Our clients are invisible in AI answers.', description: '', requirements: 'A product.', sectors: ['AdTech', 'AI'], priority: 'GEO optimisation' };

describe('LaunchChallengeChip', () => {
  it('offers to launch; once saved, links to the challenge instead', () => {
    const onOpen = vi.fn();
    const { rerender } = wrap(<LaunchChallengeChip offer={offer} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId('action-launch-challenge'));
    expect(onOpen).toHaveBeenCalledWith(offer);
    rerender(<MemoryRouter><LaunchChallengeChip offer={{ ...offer, last: { status: 'done', result: { url: '/dashboard/corporate/challenges/9' } } }} onOpen={onOpen} /></MemoryRouter>);
    expect(screen.getByTestId('action-challenge-open').getAttribute('href')).toBe('/dashboard/corporate/challenges/9');
  });
});

describe('LaunchChallengeSheet', () => {
  it('shows the agent\'s draft and the cost; saves the EDITED draft', async () => {
    const preview = vi.fn().mockResolvedValue({ id: 5, draft, drafted_by: 'agent', cost: offer.cost });
    const execute = vi.fn().mockResolvedValue({ status: 'ok', result: { challenge_id: 9 } });
    const onDone = vi.fn();
    wrap(<LaunchChallengeSheet offer={offer} preview={preview} execute={execute} dismiss={vi.fn()} onClose={vi.fn()} onDone={onDone} />);
    await waitFor(() => expect(screen.getByTestId('launch-title').value).toBe('Brands in AI answers'));
    expect(preview).toHaveBeenCalledWith('interest:geo');
    expect(screen.getByTestId('launch-drafted-by').textContent).toMatch(/^Drafted by OpenI's challenge drafter/);
    expect(screen.getByTestId('launch-cost').textContent).toBe(offer.cost);
    fireEvent.change(screen.getByTestId('launch-title'), { target: { value: 'Brands in AI answers — pilot' } });
    fireEvent.click(screen.getByTestId('launch-save'));
    await waitFor(() => expect(execute).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Brands in AI answers — pilot', sectors: ['AdTech', 'AI'] })));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith({ challenge_id: 9 }));
  });

  it('says so when the draft is only a template; shows why a save was refused', async () => {
    const preview = vi.fn().mockResolvedValue({ id: 6, draft: { ...draft, title: 'GEO optimisation — startup challenge' }, drafted_by: 'template', cost: offer.cost });
    const execute = vi.fn().mockRejectedValue(new Error('A title of at least 5 characters is needed.'));
    wrap(<LaunchChallengeSheet offer={offer} preview={preview} execute={execute} dismiss={vi.fn()} onClose={vi.fn()} onDone={vi.fn()} />);
    expect((await screen.findByTestId('launch-drafted-by')).textContent).toMatch(/plain starting point/);
    fireEvent.click(screen.getByTestId('launch-save'));
    expect((await screen.findByTestId('launch-errors')).textContent).toBe('A title of at least 5 characters is needed.');
  });

  it('"Not now" dismisses the suggestion and closes', async () => {
    const dismiss = vi.fn().mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    wrap(<LaunchChallengeSheet offer={offer} preview={vi.fn().mockResolvedValue({ id: 7, draft, drafted_by: 'agent', cost: offer.cost })} execute={vi.fn()} dismiss={dismiss} onClose={onClose} onDone={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('launch-not-now'));
    await waitFor(() => expect(dismiss).toHaveBeenCalledWith(7));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('A4b — InviteShortlisted', () => {
  const inv = { key: 'invite_shortlisted', subject: 'challenge:30', label: 'Cross media', cost: 'Free. Each startup you invite gets an email and a notification from OpenI.', last: null };
  const cands = [{ user_id: 1, name: 'Geoco', tagline: 'AI answers', match: 71 }, { user_id: 2, name: 'Vidco', tagline: null, match: null }];

  it('the chip says how many were invited once done, and still offers more', () => {
    wrap(<InviteShortlistedChip offer={{ ...inv, last: { status: 'done', result: { invited: 3 } } }} onOpen={vi.fn()} />);
    expect(screen.getByTestId('action-invite-shortlisted').textContent).toContain('Invited 3 · Invite more');
  });

  it('lists the candidates all ticked; unticking one sends only the rest, with the edited note', async () => {
    const preview = vi.fn().mockResolvedValue({ id: 11, cost: inv.cost, draft: { title: 'Cross media', candidates: cands, message: 'Please apply.' } });
    const execute = vi.fn().mockResolvedValue({ status: 'ok', result: { invited: 1, already_invited: 0 } });
    const onDone = vi.fn();
    wrap(<InviteShortlistedSheet offer={inv} preview={preview} execute={execute} dismiss={vi.fn()} onClose={vi.fn()} onDone={onDone} />);
    const rows = await screen.findAllByTestId('invite-candidate');
    expect(rows[0].textContent).toContain('Geoco · 71% match');
    expect(screen.getByTestId('invite-send').textContent).toBe('Send 2 invites');
    expect(screen.getByTestId('invite-cost').textContent).toBe(inv.cost);
    fireEvent.click(rows[1].querySelector('input'));
    expect(screen.getByTestId('invite-send').textContent).toBe('Send 1 invite');
    fireEvent.change(screen.getByTestId('invite-message'), { target: { value: 'Keen to meet you.' } });
    fireEvent.click(screen.getByTestId('invite-send'));
    await waitFor(() => expect(execute).toHaveBeenCalledWith(11, { user_ids: [1], message: 'Keen to meet you.' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('nobody left to invite: says so, no Send button', async () => {
    wrap(<InviteShortlistedSheet offer={inv} preview={vi.fn().mockResolvedValue({ id: 12, cost: inv.cost, draft: { title: 'x', candidates: [], message: '' } })}
      execute={vi.fn()} dismiss={vi.fn()} onClose={vi.fn()} onDone={vi.fn()} />);
    expect((await screen.findByTestId('invite-empty')).textContent).toMatch(/already invited or has applied/);
    expect(screen.queryByTestId('invite-send')).toBeNull();
  });

  it('a refused send shows why', async () => {
    const preview = vi.fn().mockResolvedValue({ id: 13, cost: inv.cost, draft: { title: 'x', candidates: cands, message: '' } });
    wrap(<InviteShortlistedSheet offer={inv} preview={preview} execute={vi.fn().mockRejectedValue(new Error('Invitation cannot be sent because the challenge is closed'))}
      dismiss={vi.fn()} onClose={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('invite-send'));
    expect((await screen.findByTestId('invite-error')).textContent).toBe('Invitation cannot be sent because the challenge is closed');
  });
});
