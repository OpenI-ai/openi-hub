/**
 * @vitest-environment jsdom
 *
 * s116k — layer 3, page 3 of 3: StartupEvaluation.jsx (1,019 lines).
 *
 * WHAT THIS PINS: THE SCORE ARITHMETIC, and nothing else.
 *
 * This page produces a number that a corporate reads as a judgement about a
 * startup, and that number is exported into a branded PDF and a share link. It
 * is the one place in the three pages where a silent arithmetic change would
 * be believed rather than noticed — a wrong overall score looks exactly like a
 * plausible overall score.
 *
 * THE INVARIANT THAT MATTERS. overallScore averages the EIGHT VECTOR AVERAGES,
 * not the raw criteria (StartupEvaluation.jsx:603-617). Those are different
 * numbers whenever the evaluator has scored an uneven number of criteria per
 * vector, which is the normal case — People has 13 criteria and Strategic
 * Direction has 9. Flattening it to one average over all scored criteria is a
 * tempting simplification and would silently reweight every assessment toward
 * whichever vector the evaluator happened to fill in most.
 *
 * So the fixture is built to TELL THE TWO APART: two criteria at 5 in one
 * vector, one criterion at 1 in another.
 *
 *   by vector average   → (5 + 1) / 2      = 3.00   ← what the page must show
 *   by flat criteria    → (5 + 5 + 1) / 3  = 3.67
 *
 * A fixture with one criterion per vector would pass under both and prove
 * nothing. Same reasoning as the Marketplace total spec.
 *
 * SECOND INVARIANT: an UNSCORED vector is excluded from the overall, not
 * counted as zero (`.filter(v => v > 0)`). Six untouched vectors must not drag
 * a strong two-vector assessment toward zero — which is what a reasonable-
 * looking `Object.values(vectorScores)` without the filter would do.
 *
 * NOT COVERED, deliberately: saving, the AI draft, PDF export, share links,
 * past assessments, and the radar chart's SVG geometry. All are network or
 * presentation; none change the number.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/services/api', () => ({
  eightVectorSelfAPI: {
    listMine: vi.fn().mockResolvedValue([]),
    get: vi.fn(), create: vi.fn(), aiDraft: vi.fn(),
    listShares: vi.fn().mockResolvedValue([]), createShare: vi.fn(), revokeShare: vi.fn(),
    pdfUrl: vi.fn(() => '/pdf'),
  },
  startupAPI: { list: vi.fn().mockResolvedValue({ startups: [] }) },
  getToken: vi.fn(() => 'test-token'),
}));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

import StartupEvaluation from '../../src/pages/dashboard/StartupEvaluation';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/evaluation']}>
      <StartupEvaluation />
    </MemoryRouter>,
  );

/**
 * Click the score button `n` for the criterion labelled `criterion`.
 *
 * The score buttons carry no label beyond their digit and the criterion name
 * is a plain span, so there is no accessible relationship between them. This
 * walks up from the criterion's own text to the nearest ancestor that actually
 * contains buttons — the row — and scopes the query there. Walking up rather
 * than hard-coding a parent depth means a wrapper div added for layout does
 * not break every spec in this file.
 */
async function score(user, criterion, n) {
  let el = screen.getByText(criterion);
  while (el && el.querySelectorAll('button').length === 0) el = el.parentElement;
  if (!el) throw new Error(`no button row found for criterion "${criterion}"`);
  await user.click(within(el).getByRole('button', { name: String(n) }));
}

const overallCard = () =>
  screen.getByText(/overall score/i).parentElement;

beforeEach(() => { vi.clearAllMocks(); });

describe('StartupEvaluation — the overall score', () => {
  it('shows an em dash for BOTH the number and the band before anything is scored', () => {
    renderPage();
    // Two of them, not one: overallScore is null so the figure renders "—",
    // and scoreBand(null) independently returns the label "—" via its `!s`
    // guard. Asserting the count pins that both halves stay blank — a change
    // that made the band say "Needs Work" on an untouched form would be a
    // judgement about a startup nobody has assessed yet.
    expect(within(overallCard()).getAllByText('—')).toHaveLength(2);
  });

  it('averages VECTOR averages, not raw criteria', async () => {
    const user = userEvent.setup();
    renderPage();

    // People: two criteria at 5  → vector average 5
    await score(user, 'Articulated Values', 5);
    await score(user, 'ESOP', 5);
    // Strategic Direction: one criterion at 1 → vector average 1
    await score(user, '3-Year Plan', 1);

    // (5 + 1) / 2 = 3.00. A flat average over the three criteria would be 3.67.
    expect(within(overallCard()).getByText('3.00')).toBeInTheDocument();
    expect(within(overallCard()).queryByText('3.67')).not.toBeInTheDocument();
  });

  it('excludes untouched vectors instead of counting them as zero', async () => {
    const user = userEvent.setup();
    renderPage();

    // Two vectors scored at 4, six left untouched.
    await score(user, 'Articulated Values', 4);
    await score(user, '3-Year Plan', 4);

    // Counting the six untouched vectors as 0 would give 8/8 = 1.00.
    expect(within(overallCard()).getByText('4.00')).toBeInTheDocument();
  });

  it('renders to exactly two decimal places', async () => {
    const user = userEvent.setup();
    renderPage();

    // One vector: (5 + 4 + 4) / 3 = 4.333… → must display 4.33, not 4.3 or
    // 4.333333333333333.
    await score(user, 'Articulated Values', 5);
    await score(user, 'ESOP', 4);
    await score(user, 'Compensation', 4);

    expect(within(overallCard()).getByText('4.33')).toBeInTheDocument();
  });

  it('clears a criterion when its current score is clicked again', async () => {
    const user = userEvent.setup();
    renderPage();

    await score(user, 'Articulated Values', 5);
    await score(user, '3-Year Plan', 1);
    expect(within(overallCard()).getByText('3.00')).toBeInTheDocument();

    // Re-clicking 1 unsets it (onScore passes null when currentScore === n),
    // which empties the Strategic vector and should drop it back out of the
    // average entirely — leaving People's 5, not a 5-and-0 average of 2.50.
    await score(user, '3-Year Plan', 1);
    expect(within(overallCard()).getByText('5.00')).toBeInTheDocument();
  });
});

describe('StartupEvaluation — the score bands', () => {
  // scoreBand's thresholds are >= 4.5 Excellent, >= 3.5 Good, >= 2.5
  // Developing, else Needs Work. Each spec sits exactly ON a boundary, because
  // that is where a > / >= slip hides — a mid-band fixture would pass either
  // way.
  const bandFor = async (user, n) => {
    await score(user, 'Articulated Values', n);
    return overallCard();
  };

  it('labels exactly 5 as Excellent', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(within(await bandFor(user, 5)).getByText('Excellent')).toBeInTheDocument();
  });

  it('labels exactly 4 as Good', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(within(await bandFor(user, 4)).getByText('Good')).toBeInTheDocument();
  });

  it('labels exactly 3 as Developing', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(within(await bandFor(user, 3)).getByText('Developing')).toBeInTheDocument();
  });

  it('labels exactly 2 as Needs Work', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(within(await bandFor(user, 2)).getByText('Needs Work')).toBeInTheDocument();
  });

  it('puts the 4.5 boundary in Excellent, not Good', async () => {
    const user = userEvent.setup();
    renderPage();

    // (5 + 4) / 2 = 4.5 exactly — the >= boundary.
    await score(user, 'Articulated Values', 5);
    await score(user, 'ESOP', 4);

    const card = overallCard();
    expect(within(card).getByText('4.50')).toBeInTheDocument();
    expect(within(card).getByText('Excellent')).toBeInTheDocument();
  });
});
