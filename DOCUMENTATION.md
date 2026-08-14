# OpenI Hub — Documentation INDEX

> **This file used to be a single 1,525-line / 79 KB document.** Reading it whole cost
> ~20K tokens before any work began, which was a direct contributor to context-limit
> compaction loops. On **6 Aug 2026** it was split, verbatim, into `docs/reference/`.
>
> **Read only the section you need.** Nothing was deleted. At the time of the split the
> 14 parts re-concatenated byte-for-byte into the original (verified: 78,943 bytes,
> 1,525 lines, `diff` clean).
>
> ⚠️ **That is no longer true, deliberately — as of 14 Aug 2026 the split is no longer
> verbatim.** An accuracy re-census corrected five parts against the source tree:
> **00, 02, 05, 08, 10** (marked ✎ in the table below). Each carries an
> `EDITED … — NO LONGER VERBATIM` notice on its first line. The remaining nine are still
> byte-identical to their slice of the original. **The re-concat recipe now reproduces the
> 6 Aug snapshot only for those nine** — do not treat a non-empty `diff` as corruption, and
> do not "restore" an edited part to make the diff clean. The corrected text is the
> accurate one; the original is the stale one.

## How to use this

    # find which section covers a topic
    grep -rn '<pattern>' docs/reference/

    # then read just that file
    # (all parts are under ~15 KB; most are under 6 KB)

Every part carries an identical **3-line header** (2 comment lines + 1 blank), so the body
always starts at line 4 — `tail -n +4` works uniformly across all files (unlike the earlier
`CLAUDE_ARCHIVE` / `NOTES` splits, where the offset differed per file). **This invariant is
load-bearing and survived the 14 Aug edits:** each `NO LONGER VERBATIM` notice was packed
onto the *existing* first comment line rather than added as a new one. If you edit a part,
never grow its header past 3 lines.

Re-verify the nine still-verbatim parts at any time:

    for f in docs/reference/*.md; do
      case "$(basename "$f")" in 00-*|02-*|05-*|08-*|10-*) continue ;; esac
      tail -n +4 "$f"
    done > /tmp/recat.md
    # compare against the corresponding line ranges of the 6 Aug original

## Sections

✎ = edited 14 Aug 2026, no longer verbatim.

| Part | File | Covers (`##` sections of the original) | Orig. lines | Size |
|---|---|---|---|---|
| 00 ✎ | [`docs/reference/00-front-matter.md`](docs/reference/00-front-matter.md) | Title, OpenI Assessment Platform, Table of Contents | 1–34 | 2.9 KB |
| 01 | [`docs/reference/01-overview-personas.md`](docs/reference/01-overview-personas.md) | 1. Project Overview · 2. Multi-Persona System | 35–115 | 5.5 KB |
| 02 ✎ | [`docs/reference/02-architecture-stack-setup.md`](docs/reference/02-architecture-stack-setup.md) | 3. Architecture · 4. Technology Stack · 5. Getting Started | 116–233 | 5.7 KB |
| 03 | [`docs/reference/03-frontend-modules.md`](docs/reference/03-frontend-modules.md) | 6. Frontend Modules | 234–312 | 4.5 KB |
| 04 | [`docs/reference/04-backend-api.md`](docs/reference/04-backend-api.md) | 7. Backend API Reference | 313–585 | 14.1 KB |
| 05 ✎ | [`docs/reference/05-database-schema.md`](docs/reference/05-database-schema.md) | 8. Database Schema | 586–651 | 10.5 KB |
| 06 | [`docs/reference/06-auth-security.md`](docs/reference/06-auth-security.md) | 9. Authentication & Authorization · 10. Security Features | 652–698 | 2.2 KB |
| 07 | [`docs/reference/07-payments-razorpay.md`](docs/reference/07-payments-razorpay.md) | 11. Licensing & Payments (Razorpay) | 699–795 | 6.0 KB |
| 08 ✎ | [`docs/reference/08-deployment-test-accounts.md`](docs/reference/08-deployment-test-accounts.md) | 12. Deployment · 13. Test Accounts | 796–863 | 4.2 KB |
| 09 | [`docs/reference/09-production-go-live.md`](docs/reference/09-production-go-live.md) | 14. Production Go-Live (openi.ai) | 864–1072 | 10.5 KB |
| 10 ✎ | [`docs/reference/10-marketing-public-pages.md`](docs/reference/10-marketing-public-pages.md) | 15. Marketing Landing Page · 16. Public Pages (v2.5) | 1073–1240 | 13.3 KB |
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
