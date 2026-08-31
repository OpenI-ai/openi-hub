<!-- Section of OpenI Hub DOCUMENTATION.md (lines 796-863 of the pre-split original). EDITED 14 Aug 2026 (§12 Backend + Database) — NO LONGER VERBATIM, out of the re-concat recipe. -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

## 12. Deployment

### Frontend (Vercel)

- **Project:** openi-hub
- **GitHub:** RajeevBanduni/openi-hub (public)
- **Auto-deploy:** On push to `main` branch
- **Build Command:** `npm run build`
- **Output:** `dist/`
- **Deploy manually:** `cd openi-hub && npx vercel --prod --yes`
- **`VITE_TURNSTILE_SITE_KEY`** (added 31 Aug 2026, type Config, Production): the public
  Turnstile sitekey (`0x4AAAAAAEiucx13YNmwrA4F`) for the registration CAPTCHA. `VITE_*`
  values are baked at build time — changing it needs a redeploy. Unset = no widget,
  no CAPTCHA (matches the backend flag's off state).

### Backend (Railway)

- **Project:** capable-energy
- **GitHub:** RajeevBanduni/openi-hub-backend (private)
- **Auto-deploy:** On push to `main` branch
- **Entry Point:** `src/startup.js` (82-line re-export shim; the migration steps live in `src/migrations/` — 14 ordered modules + an `index.js` registry — and the demo seed in `src/seed/index.js`)
- **`TURNSTILE_SECRET_KEY`** (added 31 Aug 2026): secret half of the registration
  CAPTCHA key pair (Cloudflare dashboard → Turnstile → widget "openi.ai"). Unset =
  every check passes (feature off). Verification fails OPEN on Cloudflare outages by
  design — see `src/utils/turnstile.js`.

### Cloudflare (proxied since 31 Aug 2026)

- **DNS proxying ON** (orange cloud) for the four web-facing records: `openi.ai`
  (apex), `www`, `app`, `api`. Everything else — MX/TXT/DKIM, `cpanel`,
  `webdisk` — stays DNS-only on purpose (mail breaks behind the proxy; cPanel's
  ports are blocked by it). SSL mode: **Full** (set ~Apr 2026; do NOT use
  Flexible — redirect loops against Vercel/Railway, both of which force HTTPS).
  Before 31 Aug all records were DNS-only, which is why the Service Costs
  Cloudflare card read 0 requests since collection began.
- **Turnstile widget** "openi.ai" (Managed mode, pre-clearance off) guards
  registration only — chosen over zone-wide Bot Fight Mode, which would also
  challenge partner-API server-to-server callers and BetterStack uptime probes.
  Sitekey is public (in the FE bundle by design); the secret lives only on Railway.

### Database (Railway PostgreSQL)

- **Auto-migration: OFF in production.** Migrations run on boot **only** when `RUN_MIGRATIONS_ON_BOOT` is set to `true`/`1`/`yes`; that variable is deliberately unset on Railway, so a deploy starts the server and skips schema work entirely (`src/startup.js` logs `⏭  RUN_MIGRATIONS_ON_BOOT not enabled`). The gate was added after the s42 incident (29 Apr 2026), where a redeploy's `CREATE INDEX` statements deadlocked against a concurrent backup `pg_dump`.
- **To apply a schema change in production:** `railway ssh` → `npm run migrate:bootstrap` (`src/scripts/migrate-bootstrap.js`). This is the **only** migration entrypoint — the second one, `src/db/migrate.js` + its `db:migrate` script, was deleted on 12 Aug 2026 (`fb0b9f1`) because it was three months stale yet still connected to whatever `DATABASE_URL` was in scope. Do not recreate it.
- **Migrations are idempotent but ORDER-DEPENDENT and run with no surrounding transaction** — a mid-way failure leaves earlier steps applied. A new migration APPENDS a `0NN-*.js` module at the end of `src/migrations/` plus an entry at the end of the `steps` array; never edit `startup.js` and never insert into the middle of `steps`.
- **Seed Data:** 10 startups, 5 projects, 10 tasks, 6 evaluations, 7 messages, 5 feedback, 7 IPR records, 6 infrastructure, 10 documents, 3 watchlists, 4 assessments, 4 knowledge articles, 8 crawl sources, 8 crawled startups, 5 crawl jobs

### GitHub credentials (verified 29 Aug 2026, PAT corrected 30 Aug 2026)

- **Rajeev's Mac authenticates git via the GitHub CLI's OAuth login**, not a PAT: `~/.gitconfig` has `credential "https://github.com".helper = !/usr/local/bin/gh auth git-credential` (URL-scoped, so it overrides the system osxkeychain helper; `git config --get-all credential.helper` does NOT show it — use `--get-regexp '^credential'`). The `gho_…` OAuth token has `repo` scope and no fixed expiry.
- **The `openi-git-rw` fine-grained PAT** (created 31 May 2026 as the backend git credential — see DOCUMENTATION_ARCHIVE_part1.md, now superseded) **was deleted on 29 Aug 2026** along with its keychain entry. It had been dormant since the `gh` helper took over. Archive references to it as "the backend git credential" are stale.
- **The custom PAT is `openi-hub-ops-readonly`** (created 30 Aug 2026): resource owner **OpenI-ai** (org-owned), repository access `openi-hub-backend` only, permissions Contents + Actions **read-only**. Set as `GITHUB_TOKEN` on Railway; serves the What's New backend-commit sync (`whatsNewController`) and the admin DR Backup Health panel (`getDrillHistory`). Expiry set at creation (recommended 1 year → ~Aug 2027; confirm on the token page when it matters).
- **Its predecessor `openi-hub-whats-new-sync` was broken from the org move onward and is retired** (deletion pending, see BUGS.md todo): it was owned by Rajeev's *personal* account, and transferring the repos RajeevBanduni → OpenI-ai silently dropped its repository grant, leaving it public-repos-only. Symptoms while broken: DR Backup panel `HTTP 404` and a silently dead What's New backend sync. **Rule for next time: a personal fine-grained PAT does not survive a repo transfer to an org — re-create the token with the org as resource owner.** The 29 Aug claim here that it carried "Contents + Actions: Read" described its creation intent, not its live grants.
- Neither repo's CI uses any custom PAT (frontend CI has no secrets by design; backend CI uses only the built-in Actions token + B2/Resend/DB secrets).
- Local backend clone lives at `~/Downloads/OpenI Hub/openi-hub-backend` (path has a space — quote it).

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

