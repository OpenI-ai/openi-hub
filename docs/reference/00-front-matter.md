<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 1-34 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

# OpenI Hub - Project Documentation

## OpenI Assessment Platform

**Version:** 5.57

**Last Updated:** 21 Jul 2026 — Session 53 (Partner API v1 for enterprise clients — self-serve key management + read/write challenge/application endpoints reusing `corporateController`, gated on the `seeker_enterprise` `api_access` flag, BE `7763d88`; documented in § 6.21 below, with the `is_public`/`visibility` create-time bug and the not-yet-built SSO/audit-log-export gap both flagged and tracked in `NEXT_SESSION_TODOS.md`). Full session-by-session history (sessions 1-40) archived verbatim in `DOCUMENTATION_ARCHIVE_part1.md` (split 10 Jul 2026, nothing deleted — straight cut at the legacy/living-doc boundary). See that file for the complete narrative changelog.

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

