# OpenI Hub — Documentation INDEX

> **This file used to be a single 1,525-line / 79 KB document.** Reading it whole cost
> ~20K tokens before any work began, which was a direct contributor to context-limit
> compaction loops. On **6 Aug 2026** it was split, verbatim, into `docs/reference/`.
>
> **Read only the section you need.** Nothing was deleted — the 14 parts below
> re-concatenate byte-for-byte into the original (verified: 78,943 bytes, 1,525 lines,
> `diff` clean).

## How to use this

    # find which section covers a topic
    grep -rn '<pattern>' docs/reference/

    # then read just that file
    # (all parts are under ~15 KB; most are under 6 KB)

Every part carries an identical **3-line header**, so the verbatim body always starts at
line 4 — `tail -n +4` works uniformly across all files (unlike the earlier
`CLAUDE_ARCHIVE` / `NOTES` splits, where the offset differed per file).

Re-verify the split at any time:

    for f in docs/reference/*.md; do tail -n +4 "$f"; done > /tmp/recat.md
    diff <original> /tmp/recat.md   # must be empty

## Sections

| Part | File | Covers (`##` sections of the original) | Orig. lines | Size |
|---|---|---|---|---|
| 00 | [`docs/reference/00-front-matter.md`](docs/reference/00-front-matter.md) | Title, OpenI Assessment Platform, Table of Contents | 1–34 | 2.1 KB |
| 01 | [`docs/reference/01-overview-personas.md`](docs/reference/01-overview-personas.md) | 1. Project Overview · 2. Multi-Persona System | 35–115 | 5.5 KB |
| 02 | [`docs/reference/02-architecture-stack-setup.md`](docs/reference/02-architecture-stack-setup.md) | 3. Architecture · 4. Technology Stack · 5. Getting Started | 116–233 | 4.1 KB |
| 03 | [`docs/reference/03-frontend-modules.md`](docs/reference/03-frontend-modules.md) | 6. Frontend Modules | 234–312 | 4.5 KB |
| 04 | [`docs/reference/04-backend-api.md`](docs/reference/04-backend-api.md) | 7. Backend API Reference | 313–585 | 14.1 KB |
| 05 | [`docs/reference/05-database-schema.md`](docs/reference/05-database-schema.md) | 8. Database Schema | 586–651 | 2.0 KB |
| 06 | [`docs/reference/06-auth-security.md`](docs/reference/06-auth-security.md) | 9. Authentication & Authorization · 10. Security Features | 652–698 | 2.2 KB |
| 07 | [`docs/reference/07-payments-razorpay.md`](docs/reference/07-payments-razorpay.md) | 11. Licensing & Payments (Razorpay) | 699–795 | 6.0 KB |
| 08 | [`docs/reference/08-deployment-test-accounts.md`](docs/reference/08-deployment-test-accounts.md) | 12. Deployment · 13. Test Accounts | 796–863 | 3.0 KB |
| 09 | [`docs/reference/09-production-go-live.md`](docs/reference/09-production-go-live.md) | 14. Production Go-Live (openi.ai) | 864–1072 | 10.5 KB |
| 10 | [`docs/reference/10-marketing-public-pages.md`](docs/reference/10-marketing-public-pages.md) | 15. Marketing Landing Page · 16. Public Pages (v2.5) | 1073–1240 | 10.0 KB |
| 11 | [`docs/reference/11-personas-v2-auth-flows.md`](docs/reference/11-personas-v2-auth-flows.md) | 17. Multi-Persona V2 (`activeRole`) · 18. Email Verification, Password Reset, ToU Gate | 1241–1318 | 5.5 KB |
| 12 | [`docs/reference/12-gst-invoicing.md`](docs/reference/12-gst-invoicing.md) | 19. GST-Compliant Invoicing (OpenI Partners LLP) | 1319–1496 | 10.7 KB |
| 13 | [`docs/reference/13-stats-repo-links.md`](docs/reference/13-stats-repo-links.md) | Project Statistics · Repository Links | 1497–1525 | 1.5 KB |

## Appending new documentation

Add to the **relevant part**, not to this index. If a part grows past ~15 KB, split it on
a clean `##` boundary and add a row here. This index stays small — that is its only job.

## Companions

| File | Purpose |
|---|---|
| `docs/TESTING-GUIDE-v2.md` | Manual QA walkthrough |
| `docs/INVESTOR_E2E_TESTING_GUIDE.md` | Investor-persona E2E script |
| `/Users/rajeevbanduni/CoPilot/CLAUDE.md` | Invariants, infra IDs, schema gotchas |
| `/Users/rajeevbanduni/CoPilot/SESSIONS.md` | Append-only session log (use `bin/resume.sh`) |
