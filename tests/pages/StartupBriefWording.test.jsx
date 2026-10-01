/**
 * @vitest-environment jsdom
 *
 * s125 (1 Oct 2026) — Rajeev's screenshots of a startup's brief: wording written for buyers ("As you shortlist and
 * pass on startups", "from what you shortlist and pass on") does not belong there — a startup shortlists no startups.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KnowsPanel from '../../src/pages/dashboard/KnowsPanel';
import LandscapePanel from '../../src/pages/dashboard/LandscapePanel';

const knows = { profile: [{ label: 'Company', value: 'Amber' }], stated: { priorities: [], challenges: [] }, research: null, learned: { insights: [], maps: [] } };
const landscape = { dimensions: [], unmapped: ['Quantum Tech'] };
const built = { maps: [{ label: 'Quantum Technology', source: 'Quantum Tech', members: 3 }] };

describe('a startup brief has no buyer wording', () => {
  it('Knows: the empty "Learned from what you do" box is not shown to a startup; a buyer still sees it', async () => {
    const { unmount } = render(<MemoryRouter><KnowsPanel load={async () => knows} refresh={vi.fn()} startup /></MemoryRouter>);
    await screen.findByText('Amber');
    expect(screen.queryByTestId('knows-learned')).toBeNull();
    expect(document.body.textContent).not.toMatch(/shortlist and pass on/);
    unmount();
    render(<MemoryRouter><KnowsPanel load={async () => knows} refresh={vi.fn()} /></MemoryRouter>);
    expect((await screen.findByTestId('knows-learned')).textContent).toMatch(/As you shortlist and pass on startups/);
  });

  it('Landscape: after building maps a startup is not told about shortlisting; a buyer is', async () => {
    const { unmount } = render(<MemoryRouter><LandscapePanel load={async () => landscape} build={async () => built} startup /></MemoryRouter>);
    fireEvent.click(await screen.findByTestId('build-maps'));
    await waitFor(() => expect(document.body.textContent).toMatch(/Built a map: "Quantum Technology" \(3 startups\)\. OpenI keeps it up to date every night\./));
    expect(document.body.textContent).not.toMatch(/shortlist and pass on/);
    unmount();
    render(<MemoryRouter><LandscapePanel load={async () => landscape} build={async () => built} /></MemoryRouter>);
    fireEvent.click(await screen.findByTestId('build-maps'));
    await waitFor(() => expect(document.body.textContent).toMatch(/from what you shortlist and pass on\./));
  });
});
