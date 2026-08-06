<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 864-1072 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

