# Investor Persona — End-to-End Testing Guide

> For the testing team. No code knowledge required.
> Written 29 Jun 2026. Reflects live code on `api.openi.ai` / `openi.ai`.
> Goal: rigorously test **every** Investor-persona module, happy paths + edge cases.

---

## 0. How to use this guide

1. Read §1 to understand what an Investor account does on the platform.
2. Do the **one-time setup** in §3 (create the test accounts you'll need).
3. Work through the scenarios in §5 **in order** — later scenarios reuse data from earlier ones.
4. Record each result in the §6 pass/fail checklist.
5. If something fails, capture: the URL, what you clicked, what you expected, what happened, and a screenshot. §7 lists the most common "is it really a bug?" gotchas to rule out first.

**Environment:** test on production `https://openi.ai` (frontend) → `https://api.openi.ai` (backend) unless told otherwise.

**Browser hygiene (important):** OpenI Hub is a single-page app served via Vercel. After any deploy, an open tab may run an **old bundle**. Before reporting a UI bug, do a hard reload (`Cmd/Ctrl + Shift + R`) or open DevTools → Network → "Disable cache". A surprising number of "button does nothing" reports are stale-bundle, not real bugs.

---

## 1. What the Investor persona is (plain English)

An **Investor** (Angel, VC, PE, Family Office, fund) uses OpenI Hub to **find startups and run them through an investment process**. The persona has six working areas, plus profile/onboarding:

| Area | What it does |
|---|---|
| **My Profile** | Fund identity, thesis, ticket size, sectors, track record. This is also what startups see when they discover the investor. |
| **Recommended for You** | AI-matched startups based on the investor's sectors / stage / thesis. |
| **My Deal Sourcing** | "Calls for applications" — the investor publishes what they're looking for; startups apply. Includes a **Deal Team** (co-reviewers), **Applicant Invites** (invite startups directly), and **Reviews**. |
| **Deal Pipeline** | A private CRM of individual deals moving through stages (Sourced → Evaluating → LOI → Diligence → Term Sheet → Closed), each with an **8-vector evaluation**, **milestones**, and **tasks**. |
| **Portfolio** | Companies the investor has invested in — entry valuation, equity %, board seat, and exit tracking. |
| **Marketplace / Discover** | Browse other open opportunities, find startups, Innovation Map, DeepTech, IPR. |

There are two "directions" to remember:
- **Deal Sourcing (Module C)** = the investor *publishes a call*, startups *apply to the investor*.
- **Deal Pipeline (Module D)** = the investor's *own private tracking* of deals (no startup-facing surface). An applicant from a Deal Sourcing call can be **promoted** into the Pipeline.

---

## 2. Where each thing lives (URL map)

After logging in as the investor, the left sidebar (under **Persona actions**) shows:

| Sidebar label | URL | Module |
|---|---|---|
| My Dashboard | `/dashboard` | KPI summary |
| My Profile | `/dashboard/profile` | Module B |
| Recommended for You | `/dashboard/investor/recommended-startups` | Module G |
| View Marketplace | `/dashboard/marketplace` | Module H |
| My Deal Sourcing | `/dashboard/investor/deal-requests` | Module C |
| Deal Pipeline | `/dashboard/investor/deals` | Module D |
| Portfolio | `/dashboard/investor/portfolio` | Module E |
| DeepTech | `/dashboard/deeptech` | Discover (shared) |
| IPR Portfolio | `/dashboard/ipr` | Discover (shared) |
| Programs / 8-Vector Eval | `/dashboard/evaluations`, `/dashboard/evaluate` | Universal eval (shared) |

> **Note for testers:** "My Deal Sourcing" in the sidebar = the **Deal Requests** module in this doc. The two names are the same thing.

---

## 3. One-time test data setup

Create these accounts **before** starting. Use throwaway emails you control.

| # | Account | Persona | Why you need it |
|---|---|---|---|
| 1 | **Investor-A** | Investor | The primary account under test. |
| 2 | **Investor-B** | Investor | To verify self-exclusion (an investor should NOT see their own call in the public marketplace) and to be invited as a Deal-Team collaborator. |
| 3 | **Startup-X** | Startup | Applies to calls, gets promoted, appears in recommendations. |
| 4 | **Startup-Y** | Startup | A second applicant (for shortlist/reject/score testing). |
| 5 | **Startup-Z (email only, NOT registered)** | — | An email address with **no** OpenI account yet, to test the **magic-link email invite** path. Use a real inbox you can open. |

**To create each account:** go to `https://openi.ai` → Sign Up → pick the persona in Step 1 → fill the org name → complete the profile fields → verify email if prompted.

For **Investor-A**, fill the profile **completely** in §4 — recommendations and the public call card depend on it.

---

## 4. Module B — Registration & Profile

**Where:** Sign Up flow, then `/dashboard/profile`.

### Investor profile fields to exercise (all should save and reload)

Fund Identity: **Firm / Fund Name** (required), Fund Logo (upload), Investor Type (Angel/Seed/VC/PE/CVC/Family Office/HNI/Debt/Govt/Impact/Micro VC/Other), Investment Instruments (Equity/SAFE/Convertible Note/Debt/…), Fund Size, Total AUM, Available to Deploy, Fund Vintage Year.

Investment Focus: Investment Stages (Pre-seed → Pre-IPO), **Ticket Size** (min/max + currency), Focus Sectors (tags), Geographic Focus (tags), Looking For (multi-select), Investment Thesis (long text).

Track Record: Portfolio Companies (#), Total Investments Made (#), Notable Exits (tags), Follow-on Capacity (checkbox), Avg Response Time (0–365 days).

Team: Partner Names (tags), Co-Investor Preferences (text).

Location/Contact/Social: Country, State, City, Website, About the Fund, LinkedIn, Crunchbase.

### Tests

| ID | Step | Expected |
|---|---|---|
| B1 | Register as Investor; pick "Investor" persona. | Account created; lands in investor dashboard; sidebar shows Deal Sourcing / Deal Pipeline / Portfolio. |
| B2 | Open My Profile, fill every field, Save. | Toast "saved"; reload page → all values persist. |
| B3 | Upload a fund logo (small JPG/PNG). | Logo appears; persists after reload. |
| B4 | **Edge — file type:** upload a file named with dots in the name (e.g. `photo_2026.06.27_15.00.30.jpg`). | Accepted (recently fixed — must NOT error "this file type is not allowed"). |
| B5 | **Edge — file type:** try uploading a `.exe` or `.zip`. | Rejected with a clear message listing accepted types (images, PDF, Office docs, CSV). |
| B6 | Set Ticket Size currency to USD, save; switch to INR, save. | Currency persists per save; only INR/USD allowed. |
| B7 | Leave **Firm / Fund Name** blank, try to save. | Blocked — required field. |
| B8 | Enter Avg Response Time = 999. | Blocked / clamped (valid range 0–365). |

---

## 5. End-to-end scenarios

Work through these in order.

---

### Module C — Deal Sourcing (Deal Requests)

**Where:** sidebar **My Deal Sourcing** → `/dashboard/investor/deal-requests`.

**Status values:** `draft`, `open`, `reviewing`, `closed`, `filled`.
**Application status values:** `applied`, `shortlisted`, `evaluating`, `selected`, `rejected`.

#### Scenario C1 — Create & publish a call (happy path)
As **Investor-A**:
1. Click "Create" / "New Deal Sourcing".
2. Fill: Title (e.g. "DeepTech Seed — India"), Description, Investment Thesis, Target Stage (Seed), Ticket Size min/max + currency, Sectors (e.g. DeepTech, AI), Technologies, Geographic Focus, Deadline (future date), Max Applicants (e.g. 5), Requirements, set **Public = on**, Status = **open**.
3. Save.

**Expected:** call appears in the investor's list; applicant count = 0; it now has a `published_at` timestamp (it's live).

#### Scenario C2 — Edit & validation edges
| ID | Step | Expected |
|---|---|---|
| C2a | Edit the call, change title + add a sector, Save. | Updates persist. |
| C2b | Set Ticket min = 100, max = 50 (max < min). | Blocked — validation error. |
| C2c | Set Ticket min = -10. | Blocked — must be ≥ 0. |
| C2d | Set Max Applicants = 1 (for later cap test). | Saves. |

#### Scenario C3 — Public visibility & self-exclusion
1. Log in as **Investor-B** → go to Marketplace / browse open calls.
   **Expected:** Investor-A's "DeepTech Seed" call is visible.
2. Still as **Investor-A**, browse the public calls list.
   **Expected:** Investor-A does **NOT** see their own call (self-exclusion). ← key check.
3. Set the call to **Public = off** (or status `draft`); re-check as Investor-B.
   **Expected:** call disappears from the public list.

#### Scenario C4 — Startup applies
Re-open the call (Public on, status open). As **Startup-X**:
1. Find the call in Marketplace → open detail → Apply.
2. Add a pitch + optional proposal URL → submit.

**Expected:** success; Investor-A's call applicant count → 1; the application shows under the call detail with status `applied`.

| ID | Edge | Expected |
|---|---|---|
| C4a | Startup-X tries to apply **again** to the same call. | Blocked — "already applied" (no duplicate). |
| C4b | As **Startup-Y**, apply (now 2 applicants; cap was 1 in C2d). | Second applicant **blocked** — call is full (max_applicants reached). Raise Max Applicants to 5 and retry → succeeds. |

#### Scenario C5 — Review applications (scoring & status)
As **Investor-A**, open the call detail → Applications list. For Startup-X:
1. Set status → `shortlisted`, add a score (e.g. 4.5) and notes → save.
2. Try each status: `evaluating`, `selected`, `rejected`.

**Expected:** each status + score + notes persists; badge updates; shortlisted count rolls up in the list view.

#### Scenario C6 — Deal Team (collaborators)
On the call detail, find the **Deal Team / Collaborators** panel:
1. Invite **Investor-B** as a co-reviewer (role: editor / reviewer / viewer).
2. Log in as **Investor-B**, accept the invite.

**Expected (key gate check):** an **accepted editor** collaborator can now invite applicants and view/manage the call (not just the owner). A `viewer` should be read-only.

#### Scenario C7 — Reviews panel
On the call detail, use the **Reviews** panel: Investor-A and accepted collaborator each leave a rating/comment.
**Expected:** reviews save and are visible to the team.

#### Scenario C8 — Promote applicant to Deal Pipeline
On the call detail → an application → **Promote**.
**Expected:** a new **Deal Pipeline** entry is created for that startup (jump to Module D to confirm it appears there with stage `sourced`). The promote action returns a confirmation.

#### Scenario C9 — Delete a call
Delete a test call.
**Expected:** call + its applications/invites/collaborators are removed cleanly (cascades); it disappears from both the investor's list and the public marketplace.

---

### Module F — Applicant Invites (invite startups directly)

**Where:** the **Applicant Invites** panel inside a Deal Sourcing call detail (`/dashboard/investor/deal-requests` → open a call). Panel starts **collapsed** — click to expand.

**Invite status values:** `invited`, `accepted`, `declined`, `revoked`.

#### Scenario F1 — Invite a registered startup by user
As **Investor-A** on a call:
1. Expand Applicant Invites → search for **Startup-X** by name in the typeahead → select → (optional message) → Send.

**Expected:** invite created; Startup-X appears in the invite list with status `invited`; Startup-X gets a notification. Already-invited / already-selected users should be filtered out of the typeahead.

#### Scenario F2 — Invite a non-registered person by email (magic link)
1. In the email field, enter **Startup-Z's email** (no OpenI account) → Send.

**Expected:** a "pending email invite" row appears (source = pending email); a magic-link email is sent to that inbox. Open the inbox → the email arrives with a sign-up/accept link.

| ID | Edge | Expected |
|---|---|---|
| F2a | Enter two emails comma-separated, Send. | Both queued. |
| F2b | Press **Remind** on the pending email invite. | A fresh magic-link email is re-sent (Remind only works on pending-email invites, not registered ones). |

#### Scenario F3 — Invitee responds
1. **Registered:** as Startup-X, find the invite → **Accept**. Then as a second test, **Decline** a different invite.
   **Expected:** on Accept, an application is auto-created for that call (Startup-X now appears as an applicant). Status flips to `accepted` / `declined`.
2. **Email magic-link:** open the link as Startup-Z → complete sign-up → verify.
   **Expected:** the pending email invite is "materialized" into a real application/invite tied to the new account.

#### Scenario F4 — Revoke
Revoke a registered invite and a pending-email invite.
**Expected:** both disappear/flip to `revoked`. (Tester note: the app must send the correct `source` — registered vs pending_email — when revoking; if a revoke "does nothing", that's the bug to flag.)

#### Scenario F5 — Permission gate
1. As **Investor-B** who is NOT a collaborator on Investor-A's call, attempt to view/create invites for it (e.g. by URL).
   **Expected:** blocked (403) — only owner / same-org member / accepted editor / admin can manage invites.
2. As the accepted **editor** collaborator from C6, create an invite.
   **Expected:** allowed.

---

### Module D — Deal Pipeline (private deal CRM)

**Where:** sidebar **Deal Pipeline** → `/dashboard/investor/deals`.
*(This module may be gated by a plan feature `can_access_deal_pipeline`. If the investor's plan lacks it, expect an upgrade prompt instead of the pipeline — confirm with the team which plan the test account is on.)*

**Deal stages:** `sourced` → `evaluating` → `loi` → `diligence` → `term_sheet` → `closed` (plus `passed`).

#### Scenario D1 — Create a deal
1. New Deal → either link **Startup-X** (registered) or type a free-text startup name → Title → optional investment type/amount → Save.

**Expected:** deal created at stage `sourced`; **milestones auto-seed** for the sourced stage (e.g. "Initial Screening", "Startup Profile Review").

#### Scenario D2 — Move through stages
Change the deal's status: `sourced` → `evaluating` → `loi` → `diligence` → `term_sheet` → `closed`.
**Expected:** each stage transition **auto-seeds that stage's milestones** (e.g. moving to `diligence` adds Financial Audit / Legal Review / Tech Assessment / IP Verification). Existing data is preserved (partial update — only the changed fields move).

#### Scenario D3 — Edit deal terms
Edit: investment_amount, equity_percentage, valuation, investment_type, currency, term_sheet_url, investment_memo, notes → Save.
**Expected:** all persist; currency respects INR/USD.

#### Scenario D4 — 8-Vector Evaluation
Open the deal → Evaluations → Add. Rate all 8 vectors 1–5: **Market, Team, Tech, Traction, Financials, IP, Scalability, Strategic Fit**; add notes + red flags → Save.
**Expected:** an **overall score** is auto-computed (average of the vectors); evaluation appears in the list with the evaluator's name. Add a second evaluation to confirm multiple are supported.

| ID | Edge | Expected |
|---|---|---|
| D4a | Enter a vector score of 0 or 6. | Clamped/blocked to 1–5. |
| D4b | Add red flags as multiple tags. | All saved. |

#### Scenario D5 — Milestones
List milestones → add a custom one (title, due date) → mark it `completed` → edit → delete.
**Expected:** completed milestone records a completed timestamp; list ordering by sort order; delete removes it.

#### Scenario D6 — Tasks
Add a task (title, assignee name, priority low/medium/high, due date) → set status todo → in_progress → done → delete.
**Expected:** status `done` records completion; priority + assignee persist; delete works.

#### Scenario D7 — List filters
On the deal list: filter by status, search by title/startup name, sort (newest/oldest/amount/recently-updated).
**Expected:** each filter/sort returns the correct subset/order.

#### Scenario D8 — Promoted deal appears
Confirm the deal promoted in **C8** is present here at stage `sourced`.
**Expected:** yes, with the startup's name carried over.

---

### Module E — Portfolio

**Where:** sidebar **Portfolio** → `/dashboard/investor/portfolio`.

**Company status values:** `active`, `exited`, `failed`.

#### Scenario E1 — Add a portfolio company
Add: link Startup-X (or free-text name), entry date, entry valuation, equity stake %, investment amount, board seat (on/off), currency, notes → Save.
**Expected:** company appears as `active`; totals/KPIs update.

| ID | Edge | Expected |
|---|---|---|
| E1a | Equity stake = 150%. | Blocked — cannot exceed 100%. |
| E1b | Investment amount = -5. | Blocked — must be ≥ 0. |
| E1c | Currency = EUR. | Blocked — only INR/USD. |

#### Scenario E2 — Record an exit
Edit the company → status `exited` → exit date, **exit value**, exit type (IPO / Acquisition / Secondary) → Save.
**Expected:** status flips to `exited`; exit value + type persist; portfolio summary reflects the exit. (Schema note for debugging: the columns are `current_status` and `exit_value` — not `status`/`exit_valuation`.)

#### Scenario E3 — Mark a failure
Edit another company → status `failed` → Save.
**Expected:** persists; counted as failed in summary.

---

### Module G — Recommended Startups

**Where:** sidebar **Recommended for You** → `/dashboard/investor/recommended-startups`.

#### Scenario G1 — Relevance
With Investor-A's profile sectors/stage filled (Module B) and Startup-X/Y profiles matching those sectors:
1. Open Recommended for You.

**Expected:** a ranked list of startups whose sectors/stage overlap the investor's focus appears; better-matching startups rank higher. Startups already in the investor's pipeline/portfolio are excluded.

| ID | Edge | Expected |
|---|---|---|
| G1a | Empty profile (no sectors). | Page still loads gracefully (broad or empty list, no crash). |
| G1b | From a recommended card, open the startup profile. | Navigates to that startup's public profile. |

---

### Module H — Marketplace / Discover (shared surfaces)

**Where:** **View Marketplace** → `/dashboard/marketplace`; plus DeepTech, IPR Portfolio, Innovation Map, Find Startups.

| ID | Step | Expected |
|---|---|---|
| H1 | Open Marketplace. | Mixed opportunities feed loads; investor can browse other open calls. |
| H2 | Open DeepTech. | DeepTech reports/listing loads. |
| H3 | Open IPR Portfolio. | IPR list loads (org-filtered). |
| H4 | Find Startups / Innovation Map. | Startup directory / map renders; clicking a node opens a profile. |

---

### Module I — Investor AI (if enabled for the test plan)

**Where:** AI actions inside Deal Sourcing / evaluation surfaces (token-gated; the account needs AI tokens).

| ID | Step | Expected |
|---|---|---|
| I1 | Run **AI Evaluate** on an application/entity. | Returns a structured evaluation; consumes tokens. |
| I2 | Run **AI Advisor**. | Returns advisory output; consumes tokens. |
| I3 | Run **AI Analyze** on a deal request. | Returns analysis; consumes tokens. |
| I4 | With **0 tokens** remaining, retry any AI action. | Blocked with a clear "out of tokens / upgrade" message (not a silent failure). |

*(If the test account has no AI tokens or the feature is off, mark I1–I4 N/A and note it.)*

---

## 6. Pass / fail checklist

| ID | Area | Pass | Fail | Notes |
|---|---|---|---|---|
| B1–B8 | Register & Profile | ☐ | ☐ | |
| C1 | Create/publish call | ☐ | ☐ | |
| C2a–d | Edit & validation | ☐ | ☐ | |
| C3 | Public visibility + self-exclusion | ☐ | ☐ | |
| C4 / C4a / C4b | Startup applies / dup / cap | ☐ | ☐ | |
| C5 | Review & score applications | ☐ | ☐ | |
| C6 | Deal Team collaborators | ☐ | ☐ | |
| C7 | Reviews panel | ☐ | ☐ | |
| C8 | Promote to pipeline | ☐ | ☐ | |
| C9 | Delete call (cascade) | ☐ | ☐ | |
| F1 | Invite registered startup | ☐ | ☐ | |
| F2 / F2a / F2b | Email magic-link invite / remind | ☐ | ☐ | |
| F3 | Invitee accept/decline + materialize | ☐ | ☐ | |
| F4 | Revoke (both sources) | ☐ | ☐ | |
| F5 | Invite permission gate | ☐ | ☐ | |
| D1 | Create deal (auto-seed milestones) | ☐ | ☐ | |
| D2 | Move through stages | ☐ | ☐ | |
| D3 | Edit deal terms | ☐ | ☐ | |
| D4 / D4a / D4b | 8-vector evaluation | ☐ | ☐ | |
| D5 | Milestones CRUD | ☐ | ☐ | |
| D6 | Tasks CRUD | ☐ | ☐ | |
| D7 | List filters/sort | ☐ | ☐ | |
| D8 | Promoted deal present | ☐ | ☐ | |
| E1 / E1a–c | Add portfolio + validation | ☐ | ☐ | |
| E2 | Record exit | ☐ | ☐ | |
| E3 | Mark failed | ☐ | ☐ | |
| G1 / G1a / G1b | Recommendations | ☐ | ☐ | |
| H1–H4 | Marketplace / Discover | ☐ | ☐ | |
| I1–I4 | Investor AI (if enabled) | ☐ | ☐ | |

---

## 7. Debugging notes — rule these out before filing a bug

1. **Stale bundle.** After a deploy, hard-reload (`Cmd/Ctrl+Shift+R`). "Button does nothing" is often an old cached bundle. Check DevTools → Network for whether the request actually fires.
2. **Two different "deal" surfaces.** *My Deal Sourcing* (calls startups apply to) ≠ *Deal Pipeline* (private CRM). Don't expect an applicant to show up in the Pipeline unless they were **Promoted** (C8).
3. **Self-exclusion is intentional.** An investor not seeing their *own* call in the public marketplace is correct behavior, not a bug.
4. **Revoke needs the right source.** Registered invites and pending-email invites are revoked through slightly different paths. If a revoke silently fails, note whether the invite was a registered user or an email invite.
5. **Plan gating.** Deal Pipeline (`can_access_deal_pipeline`) and AI actions (tokens) may be plan-gated. Confirm the test account's plan before calling a gate a bug.
6. **Currency is INR/USD only** everywhere (profile, deals, portfolio). EUR/GBP etc. are correctly rejected.
7. **Schema names (for engineers triaging):** portfolio columns are `current_status` and `exit_value` (NOT `status` / `exit_valuation`); deal-request owner column is `investor_id`; invites live in `entity_application_invites` (registered) + `pending_email_invites` (email).
8. **Email placement.** Magic-link invite emails may land in spam during the domain warm-up period. Check spam; "delivered but in spam" is a placement issue, not a missing email.

---

## 8. Module → backend route reference (for engineers)

| Module | Key endpoints |
|---|---|
| Dashboard | `GET /investor/dashboard` |
| Recommendations | `GET /investor/recommended-startups` |
| Deal Pipeline | `GET/POST /investor/deals`, `GET/PUT /investor/deals/:id` |
| 8-Vector Eval | `POST/GET /investor/deals/:id/evaluations` |
| Milestones | `GET/POST /investor/deals/:id/milestones`, `PUT/DELETE …/:mid` |
| Tasks | `GET/POST /investor/deals/:id/tasks`, `PUT/DELETE …/:tid` |
| Portfolio | `GET/POST /investor/portfolio`, `PUT /investor/portfolio/:id` |
| Deal Sourcing | `POST/GET /investor/deal-requests`, `GET/PUT/DELETE …/:id`, `PUT …/:id/applications/:appId`, `POST …/:id/promote/:appId` |
| Public calls | `GET /public/deal-requests`, `GET /public/deal-requests/:id`, `POST /deal-requests/:id/apply` |
| Applicant Invites | `POST/GET /applicant-invites`, `POST …/:id/remind`, `POST …/:id/respond`, `DELETE …/:id` |
| Investor AI | `POST /investor/ai/evaluate`, `GET /investor/ai/evaluations/:entityId`, `PUT /investor/ai/evaluations/:id`, `POST /investor/ai/advisor`, `POST /investor/ai/analyze/:entityId` |

All `/investor/*` and `/applicant-invites` routes require authentication. Deal Sourcing invite/manage actions additionally require the owner/same-org/accepted-editor/admin gate.

---

*End of guide. Questions on intended behavior → ask the dev team before logging a defect.*
