<!-- Section of OpenI Hub DOCUMENTATION.md (lines 1-34 of the pre-split original). EDITED 14 Aug 2026 (version + last-updated stamp) — NO LONGER VERBATIM, out of the re-concat recipe. -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

# OpenI Hub - Project Documentation

## OpenI Assessment Platform

**Version:** 5.58

**Last Updated:** 14 Aug 2026 — accuracy re-census after sessions 54-76. The doc had not been content-updated since 21 Jul 2026 (v5.57, Session 53); the 6 Aug split into `docs/reference/` (`3a86a62`) moved bytes only and updated nothing. Five parts were corrected against the source tree: **§12** (the "auto-migration runs on every deploy" line was false — `RUN_MIGRATIONS_ON_BOOT` is deliberately unset in prod), **§3/§5** (post-split file map; `npm run db:migrate` was deleted 12 Aug, `fb0b9f1`), **§8** (28 tables → **165**, full re-census), **§16** (public pages 3 → 12, endpoint table 4 → 22 rows, `publicController.js` is now a 17-line shim), and this stamp. Corrections are dated inline where they appear.

> **Sessions 54-76 are NOT narrated here.** This is a correctness pass over the existing sections, not a changelog catch-up: the intervening work (W6 controller/route splits, Partner API hardening, CI + backup alerting, geo filters, Phase 172 scoring diagnostics) is recorded per-session in `SESSIONS.md`, which is the authoritative log. Sections not listed above were last verified 21 Jul 2026 and may still be stale.

Full session-by-session history (sessions 1-40) archived verbatim in `DOCUMENTATION_ARCHIVE_part1.md` (split 10 Jul 2026, nothing deleted — straight cut at the legacy/living-doc boundary). See that file for the complete narrative changelog.

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

