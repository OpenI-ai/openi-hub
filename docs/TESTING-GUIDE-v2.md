# OpenI Hub — Platform Testing Guide v2.0

**Date:** 13 April 2026
**Prepared by:** OpenI Partners
**For:** QA Team / End-User Testing
**Platform Version:** Phase 25 (Feature-complete through AI Telemetry)

---

## Table of Contents

1. [Environment URLs](#1-environment-urls)
2. [Demo Accounts](#2-demo-accounts)
3. [Platform Overview](#3-platform-overview)
4. [Test Case Legend](#4-test-case-legend)
5. [TC-AUTH: Authentication & Onboarding](#5-tc-auth-authentication--onboarding)
6. [TC-STARTUP: Startup Persona](#6-tc-startup-startup-persona)
7. [TC-CORP: Corporate Persona](#7-tc-corp-corporate-persona)
8. [TC-INV: Investor Persona](#8-tc-inv-investor-persona)
9. [TC-INC: Incubator Persona](#9-tc-inc-incubator-persona)
10. [TC-ACC: Accelerator Persona](#10-tc-acc-accelerator-persona)
11. [TC-MENT: Mentor Persona](#11-tc-ment-mentor-persona)
12. [TC-LAB: Lab Persona](#12-tc-lab-lab-persona)
13. [TC-SP: Service Provider Persona](#13-tc-sp-service-provider-persona)
14. [TC-STU: Student Persona](#14-tc-stu-student-persona)
15. [TC-ACAD: Academia Persona](#15-tc-acad-academia-persona)
16. [TC-GOVT: Government Persona](#16-tc-govt-government-persona)
17. [TC-SRCH: Search & Discovery](#17-tc-srch-search--discovery)
18. [TC-DIR: Directory & Connections](#18-tc-dir-directory--connections)
19. [TC-LIC: Licensing & Billing](#19-tc-lic-licensing--billing)
20. [TC-PUB: Public Pages](#20-tc-pub-public-pages)
21. [TC-SET: Settings](#21-tc-set-settings)
22. [TC-ADMIN: Admin Features](#22-tc-admin-admin-features)
23. [TC-EDGE: Edge Cases & Error Handling](#23-tc-edge-edge-cases--error-handling)
24. [Known Issues & Limitations](#24-known-issues--limitations)
25. [Support & Escalation](#25-support--escalation)

---

## 1. Environment URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://openi-hub.vercel.app |
| **Backend API** | https://openi-hub-production.up.railway.app |
| **CMS Admin** | https://openi-hub-cms-production.up.railway.app/admin/ |
| **API Base** | https://openi-hub-production.up.railway.app/api |

---

## 2. Demo Accounts

All demo accounts use **password: `Demo@123`** and **MFA code: `123456`**.

| Persona | Email | Role Type |
|---------|-------|-----------|
| Startup | startup@demo.openi.ai | Provider |
| Student | student@demo.openi.ai | Provider |
| Academia | academia@demo.openi.ai | Provider |
| Corporate | corporate@demo.openi.ai | Seeker |
| Government | govt@demo.openi.ai | Seeker |
| Investor | investor@demo.openi.ai | Seeker |
| Lab | lab@demo.openi.ai | Seeker |
| Incubator | incubator@demo.openi.ai | Seeker |
| Accelerator | accelerator@demo.openi.ai | Seeker |
| Service Provider | serviceprovider@demo.openi.ai | Seeker |
| Mentor | mentor@demo.openi.ai | Seeker |

**Admin account:** admin@drdo.gov.in / Admin@123

**Organizations (Phase 21):**
- Tata Innovation Corp — Enterprise tier, 10 seats
- Ministry of Innovation — Pro tier, 20 seats

---

## 3. Platform Overview

**Architecture:** React + Vite (frontend) | Node.js + Express (backend) | PostgreSQL (90+ tables) | Strapi v4 (CMS)

**11 Persona Types:**
- **Providers** (3): Startup, Student, Academia
- **Seekers** (8): Corporate, Government, Investor, Lab, Incubator, Accelerator, Service Provider, Mentor

**Key Features by Phase:**
- Phases 1-3: Multi-persona auth, profiles, file upload, licensing (Free/Pro/Enterprise)
- Phases 4-5: Public pages, CMS integration
- Phase 6: Email notifications (Resend)
- Phases 7-9: Service Provider persona, PDF export, corporate enhancements
- Phases 10-11: Rich startup profiles (15 sections), investor overhaul (deal pipeline, 8-vector eval)
- Phase 12: Government impact analytics
- Phase 13: Taxonomy overhaul (856+ entries across 5 types)
- Phase 14: FTS + pgvector semantic search + global search
- Phase 15: AI query parsing (natural language to structured filters)
- Phase 16A-E: Incubator, accelerator, service provider, mentor, lab enhancements
- Phase 17: Landing page + pricing rehash
- Phase 18: Connections / networking (LinkedIn-style)
- Phase 19: Feature access gating per tier
- Phase 20: Onboarding wizard
- Phase 21: Organization admin + bulk licensing
- Phase 22: Feature discovery + changelog
- Phase 24: Admin analytics dashboard
- Phase 25: AI usage telemetry

---

## 4. Test Case Legend

| Column | Meaning |
|--------|---------|
| **ID** | Unique test case identifier (e.g., AUTH-01) |
| **Test** | What to test — step-by-step action |
| **Expected** | Expected outcome |
| **Priority** | P0 = blocker, P1 = critical, P2 = important, P3 = nice-to-have |

**Status markers for QA team:**
- [ ] Not tested
- [PASS] Passed
- [FAIL] Failed — add bug description
- [SKIP] Skipped — add reason

---

## 5. TC-AUTH: Authentication & Onboarding

### 5.1 Registration

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| AUTH-01 | Navigate to `/register`. Verify persona picker grid shows all 11 persona types with icons and descriptions. | All 11 cards visible: Startup, Student, Academia, Corporate, Government, Investor, Lab, Incubator, Accelerator, Service Provider, Mentor | P0 |
| AUTH-02 | Select "Startup" persona. Fill required fields (name, email, password, confirm password, city, sector). Submit. | Registration success, redirect to login, welcome email sent to address. | P0 |
| AUTH-03 | Select "Corporate" persona. Verify that profile fields differ from Startup (should show company_name, industry, employee_count, etc.). | Corporate-specific fields displayed (not startup fields like TRL, stage). | P1 |
| AUTH-04 | Try to register with an already-used email. | Error: "Email already registered" or similar. No duplicate user created. | P0 |
| AUTH-05 | Try to register with password shorter than 8 characters. | Validation error before submission. | P1 |
| AUTH-06 | Try to register with mismatched password and confirm password. | Validation error before submission. | P1 |
| AUTH-07 | Navigate to `/register?type=investor`. Verify the investor persona is pre-selected. | Investor card pre-selected, investor-specific fields displayed. | P2 |
| AUTH-08 | Register each of the 11 persona types (use unique emails). Verify each redirects to login after success. | All 11 registrations succeed. Each gets a welcome email. | P1 |

### 5.2 Login & MFA

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| AUTH-10 | Navigate to `/dashboard/login`. Enter valid demo credentials (startup@demo.openi.ai / Demo@123). | MFA screen appears asking for 6-digit code. | P0 |
| AUTH-11 | Enter MFA code `123456`. | Login success, redirect to `/dashboard`. JWT token stored. User name + persona visible in top bar. | P0 |
| AUTH-12 | Enter wrong MFA code (e.g., `000000`). | Error: "Invalid MFA code" or similar. Stays on MFA screen. | P0 |
| AUTH-13 | Enter wrong password on login. | Error: "Invalid credentials" or similar. No login. | P0 |
| AUTH-14 | Enter non-existent email on login. | Error: "Invalid credentials". Does not reveal whether email exists. | P1 |
| AUTH-15 | After successful login, refresh the page. | User remains logged in (token persists). Dashboard reloads correctly. | P0 |
| AUTH-16 | Click logout. Then try to access `/dashboard/home`. | Redirect to `/dashboard/login`. Protected routes inaccessible. | P0 |
| AUTH-17 | Login as each of the 11 demo accounts. Verify each lands on persona-specific dashboard. | Each persona sees its own nav sidebar and dashboard stats. | P1 |

### 5.3 Onboarding (Phase 20)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| AUTH-20 | Register a brand new user (any persona). After login, verify redirect to onboarding wizard. | New user sees `/dashboard/onboarding` with persona-specific steps and progress bar. | P1 |
| AUTH-21 | Complete each step of the onboarding wizard (varies by persona). | Progress bar advances. Steps are persona-specific (e.g., startup: profile → sector/tech → pitch deck → browse challenges). | P1 |
| AUTH-22 | Click "Skip" at any point during onboarding. | Onboarding marked as skipped. User taken to DashboardHome. | P1 |
| AUTH-23 | After completing onboarding, navigate away and come back. Verify onboarding does NOT show again. | Onboarding wizard does not appear for users who completed/skipped it. | P1 |

---

## 6. TC-STARTUP: Startup Persona

**Login as:** startup@demo.openi.ai / Demo@123 / MFA: 123456

### 6.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STRT-01 | After login, navigate to `/dashboard/home`. | Persona dashboard shows: stat cards (applications, challenges matched, meetings, profile completion %), quick actions, recommendations section. | P0 |
| STRT-02 | Verify recommendations widget shows recommended challenges and/or partner matches. | At least 1 recommended challenge or partner displayed (based on sector/tech overlap scoring). | P2 |

### 6.2 Profile (Rich Startup Profile — 15 Sections)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STRT-10 | Navigate to `/dashboard/profile`. | Profile page loads with all fields pre-populated (or blank for unfilled). | P0 |
| STRT-11 | Edit basic profile fields: startup_name, tagline, website, city, state, founding_year. Click Save. | Fields saved. Toast/success message. Refresh page — changes persist. | P0 |
| STRT-12 | Edit sector using taxonomy selector. Search for "Healthcare". Select a sub-sector. Save. | Sector saved with taxonomy ID. Shows correct label after save. | P1 |
| STRT-13 | Add technology tags using taxonomy tag selector. Add "AI/ML" and "Blockchain". Save. | Tags saved as array. Displayed as pills/chips on profile. | P1 |
| STRT-14 | Upload a logo via FileUpload component (drag-and-drop or click). | Image uploaded to Cloudinary. Preview shown. Logo URL saved to profile. | P1 |
| STRT-15 | Upload a pitch deck (PDF). | File uploaded to Cloudinary. Download link saved. Visible in profile. | P1 |
| STRT-16 | Edit business fields: business_model, revenue_model, product_type, employee_range. Save. | Fields saved correctly. Dropdowns show correct selected values after reload. | P1 |
| STRT-17 | Edit financial fields: revenue_range, MRR, ARR, growth_rate, burn_rate, runway_months. Save. | Numeric fields saved. Currency format displayed correctly. | P2 |
| STRT-18 | Edit social URLs: twitter, github, crunchbase, youtube, product_hunt. Save. | URLs saved. Displayed as clickable links. | P2 |
| STRT-19 | Add startup_type, mission, vision, video_url fields. Save. | All text fields saved correctly. Video URL renders if valid. | P2 |

### 6.3 Child Sections (8 Tables)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STRT-20 | Navigate to Products section. Click "Add Product". Fill name, description, URL, status. Save. | Product created. Appears in list. | P1 |
| STRT-21 | Edit an existing product. Change description. Save. | Changes persisted. | P1 |
| STRT-22 | Delete a product. Confirm deletion. | Product removed from list. | P1 |
| STRT-23 | Add a Team Member: name, role, LinkedIn URL, bio. Save. | Team member created and visible. | P1 |
| STRT-24 | Add a Funding Round: round_type (Seed/Series A/etc.), amount, currency (INR/USD), investor_names, date. Save. | Funding round created. Amount displayed with correct currency. | P1 |
| STRT-25 | Add a Client: company_name, sector, contract_value, start_date. Save. | Client created and listed. | P2 |
| STRT-26 | Add a Patent: title, patent_number, status (filed/granted/pending), filing_date. Save. | Patent created and listed. | P2 |
| STRT-27 | Add a Competitor: name, website, description. Save. | Competitor created. | P2 |
| STRT-28 | Add News: title, source, URL, published_date. Save. | News item created. | P2 |
| STRT-29 | Add an Acquisition: company_name, date, amount. Save. | Acquisition created. | P3 |
| STRT-30 | View full public profile at `/dashboard/startup-profile/:id`. Verify all 8 child sections render. | Products, Team, Funding, Clients, Patents, Competitors, News, Acquisitions all visible with data. | P1 |

### 6.4 Marketplace & Applications

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STRT-40 | Navigate to Marketplace (`/dashboard/marketplace`). | List of open challenges loads. Search bar, sort dropdown, filters visible. | P0 |
| STRT-41 | Use keyword search to find challenges (e.g., "supply chain"). | Results filtered by keyword. Relevance ranking applied (FTS). | P1 |
| STRT-42 | Filter by challenge_type (Partner/Source/Invest). | Only challenges of selected type shown. | P1 |
| STRT-43 | Sort by "Newest first", "Deadline soonest", "Most applications". | Order changes correctly per sort option. | P2 |
| STRT-44 | Click a challenge to view detail. Verify title, description, requirements, sector, deadline, FAQ accordion. | All challenge details displayed. FAQ items expandable. | P0 |
| STRT-45 | Click "Apply" on a challenge. Fill application form. Submit. | Application submitted. Success message. Application appears in "My Applications". | P0 |
| STRT-46 | Navigate to My Applications. Verify the just-submitted application appears with status. | Application listed with status "submitted" or similar. | P0 |
| STRT-47 | Try to apply to the same challenge again. | Error: "Already applied" or button disabled. No duplicate application. | P1 |
| STRT-48 | Verify sector + challenge_type facet chips appear below search bar. Click a chip. | Results filter to that facet value. | P2 |

### 6.5 Other Startup Nav Items

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STRT-50 | Navigate to Startup Discovery (`/dashboard/startups`). Search for a startup. | Startup cards load. Search works with FTS. | P1 |
| STRT-51 | Navigate to IPR Database (`/dashboard/ipr`). | IPR list loads. | P2 |
| STRT-52 | Navigate to Infrastructure (`/dashboard/infrastructure`). | Infrastructure list loads. | P2 |
| STRT-53 | Navigate to DeepTech Qualification (`/dashboard/deeptech`). | DeepTech assessment page loads. | P2 |
| STRT-54 | Navigate to Feedback (`/dashboard/feedback`). | Feedback page loads. Can submit feedback. | P2 |

---

## 7. TC-CORP: Corporate Persona

**Login as:** corporate@demo.openi.ai / Demo@123 / MFA: 123456

### 7.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-01 | Navigate to `/dashboard/corporate`. | Corporate dashboard shows: challenge stats, conversion funnel, recommendations widget. | P0 |
| CORP-02 | Verify recommendations widget shows recommended startups (based on industry/sector overlap). | At least 1 recommended startup displayed with match score. | P2 |

### 7.2 Challenge Management

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-10 | Navigate to Challenges (`/dashboard/corporate/challenges`). Verify list loads. | Challenges listed with status badges, application counts, deadline. | P0 |
| CORP-11 | Click "New Challenge". Verify template picker shows 6 built-in templates. | Templates: AI Defect Detection, Predictive Maintenance, Supply Chain, Cybersecurity, Clean Energy, HealthTech. | P1 |
| CORP-12 | Select a template. Verify form pre-fills with template data. | Title, description, requirements, sector populated from template. | P1 |
| CORP-13 | Create a new challenge manually (no template). Fill: title, description, problem_statement, sector, deadline, challenge_type (Partner). Set visibility to Public. Submit. | Challenge created. Appears in list with status "draft". | P0 |
| CORP-14 | Edit the challenge. Change status from "draft" to "open". Save. | Status updated. Challenge now visible in marketplace. | P0 |
| CORP-15 | Set visibility to "Private". Verify a share_token is generated. Copy share link. | Share token UUID visible. "Copy link" button works. | P1 |
| CORP-16 | Open the share link in incognito/different browser (logged out). | SharedChallenge page loads with challenge details (no auth required). | P1 |
| CORP-17 | Filter challenges by: status (open/draft/closed), challenge_type, sector, search keyword, sort (newest/oldest/deadline). | Each filter works independently and in combination. | P1 |
| CORP-18 | Export a challenge as PDF. | PDF downloads with OpenI branding (Lexend font, gold/dark theme, logo). Contains challenge details. | P1 |
| CORP-19 | Social share: Click LinkedIn share button on a challenge. | LinkedIn share dialog opens with pre-filled challenge URL. | P2 |
| CORP-20 | Social share: Click X (Twitter) share button. | X share dialog opens with pre-filled text and URL. | P2 |

### 7.3 Challenge Templates

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-25 | Save a custom template from an existing challenge. | Template created. Appears in template list alongside built-in templates. | P1 |
| CORP-26 | Delete a custom template. | Template removed. Built-in templates cannot be deleted. | P2 |

### 7.4 Applications & Rating

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-30 | View applications on a challenge (requires a startup to have applied). | Application list shows: startup name, status, submission date. | P0 |
| CORP-31 | Rate an applicant with 1-5 stars. Add evaluation notes. Save. | Rating + notes saved. Star display updated. | P1 |
| CORP-32 | Add application notes (internal notes about an applicant). | Notes saved. Multiple notes can be added per application. | P2 |
| CORP-33 | Add application documents (upload file linked to applicant). | Document uploaded and linked to application. | P2 |

### 7.5 Team Sharing

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-35 | Add a team member to a challenge (requires another registered corporate user). Set role to "editor". | Member added. They can view and edit the challenge. | P1 |
| CORP-36 | Change member role to "viewer". | Role updated. Member can only view (not edit). | P2 |
| CORP-37 | Remove a team member. | Member removed. No longer has access. | P2 |

### 7.6 Collaborations

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-40 | Create a collaboration from an awarded challenge. | Collaboration created. Kanban board shows stages. | P1 |
| CORP-41 | View collaboration milestones. Verify auto-generated milestones per stage. | Milestones listed with checkboxes. Progress bar reflects completion. | P1 |
| CORP-42 | Toggle a milestone checkbox (complete/incomplete). | Milestone status updates. Progress bar recalculates. | P1 |
| CORP-43 | Add a custom milestone. Edit its title. Delete it. | CRUD operations work on milestones. | P2 |
| CORP-44 | Add a task with assignee, priority, due date. | Task created and listed. | P1 |
| CORP-45 | Mark a task as complete. | Task status updated. | P2 |
| CORP-46 | View collaboration budget: estimated vs spent. | Budget bar displayed with color coding (green/yellow/red based on spend %). | P2 |

### 7.7 Startup Search & Recommendations

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| CORP-50 | Navigate to Corporate Startup Search. Search for "healthcare deeptech". | Results returned via FTS. Startup cards with sector, stage, city. | P1 |
| CORP-51 | Click "Recommended Startups" on a specific challenge. | Recommended startups shown with match score. "Invite to Apply" button visible. | P1 |
| CORP-52 | Click "Invite to Apply". | Invite email sent to startup. Success message. | P2 |

---

## 8. TC-INV: Investor Persona

**Login as:** investor@demo.openi.ai / Demo@123 / MFA: 123456

### 8.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INV-01 | Navigate to dashboard. | Investor dashboard shows: deal stats, portfolio summary, recommended startups. | P0 |

### 8.2 Deal Pipeline (7 Stages)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INV-10 | Navigate to Deal Pipeline (`/dashboard/investor/deals`). | Kanban board with 7 columns: Sourced, Evaluating, LOI, Diligence, Term Sheet, Closed, Passed. | P0 |
| INV-11 | Create a new deal: startup name, sector, stage, ticket_size, currency. | Deal created in "Sourced" stage. Card appears on kanban. | P0 |
| INV-12 | Move a deal from "Sourced" to "Evaluating" (drag or status update). | Deal moves to next column. Auto-generated milestones created for new stage. | P1 |
| INV-13 | Continue moving deal through all stages: LOI → Diligence → Term Sheet → Closed. | Deal progresses. Milestones auto-generated at each stage. | P1 |
| INV-14 | Move a deal to "Passed" (rejected). | Deal moves to Passed column. | P1 |
| INV-15 | Click on a deal card to view detail. | Deal detail page shows: startup info, current stage, evaluation, milestones tab, tasks tab. | P0 |
| INV-16 | Edit deal details: update notes, change ticket_size. Save. | Changes saved. | P1 |

### 8.3 8-Vector Evaluation

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INV-20 | On a deal detail page, click "Add Evaluation". | Evaluation form with 8 sliders: Market, Team, Tech, Traction, Financials, IP, Scalability, Strategic Fit (each 1-5). | P0 |
| INV-21 | Set all 8 vectors (e.g., Market=4, Team=5, Tech=3, Traction=4, Financials=3, IP=2, Scalability=4, StrategicFit=5). Save. | Evaluation saved. Overall score auto-computed (average of 8 vectors = 3.75). | P0 |
| INV-22 | View evaluation history on a deal. | Multiple evaluations listed with date, overall score, per-vector breakdown. | P1 |
| INV-23 | Edit an existing evaluation. Change one vector. Save. | Overall score recalculated. Updated evaluation persisted. | P1 |

### 8.4 Deal Milestones & Tasks

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INV-30 | View milestones on a deal. | Auto-generated milestones for current stage listed with checkboxes. | P1 |
| INV-31 | Toggle milestone completion. | Status updates. | P1 |
| INV-32 | Add a custom milestone. | Custom milestone created. | P2 |
| INV-33 | Add a task with assignee, priority, due date. Mark as complete. | Task CRUD works. | P2 |

### 8.5 Portfolio Management

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INV-40 | Navigate to Portfolio (`/dashboard/investor/portfolio`). | Portfolio card grid shows: companies, stats (active/exited/failed), total invested. | P0 |
| INV-41 | Add a company to portfolio: name, sector, entry_date, amount_invested, currency, stage. | Company added. Card appears in grid. | P1 |
| INV-42 | Edit portfolio company: update status to "exited". Add exit_amount, exit_date, exit_multiple. | Exit tracked. Card shows "Exited" badge. ROI/multiple calculated. | P1 |
| INV-43 | Mark a portfolio company as "failed". | Status updated. Stats reflect the change. | P2 |

---

## 9. TC-INC: Incubator Persona

**Login as:** incubator@demo.openi.ai / Demo@123 / MFA: 123456

### 9.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-01 | Navigate to dashboard. | Incubator dashboard shows: program count, pipeline stats, mentor pool size, portfolio health. | P0 |

### 9.2 Programs

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-10 | Navigate to Programs (`/dashboard/incubator/programs`). | Program list loads. Demo: "T-Hub DeepTech Cohort 2026" visible. | P0 |
| INC-11 | Create a new program: name, description, program_type, duration_months, funding_amount, currency, start_date, end_date. Submit. | Program created. 6 auto-seeded milestones generated. | P0 |
| INC-12 | Click on a program to view detail. | Program detail page with 4 tabs: Pipeline, Milestones, Mentors, Portfolio Health. | P0 |
| INC-13 | Edit program: change description, funding_amount. Save. | Changes saved. | P1 |
| INC-14 | Delete a program. | Program removed. Associated data cleaned up. | P2 |

### 9.3 Startup Pipeline (6-stage)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-20 | On program detail, view Pipeline tab. | Kanban with stages: Applied, Screening, Interview, Selected, Graduated, Rejected/Dropped. | P0 |
| INC-21 | Add a startup to pipeline: search directory, select a startup. | Startup added in "Applied" stage. | P1 |
| INC-22 | Move startup through stages: Applied → Screening → Interview → Selected → Graduated. | Stage updates correctly at each step. | P1 |
| INC-23 | Move a startup to "Rejected". | Startup shown in Rejected column. | P1 |
| INC-24 | Remove a startup from pipeline. | Startup removed from program. | P2 |

### 9.4 Milestones

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-30 | View Milestones tab on a program. | Auto-generated milestones visible (e.g., Orientation, Mid-Program Review, Demo Day, Graduation). | P1 |
| INC-31 | Toggle milestone completion. | Status updates. Progress bar reflects change. | P1 |
| INC-32 | Add a custom milestone. Edit it. Delete it. | CRUD operations work. | P2 |

### 9.5 Mentor Pool & Assignments

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-40 | Navigate to Mentor Pool (`/dashboard/incubator/mentors`). | Mentor pool list loads. | P1 |
| INC-41 | Add a mentor to pool: search directory for mentor-type users, select one. Add expertise, hourly_rate. | Mentor added to pool. | P1 |
| INC-42 | On program detail, Mentors tab: Assign a mentor to a startup in the pipeline. | Assignment created. Mentor-startup link visible. | P1 |
| INC-43 | Update assignment status. Remove assignment. | CRUD operations work. | P2 |

### 9.6 Portfolio Health (Phase 16B.4)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-50 | On program detail, click Portfolio Health tab. | Portfolio Health dashboard loads: KPI cards, radar chart, at-risk callout, per-startup score strip. | P1 |
| INC-51 | Click "Add Evaluation" for a startup. Fill 8 vectors (1-5 each) + checkpoint (Entry/Mid-program/Demo Day/Graduation). Save. | Evaluation saved. Overall auto-computed. Radar chart updates. | P1 |
| INC-52 | Add a second evaluation for the same startup (different checkpoint). | Both evaluations listed. Radar shows overlay (current vs previous). Trend view available. | P2 |
| INC-53 | Verify at-risk detection: create evaluation with overall < 3. | Startup flagged as "At Risk" in callout. | P2 |

### 9.7 Service Partners

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| INC-60 | Navigate to Service Partners (`/dashboard/program/service-partners`). | Service partners list loads. Demo: CloudBoost Services visible. | P1 |
| INC-61 | Click "Add Partner". Search directory for service providers. Select one. | Directory picker modal shows SP-type users with "already_added" flag. | P1 |
| INC-62 | Fill partner details: service_category, perk_description, perk_value, currency. Save. | Partner linked. Card appears in grid. | P1 |
| INC-63 | Edit partner. Delete partner. | CRUD operations work. | P2 |

---

## 10. TC-ACC: Accelerator Persona

**Login as:** accelerator@demo.openi.ai / Demo@123 / MFA: 123456

### 10.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-01 | Navigate to dashboard. | Accelerator dashboard shows: batch count, pipeline stats, demo day stats, partner count. | P0 |

### 10.2 Batches

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-10 | Navigate to Batches (`/dashboard/accelerator/batches`). | Batch list loads. Demo: "JFS Accelerator Batch 7 FinTech" visible. | P0 |
| ACC-11 | Create a new batch: name, focus_area, duration_weeks, investment_amount, currency, equity_percentage, start_date, end_date. Submit. | Batch created. 7 auto-seeded milestones generated. | P0 |
| ACC-12 | Click on a batch to view detail. | Batch detail page with tabs: Pipeline, Milestones, Portfolio Health. | P0 |
| ACC-13 | Edit batch: change investment_amount, equity. Save. | Changes saved. | P1 |
| ACC-14 | Delete a batch. | Batch removed. | P2 |

### 10.3 Startup Pipeline (with pitch_order + traction_metrics)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-20 | View Pipeline tab on batch detail. | Kanban with stages: Applied, Screening, Interview, Selected, Graduated, Rejected/Dropped. | P0 |
| ACC-21 | Add a startup to pipeline. | Startup added. | P1 |
| ACC-22 | Update pitch_order for a startup. | Pitch order saved and displayed. | P2 |
| ACC-23 | Update traction_metrics for a startup. | Traction metrics saved. | P2 |
| ACC-24 | Move startup through all stages. | Stage progression works. | P1 |

### 10.4 Demo Days

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-30 | Navigate to Partners & Network tab. Click Demo Days tab. | Demo day list loads. | P1 |
| ACC-31 | Create a demo day: event_name, date, venue, max_investors, investors_invited. Submit. | Demo day created. | P1 |
| ACC-32 | Update demo day: add investors_attended, deals_closed, funding_raised. | Stats updated. | P2 |
| ACC-33 | Delete a demo day. | Demo day removed. | P2 |

### 10.5 Corporate Partners & Investor Network

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-40 | View Corporate Partners tab. | Partner list loads. Demo: HDFC Bank, Razorpay, AWS visible. | P1 |
| ACC-41 | Add a corporate partner: company_name, type, description, investment_amount, currency. | Partner created. | P1 |
| ACC-42 | View Investor Network tab. | Investor list loads. Demo: Peak XV, Blume, Mumbai Angels visible. | P1 |
| ACC-43 | Add an investor to network: name, firm, type, check_size, currency. | Investor added. | P1 |
| ACC-44 | Edit/delete partners and investors. | CRUD operations work. | P2 |

### 10.6 Batch Milestones & Portfolio Health

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-50 | View Milestones tab. | 7 auto-seeded milestones visible. Toggle completion works. | P1 |
| ACC-51 | View Portfolio Health tab. | Portfolio health dashboard loads (same component as incubator). Radar chart, at-risk, trend. | P1 |
| ACC-52 | Add evaluation for a batch startup. | Evaluation saved. Dashboard updates. | P1 |

### 10.7 Service Partners

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACC-60 | Navigate to Service Partners. Verify same page as incubator but header says "Batch Service Partners". | Header text differs by persona. Functionality identical. | P1 |

---

## 11. TC-MENT: Mentor Persona

**Login as:** mentor@demo.openi.ai / Demo@123 / MFA: 123456

### 11.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| MENT-01 | Navigate to dashboard. | Mentor dashboard shows: session count, mentee count, availability status, expertise areas. | P0 |

### 11.2 Sessions (Phase 16D)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| MENT-10 | Navigate to Sessions (`/dashboard/mentor/sessions`). | Session list loads. | P0 |
| MENT-11 | Create a new session: mentee (search), topic, date, duration, meeting_link. Submit. | Session created. | P1 |
| MENT-12 | Edit a session: change date, add notes. Save. | Changes saved. | P1 |
| MENT-13 | Delete a session. | Session removed. | P2 |
| MENT-14 | View completed sessions vs upcoming sessions. | Sessions organized by status/date. | P2 |

### 11.3 Availability (Phase 16D)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| MENT-20 | Navigate to Availability (`/dashboard/mentor/availability`). | Availability settings load. | P1 |
| MENT-21 | Set availability slots: day_of_week, start_time, end_time. Save. | Availability saved. | P1 |
| MENT-22 | Clear all availability. Save. | Availability cleared. | P2 |

### 11.4 Other Nav Items

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| MENT-30 | Navigate to Startup Discovery. Search for startups. | Results load. | P2 |
| MENT-31 | Navigate to Projects. | Project list loads. | P2 |
| MENT-32 | Navigate to Feedback. Submit feedback. | Feedback submitted. | P2 |

---

## 12. TC-LAB: Lab Persona

**Login as:** lab@demo.openi.ai / Demo@123 / MFA: 123456

### 12.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LAB-01 | Navigate to dashboard. | Lab dashboard shows: equipment count, active bookings, publications count, project count. | P0 |

### 12.2 Equipment (Phase 16E)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LAB-10 | Navigate to Equipment (`/dashboard/lab/equipment`). | Equipment catalog loads. | P0 |
| LAB-11 | Add equipment: name, description, type, status (available/in-use/maintenance), hourly_rate, currency. Submit. | Equipment created. | P1 |
| LAB-12 | Edit equipment: change status, update rate. Save. | Changes saved. | P1 |
| LAB-13 | Delete equipment. | Equipment removed. | P2 |

### 12.3 Bookings (Phase 16E)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LAB-20 | View Bookings tab. | Booking list loads. | P1 |
| LAB-21 | Create a booking: select equipment, requester info, start_date, end_date, purpose. Submit. | Booking created. | P1 |
| LAB-22 | Update booking status (approve/reject). | Status updated. | P1 |

### 12.4 Publications (Phase 16E)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LAB-30 | Navigate to Publications (`/dashboard/lab/publications`). | Publication list loads. | P1 |
| LAB-31 | Add a publication: title, authors, journal, DOI, publication_date. Submit. | Publication created. | P1 |
| LAB-32 | Delete a publication. | Publication removed. | P2 |

---

## 13. TC-SP: Service Provider Persona

**Login as:** serviceprovider@demo.openi.ai / Demo@123 / MFA: 123456

### 13.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SP-01 | Navigate to dashboard. | SP dashboard shows: services offered count, certifications count, client connections, reviews. | P0 |

### 13.2 Services (Phase 16C)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SP-10 | Navigate to Services (`/dashboard/sp/services`). | Services tab active. Service catalog loads. | P0 |
| SP-11 | Create a service: title, description, category (from 12 categories), pricing_type, price, currency. Submit. | Service created. | P1 |
| SP-12 | Edit a service: change price, update description. Save. | Changes saved. | P1 |
| SP-13 | Delete a service. | Service removed. | P2 |

### 13.3 Clients (Phase 16C)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SP-20 | Click Clients tab. | Client list loads. | P1 |
| SP-21 | Add a client: company_name, sector, project_description, start_date, status. Submit. | Client created. | P1 |
| SP-22 | Edit a client. Delete a client. | CRUD works. | P2 |

### 13.4 Reviews (Phase 16C)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SP-30 | Click Reviews tab. | Reviews list loads (reviews FROM other users about this SP). | P1 |
| SP-31 | Login as a different user (e.g., startup). Navigate to SP's directory listing. Submit a review (rating 1-5, comment). | Review created. Visible on SP's reviews tab. | P2 |

---

## 14. TC-STU: Student Persona

**Login as:** student@demo.openi.ai / Demo@123 / MFA: 123456

### 14.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STU-01 | Navigate to dashboard. | Student dashboard shows: stat cards (matches, applications, meetings), quick actions, recommendations. | P0 |

### 14.2 Profile

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STU-10 | Navigate to Profile. Verify student-specific fields: institution, degree, graduation_year, skills, research_interests. | Student profile fields visible (different from startup fields). | P1 |
| STU-11 | Edit profile fields. Save. | Fields saved correctly. | P1 |

### 14.3 Navigation

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| STU-20 | Verify student nav sidebar contains: Dashboard, Marketplace, Mentors, Directory, Meetings, Events, Knowledge, Documents, Network, Features, What's New, Settings. | All nav items present and navigable. | P1 |
| STU-21 | Navigate to Mentors page. | Mentors directory loads. Can search/filter mentors. | P1 |
| STU-22 | Navigate to Marketplace. Browse challenges. Apply to one. | Application flow works same as startup. | P1 |

---

## 15. TC-ACAD: Academia Persona

**Login as:** academia@demo.openi.ai / Demo@123 / MFA: 123456

### 15.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACAD-01 | Navigate to dashboard. | Academia dashboard shows: stat cards, quick actions, recommendations. | P0 |

### 15.2 Profile

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACAD-10 | Navigate to Profile. Verify academia-specific fields: institution, department, designation, research_areas, publications_count. | Academia profile fields visible. | P1 |
| ACAD-11 | Edit profile fields. Save. | Fields saved. | P1 |

### 15.3 Navigation

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ACAD-20 | Verify academia nav contains: Dashboard, Marketplace, Mentors, Startup Discovery, Directory, Meetings, Events, Knowledge, Documents, Network, Features, What's New, Settings. | All nav items present and navigable. | P1 |
| ACAD-21 | Navigate to Startup Discovery. Search for startups. | Results load. | P1 |

---

## 16. TC-GOVT: Government Persona

**Login as:** govt@demo.openi.ai / Demo@123 / MFA: 123456

### 16.1 Dashboard

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| GOVT-01 | Navigate to dashboard. | Government dashboard shows: 5 stat cards (startups tracked, total funding, deeptech count, active programs, unicorn candidates) + 6 quick actions. | P0 |

### 16.2 Impact Analytics

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| GOVT-10 | Verify dashboard shows sector/stage/city/state breakdowns. | Impact analytics sections visible with data. | P1 |

### 16.3 Challenges/RFPs

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| GOVT-20 | Navigate to Challenges/RFPs (`/dashboard/corporate/challenges`). | Challenge management page loads (shared with corporate). | P1 |
| GOVT-21 | Create a challenge/RFP. | Challenge created successfully (government uses corporate challenge system). | P1 |

### 16.4 Other Nav Items

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| GOVT-30 | Navigate to Startup Discovery. | Results load. | P1 |
| GOVT-31 | Navigate to Watchlist. Add a startup to watchlist. | Startup added. Visible in watchlist. | P1 |
| GOVT-32 | Navigate to Evaluations. | Evaluation page loads. | P2 |
| GOVT-33 | Navigate to Cohorts. | Cohort page loads. | P2 |
| GOVT-34 | Navigate to Projects. | Project page loads. | P2 |
| GOVT-35 | Navigate to Govt API Integrations. | Integration page loads. | P2 |

---

## 17. TC-SRCH: Search & Discovery

### 17.1 Global Search (Public)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SRCH-01 | Navigate to `/search` (no login required). | Global search page loads with search bar, mode toggles, tabs (All/Challenges/Startups/People). | P0 |
| SRCH-02 | Type "supply chain" in keyword mode. Press enter. | Results appear across All tab. Challenges, startups, and people with "supply chain" shown. Relevance ranking applied. | P0 |
| SRCH-03 | Click "Challenges" tab. | Only challenge results shown. | P1 |
| SRCH-04 | Click "Startups" tab. | Only startup results shown. | P1 |
| SRCH-05 | Click "People" tab. | Only directory profile results shown. | P1 |

### 17.2 Semantic Search

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SRCH-10 | Toggle to "Semantic" mode. Search for "companies building smart factory solutions". | Results returned via pgvector cosine similarity. Results may include entities that don't literally contain the search words but are semantically related. | P1 |
| SRCH-11 | Verify semantic search requires Pro/Enterprise tier. Login as Free-tier user. Try semantic toggle. | UpgradeCTA or feature gate message shown. Semantic search blocked for Free tier. | P1 |

### 17.3 AI Ask (Natural Language)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SRCH-20 | Toggle to "AI" mode (brain icon). Search for "early-stage deeptech healthcare startups in Bangalore". | InterpretationBanner shows: intent=startups, filters (sector=Healthcare, city=Bangalore, is_deeptech=true), confidence %, keywords. Results filtered accordingly. | P0 |
| SRCH-21 | Search "cybersecurity challenges for partnership". | InterpretationBanner: intent=challenges, sector=Cybersecurity, challenge_type=partner. Results filtered. | P1 |
| SRCH-22 | Search "investors in fintech". | InterpretationBanner: intent=directory, sector=FinTech, persona_type=investor. People tab auto-selected. | P1 |
| SRCH-23 | Search a vague term like "innovation". | Low confidence shown. Fallback to keywords-only FTS. Banner shows fallback_used indicator. | P1 |
| SRCH-24 | Search gibberish "xyzzy quux blurb". | Cascade fallback: AI → keywords → semantic. Banner shows fallback_used=semantic. Some loosely related results or empty. | P2 |
| SRCH-25 | Repeat the same AI search query. Verify "cached: true" indicator (response cache hit). | Second query returns faster. Interpretation identical. | P2 |
| SRCH-26 | Verify AI search requires Pro/Enterprise. Login as Free-tier user. Try AI toggle. | Feature gate blocks AI search for Free tier. UpgradeCTA shown. | P1 |

### 17.4 Autocomplete

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SRCH-30 | Type in search bar. After debounce, autocomplete suggestions appear. | Suggestions from taxonomy (sectors, technologies) and entity names. Up to 8 results. | P1 |
| SRCH-31 | Click a suggestion. | Search executed with that term. | P2 |

---

## 18. TC-DIR: Directory & Connections

### 18.1 Directory

**Login as any demo account.**

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| DIR-01 | Navigate to Directory (`/dashboard/directory`). | Directory loads with user cards, search bar, filters (persona type, city, sector, skill), sort dropdown. | P0 |
| DIR-02 | Search for "deeptech". | Results filtered by FTS. Relevance ranking applied. | P1 |
| DIR-03 | Filter by persona_type: "investor". | Only investor profiles shown. | P1 |
| DIR-04 | Filter by city: "Mumbai". | Only users in Mumbai shown. | P2 |
| DIR-05 | Sort by "Name A-Z", "Newest", "Relevance". | Sort order changes correctly. | P2 |
| DIR-06 | Click persona_type facet chips. | Results filter to clicked type. | P2 |
| DIR-07 | Click on a user card. | UserProfile page loads (`/dashboard/profile/:id`) with profile details + ConnectButton + MutualConnectionsBadge. | P1 |

### 18.2 Connections (Phase 18)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| DIR-10 | Navigate to My Network (`/dashboard/network`). | Network page loads: connection tabs (All / Incoming / Outgoing), connection count, search. | P0 |
| DIR-11 | On a UserProfile page, click "Connect" button. Select relationship_type (colleague/advisor/investor/partner/mentor/other). | Connection request sent. Button changes to "Pending". | P0 |
| DIR-12 | Login as the recipient. Navigate to My Network → Incoming tab. | Incoming connection request visible from sender. | P0 |
| DIR-13 | Accept the connection request. | Connection established. Both users see each other in "All" tab. | P0 |
| DIR-14 | Decline a connection request. | Request removed. Sender sees status changed. | P1 |
| DIR-15 | Withdraw a pending outgoing request. | Request removed from outgoing tab. | P1 |
| DIR-16 | Remove an existing connection. | Connection removed from both users' networks. | P1 |
| DIR-17 | View mutual connections on a user's profile. | MutualConnectionsBadge shows count of shared connections. | P2 |
| DIR-18 | Verify connection count badge on nav item. | Network nav shows unread/pending count badge. | P2 |
| DIR-19 | Block a user. | User blocked. Cannot send connection requests to you. | P2 |
| DIR-20 | Verify 50/day rate limit on connection requests. (Test by verifying the limit exists conceptually — do not actually send 50.) | After 50 requests/day, subsequent requests return rate limit error. | P3 |

### 18.3 ContextualTip (Phase 22)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| DIR-25 | Visit Directory for the first time (clear localStorage). | ContextualTip tooltip appears with helpful hint (e.g., "Use filters to narrow results"). | P2 |
| DIR-26 | Dismiss the tip. Revisit Directory. | Tip does NOT appear again (localStorage stores seen state). | P2 |

---

## 19. TC-LIC: Licensing & Billing

### 19.1 Plan Display

**Login as any demo account.**

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LIC-01 | Navigate to Settings (`/dashboard/settings`). Click Billing tab. | Current plan displayed (Free/Pro/Enterprise). Plan comparison cards visible. | P0 |
| LIC-02 | Verify Free tier shows: 1 challenge, 3 applications, 5 meetings, 5 uploads. AI/Portfolio/Deals locked. | Feature limits correct per Free tier. | P0 |
| LIC-03 | Verify Pro tier shows: 5 challenges, 20 applications, 50 meetings, 100 uploads, AI Ask 50/day, semantic search, 8-vector evaluation, portfolio health, deal pipeline. | Feature limits correct per Pro tier. | P1 |
| LIC-04 | Verify Enterprise tier shows: unlimited everything + multi-currency + service partners + SSO + audit logs. | Feature limits correct per Enterprise tier. | P1 |

### 19.2 Usage Tracking

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LIC-10 | On Settings Billing tab, verify usage meters show current usage vs limit. | Meters display: challenges used/limit, applications used/limit, meetings used/limit, uploads used/limit. | P1 |
| LIC-11 | (Pro/Enterprise user) Verify AI Ask quota display: "AI Ask: X/50 today" or "unlimited". | Quota shown with today's usage count. | P1 |

### 19.3 Feature Access Gating (Phase 19)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LIC-20 | As Free-tier user, try to access AI Search (toggle AI mode in search). | UpgradeCTA component shown instead of results. "Upgrade to Pro for AI Search" or similar message. | P0 |
| LIC-21 | As Free-tier user, try to access Semantic Search. | Feature gated. UpgradeCTA shown. | P1 |
| LIC-22 | As Free-tier incubator/accelerator, try to access Portfolio Health tab. | Tab shows UpgradeCTA instead of dashboard. | P1 |
| LIC-23 | As Free-tier investor, try to access Deal Pipeline. | Feature gated. UpgradeCTA shown. | P1 |
| LIC-24 | As Free-tier user, try to add Service Partners. | Feature gated. UpgradeCTA shown. | P2 |
| LIC-25 | As Free-tier user, try to create more challenges than limit (1). | After 1 challenge, next attempt returns usage limit error. | P1 |
| LIC-26 | As Free-tier user, try to submit more applications than limit (3). | After 3 applications, next attempt returns usage limit error. | P1 |

### 19.4 Razorpay Checkout

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LIC-30 | Click "Upgrade to Pro" button. | Razorpay checkout modal opens with plan details (INR 999/mo). | P0 |
| LIC-31 | Complete payment with test card. | Payment verified. User plan updated to Pro. Success message. Payment history entry created. | P0 |
| LIC-32 | After upgrade, verify previously-gated features are now accessible. | AI Search, semantic search, deal pipeline, portfolio health all work. | P1 |
| LIC-33 | Download invoice for a payment. | PDF invoice downloads with OpenI branding. | P1 |
| LIC-34 | Cancel subscription. | Subscription cancelled. Downgraded to Free at period end. Cancellation email sent. | P1 |

### 19.5 Feature Access API

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| LIC-40 | GET `/api/subscription/feature-access`. | Returns full feature map for current tier: ai_search_daily_cap, can_access_portfolio_health, can_access_deal_pipeline, etc. + current usage. | P1 |
| LIC-41 | (Pro user) Verify ai_consumption in response: queries, tokens, cost this month. | AI consumption metrics returned. | P2 |

---

## 20. TC-PUB: Public Pages

### 20.1 Landing Page

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PUB-01 | Navigate to `/landing` (no auth). | Landing page loads: Hero, Features grid (12 cards), Pricing (3 tiers), Testimonials (3), FAQs (7), Persona picker. | P0 |
| PUB-02 | Verify hero subheadline mentions: 11 personas, AI-powered, plain English, 8-vector, portfolio health. | Updated hero copy from Phase 17. | P1 |
| PUB-03 | Verify features grid has 12 cards including: AI Ask, Semantic Search, Rich Startup Profiles, Investor Deal Pipeline, Portfolio Health, Service Partner Network, Multi-Currency. | All 12 feature cards present with icons. | P1 |
| PUB-04 | Verify pricing cards: Free (locked AI/Portfolio/Deal badges), Pro (INR 999/mo, AI Ask 50/day, semantic search), Enterprise (INR 4,999/mo, unlimited). | Pricing reflects Phase 17 rehash. | P0 |
| PUB-05 | Click "Get Started" on a pricing card. | Redirects to `/register` (or register with plan pre-selected). | P1 |
| PUB-06 | Verify testimonials display 3 quotes about AI Ask, deal pipeline, portfolio health. | Phase 17 testimonial content. | P2 |
| PUB-07 | Expand FAQs. Verify 7 items including AI Ask, portfolio health, multi-currency. | FAQs expandable. Content accurate. | P2 |
| PUB-08 | Verify persona picker grid shows all 11 types. Click one. | Redirects to `/register?type=<persona>`. | P1 |
| PUB-09 | Verify platform stats: "11 Persona Types", "228+ API Endpoints", "AI Semantic Search", "8-Vector Evaluation Framework". | Stats reflect Phase 17 platform-capability numbers (not ecosystem numbers). | P2 |
| PUB-10 | Verify CMS-driven content loads (or fallback defaults if CMS down). | Content loads. If CMS is slow/down, hardcoded defaults render instantly. | P1 |

### 20.2 Public Marketplace

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PUB-20 | Navigate to `/marketplace` (no auth). | Public marketplace loads with open challenges. Search bar and filters visible. | P0 |
| PUB-21 | Search for a challenge keyword. | Results filtered. FTS works. | P1 |
| PUB-22 | Click a challenge for details. | Public challenge detail page loads with title, description, requirements, sector. | P1 |
| PUB-23 | Verify "Apply" button prompts login (since user is not authenticated). | Redirect to login or prompt to register. | P1 |

### 20.3 Public Reports

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PUB-30 | Navigate to `/reports` (no auth). | Reports page loads with 16 sector reports from openi.ai/insights. | P0 |
| PUB-31 | Click a report. | External link opens to openi.ai/insights report. | P1 |
| PUB-32 | Click "Download PDF" on a report. | PDF downloads with OpenI branding. | P2 |

### 20.4 Shared Challenge

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PUB-40 | Access a shared challenge URL: `/challenges/share/<token>`. | SharedChallenge page loads with challenge details. No auth required. | P1 |
| PUB-41 | Access an invalid share token. | 404 or "Challenge not found" error page. | P2 |

### 20.5 SearchBar in Public Layout

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| PUB-50 | On Landing page, verify SearchBar is visible in the header. | SearchBar with mode toggles (keyword/semantic/AI) in PublicLayout header. | P1 |
| PUB-51 | Type a search query in the header SearchBar. Press enter. | Redirects to `/search` with query pre-filled and mode preserved. | P1 |

---

## 21. TC-SET: Settings

**Login as any demo account.**

### 21.1 General Settings

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SET-01 | Navigate to Settings (`/dashboard/settings`). | Settings page loads with tabs: Account, Billing, etc. | P0 |
| SET-02 | Change password: enter current password, new password, confirm. Submit. | Password changed. Success message. Can login with new password. | P1 |
| SET-03 | Try to change password with wrong current password. | Error: "Current password incorrect" or similar. | P1 |

### 21.2 Preferred Currency (Phase 16B.2)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SET-10 | On Profile/Account section, find "Preferred Currency" selector. | Dropdown with INR and USD options. | P1 |
| SET-11 | Change preferred currency from INR to USD. Save. | Preference saved. Reflected in auth context. Currency-formatted displays update. | P1 |

### 21.3 Billing Tab

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SET-20 | Click Billing tab. | Plan display, usage meters, plan comparison, payment history. | P0 |
| SET-21 | Verify usage meters reflect actual usage. | Meters show correct counts (challenges, applications, meetings, uploads used vs limit). | P1 |
| SET-22 | (Pro/Enterprise) Verify AI Usage card shows: queries this month, tokens consumed, estimated cost. | AI usage metrics displayed correctly. | P2 |

### 21.4 Organization (Phase 21)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SET-30 | Navigate to Organization (`/dashboard/organization`). | OrgAdmin page loads. Org details + member list. | P1 |
| SET-31 | (Org admin) Invite a new member: enter email, select role. | Invitation sent. Member appears in list as "invited". | P1 |
| SET-32 | (Org admin) Change a member's role. | Role updated. | P2 |
| SET-33 | (Org admin) Remove a member. | Member removed from org. | P2 |
| SET-34 | Verify seat usage: "X of Y seats used" display. | Seat count accurate vs org license. | P1 |

---

## 22. TC-ADMIN: Admin Features

**Login as:** admin@drdo.gov.in / Admin@123

### 22.1 Analytics Dashboard (Phase 24)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ADM-01 | Navigate to Admin Analytics (`/dashboard/admin/analytics`). | Analytics dashboard loads: overview cards, time-series chart, persona breakdown pie chart, conversion funnel bar chart, feature adoption bar chart. | P0 |
| ADM-02 | Verify overview cards show: total users, active users (30d), total challenges, total applications. | Numbers populated from DB. | P1 |
| ADM-03 | Verify time-series chart (Recharts line chart) shows registrations/logins over time. | Line chart renders with date-based x-axis. | P1 |
| ADM-04 | Verify persona breakdown pie chart shows distribution across 11 persona types. | Pie chart renders. Slices labeled. | P1 |
| ADM-05 | Verify conversion funnel: registered → profile_complete → first_action → active. | Funnel bar chart renders with decreasing bars. | P1 |
| ADM-06 | Verify feature adoption chart: which features are most used. | Bar chart with feature names and usage counts. | P2 |

### 22.2 AI Telemetry (Phase 25)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ADM-10 | On Admin Analytics, verify AI Telemetry section: summary stats (total queries, avg tokens, total cost, error rate), daily usage chart, top users table, queries by type breakdown. | AI telemetry data rendered. | P1 |
| ADM-11 | Verify daily usage chart shows AI query count over time. | Chart renders with date axis. | P2 |
| ADM-12 | Verify top users table shows: user, query count, tokens, cost. | Table populated. | P2 |

### 22.3 Onboarding Funnel (Phase 20)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ADM-20 | GET `/api/onboarding/admin/funnel` (or view in admin UI). | Funnel data returned: completion rates per persona, drop-off points. | P2 |

### 22.4 CMS Seed (Admin)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ADM-30 | POST `/api/admin/seed-cms` (admin only). | CMS re-seeded. Testimonials, FAQs, pricing, landing page content updated. | P3 |

### 22.5 Organization License Management (Phase 21)

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| ADM-40 | POST `/api/org/admin/create-license` — create org license. | Organization license created. | P1 |
| ADM-41 | GET `/api/org/admin/list` — list all organizations. | All orgs returned with seat counts and plan info. | P1 |

---

## 23. TC-EDGE: Edge Cases & Error Handling

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| EDGE-01 | Access a protected route without auth token (e.g., GET `/api/profile/me` with no header). | 401 Unauthorized response. | P0 |
| EDGE-02 | Access an admin-only route as non-admin (e.g., GET `/api/audit`). | 403 Forbidden response. | P0 |
| EDGE-03 | Send a malformed JSON body to a POST endpoint. | 400 Bad Request. Graceful error message. | P1 |
| EDGE-04 | Access a non-existent route (e.g., `/api/nonexistent`). | 404 Not Found. | P1 |
| EDGE-05 | Try to create a resource that violates unique constraints (e.g., duplicate email). | DB constraint error caught. Meaningful error message returned. No crash. | P1 |
| EDGE-06 | Upload a file larger than the allowed size. | Error: "File too large" or similar. Upload rejected. | P2 |
| EDGE-07 | Upload a non-allowed file type (e.g., .exe). | Error: "Invalid file type" or similar. Upload rejected. | P2 |
| EDGE-08 | Try to access another user's private data (e.g., GET another user's profile edit endpoint). | 403 or ownership check prevents access. | P0 |
| EDGE-09 | Rapidly send multiple requests to rate-limited endpoint (AI search). | After rate limit hit (20/min/IP), 429 Too Many Requests returned. | P1 |
| EDGE-10 | Test with expired JWT token. | 401 Unauthorized. User prompted to re-login. | P0 |
| EDGE-11 | Test XSS: submit `<script>alert('xss')</script>` as a profile field. | Script not executed. Input sanitized or escaped in display. | P0 |
| EDGE-12 | Test SQL injection: submit `'; DROP TABLE users;--` as input. | Input parameterized. No SQL injection. DB unaffected. | P0 |
| EDGE-13 | Stress test: Open multiple browser tabs logged in as same user. Perform actions in parallel. | No data corruption. Sessions handled correctly. | P2 |
| EDGE-14 | Test with CMS (Strapi) down/unreachable. | Landing page and public pages render with hardcoded fallback defaults. No error screen. | P1 |
| EDGE-15 | Test mobile responsiveness: Open frontend on mobile viewport (375px width). | Pages render correctly. Nav collapses to hamburger menu. Forms usable. | P1 |

---

## 24. Known Issues & Limitations

| Issue | Description | Workaround |
|-------|-------------|------------|
| **Railway SMTP blocked** | Railway blocks ports 25/465/587. SMTP-based email sending fails on Railway. | Resend REST API (HTTPS port 443) is the primary email transport. SMTP is fallback for local dev only. |
| **lucide-react v0.294** | Does not include `Handshake` or `LinkedIn`/`X` (Twitter) icons. | `Link2` icon used for Service Partners. Inline SVGs (`LinkedInIcon`, `XIcon`) used for social icons. |
| **CMS fallback** | If Strapi CMS is slow or down (5s timeout), landing page sections fall back to hardcoded defaults. | Acceptable behavior. CMS is optional enhancement. |
| **Cloudinary dependency** | File uploads require Cloudinary env vars. If not set, uploads fail with 500. | Ensure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are set on Railway. |
| **OpenAI API dependency** | AI search and semantic search require `OPENAI_API_KEY`. If not set or invalid, AI features return errors. | Ensure API key is valid and set on Railway. Cost: ~$0.0003/query. |
| **MFA hardcoded for demo** | Demo accounts all use MFA code `123456`. This is for testing convenience only. | Production accounts should use proper TOTP app-based MFA. |
| **No real-time updates** | Platform uses REST API polling. No WebSocket/SSE for live updates. | Refresh page to see latest data. |
| **Single currency per amount** | Each monetary field stores its own currency. No FX conversion. | Users see amounts in their entered currency. No conversion to preferred currency. |

---

## 25. Support & Escalation

| Channel | Contact |
|---------|---------|
| **Website** | https://openi.ai |
| **Email** | OpenIhub@openi.ai |
| **LinkedIn** | https://www.linkedin.com/company/openi-partners/ |
| **X (Twitter)** | https://x.com/OpenIPartners |
| **GitHub (Frontend)** | https://github.com/RajeevBanduni/openi-hub |
| **GitHub (Backend)** | https://github.com/RajeevBanduni/openi-hub-backend |
| **GitHub (CMS)** | https://github.com/RajeevBanduni/openi-hub-cms |

---

## 26. Feature Discovery & Changelog (Phase 22)

### 26.1 Feature Map

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| FEAT-01 | Navigate to Features (`/dashboard/features`). | FeatureMap page loads: interactive grid of 28+ features, each with tier badge (Free/Pro/Enterprise), descriptions. | P1 |
| FEAT-02 | Verify tier badges are plan-aware: Free-tier user sees Pro/Enterprise features as "locked". | Locked features show upgrade indicator. Unlocked features for current tier are highlighted. | P1 |
| FEAT-03 | Click on a feature card. | Feature detail or tooltip expands with description, tier info, link to relevant page. | P2 |

### 26.2 What's New

| ID | Test | Expected | Priority |
|----|------|----------|----------|
| FEAT-10 | Navigate to What's New (`/dashboard/whats-new`). | Changelog page loads with 5 release entries. | P1 |
| FEAT-11 | Verify each release entry has: version/date, title, list of changes. | Entries formatted with clear release notes. | P2 |

---

## Appendix A: API Endpoint Quick Reference

### Public (No Auth)
- `GET /api/public/challenges` — list open challenges
- `GET /api/public/challenges/:id` — challenge detail
- `GET /api/public/challenges/share/:token` — shared private challenge
- `GET /api/public/reports` — sector reports
- `GET /api/public/reports/:id/pdf` — download report PDF
- `GET /api/public/stats` — platform stats
- `GET /api/public/landing-content` — CMS landing content
- `GET /api/public/taxonomy` — taxonomy (5 types, 856+ entries)
- `GET /api/public/search` — global FTS search
- `GET /api/public/search/suggest` — autocomplete
- `GET /api/public/search/semantic` — pgvector semantic search (Pro+)
- `GET /api/public/search/ai` — AI natural language search (Pro+)

### Auth
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login (returns JWT)
- `GET /api/auth/me` — current user
- `PUT /api/auth/change-password` — change password
- `PUT /api/auth/profile` — update profile (name, preferred_currency)

### Subscription
- `GET /api/subscription/plans` — list plans
- `GET /api/subscription/feature-access` — feature map for current tier
- `GET /api/subscription/my-plan` — current plan details
- `POST /api/subscription/create-order` — Razorpay order
- `POST /api/subscription/verify-payment` — verify Razorpay payment
- `POST /api/subscription/cancel` — cancel subscription
- `GET /api/subscription/invoice/:paymentId` — download invoice PDF

### Admin
- `GET /api/admin/analytics/overview` — analytics overview
- `GET /api/admin/analytics/timeseries` — time-series data
- `GET /api/admin/analytics/personas` — persona breakdown
- `GET /api/admin/analytics/funnel` — conversion funnel
- `GET /api/admin/analytics/feature-adoption` — feature adoption
- `GET /api/admin/analytics/ai-telemetry` — AI usage telemetry
- `POST /api/admin/seed-cms` — re-seed CMS content

---

*End of Testing Guide v2.0*
