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
import { LaunchChallengeChip, LaunchChallengeSheet, InviteShortlistedChip, InviteShortlistedSheet, EvaluationNote } from '../../src/pages/dashboard/ActionAgents';
import { BriefCard } from '../../src/pages/dashboard/InnovationBrief';

const offer = { key: 'launch_challenge', subject: 'interest:geo', label: 'GEO optimisation', cost: 'Free to save as a draft. Publishing it later uses one of your monthly challenges.', last: null };
const wrap = ui => render(<MemoryRouter>{ui}</MemoryRouter>);
const draft = { title: 'Brands in AI answers', problem_statement: 'Our clients are invisible in AI answers.', description: '', requirements: 'A product.', sectors: ['AdTech', 'AI'], priority: 'GEO optimisation' };

describe('LaunchChallengeChip', () => {
  it('offers to launch; once saved, links to the challenge instead', () => {
    const onOpen = vi.fn();
    const { rerender } = wrap(<LaunchChallengeChip offer={offer} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId('action-launch-challenge'));
    expect(onOpen).toHaveBeenCalledWith(offer);
    rerender(<MemoryRouter><LaunchChallengeChip offer={{ ...offer, last: { status: 'done', result: { url: '/dashboard/corporate/challenges/9', launched: true } } }} onOpen={onOpen} /></MemoryRouter>);
    expect(screen.getByTestId('action-challenge-open').getAttribute('href')).toBe('/dashboard/corporate/challenges/9');
    expect(screen.getByTestId('action-challenge-open').textContent).toBe('Challenge launched · Open');
  });
});

describe('LaunchChallengeSheet — the whole challenge, then just Launch', () => {
  const full = { ...draft, description: 'A pilot with two clients.', timeline: 'Pilot of 8 weeks', deadline: '2026-11-14', challenge_type: 'source',
    functions: ['Marketing'], technologies: [], usecases: [],
    rfi_questions: [{ id: 'rfi_1', type: 'text', question: 'How do you measure brand presence?', options: [] }],
    faqs: [{ question: 'Who can apply?', answer: 'Any startup on OpenI.' }] };
  const cost = 'Launching uses one of your monthly challenges; startups on OpenI can see it and apply straight away. Saving it as a draft instead is free.';

  it('shows the complete challenge as startups will see it, and the cost; Launch sends it with launch: true', async () => {
    const preview = vi.fn().mockResolvedValue({ id: 5, draft: full, drafted_by: 'agent', cost });
    const execute = vi.fn().mockResolvedValue({ status: 'ok', result: { challenge_id: 9, launched: true } });
    const onDone = vi.fn();
    wrap(<LaunchChallengeSheet offer={offer} preview={preview} execute={execute} dismiss={vi.fn()} onClose={vi.fn()} onDone={onDone} />);
    const pv = await screen.findByTestId('launch-preview');
    expect(preview).toHaveBeenCalledWith('interest:geo');
    for (const text of ['Brands in AI answers', 'Source', 'Pilot of 8 weeks', 'Our clients are invisible in AI answers.', 'A pilot with two clients.',
      'AdTech', 'Marketing', 'How do you measure brand presence?', 'Who can apply?']) expect(pv.textContent).toContain(text);
    expect(screen.getByTestId('launch-drafted-by').textContent).toMatch(/filled in the whole challenge\. Review it and press Launch/);
    expect(screen.getByTestId('launch-cost').textContent).toBe(cost);
    fireEvent.click(screen.getByTestId('launch-go'));
    await waitFor(() => expect(execute).toHaveBeenCalledWith(5, { ...full, launch: true }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith({ challenge_id: 9, launched: true }));
  });

  it('Edit details, then "Save as draft instead" sends the EDITED challenge with launch: false', async () => {
    const execute = vi.fn().mockResolvedValue({ status: 'ok', result: { challenge_id: 9, launched: false } });
    wrap(<LaunchChallengeSheet offer={offer} preview={vi.fn().mockResolvedValue({ id: 5, draft: full, drafted_by: 'agent', cost })} execute={execute}
      dismiss={vi.fn()} onClose={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('launch-edit-toggle'));
    fireEvent.change(screen.getByTestId('launch-title'), { target: { value: 'Brands in AI answers — pilot' } });
    const q = screen.getByTestId('launch-questions');
    fireEvent.change(q, { target: { value: 'First question here?\nSecond question here?' } });
    fireEvent.blur(q);
    fireEvent.click(screen.getByTestId('launch-save'));
    await waitFor(() => expect(execute).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Brands in AI answers — pilot', launch: false,
      rfi_questions: [{ question: 'First question here?' }, { question: 'Second question here?' }] })));
  });

  // Rajeev (1 Oct): "difficult to spot edit details" — a bordered button above the challenge, and one beside Launch.
  it('"Edit details" is a real button above the challenge and beside Launch; either opens the editor', async () => {
    wrap(<LaunchChallengeSheet offer={offer} preview={vi.fn().mockResolvedValue({ id: 5, draft: full, drafted_by: 'agent', cost })} execute={vi.fn()}
      dismiss={vi.fn()} onClose={vi.fn()} onDone={vi.fn()} />);
    const top = await screen.findByTestId('launch-edit-top');
    expect(top.textContent).toBe(' Edit details');
    expect(top.querySelector('svg')).not.toBeNull();
    expect(screen.getByTestId('launch-edit-toggle').parentElement).toBe(screen.getByTestId('launch-go').parentElement);
    fireEvent.click(top);
    expect(screen.getByTestId('launch-title')).toBeTruthy();
    expect(screen.getByTestId('launch-edit-top').textContent).toBe(' Show it as startups will see it');
  });

  it('says so when the draft is only a template; shows why a launch was refused (e.g. no challenge left this month)', async () => {
    const preview = vi.fn().mockResolvedValue({ id: 6, draft: { ...full, title: 'GEO optimisation — startup challenge' }, drafted_by: 'template', cost });
    const execute = vi.fn().mockRejectedValue(new Error('Plan limit reached for challenge create. You have used 1/1 this month. You can save it as a draft instead and launch it later.'));
    wrap(<LaunchChallengeSheet offer={offer} preview={preview} execute={execute} dismiss={vi.fn()} onClose={vi.fn()} onDone={vi.fn()} />);
    expect((await screen.findByTestId('launch-drafted-by')).textContent).toMatch(/complete starting point/);
    fireEvent.click(screen.getByTestId('launch-go'));
    expect((await screen.findByTestId('launch-errors')).textContent).toMatch(/You can save it as a draft instead/);
  });

  it('"Not now" dismisses the suggestion and closes', async () => {
    const dismiss = vi.fn().mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    wrap(<LaunchChallengeSheet offer={offer} preview={vi.fn().mockResolvedValue({ id: 7, draft: full, drafted_by: 'agent', cost })} execute={vi.fn()} dismiss={dismiss} onClose={onClose} onDone={vi.fn()} />);
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

describe('A5 — Evaluate with AI', () => {
  const item = { type: 'startup', user_id: 7, name: 'Geoco', why: 'Fits.', match: 60, priority_key: 'interest:geo' };
  it('the note shows the score, the platform\'s recommendation, why, and up to two concerns', () => {
    render(<EvaluationNote evaluation={{ overall_score: 3.8, recommended_action: 'evaluate', explanation: 'Fits; little evidence.', red_flags: ['No customers', 'Tiny team', 'Third'] }} />);
    const n = screen.getByTestId('ai-evaluation').textContent;
    expect(n).toContain('AI evaluation: 3.8/5 · Worth a closer look');
    expect(n).toContain('Fits; little evidence.');
    expect(n).toContain('Watch out: No customers; Tiny team');
    expect(n).not.toContain('Third');
  });
  it('the card offers it with the cost; once evaluated it offers to evaluate again', () => {
    const onEvaluate = vi.fn();
    const { rerender } = wrap(<BriefCard item={item} onShortlist={vi.fn()} onDismiss={vi.fn()} onEvaluate={onEvaluate} />);
    expect(screen.getByTestId('ai-evaluate').textContent).toBe(' Evaluate with AI · 5 credits');
    fireEvent.click(screen.getByTestId('ai-evaluate'));
    expect(onEvaluate).toHaveBeenCalledWith(item);
    rerender(<MemoryRouter><BriefCard item={item} onShortlist={vi.fn()} onDismiss={vi.fn()} onEvaluate={onEvaluate}
      evaluation={{ overall_score: 4.1, recommended_action: 'shortlist', explanation: 'Strong.' }} /></MemoryRouter>);
    expect(screen.getByTestId('ai-evaluate').textContent).toBe(' Evaluate again · 5 credits');
    expect(screen.getByTestId('ai-evaluation').textContent).toContain('4.1/5 · Shortlist it');
  });
  it('no button where it is not offered (not a company, or a read-only card)', () => {
    wrap(<BriefCard item={item} onShortlist={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId('ai-evaluate')).toBeNull();
  });
});
