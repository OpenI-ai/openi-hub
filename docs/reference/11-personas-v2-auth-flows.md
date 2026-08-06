<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 1241-1318 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

