/**
 * s116k — the startup count is a FLOOR claim, everywhere it appears.
 *
 * WHY THIS EXISTS. The public startup count is the site's primary
 * proof-of-scale claim, and it had drifted FALSE: five places said "575K+" or
 * "575,000+" while the backend counted 574K+. 574,xxx is not 575,000+.
 *
 * The subtle part is the DIRECTION of drift. An exact count written into the
 * bundle is normally just stale — an understatement that quietly ages. Here it
 * ages the other way: dedup merges accounts (802 groups at s111), so the true
 * count goes DOWN as well as up, and a hardcoded exact figure turns into an
 * OVERCLAIM rather than an old one. That is a different kind of wrong on a page
 * whose whole job is to be believed.
 *
 * So every hardcoded copy is now a floor. This spec pins two properties:
 *
 *   1. The floor is stated as a floor — a "+" claim, never a bare number.
 *   2. No copy exceeds the floor. A future edit that bumps one site to an exact
 *      current figure fails here rather than shipping a false claim.
 *
 * It deliberately does NOT assert the exact value. Raising the floor when the
 * platform genuinely grows is a decision, and this spec should not turn that
 * decision into a chore. It only forbids claiming MORE than the agreed floor.
 *
 * NOT a substitute for the live count. Landing.jsx overlays the real DB figure
 * as soon as /landing-content answers; these strings are what a visitor sees
 * before that, and what a prerendered snapshot bakes into static HTML that
 * search engines then index. The FAQ page is prerendered, which is why its
 * copy is covered here too.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_STATS } from '../../src/pages/auth/landingParts/constants.js';

// The agreed floor. Raise deliberately, in big jumps, when the platform has
// clearly cleared the next round number — never to track the live count.
const FLOOR_THOUSANDS = 570;

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

/**
 * Strip comments before scanning for claims.
 *
 * This spec is about what a VISITOR reads, and a comment is not that. Without
 * this the guard fails on its own documentation: the comment explaining why
 * 575K+ was wrong necessarily contains the string "575K+".
 *
 * Only block comments and lines that BEGIN with `//` are removed. Cutting at
 * any mid-line `//` would also truncate URLs inside string literals, and a
 * claim sitting after one on the same line would then go unchecked — a guard
 * that silently stops looking is worse than one that never existed.
 */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

// Every file that states the count in its own words rather than reading it
// from the API. Add to this list rather than writing a new bare number.
const COPY_FILES = [
  'src/pages/auth/landingParts/constants.js',
  'src/pages/public/PublicFAQ.jsx',
  'src/config/tourData/pagesAdminPublic.js',
];

describe('the public startup count is a floor claim', () => {
  it('states Global Startups as a "+" floor, not a bare number', () => {
    const stat = DEFAULT_STATS.find((s) => s.label === 'Global Startups');
    expect(stat).toBeDefined();
    expect(stat.value).toMatch(/\+$/);
  });

  it('does not claim more than the agreed floor in DEFAULT_STATS', () => {
    const stat = DEFAULT_STATS.find((s) => s.label === 'Global Startups');
    const thousands = parseInt(stat.value.replace(/[^0-9]/g, ''), 10);
    expect(thousands).toBeLessThanOrEqual(FLOOR_THOUSANDS);
  });

  it('does not claim more than the floor in any hand-written copy', () => {
    // Matches both spellings the codebase uses: "574K+" and "574,000+".
    const claims = [];
    for (const file of COPY_FILES) {
      const src = stripComments(read(file));
      for (const m of src.matchAll(/\b(\d{3}),000\+/g)) {
        claims.push({ file, text: m[0], thousands: parseInt(m[1], 10) });
      }
      for (const m of src.matchAll(/\b(\d{3})K\+/g)) {
        claims.push({ file, text: m[0], thousands: parseInt(m[1], 10) });
      }
    }

    // Guard against the spec silently covering nothing — if the copy is ever
    // reworded so no claim matches, this fails loudly instead of passing.
    expect(claims.length).toBeGreaterThan(0);

    const over = claims.filter((c) => c.thousands > FLOOR_THOUSANDS);
    expect(over, `claims above the ${FLOOR_THOUSANDS}K floor: ${JSON.stringify(over)}`)
      .toEqual([]);
  });

  it('keeps the Global Startups label byte-exact, because the live overlay matches on it', () => {
    // Landing.jsx finds the live DB value by matching this label string. Rename
    // it and the overlay silently stops applying — the page would then show the
    // floor for ever and nobody would see an error.
    expect(DEFAULT_STATS.some((s) => s.label === 'Global Startups')).toBe(true);
  });
});
