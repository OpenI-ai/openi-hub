/**
 * @vitest-environment jsdom
 *
 * 30 Sep 2026 (s123) — Rajeev on Dentsu's challenge section, which showed NO
 * startups: "OpenI has few strong matches for this yet" is the wrong word for
 * zero — "it should say not yet". Asserted on the rendered note.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GapNote, EmptyBriefNote } from '../../src/pages/dashboard/InnovationBrief';

describe('GapNote', () => {
  it('an empty section says "not yet", never "few"', () => {
    render(<GapNote s={{ gap: true, title: 'Cross media campaign optimization', items: [] }} />);
    const t = screen.getByTestId('brief-gap').textContent;
    expect(t).toMatch(/No startup for this yet\./);
    expect(t).not.toMatch(/few/i);
    expect(t).toMatch(/Scout searches for it first in tonight's crawl/);
  });

  it('a thin section counts what it shows', () => {
    render(<GapNote s={{ gap: true, title: 'GEO', items: [{ user_id: 1 }] }} />);
    expect(screen.getByTestId('brief-gap').textContent).toMatch(/^Only 1 strong match so far\. Scout searches for more/);
  });

  it('says nothing when the section is not thin', () => {
    const { container } = render(<GapNote s={{ gap: false, items: [] }} />);
    expect(container.textContent).toBe('');
  });
});

// s125 — Rajeev's screenshot: a startup with a full profile was told "Your brief needs a little more to go on".
describe('EmptyBriefNote', () => {
  it('a startup is not told its profile is thin (its agent card above says what matches)', () => {
    const { container } = render(<MemoryRouter><EmptyBriefNote startup /></MemoryRouter>);
    expect(container.textContent).toBe('');
  });
  it('a company still is, with "or post a challenge"', () => {
    render(<MemoryRouter><EmptyBriefNote corporate /></MemoryRouter>);
    expect(screen.getByTestId('brief-empty').textContent).toMatch(/Your agent needs a little more to go on\..*or post a challenge/);
  });
});
