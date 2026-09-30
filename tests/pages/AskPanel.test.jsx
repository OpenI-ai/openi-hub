/**
 * @vitest-environment jsdom
 *
 * s123 (30 Sep 2026) — "Ask OpenI" inside the brief. The answer IS the startups
 * the analyst kept, each with its reason; "nothing fits" says so and offers to
 * add the question as a priority; an unchecked search shows nothing. Asserted
 * on the rendered panel.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AskPanel, { answerSummary } from '../../src/pages/dashboard/AskPanel';

const Q = 'Who does shoppable video for quick commerce?';
const hit = (id, name, extra = {}) => ({ user_id: id, name, tagline: 'Shoppable video', sector: 'AdTech', country: 'India', relationship: 'Partner', match: 62, reason: `${name} fits.`, ...extra });
const wrap = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('answerSummary', () => {
  it('says how many fit, or that nothing does, or that nothing could be checked', () => {
    expect(answerSummary({ answer: [hit(1, 'A')] })).toBe('1 startup on OpenI fits this, each checked by OpenI\'s analyst.');
    expect(answerSummary({ answer: [hit(1, 'A'), hit(2, 'B')] })).toBe('2 startups on OpenI fit this, each checked by OpenI\'s analyst.');
    expect(answerSummary({ answer: [] })).toBe('Nothing on OpenI fits this yet.');
    expect(answerSummary({ unchecked: true, answer: [] })).toMatch(/could not check the results just now, so none are shown/);
  });
});

describe('AskPanel', () => {
  it('asks, shows each startup with its reason and match, and shortlists one', async () => {
    const ask = vi.fn().mockResolvedValue({ question: Q, queries: ['quick commerce video ads'], answer: [hit(7, 'Shopvid'), hit(8, 'Kwonly', { match: null })] });
    const shortlist = vi.fn().mockResolvedValue({});
    wrap(<AskPanel load={vi.fn().mockResolvedValue({ asks: [] })} ask={ask} shortlist={shortlist} />);
    fireEvent.change(screen.getByTestId('ask-input'), { target: { value: Q } });
    fireEvent.click(screen.getByTestId('ask-submit'));
    await waitFor(() => expect(ask).toHaveBeenCalledWith(Q));
    const rows = await screen.findAllByTestId('ask-startup');
    expect(rows[0].textContent).toContain('Shopvid');
    expect(rows[0].textContent).toContain('62% match');
    expect(rows[0].textContent).toContain('Why: Shopvid fits.');
    expect(rows[1].textContent, 'a keyword match shows no %').not.toContain('% match');
    expect(screen.getByTestId('ask-summary').textContent).toBe('2 startups on OpenI fit this, each checked by OpenI\'s analyst.');
    fireEvent.click(screen.getAllByTestId('ask-shortlist')[0]);
    await waitFor(() => expect(shortlist).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.getAllByTestId('ask-shortlist')[0].textContent).toContain('Shortlisted'));
  });

  it('nothing fits: says so, and offers to add the question as a priority', async () => {
    const addPriority = vi.fn();
    wrap(<AskPanel load={vi.fn().mockResolvedValue({ asks: [] })} ask={vi.fn().mockResolvedValue({ question: 'basket weaving', queries: [], answer: [] })} addPriority={addPriority} />);
    fireEvent.change(screen.getByTestId('ask-input'), { target: { value: 'basket weaving' } });
    fireEvent.click(screen.getByTestId('ask-submit'));
    fireEvent.click(await screen.findByTestId('ask-add-priority'));
    expect(addPriority).toHaveBeenCalledWith('basket weaving');
    expect(screen.queryAllByTestId('ask-startup')).toHaveLength(0);
  });

  it('Brief Preview: no Shortlist or Add-as-priority (those are the client\'s own actions)', async () => {
    wrap(<AskPanel client="Dentsu" load={vi.fn().mockResolvedValue({ asks: [] })} ask={vi.fn().mockResolvedValue({ question: Q, answer: [hit(7, 'Shopvid')] })} />);
    fireEvent.change(screen.getByTestId('ask-input'), { target: { value: Q } });
    fireEvent.click(screen.getByTestId('ask-submit'));
    await screen.findAllByTestId('ask-startup');
    expect(screen.queryByTestId('ask-shortlist')).toBeNull();
  });

  it('earlier questions are listed under "Earlier questions"; a too-short question cannot be sent', async () => {
    wrap(<AskPanel load={vi.fn().mockResolvedValue({ asks: [{ question: 'older one', answer: [hit(1, 'Oldco')] }] })} ask={vi.fn()} />);
    expect((await screen.findByTestId('ask-earlier')).textContent).toContain('Earlier questions (1)');
    fireEvent.change(screen.getByTestId('ask-input'), { target: { value: 'ab' } });
    expect(screen.getByTestId('ask-submit')).toBeDisabled();
  });
});
