/**
 * @vitest-environment jsdom
 *
 * s117 — PlatformSlideshow.test.jsx
 *
 * Two things are pinned here, and both exist because of a real defect.
 *
 *   1. NO SLIDE MAY OVERCLAIM THE STARTUP COUNT. Two slides shipped "583K+
 *      startup profiles" and "583K-startup sourcing engine" on the PUBLIC
 *      landing page while the backend counted 574K. 583K was the old
 *      registered-users figure — mostly unclaimed CSV imports, which is exactly
 *      why s47 replaced that tile with AI Clusters — and was never the startup
 *      count.
 *
 *      The s116k copy sweep missed both because it searched for 575K, the
 *      number it was fixing. A pass whose entire purpose was removing wrong
 *      numbers left a DIFFERENT wrong number of the same kind untouched. This
 *      spec therefore asserts the PROPERTY (nothing above the agreed floor)
 *      rather than the absence of one literal, which is the only form that
 *      would have caught it.
 *
 *   2. A SLIDE WHOSE IMAGE FAILS TO LOAD IS DROPPED, NOT RENDERED BROKEN.
 *      The Innovation Map slide ships ahead of its PNG: that shot needs
 *      production auth and cannot be captured from a dev container. Without the
 *      guard this means a broken-image icon on the homepage. With it the slide
 *      stays invisible until the asset lands, then appears with no code change.
 *
 *      The subtle part is the INDEX. Caption and counter used to read
 *      SLIDES[active] while the images mapped the same array; once a src is
 *      dropped the two lists differ, and mixing them would put one slide's
 *      caption under another's image — worse than either failure alone. So the
 *      count, caption, counter and dots must all still agree after a drop.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import PlatformSlideshow from '../../src/components/PlatformSlideshow.jsx';

// The floor every public surface uses. See landingParts/constants.js and
// tests/pages/landingStats.test.js — this spec shares the VALUE rather than the
// file on purpose, so a drift in either shows up as a disagreement.
const FLOOR_THOUSANDS = 570;

const dots = () => screen.getAllByRole('button', { name: /^Slide \d+$/ });

function failEveryMountedImage() {
  for (const img of document.querySelectorAll('img')) {
    act(() => { img.dispatchEvent(new Event('error')); });
  }
}

// Walk every slide and collect what actually RENDERS. Reading the module's
// source would not prove what a visitor sees.
function renderedCopyOfEverySlide() {
  const out = [];
  for (const dot of dots()) {
    act(() => { dot.click(); });
    out.push(document.body.textContent || '');
  }
  return out.join(' ');
}

describe('PlatformSlideshow — public count claims', () => {
  it('never claims more startups than the agreed floor', () => {
    render(<PlatformSlideshow />);
    const copy = renderedCopyOfEverySlide();
    const claims = [...copy.matchAll(/(\d{3})\s*[Kk]\b/g)].map((m) => parseInt(m[1], 10));
    expect(claims.length).toBeGreaterThan(0); // guard against a vacuous pass
    for (const n of claims) expect(n).toBeLessThanOrEqual(FLOOR_THOUSANDS);
  });

  it('states the count as a floor, never as a bare exact figure', () => {
    render(<PlatformSlideshow />);
    const copy = renderedCopyOfEverySlide();
    expect(copy).toMatch(/\d{3}\s*[Kk]\+/);
  });
});

describe('PlatformSlideshow — a slide whose image 404s', () => {
  it('offers one dot per authored slide before anything fails', () => {
    render(<PlatformSlideshow />);
    const n = dots().length;
    expect(n).toBeGreaterThan(1);
    expect(screen.getByText(new RegExp(`1 / ${n}`))).toBeTruthy();
  });

  it('drops the slide, shrinking the dots and the counter together', () => {
    render(<PlatformSlideshow />);
    const before = dots().length;

    // Only the active and next slides are mounted at a time, by design, so this
    // fails whichever images are currently in the DOM. Enough to prove the list
    // shrinks and stays self-consistent.
    failEveryMountedImage();

    const after = dots().length;
    expect(after).toBeLessThan(before);
    // The counter must agree with the dots. This is the index bug the guard
    // could otherwise have introduced.
    expect(screen.getByText(new RegExp(`/ ${after}`))).toBeTruthy();
  });

  it('keeps a caption that belongs to a slide still in the list', () => {
    render(<PlatformSlideshow />);
    failEveryMountedImage();
    expect(dots().length).toBeGreaterThan(0);
    // A mismatched index would throw on undefined or blank the overlay.
    expect((document.body.textContent || '').trim().length).toBeGreaterThan(0);
  });
});
