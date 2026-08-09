/**
 * OpenI Hub - StartupProfile helper barrel (Phase 163, 9 Aug 2026).
 *
 * src/pages/dashboard/StartupProfile.jsx was 1,987 lines, past the 1,000-line
 * token-discipline threshold in CLAUDE.md. Lines 18-1134 were a private helper
 * library - 47 top-level declarations, only 8 of which the page component
 * actually referenced. Those 1,117 lines now live here.
 *
 * THERE IS NO SHIM, and that is deliberate. src/App.jsx:52 is the ONLY importer
 * of StartupProfile.jsx and it takes the DEFAULT export, so the page kept its
 * `export default function StartupProfile()` and simply shed the helpers. This
 * differs from Phases 160-162, where the split file had many named consumers
 * and had to be replaced by a re-export shim.
 *
 * LAYOUT - every module body is a verbatim slice of the pre-split file
 *   fieldPrimitives.jsx  original   18-302   formatters, field renderers, row chrome
 *   fundingChart.jsx     original  303-712   amount normalisation + the bar chart
 *   subsectionRows.jsx   original  713-930   the 8 row renderers + SubSectionRow
 *   sectionCards.jsx     original  931-999   section shells + empty state
 *   claimModal.jsx       original 1000-1134  claim modal + role eligibility gate
 *   (StartupProfile.jsx  original 1135-1987  the page component, left in place)
 *
 * Original lines 1-17 were the shared import header. It is the one thing that
 * could NOT be sliced: each module needs its own subset, and because the modules
 * sit one directory deeper every relative specifier gained a '../' level
 * (`../../services/api` -> `../../../services/api`). Module headers are new code;
 * only the bodies between the BODY START/BODY END sentinels are verbatim.
 *
 * RE-CONCAT VERIFICATION RECIPE
 *   Take the lines between `BODY START` and `BODY END` in each of the five
 *   modules, append StartupProfile.jsx's own BODY START/END block, sort the
 *   slices by the start line in their `// --- lines A-B ---` marker, assert the
 *   result is contiguous over 18-1987 with no overlap, then diff it against the
 *   matching range of the pre-split file. It must be a byte-for-byte match.
 *   `.scratch/verify-w4-4.py` does exactly this.
 *
 * INVARIANTS - do not break these
 *   1. Module bodies stay verbatim. Reformatting them voids the recipe above.
 *   2. The dependency graph is a DAG and must stay one: fieldPrimitives and
 *      fundingChart are leaves; subsectionRows depends on both; sectionCards
 *      depends on all three; claimModal is standalone. No module may import
 *      from StartupProfile.jsx - that would create a cycle with the page.
 *   3. fundingChart.jsx and sectionCards.jsx use `React.useState(...)` member
 *      access (original lines 507 and 937), so they must keep `import React`
 *      even though the project uses the automatic JSX runtime and plain JSX
 *      modules do not need it.
 *   4. This barrel exports ONLY the 8 symbols the page component references.
 *      The other 39 helpers are module-internal on purpose - importing one here
 *      re-widens the surface that was just narrowed.
 *   5. The directory is `startupProfile/` (lowercase initial) so it cannot
 *      collide with the sibling `StartupProfile.jsx` on a case-insensitive
 *      filesystem the way a `StartupProfile/` directory would.
 */
export { TRL_TOOLTIP, TechReadinessBadge, formatFunding } from './fieldPrimitives.jsx';
export { amountToDisplay } from './fundingChart.jsx';
export { StartupSubSections, EmptySection } from './sectionCards.jsx';
export { ClaimStartupModal, userIsClaimEligible } from './claimModal.jsx';
