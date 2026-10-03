/**
 * s127 (3 Oct 2026) — readable text on the public pages (Rajeev: "fix the site-wide contrast in a separate PR").
 * axe (WCAG 2 AA) flagged the brand gold used as TEXT. These pin the replacement colours at 4.5:1 or better
 * (normal-size text), computed with the WCAG relative-luminance formula.
 */
import { describe, it, expect } from 'vitest';
import { ON_GOLD, GOLD_TEXT, FOOTER_TEXT } from '../../src/pages/auth/landingParts/contrast.js';

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

describe('public-page text colours meet WCAG AA (4.5:1)', () => {
  it('text on the brand gold buttons (both golds in use)', () => {
    for (const gold of ['#D3AD5B', '#D0A848']) expect(ratio(ON_GOLD, gold)).toBeGreaterThanOrEqual(4.5);
  });
  it('gold-family text on white and on the light section background', () => {
    for (const bg of ['#FFFFFF', '#F3F0EA', '#EFE8D9']) expect(ratio(GOLD_TEXT, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('footer text on the dark footer', () => {
    expect(ratio(FOOTER_TEXT, '#2E2E34')).toBeGreaterThanOrEqual(4.5);
  });
  it('the old colours really failed (the test can tell)', () => {
    expect(ratio('#FFFFFF', '#D3AD5B')).toBeLessThan(4.5);
    expect(ratio('#6E6E6E', '#2E2E34')).toBeLessThan(4.5);
  });
});
