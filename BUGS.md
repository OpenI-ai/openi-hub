# OpenI Hub — Bug Fix Log

> Chronological record of user/tester-reported bugs and their fixes, from Session 1
> (~1 Jun 2026) onward. Sourced from `CLAUDE_ARCHIVE_part4.md`, `OPENI_HUB_NOTES_ARCHIVE_part4.md`,
> `OPENI_HUB_NOTES.md`, and `CLAUDE.md` in the project memory directory.
>
> Scope: user- or testing-team-reported defects only (broken/misbehaving functionality
> that was then fixed). Pure feature builds, migrations for new functionality, and
> internal refactors are excluded unless they were part of fixing a reported bug.
>
> Each entry lists: symptom (what was reported), root cause, fix, commit(s), and status.
> BE = backend repo (`openi-hub-backend`), FE = frontend repo (`openi-hub`).

---

## Session 5 — 2 Jun 2026

### Challenge-detail header buttons misalign when title wraps
- **Symptom:** On the corporate challenge-detail header, a long title (e.g. "Supply Chain
  Demand Forecasting") wrapped to multiple lines while the action-button cluster stayed
  pinned to the first line, overlapping the title.
- **Root cause:** Row used `alignItems:'flex-start'` with a `flexShrink:0` button cluster
  and no wrap handling.
- **Fix:** Row gets `flexWrap:'wrap'` + `gap:12`; title gets `flex:'1 1 280px'` +
  `minWidth:0` + `wordBreak:'break-word'`; button group gets `flexWrap:'wrap'` +
  `justifyContent:'flex-end'`.
- **Commit:** FE `7b53d2a`
- **Status:** Shipped, build-verified.

---

## Session 6 — 3 Jun 2026

### "Challenge not found" 404 when a reviewer opens a challenge from their review list
- **Reported by:** Nandini (reviewer), via testing.
- **Symptom:** Challenge appeared correctly in the reviewer's review list, but clicking to
  open it threw a 404.
- **Root cause:** `getChallenge` was gated owner-only (`corporate_id = req.user.id`) while
  the list endpoint already allowed owner OR `challenge_members` membership —
  inconsistent gating between list and detail endpoints.
- **Fix:** `getChallenge` now grants access to any `challenge_members` membership;
  derives `my_role`. Made role-aware across 7 queries in `corporateController.js`
  (view/edit/PDF-export/AI-evaluate endpoints each gated to the correct role set).
- **Commits:** BE `b2b04c0`, FE `e4f0c6c`
- **Status:** Shipped.

### Challenge-invite emails never sending
- **Symptom:** Invite emails silently failed to send.
- **Root cause:** Async pending-invite send fired after `client.release()` had already
  returned the PG connection to the pool — query ran on a released connection and
  silently failed (fire-and-forget swallowed the error).
- **Fix:** Re-ordered so the send completes while the client is still checked out.
- **Commit:** BE `cd2b41f`
- **Status:** User-confirmed working.

### Non-platform (email) reviewer invites failing with Postgres 23514
- **Symptom:** Every email-reviewer invite threw a CHECK-constraint violation.
- **Root cause:** The inserted `status` value on `pending_email_invites` was over-escaped,
  never matching the CHECK allowed-set.
- **Fix:** Repaired the literal to match the constraint.
- **Commit:** BE `dc52588`
- **Status:** User-confirmed working.

### Reviewer-invite emails mis-framed as a corporate "sales lead" (+ same bug on watchlist/IPR invites)
- **Symptom:** Reviewers invited to evaluate a challenge received copy framed as "this is a
  real lead — actively looking for solution providers." Auditing other invite types on
  user request surfaced the same wrong framing on watchlist and IPR share invites.
- **Root cause:** `pendingInviteEmail` keyed pitch/subject purely off `inviterRole`; every
  invite sent by a corporate user got corporate sales framing regardless of actual intent.
- **Fix:** Replaced with a `NON_LEAD_PITCH` map keyed on entity type
  (`challenge_reviewer`/`collaboration`/`watchlist`/`ipr` → collaboration framing).
  `entityType` now wins over `inviterRole` for pitch, subject, and CTA copy. Only
  `challenge` (apply) keeps lead framing.
- **Commits:** BE `61ea1cf`, `579a989`
- **Status:** User-confirmed (screenshot).

---

## Session 7 — 3 Jun 2026

Testing-team report (verbatim): *"All the invited startups/any persona must be listed
below. But the list is showing only 5 invitees. Invite by email is only adding 2 emails
at a time. please check."*

### Only 5 invitees shown — email-only invitees missing from list
- **Root cause:** `listInvitesForChallenge` INNER-JOINed `users` on `invited_user_id`,
  structurally excluding `pending_email_invites` rows (NULL `invited_user_id` for
  email-only invitees).
- **Fix:** `UNION ALL` the pending-email rows into the same render shape with a `source`
  discriminator column.
- **Commit:** BE `9f746a6`
- **Status:** Shipped.

### Revoke returned 404 on email-only invitees
- **Root cause:** Email-only invite IDs belong to `pending_email_invites`, not
  `challenge_invites` — the old single-table UPDATE silently 404'd.
- **Fix:** Branch on `source` param to route to the correct table/service.
- **Commits:** BE `9f746a6`, FE `da5c558`
- **Status:** Shipped (follow-up gap closed by Bug below).

### Email input only added 2 chips
- **Root cause:** React stale-closure bug — the Enter/comma add-handler deduped against
  the render-time closure of `inviteEmails`; after ~2 adds the closure lagged real state
  and silently dropped the 3rd+ chip.
- **Fix:** Moved dedupe inside the functional state updater so it always reads fresh state.
- **Commit:** FE `da5c558`
- **Status:** Shipped.

### Co-inviter could Revoke an email invite they didn't send → silent 404
- **Fix:** Gated Revoke button to the original inviter or admin only.
- **Commit:** FE `ea46e6e`
- **Status:** Shipped.

### Shared Viewers got 404 "Challenge not found" exporting PDF
- **Root cause:** `exportChallengePdf` allow-list omitted the `'viewer'` role.
- **Fix:** Added `'viewer'` to the allow-list (export is read-only).
- **Commit:** BE `19f2479`
- **Status:** Shipped.

### Challenge PDF text overlap
- **Root cause:** `ensureSpace` returned `doc.y`, but the generator tracks its own
  manually-managed `y` cursor that `doc.y` doesn't follow.
- **Fix:** `ensureSpace` now accepts and prefers the manual `y`.
- **Commit:** BE `50b39b1`
- **Status:** Shipped.

### Corrupted startup names visible on list/search surfaces
- **Symptom:** U+FFFD (replacement character) corrupted names appearing publicly.
- **Fix:** Hide U+FFFD-corrupted names from list/search surfaces.
- **Commit:** BE `edb847e`
- **Status:** Shipped.

---

## Session 9 — 5 Jun 2026

Sequential bug-fix batch (Tasks A–G), queued one at a time by the user, verification
deferred to test team.

| # | Bug | Fix | Commit |
|---|---|---|---|
| A | 8-vector assessment PDF missing criterion-level detail | PDF now renders every criterion, not just vector totals | BE `7b01614` |
| B | Watchlist row-click did not open profile | Row click now navigates to startup profile | FE `22d11e5` |
| C | DeepTech assessment PDF missing detail | PDF includes full question text, section grouping, per-question weights | BE `ac39389` |
| D | Browser-tab favicon missing | OpenI "oi" mark wired as favicon | FE `088da40` |
| E | Bookmark icon was a no-op | Now opens the `watchlistAPI`-backed picker modal | FE `31b5598` |
| F | Share Startup Profile Link/Email tabs not rendering | Share ownership now derived from `startup.user_id` | FE `0b9efcb` |

### Task G — Notification bell "gives no alert" — CLOSED, NOT A BUG
- **Investigation:** Live inspection showed `GET /my/notifications` returning 200 with
  correct unread-count 0; badge correctly hidden at 0. System deliberately never
  self-notifies the actor of their own action.
- **Status:** Working as designed, user-confirmed. Do not re-investigate.

---

## Session 10 — 9 Jun 2026

### Collab-key mismatch on "Collab" action / startup-profile share
- **Symptom:** From Discover Startups, clicking "Collab" resolved to the wrong counterpart.
- **Root cause:** `createCollab` was not keyed off `startup.user_id`.
- **Fix:** Keyed off `startup.user_id` on both backend and frontend call sites.
- **Commits:** BE `83c1717`, FE `d9a4eaf`
- **Status:** Shipped, testing-team cleared 23 Jun.

---

## Session 11 — 10 Jun 2026 (testing-team bug batch #1–#5)

| # | Bug | Fix | Commit |
|---|---|---|---|
| 1 | Pending invite not auto-accepted on Marketplace apply | Applying now auto-accepts a matching `pending_email_invites` row | BE `2b0c8e0` |
| 2 | DeepTech "Recent Assessments" not clickable + Avg Score showed NaN% | Rows now open the assessment; NaN% calculation fixed | FE `be4ea2d` |
| 3 | 8-Vector Evaluation page missing date-wise Recent Assessments | Added date-wise listing | FE `fc23f26` |
| 4 | Public DeepTech share missing full question text/sections/weights | Added full detail rendering | FE `6607e4c` |
| 5 | Admin could not Edit/Delete events they didn't create | New `PUT /events/:id` with creator/same-org/admin gate; admin Edit/Delete UI added | BE `5012b07`, FE `d82d961` |

All shipped, testing-team cleared 23 Jun.

---

## Session 12 — 11 Jun 2026 (ISO 27001 pre-audit OWASP hardening)

Audit-discovered access-control defects, fixed same session:

- **H1 — Broken Access Control:** any user could mutate another user's startup profile
  (no ownership guard on update/remove). Fix: ownership guard (creator or admin only).
  Commit: BE `9af20d6`.
- **M1 — IDOR:** corporate milestone/task update/delete lacked collaboration-ownership
  check. Fix: ownership-scoped query, 404 if not owned.
- **LM1 — IDOR:** watchlist getOne/exportPdf lacked read-access guard. Fix: `canWatchlistRead()` gate.
- **L3 — JWT algorithm-confusion risk:** verify/sign didn't pin algorithm. Fix: pinned HS256 everywhere.
- **L1 — CORS misconfig:** localhost allowed in prod. Fix: gated to non-prod only.
- **L2 — Error-handler info leak:** internal error messages leaked in prod. Fix: generic
  message in prod, full detail server-logged only.
- **M2 — Missing security headers:** no X-Content-Type-Options/X-Frame-Options/CSP/HSTS.
  Fix: global headers block added.
- **Post-close bug:** cluster-subgroup drift query used the wrong grain in the integrity
  check. Fix commit: BE `e0f0a1c`.
- **Status:** All shipped, prod-probe verified; testing-team cleared 23 Jun.

---

## Session 13 — 12 Jun 2026 (testing-team bug batch #1–#3)

### #1 — Admin delete-user threw FK-violation 500
- **Symptom:** Deleting a user with history (audit logs, messages, etc.) failed.
- **Root cause:** ~48 child-table FK columns referenced `users(id)` with no `ON DELETE` rule.
- **Fix:** App-layer cleanup (NULL nullable attribution columns + DELETE dependent rows
  before `DELETE FROM users`) + schema-level idempotent FK re-point.
- **Commit:** BE `f42830f`
- **Status:** Fully closed out (and hardened further) in Session 15.

### #2 — PoC stage-advance threw "inconsistent types deduced for parameter $2"
- **Root cause:** Milestone auto-gen used a bare `$2` in both SELECT projection and
  `NOT EXISTS` comparison; Postgres couldn't deduce one consistent type.
- **Fix:** Pinned explicit casts (`$1::int, $2::text, $3::int`).
- **Commit:** BE `533660e`
- **Status:** Shipped.

### #3 — Admin claim approve/reject returned 500
- **Root cause:** Same FK-violation class as #1 (`executeMerge()` unguarded delete).
- **Fix:** The FK re-point migration from #1 was run in prod.
- **Status:** Shipped.

---

## Session 14 — 13 Jun 2026

### Challenge delete could leave orphaned notification rows (non-atomic)
- **Fix:** Wrapped challenge-delete plus dependent `user_notifications` prune in a single
  BEGIN/COMMIT transaction.
- **Commit:** BE `c2d3ad5`
- **Status:** Shipped.

*(GSC reporting 403s on dead legacy WordPress extension URLs was investigated and closed
as self-healing — no fix needed, no code change.)*

---

## Session 15 — 15 Jun 2026 (testing-team bug batch)

### Analytics `featureAdoption` 500 — corporate persona
- **Root cause:** Queried challenges by a non-existent column.
- **Fix:** Count via `challenges.corporate_id`.
- **Commit:** BE `b9f0616`

### Analytics `featureAdoption` 500 — incubator persona
- **Fix:** Count via `incubator_programs.incubator_id`.
- **Commit:** BE `660fb91`

### Startup profile-score capped at ~98%, never reaching 100%
- **Root cause:** `founded_year` and `incorporation_date` weren't recognized as the same
  logical field, so one was always counted "missing."
- **Fix:** `ALIAS_FIELDS` treats them as one filled field.
- **Commit:** BE `c04031f`

### Admin delete-user FK cleanup — closeout
- **Fix:** Enumerated every remaining FK on `users(id)` in prod; added 9 nullable→SET NULL
  + 5 NOT-NULL→DELETE entries.
- **Commits:** BE `1b6ac2e`, `1dc6434`
- **Status:** **User-confirmed working** ("delete is working, just tested"). Closed.

### WebView/private-mode localStorage crash (white screen)
- **Root cause:** `window.localStorage` exists but throws `SecurityError` in in-app
  WebViews / private browsing / storage-blocking contexts; unguarded boot-time read
  crashed React render.
- **Fix:** New `src/utils/safeStorage.js` wrapper — no-ops/returns null on failure instead
  of throwing.
- **Commit:** FE `863b0c5`

### Profile photo (`logo_url`) not persisting — student/academia/mentor
- **Root cause:** `updateMyProfile()` only persisted whitelisted columns and `logo_url`
  wasn't in the allow-list.
- **Fix:** Whitelisted `logo_url` + idempotent `ADD COLUMN IF NOT EXISTS` migration.
- **Commit:** BE `ef349e4`

### .docx/.doc uploads rejected
- **Root cause:** Cloudinary `resource_type` was hardcoded `'image'` for portfolios/resumes/pitch decks.
- **Fix:** Changed to `'auto'` for those folders.
- **Commit:** BE `c320a8d`

### Register Step-2 fields not prefilled from Step-1
- **Fix:** Field maps (industry→research_areas, description→bio) + `coerceForField` helper.
- **Commit:** FE `77b7027`

### Discovery cards (student/academia) not clickable
- **Fix:** Card click now opens detail modal off already-fetched record.
- **Commit:** FE `21d33f2`

All above: shipped, testing-team cleared 23 Jun.

---

## Session 17 — 17 Jun 2026 ("Bug 6", testing-team report)

Reported verbatim: *"Investor is unable to invite any innovation provider to deal
created... cannot delete the deal request."*

### Investor unable to invite a provider to a deal request
- **Root cause:** `inviteByEmail` registered-user INSERT referenced a non-existent column
  (`invited_by_user_id`) and an illegal status value (`'active'`, not in the CHECK constraint).
- **Fix:** Realigned to actual columns (`invited_by`, status `'accepted'`, `accepted_at NOW()`).
- **Commits:** BE `cd0d53e`, FE `2eb09aa`

### Investor could not delete a deal request
- **Root cause:** `deleteDealRequest` was entirely absent at every layer.
- **Fix:** New transactional, ownership-gated controller (prunes dependent rows), route,
  API method, confirm-guarded Delete button.
- **Commits:** BE `cd0d53e`, FE `c0cd389`/`2eb09aa`
- **Status:** Both shipped, testing-team cleared 23 Jun.

---

## Session 18 — 18 Jun 2026 (investor validation + kanban)

### No validation against negative values / equity >100% on investor forms
- **Symptom:** Negative ticket size (deal request) and negative Entry Valuation/Amount or
  equity stake over 100% (Add Portfolio Company) were all accepted.
- **Fix:** Client + server guards on both forms; equity capped ≤100%.
- **Commits:** BE `6a04f44`, `b357901`; FE `b8ffb3e`, `ade7afb`

### Deal Pipeline kanban: investor-created deals invisible
- **Root cause:** Column/status mapping bug in `InvestorDeals.jsx`.
- **Fix:** Corrected mapping.
- **Commit:** FE `4c7131d`
- **Status:** Shipped, testing-team cleared 23 Jun.

---

## Session 19 — 18 Jun 2026

### Duplicate organizations created silently (no dedup)
- **Symptom:** Creating an org whose name/domain already existed silently produced a
  duplicate — no dedup check, no recourse offered.
- **Fix:** Pre-insert dup check on `name_normalized` OR domain; returns 409 with a
  duplicate-recourse payload (`claim` if the existing org is an unclaimed imported
  placeholder, else `join`). Paired with a new org claim/merge subsystem so the recourse
  is actionable.
- **Commits:** BE `fe4525b`, FE `e330285`
- **Status:** Shipped, testing-team cleared 23 Jun.
- **⚠️ Note (discovered Session 31):** the merge half of this subsystem had a silent
  data-loss bug from this session through Session 31 — see Session 31 below.

---

## Session 20 — 19 Jun 2026

### "DeepTech assessments still showing other users' data" (reported cross-user leak)
- **Investigation outcome:** Not actually a leak — the two demo rows genuinely belonged
  to the reporting user. However the investigation surfaced a real latent gap: `list`/
  `getOne` had no per-user scoping for non-admins at all.
- **Fix:** `list` now filters to `assessed_by = req.user.id` for non-admins; `getOne`
  returns 404 (not 403) for non-owners to prevent existence-probing.
- **Commit:** BE `4f2e7e7`
- **Status:** Shipped, testing-team cleared 23 Jun.

---

## Session 21 — 20 Jun 2026

### Clearing a URL field on Startup My Profile did not persist
- **Symptom:** Deleting the contents of a URL field (e.g. website/LinkedIn) and saving
  did not persist the clear — the old value reappeared on reload.
- **Root cause:** Two cooperating "drop empties" guards: frontend only sent non-empty
  fields (a cleared field was simply omitted, not sent as empty), and backend
  `coerceUpdates` dropped `''`/null on text/url/date columns as noise-filtering. Neither
  layer could express "user intentionally cleared this."
- **Fix (two-layer):** Frontend diffs against a load-time baseline snapshot and sends an
  explicit `null` for any field that was non-empty at load and is now empty. Backend
  `coerceUpdates` now treats explicit `null` as a deliberate clear, `undefined` as "leave
  untouched," and empty/whitespace string as noise (dropped).
- **Commits:** FE `601c4fa`, BE `a5b1f59`
- **Status:** Shipped, testing-team cleared 23 Jun.

### Innovation seekers (corporate/investor/etc.) could apply to challenges (should be blocked)
- **Fix:** Added a `SEEKER_ROLES` 403 guard on the apply endpoint.
- **Commit:** BE `dcffe55`

### Student Portfolio share-link list not populating
- **Root cause:** API could return either a bare array or `{shares:[...]}`; the loader
  only handled one shape.
- **Fix:** Made the loader shape-tolerant.
- **Commit:** FE `7b2e311`

### "Source Students" opened as a cramped popup instead of a full page
- **Fix:** Converted `StudentDiscovery.jsx` to a full page.
- **Commit:** FE `d840295`
- **Status:** All three shipped, testing-team cleared 23 Jun.

---

## Session 22 — 23 Jun 2026

**✅ All P0 QA-verify items from Sessions 9–21 confirmed working in prod by the testing
team this session** — URL-clear fix, session-20-tail fixes, DeepTech isolation, org
claim/merge + dup guard, Claim-Profile flow, investor/student fixes. No new bugs this session.

---

## Session 23 — 23 Jun 2026 (P2 mobile-audit batch, pre-identified defects)

### Evaluation vector cards crushed at 375px width
- **Root cause:** Fixed `gridTemplateColumns` crushed 5 score buttons + chat icon
  together on narrow mobile viewports.
- **Fix:** Row changed to `flex flex-col sm:grid`; score buttons wrapped in `sm:contents`
  to preserve the desktop 3-col grid.
- **Commit:** FE `baf92f1`

### Startup profile section navigation hard to discover on mobile
- **Symptom:** 8 profile child-table accordions stacked vertically, slow to navigate on phone.
- **Fix:** Added a mobile-only horizontally-scrollable quick-jump chip strip with
  scroll-to-section anchors.
- **Commit:** FE `baf92f1`
- **Status:** Both shipped, awaiting QA render-verify. (A third audit item, Events-modal
  overflow, was investigated and found already fixed by an earlier refactor — no change needed.)

---

## Session 24 — 24 Jun 2026 (investor bug batch)

### Deal Pipeline stage-advance threw "inconsistent types deduced for parameter $2"
- **Root cause:** Postgres type-inference conflict on a parameterized UPDATE.
- **Fix:** Explicit `::type` casts.
- **Commit:** BE `0fe76a8`

### Deal Team invite appeared broken (perceived bug)
- **Investigation:** Not an actual functional defect — the panel subtitle copy implied a
  broken flow. Invite actually worked.
- **Fix:** Clarified subtitle/copy.
- **Commit:** FE `7fe42fa`
- **Status:** Closed as UX/copy issue.

### Portfolio edit: Invested/Equity/Entry Valuation fields not editable
- **Root cause:** Field-name mismatch between frontend and DB (`status`/`exit_valuation`
  vs actual `current_status`/`exit_value`), and the edit form never rendered inputs for
  those three fields at all.
- **Fix:** Backend accepts the correct field names with negative + equity>100 guards;
  frontend renders the missing inputs.
- **Commits:** BE `bb2100d`, FE `f7a34ef`

### Add-Portfolio threw 500 on EUR/GBP currency selection
- **Root cause:** DB CHECK constraint only allows `IN ('INR','USD')`, but the dropdown
  offered EUR/GBP too.
- **Fix:** Trimmed the currency dropdown to INR/USD (user chose frontend-restrict over
  widening the DB constraint).
- **Commit:** FE `eb0e06a`
- **Status:** All four shipped. **Caveat:** re-adding EUR/GBP to the dropdown will
  reintroduce the 500 unless the DB CHECK constraint is widened first.

### 🔵 Open, not fixed — Opportunities feed pagination non-functional past 20 results
- **Symptom:** `loadChallenges` sets `total=rows.length` but the underlying UNION query
  returns all rows in one call, so Previous/Next buttons don't actually re-fetch
  server-side once results exceed 20.
- **Status:** Flagged explicitly as a known cosmetic caveat, left open — not fixed as of
  this writing.

---

## Session 26 — 25 Jun 2026 (Dentsu client report)

### Edit-access editor blocked from inviting startups to a shared challenge
- **Symptom:** An edit-access collaborator was blocked with "Only the challenge creator
  or their org members can invite."
- **Root cause:** The invite-permission gate only checked creator + same-org membership,
  not accepted editor-collaborators.
- **Fix:** Gate now also passes for an accepted `entity_collaborators` row with
  `role='editor'`; applies to all 4 challenge invite operations (create/list/revoke/remind).
- **Commit:** BE `f360169`
- **Status:** Shipped, awaiting QA.

---

## Session 28 — 29 Jun 2026 (self-inflicted regression, caught internally)

### Shared pages rendered two overlapping tour instances (double auto-start)
- **Symptom:** Shared public pages (SharedChallenge/Watchlist/StartupProfile/
  StudentPortfolio/DeepTech/etc.) showed two Joyride tour instances at once — overlapping
  tooltips — because both `PublicLayout` and the individual shared page each mounted
  `<PublicTour/>`.
- **Fix:** Removed the duplicate mount from the 7 shared pages.
- **Commit:** FE `cada73a`
- **Status:** Fixed same session, not user-reported — caught as an internal follow-up
  during the every-page-tours feature build.

---

## Session 29 — 30 Jun 2026

### IPR (Intellectual Property Records) page appeared empty for every persona
- **Root cause:** `ipr_records.startup_id` FK pointed at a legacy `startups` CRM seed
  table (ids 1–725), not the real `startup_profiles` catalogue — every JOIN returned no name.
- **Fix:** All 4 query sites in `iprController.js` repointed to `LEFT JOIN
  startup_profiles`; search fixed to the correct column.
- **Commit:** BE `2dac8e9`
- **Status:** Fixed, migration run, 5 rows seeded and verified live.

### IPRDatabase.jsx crashed on render after real data was seeded
- **Root cause:** `jurisdiction` was stored as a raw string, not an array; render code
  called `.map()` on it.
- **Fix:** New `toJurisdictionArray()` helper (array passthrough, comma/semicolon split,
  single value, null default) + array guard on `inventors`.
- **Commit:** FE `37aa361`
- **Status:** Fixed, verified.

### Pipeline Health tab required horizontal scroll on mobile
- **Root cause:** Component had its own `px-6` stacked on top of the parent's already-
  responsive `p-4 sm:p-6` padding — double-padding pushed content past the viewport.
- **Fix:** Removed the child's hardcoded `px-6`; adjusted spacing; footer text wraps.
- **Commit:** FE `9e4af2c`
- **Status:** Fixed. Banked lesson: child components must not re-add hardcoded `px-*`
  over an already-padded parent.

---

## Session 30 — 30 Jun 2026

### Vercel deployment stuck on stale build after push (looked like a broken feature)
- **Symptom:** "Footer Add-Startup CTA button not there even after hard refresh."
- **Root cause:** A push did not trigger the GitHub→Vercel deploy webhook — prod stayed
  on an older build (confirmed via `list_deployments` showing no deployment for the
  pushed commit).
- **Fix:** Pushed an empty commit to force a rebuild of current HEAD.
- **Commit:** FE `b985cfd`
- **Status:** Fixed, user-confirmed ("yes it's there"). Banked rule: before assuming a
  code bug when a pushed feature "isn't there," confirm a deployment exists for the HEAD
  SHA via Vercel.

### 🟡 Open at session close — `domain_name` unique index shipped non-unique
- **Symptom/root cause:** Plan called for a UNIQUE index on `startup_profiles.domain_name`,
  but prod already held ~1,302 duplicate domain groups, so the migration had to ship
  non-unique, leaving app-layer dedup as the only guard.
- **Status:** Flagged open — resolved in Session 31 (below).

---

## Session 31 — 1 Jul 2026

### `startup_profiles.domain_name` duplicate rows (~1,302 dup groups) — root cause of Session 30's open item
- **Root cause:** Inconsistent host-normalization logic duplicated across two insert
  paths (CSV import vs crawler-approve), each with different regex/casing/`www.`-
  stripping rules, letting the same real-world domain get inserted twice under different
  derived strings.
- **Fix:** New shared `src/utils/domainHost.js` (`isValidHost`/`normalizeHost`) used by
  both call sites; one-time cleanup migration merged/deleted the ~1,302 dup groups;
  index promoted to genuinely UNIQUE; inserts guarded with `NOT EXISTS` pre-check +
  `ON CONFLICT DO NOTHING`.
- **Commits:** BE `add433e`, `2ee0d18`
- **Status:** Fixed and verified live — confirmed 0 remaining dup groups, unique index in place.

### 🔴 HIGH SEVERITY — `executeOrgMerge` silently reassigned ZERO rows on every org merge since Session 19
- **Symptom:** Org merges appeared to succeed (200 response, no visible error) but never
  actually reassigned data.
- **Root cause:** The per-table reassignment step used `UPDATE ... ON CONFLICT DO
  NOTHING` — `ON CONFLICT` is only valid on `INSERT`, not `UPDATE`, and has been invalid
  syntax since the org-merge subsystem shipped in Session 19. Each table's reassignment
  ran inside its own SAVEPOINT/ROLLBACK block whose catch silently swallowed the syntax
  error, masking the failure entirely.
- **Fix:** Replaced with a `NOT EXISTS`-guarded plain `UPDATE` (no `ON CONFLICT`) +
  prune-on-collision `DELETE` for rows that would violate a unique constraint on the
  target org.
- **Commit:** BE `8cf1b55`
- **Status:** Fixed and verified — 4-case rollback-wrapped functional test all PASS.
- **⚠️ Important caveat, not fixed:** the fix is forward-only. It does **not**
  retroactively repair org merges executed between Session 19 and Session 31. If a user
  reports old records still on a merged-away org, that is this bug — recovery requires a
  manual one-off data audit, not automatic reconciliation.

---

## Session 32 — 2 Jul 2026 (untracked session — this session)

### `ReferenceError` on dashboard topbar — `DASHBOARD_HOME_ROUTES` used but never defined
- **Symptom:** Screenshot showed both the "?" (Take a tour) icon button and the gold
  "Tour this page" pill button appearing simultaneously on every dashboard page, doing
  the same job — an inconsistent leftover from a prior session that had hit its context
  limit mid-edit.
- **Root cause:** `DashboardLayout.jsx` referenced a `DASHBOARD_HOME_ROUTES` constant in
  a visibility condition for the "Tour this page" pill, but the constant itself was never
  defined — a `ReferenceError` from an incomplete edit left over from a previous session.
- **Fix:** Defined `DASHBOARD_HOME_ROUTES = ["/dashboard", "/dashboard/home",
  "/dashboard/corporate"]`, matching the 3 landing-route redirect targets in
  `DashboardHome.jsx`.
- **Commit:** FE `daa22a3`
- **Status:** Shipped, user-confirmed working via screenshot.

### Inconsistent tour-button UX across personas (corporate saw only "?", admin saw only the pill)
- **Symptom (user-reported via screenshot):** "it's fixed but as corporate it shows '?'
  and as an admin it shows Tour this page. How about we just keep '?' everywhere?"
- **Root cause:** Two separate buttons with independently-drifting visibility rules
  (`TOURS[navRole]` vs `pageTour` vs `DASHBOARD_HOME_ROUTES`) — not a code defect per se,
  but a UX design flaw compounding the bug above.
- **Fix:** Merged into a single unified "?" button, always visible when either a role
  tour or a page tour exists for the current context; still dispatches
  `openi-replay-tour`. Flipped `TourWrapper.jsx`'s tour-priority logic (user-confirmed
  via `AskUserQuestion`) from role-tour-first to page-tour-first, since `PAGE_TOURS` now
  covers nearly every dashboard route — the single button plays the current page's
  specific walkthrough when one exists, falling back to the persona's role/intro tour
  only where no page-tour entry exists.
- **Commit:** FE `46deaa2`
- **Status:** Shipped, user-confirmed working via screenshot.

---

## Non-bugs — investigated and closed as working-as-designed

These were reported as bugs but, on investigation, were found not to be defects. Kept
here for reference so they aren't re-investigated:

1. **Session 9, Task G** — Notification bell "gives no alert." Confirmed working as
   designed (system deliberately never self-notifies the actor of their own action).
2. **Session 14** — GSC reporting 403s on dead legacy WordPress extension URLs. Decided
   self-healing, no action taken.
3. **Session 20** — "DeepTech assessments showing other users' data." The specific report
   was not actually a leak, though the investigation did surface and fix a real latent
   per-user-scoping gap (see Session 20 entry above).
4. **Session 23, EV3** — Events modal two-column overflow. Found already fixed by an
   earlier refactor.
5. **Session 24, Bug (B)** — "Investor can't invite to Deal Team." Confirmed to be
   misleading UI copy, not a functional defect.

## Known open issues (not yet fixed)

1. **Opportunities feed pagination** (flagged Session 24) — Previous/Next buttons don't
   re-fetch server-side once results exceed 20; the full UNION result set is fetched in
   one call and `total` is derived from the returned page size.
2. **Org-merge historical data loss** (Session 19 → Session 31 window) — merges executed
   in that window did not reassign rows to the target org, per the Session 31 fix
   caveat above. No retroactive repair has been run; requires a manual audit if reported.
