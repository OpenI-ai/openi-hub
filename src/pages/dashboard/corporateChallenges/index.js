/**
 * CorporateChallenges — extracted presentational components (Phase 165 / W5-2).
 *
 * src/pages/dashboard/CorporateChallenges.jsx was 1,721 lines. Unlike the W4-4
 * StartupProfile split, almost none of that was module-level: only ~78 lines sat
 * above the component, the other ~1,620 lived INSIDE one stateful component. So
 * this is not a helper-library lift, it is a prop-threading extraction, and the
 * verification story is different (see INVARIANTS).
 *
 * THERE IS NO SHIM. src/App.jsx:36 is the only importer of CorporateChallenges.jsx
 * and it takes the default export, which stays exactly where it was. Same reasoning
 * as startupProfile/.
 *
 * LAYOUT — every module body is a verbatim slice of the pre-split file
 *   constants.js             original 21-22 + 93-99   18 lines 
 *   TagDropdown.jsx          original 24-91          78 lines 
 *   ChallengeApplications.jsx original 637-949       339 lines 18 props
 *   InviteStartupsModal.jsx  original 953-1179      245 lines 20 props
 *   TeamModal.jsx            original 1184-1280     112 lines 12 props
 *   TemplatePickerModal.jsx  original 1302-1357      69 lines 7 props
 *   ChallengeForm.jsx        original 1393-1664     291 lines 16 props
 *   ChallengeListCards.jsx   original 1667-1718      65 lines 2 props
 *   (CorporateChallenges.jsx keeps the state, the handlers, the detail-view chrome,
 *    and the filter bar — the parts that own state rather than render it.)
 *
 * INVARIANTS
 *   1. Bodies are byte-identical to the original lines named in each header, between
 *      the `BODY START` / `BODY END` sentinels. Do not reindent them. That is what
 *      makes the extraction auditable without a full-file re-concat (impossible here,
 *      because the lines moved into new function scopes).
 *   2. Props are DESTRUCTURED, never grouped into `state={...} actions={...}`. Grouping
 *      would mean rewriting every reference in the body (`inviteState.inviteBusy`) and
 *      would forfeit invariant 1. Long prop lists are the accepted cost; `react/prop-types`
 *      is off in .eslintrc.cjs so they generate no lint noise.
 *   3. Modal guards stay at the CALL SITE (`{showInvite && <InviteStartupsModal ... />}`),
 *      not inside the component. One less prop each, and the modal never mounts hidden.
 *   4. G / card / STATUS_STYLE live in ./constants.js and are imported by both the page
 *      and these components. Do not re-declare them anywhere.
 *
 * HOW TO VERIFY A CHANGE HERE
 *   Full-file re-concat does not apply. The three gates that do:
 *     npx eslint src/pages/dashboard/corporateChallenges src/pages/dashboard/CorporateChallenges.jsx
 *       -> must print NOTHING. `no-undef` (via eslint:recommended) proves every prop a
 *          body needs is actually threaded; `no-unused-vars` + `unused-imports` prove
 *          nothing was over-threaded.
 *     npx vite build            -> must succeed (do NOT use `npm run build`; its postbuild
 *                                  hits api.openi.ai and pings IndexNow).
 *     the BODY sentinels        -> each slice still greps byte-identically out of the
 *                                  pre-split file at the line range in its header.
 *
 * IMPORT THIS BARREL AS './corporateChallenges/index.js', NEVER './corporateChallenges'.
 * macOS APFS is case-insensitive and extension resolution beats directory index, so the
 * bare specifier resolves to the sibling page file CorporateChallenges.jsx - the page
 * ends up importing itself and rollup fails with '"G" is not exported by
 * CorporateChallenges.jsx, imported by CorporateChallenges.jsx'. eslint does not catch
 * this; only `npx vite build` does. Same reason StartupProfile.jsx:32 spells out
 * './startupProfile/index.js'.
 */

export { G, card, STATUS_STYLE } from './constants';
export { default as TagDropdown } from './TagDropdown';
export { default as ChallengeApplications } from './ChallengeApplications';
export { default as InviteStartupsModal } from './InviteStartupsModal';
export { default as TeamModal } from './TeamModal';
export { default as TemplatePickerModal } from './TemplatePickerModal';
export { default as ChallengeForm } from './ChallengeForm';
export { default as ChallengeListCards } from './ChallengeListCards';
