# OpenI Hub - Project Documentation

## OpenI Assessment Platform

**Version:** 3.2
**Last Updated:** 8 May 2026 (evening — post Phase 65e + Phase 63 backfill section + table-count correction)
**Live URL:** https://openi.ai 🎉
**Production domain:** https://www.openi.ai *(Vercel production)*
**Apex redirect:** https://openi.ai → 308 → https://www.openi.ai
**Backend API:** https://api.openi.ai *(Railway, SSL provisioned, Phase 60.11 + 61 + 62 + 63 + 64 + 65 + 65b schema/code live; `audit_logs` materialised in Phase 63)*
**Backend env:** `CLIENT_URL = https://openi.ai` *(corrected 8 May from legacy `openi-hub.vercel.app`)*
**Staging domain:** https://www.openi.tech *(perpetual staging on the legacy `.tech` registrar)*
**Fallback URL:** https://openi-hub.vercel.app *(kept for preview deploys; do NOT use as `CLIENT_URL`)*

### What's New in v3.1 — Phase 65d (Post-Verify Redirect + Retry-Once) + Phase 65e (3-Field Signup)

Triggered by user screenshots showing Test_Startup3 with an empty My Profile after verify-email even though the DB row was populated, plus user feedback that 7 fields was still too many for first-time signups.

- **Phase 65d — Post-verify redirect lands on populated My Profile** 🪞 (commit `ce9b303`) — Even with the CLIENT_URL fix (Phase 18), users completing verify-email and navigating to My Profile saw an EMPTY form because the GET raced with the post-PUT cleanup (search_vector rebuild + profile_score recompute) that runs after `flushPendingProfile()`. Re-login showed the data correctly because by then the cleanup had settled. Fix:
  1. `VerifyEmail.jsx` (both link + OTP paths): redirect post-verify from `/dashboard` to `/dashboard/profile?fresh=1`. Toast copy changed to "Loading your profile…".
  2. `MyProfile.jsx`: detects `?fresh=1`, runs `loadProfile()` as before, but if the first GET response looks empty (fewer than 3 populated persona fields beyond registration defaults), retries the GET once after 500ms so the post-PUT cleanup settles. Strips `?fresh=1` from the URL on first load so a hard refresh does not re-trigger the retry.
  - Persona-agnostic — the same `VerifyEmail.jsx` and `MyProfile.jsx` serve all 11 personas.
  - **General lesson:** any UI that reads from a row immediately after writing it should expect the read to be transiently empty for a few hundred ms while async post-write side-effects finish.

- **Phase 65e — Trim Step 2 of registration from 7 fields to 3** ✂️ (commit `2af1551`) — Phase 65 cut Step 2 from 45 to 7 fields. User feedback: 7 is still a wall. Trimmed to 3 high-signal fields per persona. Strategy: required identity field + one classification field (drives recommendation engine) + one short text field (drives Directory cards and search vector). Everything else moves to My Profile. Per-persona breakdown:
  - startup → company_name, sector, tagline
  - student → institution, research_areas, bio
  - academia → institution_name, research_areas, bio
  - corporate → company_name, industry, description
  - government → body_name, body_type, description
  - investor → firm_name, investor_type, bio
  - mentor → organisation, expertise, bio
  - lab → lab_name, lab_type, description
  - incubator → incubator_name, focus_sectors, description
  - accelerator → accelerator_name, focus_sectors, description
  - service_provider → company_name, service_categories, tagline
  - The prominent "Skip for now" secondary button from Phase 65 stays in place.
  - All 11 personas verified to have 3 valid `REGISTER_FIELDS` entries that map to real `PROFILE_FIELDS` names.
  - Bundle `index-GFNaJBuK.js` confirmed live with 65d + 65e markers.

### What's New in v3.0 — Phase 65c (Brand-Mark Consistency) + CLIENT_URL Fix (Cross-Origin Stash Recovery)

Triggered by Shameel Abdulla and the testing team on 8 May 2026 noon: even after the Phase 64/65/65b backend fixes shipped, registered profile data still wasn't reflecting in the dashboard. The actual root cause was an environment-config drift — not a code bug.

- **`CLIENT_URL` env-var fix on Railway** 🔗 — `CLIENT_URL` was still set to `https://openi-hub.vercel.app` (the legacy Vercel preview hostname). `emailVerificationController.js` builds verify URLs as `${CLIENT_URL}/verify-email/${token}`, so emails sent users to `openi-hub.vercel.app` while they had registered on `openi.ai`. **localStorage is partitioned per-origin** — the Step 2 profile stash (`openi_pending_profile`) written on `openi.ai` was invisible to the verify-tab on `openi-hub.vercel.app`. Result: `flushPendingProfile()` in `VerifyEmail.jsx` saw no stash and returned silently. The user landed on a blank profile and reported "data isn't reflecting."
  - **Fix:** `railway variables --set "CLIENT_URL=https://openi.ai"`. Container env now reads the canonical hostname.
  - **Verified live** by driving Chrome through the Amber Kinetics demo startup account: edit Tagline → Save Profile → `PUT /api/profile/me 200` → `startup_profiles.updated_at` advanced → `directory_profiles.tagline` synced → `users.profile_completed = true`.
  - **Latent in two other places:** password-reset and claim-verify links share the same `CLIENT_URL`. They will now route correctly post-fix, but the same trap will recur if the canonical hostname ever moves again. **Audit `railway variables` whenever canonical hostnames change.**

- **Phase 65c — OpenI brand mark on every auth and legal page** 🎨 (commit `1779402`) — Phase 11 (7 May) wired the OpenI logo into Login, DashboardLayout sidebar, PublicLayout footer, and Landing — but missed every page in `src/pages/auth/`. Result: registration, verify-email, forgot-password, reset-password, claim-verify, terms, and privacy all rendered without the OpenI brand mark, so users dropping in mid-flow had no idea what site they were on.
  - Each affected page now renders `/openi-logo.png` inside a `<Link to="/">` with an `onError` fallback. Register.jsx keeps the persona-color Shield as a hidden secondary fallback (since it also communicates persona color).
  - Pages touched: `Register.jsx` (Step 0 persona picker + main view), `VerifyEmail.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `ClaimVerify.jsx`, `Terms.jsx`, `Privacy.jsx`. 7 files, 106 insertions.
  - Verified live: deployed bundle `index-BoNt9zWA.js` contains 3 references to `/openi-logo.png`; visual confirmation via screenshot at `https://openi.ai/register?type=startup`.

### What's New in v2.9 — Phase 64 (Profile Save Coerce) + Phase 65 (Range Guard + Crawl-Overwrite Protection + Cleanup) + Phase 65b (Empty-String to NULL)

Triggered by user feedback from Shameel Abdulla on 8 May 2026: profile save was 500ing silently, the Number-of-Customers field accepted negatives, the Step 2 registration form was 45 fields long, and the public Marketplace was showing dummy demo challenges.

- **Phase 64 — Profile Save Coerce + Error Log** 💾 (commit `a474bb4`) — `PUT /api/profile/me` was returning HTTP 500 in 8 ms with no server-side log because `res.status(500).json({message: err.message})` consumed the error without ever calling `console.error`. Reproduced via direct SQL: of 14 plausible payload shapes, exactly one fails — a comma-separated **string** going into a `text[]` column raises `malformed array literal: …`. Likely culprits: `awards`, `certifications`, `accelerator_programs`, `investor_names`, `technologies`, `focus_areas`, all rendered with `TagInput` on the registration form.
  - Added `coerceUpdates(table, updates)` in `profileController.js`. Per-table column type maps (`ARRAY_COLUMNS`, `NUMERIC_COLUMNS`, `DATE_COLUMNS`) drawn from live prod `information_schema`.
  - Rules: `text[]` accepts arrays as-is; comma-strings split-trim-array; `''` drops the field. Numeric `''` → drop; numeric strings → `Number()`; NaN → drop. DATE `''` → drop (PG rejects empty strings for DATE).
  - Added `console.error` in the 500 catch block: `[updateMyProfile] FAILED user_id=… table=… cols=[…] err=…` so future regressions surface in Railway logs immediately.
  - 15 local unit cases pass. Verified end-to-end on prod with a Shameel-style payload: 500 → 200, fields stored correctly, then reverted to baseline.

- **Phase 65 — Range Guard + Crawl-Overwrite Protection + Dummy-Data Cleanup** 🛡️ (commits `b0258fd` backend + `3c67260` frontend)
  1. **Numeric range guard.** Frontend `personas.js`: every `type:'number'` field gains explicit `min: 0` and a meaningful `max` where one exists — `tech_readiness 1-9`, `equity_taken 0-100`, `runway_months 0-600`, `years_experience 0-80`, `years_in_business 0-200`, `average_response_days 0-365`, `capacity / max_mentees / cohort_size / batch_size 0-10000`, year columns capped at `current_year+5` (or `+10` for graduation). Backend `profileController.coerceUpdates`: new `NUMERIC_RANGES` per-persona table; default floor `min: 0` for any numeric column without an explicit range. Out-of-range values silently dropped so the rest of the payload still saves. Belt-and-braces against direct API callers who bypass the frontend.
  2. **Short Step 2 registration form.** New `REGISTER_FIELDS` export in `personas.js` — short per-persona list (~6 fields) for Step 2. PROFILE_FIELDS still drives My Profile so users can fill the long form later. For startup the short list is `company_name *, sector, stage, country, state, city, description`. `Register.jsx` Step 2 imports the short list, adds a yellow nudge banner ("Just the basics for now — you can complete the rest from My Profile after signup. The more you fill in, the better your visibility in search and recommendations.") and replaces the previously-tiny gray skip link with a real outlined secondary button: "Skip for now — finish profile after signup". Net effect: startup signup drops from 45 fields to 7.
  3. **Crawl-overwrite protection.** Three layers:
     - `deepEnrichService.enrichStartup` per-row guard: skips `is_imported = false OR claimed_at IS NOT NULL` regardless of how the function was invoked. Returns `{skipped: true, reason: 'profile owned by user'}`.
     - `deepEnrichService.enrichBatch` SQL: JOINs `users` and adds `AND u.is_imported = TRUE AND u.claimed_at IS NULL` to the eligibility predicate. The cron never even considers human-owned profiles.
     - All `=` writes in `deepEnrichService.enrichStartup` (sector, business_model, revenue_model — Phase 50 had explicitly overridden these "because deep-enrich is fresher than RSS"; the argument doesn't extend to claimed/self-registered profiles), `enrichController.applyEnrichment`, and `enrichController.applyEnrichmentRow` (admin paths) converted to `COALESCE(col, $N)`. Admin-applied enrichment is now strictly fill-only. `applyMyProfile` (where the user explicitly opts in via the Auto-Fill UI) intentionally left as direct overwrite.
  4. **Dummy-data cleanup script (`phase65-cleanup-dummy-data.js`).** Single-transaction delete of public-facing dummy content:
     - 3 demo corporate challenges (ids 11, 12, 13 — Tata Advanced Systems samples by `corporate@demo.openi.ai`)
     - 793 `@synthetic.openi.ai` users (497 students + 296 academia from a 28-Apr-2026 synthetic seed batch). Cascades 296 academia + 497 student profiles + 793 directory_profiles + 793 user_roles via existing `ON DELETE CASCADE` FKs.
     - 294 seeded cohorts (`created_by IS NULL`)
     - 490 seeded events (`created_by IS NULL`)
     - **Preserved:** all 11 `*@demo.openi.ai` accounts (ids 7-17), all 5 legacy DRDO/armortech/iitd test accounts (ids 2-6), all ~577k `@import.openi.ai` real RSS-crawled startups, all real human signups (Vanessa, Shameel, Sharad, etc.).
     - Pre-flight verified zero applications, zero NO-ACTION FK rows, zero cohort_startups, zero event_registrations depend on these. Final clean run took 1.5 seconds.
     - **Operational gotcha:** the original cleanup script's sanity check used `NOT IN (SELECT id FROM users)` antijoin against 580k+ users with no covering index. That hung for minutes holding row exclusive locks on `challenges` (the DELETE was earlier in the same transaction). When the SSH transport was killed, the DB transaction stayed alive holding all its locks; had to `pg_terminate_backend()` orphaned sessions to release. **Lesson:** trust `ON DELETE CASCADE` FKs, never run `NOT IN (SELECT … FROM users)` antijoins as defensive checks on this DB. Stopping `railway ssh` does NOT roll back the transaction inside the container.

- **Phase 65b — Empty-String to NULL on Plain-Text Profile Columns** 🧼 (commit `0fc8bb7`) — Phase 65's `COALESCE(col, $N)` enrichment guards treat NULL as "user has not filled this in yet, safe to fill." But the controller was still letting empty strings reach text/url/select columns. A user who hit Save with an empty tagline or website would store `''`, which `COALESCE` treats as a value and skips. Net effect: empty form on Day 1 would silently lock the user out of crawler-driven auto-fill forever.
  - **Fix:** added an `else` branch in `coerceUpdates` — for any non-array, non-numeric, non-date column, drop whitespace-only strings (`if (typeof v === 'string' && v.trim() === '') delete updates[col]`). Booleans, numbers, and other non-string scalars fall through untouched. 16 local unit cases pass.
  - **One-shot sweep (`phase65b-empty-string-to-null.js`).** Per-table sweep that NULL'd existing `''` text values across all 11 persona profile tables + `directory_profiles`. Each table runs in its own transaction so a failure on one doesn't block others. Idempotent.
  - **Sweep results:** 4,558 rows updated total. Bulk was `startup_profiles.startup_type` (4,550 rows from a historical CSV import). Other touches: `startup_profiles.tagline` (1), `startup_profiles.description` (1), `corporate_profiles.city/logo_url` (1+1), `directory_profiles.tagline/city/logo_url` (2+1+1). Sweep took ~4 minutes (583k rows × 41 text columns).
  - **Verified end-to-end on prod:** `PUT /profile/me {tagline:""}` now correctly returns `400 No valid fields to update` (the only field was dropped) instead of storing `''`. Mixed payloads (empty tagline + valid description + invalid customer_count) save the valid pieces and preserve the rest.

- **E2E test bundle.** 29/29 controller-level checks pass + HTTP integration test pass against `https://api.openi.ai`:
  - T1: Profile save with messy payload (Phase 64) — 7/7 (comma-string → array, `''` for date dropped, numeric string coerced, plain text saved)
  - T2: Negative number guard (Phase 65) — 6/6 (-5, -1000, TRL 0, runway 9999 all dropped; 0 accepted; valid description survives)
  - T3: Dummy-data cleanup — 6/6 (challenges/cohorts/events tables empty; @synthetic users gone; cascades verified)
  - T4: Demo + legacy accounts preserved — 4/4
  - T5: ~577k `@import.openi.ai` real crawled startups untouched — 2/2
  - T6: `enrichStartup(601902)` skips Shameel — 2/2
  - T7: Public marketplace + directory checks — 2/2
  - HTTP: login as `startup@demo.openi.ai` → PUT with negative + comma-string + valid fields, verify behavior, revert.

### What's New in v2.8 — Phase 61 (Crawl Sources Dedup) + Phase 62 (Weighted Recommendations) + Hotfixes

Operational hardening and recommendation-quality work shipped 7 May 2026:

- **Phase 61 — Crawl Sources Dedup & Idempotent Seed** 🧹 — Discovered that every backend deploy was silently inserting 8 duplicate `crawl_sources` rows because the seed used `ON CONFLICT DO NOTHING` with no conflict target and no `UNIQUE(name)` constraint existed. After ~89 deploys, production held **717 rows for 10 logical sources**. The dependent `crawled_startups` insert hard-coded literal `source_id` PKs (1,2,4,5,6) that referenced rows from the very first seed run; once those rows were deleted, SERIAL never reused the IDs and the seed started raising `crawled_startups_source_id_fkey` violations on every container boot.
  - Migration in `src/startup.js#runMigrations`: repointed `crawled_startups.source_id` and `crawl_jobs.source_id` from each duplicate to the per-name `MIN(id)` survivor → DELETEd 707 non-survivor rows → ADDed `UNIQUE(name)` on `crawl_sources` → ADDed partial `UNIQUE INDEX idx_crawled_startups_cin_unique ON crawled_startups(cin) WHERE cin IS NOT NULL`. CIN (Companies Act unique id) chosen over UNIQUE(name) because 94 real distinct companies in production share names.
  - Seed code rewritten in both `src/startup.js#runSeed` and `src/db/seed.js`: `crawl_sources` insert now uses `ON CONFLICT (name) DO NOTHING`. `crawled_startups` and `crawl_jobs` use name-lookup subqueries `(SELECT id FROM crawl_sources WHERE name = ...)` instead of literal PKs, with `WHERE NOT EXISTS` idempotency guards.
  - Verified post-deploy: `crawl_sources COUNT = 10` (down from 717), `crawled_startups = 6,355` (untouched), `crawl_jobs = 6,164` (real RSS-crawler runs from Inc42, EU-Startups, TechCrunch, etc. — left alone).
  - **Operational gotcha worth knowing:** `migrate-bootstrap.js` calls `runMigrations` from `src/startup.js`, NOT from `src/db/migrate.js`. Two migration code paths exist; only the boot path is used in production. Always edit `startup.js` for schema changes that need to ship.

- **Phase 62 — Weighted Recommendations Overlap + Match Category Labels + Traction Signal** 🎯 — User feedback: investor "Recommended Startups" surface (and student/academia/accelerator/incubator/corporate equivalents) showed identical numeric scores like "score 11" on every card.
  - **Backend SQL fix (6 sites):** old SQL gave 1 point per investor term that *substring-matched* any startup tag, producing identical scores within a tightly-tagged demo cluster. New SQL awards **3 pts** for exact case-insensitive match, **1 pt** for substring match. Tie-breakers added (funding_raised → team_size → profile_score) for investor + corporate challenge surfaces. Files updated: `investorController.js`, `studentEnhController.js`, `academiaEnhController.js`, `acceleratorController.js`, `incubatorController.js`, `corporateController.js` (2 instances).
  - **Frontend category labels:** numeric "score X" replaced with colored chips — **Strong match** (green) when ≥15, **Good match** (amber) when ≥8, **Possible match** (gray) when 0<x<8, hidden when 0. The numeric was misleading when many cards in the same cluster legitimately tied; the chip communicates the meaningful tier.
  - **Traction signal tail:** chip now appends a persona-relevant signal so same-tier cards have visible differentiation:
    - Investor: prefers `funding_raised` (₹Cr/L/K), fallback `team_size`
    - Student/Academia: prefers `team_size`, fallback funding
    - Accelerator/Incubator: prefers `stage` (e.g. "Seed"), fallback team_size, fallback funding
  - Backend recommend SELECT lists for non-investor controllers extended to expose `funding_raised + team_size`. Result: instead of 8 cards all reading "score 11", the surface now shows "Good match · ₹50L", "Good match · 24 employees", "Good match · Seed-stage", etc.

- **Sentry noise suppression** 🔇 — Edited `src/instrument.js` to (a) skip Sentry init when `require.main` is under `src/scripts/*` (laptop one-offs no longer pollute production), (b) filter `Postgres` + `PostgresJs` OTel auto-instrumentation (kills the spurious `'sql'` TypeError; we use `pg`, not `postgres`), (c) drop `getaddrinfo ENOTFOUND` events via `beforeSend`, (d) tag environment as `'local'` when `RAILWAY_ENVIRONMENT` is unset (so laptop runs with `NODE_ENV=production` set locally don't appear in prod Sentry).

- **discoveryController hotfix** 🩹 — Investor sidebar → Find Students / Find Academia returned 500 with `column "persona_type" does not exist`. 5 SQL JOINs in `src/controllers/discoveryController.js` referenced `u.persona_type` on the `users` table, which has no such column. The actual columns are `users.role` (legacy single-persona) and `users.persona_category` (provider/seeker bucket). `persona_type` only exists on `directory_profiles`, not on `users`. Fixed by replacing all 5 occurrences with `u.role`.

- **OpenI logo navigation** 🏠 — Brand-mark logo in 4 places was a bare `<img>` with no link. Wrapped each in `<Link>`: `Login.jsx` → `/`, `DashboardLayout.jsx` sidebar → `/dashboard` (RouterLink alias to avoid collision with lucide-react's `Link` icon), `PublicLayout.jsx` footer → `/`, `Landing.jsx` footer → `/`.

- **Vercel SSL UI non-issue diagnosed** 🔒 — Vercel project page shows "Attempting to create SSL certificates" with red icons next to `openi.ai` and `www.openi.ai`. Reality: HTTP 200 on all hostnames, valid Let's Encrypt R13 certs (issued 6 May 2026, valid until 4 Aug 2026), all recent deployments `READY`. UI is showing stale state from a queued cert renewal job. Action: wait for self-heal; do **NOT** click Refresh/Renew or remove-and-re-add domains.

- **DNS correction** — Earlier session notes claimed `openi.ai` DNS lives on GoDaddy nameservers (`ns53/ns54.domaincontrol.com`). Confirmed on 7 May 2026 that DNS is actually on **Cloudflare** (`crystal.ns.cloudflare.com`, `neil.ns.cloudflare.com`). GoDaddy is registration only.

### What's New in v2.8.1 — Phase 63 (Audit Logs Backfill)

Shipped 7 May 2026. Audit middleware has existed since Phase 28, but the `audit_logs` table only lived in `src/db/migrate.js` — which is **not** invoked in production (`RUN_MIGRATIONS_ON_BOOT` is disabled, and `migrate-bootstrap.js` calls `runMigrations` from `src/startup.js`). Result: every audited write since Phase 28 was logging `relation "audit_logs" does not exist` and silently dropping the audit row. The middleware swallowed the error in a `.catch((err) => console.error(...))` so the platform appeared healthy while the audit trail was completely empty.

- **Phase 63 — Backfill `audit_logs` in prod** 📒 (commit `6e52de2`) — Added the table + 2 indexes inside `src/startup.js#runMigrations` so the next `migrate-bootstrap.js` run materialises it.
  - **Schema:** `id SERIAL PK, user_id INTEGER REFERENCES users, action VARCHAR(100), entity_type VARCHAR(50), entity_id INTEGER, details JSONB, ip_address VARCHAR(50), created_at TIMESTAMP`.
  - **Indexes:** `(user_id, created_at DESC)` and `(created_at DESC)` — supports the two read paths in `auditController.js` (per-user audit trail + global recent-activity feed for `adminController.js:148`).
  - **Rollout:** push to main → Railway autodeploy → `railway ssh` → `node src/scripts/migrate-bootstrap.js`.
  - **Verification:** `to_regclass('audit_logs') = 'audit_logs'`, `count = 0` immediately after migration, fresh Railway logs free of `Audit log failed`.
  - **General lesson:** `.catch((err) => console.error(...))` in middleware can hide a broken-for-months invariant. Periodically grep Railway logs for `failed:` / `does not exist` to surface silent middleware failures. The same pattern caused Phase 64's profile-save 500s to go unreported until Shameel flagged them on 8 May.

### What's New in v2.7 — Phase 60.11: GST Invoice Compliance End-to-End
The GST invoice baseline shipped in v2.6 is now **fully compliant with Indian GST law** and validated end-to-end on real production data. Three fixes:

- **Sequential, gap-free, fiscal-year-scoped invoice numbers** 🧾 — Format `OPENI/FY25-26/0001`. New `invoice_sequences` table holds the per-FY counter; new `services/invoiceNumberService.js` provides `nextInvoiceNumber(client)` which uses `pg_advisory_xact_lock` keyed by an SHA-256-hashed FY string + atomic `INSERT … ON CONFLICT DO UPDATE` for the increment. Generated **inside** the verifyPayment transaction so a `ROLLBACK` releases the lock and frees the number for the next caller (no gaps). Format helper `computeFiscalYear()` follows Indian fiscal year (Apr–Mar). Sequence resets each fiscal year.
- **Mandatory customer billing address** 📋 — New `billing_addresses` table (one row per `(user_id, role)`), new `controllers/billingAddressController.js` exposing `GET /api/billing-address` and `PUT /api/billing-address`. Server-side validation: legal_name/line1/city/state/country/postal_code required; Indian pincode regex `^[1-9][0-9]{5}$`; full GSTIN regex; state_code resolved from `services/indianStates.js` (canonical 36-state map). `subscriptionController.createOrder` and `verifyPayment` now hard-gate on a complete row (return `400 BILLING_ADDRESS_REQUIRED` otherwise). `pdfService.generateInvoicePdf` throws if mandatory fields are absent — no more silent blank invoices. New JSONB `payment_history.billing_address_snapshot` column captures the address at invoice time so future edits to the live `billing_addresses` row never mutate historical invoices (audit-grade).
- **Export under LUT** 🌍 — `computeGstBreakdown` accepts `opts.isExport`: when the customer's country ≠ India, returns `cgst=sgst=igst=0`, `total = taxable`, `gstRate = 0`. PDF renders `IGST @ 0% (Export under LUT)` instead of CGST/SGST or domestic IGST, and replaces the reverse-charge declaration with the mandatory CGST Rule 96A declaration: *"Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax."* Optional `LUT_ARN` env var, when set, is appended to the declaration. Razorpay is charged the base price only (no GST collected on export).
- **Frontend Billing Details modal** 🎨 — New `components/BillingAddressModal.jsx`. **Country, State, and City all rendered as dropdowns** (Country via `COUNTRIES` ISO list; State via existing `StateField`; City via existing `CityField` searchable autocomplete from Phase 60.10). Wired into `Settings.jsx`: `handleUpgrade` refuses to call `createOrder` until a complete row exists; if missing, opens the modal and resumes the deferred upgrade flow once saved. Defence-in-depth: backend `BILLING_ADDRESS_REQUIRED` response also opens the modal. New "Billing Details" card on the Billing tab with Edit button, displays the saved address with an LUT notice for international customers.
- **Closed schema drift** — `payment_history.gst_breakdown` (JSONB) and `payment_history.is_legacy_inclusive` (BOOLEAN) columns were inserted by v2.6 code but never declared in DDL. Now formally declared in `migrate.js` + `startup.js`.
- **`pgr_advisory_xact_lock` migration runner** — Schema migrations applied via `npm run migrate:bootstrap` inside the Railway container (`railway ssh` → `node src/scripts/migrate-bootstrap.js`). Idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- **TOTAL row clipping fix** — Tax-value column geometry corrected: text frame anchored at `(pageWidth - rightMargin - 6 - taxValueWidth)` so right-aligned values sit 6 px inside the content edge with consistent gutter. Was clipping the last "00" of bold totals like `Rs. 2,499.00`.

**Production validation — first GST-compliant invoice issued** ✅
Vanessa Banduni (corporate persona, paid Pro plan in the afternoon) was backfilled via a one-off transaction script (`src/scripts/backfill-vanessa-invoice.js`) that:
1. Inserted into `billing_addresses` for her `(user_id, role)`
2. Generated `OPENI/FY26-27/0001` via `nextInvoiceNumber()`
3. UPDATEd her `payment_history` row with `invoice_number` + JSONB `billing_address_snapshot`

The re-rendered PDF was audited against the GST Tax Invoice Rules: ✅ unique sequential number, ✅ supplier + recipient legal names with addresses, ✅ GSTIN of supplier (recipient unregistered), ✅ HSN/SAC code, ✅ taxable value + IGST 18% breakdown (Karnataka 29 vs Maharashtra 27 = inter-state), ✅ amount in words, ✅ reverse-charge declaration, ✅ system-generated disclaimer.

### What's New in v2.6 — `.ai` Cutover, Multi-Persona V2, Email Verification, GST Invoicing
- **Production cutover to `openi.ai`** 🌐 — All three production hostnames are LIVE: `openi.ai`, `www.openi.ai`, and `api.openi.ai` (Railway-issued SSL). Backend `allowedOrigins` carries both `.ai` (production) and `.tech` (staging) origins. The `.tech` domain is now perpetual staging — both still serve, but new traffic goes to `.ai`. Email `Reply-To` hardcoded to `info@openi.ai`; `MAIL_FROM` supports a sending subdomain.
- **Multi-Persona V2 — `activeRole` + 11 personas** 👥 — A single user can now hold multiple persona roles (e.g., be both a Mentor and an Investor) and switch their `activeRole` to flip the entire dashboard, sidebar, redirects, and per-role billing. Two new personas added: **Service Provider** and **Mentor** demo accounts (now 11 total V2 personas). New `user_roles` table (user_id, role, is_primary, added_at). New endpoints `GET /api/auth/roles`, `POST /api/auth/roles/add`, `POST /api/auth/roles/set-primary`, `POST /api/auth/roles/remove`. Subscription rows now include `role` so each persona gets independent billing limits (Phase 60.4a).
- **Email Verification (Link + OTP) + Password Reset** 📧 — New `email_verifications` table + `users.email_verified_at` column. Two co-equal verify paths: click magic link or paste OTP. Defeated Gmail's link-prefetch by requiring an explicit button click on the landing page and using `localStorage` cross-tab sync. Step 2 profile data stashed in `localStorage` to survive Gmail's "open in new tab". Password-reset flow uses the same email-token mechanism. 4 actions are gated behind email verification (`EMAIL_NOT_VERIFIED` error code drives a redirect to `/verify-email`).
- **Mandatory Terms of Use Gate** 📜 — Phase 60.7 — `users.terms_version_accepted` column. Register requires `terms_accepted: true`. `TERMS_VERSION` bumped to **1.1** with new partners default. Users on an older `terms_version_accepted` are routed to a re-accept gate before they can use gated actions.
- **GST-Compliant Tax Invoicing** 🧾 — Real Indian GST tax invoices generated as PDF (PDFKit, `services/pdfService.js`) and auto-attached to subscription receipt emails. Legal entity: **OpenI Partners LLP** (registered in Maharashtra). Includes GSTIN, HSN/SAC, 18% GST breakdown (CGST/SGST split for intrastate, IGST for interstate), reverse-charge declaration, sequential invoice numbers. Pricing cards now show "+ 18% GST · total" annotation. Settings → Billing has a discoverable **Download Invoice** button.
- **Fuzzy Startup Search via `pg_trgm`** 🔍 — Company-name search uses PostgreSQL trigram similarity blended into the relevance ranking. Tolerates typos and partial matches. Search cards across the app are clickable and route to the dashboard detail page. `?by=user_id` query param disambiguates the id-vs-user_id collision when a search card hits the API.
- **Location Autocomplete (State + City)** 🌍 — New Phase 60.10 register/profile dropdowns for location, money, and year. Public endpoints under `/api/public/locations/...` resolve state name → ISO code → cities via the country-state-city dataset. `StateField` and `CityField` components wired into Register Step 2 + MyProfile.
- **"Claim This Profile"** 🏷️ — J10 ships a "Claim This Profile" button + modal on `StartupProfile`. Authenticated users can request to claim crawler-imported startup profiles. Public logo-upload endpoint (Phase 60.8a) lets unverified claimants attach a logo while the claim is in review.
- **Owner-Deletable Challenges** 🗑️ — s49: corporate/government challenge owners can now delete their own challenges (previously admin-only).

### What's New in v2.5 — Public Pages + Landing Enhancement + Corporate Analytics
- **Public Marketplace** (`/marketplace`) 🏪 — Fully public page (no authentication required) showing all open innovation challenges. Features search bar, sector/technology filter dropdowns, 12-card grid with company logos, tags, budget, deadline, and applicant count. Click any card for full detail view with problem statement, description, requirements, FAQs, and a "Register to Apply" CTA. Pagination supports browsing 130+ challenges.
- **Startup Reports** (`/reports`) 📊 — Public page with curated startup ecosystem reports across 8 sectors: DeepTech, AI/ML, Defence, CleanTech, HealthTech, Cybersecurity, Quantum, and Semiconductor. Sector filter pills, report cards with cover gradients, status badges (Available/Coming Soon), and download-to-register modal. Data is CMS-ready (hardcoded arrays, easily swappable with Strapi/Sanity API calls).
- **Landing Page Enhancement** (620→824 lines) 🎨 — 5 new sections added: Stats/Social Proof (4 metrics), Ecosystem Partner Logos (DRDO, DPIIT, iDEX, NASSCOM, Startup India, AIM), Testimonials (3 cards with 5-star ratings), FAQ Accordion (6 expandable questions), LinkedIn + X social media icons in header AND footer. Improved feature descriptions, 2 new feature cards (Recommendations Engine, Public Marketplace), "Browse Challenges" CTA in hero.
- **PublicLayout Component** — Shared header/footer for all public pages (`/marketplace`, `/reports`) matching Landing.jsx brand styling. Active nav highlighting, LinkedIn/X social icons, consistent design.
- **Corporate Dashboard Analytics** 📈 — New "Challenge Performance" section on the corporate dashboard. Shows application status breakdown (total/applied/shortlisted/selected/rejected) with color-coded metric cards and a visual conversion funnel (applied → shortlisted → selected with percentage bars).
- **Public API Endpoints** (4 new, no auth required):
  - `GET /api/public/challenges` — list open challenges with search + sector/technology/usecase filters + pagination
  - `GET /api/public/challenges/:id` — full challenge detail
  - `GET /api/public/reports` — startup ecosystem reports with sector filter
  - `GET /api/public/stats` — platform statistics (startup count, corporate count, challenge count, application count)
- **Social Media Integration** — LinkedIn (https://www.linkedin.com/company/openi-partners/) and X (https://x.com/OpenIPartners) icons added via inline SVGs (lucide-react v0.294 doesn't include social icons). Present on Landing page header/footer, PublicLayout header/footer.
- **CMS Planning** — Strapi recommended for future integration. All landing page content (stats, partners, testimonials, FAQs) and reports stored in const arrays at file top — designed for easy migration to CMS fetch calls without changing rendering logic.

### What's New in v2.4 — Marketing Landing Page + Brand Polish
- **New Marketing Landing Page** 🎨 — Replaced the direct persona-picker landing with a proper 7-section marketing site: sticky header, hero ("Partner. Source. Invest."), how it works (3 steps), built-for-every-stakeholder (Provider/Seeker split), features grid (8 cards), pricing (Free/Pro/Enterprise), final CTA, and footer. Professional/corporate tone with gold accents and fully mobile responsive.
- **Brand Logo on Public Pages** — Replaced the hardcoded Lucide Shield placeholder with the actual `/openi-logo.png` brand asset on the Landing and Login pages. Dashboard layout already used the correct logo. Shield fallback preserved via `onError` handler for graceful degradation if the asset ever fails to load.
- **Root Route Fix** — First-time visitors to `openi.tech` now see the Landing page instead of being redirected straight to the login form. New `RootRoute` component checks auth state and renders `<Landing />` for guests, `<Navigate to="/dashboard" />` for authenticated users. The `/landing` URL is preserved for backward compatibility.

### What's New in v2.3 — SOFT LAUNCH DAY
- **openi.tech is LIVE** 🚀 — Frontend deployed to custom domain `www.openi.tech` with Vercel-issued Let's Encrypt SSL. Apex `openi.tech` redirects to `www` with HTTP 308 Permanent Redirect and HSTS (max-age 63072000). DNS propagated globally within 10 minutes via GoDaddy nameservers.
- **DNS Configuration at GoDaddy** — 4 records: `A @ 216.198.79.1` (Vercel apex), `CNAME www → 4d8d9078365453ff.vercel-dns-017.com` (Vercel project-specific), `CNAME api → 9yr0x9xw.up.railway.app` (Railway), `TXT _railway-verify.api` (Railway domain verification).
- **Razorpay KYC Submitted** — Business documents uploaded to Razorpay. Awaiting authorization certificate (1–3 business days). Upon approval, will switch from test keys to live keys and enable real payments.
- **Partial Backend Custom Domain** — `api.openi.tech` added to Railway, DNS verified, but Let's Encrypt cert provisioning still in progress (Railway's CA queue is slow). Frontend continues to use the Railway-generated URL until cert issuance completes.

### What's New in v2.2
- **Production Go-Live Plan** — Complete migration plan to custom domain `openi.tech` captured in Section 14. Covers Vercel + Railway custom domains, GoDaddy DNS configuration, env var changes, Razorpay live mode switch, end-to-end smoke test checklist, and rollback procedures.
- **CORS Whitelist Updated** — Backend `src/server.js` now includes `openi.tech`, `www.openi.tech`, and the existing Vercel URL as a transition fallback. Committed as part of the go-live workstream.
- **Backend Package Rename** — `drdo-hub-backend` → `openi-hub-backend` for brand consistency (commit `a3d63a0`).

### What's New in v2.1
- **Razorpay Payment Integration (live)** — Real Razorpay checkout enabled on the Settings → Billing tab. Checkout JS SDK loaded in `index.html`; `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` configured on Railway. Users can now upgrade to Pro (INR 999/mo) or Enterprise (INR 4999/mo) with real payments.
- **Subscription Plans & Usage Gating** — 3-tier freemium model (Free / Pro / Enterprise) with monthly usage limits on challenges, applications, meetings, and file uploads. `checkUsageLimit` middleware enforces limits and returns 403 + upgrade URL when exceeded.
- **File Uploads via Cloudinary** — `POST /api/upload` endpoint with multer + Cloudinary SDK; reusable `FileUpload` component on the frontend (drag-and-drop, preview, URL fallback).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Multi-Persona System](#2-multi-persona-system)
3. [Architecture](#3-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Getting Started](#5-getting-started)
6. [Frontend Modules](#6-frontend-modules)
7. [Backend API Reference](#7-backend-api-reference)
8. [Database Schema](#8-database-schema)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Security Features](#10-security-features)
11. [Licensing & Payments (Razorpay)](#11-licensing--payments-razorpay)
12. [Deployment](#12-deployment)
13. [Test Accounts](#13-test-accounts)
14. [Production Go-Live (openi.ai) — COMPLETE](#14-production-go-live-openiai--complete)
15. [Marketing Landing Page](#15-marketing-landing-page)
16. [Public Pages (v2.5)](#16-public-pages-v25)
17. [Multi-Persona V2 (`activeRole`, Phase 60.2–60.4)](#17-multi-persona-v2-activerole-phase-602604)
18. [Email Verification, Password Reset, Terms-of-Use Gate](#18-email-verification-password-reset-terms-of-use-gate)
19. [GST-Compliant Invoicing (OpenI Partners LLP)](#19-gst-compliant-invoicing-openi-partners-llp)

---

## 1. Project Overview

OpenI Hub is a **multi-persona open innovation platform** that connects the entire startup ecosystem. It divides stakeholders into **Innovation Providers** (startups, students, academia) and **Innovation Seekers** (corporates, government, investors, mentors, labs, incubators, accelerators), giving each persona a dedicated registration, profile, and navigation experience on a single platform.

The platform enables discovery, evaluation, incubation, and tracking of deep-tech startups across AI/ML, Cybersecurity, Quantum Technology, UAV Systems, Space Tech, and more.

### Key Capabilities

- **Multi-Persona Ecosystem** - 10 distinct persona types with self-service registration, dedicated profiles, and tailored navigation
- **Cross-Persona Communication** - All personas can message each other and (Phase 2) schedule meetings
- **Startup Discovery & Registration** - Browse, filter, and register defence-tech startups
- **8-Vector Evaluation Framework** - Score startups across 103 criteria in 8 vectors (People, Strategy, Revenue, Technology, Financials, Info Visibility, GRC, Step Change)
- **Pipeline Management** - Track startups through 7 stages: Application > Screening > Evaluation > Selection > Onboarding > Incubation > Graduation
- **Project & Task Management** - Track projects, milestones, budgets, and tasks per startup
- **Messaging System** - Real-time internal communications with conversation threading
- **IPR Database** - Track patents, trademarks, copyrights, and designs
- **Infrastructure Booking** - Reserve labs, test facilities, and HPC clusters
- **DeepTech Qualification** - Score startups on a 16-question deep-tech framework
- **Government API Integrations** - Connect to DPIIT, MCA, GST, UDYAM, MeitY, DigiLocker
- **Web Crawling** - Discover startups from government portals and incubators
- **Knowledge Base** - Articles, guides, policies, and training materials
- **Document Repository** - Centralised document storage with access controls
- **Watchlists** - Curated startup lists for tracking
- **Events Management** - Hackathons, workshops, demo days, conferences
- **Feedback System** - Collect and act on startup feedback with analytics
- **SME Management** - Subject matter expert directory and mentoring assignments
- **Cohort Management** - Manage incubation cohorts with startup membership
- **Audit Logging** - Track all write operations for compliance

---

## 2. Multi-Persona System

### Persona Categories

| Category | Personas | Description |
|----------|----------|-------------|
| **Innovation Providers** | Startup, Student, Academia | People/orgs with innovations to offer |
| **Innovation Seekers** | Corporate, Government, Investor, Mentor, Lab, Incubator, Accelerator | People/orgs looking for innovations |
| **Platform Admins** | Admin, Evaluator | Platform operators (not self-register) |

### Registration Flow

1. User visits `/landing` and selects their persona type
2. Redirected to `/register?type=<persona>` (e.g., `?type=investor`)
3. **Step 1:** Account setup (name, email, password, organization)
4. **Step 2:** Persona-specific profile fields (auto-generated from `personas.js` config)
5. **Step 3:** Success — redirected to dashboard or profile editor
6. Backend creates: user record + persona profile row + directory_profiles entry

### Persona Profile Tables

Each persona has a dedicated profile table with type-specific fields:

| Persona | Table | Key Fields |
|---------|-------|------------|
| Startup | `startup_profiles` | company_name, sector, stage, funding_raised, tech_readiness, technologies[] |
| Student | `student_profiles` | institution, degree, research_areas[], skills[], looking_for[] |
| Academia | `academia_profiles` | institution_name, institution_type, publications_count, offerings[] |
| Corporate | `corporate_profiles` | company_name, industry, company_size, innovation_areas[], looking_for[] |
| Government | `government_profiles` | body_name, body_type, focus_areas[], programs[] |
| Investor | `investor_profiles` | firm_name, investor_type, fund_size, ticket_size_min/max, focus_sectors[] |
| Mentor | `mentor_profiles` | designation, expertise[], years_experience, offering[], max_mentees |
| Lab | `lab_profiles` | lab_name, lab_type, equipment[], capabilities[], hourly_rate |
| Incubator | `incubator_profiles` | incubator_name, focus_sectors[], cohort_size, equity_taken, services[] |
| Accelerator | `accelerator_profiles` | accelerator_name, batch_size, demo_day, corporate_partners[] |

### Directory Profiles (Search Layer)

The `directory_profiles` table is a denormalized search layer that aggregates key fields from all persona profiles for fast cross-persona search. Updated automatically when a user saves their profile.

### Persona-Aware Navigation

Each persona type sees a different sidebar navigation. Configured in `src/config/personas.js` via the `PERSONA_NAV` object. Admin/evaluator users see the full legacy navigation (21 items).

### Profile Fields Configuration

All form fields for registration and profile editing are defined in `PROFILE_FIELDS` in `personas.js`. This drives both the Register page and MyProfile page dynamically, supporting field types: text, number, url, select, textarea, checkbox, tags (array), multiselect.

---

## 3. Architecture

```
Frontend (React + Vite)          Backend (Node.js + Express)        Database
========================         ============================       ==========
Vercel (auto-deploy)             Railway (auto-deploy)              Railway PostgreSQL

src/                             src/
  config/personas.js               startup.js (entry point)
  context/AuthContext.jsx          server.js (Express app)
  services/api.js (20 modules)    db/
  components/LoadingSkeleton         pool.js (pg connection)
  pages/auth/ (2 pages)             migrate.js (42+ tables)
  pages/dashboard/ (27 pages)        seed.js (demo data)
                                   middleware/
                                     auth.js (JWT + persona fields)
                                     audit.js (audit logging)
                                   controllers/ (20 controllers)
                                   routes/index.js (~58 endpoints)
```

### Data Flow

1. User logs in via Login page > AuthContext stores JWT in localStorage
2. Frontend pages call api.js modules > Bearer token attached to all requests
3. Backend middleware verifies JWT > Controller queries PostgreSQL > Returns JSON
4. Audit middleware logs write operations asynchronously

---

## 4. Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router | 6.20.0 | Client-side routing |
| Vite | 5.0.0 | Build tool & dev server |
| Tailwind CSS | 3.3.6 | Utility-first CSS |
| Lucide React | 0.294.0 | Icon library (200+ icons) |
| react-hot-toast | 2.6.0 | Toast notifications |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5.2.1 | Web framework |
| PostgreSQL | 16 | Database |
| pg | 8.20.0 | PostgreSQL client |
| jsonwebtoken | 9.0.3 | JWT authentication |
| bcryptjs | 3.0.3 | Password hashing |
| helmet | 8.1.0 | Security headers |
| cors | 2.8.6 | Cross-origin resource sharing |
| express-rate-limit | 8.3.1 | Rate limiting |
| morgan | 1.10.1 | HTTP request logging |
| dotenv | 17.3.1 | Environment variables |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting (auto-deploy from GitHub) |
| Railway | Backend hosting + PostgreSQL database |
| GitHub | Source code (2 repositories) |

---

## 5. Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Railway database)
- Git

### Frontend Setup

```bash
cd openi-hub
npm install
cp .env.example .env    # Set VITE_API_URL
npm run dev             # http://localhost:5173
```

### Backend Setup

```bash
cd openi-hub-backend
npm install
cp .env.example .env    # Set DATABASE_URL, JWT_SECRET, etc.
npm run db:migrate      # Create tables
npm run db:seed         # Load demo data
npm run dev             # http://localhost:5000
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=https://openi.ai
```

> ⚠️ **`CLIENT_URL` audit checklist** (8 May 2026 lesson learned): `CLIENT_URL` MUST match the canonical user-facing origin where users register. It is concatenated by `emailVerificationController.js`, `claimController.js`, and the password-reset flow into the user-clickable links inside outbound emails. If `CLIENT_URL` ever drifts from the registration origin (e.g. you change canonical domain or accidentally leave a preview hostname here), email-link landings will arrive on a different origin from registration, **localStorage will be partitioned per-origin**, and the Step 2 profile stash will silently fail to flush. Run `railway variables | grep CLIENT_URL` after any DNS / domain rename to confirm. Same applies to `VITE_API_URL` on Vercel for API origin.

---

## 6. Frontend Modules

### 5.1 Pages (26 total)

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Login | `/dashboard/login` | Email + password with MFA OTP |
| 2 | DashboardHome | `/dashboard` | Stats, charts, evaluations, quick actions |
| 3 | StartupDiscovery | `/dashboard/startups` | Browse & filter startups with scores |
| 4 | StartupProfile | `/dashboard/startup-profile/:id` | Full startup detail (9 tabs) |
| 5 | StartupPipeline | `/dashboard/pipeline` | Kanban view by pipeline stage |
| 6 | RegisterStartup | `/dashboard/register` | 6-step registration wizard |
| 7 | StartupWatchlist | `/dashboard/watchlist` | Curated startup lists |
| 8 | StartupEvaluation | `/dashboard/evaluate` | 8-vector scoring form (103 criteria) |
| 9 | Evaluations | `/dashboard/evaluations` | Program evaluations with stages |
| 10 | Cohorts | `/dashboard/cohorts` | Incubation cohort management |
| 11 | Mentors | `/dashboard/mentors` | Mentor directory & assignments |
| 12 | ProjectManagement | `/dashboard/projects` | Projects with tasks & milestones |
| 13 | Messaging | `/dashboard/messaging` | Real-time messaging (5s polling) |
| 14 | EventsRepository | `/dashboard/events` | Hackathons, workshops, conferences |
| 15 | StartupFeedback | `/dashboard/feedback` | Feedback with analytics & sentiment |
| 16 | SMEManagement | `/dashboard/sme` | Subject matter experts directory |
| 17 | StartupCrawling | `/dashboard/crawling` | Web crawler for startup discovery |
| 18 | IPRDatabase | `/dashboard/ipr` | Patents, trademarks, copyrights |
| 19 | Infrastructure | `/dashboard/infrastructure` | Labs & facility booking |
| 20 | Knowledge | `/dashboard/knowledge` | Articles, guides, policies |
| 21 | DocumentRepository | `/dashboard/documents` | File management with access control |
| 22 | DeepTechQualification | `/dashboard/deeptech` | 16-question DeepTech assessment |
| 23 | GovtAPIIntegrations | `/dashboard/govt-apis` | Government API connections |
| 24 | Settings | `/dashboard/settings` | Profile, password, notifications |
| 25 | DashboardLayout | (shell) | Sidebar, topbar, notification bell |
| 26 | LoadingSkeleton | (component) | Shimmer loading animation |

### 5.2 API Service Modules (19 total)

Located in `src/services/api.js`:

| Module | Methods |
|--------|---------|
| authAPI | login, me, changePassword, updateProfile |
| dashboardAPI | stats |
| startupAPI | list, get, create, update, delete, getEvaluations |
| evaluationAPI | list, create, update |
| cohortAPI | list, get, create, addStartup |
| mentorAPI | list, get, create, assign |
| projectAPI | list, get, create, update, createTask |
| messageAPI | listConversations, createConversation, getMessages, sendMessage |
| eventAPI | list, get, create, register |
| feedbackAPI | list, create, respond, analytics |
| smeAPI | list, get, create, update |
| iprAPI | list, get, create, update |
| infrastructureAPI | list, get, create, createBooking |
| knowledgeAPI | list, get, create, update |
| documentAPI | list, get, create, update, remove |
| watchlistAPI | list, get, create, remove, addStartup, removeStartup |
| deeptechAPI | list, get, create |
| govtIntegrationAPI | list, sync, logs |
| crawlAPI | stats, listSources, createSource, toggleSource, triggerCrawl, listStartups, getStartup, approveStartup, rejectStartup, listJobs |

### 5.3 Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| LoadingSkeleton | `src/components/LoadingSkeleton.jsx` | Shimmer loading with card/table/list variants |
| AuthContext | `src/context/AuthContext.jsx` | Auth state, JWT persistence, MFA flow |

### 5.4 UI Features

- **Toast Notifications** - react-hot-toast on all 20 pages (error + success)
- **Loading Skeletons** - Gold shimmer animation replacing "Loading..." text
- **Role-Based Sidebar** - Admin sees 21 items, other roles see relevant subset
- **Notification Bell** - Dropdown with 6 notifications, unread count, mark-as-read
- **Responsive Design** - Mobile padding/gap fixes via CSS media query
- **Real-time Messaging** - 5s message polling, 15s conversation polling
- **Charts** - CSS donut chart (score dist.) + horizontal bar chart (sectors)
- **Quick Actions** - 4 action cards on dashboard linking to key pages

---

## 7. Backend API Reference

### 6.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with email + password |
| GET | `/api/auth/me` | Bearer | Get current user |
| PUT | `/api/auth/change-password` | Bearer | Change password |
| PUT | `/api/auth/profile` | Bearer | Update name/avatar |

### 6.2 Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | Bearer | Platform statistics |

### 6.3 Startups

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/startups` | Bearer | List with filters (sector, stage, status, pipeline_stage, search) + pagination |
| POST | `/api/startups` | Bearer | Create startup |
| GET | `/api/startups/:id` | Bearer | Get startup detail |
| PUT | `/api/startups/:id` | Bearer | Update startup |
| DELETE | `/api/startups/:id` | Admin | Delete startup |
| GET | `/api/startups/:id/evaluations` | Bearer | Get startup's evaluations |

### 6.4 Evaluations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/evaluations` | Bearer | List with filters + pagination |
| POST | `/api/evaluations` | Admin/Evaluator | Create evaluation |
| PUT | `/api/evaluations/:id` | Admin/Evaluator | Update evaluation |

### 6.5 Cohorts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cohorts` | Bearer | List all cohorts |
| POST | `/api/cohorts` | Admin | Create cohort |
| GET | `/api/cohorts/:id` | Bearer | Get cohort with startups |
| POST | `/api/cohorts/:id/startups` | Admin | Add startup to cohort |

### 6.6 Mentors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mentors` | Bearer | List mentors |
| POST | `/api/mentors` | Admin | Create mentor |
| GET | `/api/mentors/:id` | Bearer | Get mentor detail |
| POST | `/api/mentors/:id/assign` | Admin | Assign mentor to startup |

### 6.7 Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Bearer | List with task counts |
| POST | `/api/projects` | Bearer | Create project |
| GET | `/api/projects/:id` | Bearer | Get project with tasks |
| PUT | `/api/projects/:id` | Bearer | Update project |
| POST | `/api/projects/:id/tasks` | Bearer | Create task |

### 6.8 Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/conversations` | Bearer | List conversations with unread count |
| POST | `/api/conversations` | Bearer | Create conversation |
| GET | `/api/conversations/:id/messages` | Bearer | Get messages (marks as read) |
| POST | `/api/conversations/:id/messages` | Bearer | Send message |

### 6.9 Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Bearer | List with type/status filters + pagination |
| POST | `/api/events` | Admin | Create event |
| GET | `/api/events/:id` | Bearer | Get event detail |
| POST | `/api/events/:id/register` | Bearer | Register for event |

### 6.10 Feedback

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feedback` | Bearer | List with filters + pagination |
| POST | `/api/feedback` | Bearer | Submit feedback (auto-calculates sentiment) |
| PUT | `/api/feedback/:id/respond` | Admin/Evaluator | Respond to feedback |
| GET | `/api/feedback/analytics` | Bearer | Aggregated analytics |

### 6.11 SME Experts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sme` | Bearer | List with filters + pagination |
| POST | `/api/sme` | Admin | Create expert |
| GET | `/api/sme/:id` | Bearer | Get expert detail |
| PUT | `/api/sme/:id` | Admin | Update expert |

### 6.12 Crawling

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crawl/stats` | Bearer | Crawl statistics |
| GET | `/api/crawl/sources` | Bearer | List crawl sources |
| POST | `/api/crawl/sources` | Admin | Create source |
| PUT | `/api/crawl/sources/:id/toggle` | Admin | Toggle source active/paused |
| POST | `/api/crawl/sources/:id/trigger` | Bearer | Trigger crawl |
| GET | `/api/crawl/startups` | Bearer | List crawled startups |
| GET | `/api/crawl/startups/:id` | Bearer | Get crawled startup |
| PUT | `/api/crawl/startups/:id/approve` | Admin/Evaluator | Approve startup |
| PUT | `/api/crawl/startups/:id/reject` | Admin/Evaluator | Reject startup |
| GET | `/api/crawl/jobs` | Bearer | List crawl jobs |

### 6.13 IPR Records

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/ipr` | Bearer | List with filters + pagination |
| POST | `/api/ipr` | Admin | Create IPR record |
| GET | `/api/ipr/:id` | Bearer | Get record detail |
| PUT | `/api/ipr/:id` | Admin | Update record |

### 6.14 Infrastructure

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/infrastructure` | Bearer | List facilities |
| POST | `/api/infrastructure` | Admin | Create facility |
| GET | `/api/infrastructure/:id` | Bearer | Get facility with bookings |
| POST | `/api/infrastructure/:id/bookings` | Bearer | Create booking |

### 6.15 Knowledge Base

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge` | Bearer | List articles + pagination |
| POST | `/api/knowledge` | Admin | Create article |
| GET | `/api/knowledge/:id` | Bearer | Get article (increments views) |
| PUT | `/api/knowledge/:id` | Admin | Update article |

### 6.16 Documents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/documents` | Bearer | List with filters + pagination |
| POST | `/api/documents` | Bearer | Create document |
| GET | `/api/documents/:id` | Bearer | Get document detail |
| PUT | `/api/documents/:id` | Bearer | Update document |
| DELETE | `/api/documents/:id` | Admin | Delete document |

### 6.17 Watchlists

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/watchlists` | Bearer | List with startup counts |
| POST | `/api/watchlists` | Bearer | Create watchlist |
| GET | `/api/watchlists/:id` | Bearer | Get watchlist with startups |
| DELETE | `/api/watchlists/:id` | Bearer | Delete watchlist |
| POST | `/api/watchlists/:id/startups` | Bearer | Add startup |
| DELETE | `/api/watchlists/:id/startups/:startupId` | Bearer | Remove startup |

### 6.18 DeepTech Assessments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/deeptech` | Bearer | List assessments + pagination |
| POST | `/api/deeptech` | Bearer | Create assessment |
| GET | `/api/deeptech/:id` | Bearer | Get assessment detail |

### 6.19 Government API Integrations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/integrations` | Bearer | List all integrations |
| POST | `/api/integrations/:id/sync` | Admin | Trigger manual sync |
| GET | `/api/integrations/logs` | Bearer | View sync logs |

### 6.20 Audit Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/audit` | Admin | List audit logs with filters + pagination |

---

## 8. Database Schema

### 28 Tables

**Core:**
- `users` - Platform users (admin, evaluator, startup, mentor)
- `startups` - Registered startups with full profile data
- `evaluations` - 8-vector evaluation records with JSONB criteria

**Pipeline & Cohorts:**
- `cohorts` - Incubation cohorts
- `cohort_startups` - Many-to-many cohort membership

**Mentorship:**
- `mentors` - Mentor profiles with expertise arrays
- `mentor_assignments` - Mentor-startup assignments

**Projects:**
- `projects` - Projects with budget, progress, status
- `project_tasks` - Tasks within projects

**Communication:**
- `conversations` - Direct and group conversations
- `conversation_members` - Conversation membership
- `messages` - Chat messages with read status

**IPR:**
- `ipr_records` - Patents, trademarks, copyrights, designs

**Documents:**
- `documents` - Files with access control (public/internal/restricted)

**Watchlists:**
- `watchlists` - Named watchlists with visibility settings
- `watchlist_startups` - Watchlist membership

**Events:**
- `events` - Hackathons, workshops, conferences, webinars

**Experts:**
- `sme_experts` - Subject matter experts with domains array

**Feedback:**
- `feedback` - Startup feedback with sentiment and response

**Assessments:**
- `deeptech_assessments` - DeepTech qualification with JSONB answers
- `govt_api_logs` - Government API integration logs

**Infrastructure:**
- `infrastructure` - Labs, test facilities, HPC clusters
- `infrastructure_bookings` - Facility reservations

**Knowledge:**
- `knowledge_articles` - Articles, guides, policies

**Crawling:**
- `crawl_sources` - Web crawl source configurations
- `crawled_startups` - Discovered startups pending review
- `crawl_jobs` - Crawl job execution history

**Audit:**
- `audit_logs` - Write operation audit trail

---

## 9. Authentication & Authorization

### Authentication Flow

1. User submits email + password to `POST /api/auth/login`
2. Backend validates credentials, returns JWT + user object
3. Frontend triggers MFA step (demo OTP: `123456`)
4. On success, JWT stored in `localStorage` as `openi_token`
5. All subsequent API calls include `Authorization: Bearer <token>`
6. Token expires after 7 days (`JWT_EXPIRES_IN`)

### Role-Based Access Control

| Role | Description | Sidebar Items | Special Permissions |
|------|-------------|---------------|-------------------|
| `admin` | Platform administrator | All 21 items | Full CRUD on all entities |
| `evaluator` | Startup evaluator | 14 items | Create evaluations, respond to feedback |
| `startup` | Registered startup | 8 items | View own data, submit feedback |
| `mentor` | Assigned mentor | 9 items | View mentees, messaging |

### Sidebar Visibility by Role

- **All roles:** Overview, Startups, Messaging, Events, Knowledge, Documents
- **Admin only:** Register, Crawling, Infrastructure, Cohorts, Govt. APIs
- **Admin + Evaluator:** Evaluation, Programs, Pipeline, Projects, IPR, DeepTech, SME, Feedback
- **Admin + Evaluator + Mentor:** Mentors
- **Admin + Startup:** Watchlists

---

## 10. Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcryptjs with 10 salt rounds |
| **JWT Authentication** | RS256 tokens with 7-day expiry |
| **MFA** | OTP-based second factor (demo: 123456) |
| **Rate Limiting** | 500 req/15min (general), 20 req/15min (auth) |
| **CORS** | Restricted to Vercel + localhost origins |
| **Security Headers** | helmet.js (XSS, CSP, HSTS, etc.) |
| **Input Validation** | String length (500/5000), numeric ranges, required fields |
| **Parameterised Queries** | All SQL uses $N params (no injection) |
| **Audit Logging** | 10 write routes logged with user, action, IP |
| **Role-Based Access** | requireRole middleware on sensitive endpoints |

---

## 11. Licensing & Payments (Razorpay)

OpenI Hub uses a **3-tier freemium SaaS model** with Razorpay as the payment gateway for Indian customers (INR). Subscription management, payment capture, and usage gating are fully integrated end-to-end.

### 11.1 Plans

| Plan | Price (Monthly) | Price (Yearly) | Challenges | Applications | Meetings | File Uploads |
|------|-----------------|----------------|------------|--------------|----------|--------------|
| **Free** | INR 0 | INR 0 | 1 / month | 3 / month | 5 / month | 5 / month |
| **Pro** | INR 999 | INR 9,990 | 5 / month | 20 / month | 50 / month | 100 / month |
| **Enterprise** | INR 4,999 | INR 49,990 | Unlimited | Unlimited | Unlimited | Unlimited |

Limits are stored as JSONB in `subscription_plans.features`. A value of `-1` means unlimited. Limits reset at the start of each calendar month.

### 11.2 Database Tables

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plan catalog (name, display_name, price_monthly, price_yearly, currency, features JSONB) |
| `user_subscriptions` | Active and historical subscriptions per user (plan_id, status, billing_cycle, razorpay_subscription_id, period start/end) |
| `payment_history` | All payment attempts (razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, status) |
| `usage_tracking` | Per-user per-feature monthly counter (user_id, feature, period, count) |
| `users.current_plan` | Column on users table storing the user's current plan name (default `free`) |

### 11.3 Backend API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscription/plans` | Bearer | List all active plans |
| GET | `/api/subscription/my-plan` | Bearer | Get current user's plan, subscription, usage, and payment history |
| POST | `/api/subscription/create-order` | Bearer | Create a Razorpay order for a plan upgrade |
| POST | `/api/subscription/verify-payment` | Bearer | Verify Razorpay HMAC-SHA256 signature and activate the subscription (transactional) |
| POST | `/api/subscription/cancel` | Bearer | Cancel active subscription and revert to Free plan |
| POST | `/api/subscription/webhook` | Signature | Razorpay webhook handler for `payment.captured` and `payment.failed` events |

### 11.4 Payment Flow

1. User clicks **Upgrade** on Settings → Billing tab
2. Frontend calls `POST /api/subscription/create-order` with `plan_id` and `billing_cycle`
3. Backend creates a Razorpay order via the Razorpay SDK (amount in paise), returns `order_id`, `amount`, `currency`, and the public `RAZORPAY_KEY_ID`
4. Frontend opens the Razorpay Checkout modal (`window.Razorpay`) with the order details
5. User completes payment in the modal
6. Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` via the `handler` callback
7. Frontend calls `POST /api/subscription/verify-payment` with those three values
8. Backend verifies the HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`
9. On success, a database transaction: cancels any existing active subscription, inserts a new `user_subscriptions` row, records the payment in `payment_history`, and updates `users.current_plan`
10. Frontend refreshes the Billing tab and shows the new plan + updated usage meters

### 11.5 Usage Gating Middleware

`src/middleware/subscription.js` exports `checkUsageLimit(feature)` — an Express middleware factory that:

1. Reads the user's `current_plan` from JWT
2. Fetches the plan's `features` JSONB
3. Checks `usage_tracking` for the current month
4. If `currentUsage >= limit`, returns **403** with `{ message, feature, limit, used, plan, upgrade_url }`
5. Otherwise increments the counter via an upsert and calls `next()`
6. Fails open on errors so transient DB issues don't block users

**Gated routes:**
- `POST /api/challenges` — `checkUsageLimit('challenge_create')`
- `POST /api/challenges/:id/apply` — `checkUsageLimit('application_submit')`
- `POST /api/meetings` — `checkUsageLimit('meeting_create')`
- `POST /api/upload` — `checkUsageLimit('file_upload')`

### 11.6 Test Mode (Fallback)

If `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` is missing from the environment, the backend lazily skips Razorpay SDK init and returns a fake `order_test_<timestamp>` order. The frontend detects `test_mode: true` and simulates a successful payment by calling verify-payment with placeholder values. This allowed the entire flow (including DB writes) to be built and tested before real keys were issued.

### 11.7 Environment Variables (Backend)

```
RAZORPAY_KEY_ID=rzp_test_xxx        # or rzp_live_xxx for production
RAZORPAY_KEY_SECRET=xxx              # never exposed to frontend
RAZORPAY_WEBHOOK_SECRET=xxx          # optional — for webhook signature verification
```

The public `RAZORPAY_KEY_ID` is returned to the frontend via `create-order` response (never hardcoded).

### 11.8 Frontend Integration

| File | Purpose |
|------|---------|
| `index.html` | Loads Razorpay Checkout SDK: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` |
| `src/services/api.js` | `subscriptionAPI` wrapper with `getPlans`, `getMyPlan`, `createOrder`, `verifyPayment`, `cancel` |
| `src/pages/dashboard/Settings.jsx` | Billing tab with plan comparison, usage meters, upgrade/cancel buttons, Razorpay checkout handler |

### 11.9 Webhook Reconciliation (Optional)

The webhook endpoint at `POST /api/subscription/webhook` handles:
- `payment.captured` — logs the event for reconciliation (payment already activated via verify-payment)
- `payment.failed` — marks the corresponding `payment_history` row as `failed`

To enable webhooks, add the endpoint URL in the Razorpay dashboard (Settings → Webhooks) with events `payment.captured` and `payment.failed`, then set `RAZORPAY_WEBHOOK_SECRET` on Railway.

---

## 12. Deployment

### Frontend (Vercel)

- **Project:** openi-hub
- **GitHub:** RajeevBanduni/openi-hub (public)
- **Auto-deploy:** On push to `main` branch
- **Build Command:** `npm run build`
- **Output:** `dist/`
- **Deploy manually:** `cd openi-hub && npx vercel --prod --yes`

### Backend (Railway)

- **Project:** capable-energy
- **GitHub:** RajeevBanduni/openi-hub-backend (private)
- **Auto-deploy:** On push to `main` branch
- **Entry Point:** `src/startup.js` (runs migrate + seed, then starts server)

### Database (Railway PostgreSQL)

- **Auto-migration:** Runs on every deploy via `startup.js`
- **Seed Data:** 10 startups, 5 projects, 10 tasks, 6 evaluations, 7 messages, 5 feedback, 7 IPR records, 6 infrastructure, 10 documents, 3 watchlists, 4 assessments, 4 knowledge articles, 8 crawl sources, 8 crawled startups, 5 crawl jobs

---

## 13. Test Accounts

### Legacy Accounts (MFA OTP: 123456)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@drdo.gov.in | Admin@123 |
| Evaluator | ananya@drdo.gov.in | Eval@123 |
| Startup | contact@armortech.in | Start@123 |
| Mentor | suresh@iitd.ac.in | Mentor@123 |

### Multi-Persona V2 Demo Accounts (all password: Demo@123)

All `*@demo.openi.ai` accounts skip MFA via the `mfa_bypass_login` short-circuit in the auth flow (no OTP needed). 11 personas total as of v2.6:

| Persona | Email | Notes |
|---------|-------|-------|
| Startup | startup@demo.openi.ai | Innovation Provider |
| Student | student@demo.openi.ai | Innovation Provider |
| Academia | academia@demo.openi.ai | Innovation Provider |
| Corporate | corporate@demo.openi.ai | Innovation Seeker |
| Government | govt@demo.openi.ai | Innovation Seeker |
| Investor | investor@demo.openi.ai | Innovation Seeker |
| Lab | lab@demo.openi.ai | Innovation Seeker |
| Incubator | incubator@demo.openi.ai | Innovation Seeker |
| Accelerator | accelerator@demo.openi.ai | Innovation Seeker |
| **Service Provider** | serviceprovider@demo.openi.ai | New in v2.6 |
| **Mentor** | mentor@demo.openi.ai | New in v2.6 (V2 mentor flow with persona category) |

The quick-login demo panel on `/dashboard/login` is gated by `?demo=1` to keep the legacy admin/evaluator credentials out of public exposure while preserving testing convenience. Source: `DEMO_ACCOUNTS` const in `src/pages/dashboard/Login.jsx`.

### Razorpay Test Cards (for Pro/Enterprise upgrade testing)

| Card Number | Type | CVV | Expiry |
|-------------|------|-----|--------|
| 4111 1111 1111 1111 | Visa (Success) | any 3 digits | any future date |
| 5267 3181 8797 5449 | Mastercard (Success) | any 3 digits | any future date |
| 4000 0000 0000 0002 | Card declined | any 3 digits | any future date |

For UPI test mode, use `success@razorpay` (success) or `failure@razorpay` (failure).

---

## 14. Production Go-Live (openi.ai) — COMPLETE

**Status (6 May 2026):** ✅ Production cutover from `openi.tech` to `openi.ai` is complete. All three production hostnames are LIVE with valid SSL. The `.tech` domain is preserved as **perpetual staging** — both stacks point at the same Railway PostgreSQL, but new traffic and marketing URLs go to `.ai`. The original step-by-step go-live playbook is preserved in §14.3–14.11 below for reference and for future cutovers.

### 14.1 Current Production Architecture

```
Users
  │
  ▼
https://openi.ai                ← Vercel (openi-hub frontend, production)
https://www.openi.ai            ← Vercel (apex 308 → www, both serve)
https://app.openi.ai            ← Vercel (reserved, in allowedOrigins)
  │
  │ API calls (VITE_API_URL = https://api.openi.ai/api)
  ▼
https://api.openi.ai            ← Railway (openi-hub-backend, SSL provisioned)
  │
  ▼
Railway PostgreSQL              ← shared with .tech staging stack

Staging on the same backend instance:
  https://openi.tech / www.openi.tech / app.openi.tech / api (legacy URL)
```

### 14.0 Production Hostname Reference

| Hostname | Resolves to | Role |
|---|---|---|
| `openi.ai` | `216.198.79.1` (Vercel apex) | Production apex (308 → www) |
| `www.openi.ai` | `4d8d9078365453ff.vercel-dns-017.com` | Production frontend |
| `app.openi.ai` | Vercel | Reserved (in CORS allowlist) |
| `api.openi.ai` | `2eugdac7.up.railway.app` | Production backend |
| `openi.tech` / `www.openi.tech` / `app.openi.tech` | Vercel | Perpetual staging |
| `openi-hub.vercel.app` | Vercel | Preview-deploy fallback |

### 14.2 Pre-Work Completed

| Item | Status |
|---|---|
| Razorpay integration end-to-end (test mode) | Done |
| Razorpay checkout.js SDK loaded in `index.html` | Done |
| Backend `CORS` whitelist updated to include `openi.tech`, `www.openi.tech` in `src/server.js` | Done (local only, not yet committed) |
| Backend package renamed `drdo-hub-backend` → `openi-hub-backend` | Done + pushed |
| Documentation migrated to version control (repo `DOCUMENTATION.md`) | Done |

### 14.3 Execution Steps

| # | Step | Owner | Platform | Est. Time |
|---|------|-------|----------|-----------|
| 1 | Add `openi.tech` and `www.openi.tech` as custom domains | User | Vercel | 5 min |
| 2 | Add `api.openi.tech` as custom domain | User (Claude can navigate) | Railway | 3 min |
| 3 | Configure DNS records (A + CNAME × 2) | User | GoDaddy | 5 min |
| 4 | Wait for DNS propagation + automatic SSL provisioning | Automatic | Vercel + Railway | 5–30 min |
| 5 | Update `VITE_API_URL=https://api.openi.tech/api` | User (Claude can guide) | Vercel | 2 min |
| 6 | Update `CLIENT_URL=https://openi.tech` | User (Claude can navigate) | Railway | 2 min |
| 7 | Commit + push CORS whitelist update | Claude | GitHub | 2 min |
| 8 | Submit Razorpay KYC (in parallel with 1–4) | User | Razorpay | 10 min + 1–3 day review |
| 9 | After KYC approval: generate `rzp_live_xxx` keys | User | Razorpay | 5 min |
| 10 | Update `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to live values | User (Claude can navigate) | Railway | 2 min |
| 11 | Configure Razorpay webhook → `https://api.openi.tech/api/subscription/webhook` | User | Razorpay | 5 min |
| 12 | Add `RAZORPAY_WEBHOOK_SECRET` to Railway | User | Railway | 2 min |
| 13 | Wait for Vercel + Railway redeploys (automatic on env var change) | Automatic | Both | 2–5 min |
| 14 | End-to-end smoke test: register → login → upgrade to Pro → real payment | Claude + User | Live site | 10 min |
| 15 | Update this documentation with final URLs | Claude | GitHub | 3 min |

### 14.4 DNS Records for GoDaddy

Once Vercel and Railway have been added, the following records go into **GoDaddy → My Products → openi.tech → DNS**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` (confirm from Vercel) | 600 |
| CNAME | `www` | `cname.vercel-dns.com` | 600 |
| CNAME | `api` | `<Railway CNAME target>` (e.g. `xyz.up.railway.app`) | 600 |

**Important:** Delete any existing GoDaddy default/parked A records for `@` or `www`. Leave all NS records untouched — do not change nameservers.

Verification commands (run locally after propagation):
```bash
dig openi.tech +short
dig www.openi.tech +short
dig api.openi.tech +short
curl -sI https://openi.tech | head -5
curl -sI https://api.openi.tech/health | head -5
```

### 14.5 Environment Variables — Before vs After

**Vercel (frontend):**

| Variable | Before | After |
|----------|--------|-------|
| `VITE_API_URL` | `https://openi-hub-production.up.railway.app/api` | `https://api.openi.tech/api` |

**Railway (backend):**

| Variable | Before | After |
|----------|--------|-------|
| `CLIENT_URL` | `https://openi-hub.vercel.app` | `https://openi.tech` |
| `RAZORPAY_KEY_ID` | `rzp_test_xxx` | `rzp_live_xxx` (after KYC) |
| `RAZORPAY_KEY_SECRET` | test secret | live secret (after KYC) |
| `RAZORPAY_WEBHOOK_SECRET` | *(not set)* | new secret from Razorpay webhook config |

### 14.6 CORS Whitelist Update

`src/server.js` has been updated locally (not yet committed) to include:

```javascript
const allowedOrigins = [
  // Production custom domain
  'https://openi.tech',
  'https://www.openi.tech',
  // Vercel fallback (kept for transition + preview deploys)
  'https://openi-hub.vercel.app',
  // Local dev
  'http://localhost:3000',
  'http://localhost:5173',
];
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}
```

Commit message ready: *"Add openi.tech custom domain to CORS whitelist"*

### 14.7 Razorpay KYC Requirements

Submit at https://dashboard.razorpay.com → **Account & Settings → KYC**. Required documents:

| Document | Purpose |
|----------|---------|
| PAN card | Business or personal PAN (business PAN preferred for companies) |
| Business proof | One of: GST certificate, Shop & Establishment license, Certificate of Incorporation, Partnership deed |
| Bank account details | Current account strongly preferred; savings account accepted for sole proprietors |
| Authorized signatory ID | Aadhaar, passport, or driving license of the person signing |
| Address proof | Recent utility bill, rental agreement, or bank statement |

**Review time:** 1–3 business days typically. Razorpay will email on approval. After approval, the "Live Mode" toggle becomes available in the dashboard and API Keys page.

**Test vs Live keys:**
- Test keys start with `rzp_test_` — safe, no real money moves
- Live keys start with `rzp_live_` — real transactions, real money
- Keys are shown **once** at generation — save them immediately in a password manager

### 14.8 Razorpay Webhook Configuration

Once live keys are active:

1. Razorpay dashboard → **Settings → Webhooks → Add New Webhook**
2. URL: `https://api.openi.tech/api/subscription/webhook`
3. Alert email: your admin email
4. Secret: auto-generate or provide one — **save it**
5. Events to subscribe to:
   - `payment.captured` (reconciliation confirmation)
   - `payment.failed` (mark payment_history as failed)
   - `subscription.charged` (optional, for recurring billing)
   - `subscription.cancelled` (optional)
6. Click **Create Webhook**
7. Add the secret to Railway as `RAZORPAY_WEBHOOK_SECRET`

Backend webhook handler at `src/controllers/subscriptionController.js` already verifies HMAC-SHA256 signatures when `RAZORPAY_WEBHOOK_SECRET` is set.

### 14.9 Smoke Test Checklist (Post Go-Live)

Run through these on the live domain `https://openi.tech`:

- [ ] Landing page loads at `https://openi.tech`
- [ ] `www.openi.tech` redirects to `openi.tech` (308)
- [ ] SSL padlock green on all three domains (apex, www, api)
- [ ] Registration flow: pick persona → fill form → account created
- [ ] Login with demo account (`startup@demo.openi.ai` / `Demo@123`)
- [ ] MFA OTP (123456) accepted, dashboard loads
- [ ] API calls visible in browser dev tools hit `api.openi.tech` (not the old Railway URL)
- [ ] CORS: no errors in console
- [ ] Settings → Billing tab loads with current plan + usage meters
- [ ] Click Upgrade on Pro — Razorpay **live** checkout modal opens (not test mode)
- [ ] Complete a small real payment with a personal card (INR 999)
- [ ] Verify `users.current_plan = 'pro'` in DB
- [ ] Verify new row in `payment_history` with real Razorpay IDs (not `pay_test_*`)
- [ ] Razorpay dashboard shows the captured payment
- [ ] **Refund the test payment** from Razorpay dashboard (Payments → refund)
- [ ] Webhook log shows `payment.captured` event received and processed
- [ ] Downgrade/cancel flow works and reverts to Free plan

### 14.10 Rollback Plan

If anything goes wrong on the live domain:

1. **DNS rollback (fastest)** — In GoDaddy, delete the A/CNAME records for `openi.tech`. Users will fall back to the error page; nothing is broken, just inaccessible on the custom domain.
2. **Frontend rollback** — In Vercel, remove the custom domain. Users can still access `https://openi-hub.vercel.app` as before.
3. **Env var rollback** — In Vercel, change `VITE_API_URL` back to the Railway URL; in Railway, change `CLIENT_URL` back to the Vercel URL. Both platforms auto-redeploy on env var change.
4. **Razorpay rollback** — Switch `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` back to test keys on Railway. Existing captured payments are not affected, but no new real payments will be processed.
5. **Code rollback** — `git revert` the CORS commit if needed.

No database changes are involved in the go-live — the same Railway Postgres instance serves both old and new URLs. Rollback is fully reversible.

### 14.11 Resume Points

If this session pauses and resumes later, here's the state at each phase:

- **Phase A (DNS):** Check if `dig openi.tech` resolves. If yes, DNS is propagated. If no, wait longer.
- **Phase B (SSL):** Check `curl -sI https://openi.tech`. If 200, SSL is provisioned. If SSL errors, wait 5 more minutes.
- **Phase C (Env vars):** Check Vercel + Railway env var values directly in dashboards.
- **Phase D (Razorpay KYC):** Check Razorpay dashboard → Settings → KYC for status.
- **Phase E (Go-live):** Run smoke test checklist 14.9.

---

## 15. Marketing Landing Page

**File:** `src/pages/auth/Landing.jsx`
**Route:** `/` (for unauthenticated users) and `/landing` (legacy alias)
**Added:** 5 April 2026 (v2.4)

### 15.1 Purpose

The landing page is the first impression for visitors typing `openi.tech` into a browser. It replaces the earlier version that dumped visitors straight onto a persona picker with no context. The new page tells the OpenI story first and moves persona selection into the registration flow where it logically belongs.

### 15.2 Value Proposition

- **Headline:** "Partner. Source. Invest." (with the word "Invest" highlighted in brand gold)
- **Subheadline:** "OpenI is the open innovation platform where corporates, investors, and governments connect with India's most promising startups — discover, evaluate, and collaborate on one platform."
- **Eyebrow tag:** "INDIA'S OPEN INNOVATION PLATFORM"
- **Micro trust line:** "Built for Deep-Tech · AI · Quantum · Defence · Cybersecurity"

### 15.3 Page Structure (12 sections — updated v2.5)

| # | Section | Background | Purpose |
|---|---------|------------|---------|
| 1 | **Sticky Header** | White with backdrop blur | Logo, nav (Marketplace / Reports / How It Works / Features / Pricing), LinkedIn + X icons, Sign In + Get Started CTAs |
| 2 | **Hero** | Gradient (light gray → white) with gold orb glow | Big headline, subheadline, dual CTA ("Get Started" + "Browse Challenges"), trust line |
| 3 | **Stats / Social Proof** | White | 4-column grid: 500+ Registered Startups, 50+ Corporate Partners, 120+ Challenges Posted, 25 Cr+ Investments Facilitated |
| 4 | **Partner / Trust Logos** | Light gray | Ecosystem partners: DRDO, DPIIT, iDEX, NASSCOM, Startup India, AIM (text placeholders, swappable with logos) |
| 5 | **How It Works** | White | 3-step numbered explainer: Register Your Persona → Discover & Connect → Collaborate & Grow |
| 6 | **Built for Every Stakeholder** | Light gray | Two-column Providers/Seekers split. Gold accent for Providers, blue for Seekers |
| 7 | **Features Grid** | White | 8 feature cards: Challenge Marketplace, Directory Search, 8-Vector Evaluation, Meetings & RSVPs, Real-time Messaging, DeepTech Assessment, Recommendations Engine, Public Marketplace |
| 8 | **Testimonials** | Light gray | 3 testimonial cards with 5-star ratings from corporates, investors, and startups |
| 9 | **FAQ Accordion** | White | 6 expandable questions covering: who can join, pricing, evaluation framework, marketplace, defence-tech, recommendations |
| 10 | **Simple, Transparent Pricing** | Light gray | 3-tier pricing cards: Free ₹0, **Pro ₹999/mo (featured)**, Enterprise ₹4,999/mo |
| 11 | **Final CTA** | Gold gradient | "Ready to Join the Ecosystem?" + dual CTA ("Get Started" + "Browse Marketplace") |
| 12 | **Footer** | Dark (#1a1a1a) | Logo, tagline, LinkedIn + X social icons, Product links (Marketplace, Reports, How It Works, Features, Pricing), Company links, copyright |

### 15.4 CTA Routing

All CTAs route to one of two destinations:

| CTA | Destination | Purpose |
|-----|-------------|---------|
| "Get Started" / "Get Started — It's Free" / "Join as Provider" / "Join as Seeker" | `/register` | Existing persona picker (10 persona types) |
| "Sign In" | `/dashboard/login` | Existing login form |

The persona picker page at `/register` was preserved as-is — just moved out of the first-impression slot.

### 15.5 Design System

- **Brand gold:** `#D5AA5B` (primary), `#C9983F` (dark hover), `rgba(213,170,91,0.1)` (tint)
- **Seeker blue:** `#3b82f6` (used only for the Innovation Seekers card accent)
- **Dark text:** `#1a1a1a`
- **Body gray:** `#6b7280`
- **Light gray bg:** `#f5f5f5`
- **Border:** `#e5e7eb`
- **Typography:** Plus Jakarta Sans for headlines, Inter for body (already imported in index.html)
- **Hero headline:** `clamp(2.5rem, 6vw, 5rem)` for fluid scaling across devices

### 15.6 Mobile Responsiveness

- Grid sections use Tailwind's `md:` and `lg:` breakpoints
- Hero headline scales fluidly via CSS `clamp()`
- Header nav collapses to logo + CTA only on mobile
- Feature grid: 1 col mobile → 2 cols tablet → 4 cols desktop
- Provider/Seeker split: stacked on mobile, side-by-side on desktop

### 15.7 Fallback Behavior

- **Logo fallback:** Each `<img src="/openi-logo.png">` has an `onError` handler that hides the broken image and shows a gold Shield icon instead. Prevents "broken image" placeholders if the asset is ever missing.
- **Unauthenticated root (`/`):** `RootRoute` component in `App.jsx` renders `<Landing />`. If `user` is present from `AuthContext`, redirects to `/dashboard` instead — so signed-in users never see the landing page when navigating to the root.

### 15.8 Dependencies

No new dependencies were added. Uses existing packages only:
- `react-router-dom` v6.20.0 (Link, Navigate)
- `lucide-react` v0.294.0 (icons: ArrowRight, Shield, Users, Briefcase, Target, Network, Sparkles, Search, Calendar, MessageSquare, FileText, Award, Database, Zap, TrendingUp, CheckCircle2, Rocket, Building2, Landmark, GraduationCap, FlaskConical, Home, BookOpen)
- `tailwindcss` v3.3.6 (responsive grid utilities and spacing)

### 15.9 Future Enhancements

Ideas captured here for when they're needed:
- ~~Real social proof (partner logos, usage stats, testimonials)~~ ✅ Added in v2.5
- Blog/changelog section for content marketing and SEO
- Customer case studies for each persona type
- Video/animation in the hero showing the product in action
- SEO meta tags, Open Graph tags, and a sitemap
- Analytics integration (Google Analytics, Plausible, PostHog)
- A/B testing of hero headlines and CTA copy

---

## 16. Public Pages (v2.5)

Three new public pages accessible without authentication, designed to drive organic traffic and conversions.

### 16.1 Public Marketplace (`/marketplace`)

**File:** `src/pages/public/PublicMarketplace.jsx` (433 lines)
**Route:** `/marketplace` (public, no auth required)
**Backend:** `GET /api/public/challenges` + `GET /api/public/challenges/:id`

**Features:**
- Hero banner: "Explore Innovation Challenges"
- Search bar with full-text search across title, description, problem statement
- Sector and technology filter dropdowns (populated from API response)
- 12-card grid with: company logo, title, problem snippet, sector/tech tags, budget, deadline, applicant count
- Click card → full detail view with problem statement, description, requirements, FAQs accordion, taxonomy tags, meta cards
- "Register to Apply" CTA on detail view → redirects to `/register`
- Pagination (Previous/Next with page counter)
- Bottom CTA section: "Ready to Innovate?"
- Loading skeleton animation during fetch
- Empty state for no results

### 16.2 Startup Reports (`/reports`)

**File:** `src/pages/public/PublicReports.jsx` (303 lines)
**Route:** `/reports` (public, no auth required)
**Backend:** `GET /api/public/reports`

**Features:**
- Hero: "Curated Insights for Innovators"
- Sector filter pill buttons (All, DeepTech, AI/ML, Defence, CleanTech, HealthTech, Cybersecurity, Quantum, Semiconductor)
- Report cards with: sector-colored cover gradient, sector icon, status badge (Available/Coming Soon), title, description, date, author, page count
- Download button → register modal for unauthenticated users
- "Why OpenI Reports?" section (3 value prop cards: Platform Data, Expert Curated, Actionable Insights)
- Bottom CTA: "Want Full Access?"
- 8 hardcoded reports (CMS-ready structure)

### 16.3 PublicLayout Component

**File:** `src/components/PublicLayout.jsx` (186 lines)
**Used by:** PublicMarketplace, PublicReports

Shared layout wrapper for all public pages:
- **Header:** Logo, nav (Marketplace, Reports, How It Works, Features, Pricing) with active state highlighting, LinkedIn + X social icons, Sign In + Get Started buttons
- **Footer:** Logo with inverted filter, tagline, social links with gold hover, Product links (Marketplace, Reports, How It Works, Features, Pricing, Get Started), Company links (Sign In, Contact, Privacy, Terms), copyright

### 16.4 Public API Controller

**File:** `src/controllers/publicController.js` (131 lines, backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/challenges` | GET | List open public challenges with search, sector, technology, usecase filters + pagination. Returns challenges array + filter options (distinct sectors, technologies, usecases) |
| `/api/public/challenges/:id` | GET | Single challenge detail (limited fields, no RFI questions or internal data) |
| `/api/public/reports` | GET | Startup ecosystem reports with sector filter. Hardcoded data, CMS-ready |
| `/api/public/stats` | GET | Platform statistics (startup count, corporate count, challenge count, application count). Uses real DB counts with minimum thresholds |

All endpoints have **no authentication middleware** — fully public access.

### 16.5 CMS Migration Plan

All public page content is structured for easy CMS migration:

| Content Type | Current Location | CMS Type (Strapi) |
|---|---|---|
| Stats (landing) | `STATS` const array in Landing.jsx | Single type: `platform-stats` |
| Partners (landing) | `PARTNERS` const array in Landing.jsx | Collection type: `partner-logo` |
| Testimonials (landing) | `TESTIMONIALS` const array in Landing.jsx | Collection type: `testimonial` |
| FAQs (landing) | `FAQS` const array in Landing.jsx | Collection type: `faq` |
| Reports (reports page) | Hardcoded in publicController.js | Collection type: `report` |

**Migration steps (when Strapi is deployed):**
1. Deploy Strapi on Railway
2. Create content types matching the arrays above
3. Add `VITE_CMS_URL` env var to Vercel
4. Replace const arrays with `useEffect` + `fetch` calls, with const arrays as fallback

---

## 17. Multi-Persona V2 (`activeRole`, Phase 60.2–60.4)

OpenI Hub originally bound a user to a single persona. v2.6 generalises this so one account can hold **multiple persona roles** and switch between them. The platform behaviour (sidebar, dashboard, redirects, billing limits) is driven by the user's **`activeRole`** rather than a single legacy `role` field.

### 17.1 Roles Schema

| Table / Column | Purpose |
|---|---|
| `user_roles` (user_id, role, is_primary, added_at) | One row per role a user holds. Exactly one is `is_primary=TRUE`. |
| `users.persona_category` | Cached "provider" / "seeker" category for the primary role |
| `users.profile_completed` | Whether Step 2 of registration is done for the primary persona |
| `users.onboarding_step` | Onboarding progress counter |

`SELF_REGISTER_ROLES` (defined in `authController.js`) is the allow-list of roles a user can self-add — admin/evaluator are excluded.

### 17.2 Role Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/roles` | Lists current user's roles + `available_to_add` (the SELF_REGISTER_ROLES they don't yet hold) |
| `POST` | `/api/auth/roles/add` | Adds a `user_roles` row (`is_primary=FALSE`) + creates an empty persona profile in the role's profile table + sends a welcome email. Body: `{ role, profile? }`. |
| `POST` | `/api/auth/roles/set-primary` | Flips `is_primary` flags so the named role becomes primary. |
| `POST` | `/api/auth/roles/remove` | Removes a role; refused if it's the user's only role. If the removed role was primary, the oldest remaining role auto-becomes primary. |

### 17.3 `activeRole` Resolution

On every authenticated request, `middleware/auth.js` resolves the user's roles via subquery on `user_roles` and exposes them on `req.user.roles[]` with `is_primary` flags. The active role used for billing, sidebar, and persona-aware queries is stored client-side and sent through the request layer; backend controllers (`subscriptionController`, `personaDashboardController`, `profileController`, `enrichController`, `onboardingController`, `challengeApplyController`, `portfolioEvalsController`, `programPartnersController`, `profileViewController`, `claimController`) consume it.

### 17.4 Per-Role Billing (Phase 60.4a)

`user_subscriptions` rows now include the `role` column so a user with multiple personas gets independent billing limits per role. This means a user can have a Pro plan as Mentor while remaining Free as Investor. The `checkUsageLimit` middleware (`middleware/subscription.js`) keys on `(user_id, role, feature, period)`.

### 17.5 Frontend Behaviour

- **Login / restore:** `roles[]` is refreshed from `/auth/me` on session restore so newly added roles show up across tabs.
- **Add role:** After `POST /roles/add` succeeds, the local cache is refreshed and the new tab appears in the role switcher.
- **Active role honoured everywhere:** Dashboard role-based redirects use `activeRole`, not legacy `user.role` (commit `53c5041`).

---

## 18. Email Verification, Password Reset, Terms-of-Use Gate

### 18.1 Email Verification (s49e)

| Schema | Description |
|---|---|
| `users.email_verified_at TIMESTAMPTZ NULL` | Set when a user successfully verifies via link or OTP |
| `email_verifications` | Pending verification rows: `(id, user_id, code, token_hash, purpose, expires_at, consumed_at)` |
| `idx_email_verifications_user_id_active` | Partial index on un-consumed rows for the active lookup |
| `idx_email_verifications_token_hash` | Lookup index for magic-link tokens |

Two co-equal verification paths:

1. **Magic link:** `https://openi.ai/verify-email?token=<long-token>` — token is hashed in DB; on click, frontend POSTs the token, backend verifies + marks consumed.
2. **OTP:** A 6-digit code displayed in the email body; user pastes into the verify page and submits. Same row, different surface.

**Gmail link-prefetch defeat:**
- The verify landing page requires an explicit button click (no auto-verify on page load) — Gmail's bot-prefetch hits the page but doesn't click.
- Cross-tab `localStorage` sync: when a user verifies in tab B, tab A picks up the success and continues the registration flow.
- Step 2 profile data is stashed in `localStorage` (not just React state) so it survives Gmail's "open in new tab" behaviour where the original tab is replaced.

**Gated actions:** Four sensitive actions return `EMAIL_NOT_VERIFIED` from the API if the user hasn't verified, and the frontend redirects to `/verify-email?email=<addr>`. Backend re-issues a fresh code on the redirect so the user always gets a working OTP.

### 18.2 Password Reset

Same email-token mechanism, with `purpose='password_reset'` on the `email_verifications` row. User clicks link → enters new password → row is consumed and the password is bcrypted.

### 18.3 Terms of Use Gate (Phase 60.7)

| Field | Purpose |
|---|---|
| `users.terms_version_accepted` | The `TERMS_VERSION` string the user has accepted |
| `TERMS_VERSION` constant | Currently `'1.1'` (bumped with the partners refresh) |

`POST /api/auth/register` requires `terms_accepted: true` in the body (returns 400 otherwise). When `TERMS_VERSION` is bumped, users with stale `terms_version_accepted` are routed to a re-accept gate before they can use gated actions.

---

## 19. GST-Compliant Invoicing (OpenI Partners LLP)

OpenI Hub issues **real Indian GST tax invoices** for paid subscriptions. Generated as PDFs (PDFKit) and auto-attached to subscription receipt emails. Phase 60.11 (v2.7) makes the system fully compliant with Indian GST law: sequential gap-free numbering, mandatory billing address, and zero-rated export under LUT.

### 19.1 Legal Entity

| Field | Value |
|---|---|
| Legal name | OpenI Partners LLP |
| Place of business | Maharashtra, India |
| GSTIN | `27AAIFO6836A1ZA` (in `services/pdfService.js` `COMPANY` constant) |
| PAN / CIN | `AAIFO6836A` / `ACD-1299` |
| HSN/SAC | `9983` (Other professional, technical and business services) |
| GST rate | 18% (standard SaaS rate) |

GST treatment by customer location:
- **Intrastate** (customer state code `27` = Maharashtra) → **CGST 9% + SGST 9%**
- **Interstate** (any other Indian state) → **IGST 18%**
- **Export** (country ≠ India) → **IGST 0%** + LUT declaration (zero-rated under CGST Rule 96A)

### 19.2 Schema (Phase 60.11)

```sql
-- Canonical billing address per (user, role). Multi-persona users can hold
-- separate billing entities for separate subscriptions.
CREATE TABLE billing_addresses (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(40) NOT NULL,
  legal_name      VARCHAR(300) NOT NULL,
  line1           VARCHAR(300) NOT NULL,
  line2           VARCHAR(300),
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  state_code      VARCHAR(2),                -- NULL outside India
  country         VARCHAR(100) NOT NULL DEFAULT 'India',
  postal_code     VARCHAR(20) NOT NULL,
  gstin           VARCHAR(20),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Per-fiscal-year invoice sequence counter. INSERT ON CONFLICT DO UPDATE
-- under pg_advisory_xact_lock for atomic, gap-free increment.
CREATE TABLE invoice_sequences (
  fiscal_year     VARCHAR(7) PRIMARY KEY,    -- 'FY25-26'
  last_number     INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Audit-grade frozen snapshot at invoice time. Editing the live
-- billing_addresses row never mutates historical invoices.
ALTER TABLE payment_history ADD COLUMN invoice_number VARCHAR(40);
ALTER TABLE payment_history ADD COLUMN billing_address_snapshot JSONB;
ALTER TABLE payment_history ADD COLUMN gst_breakdown JSONB;             -- closed v2.6 schema drift
ALTER TABLE payment_history ADD COLUMN is_legacy_inclusive BOOLEAN;     -- closed v2.6 schema drift
CREATE UNIQUE INDEX idx_payment_history_invoice_number
  ON payment_history(invoice_number) WHERE invoice_number IS NOT NULL;
```

### 19.3 Invoice Number Generation

**File:** `src/services/invoiceNumberService.js`

```js
const { invoice_number, fiscal_year, sequence } = await nextInvoiceNumber(client, supplyDate);
// → { invoice_number: 'OPENI/FY25-26/0001', fiscal_year: 'FY25-26', sequence: 1 }
```

- `computeFiscalYear(date)` returns `FYxx-yy` for the Indian fiscal year (Apr–Mar) of the given date
- `pg_advisory_xact_lock(hashFiscalYearForLock(fy))` serialises concurrent callers on the same FY counter for the duration of the open transaction
- The lock auto-releases on `COMMIT` or `ROLLBACK` so a failed verifyPayment doesn't burn an invoice number
- Format: `OPENI/{FYxx-yy}/{NNNN}` (4-digit zero-padded sequence, resets each fiscal year)

**MUST be called inside an open transaction** (`client.query('BEGIN')`). Currently invoked in `subscriptionController.verifyPayment` after Razorpay signature verification succeeds.

### 19.4 Indian States Map

**File:** `src/services/indianStates.js`

Canonical map of all 36 Indian states + UTs to their 2-digit GST state codes (e.g., Maharashtra → 27, Karnataka → 29, Delhi → 07). Includes common aliases (e.g., `pondicherry` → 34, `orissa` → 21). Single source of truth across:
- `billingAddressController` — server-side validation rejects unknown states
- `subscriptionController` — derives intra/inter-state classification for GST math
- `pdfService` — Place of Supply line on the invoice

`resolveStateCode(name)` and `listStates()` exported.

### 19.5 Billing Address Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/billing-address` | Bearer | Current user's billing address for active role; `404 BILLING_ADDRESS_NOT_FOUND` if none |
| `PUT` | `/api/billing-address` | Bearer | Upsert. Validates: legal_name/line1/city/state/country/postal_code required; Indian pincode regex `^[1-9][0-9]{5}$`; GSTIN regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`; state_code resolved server-side from `indianStates.js` |

### 19.6 Checkout Hard Gate

`subscriptionController.createOrder` calls `fetchBillingAddress(userId, role)`. If no row or any mandatory field empty:
```json
{
  "code": "BILLING_ADDRESS_REQUIRED",
  "message": "Billing address required. Please save your billing details before checkout."
}
```
HTTP 400. Razorpay order is never created. `verifyPayment` repeats the same check defensively (in case a malicious or stale client bypasses `createOrder`).

### 19.7 Invoice Generator

**File:** `src/services/pdfService.js`

`generateInvoicePdf(data)` renders a one-page A4 PDF. Validates the four mandatory fields up-front (`user_name`, `customer_address` or `customer_line1`, `customer_state_name`, `customer_country`) and **throws** `Error('Invoice missing required billing fields')` if absent — no silent blank invoices.

Layout:
- **Header bar** (dark, gold logo + `openi.ai` URL)
- **Title block** (TAX INVOICE) + meta block (Invoice Number, Invoice Date, Place of Supply)
- **FROM** (supplier) and **BILL TO** (recipient) two-column blocks. BILL TO renders structured snapshot fields: legal_name, contact (if differs), email, line1, optional line2, `city, state (code), postal_code`, country, optional GSTIN
- **Line item table** — Description (210px) | HSN/SAC (60px) | Qty (40px) | Rate (90px) | Amount (95px)
- **Tax summary** — Taxable Value, then either `CGST @ 9% + SGST @ 9%` (intrastate), `IGST @ 18%` (interstate), or `IGST @ 0% (Export under LUT)` (export). Right-aligned with consistent 6 px gutter inside the gold TOTAL rectangle (Phase 60.11 clipping fix)
- **Grand TOTAL** in gold rectangle + **Total in words** (Indian-English, paise included for non-whole amounts)
- **Mandatory declaration** — domestic: `Tax payable on reverse charge: No`; export: `Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax. (LUT ARN: <if LUT_ARN env var set>)`
- **Payment Details** — Razorpay payment ID, order ID, status, date, method
- **Footer** — copyright, `openi.ai`, page number

### 19.8 GST Math (`computeGstBreakdown`)

```js
computeGstBreakdown(amount, customerStateCode, opts)
// opts: { isLegacyInclusive?: bool, isExport?: bool }
// returns: { taxable, cgst, sgst, igst, total, isIntraState, isExport, gstRate }
```

Three branches:
- `isExport=true` → `taxable=amount, cgst=sgst=igst=0, total=amount, gstRate=0`
- `isLegacyInclusive=true` → amount IS the total; back-compute base + tax
- Default → amount IS the base; total = base + 18% GST split appropriately

### 19.9 Audit-Grade Snapshot

Inside `verifyPayment`'s transaction:
1. `nextInvoiceNumber(client)` → mints `OPENI/FYxx-yy/NNNN`
2. JSONB billing snapshot built from the live `billing_addresses` row
3. `INSERT INTO payment_history (..., invoice_number, billing_address_snapshot) VALUES (..., $9, $10)`
4. `COMMIT`

`downloadInvoice` reads `payment_history.billing_address_snapshot` for the historical address — **never** the live `billing_addresses` row. Editing your address later only affects future invoices; old invoices reproduce identically.

Legacy `payment_history` rows from before Phase 60.11 still produce a downloadable PDF: filename `OpenI-Invoice-LEGACY-<id>.pdf`, invoice meta `INV-LEGACY-<payment_id>`, address synthesised from persona profile (`fetchCustomerBillingDetails` fallback).

### 19.10 Frontend / UX

- **`components/BillingAddressModal.jsx`** — 7-field modal. **Country, State, City all dropdowns**. Reuses `StateField` + `CityField` (Phase 60.10). Country defaults to India. Non-India hides GSTIN and shows the export-under-LUT notice. Client-side validation mirrors backend.
- **`pages/dashboard/Settings.jsx`** —
  - `handleUpgrade` first calls `billingAddressAPI.get()`; if missing/404, opens the modal and remembers the pending plan in `pendingUpgrade` state. After save, automatically resumes the upgrade flow.
  - Defence-in-depth: `runUpgrade` catches `BILLING_ADDRESS_REQUIRED` from the backend and re-opens the modal.
  - New "Billing Details" card on the Billing tab showing the saved address with an Edit button. International rows show the LUT notice inline.
- **Pricing cards** show `+ 18% GST · total` annotation (commit `72cb519`)
- **Settings → Billing → Payment History** has a discoverable **Download Invoice** button per row (commit `2210b10`)

### 19.11 Email Delivery

GST invoice PDF is buffered in-memory and auto-attached to `paymentConfirmationEmail` (in `services/emailService.js`). Filename derived from the canonical invoice number, e.g. `OpenI-Invoice-OPENI-FY26-27-0001.pdf`. Fire-and-forget; if the email send fails, the invoice number stays committed and the user can still download from the Billing tab.

### 19.12 Production Validation

The first GST-compliant invoice issued to a real customer was `OPENI/FY26-27/0001` (Vanessa Banduni, corporate persona, Bengaluru → IGST 18% interstate, Rs. 2,499.00 total). Verified line-by-line against GST Tax Invoice Rules. Re-rendered after the TOTAL row clipping fix landed, audit clean.

### 19.13 Optional Configuration

- `LUT_ARN` env var on Railway — when set, appended to the export declaration (e.g., "(LUT ARN: AD2706240000123)"). Optional; declaration renders without it.

### 19.14 Out of Scope

- **E-invoice (IRN) generation** — required only when aggregate turnover crosses the GSTN-mandated threshold (₹5 Cr). Will be a separate phase.
- **Multi-rate GST** — currently SaaS @ 18% is the only line item.
- **Backfilling historical invoice numbers** for pre-Phase-60.11 `payment_history` rows. Vanessa was a one-off backfill via `src/scripts/backfill-vanessa-invoice.js` because she paid the same day as the migration.

---

## Project Statistics

| Metric | Count |
|--------|-------|
| Frontend Pages | 60+ |
| Backend Controllers | 63 (added `billingAddressController` in Phase 60.11) |
| Backend API Routes | ~482 (+`GET`/`PUT /api/billing-address`) |
| Database Tables | 64 (added `billing_addresses` and `invoice_sequences` in Phase 60.11; `audit_logs` materialised in prod in Phase 63) |
| Persona Types | 11 V2 personas |
| Subscription Plans | 3 per role (Free / Pro / Enterprise), independent per persona |
| Public Pages | 3 (Landing, Marketplace, Reports) |
| Lines of Seed Data | ~300 |
| Frontend repo total commits | 200 |
| Backend repo total commits | 261 |
| First GST-compliant invoice | `OPENI/FY26-27/0001` (6 May 2026) |

---

## Repository Links

- **Frontend:** https://github.com/RajeevBanduni/openi-hub
- **Backend:** https://github.com/RajeevBanduni/openi-hub-backend
- **LinkedIn:** https://www.linkedin.com/company/openi-partners/
- **X (Twitter):** https://x.com/OpenIPartners

---

*Documentation for OpenI Hub — Multi-Persona Open Innovation Platform*
*Last updated: 8 May 2026 evening (v3.2 — added v2.8.1 Phase 63 backfill section, corrected Database Tables count 63 → 64). Active phase chain shipped 7-8 May: Phase 63 (`audit_logs` backfill, 7 May), then 8 phases on 8 May (64, 65 #1-#4, 65b, 65c, 65d, 65e) covering all 11 personas where applicable.* 🎉
