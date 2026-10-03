/**
 * s127 (3 Oct 2026) — readable colours for the public pages (Rajeev: "fix the site-wide contrast in a separate PR").
 * axe (WCAG 2 AA: 4.5:1 for normal text) on the landing page flagged the brand gold used as TEXT: white on gold buttons
 * 2.1:1, gold on white 2.1:1, the footer's grey on dark 2.6:1. The brand gold stays as the BACKGROUND and accent
 * colour; only text on or in it changes.
 */
export const ON_GOLD = '#2A2A2E';      // text on a gold button / badge: ~8:1 (the landing CTAs already use it)
export const GOLD_TEXT = '#7a5f17';    // gold-family text on white or the light section background: ~5.5:1
export const FOOTER_TEXT = '#a8a8ae';  // footer text on DARK (#2E2E34): ~5.6:1 (was #6e6e6e, 2.64:1)
