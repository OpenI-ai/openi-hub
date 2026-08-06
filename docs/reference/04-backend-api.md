<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 313-585 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

**Self-serve corporate export** — gated on the `seeker_enterprise` plan's `sso_audit_logs`
feature flag. Scoped to the requesting corporate account only (`req.user.id`), same handler
(`auditExportController.exportAuditLog`) reused across both the dashboard route below and the
Partner API v1 route in § 6.21.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/corporate/audit-log/export` | Bearer (JWT) | Export your own audit log. Query params: `from`, `to`, `action`, `limit`, `offset`, `format` (`json` default or `csv`). |

Dashboard UI: Settings → **Audit Logs** tab (`SettingsAuditLogs.jsx`) — filterable table (date
range, action) with paginated browsing plus one-click Export CSV/JSON buttons (authenticated blob
download, since the endpoint requires a Bearer header).

### 6.22 Bulk Data Export

New self-serve feature (26 Jul 2026) — gated on the `seeker_enterprise` plan's `api_access`
feature flag (same flag as § 6.21's Partner API and the API Keys tab). Scoped to the requesting
corporate account only (`req.user.id`/`corporate_id`), same handler
(`dataExportController.exportData`) reused across both the dashboard route below and the Partner
API v1 route in § 6.21.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/corporate/data-export` | Bearer (JWT) | Bulk export your own data. Query params: `type` (`challenges` \| `applications` \| `collaborations`, required), `from`, `to` (optional date range), `format` (`json` default or `csv`). |

Dashboard UI: Settings → **Data Export** tab (`SettingsDataExport.jsx`) — type selector, optional
date range, and Export JSON/CSV buttons (authenticated blob download).

### 6.21 Partner API (v1) — Enterprise read/write integration

Gated on the `seeker_enterprise` plan's `api_access` feature flag (returns `402 upgrade_required`
if the key owner's plan doesn't include it, e.g. downgraded after the key was issued). Corporate
persona only. Reuses the same `corporateController` logic as the dashboard's JWT-authed
`/api/corporate/challenges` endpoints — a partner API call and the dashboard produce identical
results for the same account.

**Auth flow — self-serve key management (dashboard-facing, JWT-authed):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/partner-api/keys` | Bearer (JWT) | Create a key. Body: `{ "name": "..." }`. Returns the plaintext key **exactly once** — `oi_live_<64-hex-chars>` — it cannot be retrieved again; only `key_prefix` (first 12 chars) is stored for display afterward. |
| GET | `/api/partner-api/keys` | Bearer (JWT) | List your keys (`id`, `name`, `key_prefix`, `scopes`, `is_active`, `last_used_at`, `created_at`). Revoked keys are excluded. |
| DELETE | `/api/partner-api/keys/:id` | Bearer (JWT) | Revoke a key immediately (`is_active = false`). Irreversible — issue a new key if needed again. |

**v1 endpoints — API-key-authed (`Authorization: Bearer oi_live_...`):**

| Method | Endpoint | Scope required | Description |
|--------|----------|-----------------|-------------|
| GET | `/api/v1/partner/challenges` | `challenges:read` | List your challenges |
| POST | `/api/v1/partner/challenges` | `challenges:write` | Create a challenge (also subject to the plan's `challenge_create` usage cap) |
| GET | `/api/v1/partner/challenges/:id` | `challenges:read` | Get one challenge |
| PUT | `/api/v1/partner/challenges/:id` | `challenges:write` | Update a challenge |
| PUT | `/api/v1/partner/challenges/:id/applications/:appId` | `applications:write` | Update an application (e.g. status) under one of your challenges |
| GET | `/api/v1/partner/audit-logs` | `audit_logs:read` | Export your audit log programmatically. Same query params as § 6.20's dashboard export (`from`, `to`, `action`, `limit`, `offset`, `format`). Also requires the `sso_audit_logs` plan flag. |
| GET | `/api/v1/partner/data-export` | `data_export:read` | Bulk-export your challenges/applications/collaborations programmatically. Same query params as § 6.22's dashboard export (`type`, `from`, `to`, `format`). |

Every key is issued six scopes by default (`challenges:read`, `challenges:write`,
`applications:read`, `applications:write`, `audit_logs:read`, `data_export:read`) — there is
currently no self-serve UI to narrow scopes per key; all keys for an account carry the same
access as the dashboard user. `audit_logs:read` and `data_export:read` were added 26 Jul 2026
(Phase 129) and backfilled onto every pre-existing key, so no key needs to be regenerated to gain
these two capabilities.

**Error responses:**

| Status | Body shape | Cause |
|--------|------------|-------|
| 401 | `{ "message": "No API key provided" }` | Missing/malformed `Authorization` header |
| 401 | `{ "message": "Invalid or revoked API key" }` | Key not found, revoked, or `is_active = false` |
| 402 | `{ "error": "upgrade_required", "message": "...", "feature": "api_access", "plan": "..." }` | Key owner's current plan no longer includes `api_access` |
| 403 | `{ "message": "This API key is missing the required scope: <scope>", "required_scope": "<scope>" }` | Key lacks the scope needed for that endpoint |
| 404 | `{ "message": "Challenge not found" }` (or similar) | Resource doesn't exist or isn't owned by this account |

**Known caveat (not a Partner API bug — pre-existing dashboard behavior):** `POST
/api/v1/partner/challenges` accepts a `visibility` field (`public` / `invite_only` / `draft`), not
`is_public`. If `visibility` is omitted or invalid, `syncVisibilityFlags()` silently defaults to
`public` regardless of any `is_public` value sent in the body — `is_public` in the request is a
no-op. Always pass `visibility` explicitly if the challenge should NOT be public. Tracked as a
priority fix in `NEXT_SESSION_TODOS.md` (only affects creation; updates preserve the existing
value unless `visibility` is explicitly and validly passed).

**Not yet built:** SSO itself (SAML/OIDC login) as a client-facing feature — the `sso_audit_logs`
plan flag now also gates the audit-log export feature (§ 6.20), which IS self-serve as of 26 Jul
2026, but the SSO login portion is a separate, larger SSO-protocol-integration effort, tracked
separately in `NEXT_SESSION_TODOS.md`.

---

