/**
 * Phase 167 (W5-4) — src/pages/auth/Landing.jsx was 1,302 lines.
 * Same convention as apiDomains/ (Phase 164), corporateChallenges/ (165) and
 * settingsTabs/ (166): a sibling directory of VERBATIM slices behind a barrel.
 *
 * LAYOUT (ranges are into the PRE-SPLIT Landing.jsx)
 *   constants.js        16-22, 24-33, 52-96   ICON_MAP, colours, DEFAULT_*
 *   icons.jsx           35-50                 LinkedInIcon, XIcon
 *   cards.jsx           98-305                8 components + gstAnnotation
 *   LandingHeader.jsx   366-533               sticky header + mobile drawer
 *   LandingFooter.jsx   1209-1296             footer + ISO 27001 strip
 *
 * INVARIANTS
 *  1. Every block between the BODY sentinel comments is a byte-identical
 *     slice of the pre-split file at the stated range. Re-indenting one
 *     breaks the audit trail — which is why the two JSX slices sit at their
 *     original 6-space indent inside a 2-space function body.
 *  2. statValue and the (misplaced) LANDING PAGE banner above it stay on the
 *     PAGE, not here. Keeping them makes the module-level removal a single
 *     contiguous range 16-306 and leaves the banner where it reads correctly.
 *  3. cards.jsx is intentionally ONE slice, not eight files: 98-305 is
 *     contiguous, PricingCard calls gstAnnotation, and PartnerLogo owns a
 *     useState. Splitting it would add edges and lose (1).
 *  4. icons.jsx is shared, not duplicated — header and footer both render
 *     LinkedInIcon/XIcon. Local XIcon != lucide X (the header close glyph).
 *  5. Directory is landingParts, not landing: APFS is case-insensitive and
 *     extension resolution beats directory-index resolution, so './landing'
 *     next to Landing.jsx resolves to the page itself. The '/index.js' suffix
 *     on every import is required for the same reason.
 *  6. Paths to src/components and src/services are THREE dots from here.
 *
 * VERIFY (from the repo root, against the pre-split blob):
 *   git show <pre-split-sha>:src/pages/auth/Landing.jsx > /tmp/orig.jsx
 *   then compare each sentinel-delimited block to sed -n 'A,Bp' /tmp/orig.jsx
 */
export {
  ICON_MAP,
  GOLD, GOLD_DARK, GOLD_DEEP, GOLD_LIGHT, BLUE, DARK, GRAY, LIGHT_GRAY, BORDER,
  DEFAULT_STATS, DEFAULT_PARTNERS, DEFAULT_FAQS, DEFAULT_SERVICES,
} from './constants.js';
export { LinkedInIcon, XIcon } from './icons.jsx';
export {
  Section, PartnerLogo, FeatureCard, gstAnnotation,
  PricingCard, Step, PersonaListItem, FAQItem,
} from './cards.jsx';
export { default as LandingHeader } from './LandingHeader.jsx';
export { default as LandingFooter } from './LandingFooter.jsx';
