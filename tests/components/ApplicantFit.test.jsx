/**
 * @vitest-environment jsdom
 *
 * s127 (3 Oct 2026) — applicant triage (G4): each applicant's fit badge + reasons, and "Best fit first".
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FitBadge, FitReasons, sortByFit } from '../../src/components/ApplicantFit';

describe('ApplicantFit', () => {
  it('sortByFit: highest fit first, ties and unscored keep their order, unscored last', () => {
    const apps = [{ id: 1, fit: 40 }, { id: 2 }, { id: 3, fit: 88 }, { id: 4, fit: 40 }, { id: 5 }];
    expect(sortByFit(apps).map(a => a.id)).toEqual([3, 1, 4, 2, 5]);
    expect(sortByFit(null)).toEqual([]);
    expect(apps.map(a => a.id)).toEqual([1, 2, 3, 4, 5]);   // never sorts in place
  });
  it('badge: label + number, reasons as a tooltip and a line; nothing without a fit', () => {
    const app = { fit: 82, fit_band: 'strong', fit_label: 'Strong fit', fit_reasons: ['Like applicants you shortlisted', 'Matches your IoT'] };
    render(<><FitBadge app={app} /><FitReasons app={app} /></>);
    expect(screen.getByTestId('applicant-fit').textContent).toBe('Strong fit 82');
    expect(screen.getByTestId('applicant-fit').getAttribute('title')).toBe('Like applicants you shortlisted · Matches your IoT');
    expect(screen.getByTestId('applicant-fit-reasons').textContent).toBe('Like applicants you shortlisted · Matches your IoT');
  });
  it('renders nothing for an applicant without a fit', () => {
    const { container } = render(<><FitBadge app={{}} /><FitReasons app={{ fit_reasons: [] }} /></>);
    expect(container.innerHTML).toBe('');
  });
});
